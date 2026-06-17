import { useState } from 'react';
import { 
  Sparkles, Flame, Clock, Award, Star, ArrowRight, CheckCircle, Brain, Play, TrendingUp
} from 'lucide-react';
import { Lesson, UserStats } from '../types';

interface DashboardViewProps {
  stats: UserStats;
  lessons: Lesson[];
  onNavigateToLessons: (category?: string) => void;
  onStartLesson: (lesson: Lesson) => void;
}

export default function DashboardView({ 
  stats, 
  lessons, 
  onNavigateToLessons, 
  onStartLesson 
}: DashboardViewProps) {
  const recommendedLesson = lessons.find(l => l.progress > 0 && l.progress < 100) || lessons.find(l => l.progress === 0) || lessons[0];
  
  const otherRecommendations = lessons
    .filter(l => l.id !== recommendedLesson?.id)
    .slice(0, 2);

  const totalLessons = lessons.length || 8;
  const completedCount = lessons.filter(l => l.progress === 100).length;
  const averageProgress = Math.round(lessons.reduce((acc, curr) => acc + curr.progress, 0) / totalLessons);
  const progressPercent = Math.min(100, Math.max(10, Math.round((completedCount / totalLessons) * 100)));

  const radius = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const recentResults = [
    { title: 'ASL Letter "A"', time: 'Practiced 10 mins ago', accuracy: 94, status: 'Completed' },
    { title: 'ASL Phrase "Hello"', time: 'Practiced Yesterday', accuracy: 88, status: 'Mastered' },
    { title: 'ASL Number "3"', time: 'Practiced 2 days ago', accuracy: 100, status: 'Mastered' },
  ];

  return (
    // Đổi space-y-lg thành space-y-8
    <div className="space-y-8 animate-fade-in w-full">
      {/* Premium Dashboard Greeting Header */}
      {/* Đổi gap-md -> gap-4, mt-sm -> mt-2 */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-outline-variant p-6 rounded-2xl shadow-sm">
        <div>
          <span className="font-mono text-xs font-bold text-primary uppercase tracking-widest bg-primary/5 px-2.5 py-1 rounded-full">
            STUDENT DASHBOARD
          </span>
          <h2 className="font-headline text-2xl md:text-3xl text-on-surface mt-2 font-bold leading-tight">
            Hello, Learner!
          </h2>
          <p className="text-sm md:text-base text-on-surface-variant font-medium mt-1">
            Ready to master some new signs today? Your path to ASL fluency looks beautiful.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl shrink-0">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono font-bold text-on-surface">XP Target Goal: 200/Day</span>
        </div>
      </header>

      {/* Primary Workspace */}
      {/* Đổi gap-lg -> gap-6 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: 2/3 width on large screens */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Circular Learning Progress Card */}
          {/* Đổi p-lg -> p-6, gap-lg -> gap-6 */}
          <div className="bg-white border border-outline-variant rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
            
            {/* SVG Interactive Circular Gauge Widget */}
            <div className="relative shrink-0 w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r={radius} className="stroke-slate-100 fill-transparent" strokeWidth={strokeWidth} />
                <circle cx="56" cy="56" r={radius} className="stroke-indigo-600 fill-transparent transition-all duration-1000 ease-out" 
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black font-headline text-slate-800">{progressPercent}%</span>
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Mastered</span>
              </div>
            </div>

            {/* Explanation & Action column */}
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h3 className="text-lg font-bold font-headline text-slate-800 leading-snug">
                Learning Progress
              </h3>
              <p className="text-sm text-slate-600 font-medium">
                You're making great progress! Finish {Math.max(1, 3 - completedCount)} more lessons to unlock the Advanced Handshapes module.
              </p>
              
              {/* Đổi mt-lg -> mt-4, gap-md -> gap-4 */}
              <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 pt-2">
                <button
                  type="button"
                  onClick={() => recommendedLesson && onStartLesson(recommendedLesson)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 shadow-md"
                >
                  <Play className="w-4 h-4 fill-white shrink-0" />
                  <span>Continue Learning</span>
                </button>
                <div className="text-xs text-slate-500 font-semibold">
                  Course average: <span className="text-indigo-600 font-bold">{averageProgress}% completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended for You List */}
          {/* Đổi p-lg -> p-6, space-y-md -> space-y-4 */}
          <div className="bg-white border border-outline-variant p-6 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-headline text-slate-800 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                <span>Recommended for You</span>
              </h3>
              <button onClick={() => onNavigateToLessons()} className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {lessons.slice(0, 2).map((lesson) => (
                <div key={lesson.id} onClick={() => onStartLesson(lesson)}
                  className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden cursor-pointer flex flex-col group hover:scale-[1.01] hover:border-indigo-400 transition-all"
                >
                  <div className="relative aspect-video w-full overflow-hidden shrink-0">
                    <img alt={lesson.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" src={lesson.imageUrl} />
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-indigo-800">
                      {lesson.category}
                    </div>
                  </div>
                  {/* Đổi p-md -> p-4 */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {lesson.title}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium line-clamp-2 mt-1 leading-relaxed">
                        {lesson.description}
                      </p>
                    </div>
                    {/* Đổi mt-sm -> mt-3, pt-xs -> pt-2 */}
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mt-3 pt-2 border-t border-slate-200">
                      <span>{lesson.difficulty}</span>
                      <span className="text-indigo-600 font-bold">{lesson.progress}% completed</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 1/3 width on large screens */}
        {/* Đổi space-y-lg -> space-y-6 */}
        <div className="space-y-6">
          
          {/* Daily Streak Card */}
          {/* Đổi p-lg -> p-6 */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 to-indigo-950 p-6 text-white shadow-xl flex flex-col justify-between h-52">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-16 h-16 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider font-mono">
                Daily Streak
              </div>
              <div className="relative flex items-center justify-center">
                <Flame className="w-10 h-10 text-orange-500 fill-orange-500 stroke-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse" />
              </div>
            </div>

            <div>
              <h3 className="text-3xl font-black font-headline text-white mt-1">
                {stats.streakDays} Days
              </h3>
              <p className="text-xs text-white/80 font-medium leading-relaxed mt-1">
                Keep it up! Reach 7 days for a profile badge and bonus multipliers.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-white/60">
                <span>GOAL: 7 DAYS</span>
                <span>{stats.streakDays}/7 completed</span>
              </div>
              <div className="bg-white/20 rounded-full h-1.5 w-full overflow-hidden">
                <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (stats.streakDays / 7) * 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Level Board */}
          {/* Đổi p-lg -> p-6 */}
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              {/* Đổi mb-sm -> mb-4 */}
              <h3 className="text-sm font-extrabold font-mono text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Award className="text-indigo-600 w-4 h-4 stroke-[2.5]" />
                <span>Level Tracker</span>
              </h3>
              {/* Đổi my-sm -> my-4 */}
              <div className="flex items-center gap-4 my-4">
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-black font-headline shadow-inner shrink-0">
                  {stats.level}
                </div>
                <div>
                  <p className="font-bold text-slate-800 leading-tight">Level {stats.level} Novice</p>
                  <p className="text-xs text-slate-500 font-medium">Earn {200 - (stats.xp % 200)} more XP for level {stats.level + 1}</p>
                </div>
              </div>
              
              {/* Đổi mt-md -> mt-4 */}
              <div className="space-y-1.5 mt-4">
                <div className="flex justify-between text-[11px] font-mono font-bold text-slate-500">
                  <span>XP: {stats.xp % 200}/200</span>
                  <span className="text-indigo-600">{Math.round(((stats.xp % 200) / 200) * 100)}%</span>
                </div>
                <div className="bg-slate-100 rounded-full h-2 w-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${((stats.xp % 200) / 200) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Performance Details */}
          {/* Đổi p-lg -> p-6, space-y-md -> space-y-4 */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-sm font-extrabold font-mono text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Recent Results</span>
            </h3>
            
            {/* Đổi space-y-sm -> space-y-3 */}
            <div className="space-y-3">
              {recentResults.map((result, i) => (
                // Đổi p-md -> p-3
                <div key={i} className="flex flex-col gap-1.5 bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {result.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {result.time}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {result.accuracy}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${result.accuracy}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={() => onNavigateToLessons()}
              className="w-full text-center py-2.5 border-2 border-dashed border-slate-200 hover:border-indigo-400 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-all rounded-xl mt-2"
            >
              View Performance History
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}