import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lesson, RecentResult, Achievement } from '../types';
import { attemptApi, AttemptResponse } from '../services/api/attemptApi';
import { PracticeStatsResponse } from '../services/api/practiceApi';
import { Zap, Flame, Award, ArrowRight, X, Play, BookOpen, CheckCircle2, Trophy } from 'lucide-react';
import otterMascot from '../assets/otter-mascot.jpg';

interface DashboardViewProps {
  currentUser: User;
  lessons: Lesson[];
  recentResults: RecentResult[];
  achievements: Achievement[];
  practiceStats: PracticeStatsResponse | null;
  onNavigateToTab: (tab: 'dashboard' | 'lessons' | 'practice' | 'profile' | 'admin') => void;
  onSelectLesson: (lessonId: string) => void;
  onStartDailyChallenge: () => void;
}

// Bỏ backdrop-blur và dùng bg-white đặc để loại bỏ lag hoàn toàn nhưng vẫn giữ nguyên cảm giác Ceramic (Gốm) bóng bẩy nhờ shadow.
const ceramicCard = "bg-white border border-slate-100 shadow-[inset_0_4px_6px_rgba(255,255,255,0.9),0_20px_40px_-10px_rgba(203,213,225,0.4)] rounded-[2.5rem] relative overflow-hidden group";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 250, damping: 25 } }
};

const ChatBubbleTicker = React.memo(() => {
  const tips = [
    "Mỗi ký hiệu bạn học hôm nay là một cây cầu kết nối yêu thương.",
    "Kiên trì từng chút một, bạn sẽ giỏi hơn chính mình hôm qua.",
    "Đừng sợ sai — mỗi lần luyện tập là một lần tiến bộ.",
    "Giữ chuỗi ngày học liên tục để mở khóa huy hiệu Bậc thầy nhé!",
    "SignMentor AI luôn sẵn sàng đồng hành cùng bạn."
  ];
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex-1 bg-white px-4 py-3.5 rounded-[1.5rem] rounded-bl-sm border border-slate-100 shadow-[0_10px_25px_-5px_rgba(203,213,225,0.4)] relative mb-2">
      <div className="h-5 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentTip}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-slate-600 font-semibold text-sm absolute w-full truncate"
          >
            {tips[currentTip]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
});

const CinematicVideoBackground = React.memo(() => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(e => console.error("Autoplay prevented:", e));
    }
  }, []);

  return (
    <video 
      ref={videoRef}
      autoPlay 
      loop 
      muted 
      playsInline 
      className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
      src="/A2.mp4" 
    />
  );
});

export default function DashboardView({
  currentUser,
  lessons,
  recentResults,
  practiceStats,
  onNavigateToTab,
  onSelectLesson,
  onStartDailyChallenge
}: DashboardViewProps) {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [fullHistory, setFullHistory] = useState<AttemptResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);



  const recommendations = lessons.filter(l => l.progress < 100).slice(0, 2);

  // Real data from GET /api/practice/stats - replaces the old fixed "65%" mock.
  const proficiency = practiceStats?.proficiency ?? 0;
  const remainingVocabs = practiceStats
    ? Math.max(practiceStats.totalVocabs - practiceStats.learnedCount, 0)
    : 0;
  const progressRingCircumference = 251.2;
  const progressRingOffset = progressRingCircumference * (1 - proficiency / 100);

  // Streak data (real, from BE). weekActivity[6] is today, [0] is 6 days ago.
  const currentStreak = practiceStats?.currentStreak ?? 0;
  const longestStreak = practiceStats?.longestStreak ?? 0;
  const weekDays = React.useMemo(() => {
    const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const week = practiceStats?.weekActivity ?? [];
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return { label: labels[d.getDay()], active: !!week[i], isToday: i === 6 };
    });
  }, [practiceStats]);

  const openHistoryModal = async () => {
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await attemptApi.getMyAttempts(0, 20);
      setFullHistory(res.data.content);
    } catch (error) {
      console.error('Failed to load performance history', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen pb-12 w-full">
      {/* 1. Tối ưu Background: Đổi thành background tĩnh, bỏ mix-blend-multiply và animate liên tục để GPU không bị quá tải */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-pink-200/30 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] bg-cyan-200/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] bg-yellow-200/30 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="relative z-10 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">

          {/* WELCOME BENTO - Col span 8 */}
          <motion.div variants={itemVariants} className="md:col-span-8 border border-white/20 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] rounded-[2.5rem] relative overflow-hidden group p-8 md:p-10 flex flex-col justify-center min-h-[220px] bg-slate-900">
            {/* Cinematic Video Background (Uniform Dark Overlay) */}
            <CinematicVideoBackground />
            {/* Uniform dark overlay to make foreground pop while keeping video visible */}
            <div className="absolute inset-0 bg-slate-900/60 z-0 pointer-events-none" />
            
            <div className="relative z-10 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-4 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-white font-bold text-[10px] tracking-[0.2em] uppercase">Chào mừng trở lại</span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight drop-shadow-md">
                Xin chào, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-300 bg-[length:200%_auto]">{currentUser.name}</span>
              </h1>
              
              {/* Ticker / Mascot Area */}
              <div className="flex items-end gap-5 mb-10 max-w-lg">
                {/* Mascot Avatar (Premium UI Geometric Otter) */}
                <div className="relative w-28 h-28 shrink-0 z-20">
                  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_15px_20px_rgba(0,0,0,0.15)] overflow-visible">
                    <defs>
                      <filter id="inner-glow">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
                        <feFlood floodColor="white" floodOpacity="0.2" />
                        <feComposite in2="shadowDiff" operator="in" />
                        <feComposite in2="SourceGraphic" operator="over" />
                      </filter>
                    </defs>

                    {/* Tail */}
                    <path d="M 60 90 Q 90 120 105 90 Q 90 100 60 90 Z" fill="#6B4423" />

                    {/* Left Arm (Resting back) */}
                    <rect x="28" y="65" width="14" height="25" rx="7" fill="#8B5A2B" transform="rotate(20 35 77)" />

                    {/* Body */}
                    <rect x="40" y="50" width="40" height="55" rx="20" fill="#8B5A2B" filter="url(#inner-glow)" />
                    
                    {/* Belly */}
                    <rect x="48" y="60" width="24" height="40" rx="12" fill="#E6C287" />

                    {/* Left Leg */}
                    <rect x="40" y="95" width="14" height="12" rx="6" fill="#6B4423" />
                    {/* Right Leg */}
                    <rect x="66" y="95" width="14" height="12" rx="6" fill="#6B4423" />

                    {/* Ears */}
                    <circle cx="25" cy="35" r="10" fill="#6B4423" />
                    <circle cx="95" cy="35" r="10" fill="#6B4423" />

                    {/* Head */}
                    <rect x="20" y="25" width="80" height="50" rx="25" fill="#8B5A2B" filter="url(#inner-glow)" />

                    {/* Muzzle */}
                    <rect x="35" y="45" width="50" height="25" rx="12.5" fill="#E6C287" />

                    {/* Nose */}
                    <rect x="52" y="45" width="16" height="10" rx="5" fill="#2D1C15" />

                    {/* Cheeks */}
                    <circle cx="42" cy="58" r="4" fill="#FF9999" opacity="0.6" />
                    <circle cx="78" cy="58" r="4" fill="#FF9999" opacity="0.6" />

                    {/* Eyes (Blinking) */}
                    <motion.g
                      style={{ transformOrigin: "60px 40px" }}
                      animate={{ scaleY: [1, 0.1, 1] }}
                      transition={{ duration: 0.25, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }}
                    >
                      <circle cx="45" cy="40" r="4.5" fill="#2D1C15" />
                      <circle cx="75" cy="40" r="4.5" fill="#2D1C15" />
                      <circle cx="43.5" cy="38.5" r="1.5" fill="white" />
                      <circle cx="73.5" cy="38.5" r="1.5" fill="white" />
                    </motion.g>

                    {/* Mouth */}
                    <path d="M 52 58 Q 60 64 68 58" stroke="#2D1C15" strokeWidth="2.5" fill="none" strokeLinecap="round" />

                    {/* Graduation Cap */}
                    <path d="M 45 20 L 45 28 C 45 32, 75 32, 75 28 L 75 20 Z" fill="#0F172A" />
                    <polygon points="60,5 85,15 60,25 35,15" fill="#1E293B" />
                    <line x1="60" y1="15" x2="75" y2="28" stroke="#FBBF24" strokeWidth="2" />
                    <circle cx="75" cy="28" r="2" fill="#FBBF24" />

                    {/* Right Arm (Waving!) */}
                    <motion.g
                      style={{ transformOrigin: "87px 62px" }}
                      animate={{ rotate: [0, 60, -10, 60, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                    >
                      <rect x="80" y="55" width="14" height="30" rx="7" fill="#8B5A2B" filter="url(#inner-glow)" />
                      <circle cx="87" cy="62" r="3" fill="#6B4423" opacity="0.3" />
                    </motion.g>
                  </svg>
                </div>

                {/* Chat Bubble Ticker */}
                <ChatBubbleTicker />
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={onStartDailyChallenge}
                className="relative overflow-hidden bg-white text-indigo-600 px-8 py-4 rounded-2xl font-extrabold shadow-[0_10px_20px_rgba(99,102,241,0.15),inset_0_-4px_0_rgba(226,232,240,0.6)] hover:shadow-[0_15px_25px_rgba(99,102,241,0.25),inset_0_-4px_0_rgba(226,232,240,0.6)] transition-all flex items-center gap-3 border border-slate-100"
              >
                <Zap className="w-5 h-5 text-indigo-500 fill-indigo-100" />
                <span>Bắt Đầu Thử Thách Hôm Nay</span>
              </motion.button>
            </div>
          </motion.div>

          {/* STREAK BENTO - Col span 4 */}
          <motion.div variants={itemVariants} className={`md:col-span-4 ${ceramicCard} p-8 flex flex-col justify-between items-center text-center min-h-[220px]`}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-orange-400/10 blur-[30px] pointer-events-none rounded-full" />
            
            <div className="relative z-10 w-full flex justify-between items-center mb-6">
              <span className="text-slate-400 font-bold text-[10px] tracking-[0.2em] uppercase">Chuỗi Ngày Học</span>
              <div className="p-2 bg-orange-50 rounded-xl">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
              {/* Flame chỉ "sống" (cháy + nổi lên) khi chuỗi đang chạy; chuỗi đứt thì xám tĩnh. */}
              <motion.div
                animate={currentStreak > 0 ? { y: [0, -8, 0] } : { y: 0 }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="mb-1"
              >
                <svg width="56" height="56" viewBox="0 0 24 24" fill={currentStreak > 0 ? 'url(#flame-grad)' : '#e2e8f0'} stroke={currentStreak > 0 ? 'url(#flame-stroke)' : '#cbd5e1'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-flame">
                  <defs>
                    <linearGradient id="flame-grad" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#ea580c" />
                      <stop offset="50%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                    <linearGradient id="flame-stroke" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#c2410c" />
                      <stop offset="100%" stopColor="#fde047" />
                    </linearGradient>
                  </defs>
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                </svg>
              </motion.div>
              <h3 className="text-5xl font-display font-extrabold text-slate-800 tracking-tighter">
                {currentStreak} <span className="text-lg text-slate-400 font-bold uppercase tracking-widest">Ngày</span>
              </h3>
              {currentStreak === 0 && (
                <p className="text-[11px] text-slate-400 font-medium mt-1">Luyện tập hôm nay để bắt đầu chuỗi mới!</p>
              )}
            </div>

            {/* Dải 7 ngày gần nhất - đốm cam = ngày có học, viền = hôm nay. Thay cho thanh ngang vô nghĩa cũ. */}
            <div className="w-full mt-5 relative z-10 flex justify-between px-1">
              {weekDays.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    day.active
                      ? 'bg-gradient-to-br from-orange-400 to-yellow-400 shadow-[0_2px_6px_rgba(249,115,22,0.4)]'
                      : 'bg-slate-100'
                  } ${day.isToday ? 'ring-2 ring-offset-2 ring-orange-300' : ''}`}>
                    {day.active && <Flame className="w-3 h-3 text-white" fill="currentColor" />}
                  </div>
                  <span className={`text-[9px] font-bold ${day.isToday ? 'text-orange-500' : 'text-slate-400'}`}>
                    {day.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Kỷ lục chuỗi dài nhất */}
            <div className="w-full mt-4 pt-3 relative z-10 flex items-center justify-center gap-1.5 border-t border-slate-100">
              <Trophy className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
              <span className="text-[11px] font-bold text-slate-500">Kỷ lục: {longestStreak} ngày</span>
              {currentStreak > 0 && currentStreak >= longestStreak && (
                <span className="ml-1 text-[8px] font-extrabold uppercase tracking-wide text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">Kỷ lục mới!</span>
              )}
            </div>
          </motion.div>

          {/* PROGRESS BENTO - Col span 5 */}
          <motion.div variants={itemVariants} className={`md:col-span-5 ${ceramicCard} p-8 flex flex-col min-h-[240px]`}>
            {/* Tiêu đề góc trên cùng bên trái */}
            <div className="flex items-center gap-2.5 mb-6 w-full z-10">
              <div className="w-9 h-9 rounded-full bg-cyan-50 flex items-center justify-center border border-cyan-100">
                <BookOpen className="w-4 h-4 text-cyan-500" />
              </div>
              <h3 className="font-display text-xl text-slate-800 font-bold">Chương Trình Học</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 z-10 flex-1">
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/10 blur-[30px] pointer-events-none rounded-full" />
                <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="progress-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f1f5f9" strokeWidth="8" />
                  <motion.circle 
                    cx="50" cy="50" fill="transparent" r="40" 
                    stroke="url(#progress-grad)" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    initial={{ strokeDasharray: progressRingCircumference, strokeDashoffset: progressRingCircumference }}
                    animate={{ strokeDashoffset: progressRingOffset }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center z-10">
                  <span className="text-3xl font-display font-extrabold text-slate-800 tracking-tighter">{proficiency}%</span>
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <p className="text-slate-500 text-sm mb-5 leading-relaxed">
                  {remainingVocabs > 0 ? (
                    <>Học thêm <span className="font-bold text-slate-700">{remainingVocabs} từ vựng</span> nữa để nâng cao độ thành thạo của bạn.</>
                  ) : (
                    <>Bạn đã học thuộc <span className="font-bold text-slate-700">toàn bộ từ vựng</span> hiện có. Xuất sắc!</>
                  )}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigateToTab('lessons')}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 mx-auto sm:mx-0"
                >
                  Tiếp Tục <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* RECOMMENDED BENTO - Col span 7 */}
          <motion.div variants={itemVariants} className={`md:col-span-7 ${ceramicCard} p-8 flex flex-col justify-between min-h-[240px]`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl font-bold text-slate-800">Đề Xuất Cho Bạn</h3>
              <button onClick={() => onNavigateToTab('lessons')} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1">
              {recommendations.map((lesson, idx) => (
                <div 
                  key={lesson.id}
                  onClick={() => onSelectLesson(lesson.id)}
                  className="group relative rounded-2xl bg-white border border-slate-100 shadow-[0_4px_15px_rgba(226,232,240,0.5)] overflow-hidden cursor-pointer flex flex-col hover:shadow-[0_15px_30px_rgba(226,232,240,0.8)] transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="h-28 relative overflow-hidden">
                    <img className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" src={lesson.image} alt={lesson.title} />
                    <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors" />
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300 ease-out delay-75">
                        <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                      </div>
                    </div>

                    <div className="absolute top-2 right-2 px-2.5 py-0.5 bg-white text-indigo-600 text-[10px] font-extrabold uppercase tracking-widest rounded-full shadow-sm">
                      {lesson.level}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between bg-white z-10 relative">
                    <h4 className="font-display font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">{lesson.title}</h4>
                    <div className="flex items-center text-[11px] mt-3">
                      <span className={`flex items-center gap-1 font-bold px-2 py-1 rounded-md ${
                        lesson.progress === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" /> {lesson.progress}% hoàn thành
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* LEVEL UP BENTO - Col span 7 */}
          <motion.div variants={itemVariants} className={`md:col-span-7 ${ceramicCard} p-0 flex flex-col sm:flex-row items-center overflow-hidden min-h-[200px]`}>
            <div className="p-8 sm:w-2/3 flex flex-col justify-center h-full relative z-10">
              <div className="inline-flex items-center gap-1.5 mb-3">
                <Award className="w-4 h-4 text-indigo-500" />
                <span className="text-indigo-600 font-bold text-[10px] tracking-[0.2em] uppercase">Thành Thạo</span>
              </div>
              <h4 className="font-display text-2xl font-extrabold text-slate-800 mb-2">Sẵn sàng lên trình?</h4>
              <p className="text-slate-500 text-sm mb-6 max-w-sm">
                Mở khóa module <strong className="text-slate-700">Ký Hiệu Khẩn Cấp</strong> để nhận phản hồi AI theo thời gian thực và huy hiệu cộng đồng.
              </p>
              <div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigateToTab('lessons')}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md transition-all hover:bg-indigo-500"
                >
                  Tiếp Tục Module
                </motion.button>
              </div>
            </div>
            <div className="hidden sm:block sm:w-1/3 h-full relative">
              <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent z-10" />
              <img
                className="w-full h-full object-cover scale-105"
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Cộng đồng học ngôn ngữ ký hiệu"
              />
            </div>
          </motion.div>

          {/* RECENT RESULTS BENTO - Col span 5 */}
          <motion.div variants={itemVariants} className={`md:col-span-5 ${ceramicCard} p-8 flex flex-col min-h-[200px]`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl font-bold text-slate-800">Độ Chính Xác Gần Đây</h3>
              <button onClick={openHistoryModal} className="text-indigo-500 font-bold text-xs uppercase tracking-wider hover:text-indigo-600 transition-colors">
                Xem Tất Cả
              </button>
            </div>
            
            <div className="space-y-3 flex-1">
              {recentResults.slice(0, 3).map((res, index) => (
                <div 
                  key={res.id} 
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-md transition-all cursor-default group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{res.sign}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">{res.statusText}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-display font-extrabold ${res.accuracy >= 90 ? 'text-emerald-500' : 'text-indigo-500'}`}>
                      {res.accuracy}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Performance History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white max-w-md w-full rounded-[2.5rem] p-8 shadow-2xl border border-slate-100"
          >
            <header className="flex justify-between items-center pb-5 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                  <Award className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-2xl text-slate-800">Lịch Sử</h3>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Đánh Giá Từ AI</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors text-slate-400 hover:text-slate-600 border border-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {historyLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
              ) : fullHistory.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-10">Chưa có lần luyện tập nào. Bắt đầu học ngay!</p>
              ) : (
                fullHistory.map(att => (
                  <div key={att.attemptId} className="p-4 bg-slate-50 hover:bg-indigo-50/50 transition-colors rounded-2xl flex justify-between items-center border border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-800">{att.word}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">{att.categoryName} • {new Date(att.attemptedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    <span className={`font-display text-xl font-extrabold ${att.isCorrect ? 'text-emerald-500' : 'text-indigo-500'}`}>
                      {att.confidence != null ? `${Math.round(att.confidence)}%` : (att.isCorrect ? 'Chính xác' : '—')}
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full mt-6 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-md active:scale-[0.98]"
            >
              Đóng
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
