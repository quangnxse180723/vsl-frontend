import React, { useState, useEffect, useRef } from 'react';
import { Vocabulary } from '../types';
import { practiceApi } from '../services/api/practiceApi';
import { Camera, CameraOff, Play, ShieldCheck, HelpCircle, RefreshCw, AlertCircle, Sparkles, X } from 'lucide-react';
import type * as BodySegmentationModule from '@tensorflow-models/body-segmentation';
import type { BodySegmenter } from '@tensorflow-models/body-segmentation';

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

  // Live Score Metrics - null until a real AI evaluation has run
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [handShapeGrade, setHandShapeGrade] = useState<'Xuất sắc' | 'Tốt' | 'Tạm được' | 'Cần chỉnh tư thế' | null>(null);
  const [orientationGrade, setOrientationGrade] = useState<'Xuất sắc' | 'Tốt' | 'Tạm được' | 'Cần chỉnh tư thế' | null>(null);
  const [motionGrade, setMotionGrade] = useState<'Xuất sắc' | 'Tốt' | 'Tạm được' | 'Cần chỉnh tư thế' | null>(null);

  // Result overlay stays on screen after evaluation completes (success or failure)
  // until the user starts a new scan - previously it vanished the instant progressWidth hit 100.
  const [resultVisible, setResultVisible] = useState(false);
  const [lastAttemptFailed, setLastAttemptFailed] = useState(false);

  // Reference sample video lightbox - opens a large centered player when the
  // reference thumbnail is clicked, instead of just showing a static image.
  const [showReferenceVideo, setShowReferenceVideo] = useState(false);

  // Background blur preview - now used to provide a cleaner video feed to the AI.
  // The blurred canvas is captured and sent to the MediaRecorder, reducing background
  // noise and helping the AI focus purely on hand and body postures.
  const [blurStatus, setBlurStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const animationRef = useRef<number | null>(null);
  const segmenterRef = useRef<BodySegmenter | null>(null);
  const bodySegmentationModuleRef = useRef<typeof BodySegmentationModule | null>(null);
  const blurLoopRef = useRef<number | null>(null);
  const lastBlurFrameAtRef = useRef(0);

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

  // Load the person-segmentation model once, lazily (dynamic import keeps tfjs
  // out of the main bundle until someone actually opens this practice page).
  // Model files are self-hosted under public/models/selfie_segmentation instead
  // of the library's default (https://tfhub.dev/...) so blur doesn't silently
  // fail to load on a slow/restricted network - it was previously depending on
  // reaching Google's TF Hub at runtime with no visible error if that failed.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [tf, , bodySegmentation] = await Promise.all([
        import('@tensorflow/tfjs-core'),
        import('@tensorflow/tfjs-backend-webgl'),
        import('@tensorflow-models/body-segmentation'),
      ]);
      await tf.ready();
      const segmenter = await bodySegmentation.createSegmenter(
        bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
        { runtime: 'tfjs', modelType: 'general', modelUrl: '/models/selfie_segmentation/model.json' }
      );
      if (cancelled) {
        segmenter.dispose();
        return;
      }
      segmenterRef.current = segmenter;
      bodySegmentationModuleRef.current = bodySegmentation;
      setBlurStatus('ready');
    })().catch(e => {
      console.error('Failed to load background-blur model:', e);
      if (!cancelled) setBlurStatus('error');
    });

    return () => {
      cancelled = true;
      segmenterRef.current?.dispose();
      segmenterRef.current = null;
    };
  }, []);

  // Continuously redraws the camera feed onto a canvas with the background
  // blurred and only the person left sharp. The MediaRecorder below will capture
  // this canvas stream, so the clip sent to the AI model will benefit from reduced
  // background noise.
  // Throttled to ~15fps: segmentation is the expensive part of this loop, and the
  // background doesn't need full framerate smoothness, so this caps CPU/GPU load
  // instead of re-running inference as fast as the device possibly can.
  useEffect(() => {
    if (!useRealCamera || blurStatus !== 'ready') return;
    let active = true;
    const TARGET_FRAME_INTERVAL_MS = 66;

    const renderFrame = async (now: number) => {
      if (!active) return;

      if (now - lastBlurFrameAtRef.current < TARGET_FRAME_INTERVAL_MS) {
        blurLoopRef.current = requestAnimationFrame(renderFrame);
        return;
      }
      lastBlurFrameAtRef.current = now;

      const video = videoRef.current;
      const canvas = previewCanvasRef.current;
      const segmenter = segmenterRef.current;
      const bodySegmentation = bodySegmentationModuleRef.current;

      if (video && canvas && segmenter && bodySegmentation && video.readyState >= 2 && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        // body-segmentation reads the HTML width/height attributes (not videoWidth/
        // videoHeight) to size its internal mask tensor. We only size the element via
        // CSS, so those attributes default to 0 - producing a zero-sized mask tensor
        // and the "source width is zero" ImageData error. Keep them mirrored here.
        if (video.width !== video.videoWidth) video.width = video.videoWidth;
        if (video.height !== video.videoHeight) video.height = video.videoHeight;
        try {
          const segmentation = await segmenter.segmentPeople(video);
          await bodySegmentation.drawBokehEffect(
            canvas, video, segmentation,
            /* foregroundThreshold */ 0.5,
            /* backgroundBlurAmount */ 10,
            /* edgeBlurAmount */ 5,
            /* flipHorizontal */ false
          );

          // Free the GPU tensor backing each mask. The 'tfjs' runtime's mask wrapper
          // has no dispose()/close() method of its own - segmentPeople() returns a live
          // tensor (sized to the video's resolution, e.g. ~14MB at 1280x720) that is
          // never freed unless we pull it out via toTensor() and dispose it ourselves.
          // Without this, GPU memory climbs every frame until WebGL loses its context.
          if (segmentation && segmentation.length > 0) {
            await Promise.all(segmentation.map(async (person) => {
              const maskTensor = await person.mask.toTensor();
              maskTensor.dispose();
            }));
          }
        } catch (e) {
          // Skip this frame, but log once so a persistent failure is diagnosable
          // instead of silently looking like blur just never activates.
          if (!(window as any).__blurFrameErrorLogged) {
            (window as any).__blurFrameErrorLogged = true;
            console.error('Background-blur frame draw failed:', e);
          }
        }
      }
      if (active) blurLoopRef.current = requestAnimationFrame(renderFrame);
    };

    blurLoopRef.current = requestAnimationFrame(renderFrame);
    return () => {
      active = false;
      if (blurLoopRef.current) cancelAnimationFrame(blurLoopRef.current);
    };
  }, [useRealCamera, blurStatus]);

  // Draws a static framing overlay (recording bounds) over the camera preview.
  // This is deliberately NOT a hand-tracking visualization: no landmark detection
  // runs client-side. The actual AI evaluation only happens server-side, after the
  // clip is uploaded to POST /api/practice/evaluate.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const margin = 40;
    const len = 20;
    const w = canvas.width;
    const h = canvas.height;

    ctx.strokeStyle = '#6063ee';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);

    ctx.strokeStyle = '#4648d4';
    ctx.lineWidth = 4;
    // Top Left
    ctx.beginPath(); ctx.moveTo(margin, margin + len); ctx.lineTo(margin, margin); ctx.lineTo(margin + len, margin); ctx.stroke();
    // Top Right
    ctx.beginPath(); ctx.moveTo(w - margin, margin + len); ctx.lineTo(w - margin, margin); ctx.lineTo(w - margin - len, margin); ctx.stroke();
    // Bottom Left
    ctx.beginPath(); ctx.moveTo(margin, h - margin - len); ctx.lineTo(margin, h - margin); ctx.lineTo(margin + len, h - margin); ctx.stroke();
    // Bottom Right
    ctx.beginPath(); ctx.moveTo(w - margin, h - margin - len); ctx.lineTo(w - margin, h - margin); ctx.lineTo(w - margin - len, h - margin); ctx.stroke();

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
      
      // Capture the blurred canvas stream if ready, otherwise fallback to the raw camera stream
      const streamToRecord = (blurStatus === 'ready' && previewCanvasRef.current)
        ? (previewCanvasRef.current as any).captureStream(30)
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

          if (evaluation.status === 'CORRECT') {
            setHandShapeGrade('Xuất sắc');
            setOrientationGrade('Xuất sắc');
            setMotionGrade('Xuất sắc');
          } else if (evaluation.status === 'ALMOST_CORRECT') {
            setHandShapeGrade('Tốt');
            setOrientationGrade('Tốt');
            setMotionGrade('Tốt');
          } else {
            setHandShapeGrade('Tạm được');
            setOrientationGrade('Cần chỉnh tư thế');
            setMotionGrade('Tạm được');
          }

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
          <h2 className="font-display text-3xl font-extrabold text-on-surface">Phòng Luyện Tập AI</h2>
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
        <h2 className="font-display text-3xl font-extrabold text-on-surface">Phòng Luyện Tập AI</h2>
        <p className="text-body-md text-on-surface-variant">Quay một video luyện tập bằng camera và để mô hình AI chấm điểm.</p>
      </header>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        
        {/* Left Column: Live Grid & Sub-metrics (8/12 wide) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Feed Canvas Panel */}
          <div className="bg-neutral-900 rounded-2xl relative w-full overflow-hidden aspect-video elevation-2 border border-outline-variant/30 text-white">
            
            {/* The Raw Camera Video Tag - mirrored (scaleX(-1)) so it feels like looking in a mirror.
                Serves as the visible layer until the blur canvas above it starts painting, and
                as the actual source frames the blur canvas reads from. */}
            {useRealCamera && (
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover opacity-80"
                style={{ transform: 'scaleX(-1)' }}
                playsInline
                muted
              />
            )}

            {/* Background-blur preview canvas - sits on top of the raw video and, once the
                segmentation model is ready, redraws each frame with the background blurred and
                only the person left sharp. Transparent until the first frame is drawn, so the
                raw video shows through as a fallback while the model is still loading. */}
            {useRealCamera && (
              <canvas
                ref={previewCanvasRef}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
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
              {useRealCamera && blurStatus !== 'ready' && (
                <span className={`px-3 py-1 backdrop-blur-md text-[10px] font-semibold rounded-lg flex items-center gap-1.5 ${
                  blurStatus === 'loading' ? 'bg-black/60 text-white/90' : 'bg-amber-500/80 text-white'
                }`}>
                  {blurStatus === 'loading' ? (
                    <>
                      <span className="w-2.5 h-2.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      Đang tải hiệu ứng mờ nền...
                    </>
                  ) : (
                    'Không tải được hiệu ứng mờ nền'
                  )}
                </span>
              )}
            </div>

            {/* Top Right Overall Dynamic Score Gauge overlay */}
            <div className="absolute top-4 right-4 z-20 glass-card text-on-surface p-3.5 rounded-2xl flex items-center gap-3 border border-indigo-400/30">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-surface-variant" strokeDasharray="100, 100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-primary" strokeDasharray={`${overallScore ?? 0}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="absolute text-xs font-display font-extrabold text-primary">{overallScore !== null ? `${overallScore}%` : '--'}</span>
              </div>
              <div className="leading-tight">
                <p className="text-[10px] text-outline font-extrabold uppercase">Độ Khớp Tổng Thể</p>
                <p className="text-xs font-bold text-on-surface">{overallScore === null ? 'Chưa quét' : overallScore >= 90 ? 'Đã thành thạo!' : 'Đang hiệu chỉnh...'}</p>
              </div>
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
                <p className="text-white/60 text-xs mt-2 max-w-xs">Nhấn "Hiệu Chỉnh & Quét" để thử lại.</p>
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

          {/* Subgrade Diagnostics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border flex justify-between items-center bg-surface-container-lowest shadow-sm ${handShapeGrade === 'Xuất sắc' || handShapeGrade === 'Tốt' ? 'border-green-100' : 'border-amber-100'}`}>
              <div>
                <p className="text-[10px] font-bold uppercase text-outline">Hình bàn tay</p>
                <p className="text-sm font-bold text-on-surface">Dáng Tư Thế</p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                handShapeGrade === 'Xuất sắc' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>{handShapeGrade ?? 'Chờ đánh giá'}</span>
            </div>

            <div className={`p-4 rounded-xl border flex justify-between items-center bg-surface-container-lowest shadow-sm ${orientationGrade === 'Xuất sắc' || orientationGrade === 'Tốt' ? 'border-green-100' : 'border-amber-100'}`}>
              <div>
                <p className="text-[10px] font-bold uppercase text-outline">Hướng tay</p>
                <p className="text-sm font-bold text-on-surface">Hướng Lòng Bàn Tay</p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                orientationGrade === 'Xuất sắc' || orientationGrade === 'Tốt' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>{orientationGrade ?? 'Chờ đánh giá'}</span>
            </div>

            <div className={`p-4 rounded-xl border flex justify-between items-center bg-surface-container-lowest shadow-sm ${motionGrade === 'Xuất sắc' || motionGrade === 'Tốt' ? 'border-green-100' : 'border-amber-100'}`}>
              <div>
                <p className="text-[10px] font-bold uppercase text-outline">Chuyển động</p>
                <p className="text-sm font-bold text-on-surface">Tốc Độ & Xoay</p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                motionGrade === 'Xuất sắc' || motionGrade === 'Tốt' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>{motionGrade ?? 'Chờ đánh giá'}</span>
            </div>
          </div>

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
              <h3 className="font-display text-lg font-bold text-on-surface">Video Mẫu Tham Khảo</h3>
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
                    setHandShapeGrade(null);
                    setOrientationGrade(null);
                    setMotionGrade(null);
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
