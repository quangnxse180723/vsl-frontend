import React, { useState } from 'react';
import { User, Lesson, RecentResult, Achievement } from '../types';
import { Sparkles, Play, Award, ChevronRight, TrendingUp, Calendar, Zap, MessageSquare, ArrowRight } from 'lucide-react';

interface DashboardViewProps {
  currentUser: User;
  lessons: Lesson[];
  recentResults: RecentResult[];
  achievements: Achievement[];
  onNavigateToTab: (tab: 'dashboard' | 'lessons' | 'practice' | 'profile' | 'admin') => void;
  onSelectLesson: (lessonId: string) => void;
  onStartDailyChallenge: () => void;
}

export default function DashboardView({
  currentUser,
  lessons,
  recentResults,
  achievements,
  onNavigateToTab,
  onSelectLesson,
  onStartDailyChallenge
}: DashboardViewProps) {
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Recommendations: get first 2 beginner/in-progress lessons
  const recommendations = lessons.filter(l => l.progress < 100).slice(0, 2);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-1 bg-surface rounded-xl">
        <div>
          <p className="text-primary font-semibold text-xs tracking-wider uppercase mb-1">WELCOME BACK</p>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-on-surface">Hello, {currentUser.name}!</h2>
          <p className="text-body-md text-on-surface-variant mt-1">Ready to master some new signs today?</p>
        </div>
        <button 
          onClick={onStartDailyChallenge}
          className="active-scale bg-primary hover:bg-primary/95 text-on-primary px-5 py-3 rounded-xl font-semibold shadow-md flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-xl">bolt</span>
          Start Daily Challenge
        </button>
      </section>

      {/* Top Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* Learning Progress Card (Left Column) */}
        <div className="lg:col-span-8 p-6 md:p-8 rounded-2xl bg-surface-container-lowest elevation-1 flex flex-col sm:flex-row items-center gap-6 border border-outline-variant/30">
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            {/* Custom SVG Circular Progress */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle className="text-surface-container-high" cx="50" cy="50" fill="transparent" r="42" stroke="currentColor" strokeWidth="8" />
              <circle 
                className="text-primary" 
                cx="50" 
                cy="50" 
                fill="transparent" 
                r="42" 
                stroke="currentColor" 
                strokeWidth="8" 
                strokeDasharray="264" 
                strokeDashoffset="92" // 65% progress (264 * 0.35)
                strokeLinecap="round" 
              />
            </svg>
            <span className="absolute text-3xl font-display font-extrabold text-primary">65%</span>
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-display text-2xl text-on-surface mb-2 font-bold select-none">Learning Progress</h3>
            <p className="text-on-surface-variant text-body-md mb-6 leading-relaxed">
              You're making great progress! Finish 3 more lessons to unlock the Advanced Handshapes module.
            </p>
            <button 
              onClick={() => onNavigateToTab('lessons')}
              className="active-scale px-6 py-2.5 bg-primary text-on-primary font-semibold rounded-lg shadow-sm hover:bg-primary/95 transition-all text-sm"
            >
              Continue Learning
            </button>
          </div>
        </div>

        {/* Daily Practice Streak (Right Column) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-primary text-on-primary elevation-1 flex flex-col justify-between overflow-hidden relative group">
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-4">
              <span className="material-symbols-outlined text-2xl fill-none text-on-primary" style={{fontVariationSettings: "'FILL' 1"}}>local_fire_department</span>
              <span className="font-semibold text-xs tracking-wider uppercase">Daily Streak</span>
            </div>
            <h3 className="text-5xl font-extrabold leading-tight mb-2 tracking-tight">5 Days</h3>
            <p className="text-sm opacity-90">Keep it up! Reach 7 days for a profile status badge.</p>
          </div>
          
          <div className="mt-8 z-10 w-full">
            <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div className="w-[71%] h-full bg-white rounded-full transition-all duration-500"></div>
            </div>
          </div>
          {/* Abstract backdrop */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500"></div>
        </div>
      </div>

      {/* Recommended & Recent Results Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        {/* Recommended Lessons */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl font-bold text-on-surface">Recommended for You</h3>
            <button 
              onClick={() => onNavigateToTab('lessons')}
              className="text-primary font-bold flex items-center hover:underline text-sm gap-1 active-scale"
            >
              View All <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {recommendations.map(lesson => (
              <div 
                key={lesson.id}
                onClick={() => onSelectLesson(lesson.id)}
                className="group rounded-2xl bg-surface-container-lowest elevation-1 overflow-hidden hover:elevation-2 transition-all cursor-pointer border border-outline-variant/30"
              >
                <div className="h-40 bg-surface-variant relative overflow-hidden">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    src={lesson.image} 
                    alt={lesson.title} 
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-primary text-on-primary text-xs font-bold rounded-full">
                    {lesson.level}
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <h4 className="font-headline-md text-lg text-on-surface group-hover:text-primary transition-colors">{lesson.title}</h4>
                    <p className="text-xs text-on-surface-variant line-clamp-1 mt-1">{lesson.description}</p>
                  </div>
                  <div className="flex items-center text-xs text-outline space-x-3 pt-2 border-t border-outline-variant/20">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">schedule</span> {lesson.duration}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">star</span> {lesson.rating}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Practice Results */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="font-display text-2xl font-bold text-on-surface">Recent Results</h3>
          <div className="p-6 rounded-2xl bg-surface-container-lowest elevation-1 border border-outline-variant/30 space-y-4">
            {recentResults.map(res => (
              <div 
                key={res.id} 
                className="flex items-center justify-between p-3 border border-outline-variant/40 rounded-xl bg-surface-container-lowest hover:border-primary transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-xl">{res.icon}</span>
                  </div>
                  <div>
                    <p className="font-label-bold text-on-surface text-sm">{res.sign}</p>
                    <p className="text-xs text-on-surface-variant">{res.statusText}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-base font-bold ${res.accuracy >= 90 ? 'text-green-600' : 'text-primary'}`}>
                    {res.accuracy}%
                  </div>
                  <div className="text-[10px] text-outline">Accuracy</div>
                </div>
              </div>
            ))}
            <button 
              onClick={() => setShowHistoryModal(true)}
              className="w-full py-2.5 text-primary text-sm font-bold bg-surface hover:bg-surface-container-high transition-colors rounded-lg border-2 border-transparent hover:border-primary-container"
            >
              View Performance History
            </button>
          </div>
        </div>
      </div>

      {/* Level Up CTA Banner */}
      <section className="mt-8">
        <div className="bg-surface-container-high p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden border border-outline-variant/20">
          <div className="relative z-10 max-w-lg space-y-5">
            <div>
              <h4 className="font-headline-md text-2xl text-on-surface mb-2">Ready to level up?</h4>
              <p className="text-on-surface-variant text-sm">
                Unlock the intermediate "Emergency Signs" module to get real-time webcam feedback and collaborative practice badges.
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => onNavigateToTab('lessons')}
                className="bg-primary text-on-primary px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/95 active-scale-lg transition-all"
              >
                Continue Module
              </button>
              <button 
                onClick={() => onNavigateToTab('lessons')}
                className="bg-transparent border border-outline text-on-surface px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-surface-container-low transition-colors"
              >
                View Curriculum
              </button>
            </div>
          </div>
          <div className="hidden md:block flex-1 h-48 rounded-xl overflow-hidden shadow-lg border-4 border-white transform rotate-3">
            <img 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1q5BKGtXc3O0p0EW7_jOIvIM0_hMt_aerpdhIu2YJXyzdzYQvPAXFMDy1n5gc0D2HmJgTyN6aaEQuPWs0reDEcTmXvwNeh_CsB1C1j1rNT_x9PbMqUNI7S9VZXhQhU306q567cX8E9Pfq8frg6uebajSPbXfOSPzSbqFX4QGNVMlYk5Isxiw5KBUN_hHhKW1rI-jPkRIyph4EgCfwq4jiBC_8m7odnEHKFAnuNTifdm9IpjoRKX6rF2TOv6J3YzWj-ce6TUcgeQYk" 
              alt="Community group learning sign language" 
            />
          </div>
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Performance History Modal Simulation */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-6 border border-outline-variant/30">
            <header className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">assessment</span>
                <h3 className="font-headline-md text-xl">Performance History</h3>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="p-1 hover:bg-surface-container-high rounded-full transition-colors material-symbols-outlined text-on-surface"
              >
                close
              </button>
            </header>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              <div className="p-3 bg-surface-container-low rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="font-label-bold text-on-surface">Alphabet A</h4>
                  <p className="text-xs text-on-surface-variant">Thứ Hai • 3 Thử Nghiệm</p>
                </div>
                <span className="font-display text-xl text-green-600 font-bold">100%</span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="font-label-bold text-on-surface">Cụm Từ Chào Hỏi</h4>
                  <p className="text-xs text-on-surface-variant">Thứ Ba • 5 Thử Nghiệm</p>
                </div>
                <span className="font-display text-xl text-primary font-bold">85%</span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="font-label-bold text-on-surface">Giao Tiếp Cơ Bản</h4>
                  <p className="text-xs text-on-surface-variant">Thứ Tư • 8 Thử Nghiệm</p>
                </div>
                <span className="font-display text-xl text-primary font-bold">88%</span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="font-label-bold text-on-surface">Vui Vẽ (Happy)</h4>
                  <p className="text-xs text-on-surface-variant">Thứ Năm • 2 Thử Nghiệm</p>
                </div>
                <span className="font-display text-xl text-green-600 font-bold">92%</span>
              </div>
            </div>

            <button 
              onClick={() => setShowHistoryModal(false)}
              className="w-full py-3 bg-primary text-on-primary font-label-bold rounded-lg hover:bg-primary/95 active-scale transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
