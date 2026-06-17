/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, Brain, Sparkles, AlertCircle, RefreshCw, 
  CheckCircle, ArrowRight, BookOpen, Star, HelpCircle, Loader2 
} from 'lucide-react';
import { Lesson, UserStats } from '../types';

interface AIPracticeViewProps {
  lessons: Lesson[];
  stats: UserStats;
  onGrantXP: (xp: number, isAIClaim?: boolean) => void;
}

export default function AIPracticeView({ lessons, stats, onGrantXP }: AIPracticeViewProps) {
  // All active target dictionary
  const targets = [
    { target: 'A', name: 'Letter A', desc: 'Clenched fist, thumb pressed straight vertically on side' },
    { target: 'Y', name: 'Letter Y', desc: 'Thumb and pinky fully extended, middle fingers pulled flat' },
    { target: 'Hello', name: 'Salute "Hello"', desc: 'Salute flat hand brushing outwards from temple temple area' },
    { target: '3', name: 'Number 3', desc: 'Raise index, middle, and thumb together, index/ring folded flat' },
    { target: 'Father', name: 'Double Tap "Father"', desc: 'Double tap thumb of relax spread 5-hand against forehead' },
    { target: 'Water', name: 'Letter W "Water"', desc: 'Tap index finger of W sign twice against the chin' }
  ];

  const [selectedTarget, setSelectedTarget] = useState(targets[0]);
  
  // Webcam & Evaluation states
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    matched: boolean;
    feedback: string;
    suggestion: string;
    isSimulation?: boolean;
  } | null>(null);
  const [landmarkAnimation, setLandmarkAnimation] = useState<boolean>(false);

  // Upload/Drag states
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Restart lens
  const startCamera = async () => {
    try {
      setUploadedImage(null);
      setEvaluationResult(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setLandmarkAnimation(true);
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Could not start webcam. Please grant camera permission or use the File Upload panel!');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
    setLandmarkAnimation(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Handle uploaded picture files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImage(event.target.result as string);
          stopCamera();
          setEvaluationResult(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImage(event.target.result as string);
          stopCamera();
          setEvaluationResult(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit base64 snapshot to API endpoint
  const handleEvaluateSign = async () => {
    setAnalyzing(true);
    setEvaluationResult(null);

    let imageDataUrl = '';

    if (uploadedImage) {
      imageDataUrl = uploadedImage;
    } else if (cameraActive && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(-1, 1); // mirror horizontal
        ctx.drawImage(videoRef.current, -640, 0, 640, 480);
        imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    if (!imageDataUrl) {
      setAnalyzing(false);
      alert('Please activate your camera lens or upload a picture first!');
      return;
    }

    try {
      const res = await fetch('/api/evaluate-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageDataUrl,
          target: selectedTarget.target
        })
      });

      const data = await res.json();
      setEvaluationResult({
        score: data.score,
        matched: data.matched,
        feedback: data.feedback,
        suggestion: data.suggestion,
        isSimulation: data.isSimulation
      });

      // Grant actual XP block!
      if (data.matched && data.score >= 70) {
        onGrantXP(40, true); // give 40 XP for successful sandbox practice check!
      } else {
        onGrantXP(10, false); // give 10 XP for trying
      }

    } catch (err) {
      console.error('[Sandbox API Error] evaluation failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-lg animate-fade-in">
      <header>
        <span className="font-mono text-xs font-semibold text-primary uppercase tracking-widest">AI PRACTICE STUDIO</span>
        <h2 className="font-headline text-headline-lg text-on-surface font-bold mt-xs leading-none">
          ASL Landmark Recognizer
        </h2>
        <p className="text-body-md text-on-surface-variant max-w-2xl mt-1.5">
          Select an posture vocabulary from our dictionary below, trigger your lens, and let the AI analyzer evaluate your coordinates in real-time!
        </p>
      </header>

      {/* Grid: Selected Target and webcam panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        
        {/* Left Side: Target Selector cards */}
        <div className="space-y-md">
          <span className="text-xs font-mono font-bold text-outline uppercase tracking-wider block">GLOSSARY DICTIONARY</span>
          
          <div className="space-y-sm max-h-[55vh] overflow-y-auto pr-1">
            {targets.map((t) => {
              const isSelected = selectedTarget.target === t.target;
              return (
                <button
                  key={t.target}
                  onClick={() => {
                    setSelectedTarget(t);
                    setEvaluationResult(null);
                  }}
                  className={`w-full text-left p-md border-2 rounded-2xl transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-md scale-[1.01]'
                      : 'border-outline-variant hover:border-primary-container bg-white hover:scale-[1.005]'
                  }`}
                >
                <div className="flex justify-between items-start gap-2">
                    <span className="font-headline font-bold text-base text-on-surface">{t.name}</span>
                  <span className="font-mono font-bold text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full shrink-0">
                      "{t.target}"
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-sm font-medium leading-relaxed">
                    {t.desc}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="p-md bg-surface border border-outline-variant rounded-xl text-center">
            <span className="text-[11px] font-mono leading-relaxed block font-semibold text-on-surface-variant">
              💡 Complete any sandbox test with <strong>≥70%</strong> to claim <span className="text-primary font-bold">+40 XP</span> balance!
            </span>
          </div>
        </div>

        {/* Center/Right: Capture Panel & Results */}
        <div className="lg:col-span-2 space-y-md">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md items-stretch">
            
            {/* Capture Viewer */}
            <div className="space-y-sm">
              <span className="text-xs font-mono font-bold text-outline uppercase tracking-wider block">FEED RECORDING</span>
              
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative aspect-[4/3] rounded-2xl overflow-hidden border-2 bg-on-surface/90 flex flex-col items-center justify-center transition-all ${
                  dragActive ? 'border-dashed border-primary bg-on-surface/80 ring-2 ring-primary' : 'border-outline-variant shadow-lg'
                }`}
              >
                {cameraActive ? (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    {landmarkAnimation && (
                      <div className="absolute inset-0 pointer-events-none z-10">
                        <div className="absolute inset-0 border border-green-400/40 animate-pulse bg-gradient-to-t from-green-500/10 via-transparent to-transparent pointer-events-none" />
                        
                        <div className="absolute top-[35%] left-[45%] w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-ping" />
                        <div className="absolute top-[30%] left-[55%] w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                        <div className="absolute top-[45%] left-[35%] w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                        <div className="absolute top-[55%] left-[45%] w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                        <div className="absolute top-[60%] left-[60%] w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse" />
                        
                        <div className="absolute top-4 left-4 border-t-2 border-l-2 border-green-400 w-6 h-6" />
                        <div className="absolute top-4 right-4 border-t-2 border-r-2 border-green-400 w-6 h-6" />
                        <div className="absolute bottom-4 left-4 border-b-2 border-l-2 border-green-400 w-6 h-6" />
                        <div className="absolute bottom-4 right-4 border-b-2 border-r-2 border-green-400 w-6 h-6" />
                      </div>
                    )}
                  </>
                ) : uploadedImage ? (
                  <div className="w-full h-full relative">
                    <img 
                      alt="Uploaded draft" 
                      className="w-full h-full object-contain" 
                      src={uploadedImage}
                    />
                    <button 
                      onClick={() => setUploadedImage(null)}
                      className="absolute top-2 right-2 bg-on-surface/80 hover:bg-on-surface text-white p-1 rounded-full text-xs font-mono"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-md md:p-lg text-white/70 space-y-md">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <Camera className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white leading-none">Awaiting Capture Input</p>
                      <p className="text-xs text-white/60 max-w-xs mx-auto leading-relaxed">
                        Practice signing <strong>"{selectedTarget.name}"</strong>. Activate your system camera device or select a custom image file to feed.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center pt-sm">
                      <button 
                        onClick={startCamera}
                        type="button"
                        className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl transition-all hover:bg-primary-container active:scale-95 inline-flex items-center gap-sm shrink-0"
                      >
                        <Camera className="w-4 h-4 shrink-0" />
                        <span>Open Lens</span>
                      </button>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition-all active:scale-95 inline-flex items-center gap-sm shrink-0"
                      >
                        <Upload className="w-4 h-4 shrink-0" />
                        <span>Select File</span>
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              {(cameraActive || uploadedImage) && (
                <div className="flex justify-between items-center text-xs pt-1">
                  {cameraActive ? (
                    <button
                      onClick={stopCamera}
                      className="text-red-500 font-bold hover:underline"
                    >
                      Turn Off Camera
                    </button>
                  ) : <div />}
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary font-bold hover:underline inline-flex items-center gap-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload alternative file</span>
                  </button>
                </div>
              )}

            </div>

            {/* AI Grading result box */}
            <div className="space-y-sm h-full">
              <span className="text-xs font-mono font-bold text-outline uppercase tracking-wider block">AI ANALYZER STATUS</span>
              
              {analyzing ? (
                <div className="bg-white border-2 border-outline-variant rounded-2xl p-lg text-center h-[264px] flex flex-col items-center justify-center space-y-sm">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <h4 className="text-sm font-bold text-on-surface leading-tight">Validating joints and bounds...</h4>
                  <p className="text-xs text-on-surface-variant max-w-xs leading-snug">
                    Analyzing finger alignments and wrist angles against training reference constraints for "{selectedTarget.name}".
                  </p>
                </div>
              ) : evaluationResult ? (
                <div className="bg-white border-2 border-outline-variant rounded-2xl p-md md:p-lg space-y-md min-h-[264px] animate-fade-in flex flex-col justify-between">
                  <div className="flex items-center gap-md">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold font-headline shrink-0 ${evaluationResult.matched ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {evaluationResult.score}%
                    </div>
                    <div>
                      <h4 className="text-sm font-bold font-headline text-on-surface">
                        {evaluationResult.matched ? 'Accurate Hand Gesture!' : 'Incomplete Posture'}
                      </h4>
                      <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                        {evaluationResult.matched ? 'Accuracy exceeds target standards (+40 XP claimed!)' : 'Make proper hand coordinates adjustment and retry'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-surface rounded-xl p-sm border border-outline-variant">
                    <span className="text-[9px] font-mono font-bold text-primary block uppercase">COACHING ADVICE</span>
                    <p className="text-xs font-semibold text-on-surface mt-0.5 leading-relaxed">
                      "{evaluationResult.feedback}"
                    </p>
                  </div>

                  {evaluationResult.suggestion && (
                    <div className="text-xs text-on-surface-variant leading-relaxed">
                      <strong>Correction suggestion:</strong> {evaluationResult.suggestion}
                    </div>
                  )}

                  {evaluationResult.isSimulation && (
                    <div className="pt-xs border-t border-dashed border-outline-variant text-[10px] text-primary/70 text-center font-medium leading-tight">
                      Intelligent sign parser running in simulation mode.
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-outline-variant rounded-2xl p-lg text-center h-[264px] flex flex-col items-center justify-center space-y-sm text-on-surface-variant">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-on-surface">No Pose Checked</h4>
                  <p className="text-xs max-w-xs leading-relaxed">
                    Trigger your camera feed above or drop a file, check your fingers, and hit "Analyze Posture" to evaluate!
                  </p>
                </div>
              )}

            </div>

          </div>

          <div className="flex justify-end pt-sm">
            <button
              onClick={handleEvaluateSign}
              disabled={analyzing || (!cameraActive && !uploadedImage)}
              className="px-6 py-3 bg-primary text-white font-bold text-xs sm:text-sm rounded-xl transition-all disabled:opacity-50 hover:bg-primary-container active:scale-95 shadow-md flex items-center gap-sm shrink-0"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Validating Pose...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 shrink-0" />
                  <span>Analyze Selected Pose</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
