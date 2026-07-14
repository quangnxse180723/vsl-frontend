import React, { useState, useEffect, useRef } from 'react';
import { Vocabulary } from '../types';
import { practiceApi } from '../services/api/practiceApi';
import { Camera, CameraOff, Play, ShieldCheck, HelpCircle, RefreshCw, AlertCircle, Sparkles, X } from 'lucide-react';
import type { PoseLandmarker } from '@mediapipe/tasks-vision';

interface AIPracticeViewProps {
  vocabularyList: Vocabulary[];
  initialSelectedSignName?: string;
  onRecordResult: (signName: string, score: number) => void;
}

export default function AIPracticeView({ 
  vocabularyList, 
  initialSelectedSignName,
  onRecordResult
}: AIPracticeViewProps) {
  // Find initial sign
  const initialSign = vocabularyList.find(v => v.name === initialSelectedSignName) || vocabularyList[0];
  const [selectedSign, setSelectedSign] = useState<Vocabulary | undefined>(initialSign);

  // States
  const [useRealCamera, setUseRealCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState<string>('Sẵn sàng hiệu chỉnh');
  const [progressWidth, setProgressWidth] = useState(0);

  // Live Score Metrics - null until a real AI evaluation has run.
  // Chi hien thi so lieu THAT do model tra ve: do chinh xac (confidence),
  // thu hang nhan dien (rank) va ket qua (status). Truoc day co 3 o "hinh tay/
  // huong tay/chuyen dong" nhung model khong cham theo tung chieu -> da bo.
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [evalRank, setEvalRank] = useState<number | null>(null);
  const [evalStatus, setEvalStatus] = useState<'CORRECT' | 'ALMOST_CORRECT' | 'INCORRECT' | null>(null);

  // Result overlay stays on screen after evaluation completes (success or failure)
  // until the user starts a new scan - previously it vanished the instant progressWidth hit 100.
  const [resultVisible, setResultVisible] = useState(false);
  const [lastAttemptFailed, setLastAttemptFailed] = useState(false);

  // Reference sample video lightbox - opens a large centered player when the
  // reference thumbnail is clicked, instead of just showing a static image.
  const [showReferenceVideo, setShowReferenceVideo] = useState(false);

  // Pose-tracking reframe - detects the whole upper body + arms + hands each
  // frame and redraws a CENTERED SQUARE crop of just the signing region onto
  // the output canvas. This is tuned to the backend AI model (MViTv2 video
  // classifier): that model resizes each frame's short side to 224 and then
  // CENTER-CROPS a 224x224 square. By recording an already-square, signer-
  // centered clip, the whole gesture (arm included, not just the hand) survives
  // that center-crop at a consistent scale that matches the model's training
  // framing - which is what actually raises recognition accuracy. Whole arm,
  // not a tight hand zoom, because sign language uses the full arm.
  // 'unsupported' = detection loaded but is too slow on this device to run live
  // (see slow-frame detection in the render loop); distinct from 'error' (the
  // model itself failed to load).
  const [poseTrackStatus, setPoseTrackStatus] = useState<'loading' | 'ready' | 'error' | 'unsupported'>('loading');

  // Set whenever the render loop hasn't produced a successful frame in a while -
  // driven by a "time since last success" watchdog rather than only catching
  // thrown errors, since a device-specific issue can make every frame silently
  // no-op without ever throwing.
  const [poseTrackRuntimeIssue, setPoseTrackRuntimeIssue] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const guideBoxRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const detectorRef = useRef<PoseLandmarker | null>(null);
  const poseLoopRef = useRef<number | null>(null);
  const lastPoseFrameAtRef = useRef(0);
  const lastPoseSuccessAtRef = useRef(0);
  // detectForVideo requires strictly-increasing timestamps; guard against two
  // frames landing on the same performance.now() value.
  const lastDetectTimestampRef = useRef(0);
  // Smoothed square crop box (in full-res video pixel coords), carried across
  // frames so the crop doesn't jitter with small keypoint fluctuations, and so
  // a brief missed detection doesn't instantly snap back to full frame.
  const smoothedCropRef = useRef<{ cx: number; cy: number; side: number } | null>(null);
  const framesSincePoseSeenRef = useRef(0);

  // Update selected sign when prop changes
  useEffect(() => {
    if (initialSelectedSignName) {
      const found = vocabularyList.find(v => v.name === initialSelectedSignName);
      if (found) setSelectedSign(found);
    }
  }, [initialSelectedSignName, vocabularyList]);

  // Handle Real Camera stream toggle
  useEffect(() => {
    if (useRealCamera) {
      // Ideal 16:9 HD request instead of a cropped 640x480 (4:3): most webcams apply
      // a tighter digital crop at low requested resolutions, which was making the
      // frame feel too zoomed-in. This - plus the user standing further back - is
      // what actually fits half a body in frame; there's no software "zoom out"
      // beyond what the camera sensor captures.
      navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
        .then(stream => {
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.log('Video play interrupted', e));
          }
        })
        .catch(err => {
          console.error("Camera access failed:", err);
          alert("Không thể truy cập camera. Vui lòng cấp quyền camera để quay video luyện tập.");
          setUseRealCamera(false);
        });
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [useRealCamera]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  // Load the pose landmark model once, lazily (dynamic import keeps the WASM
  // runtime out of the main bundle until someone actually opens this practice
  // page). Uses MediaPipe Tasks Vision (@mediapipe/tasks-vision) PoseLandmarker
  // with the CPU delegate - i.e. detection runs purely in WebAssembly on the
  // CPU, not via WebGL/GPU. Deliberate: this machine's weak integrated GPU was
  // the problem that killed earlier WebGL-based features, and CPU/WASM is what
  // the user asked for.
  //
  // Pose (not Hand) because sign language uses the whole arm - we need the
  // shoulder/elbow/wrist joints, not just the 21 hand points, to frame the
  // full signing region.
  //
  // Both the WASM binaries and the model file are self-hosted under
  // public/models/mediapipe_hands/ rather than fetched from a CDN, so this
  // doesn't depend on reaching an external host at runtime. (An earlier attempt
  // using @tensorflow-models/hand-pose-detection failed precisely because its
  // default model URLs point at TF Hub, which has migrated to Kaggle and no
  // longer serves those files.) tasks-vision is also a clean ES module, so it
  // avoids the Vite/UMD bundling breakage that the older @mediapipe/* script-tag
  // packages hit.
  useEffect(() => {
    let cancelled = false;
    // A hung fetch/WASM-init (as opposed to a rejected promise) would otherwise
    // leave poseTrackStatus stuck at 'loading' forever with no error to catch.
    const LOAD_TIMEOUT_MS = 20000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Tải mô hình nhận diện tư thế quá thời gian chờ')), LOAD_TIMEOUT_MS);
    });

    (async () => {
      await Promise.race([
        (async () => {
          const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
          // Note: the self-hosted assets live under .../mediapipe_hands/ for
          // historical reasons (the dir was created for an earlier hand model);
          // it now holds the pose model + shared WASM. Kept as-is to avoid a
          // locked-directory rename; the path is what matters, not the name.
          const vision = await FilesetResolver.forVisionTasks('/models/mediapipe_hands/wasm');
          const detector = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: '/models/mediapipe_hands/pose_landmarker_lite.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numPoses: 1,
          });
          if (cancelled) {
            detector.close();
            return;
          }
          detectorRef.current = detector;
          setPoseTrackStatus('ready');
        })(),
        timeoutPromise,
      ]);
    })().catch(e => {
      console.error('Failed to load pose-tracking model:', e);
      if (!cancelled) setPoseTrackStatus('error');
    });

    return () => {
      cancelled = true;
      detectorRef.current?.close();
      detectorRef.current = null;
    };
  }, []);

  // Each frame: detect the signer's pose, compute a CENTERED SQUARE crop that
  // contains the whole signing region (head + shoulders + arms + hands), and
  // draw that square onto the output canvas. The MediaRecorder below captures
  // this canvas, so the clip uploaded to the backend is already a signer-
  // centered square. That is tuned to the backend model's preprocessing
  // (short-side resize to 224 + center-crop 224x224): a square, centered input
  // means the whole gesture survives the crop at a consistent scale, which is
  // what raises recognition accuracy.
  //
  // The canvas is drawn UN-MIRRORED (true left/right orientation) because the
  // recorded pixels go to the model and sign handedness matters. The on-screen
  // preview is mirrored separately via a CSS transform on the canvas element,
  // which does NOT affect the captured pixels.
  //
  // Throttled to ~15fps: detection is the expensive part, so this caps CPU load
  // instead of re-running inference every animation frame.
  useEffect(() => {
    if (!useRealCamera || poseTrackStatus !== 'ready') return;
    let active = true;
    let errorLogged = false;
    let slowFrameStreak = 0;
    const TARGET_FRAME_INTERVAL_MS = 66;
    const WATCHDOG_TIMEOUT_MS = 4000;
    const WATCHDOG_CHECK_INTERVAL_MS = 1000;
    // A weak CPU can take a long time per detection. Looping that forever pegs
    // the CPU continuously for no benefit, since a frame that slow will never
    // feel "live" anyway - detect a sustained slow streak and give up.
    const SLOW_FRAME_THRESHOLD_MS = 1200;
    const SLOW_FRAME_STREAK_TO_GIVE_UP = 3;
    // Frames without a confident pose before the crop resets to full-frame -
    // avoids snapping the instant the person briefly leaves frame or a single
    // detection is missed.
    const FRAMES_TO_LOSE_LOCK = 12;
    // Exponential-smoothing factor for the crop box - lower = smoother/slower,
    // higher = snappier but more jittery.
    const CROP_SMOOTHING = 0.2;
    // Padding around the raw landmark bounding box, as a fraction of the box's
    // larger side - keeps the arms/hands from touching the crop edges.
    const CROP_PADDING = 0.25;
    // Pose landmark indices that bound the signing region: nose (head), both
    // shoulders, elbows, wrists, and the hand tips (pinky/index/thumb).
    const SIGNING_LANDMARKS = [0, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    const MIN_VISIBILITY = 0.3;
    lastPoseSuccessAtRef.current = performance.now();
    smoothedCropRef.current = null;
    framesSincePoseSeenRef.current = 0;

    const watchdogId = window.setInterval(() => {
      if (performance.now() - lastPoseSuccessAtRef.current > WATCHDOG_TIMEOUT_MS) {
        setPoseTrackRuntimeIssue(true);
      }
    }, WATCHDOG_CHECK_INTERVAL_MS);

    const giveUp = () => {
      active = false;
      window.clearInterval(watchdogId);
      setPoseTrackStatus('unsupported');
    };

    const renderFrame = (now: number) => {
      if (!active) return;

      if (now - lastPoseFrameAtRef.current < TARGET_FRAME_INTERVAL_MS) {
        poseLoopRef.current = requestAnimationFrame(renderFrame);
        return;
      }
      lastPoseFrameAtRef.current = now;

      const video = videoRef.current;
      const canvas = outputCanvasRef.current;
      const detector = detectorRef.current;

      if (video && canvas && detector && video.readyState >= 2 && video.videoWidth > 0) {
        const vw = video.videoWidth, vh = video.videoHeight;
        // Output a SQUARE canvas (side = the frame's shorter dimension) so the
        // recorded clip is already square - matches the backend's center-crop.
        const outSide = Math.min(vw, vh);
        if (canvas.width !== outSide || canvas.height !== outSide) {
          canvas.width = outSide;
          canvas.height = outSide;
        }

        // detectForVideo needs strictly-increasing timestamps (ms).
        let ts = Math.round(now);
        if (ts <= lastDetectTimestampRef.current) ts = lastDetectTimestampRef.current + 1;
        lastDetectTimestampRef.current = ts;

        const frameStart = performance.now();
        try {
          // Synchronous inference - MediaPipe Tasks resizes the video to its
          // model input internally, so we hand it the raw video element.
          const result = detector.detectForVideo(video, ts);
          const duration = performance.now() - frameStart;

          const ctx = canvas.getContext('2d')!;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const pose = result.landmarks && result.landmarks[0];
          const pts = pose
            ? SIGNING_LANDMARKS
                .map(i => pose[i])
                .filter(p => p && (p.visibility === undefined || p.visibility >= MIN_VISIBILITY))
            : [];

          if (pts.length >= 3) {
            framesSincePoseSeenRef.current = 0;
            // Landmarks are normalized (0..1); scale to full video pixels.
            const xs = pts.map(p => p.x * vw);
            const ys = pts.map(p => p.y * vh);
            const minX = Math.min(...xs), maxX = Math.max(...xs);
            const minY = Math.min(...ys), maxY = Math.max(...ys);
            const boxW = maxX - minX, boxH = maxY - minY;
            const cx = minX + boxW / 2, cy = minY + boxH / 2;
            // Square side = larger bbox dimension + padding, capped to the frame.
            const side = Math.min(Math.max(boxW, boxH) * (1 + 2 * CROP_PADDING), outSide);

            const target = { cx, cy, side };
            const prev = smoothedCropRef.current;
            smoothedCropRef.current = prev ? {
              cx: prev.cx + (target.cx - prev.cx) * CROP_SMOOTHING,
              cy: prev.cy + (target.cy - prev.cy) * CROP_SMOOTHING,
              side: prev.side + (target.side - prev.side) * CROP_SMOOTHING,
            } : target;
          } else {
            framesSincePoseSeenRef.current++;
            if (framesSincePoseSeenRef.current > FRAMES_TO_LOSE_LOCK) {
              smoothedCropRef.current = null;
            }
          }

          // Resolve the source square to copy from the video (clamped inside frame).
          const crop = smoothedCropRef.current;
          let sx: number, sy: number, sSide: number;
          if (crop) {
            sSide = Math.min(crop.side, outSide);
            sx = Math.max(0, Math.min(vw - sSide, crop.cx - sSide / 2));
            sy = Math.max(0, Math.min(vh - sSide, crop.cy - sSide / 2));
          } else {
            // Fallback: centered square of the full frame.
            sSide = outSide;
            sx = (vw - sSide) / 2;
            sy = (vh - sSide) / 2;
          }
          // Draw un-mirrored (true orientation). Preview mirroring is CSS-only.
          ctx.drawImage(video, sx, sy, sSide, sSide, 0, 0, canvas.width, canvas.height);

          // Position the on-screen guide box over the NATURAL (mirrored) camera preview
          // so the user sees exactly the square region that gets recorded + scored,
          // without the preview itself being cropped/zoomed. X is mirrored because the
          // preview <video> is flipped via scaleX(-1). Assumes a 16:9 feed filling the
          // 16:9 panel (object-cover, no crop) so video pixels map 1:1 to panel %.
          const guide = guideBoxRef.current;
          if (guide) {
            guide.style.left = `${(1 - (sx + sSide) / vw) * 100}%`;
            guide.style.top = `${(sy / vh) * 100}%`;
            guide.style.width = `${(sSide / vw) * 100}%`;
            guide.style.height = `${(sSide / vh) * 100}%`;
            guide.style.opacity = '1';
          }

          if (duration > SLOW_FRAME_THRESHOLD_MS) {
            slowFrameStreak++;
            if (slowFrameStreak >= SLOW_FRAME_STREAK_TO_GIVE_UP) {
              giveUp();
              return;
            }
          } else {
            slowFrameStreak = 0;
            lastPoseSuccessAtRef.current = performance.now();
            setPoseTrackRuntimeIssue(false);
          }
        } catch (e) {
          if (!errorLogged) {
            errorLogged = true;
            console.error('Pose-tracking frame failed:', e);
          }
        }
      }
      if (active) poseLoopRef.current = requestAnimationFrame(renderFrame);
    };

    poseLoopRef.current = requestAnimationFrame(renderFrame);
    return () => {
      active = false;
      if (poseLoopRef.current) cancelAnimationFrame(poseLoopRef.current);
      window.clearInterval(watchdogId);
      setPoseTrackRuntimeIssue(false);
    };
  }, [useRealCamera, poseTrackStatus]);

  // Draws only the contextual text hint over the camera preview. The old rectangular
  // "recording bounds" border + corner accents were removed - the live AI focus guide
  // box now shows the actual capture region, so the static rectangle was redundant.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#767586';
    ctx.font = '14px inherit';
    ctx.textAlign = 'center';
    if (isRecording) {
      ctx.fillText('Đang quay - giữ bàn tay trong khung hình', w / 2, h / 2);
    } else if (!useRealCamera) {
      ctx.fillText('Bật camera để bắt đầu quay video luyện tập.', w / 2, h / 2);
    } else if (overallScore === null) {
      ctx.fillText('Nhấn "Hiệu Chỉnh & Quét" để quay video chấm điểm AI.', w / 2, h / 2);
    }
  }, [isRecording, useRealCamera, overallScore]);

  // Records a real clip from the webcam and sends it to the backend AI model for scoring.
  // Xoa ket qua & dua UI ve trang thai san sang de luyen lai (khong can F5).
  const resetForRetry = () => {
    setResultVisible(false);
    setLastAttemptFailed(false);
    setOverallScore(null);
    setEvalRank(null);
    setEvalStatus(null);
    setProgressWidth(0);
    setCalibrationStep('Sẵn sàng hiệu chỉnh');
  };

  const handleScanAndEvaluate = () => {
    if (isDetecting || isRecording) return;

    if (!useRealCamera || !cameraStream) {
      setCalibrationStep('Hãy bật camera trước để quay video luyện tập.');
      return;
    }

    if (selectedSign.expectedId !== undefined) {
      setResultVisible(false);
      setIsRecording(true);
      setCalibrationStep('Đang quay cử chỉ của bạn (5s)...');
      setProgressWidth(20);
      
      // Capture the pose-reframed (centered square) canvas stream if ready,
      // otherwise fall back to the raw camera stream.
      const streamToRecord = (poseTrackStatus === 'ready' && outputCanvasRef.current)
        ? (outputCanvasRef.current as any).captureStream(30)
        : cameraStream;

      const mediaRecorder = new MediaRecorder(streamToRecord, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsDetecting(true);
        setCalibrationStep('Đang tải lên và chấm điểm video...');
        setProgressWidth(60);

        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const file = new File([blob], "practice.webm", { type: 'video/webm' });

        try {
          const res = await practiceApi.evaluate(file, selectedSign.expectedId);
          const evaluation = res.data;

          setOverallScore(Math.round(evaluation.confidence));
          setEvalRank(evaluation.rank);
          setEvalStatus(evaluation.status);

          setCalibrationStep(evaluation.message || 'Đánh giá hoàn tất!');
          setProgressWidth(100);
          setLastAttemptFailed(false);
          setResultVisible(true);
          onRecordResult(selectedSign.name, Math.round(evaluation.confidence));
        } catch (error: any) {
          if (error?.code === 'ECONNABORTED') {
            setCalibrationStep('Mô hình AI phản hồi quá lâu (có thể do backend vừa khởi động lại). Vui lòng thử lại.');
          } else if (!error?.response) {
            setCalibrationStep('Không thể kết nối đến máy chủ. Kiểm tra kết nối mạng và thử lại.');
          } else {
            setCalibrationStep('Đánh giá thất bại. Vui lòng thử lại.');
          }
          setProgressWidth(100);
          setLastAttemptFailed(true);
          setResultVisible(true);
        } finally {
          setIsDetecting(false);
        }
      };

      mediaRecorder.start();

      let timeLeft = 5;
      const interval = setInterval(() => {
        timeLeft -= 1;
        setCalibrationStep(`Đang quay... còn ${timeLeft}s`);
        setProgressWidth(20 + (5 - timeLeft) * 8);
        if (timeLeft <= 0) clearInterval(interval);
      }, 1000);

      setTimeout(() => {
        mediaRecorder.stop();
      }, 5000);

      return;
    }

    setCalibrationStep('Từ vựng này chưa được cấu hình expectedId nên chưa thể đánh giá.');
  };

  // Nothing to practice yet (no vocabulary loaded from the backend) - render an
  // empty state instead of crashing on selectedSign.* below.
  if (!selectedSign) {
    return (
      <div className="space-y-6 animate-fade-in text-on-surface">
        <header>
          <h2 className="font-display text-3xl font-extrabold text-gradient-brand">Phòng Luyện Tập AI</h2>
          <p className="text-body-md text-on-surface-variant">Kiểm tra tư thế tay của bạn với phản hồi theo thời gian thực bằng camera.</p>
        </header>
        <div className="py-16 text-center text-outline bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/60">
          <span className="material-symbols-outlined text-4xl mb-2">videocam_off</span>
          <p className="font-semibold text-lg text-on-surface-variant mb-1">Chưa có từ vựng nào để luyện tập</p>
          <p className="text-sm">Quản trị viên cần thêm từ vựng kèm video mẫu trước.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-on-surface">
      <header>
        <h2 className="font-display text-3xl font-extrabold text-gradient-brand">Phòng Luyện Tập AI</h2>
        <p className="text-body-md text-on-surface-variant">Quay một video luyện tập bằng camera và để mô hình AI chấm điểm.</p>
      </header>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        
        {/* Left Column: Live Grid & Sub-metrics (8/12 wide) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Feed Canvas Panel */}
          <div className="bg-neutral-900 rounded-2xl relative w-full overflow-hidden aspect-video elevation-2 border border-outline-variant/30 text-white">
            
            {/* The Raw Camera Video Tag - mirrored (scaleX(-1)) so it feels like looking in a
                mirror. This is now the ALWAYS-VISIBLE natural preview: the user sees the full,
                un-zoomed camera (no jarring centered-square crop). The reframing still happens
                for the recorded clip on the hidden output canvas below. */}
            {useRealCamera && (
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
                playsInline
                muted
              />
            )}

            {/* Pose-reframed output canvas - the RECORD SOURCE only, kept visually hidden
                (opacity-0) so the preview stays natural. Each frame it redraws a centered
                square cropped to the signing region (whole arm + hands) in UN-MIRRORED
                pixels; captureStream() reads this canvas at record time, so hiding it does
                not affect what gets recorded or scored. */}
            {useRealCamera && (
              <canvas
                ref={outputCanvasRef}
                className="absolute inset-0 w-full h-full object-contain opacity-0 pointer-events-none"
                style={{ transform: 'scaleX(-1)' }}
              />
            )}

            {/* Live AI focus guide - a box over the natural preview marking the exact square
                region that gets recorded + scored, with a spotlight dim on everything outside
                it (the huge box-shadow is clipped to the panel by overflow-hidden). Positioned
                each frame from the pose crop; hidden until pose-tracking is actually working. */}
            {useRealCamera && poseTrackStatus === 'ready' && !poseTrackRuntimeIssue && (
              <div
                ref={guideBoxRef}
                className="absolute z-[15] pointer-events-none rounded-lg border-2 border-primary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] transition-opacity duration-200"
                style={{ left: '25%', top: '0%', width: '50%', height: '100%', opacity: 0 }}
              >
                <span className="absolute top-1 left-1 text-[9px] font-bold text-white bg-primary/80 px-1.5 py-0.5 rounded uppercase tracking-wide">
                  Vùng AI chấm điểm
                </span>
              </div>
            )}

            {/* Recording frame overlay (decorative bounding box, not real-time tracking) */}
            <canvas
              ref={canvasRef}
              width={640}
              height={360}
              className="absolute inset-0 w-full h-full z-10 pointer-events-none"
            />

            {/* Status indicators */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
              {useRealCamera && (
                <span className="px-3 py-1 bg-green-600/90 backdrop-blur-md text-white text-[10px] font-bold rounded-lg flex items-center gap-1.5 uppercase letter-spacing">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  Camera Đang Bật
                </span>
              )}
              <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-semibold rounded-lg font-mono">
                {useRealCamera ? 'Đang Có Hình' : 'Chưa Bật Camera'}
              </span>
              {useRealCamera && poseTrackStatus !== 'ready' && (
                <span className={`px-3 py-1 backdrop-blur-md text-[10px] font-semibold rounded-lg flex items-center gap-1.5 ${
                  poseTrackStatus === 'loading' ? 'bg-black/60 text-white/90' : 'bg-amber-500/80 text-white'
                }`}>
                  {poseTrackStatus === 'loading' && (
                    <>
                      <span className="w-2.5 h-2.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      Đang tải nhận diện tư thế...
                    </>
                  )}
                  {poseTrackStatus === 'error' && 'Không tải được nhận diện tư thế'}
                  {poseTrackStatus === 'unsupported' && 'Máy này không đủ mạnh để nhận diện tư thế'}
                </span>
              )}
              {useRealCamera && poseTrackStatus === 'ready' && poseTrackRuntimeIssue && (
                <span className="px-3 py-1 bg-amber-500/80 backdrop-blur-md text-white text-[10px] font-semibold rounded-lg flex items-center gap-1.5">
                  Không thể nhận diện tư thế trên máy này - đang dùng hình gốc
                </span>
              )}
            </div>

            {/* Recording indicator - deliberately lightweight (no dark backdrop) so the camera
                feed stays fully visible and the user can see their own hand movement while recording. */}
            {isRecording && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 bg-black/55 backdrop-blur-md rounded-full shadow-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white text-xs font-bold">{calibrationStep}</span>
              </div>
            )}

            {/* Evaluating Overlay - the clip has already been captured at this point, so
                there is no live feed left to preserve; the dark backdrop is fine here. */}
            {isDetecting && !isRecording && (
              <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
                <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
                <h4 className="font-headline-md text-lg text-white font-bold">{calibrationStep}</h4>
                <p className="text-white/60 text-xs mt-1.5 max-w-xs">Đã gửi tới mô hình AI, đang chờ kết quả...</p>
                <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden mt-6">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressWidth}%` }}></div>
                </div>
              </div>
            )}

            {/* Result Overlay - stays visible until the next scan starts, does not auto-hide */}
            {!isRecording && !isDetecting && resultVisible && (
              <div className="absolute inset-0 bg-neutral-950/75 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
                {lastAttemptFailed ? (
                  <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                ) : (
                  <div className="relative w-20 h-20 flex items-center justify-center mb-3">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-white/20" strokeDasharray="100, 100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-primary" strokeDasharray={`${overallScore ?? 0}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <span className="absolute text-xl font-display font-extrabold text-white">{overallScore}%</span>
                  </div>
                )}
                <h4 className="font-headline-md text-lg text-white font-bold">{calibrationStep}</h4>
                <button
                  onClick={resetForRetry}
                  className="mt-5 px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-lg hover:bg-primary/90 active-scale transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Thử lại
                </button>
                <p className="text-white/50 text-[11px] mt-3 max-w-xs">Bấm "Thử lại" để luyện lại ký hiệu này (không cần tải lại trang).</p>
              </div>
            )}
          </div>

          {/* Camera & Recording Controls - placed directly under the feed so both actions are one glance away */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setUseRealCamera(!useRealCamera)}
              className={`px-5 py-3.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                useRealCamera
                  ? 'bg-[#ba1a1a]/10 text-[#ba1a1a] border-[#ba1a1a]/30'
                  : 'bg-surface-container-lowest text-on-surface border-outline-variant/50 hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {useRealCamera ? 'videocam_off' : 'videocam'}
              </span>
              {useRealCamera ? 'Tắt Camera' : 'Bật Camera'}
            </button>

            <button
              onClick={handleScanAndEvaluate}
              disabled={isDetecting || isRecording}
              className="flex-1 active-scale py-3.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-2 disabled:bg-primary/50"
            >
              <span className="material-symbols-outlined text-lg">filter_center_focus</span>
              {isRecording ? 'Đang quay...' : isDetecting ? 'Đang phân tích tọa độ...' : 'Hiệu Chỉnh & Quét'}
            </button>
          </div>

          {/* Explicit, always-visible pose-tracking status line - the small corner
              badge above is easy to miss, so this spells out the same state in plain
              text right under the controls the user is already looking at. */}
          {useRealCamera && (
            <p className={`text-xs font-semibold flex items-center gap-1.5 ${
              poseTrackStatus === 'ready' && !poseTrackRuntimeIssue ? 'text-green-700' : 'text-amber-600'
            }`}>
              <span className="material-symbols-outlined text-sm">
                {poseTrackStatus === 'ready' && !poseTrackRuntimeIssue ? 'accessibility_new' : 'pan_tool_alert'}
              </span>
              {poseTrackStatus === 'loading' && 'Khung hình: đang tải mô hình nhận diện tư thế...'}
              {poseTrackStatus === 'error' && 'Khung hình: không tải được mô hình - đang dùng hình gốc.'}
              {poseTrackStatus === 'unsupported' && 'Khung hình: máy này không đủ mạnh - đã tắt, dùng hình gốc.'}
              {poseTrackStatus === 'ready' && poseTrackRuntimeIssue && 'Khung hình: nhận diện không hoạt động - đang dùng hình gốc.'}
              {poseTrackStatus === 'ready' && !poseTrackRuntimeIssue && 'Khung hình: tự động căn vào tay + cánh tay để AI chấm chính xác hơn.'}
            </p>
          )}

          {/* Diagnostics Grid - so lieu THAT do model tra ve */}
          {(() => {
            const waiting = 'bg-slate-100 text-slate-500';
            const scoreCls = overallScore == null ? waiting
              : overallScore >= 75 ? 'bg-green-100 text-green-700'
              : overallScore >= 50 ? 'bg-amber-100 text-amber-700'
              : 'bg-red-100 text-red-700';
            const rankCls = evalRank == null ? waiting
              : evalRank === 1 ? 'bg-green-100 text-green-700'
              : evalRank <= 3 ? 'bg-amber-100 text-amber-700'
              : 'bg-red-100 text-red-700';
            const statusLabel = evalStatus === 'CORRECT' ? 'Đúng'
              : evalStatus === 'ALMOST_CORRECT' ? 'Gần đúng'
              : evalStatus === 'INCORRECT' ? 'Chưa đúng'
              : 'Chờ đánh giá';
            const statusCls = evalStatus === 'CORRECT' ? 'bg-green-100 text-green-700'
              : evalStatus === 'ALMOST_CORRECT' ? 'bg-amber-100 text-amber-700'
              : evalStatus === 'INCORRECT' ? 'bg-red-100 text-red-700'
              : waiting;
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Do chinh xac (confidence) */}
                <div className="p-4 rounded-xl border border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest shadow-sm">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-outline">Độ chính xác</p>
                    <p className="text-sm font-bold text-on-surface">Mức khớp ký hiệu</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${scoreCls}`}>
                    {overallScore != null ? `${overallScore}%` : 'Chờ đánh giá'}
                  </span>
                </div>

                {/* Thu hang nhan dien (rank) */}
                <div className="p-4 rounded-xl border border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest shadow-sm">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-outline">Thứ hạng nhận diện</p>
                    <p className="text-sm font-bold text-on-surface">Vị trí trong dự đoán</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${rankCls}`}>
                    {evalRank != null ? `#${evalRank}` : 'Chờ đánh giá'}
                  </span>
                </div>

                {/* Ket qua (status) */}
                <div className="p-4 rounded-xl border border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest shadow-sm">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-outline">Kết quả</p>
                    <p className="text-sm font-bold text-on-surface">Đối chiếu ký hiệu</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusCls}`}>{statusLabel}</span>
                </div>
              </div>
            );
          })()}

          {/* Interactive Guidelines Feedback prompt */}
          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl shrink-0 mt-0.5">feedback</span>
            <div className="space-y-1">
              <h5 className="font-label-bold text-xs text-on-surface">Gợi Ý Từ AI Coach</h5>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {overallScore === null
                  ? "Bật camera và nhấn \"Hiệu Chỉnh & Quét\" để nhận phản hồi AI theo thời gian thực."
                  : overallScore < 90
                    ? "Nghiêng lòng bàn tay sang trái một chút. Mạng nơ-ron cần độ tương phản ánh sáng tốt hơn ở khớp ngón trỏ."
                    : "Tư thế xuất sắc! Các ngón tay đang duỗi phẳng, lòng bàn tay hướng ra ngoài, khớp chính xác với cấu hình ký hiệu chuẩn."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Reference guidelines & configuration (4/12 wide) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Practice selection header */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-5">
            <header className="space-y-1">
              <h3 className="font-display text-lg font-bold text-gradient-brand">Video Mẫu Tham Khảo</h3>
              <p className="text-xs text-on-surface-variant">Chọn từ vựng ký hiệu bạn muốn hiệu chỉnh.</p>
            </header>

            {/* Sign selection list dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-outline">Ký Hiệu Từ Vựng</label>
              <select 
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm text-on-surface font-medium outline-none focus:border-primary"
                value={selectedSign.name}
                onChange={(e) => {
                  const s = vocabularyList.find(v => v.name === e.target.value);
                  if (s) {
                    setSelectedSign(s);
                    setOverallScore(null);
                    setEvalRank(null);
                    setEvalStatus(null);
                    setResultVisible(false);
                    setShowReferenceVideo(false);
                  }
                }}
              >
                {vocabularyList.map(v => (
                  <option key={v.id} value={v.name}>{v.category}: {v.name}</option>
                ))}
              </select>
            </div>

            {/* Sign reference illustration preview - clickable to open the full sample video */}
            <div className="space-y-3">
              <div
                onClick={() => selectedSign.videoUrl && setShowReferenceVideo(true)}
                className={`h-44 rounded-xl overflow-hidden bg-surface-variant relative border border-outline-variant/30 group/thumb ${selectedSign.videoUrl ? 'cursor-pointer' : ''}`}
              >
                <img className="w-full h-full object-cover" src={selectedSign.image} alt={selectedSign.name} />
                {selectedSign.videoUrl && (
                  <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 text-primary ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] rounded-lg">
                  Mẫu chuẩn
                </div>
              </div>
              <div>
                <h4 className="font-label-bold text-on-surface text-sm">{selectedSign.name}</h4>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">{selectedSign.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reference Sample Video Lightbox - large centered player with a close (X) button */}
      {showReferenceVideo && selectedSign.videoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setShowReferenceVideo(false)}
        >
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowReferenceVideo(false)}
              className="absolute -top-12 right-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="rounded-2xl overflow-hidden bg-black elevation-2 aspect-video">
              <video
                className="w-full h-full object-contain"
                src={selectedSign.videoUrl}
                poster={selectedSign.image}
                controls
                autoPlay
                loop
              />
            </div>
            <p className="text-white/80 text-sm font-semibold mt-3 text-center">{selectedSign.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
