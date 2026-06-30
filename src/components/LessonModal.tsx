/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, CheckCircle, ArrowRight, Brain, Sparkles, BookOpen, 
  HelpCircle, Camera, Upload, RefreshCw, Star, Info, AlertCircle, Loader2, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Lesson, QuizQuestion } from '../types';

interface LessonModalProps {
  lesson: Lesson;
  onClose: () => void;
  onUpdateProgress: (lessonId: string, progress: number, xpGained: number) => void;
}

export default function LessonModal({ lesson, onClose, onUpdateProgress }: LessonModalProps) {
  const [activeTab, setActiveTab] = useState<'learn' | 'quiz' | 'practice'>('learn');
  const [currentStep, setCurrentStep] = useState<number>(0);
  
  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);

  // AI Practice Webcam State
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    matched: boolean;
    feedback: string;
    suggestion: string;
    isSimulation?: boolean;
    landmarks?: number[][];
  } | null>(null);
  const [landmarkAnimation, setLandmarkAnimation] = useState<boolean>(false);

  // Error feedback state instead of window.alert
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Image Upload reference if they prefer drag/drop & file selection
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start/Stop camera stream
  const startCamera = async () => {
    try {
      setUploadedImage(null); // clear uploaded file
      setEvaluationResult(null);
      setErrorBanner(null);
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
    } catch (err: any) {
      console.error('Camera access error:', err);
      setErrorBanner('Could not open camera device. Please grant permissions, or use the high fidelity File Upload options instead.');
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
      // Cleanup stream on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Handle Lesson steps walkthrough
  const handleNextStep = () => {
    if (currentStep < lesson.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      // Boost progress slightly on learning steps
      const newProgress = Math.max(lesson.progress, Math.floor(((currentStep + 2) / lesson.steps.length) * 45));
      onUpdateProgress(lesson.id, newProgress, 0); // no XP yet
    } else {
      // Finished reading
      const newProgress = Math.max(lesson.progress, 50);
      onUpdateProgress(lesson.id, newProgress, 10); // give 10 XP for reading
      setActiveTab('quiz');
    }
  };

  // Submit Quiz Answers
  const handleSubmitQuiz = () => {
    let corrCount = 0;
    lesson.quizQuestions.forEach(q => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        corrCount += 1;
      }
    });
    
    const pct = Math.round((corrCount / lesson.quizQuestions.length) * 100);
    setQuizScore(pct);
    setQuizSubmitted(true);

    if (pct === 100) {
      const newProgress = Math.max(lesson.progress, 75);
      onUpdateProgress(lesson.id, newProgress, 30); // 30 XP for perfect quiz score
    } else {
      const newProgress = Math.max(lesson.progress, 60);
      onUpdateProgress(lesson.id, newProgress, 15); // 15 XP for trying
    }
  };

  // File picker handler (Upload)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImage(event.target.result as string);
          stopCamera(); // close camera if uploaded instead
          setEvaluationResult(null);
          setErrorBanner(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and Drop
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
          setErrorBanner(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Capture Frame and Trigger Gemini Evaluation on Server
  const handleEvaluateSign = async () => {
    setAnalyzing(true);
    setEvaluationResult(null);
    setErrorBanner(null);

    let imageDataUrl = '';

    if (uploadedImage) {
      imageDataUrl = uploadedImage;
    } else if (cameraActive && videoRef.current) {
      // Capture frame from local camera
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(-1, 1); // mirror horizontal for natural feeling
        ctx.drawImage(videoRef.current, -640, 0, 640, 480);
        imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    if (!imageDataUrl) {
      setAnalyzing(false);
      setErrorBanner('Please enable your camera or upload a picture snapshot first before checking!');
      return;
    }

    try {
      const res = await fetch('/api/evaluate-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageDataUrl,
          target: lesson.letterTarget
        })
      });

      const data = await res.json();
      
      // Generate some mock point coordinates to render a coordinate mesh
      const mockPoints = Array.from({ length: 15 }, () => [
        Math.floor(20 + Math.random() * 60),
        Math.floor(20 + Math.random() * 60)
      ]);

      setEvaluationResult({
        score: data.score,
        matched: data.matched,
        feedback: data.feedback,
        suggestion: data.suggestion,
        isSimulation: data.isSimulation,
        landmarks: mockPoints
      });

      // If matched accurately, update progress to 100% (Mastered!) and grant major bonus XP (+50 XP)!!
      if (data.matched && data.score >= 70) {
        onUpdateProgress(lesson.id, 100, 50); // Full mastery and streak reward!
      }
    } catch (err) {
      console.error('Sign analysis failed', err);
      setErrorBanner('Network evaluation failed. Please make sure the backend is active.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Dynamic progress calculated for top breadcrumb status
  const currentPercentage = activeTab === 'learn' 
    ? Math.round(((currentStep + 1) / lesson.steps.length) * 33)
    : activeTab === 'quiz'
      ? 33 + Math.round((Object.keys(quizAnswers).length / lesson.quizQuestions.length) * 33)
      : 70 + (evaluationResult ? 30 : 15);

  return (
    <div className="fixed inset-0 bg-on-surface/60 backdrop-blur-md z-50 flex items-center justify-center p-0 md:p-6 overflow-y-auto">
      
      {/* Absolute high aesthetic studio container */}
      <div className="bg-surface-container-lowest w-full h-full md:h-[92vh] md:max-w-6xl md:rounded-3xl flex flex-col shadow-2xl overflow-hidden border border-outline-variant/60">
        
        {/* TOP COMPREHENSIVE STATUS BAR (Image 1 top menu layout) */}
        <div className="bg-neutral-900 text-white px-lg py-4 flex items-center justify-between select-none border-b border-white/5 shrink-0">
          <div className="flex items-center gap-md">
            <button 
              onClick={() => { stopCamera(); onClose(); }}
              className="p-1 px-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Exit Studio</span>
            </button>
            <div className="h-4 w-[1px] bg-white/20 hidden sm:block" />
            <div className="truncate hidden sm:flex items-center">
              <span className="text-[10px] font-mono bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full uppercase font-bold mr-2">
                {lesson.category}
              </span>
              <span className="text-xs text-white/95 font-bold font-headline">{lesson.title}</span>
            </div>
          </div>

          {/* Center Progress Bar */}
          <div className="flex-1 max-w-xs md:max-w-md mx-6 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-white/50 font-bold">
              <span>LESSON WORKSPACE PROGRESS</span>
              <span className="text-primary font-mono">{currentPercentage}%</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-500" 
                style={{ width: `${currentPercentage}%` }}
              />
            </div>
          </div>

          {/* Right Status */}
          <div className="flex items-center gap-sm shrink-0">
            <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-mono font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary fill-primary" />
              <span>+75 XP Avail</span>
            </div>
          </div>
        </div>

        {/* BOTTOM DOUBLE GRID VIEW */}
        <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-surface-container-lowest">
          
          {/* LEFT COLUMN: Visual demo, instructions and uploader */}
          <div className="w-full lg:w-[45%] bg-surface border-r border-outline-variant flex flex-col h-full overflow-y-auto p-lg space-y-md">
            
            {/* Visual Instruction Deck Frame */}
            <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border-2 border-outline-variant aspect-video shadow-inner">
              <img 
                alt={lesson.title} 
                className="w-full h-full object-cover opacity-90 transition-opacity" 
                referrerPolicy="no-referrer"
                src={lesson.imageUrl}
              />
              <div className="absolute top-sm right-sm bg-primary/95 text-white text-[10px] font-bold font-mono px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 fill-white" />
                <span>Demonstration pose</span>
              </div>
            </div>

            {/* Target Description and Specific Guides */}
            <div className="bg-white border border-outline-variant rounded-2xl p-md shadow-sm">
              <h4 className="text-xs font-extrabold uppercase tracking-widest font-mono text-primary flex items-center gap-2 mb-xs">
                <Info className="w-4 h-4 text-primary" />
                <span>HOW TO SIGN: "{lesson.letterTarget}"</span>
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed font-semibold mt-1">
                {lesson.signGuide}
              </p>
            </div>

            {/* Error Banner if any */}
            {errorBanner && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-md text-xs text-red-800 flex items-start gap-md animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold">Input Error</h5>
                  <p className="font-medium mt-0.5 leading-relaxed">{errorBanner}</p>
                </div>
              </div>
            )}

            {/* Step Check list tracker */}
            <div className="bg-surface-container-low rounded-2xl p-lg border border-outline-variant/60 space-y-sm">
              <span className="text-[10px] font-mono font-bold text-outline uppercase tracking-wider block">CHALLENGE STEPS TO PRACTICE</span>
              <ol className="space-y-sm">
                {lesson.steps.map((st, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs">
                    <span className={`w-5 fill-none h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border transition-all ${currentStep >= i ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface-container border-outline text-outline font-medium'}`}>
                      {currentStep > i ? '✓' : i + 1}
                    </span>
                    <span className={`transition-colors ${currentStep >= i ? 'text-on-surface font-bold' : 'text-on-surface-variant font-medium'}`}>{st}</span>
                  </li>
                ))}
              </ol>
            </div>

          </div>

          {/* RIGHT COLUMN: Interactive Tabs container */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* Custom Tab Headings */}
            <div className="border-b border-outline-variant bg-white px-md py-xs flex justify-between items-center select-none shrink-0">
              <nav className="flex space-x-md text-sm font-semibold">
                <button 
                  onClick={() => { setActiveTab('learn'); stopCamera(); }}
                  className={`py-3.5 px-2 border-b-2 transition-all ${activeTab === 'learn' ? 'border-primary text-primary font-boldScale' : 'border-transparent text-outline hover:text-on-surface'}`}
                >
                  <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <BookOpen className="w-4 h-4" />
                    <span>1. Learn Guide</span>
                  </span>
                </button>
                <button 
                  onClick={() => { setActiveTab('quiz'); stopCamera(); }}
                  className={`py-3.5 px-2 border-b-2 transition-all ${activeTab === 'quiz' ? 'border-primary text-primary font-boldScale' : 'border-transparent text-outline hover:text-on-surface'}`}
                >
                  <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <HelpCircle className="w-4 h-4" />
                    <span>2. Checkpoint Quiz</span>
                  </span>
                </button>
                <button 
                  onClick={() => { setActiveTab('practice'); }}
                  className={`py-3.5 px-2 border-b-2 transition-all ${activeTab === 'practice' ? 'border-primary text-primary font-boldScale' : 'border-transparent text-outline hover:text-on-surface'}`}
                >
                  <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <Brain className="w-4 h-4" />
                    <span>3. Practice with AI</span>
                  </span>
                </button>
              </nav>
            </div>

            {/* TAB VIEW PORT WORKSPACE */}
            <div className="flex-1 overflow-y-auto p-lg flex flex-col">
              
              <AnimatePresence mode="wait">
                {/* LEARN TAB */}
                {activeTab === 'learn' && (
                  <motion.div 
                    key="learn-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-lg h-full flex flex-col justify-between"
                  >
                    <div className="space-y-md">
                      <div className="flex items-center gap-sm">
                        <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                          {currentStep + 1}
                        </span>
                        <div>
                          <h3 className="font-headline font-bold text-on-surface">Instruction Step {currentStep + 1} of {lesson.steps.length}</h3>
                          <p className="text-xs text-on-surface-variant font-medium">Carefully review the physical sign postures before practicing</p>
                        </div>
                      </div>

                      <div className="p-lg bg-surface border border-outline-variant/60 rounded-2xl shadow-inner min-h-[120px] flex items-center">
                        <p className="text-body-lg text-on-surface font-bold leading-relaxed">
                          {lesson.steps[currentStep]}
                        </p>
                      </div>
                    </div>

                    <div className="pt-md border-t border-outline-variant flex justify-between items-center mt-xl">
                      <button 
                        onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                        disabled={currentStep === 0}
                        className="px-5 py-2.5 bg-surface-container-high text-on-surface-variant hover:text-on-surface font-bold text-xs rounded-xl disabled:opacity-50 transition-all hover:bg-surface-variant active:scale-95 cursor-pointer"
                      >
                        Previous Step
                      </button>
                      
                      <button 
                        onClick={handleNextStep}
                        className="px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl transition-all hover:bg-primary-container active:scale-95 flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <span>{currentStep === lesson.steps.length - 1 ? 'Unlock Practice Quiz' : 'Mark Complete & Next'}</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* QUIZ TAB */}
                {activeTab === 'quiz' && (
                  <motion.div 
                    key="quiz-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-lg h-full flex flex-col justify-between"
                  >
                    <div className="space-y-lg">
                      <div className="flex items-center gap-sm">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          <HelpCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-headline font-bold text-on-surface">Checkpoint Quizzes</h3>
                          <p className="text-xs text-on-surface-variant font-medium">Test your skills to qualify for AI Camera grading.</p>
                        </div>
                      </div>

                      <div className="space-y-md">
                        {lesson.quizQuestions.map((q, idx) => {
                          const selectedOpt = quizAnswers[q.id];
                          return (
                            <div key={q.id} className="p-lg bg-white border border-outline-variant rounded-2xl space-y-sm shadow-sm hover:shadow-md transition-shadow">
                              <span className="text-[10px] font-mono font-bold text-primary tracking-widest block uppercase">QUESTION {idx + 1}</span>
                              <h4 className="text-sm font-bold text-on-surface leading-snug">{q.question}</h4>
                              
                              <div className="grid grid-cols-1 gap-sm pt-sm">
                                {q.options.map((opt) => {
                                  const isSelected = selectedOpt === opt;
                                  let borderStyle = "border-outline-variant hover:border-primary-container hover:bg-surface-container-lowest";
                                  let bgStyle = "bg-white";
                                  
                                  if (isSelected) {
                                    borderStyle = "border-primary bg-primary/5 ring-1 ring-primary";
                                  }

                                  if (quizSubmitted) {
                                    const isCorrect = opt === q.correctAnswer;
                                    if (isCorrect) {
                                      borderStyle = "border-green-600 bg-green-50/70 ring-1 ring-green-600 font-semibold";
                                    } else if (isSelected && !isCorrect) {
                                      borderStyle = "border-red-500 bg-red-50/70 ring-1 ring-red-500";
                                    }
                                  }

                                  return (
                                    <button
                                      key={opt}
                                      disabled={quizSubmitted}
                                      onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                      className={`text-left p-sm text-xs rounded-xl border-2 transition-all cursor-pointer ${borderStyle} ${bgStyle}`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <span>{opt}</span>
                                        {isSelected && !quizSubmitted && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                                        {quizSubmitted && opt === q.correctAnswer && <span className="text-green-600 font-bold text-xs font-mono shrink-0">✓ CORRECT</span>}
                                        {quizSubmitted && isSelected && opt !== q.correctAnswer && <span className="text-red-500 font-bold text-xs font-mono shrink-0">✗ WRONG</span>}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-md border-t border-outline-variant flex justify-between items-center mt-xl">
                      {quizSubmitted ? (
                        <div className="flex items-center gap-md">
                          <span className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${quizScore === 100 ? 'bg-green-100 text-green-800' : 'bg-primary/10 text-primary'}`}>
                            Score Achieved: {quizScore}% {quizScore === 100 ? '⭐ perfect!' : ''}
                          </span>
                          <button 
                            onClick={() => {
                              setQuizAnswers({});
                              setQuizSubmitted(false);
                              setQuizScore(0);
                            }}
                            className="text-xs font-bold text-secondary hover:underline cursor-pointer"
                          >
                            Try Again
                          </button>
                        </div>
                      ) : (
                        <div />
                      )}

                      {!quizSubmitted ? (
                        <button 
                          disabled={Object.keys(quizAnswers).length < lesson.quizQuestions.length}
                          onClick={handleSubmitQuiz}
                          className="px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 hover:bg-primary-container active:scale-95 shadow-sm ml-auto cursor-pointer"
                        >
                          Submit Answers
                        </button>
                      ) : (
                        <button 
                          onClick={() => setActiveTab('practice')}
                          className="px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl transition-all hover:bg-primary-container active:scale-95 flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <span>Go to Practice with AI</span>
                          <ArrowRight className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* PRACTICE TAB */}
                {activeTab === 'practice' && (
                  <motion.div 
                    key="practice-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-lg h-full flex flex-col justify-between"
                  >
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-lg items-start">
                      
                      {/* Left: Input capture dropzone */}
                      <div className="space-y-sm">
                        <span className="text-[10px] font-mono font-bold text-outline uppercase tracking-wider block">CAMERA snapshot CHANNEL</span>
                        
                        <div 
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          className={`relative aspect-[4/3] rounded-2xl overflow-hidden border-2 bg-neutral-950 flex flex-col items-center justify-center transition-all ${dragActive ? 'border-dashed border-primary ring-2 ring-primary' : 'border-outline-variant shadow-lg'}`}
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
                              {/* Glowing Scan Bar and coordinates mesh */}
                              {landmarkAnimation && (
                                <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                                  {/* Vertical sweeping laser line */}
                                  <div className="absolute top-0 left-0 w-full h-[3px] bg-sky-400 opacity-80 shadow-[0_0_12px_#3498db] animate-[scan_3s_infinite_linear]" />
                                  
                                  {/* Hand nodes mesh overlays */}
                                  <div className="absolute w-36 h-36 border border-sky-400/20 rounded-full animate-ping" />
                                  <div className="absolute w-24 h-24 border-2 border-dashed border-sky-400/30 rounded-full" />
                                  
                                  <div className="absolute top-[32%] left-[45%] w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8] animate-pulse" />
                                  <div className="absolute top-[45%] left-[38%] w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]" />
                                  <div className="absolute top-[38%] left-[58%] w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]" />
                                  <div className="absolute top-[58%] left-[42%] w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8] animate-ping" />
                                  <div className="absolute top-[52%] left-[54%] w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]" />
                                  
                                  <div className="absolute top-4 left-4 border-t-2 border-l-2 border-sky-400 w-6 h-6" />
                                  <div className="absolute top-4 right-4 border-t-2 border-r-2 border-sky-400 w-6 h-6" />
                                  <div className="absolute bottom-4 left-4 border-b-2 border-l-2 border-sky-400 w-6 h-6" />
                                  <div className="absolute bottom-4 right-4 border-b-2 border-r-2 border-sky-400 w-6 h-6" />
                                </div>
                              )}
                            </>
                          ) : uploadedImage ? (
                            <div className="w-full h-full relative group">
                              <img 
                                alt="Uploaded snapshot" 
                                className="w-full h-full object-contain bg-neutral-900" 
                                src={uploadedImage}
                              />
                              <button 
                                onClick={() => setUploadedImage(null)}
                                className="absolute top-3 right-3 bg-neutral-900/95 hover:bg-neutral-950 text-white p-2 rounded-xl text-xs font-mono font-bold shadow-lg cursor-pointer"
                              >
                                Remove Snapshot
                              </button>
                            </div>
                          ) : (
                            <div className="text-center p-md md:p-lg text-white/80 space-y-md">
                              <Brain className="w-12 h-12 text-primary mx-auto animate-pulse" />
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-white leading-snug">No active input snapshot</p>
                                <p className="text-xs text-white/50 max-w-xs mx-auto leading-relaxed">
                                  Boot up your camera or upload a image to grade your posture instantly.
                                </p>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-md items-center">
                                <button 
                                  onClick={startCamera}
                                  type="button"
                                  className="w-full sm:w-auto px-4 py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl transition-all active:scale-95 inline-flex items-center justify-center gap-sm cursor-pointer shadow"
                                >
                                  <Camera className="w-4 h-4 text-white shrink-0" />
                                  <span>Start Camera</span>
                                </button>
                                <button 
                                  onClick={() => fileInputRef.current?.click()}
                                  type="button"
                                  className="w-full sm:w-auto px-4 py-2.5 bg-white/10 text-white hover:bg-white/20 text-xs font-bold rounded-xl transition-all active:scale-95 inline-flex items-center justify-center gap-sm cursor-pointer"
                                >
                                  <Upload className="w-4 h-4 text-white shrink-0" />
                                  <span>Drag & Drop File</span>
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

                        {/* Interactive triggers */}
                        {(cameraActive || uploadedImage) && (
                          <div className="flex justify-between items-center text-xs">
                            {cameraActive ? (
                              <button 
                                onClick={stopCamera}
                                className="px-3 py-1.5 bg-red-600/10 text-red-600 font-bold rounded-lg hover:bg-red-600/20 active:scale-95 transition-all cursor-pointer"
                              >
                                Close Lens
                              </button>
                            ) : (
                              <div />
                            )}
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="text-xs font-bold text-primary inline-flex items-center gap-xs hover:underline cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Select another image</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right: Results calibration */}
                      <div className="space-y-sm h-full flex flex-col justify-between">
                        <span className="text-[10px] font-mono font-bold text-outline uppercase tracking-wider block">ANALYTIC ASSESSMENT COCHING</span>
                        
                        {analyzing ? (
                          <div className="bg-white border border-outline-variant rounded-2xl p-lg text-center h-[240px] flex flex-col items-center justify-center space-y-md shadow-sm">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <div>
                              <h4 className="text-sm font-bold text-on-surface">Gemini AI evaluates sign...</h4>
                              <p className="text-xs text-on-surface-variant max-w-xs mt-xs leading-relaxed font-semibold">
                                Checking key point coordinates, skeletal orientation, and finger joint placements.
                              </p>
                            </div>
                          </div>
                        ) : evaluationResult ? (
                          <div className="bg-white border border-outline-variant rounded-2xl p-lg space-y-md min-h-[240px] animate-fade-in flex flex-col justify-between shadow-sm">
                            
                            <div className="flex items-center gap-md">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl font-headline shrink-0 ${evaluationResult.matched ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {evaluationResult.score}%
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-sm font-bold font-headline text-on-surface leading-snug">
                                    {evaluationResult.matched ? 'Mastered standard sign!' : 'Calibration Required'}
                                  </h4>
                                  {evaluationResult.matched ? (
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-red-500 font-bold" />
                                  )}
                                </div>
                                <p className="text-[10px] text-on-surface-variant font-medium mt-0.5 leading-relaxed">
                                  {evaluationResult.matched ? 'Incredible work! You unlocked the full mastery award of +50 XP!!' : 'Score must meet 70% threshold to pass.'}
                                </p>
                              </div>
                            </div>

                            {/* Landmark mesh simulation visual element */}
                            {evaluationResult.landmarks && (
                              <div className="bg-surface border border-outline-variant/60 rounded-xl p-sm flex items-center justify-center h-16 relative">
                                <span className="absolute top-1 left-2 text-[8px] font-mono font-bold text-outline uppercase">Skeleton Nodes Scan</span>
                                <svg className="w-full h-8 flex items-center">
                                  {evaluationResult.landmarks.map((pt, i) => (
                                    <circle 
                                      key={i} 
                                      cx={`${pt[0]}%`} 
                                      cy={`${pt[1]}%`} 
                                      r="2" 
                                      className="fill-sky-500 animate-pulse" 
                                    />
                                  ))}
                                  {/* Link lines */}
                                  {evaluationResult.landmarks.slice(0, -1).map((pt, i) => {
                                    const nextPt = evaluationResult.landmarks![i + 1];
                                    return (
                                      <line 
                                        key={i} 
                                        x1={`${pt[0]}%`} 
                                        y1={`${pt[1]}%`} 
                                        x2={`${nextPt[0]}%`} 
                                        y2={`${nextPt[1]}%`} 
                                        className="stroke-sky-400/20" 
                                        strokeWidth="1" 
                                      />
                                    );
                                  })}
                                </svg>
                              </div>
                            )}

                            <div className="bg-surface rounded-xl p-sm border border-outline-variant/50">
                              <span className="text-[9px] font-mono font-bold text-primary uppercase block">AI feedback</span>
                              <p className="text-xs text-on-surface font-semibold leading-relaxed mt-1">
                                "{evaluationResult.feedback}"
                              </p>
                            </div>

                            {evaluationResult.suggestion && (
                              <p className="text-[11px] text-on-surface-variant font-medium">
                                <strong>Tip: </strong> {evaluationResult.suggestion}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-white border border-outline-variant rounded-2xl p-lg text-center h-[240px] flex flex-col items-center justify-center space-y-md text-on-surface-variant shadow-sm">
                            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                              <Sparkles className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-on-surface">Ready to Assess Poses</h4>
                              <p className="text-xs max-w-xs leading-relaxed font-semibold">
                                Provide an image capture and click assessment below to grade coordinates.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                    <div className="pt-md border-t border-outline-variant flex items-center justify-between mt-xl">
                      <p className="text-[10px] text-on-surface-variant leading-relaxed max-w-xs font-semibold hidden sm:block">
                        💡 Face light sources straight-on to get pristine landmark recognition scores.
                      </p>
                      
                      <button 
                        onClick={handleEvaluateSign}
                        disabled={analyzing || (!cameraActive && !uploadedImage)}
                        className="px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-all hover:bg-primary-container active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer ml-auto"
                      >
                        {analyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Grading...</span>
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 text-white shrink-0" />
                            <span>Grade Posture with AI</span>
                          </>
                        )}
                      </button>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>

        </div>

      </div>

      {/* Styled animation keyframes inside global scoped styles tag */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
