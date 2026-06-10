/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Award, Sparkles, Flame, Clock, BookOpen, GraduationCap, 
  Lock, Video, MessageSquare, Cpu, Check, CheckCircle2, ChevronRight, Play
} from 'lucide-react';
import { UserStats } from '../types';

interface ProfileViewProps {
  stats: UserStats;
  onUpdateNameAndBio: (name: string, bio: string, goal: string) => void;
  onStartDailyChallenge?: () => void;
}

export default function ProfileView({ stats, onUpdateNameAndBio, onStartDailyChallenge }: ProfileViewProps) {
  // Let's set name to "Alex Chen" to match the photo
  const [name, setName] = useState<string>('Alex Chen');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  
  // Custom states matching photo values
  const practiceTime = "24.5h";
  const lessonsCount = "148";
  const streakDays = "12 Days";

  const handleSave = () => {
    onUpdateNameAndBio(name, '', '');
    setIsEditing(false);
    setSuccessMsg('Profile updated successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const recentPracticeItems = [
    {
      id: 1,
      title: 'ASL Alphabet: G to L',
      meta: 'Yesterday • 15 mins',
      score: '92%',
      type: 'video',
      icon: Video
    },
    {
      id: 2,
      title: 'Basic Conversational Signs',
      meta: '2 days ago • 22 mins',
      score: '85%',
      type: 'chat',
      icon: MessageSquare
    },
    {
      id: 3,
      title: 'AI Speed Challenge',
      meta: '3 days ago • 10 mins',
      score: '78%',
      type: 'ai',
      icon: Cpu
    }
  ];

  return (
    <div className="space-y-lg animate-fade-in text-on-surface">
      
      {/* 1. TOP LEARNER OVERVIEW GREETING HEADER (AS IN MOCKUP 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md border-b border-[#F0F2FA] pb-md">
        <div>
          <span className="text-[10px] sm:text-xs font-mono font-black text-primary uppercase tracking-widest block">
            LEARNER OVERVIEW
          </span>
          <h2 className="font-headline text-3xl font-black text-on-surface tracking-tight mt-1">
            Welcome back, {name.split(' ')[0]}
          </h2>
        </div>
        
        <button 
          type="button" 
          onClick={onStartDailyChallenge}
          className="bg-[#3F51B5] hover:bg-[#303F9F] text-white font-extrabold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 tracking-wide shrink-0 shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-white text-[#E8EAF6]" />
          <span>Start Daily Challenge</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-md flex items-center gap-sm animate-pulse-slow">
          <Check className="w-4.5 h-4.5 text-emerald-600" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {/* 2. CORE STATS ROWS AND SOLID BRAND PROGRESS BLOCK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        
        {/* Stat 1: Practice Time */}
        <div className="bg-white border border-[#E8EAF6] rounded-3xl p-md flex flex-col justify-between shadow-xs min-h-[120px] relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold font-mono text-[#4CAF50] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              +12% vs last week
            </span>
            <div className="w-8 h-8 rounded-full bg-[#E8EAF6] text-[#3F51B5] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-3xl font-black text-on-surface tracking-tight">{practiceTime}</h4>
            <p className="text-xs text-outline font-semibold mt-0.5">Total Practice Time</p>
          </div>
        </div>

        {/* Stat 2: Lessons Completed */}
        <div className="bg-white border border-[#E8EAF6] rounded-3xl p-md flex flex-col justify-between shadow-xs min-h-[120px] relative">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold font-mono text-[#3F51B5] bg-[#E8EAF6] border border-transparent px-2.5 py-0.5 rounded-full">
              On Track
            </span>
            <div className="w-8 h-8 rounded-full bg-[#E8EAF6] text-[#3F51B5] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-3xl font-black text-on-surface tracking-tight">{lessonsCount}</h4>
            <p className="text-xs text-outline font-semibold mt-0.5">Lessons Completed</p>
          </div>
        </div>

        {/* Stat 3: Current Streak */}
        <div className="bg-white border border-[#E8EAF6] rounded-3xl p-md flex flex-col justify-between shadow-xs min-h-[120px] relative">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold font-mono text-[#FF9800] bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-full">
              Personal Best!
            </span>
            <div className="w-8 h-8 rounded-full bg-[#E8EAF6] text-[#2196F3] flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            </div>
          </div>
          <div>
            <h4 className="text-3xl font-black text-on-surface tracking-tight">{streakDays}</h4>
            <p className="text-xs text-outline font-semibold mt-0.5">Current Streak</p>
          </div>
        </div>

        {/* Brand progress card (Mockup exact visual solid container) */}
        <div className="bg-gradient-to-br from-[#5C6BC0] to-[#3F51B5] text-white rounded-3xl p-md shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[130px]">
          
          {/* Overlapping background Cap icon visual */}
          <GraduationCap className="absolute -right-4 -bottom-4 w-28 h-28 text-white/5 pointer-events-none" />

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest block font-mono">
              Current Progress
            </span>
            <h4 className="text-md font-extrabold tracking-tight">Level 2 Beginner</h4>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between items-center text-[10px] font-mono text-[#E8EAF6] font-bold">
              <span>650 / 1000 XP to Level 3</span>
            </div>
            
            {/* Custom high aesthetic progress capsule bar */}
            <div className="bg-indigo-950/40 rounded-full h-2 w-full overflow-hidden border border-white/5">
              <div 
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: '65%' }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* 3. CORE ACHIEVEMENTS GRID (60%) AND RECENT PRACTICE TIMELINE (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg pt-sm">
        
        {/* ACHIEVEMENTS GRID COLUMN (Takes 3 of 5 cols) */}
        <div className="lg:col-span-3 bg-white border border-[#E8EAF6] rounded-3xl p-lg space-y-md shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-sm border-b border-[#F6F8FC]">
            <h3 className="font-headline text-md font-bold text-on-surface">
              Achievements
            </h3>
            <button 
              onClick={() => alert("Showing all unseated achievements! There are 24 badges left to earn in this catalog series.")}
              className="text-xs font-bold text-[#3F51B5] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-md pt-xs">
            
            {/* Badge 1: Daily Streak */}
            <div className="p-md bg-white border border-[#F0F2FA] rounded-2xl flex flex-col items-center text-center space-y-2 hover:shadow-xs transition-shadow">
              <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
                <Award className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-on-surface">Daily Streak</h5>
                <span className="text-[10px] text-[#7E88AC] font-semibold block mt-0.5">10 Days Hero</span>
              </div>
            </div>

            {/* Badge 2: Fast Learner */}
            <div className="p-md bg-white border border-[#F0F2FA] rounded-2xl flex flex-col items-center text-center space-y-2 hover:shadow-xs transition-shadow">
              <div className="w-10 h-10 rounded-full bg-[#E3F2FD] border border-[#BBDEFB] flex items-center justify-center text-blue-500">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-on-surface">Fast Learner</h5>
                <span className="text-[10px] text-[#7E88AC] font-semibold block mt-0.5">3 Lessons/Day</span>
              </div>
            </div>

            {/* Badge 3: Perfect Score */}
            <div className="p-md bg-white border border-[#F0F2FA] rounded-2xl flex flex-col items-center text-center space-y-2 hover:shadow-xs transition-shadow">
              <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-on-surface">Perfect Score</h5>
                <span className="text-[10px] text-[#7E88AC] font-semibold block mt-0.5">100% Accuracy</span>
              </div>
            </div>

            {/* Badge 4: Locked Mystery Badge */}
            <div className="p-md bg-[#FAFAFD] border border-dashed border-[#E5E7EB] rounded-2xl flex flex-col items-center text-center space-y-2 opacity-70">
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-[#7E88AC]">Mystery Badge</h5>
                <span className="text-[10px] text-outline font-medium block mt-0.5">Unlocks at Level 3</span>
              </div>
            </div>

          </div>
        </div>

        {/* RECENT PRACTICE TIMELINE COLUMN (Takes 2 of 5 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E8EAF6] rounded-3xl p-lg space-y-md shadow-xs">
          <div className="pb-sm border-b border-[#F6F8FC]">
            <h3 className="font-headline text-md font-bold text-on-surface">
              Recent Practice
            </h3>
          </div>

          <div className="space-y-sm pt-xs">
            {recentPracticeItems.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div key={item.id} className="flex items-center justify-between p-sm bg-[#FAFAFD] hover:bg-[#F3F4FB] rounded-2xl border border-outline-variant/30 transition-all">
                  <div className="flex items-center gap-sm">
                    <div className="w-9 h-9 rounded-xl bg-[#E3F2FD] text-blue-600 flex items-center justify-center shrink-0">
                      <IconComponent className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-on-surface leading-snug line-clamp-1">{item.title}</h5>
                      <span className="text-[10px] text-[#7E88AC] font-semibold mt-0.5 block">{item.meta}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-black text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <span className="text-[10px]">✓</span> {item.score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4. LEVEL UP CALL-TO-ACTION LEVEL BANNER WITH ROTATED POLAROID PREVIEW */}
      <div className="bg-[#E8EAF6]/80 border border-[#C5CAE9] rounded-3xl p-lg flex flex-col md:flex-row items-center justify-between gap-lg relative overflow-hidden shadow-xs mt-lg">
        
        {/* Main core call-out copy */}
        <div className="space-y-md max-w-lg z-15 text-center md:text-left">
          <h3 className="font-headline text-2xl font-black text-[#1A237E] leading-tight">
            Ready to level up?
          </h3>
          <p className="text-xs text-[#283593] font-semibold leading-relaxed">
            Complete the "Emergency Signs" module to unlock the Intermediate badge and gain access to live peer practice sessions.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-md pt-sm justify-center md:justify-start">
            <button 
              type="button" 
              onClick={() => alert('Launching Lesson maps... Select Emergency Signs cluster!')}
              className="w-full sm:w-auto bg-[#3F51B5] hover:bg-[#303F9F] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shrink-0 transition-transform hover:scale-[1.02] active:scale-95 shadow cursor-pointer"
            >
              Continue Module
            </button>
            <button 
              type="button" 
              onClick={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
              className="w-full sm:w-auto bg-white border border-[#C5CAE9] hover:bg-neutral-50 text-[#1A237E] font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              {isEditing ? "Save Profile Settings" : "Modify Name"}
            </button>
          </div>

          {isEditing && (
            <div className="pt-sm animate-fade-in text-left">
              <label className="text-[10px] font-mono font-bold text-[#1A237E]/60 uppercase tracking-wider block mb-1">
                EDIT REAL GUEST NAME:
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="p-2 text-xs font-semibold bg-white rounded-xl outline-none focus:ring-1 focus:ring-primary w-full border border-[#C5CAE9]"
                placeholder="Enter Student Name"
              />
            </div>
          )}
        </div>

        {/* Aesthetic Polaroid design piece matching mockup 2 exactly on right */}
        <div className="z-10 shrink-0 select-none pb-2">
          <div className="bg-white p-2.5 pb-4 rounded-xl shadow-lg border border-neutral-100 rotate-2 hover:rotate-0 transition-transform duration-300 w-52">
            <div className="aspect-[4/3] rounded-md overflow-hidden bg-neutral-100 mb-2">
              <img 
                alt="SignMentor peer group practicing together" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=400&auto=format&fit=crop" 
              />
            </div>
            {/* Hand signing text note at bottom of photo */}
            <div className="text-[10px] font-mono text-[#5C6BC0] font-black text-center tracking-tight uppercase leading-none">
              SignMentor Peers
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
