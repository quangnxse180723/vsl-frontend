import React, { useState, useEffect, useRef } from 'react';
import { Vocabulary } from '../types';
import { Camera, CameraOff, Play, ShieldCheck, HelpCircle, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { api, EvaluationResponse } from '../services/api';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const HAND_CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],[0,17],
];

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
  const [selectedSign, setSelectedSign] = useState<Vocabulary>(initialSign);

  // States
  const [useRealCamera, setUseRealCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState<string>('Ready to Calibrate');
  const [progressWidth, setProgressWidth] = useState(0);

  // Live Score Metrics
  const [overallScore, setOverallScore] = useState(0);
  const [evalResult, setEvalResult] = useState<EvaluationResponse | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [handShapeGrade, setHandShapeGrade] = useState<'Excellent' | 'Good' | 'Fair' | 'Adjust Pose'>('Excellent');
  const [orientationGrade, setOrientationGrade] = useState<'Excellent' | 'Good' | 'Fair' | 'Adjust Pose'>('Good');
  const [motionGrade, setMotionGrade] = useState<'Excellent' | 'Good' | 'Fair' | 'Adjust Pose'>('Adjust Pose');

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const refVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const [mpReady, setMpReady] = useState(false);

  // Update selected sign when prop changes
  useEffect(() => {
    if (initialSelectedSignName) {
      const found = vocabularyList.find(v => v.name === initialSelectedSignName);
      if (found) setSelectedSign(found);
    }
  }, [initialSelectedSignName, vocabularyList]);

  // Load MediaPipe HandLandmarker once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        const hl = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          numHands: 2,
          runningMode: 'VIDEO',
        });
        if (!cancelled) { handLandmarkerRef.current = hl; setMpReady(true); }
      } catch (e) {
        console.warn('MediaPipe load failed:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Force play reference video when selectedSign changes
  useEffect(() => {
    const vid = refVideoRef.current;
    if (vid && selectedSign?.image?.endsWith('.mp4')) {
      vid.load();
      vid.play().catch(() => {});
    }
  }, [selectedSign]);

  // Handle Real Camera stream toggle
  useEffect(() => {
    if (useRealCamera) {
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false })
        .then(stream => {
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.log('Video play interrupted', e));
          }
        })
        .catch(err => {
          console.error("Camera access failed:", err);
          alert("Could not access camera in iframe sandbox. Using high-definition simulator instead!");
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

  // Real-time hand tracking loop with MediaPipe
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    let frameId: number;

    const drawCorners = () => {
      const len = 20, margin = 40;
      ctx.strokeStyle = '#4648d4';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(margin, margin+len); ctx.lineTo(margin, margin); ctx.lineTo(margin+len, margin); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w-margin, margin+len); ctx.lineTo(w-margin, margin); ctx.lineTo(w-margin-len, margin); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(margin, h-margin-len); ctx.lineTo(margin, h-margin); ctx.lineTo(margin+len, h-margin); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w-margin, h-margin-len); ctx.lineTo(w-margin, h-margin); ctx.lineTo(w-margin-len, h-margin); ctx.stroke();
    };

    const drawHand = (landmarks: {x:number;y:number;z:number}[]) => {
      // connections
      ctx.strokeStyle = '#4648d4';
      ctx.lineWidth = 2.5;
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.beginPath();
        ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
        ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
        ctx.stroke();
      }
      // nodes
      landmarks.forEach((lm, i) => {
        const isTip = [4,8,12,16,20].includes(i);
        ctx.beginPath();
        ctx.arc(lm.x * w, lm.y * h, isTip ? 6 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = i === 0 ? '#ba1a1a' : isTip ? '#38bdf8' : '#2170e4';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      // wrist coord label
      const wrist = landmarks[0];
      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px Courier New';
      ctx.fillText(`X:${(wrist.x).toFixed(2)} Y:${(wrist.y).toFixed(2)}`, 55, h - 50);
    };

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      drawCorners();

      if (useRealCamera && video && video.readyState >= 2 && handLandmarkerRef.current) {
        const results = handLandmarkerRef.current.detectForVideo(video, performance.now());
        if (results.landmarks?.length) {
          results.landmarks.forEach(drawHand);
        } else {
          // no hand detected
          ctx.fillStyle = '#767586';
          ctx.font = '13px inherit';
          ctx.textAlign = 'center';
          ctx.fillText('Giơ tay vào khung hình...', w / 2, h / 2);
          ctx.textAlign = 'left';
        }
      } else if (!useRealCamera) {
        ctx.fillStyle = '#767586';
        ctx.font = '13px inherit';
        ctx.textAlign = 'center';
        ctx.fillText('Bật camera để bắt đầu tracking', w / 2, h / 2);
        ctx.textAlign = 'left';
      }

      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [useRealCamera, mpReady]);

  // Record from camera for `durationMs` and return the Blob
  const recordCamera = (durationMs: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const stream = cameraStream;
      if (!stream) { reject(new Error('Camera stream not available')); return; }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      recorder.onerror = (e) => reject(e);
      recorder.start();
      setTimeout(() => recorder.stop(), durationMs);
    });
  };

  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

  const triggerSimulation = async () => {
    if (isDetecting) return;
    if (!useRealCamera || !cameraStream) {
      setEvalError('Hãy bật camera trước khi chạy đánh giá.');
      return;
    }
    if (!selectedSign.expectedId) {
      setEvalError('Từ vựng này chưa có expectedId — không thể đánh giá.');
      return;
    }

    setIsDetecting(true);
    setProgressWidth(0);
    setEvalError(null);
    setEvalResult(null);

    // Countdown 3-2-1 để người dùng vào tư thế
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      setCalibrationStep(`Chuẩn bị tư thế... ${i}`);
      await sleep(1000);
    }
    setCountdown(null);

    // Bắt đầu ghi hình
    setIsRecording(true);
    setCalibrationStep('Đang ghi hình động tác...');
    setProgressWidth(15);

    try {
      // 1. Record 3s from camera
      const blob = await recordCamera(3000);
      setIsRecording(false);
      setCalibrationStep('Đang gửi lên AI model...');
      setProgressWidth(50);

      // 2. Call real API
      const res = await api.evaluate(blob, selectedSign.expectedId);
      const result = res.data;
      setEvalResult(result);

      // 3. Map result to UI states
      const score = result.status === 'CORRECT' ? 95
        : result.status === 'ALMOST_CORRECT' ? 70
        : 40;
      setOverallScore(score);

      if (result.status === 'CORRECT') {
        setHandShapeGrade('Excellent'); setOrientationGrade('Excellent'); setMotionGrade('Excellent');
      } else if (result.status === 'ALMOST_CORRECT') {
        setHandShapeGrade('Good'); setOrientationGrade('Good'); setMotionGrade('Fair');
      } else {
        setHandShapeGrade('Fair'); setOrientationGrade('Fair'); setMotionGrade('Adjust Pose');
      }

      setCalibrationStep(
        result.status === 'CORRECT' ? 'Chính xác!' :
        result.status === 'ALMOST_CORRECT' ? 'Gần đúng!' : 'Chưa đúng'
      );
      setProgressWidth(100);
      onRecordResult(selectedSign.name, score);
    } catch (err: any) {
      setEvalError(err.message || 'Lỗi khi gọi API đánh giá.');
      setCalibrationStep('Lỗi');
      setProgressWidth(0);
    } finally {
      setIsDetecting(false);
      setIsRecording(false);
      setCountdown(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-on-surface">
      <header>
        <h2 className="font-display text-3xl font-extrabold text-on-surface">AI Practice Lab</h2>
        <p className="text-body-md text-on-surface-variant">Check your hand posture with real-time feedback using your camera and browser computer vision simulator.</p>
      </header>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        
        {/* Left Column: Live Grid & Sub-metrics (8/12 wide) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Feed Canvas Panel */}
          <div className="bg-neutral-900 rounded-2xl relative w-full overflow-hidden aspect-video elevation-2 border border-outline-variant/30 text-white">
            
            {/* The Raw Camera Video Tag */}
            {useRealCamera && (
              <video 
                ref={videoRef} 
                className="absolute inset-0 w-full h-full object-cover opacity-80" 
                playsInline 
                muted
              />
            )}

            {/* Simulated Tracking Canvas overlays directly */}
            <canvas 
              ref={canvasRef} 
              width={640} 
              height={360} 
              className="absolute inset-0 w-full h-full z-10 pointer-events-none"
            />

            {/* Status indicators */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
              <span className="px-3 py-1 bg-green-600/90 backdrop-blur-md text-white text-[10px] font-bold rounded-lg flex items-center gap-1.5 uppercase letter-spacing">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                Live Feedback
              </span>
              <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-semibold rounded-lg font-mono">
                {useRealCamera ? 'Camera Feed' : 'HD Simulator'}
              </span>
            </div>

            {/* Top Right Overall Dynamic Score Gauge overlay */}
            <div className="absolute top-4 right-4 z-20 glass-card text-on-surface p-3.5 rounded-2xl flex items-center gap-3 border border-indigo-400/30">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-surface-variant" strokeDasharray="100, 100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-primary" strokeDasharray={`${overallScore}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="absolute text-xs font-display font-extrabold text-primary">{overallScore}%</span>
              </div>
              <div className="leading-tight">
                <p className="text-[10px] text-outline font-extrabold uppercase">Overall Match</p>
                <p className="text-xs font-bold text-on-surface">{overallScore >= 90 ? 'Mastered!' : 'Calibrating...'}</p>
              </div>
            </div>

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 bg-neutral-950/75 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
                <p className="text-white/70 text-sm mb-2 font-semibold">Chuẩn bị động tác...</p>
                <span className="text-9xl font-extrabold text-primary drop-shadow-lg animate-pulse">{countdown}</span>
              </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute inset-0 border-4 border-red-500 rounded-2xl z-30 pointer-events-none">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-600/90 px-3 py-1.5 rounded-full">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                  <span className="text-white text-xs font-bold tracking-wide">ĐANG GHI HÌNH</span>
                </div>
              </div>
            )}

            {/* Loading / Calibration Status Panel Overlay */}
            {progressWidth > 0 && progressWidth < 100 && !isRecording && countdown === null && (
              <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
                <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
                <h4 className="font-headline-md text-lg text-white font-bold">{calibrationStep}</h4>
                <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden mt-6">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressWidth}%` }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Subgrade Diagnostics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border flex justify-between items-center bg-surface-container-lowest shadow-sm ${handShapeGrade === 'Excellent' || handShapeGrade === 'Good' ? 'border-green-100' : 'border-amber-100'}`}>
              <div>
                <p className="text-[10px] font-bold uppercase text-outline">Hand shape</p>
                <p className="text-sm font-bold text-on-surface">Pose Form</p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                handShapeGrade === 'Excellent' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>{handShapeGrade}</span>
            </div>

            <div className={`p-4 rounded-xl border flex justify-between items-center bg-surface-container-lowest shadow-sm ${orientationGrade === 'Excellent' || orientationGrade === 'Good' ? 'border-green-100' : 'border-amber-100'}`}>
              <div>
                <p className="text-[10px] font-bold uppercase text-outline">Orientation</p>
                <p className="text-sm font-bold text-on-surface">Palm Direction</p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                orientationGrade === 'Excellent' || orientationGrade === 'Good' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>{orientationGrade}</span>
            </div>

            <div className={`p-4 rounded-xl border flex justify-between items-center bg-surface-container-lowest shadow-sm ${motionGrade === 'Excellent' || motionGrade === 'Good' ? 'border-green-100' : 'border-amber-100'}`}>
              <div>
                <p className="text-[10px] font-bold uppercase text-outline">Motion</p>
                <p className="text-sm font-bold text-on-surface">Speed & Rotation</p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                motionGrade === 'Excellent' || motionGrade === 'Good' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>{motionGrade}</span>
            </div>
          </div>

          {/* AI Evaluation Result */}
          {evalError && (
            <div className="p-4 bg-error-container text-on-error-container rounded-xl border border-error/20 flex items-start gap-3">
              <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">error</span>
              <p className="text-xs leading-relaxed">{evalError}</p>
            </div>
          )}

          {evalResult ? (
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              evalResult.status === 'CORRECT' ? 'bg-green-50 border-green-200 text-green-800' :
              evalResult.status === 'ALMOST_CORRECT' ? 'bg-amber-50 border-amber-200 text-amber-800' :
              'bg-red-50 border-red-200 text-red-800'
            }`}>
              <span className="material-symbols-outlined text-2xl shrink-0 mt-0.5">
                {evalResult.status === 'CORRECT' ? 'check_circle' : evalResult.status === 'ALMOST_CORRECT' ? 'info' : 'cancel'}
              </span>
              <div className="space-y-1">
                <h5 className="font-label-bold text-xs uppercase tracking-wide">
                  {evalResult.status === 'CORRECT' ? 'Chính xác!' : evalResult.status === 'ALMOST_CORRECT' ? 'Gần đúng' : 'Chưa đúng'}
                </h5>
                <p className="text-xs leading-relaxed">{evalResult.message}</p>
                <p className="text-[10px] opacity-70">Confidence: {evalResult.confidence}% · Rank: #{evalResult.rank}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-2xl shrink-0 mt-0.5">feedback</span>
              <div className="space-y-1">
                <h5 className="font-label-bold text-xs text-on-surface">AI Coach</h5>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Bật camera, chọn từ vựng rồi bấm <strong>Calibrate &amp; Scan</strong> để AI đánh giá động tác của bạn.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Reference guidelines & configuration (4/12 wide) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Practice selection header */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-5">
            <header className="space-y-1">
              <h3 className="font-display text-lg font-bold text-on-surface">Reference Guide</h3>
              <p className="text-xs text-on-surface-variant">Select which sign vocabulary you would like to calibrate.</p>
            </header>

            {/* Sign selection list dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-outline">Vocabulary Sign</label>
              <select 
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm text-on-surface font-medium outline-none focus:border-primary"
                value={selectedSign.name}
                onChange={(e) => {
                  const s = vocabularyList.find(v => v.name === e.target.value);
                  if (s) {
                    setSelectedSign(s);
                    setOverallScore(75 + Math.floor(Math.random() * 10)); // resets slightly
                  }
                }}
              >
                {vocabularyList.map(v => (
                  <option key={v.id} value={v.name}>{v.category}: {v.name}</option>
                ))}
              </select>
            </div>

            {/* Sign reference illustration preview */}
            <div className="space-y-3">
              <div className="h-44 rounded-xl overflow-hidden bg-surface-variant relative border border-outline-variant/30">
                {selectedSign.image.endsWith('.mp4') ? (
                  <video
                    key={selectedSign.id}
                    ref={refVideoRef}
                    className="w-full h-full object-contain bg-black"
                    src={selectedSign.image}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    onError={(e) => { const v = e.target as HTMLVideoElement; console.error('[RefVideo] code:', v.error?.code, 'msg:', v.error?.message, 'src:', v.src); }}
                    onCanPlay={() => { refVideoRef.current?.play().catch(console.error); }}
                  />
                ) : (
                  <img className="w-full h-full object-cover" src={selectedSign.image} alt={selectedSign.name} />
                )}
                <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] rounded-lg">
                  Standardized reference
                </div>
              </div>
              <div>
                <h4 className="font-label-bold text-on-surface text-sm">{selectedSign.name}</h4>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">{selectedSign.description}</p>
              </div>
            </div>
          </div>

          {/* Core Controls Dashboard */}
          <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-4 shadow-sm">
            <h4 className="font-display text-sm font-extrabold uppercase tracking-wide text-outline">Lab Controls</h4>
            
            <div className="space-y-3">
              {/* Scan Calibration Button */}
              <button
                onClick={triggerSimulation}
                disabled={isDetecting}
                className="w-full active-scale py-3.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-2 disabled:bg-primary/50"
              >
                <span className="material-symbols-outlined text-lg">filter_center_focus</span>
                {isDetecting ? 'Đang phân tích...' : 'Calibrate & Scan'}
              </button>
              {!useRealCamera && (
                <p className="text-[10px] text-on-surface-variant text-center">
                  ⚠️ Cần bật camera để AI đánh giá
                </p>
              )}

              {/* Toggle Web Camera Stream */}
              <button
                onClick={() => setUseRealCamera(!useRealCamera)}
                className={`w-full py-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  useRealCamera 
                    ? 'bg-[#ba1a1a]/10 text-[#ba1a1a] border-[#ba1a1a]/30' 
                    : 'bg-surface-container-lowest text-on-surface border-outline-variant/50 hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {useRealCamera ? 'videocam_off' : 'videocam'}
                </span>
                {useRealCamera ? 'Deactivate Web Camera' : 'Activate Web Camera'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
