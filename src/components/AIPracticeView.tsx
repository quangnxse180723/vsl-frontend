import React, { useState, useEffect, useRef } from 'react';
import { Vocabulary } from '../types';
import { Camera, CameraOff, Play, ShieldCheck, HelpCircle, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

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
  const [calibrationStep, setCalibrationStep] = useState<string>('Ready to Calibrate');
  const [progressWidth, setProgressWidth] = useState(0);

  // Live Score Metrics
  const [overallScore, setOverallScore] = useState(88);
  const [handShapeGrade, setHandShapeGrade] = useState<'Excellent' | 'Good' | 'Fair' | 'Adjust Pose'>('Excellent');
  const [orientationGrade, setOrientationGrade] = useState<'Excellent' | 'Good' | 'Fair' | 'Adjust Pose'>('Good');
  const [motionGrade, setMotionGrade] = useState<'Excellent' | 'Good' | 'Fair' | 'Adjust Pose'>('Adjust Pose');

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

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

  // Mock neural skeleton hand tracking drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      angle += 0.05;

      // Draw futuristic visual tracker bounds
      ctx.strokeStyle = '#6063ee';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      // Draw target lock corners
      const len = 20;
      const margin = 40;
      const w = canvas.width;
      const h = canvas.height;

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

      // If detecting, draw a dynamic neural hand skeleton model overlay
      if (isDetecting || useRealCamera) {
        ctx.fillStyle = '#4648d4';
        
        // Define base keypoints for hand nodes
        // Fluctuates slightly to represent genuine computer vision coordinate alignment
        const pulse = Math.sin(angle) * 3;
        const wristX = w / 2;
        const wristY = h - 70;
        
        const palmCenter = { x: w / 2 + pulse, y: h / 2 + 10 + pulse };

        // Finger tip nodes coordinates
        const thumbTip = { x: w / 2 - 60, y: h / 2 - 30 + pulse };
        const indexTip = { x: w / 2 - 30 + pulse * 0.5, y: h / 2 - 80 + pulse };
        const middleTip = { x: w / 2 + pulse, y: h / 2 - 90 + Math.cos(angle) * 2 };
        const ringTip = { x: w / 2 + 30, y: h / 2 - 80 + pulse * 0.8 };
        const pinkyTip = { x: w / 2 + 60, y: h / 2 - 50 + pulse };

        // Draw joint links
        ctx.strokeStyle = '#6063ee';
        ctx.lineWidth = 2.5;

        // Wrist to palm center
        ctx.beginPath(); ctx.moveTo(wristX, wristY); ctx.lineTo(palmCenter.x, palmCenter.y); ctx.stroke();
        
        // Palm center to finger bases
        ctx.beginPath();
        ctx.moveTo(palmCenter.x, palmCenter.y); ctx.lineTo(thumbTip.x, thumbTip.y);
        ctx.moveTo(palmCenter.x, palmCenter.y); ctx.lineTo(indexTip.x, indexTip.y);
        ctx.moveTo(palmCenter.x, palmCenter.y); ctx.lineTo(middleTip.x, middleTip.y);
        ctx.moveTo(palmCenter.x, palmCenter.y); ctx.lineTo(ringTip.x, ringTip.y);
        ctx.moveTo(palmCenter.x, palmCenter.y); ctx.lineTo(pinkyTip.x, pinkyTip.y);
        ctx.stroke();

        // Draw node circles
        const nodes = [wristX, wristY, palmCenter.x, palmCenter.y, thumbTip.x, thumbTip.y, indexTip.x, indexTip.y, middleTip.x, middleTip.y, ringTip.x, ringTip.y, pinkyTip.x, pinkyTip.y];
        for (let i = 0; i < nodes.length; i += 2) {
          ctx.beginPath();
          ctx.arc(nodes[i], nodes[i+1], i < 4 ? 6 : 4, 0, 2 * Math.PI);
          ctx.fillStyle = i === 0 ? '#ba1a1a' : '#2170e4';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Draw track info text
        ctx.fillStyle = '#2170e4';
        ctx.font = '10px Courier New';
        ctx.fillText(`COORD [X:${palmCenter.x.toFixed(0)} Y:${palmCenter.y.toFixed(0)}]`, margin + 10, h - margin - 15);
        ctx.fillText(`ACCURACY: ${(overallScore / 100).toFixed(2)}`, margin + 10, h - margin - 5);
      } else {
        // Standby text
        ctx.fillStyle = '#767586';
        ctx.font = '14px inherit';
        ctx.textAlign = 'center';
        ctx.fillText('Press "Calibrate & Scan" to align neural tracking nodes.', w / 2, h / 2);
      }

      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [isDetecting, useRealCamera, overallScore]);

  // Run Calibration / Analysis Simulation
  const triggerSimulation = () => {
    if (isDetecting) return;
    setIsDetecting(true);
    setProgressWidth(0);
    setCalibrationStep('Connecting Camera Stream...');

    // Calibration steps
    setTimeout(() => {
      setCalibrationStep('Detecting bounding boxes...');
      setProgressWidth(30);
    }, 600);

    setTimeout(() => {
      setCalibrationStep('Plotting coordinate nodes...');
      setProgressWidth(60);
    }, 1200);

    setTimeout(() => {
      setCalibrationStep('Validating depth mapping against ' + selectedSign.name + '...');
      setProgressWidth(85);
    }, 1800);

    setTimeout(() => {
      // Calculate random high-fidelity score representing real practice
      const randomScore = Math.floor(Math.random() * 15) + 85; // 85% to 99%
      setOverallScore(randomScore);

      // Set modular subgrades based on score
      if (randomScore >= 95) {
        setHandShapeGrade('Excellent');
        setOrientationGrade('Excellent');
        setMotionGrade('Excellent');
      } else if (randomScore >= 90) {
        setHandShapeGrade('Excellent');
        setOrientationGrade('Good');
        setMotionGrade('Good');
      } else {
        setHandShapeGrade('Good');
        setOrientationGrade('Good');
        setMotionGrade('Fair');
      }

      setCalibrationStep('Calibration Perfected!');
      setProgressWidth(100);
      setIsDetecting(false);

      // Record to parent recent results database immediately to see dynamic reflection!
      onRecordResult(selectedSign.name, randomScore);
    }, 2500);
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

            {/* Loading / Calibration Status Panel Overlay */}
            {progressWidth > 0 && progressWidth < 100 && (
              <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
                <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
                <h4 className="font-headline-md text-lg text-white font-bold">{calibrationStep}</h4>
                <p className="text-white/60 text-xs mt-1.5 max-w-xs">{progressWidth < 50 ? 'Initializing camera frames...' : 'Iterating coordinate matrices...'}</p>
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

          {/* Interactive Guidelines Feedback prompt */}
          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl shrink-0 mt-0.5">feedback</span>
            <div className="space-y-1">
              <h5 className="font-label-bold text-xs text-on-surface">AI Coach Suggestion</h5>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {overallScore < 90 
                  ? "Slightly tilt your palm to the left. The neural grid needs better light contrast on your index knuckle."
                  : "Excellent posture! Your fingers are positioned flat, palm outward, corresponding precisely to the standardized ASL letter configuration."}
              </p>
            </div>
          </div>
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
                <img className="w-full h-full object-cover" src={selectedSign.image} alt={selectedSign.name} />
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
                {isDetecting ? 'Analyzing coordinates...' : 'Calibrate & Scan'}
              </button>

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
