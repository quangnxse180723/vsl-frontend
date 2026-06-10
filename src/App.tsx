/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  BookOpen, Sparkles, Flame, Clock, Award, Star, ArrowRight, CheckCircle, 
  Brain, Play, Settings, HelpCircle, LayoutDashboard, User, ShieldAlert,
  Search, Bell, PlusCircle, AlignLeft, Menu, X
} from 'lucide-react';
import { Lesson, UserStats, INITIAL_LESSONS, INITIAL_ACHIEVEMENTS } from './types';
import DashboardView from './components/DashboardView';
import LessonsCatalog from './components/LessonsCatalog';
import LessonModal from './components/LessonModal';
import AIPracticeView from './components/AIPracticeView';
import ProfileView from './components/ProfileView';
import AdminPortal from './components/AdminPortal';
import DailyChallengeModal from './components/DailyChallengeModal';

export default function App() {
  // Sidebar/Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lessons' | 'practice' | 'profile' | 'admin'>('dashboard');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [showDailyChallenge, setShowDailyChallenge] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Core persistence state initialized from LocalStorage
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    const saved = localStorage.getItem('signmentor_lessons_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_LESSONS;
  });

  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('signmentor_stats_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      xp: 450, // Base in mockup: "Level 2 Beginner - 450 XP"
      level: 2,
      lessonsCompleted: INITIAL_LESSONS.filter(l => l.progress === 100).length,
      practiceTimeMinutes: 120,
      streakDays: 4,
      achievements: INITIAL_ACHIEVEMENTS
    };
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('signmentor_lessons_v1', JSON.stringify(lessons));
  }, [lessons]);

  useEffect(() => {
    localStorage.setItem('signmentor_stats_v1', JSON.stringify(stats));
  }, [stats]);

  // Handle progress & XP rewards synchronization
  const handleUpdateProgress = (lessonId: string, progress: number, xpGained: number) => {
    setLessons(prev => prev.map(l => {
      if (l.id === lessonId) {
        const isNowMastered = progress === 100 && l.progress < 100;
        return { 
          ...l, 
          progress, 
          status: progress === 100 ? 'Mastered' : progress > 0 ? 'In Progress' : 'Not Started'
        };
      }
      return l;
    }));

    if (xpGained > 0) {
      handleGrantXP(xpGained, false);
    }
  };

  const handleGrantXP = (xpAmount: number, isAIClaim: boolean = false) => {
    setStats(prev => {
      const newXp = prev.xp + xpAmount;
      const calculatedLevel = Math.floor(newXp / 200) + 1; // 200 XP per level
      
      // Sync achievements
      const updatedAchievements = prev.achievements.map(ach => {
        if (ach.id === 'first_step' && !ach.unlockedAt) {
          return { ...ach, unlockedAt: new Date().toLocaleDateString() };
        }
        if (ach.id === 'ai_pioneer' && isAIClaim && !ach.unlockedAt) {
          return { ...ach, unlockedAt: new Date().toLocaleDateString() };
        }
        return ach;
      });

      return {
        ...prev,
        xp: newXp,
        level: Math.max(prev.level, calculatedLevel),
        lessonsCompleted: lessons.filter(l => l.progress === 100).length,
        practiceTimeMinutes: prev.practiceTimeMinutes + Math.floor(Math.random() * 5) + 5,
        achievements: updatedAchievements
      };
    });
  };

  // Add Custom creation items
  const handleAddCustomLesson = (newLesson: Lesson) => {
    setLessons(prev => [newLesson, ...prev]);
  };

  // Delete Custom
  const handleDeleteLesson = (lessonId: string) => {
    setLessons(prev => prev.filter(l => l.id !== lessonId));
  };

  // Switch tabs gracefully
  const handleNavigate = (tab: 'dashboard' | 'lessons' | 'practice' | 'profile' | 'admin') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-surface text-on-background font-sans min-h-screen flex flex-col justify-between">
      
      {/* 1. Header Toolbar matches mockup layout */}
      <header className="shadow-sm bg-surface-container-lowest flex justify-between items-center w-full px-lg py-sm sticky top-0 z-50 border-b border-outline-variant/40">
        <div className="flex items-center gap-md">
          {/* Mobile hamburger menu trigger */}
          <button 
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-outline hover:text-on-surface hover:bg-surface-container rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <h1 className="font-headline text-2xl font-black text-primary leading-none tracking-tight">
            SignMentor
          </h1>

          <nav className="hidden md:flex items-center ml-xl space-x-md text-sm font-semibold text-on-surface-variant font-headline">
            <button 
              onClick={() => handleNavigate('dashboard')}
              className={`transition-colors py-1.5 px-3 rounded-lg hover:bg-surface-container ${activeTab === 'dashboard' ? 'text-on-surface font-bold bg-surface-container' : ''}`}
            >
              Browse
            </button>
            <button 
              onClick={() => handleNavigate('lessons')}
              className={`transition-colors py-1.5 px-3 rounded-lg hover:bg-surface-container ${activeTab === 'lessons' ? 'text-primary font-bold bg-surface-container-high' : ''}`}
            >
              Lessons
            </button>
            <button 
              onClick={() => handleNavigate('practice')}
              className={`transition-colors py-1.5 px-3 rounded-lg hover:bg-surface-container ${activeTab === 'practice' ? 'text-on-surface font-bold bg-surface-container' : ''}`}
            >
              Community Practice
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-sm md:gap-md">
          <button 
            onClick={() => handleNavigate('profile')}
            className="p-2 text-outline-variant text-on-surface-variant hover:bg-surface-container rounded-full transition-all active:scale-95 flex items-center gap-1 font-semibold text-xs border border-outline-variant"
          >
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />
            <span className="text-on-surface font-bold hidden sm:inline">{stats.streakDays} Day Streaks</span>
          </button>
          
          <button 
            onClick={() => alert('No new notifications!')}
            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-all active:scale-95"
          >
            <Bell className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => handleNavigate('profile')}
            className="w-8 h-8 rounded-full bg-primary-container text-white font-bold text-xs flex items-center justify-center hover:brightness-110 active:scale-95 shadow border border-outline-variant"
            title="Open Profile Page"
          >
            {stats.xp > 0 ? 'A' : <User className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 min-h-[calc(100vh-64px)] overflow-x-hidden relative">
        
        {/* 2. Side navigation bar matches mockup styling */}
        <aside className="hidden md:flex flex-col h-auto w-64 bg-surface-container-low p-md space-y-md sticky top-16 border-r border-outline-variant/40 shrink-0 select-none">
          
          {/* Learning path xp meter */}
          <div className="px-sm py-md bg-white border border-outline-variant rounded-xl p-md shadow-sm">
            <h2 className="text-[10px] font-bold text-outline uppercase tracking-wider">Learning Path</h2>
            <div className="mt-sm flex items-center gap-sm">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-headline font-bold text-sm text-on-surface truncate">Level {stats.level} Beginner</p>
                <p className="text-[11px] text-on-surface-variant font-semibold mt-0.5">{stats.xp} Total XP earned</p>
              </div>
            </div>
            
            {/* XP progress meter line */}
            <div className="mt-md space-y-1">
              <div className="bg-surface-container rounded-full h-1.5 w-full overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-300" 
                  style={{ width: `${((stats.xp % 200) / 200) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-outline block text-right mt-1">
                {(stats.xp % 200)} / 200 XP to next level
              </span>
            </div>
          </div>

          {/* Navigation menus precisely matching mockup names & indicators */}
          <nav className="flex-1 space-y-1 text-sm font-semibold">
            <button 
              onClick={() => handleNavigate('dashboard')}
              className={`w-full flex items-center gap-md px-md py-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-primary/5 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </button>
            
            <button 
              onClick={() => handleNavigate('lessons')}
              className={`w-full flex items-center gap-md px-md py-3 rounded-lg transition-all ${activeTab === 'lessons' ? 'bg-primary text-white font-bold shadow' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Lessons</span>
            </button>
            
            <button 
              onClick={() => handleNavigate('practice')}
              className={`w-full flex items-center gap-md px-md py-3 rounded-lg transition-all ${activeTab === 'practice' ? 'bg-primary/5 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              <Brain className="w-4 h-4 shrink-0" />
              <span>AI Practice</span>
            </button>
            
            <button 
              onClick={() => handleNavigate('profile')}
              className={`w-full flex items-center gap-md px-md py-3 rounded-lg transition-all ${activeTab === 'profile' ? 'bg-primary/5 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Profile</span>
            </button>
            
            <button 
              onClick={() => handleNavigate('admin')}
              className={`w-full flex items-center gap-md px-md py-3 rounded-lg transition-all ${activeTab === 'admin' ? 'bg-primary/5 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Admin</span>
            </button>
          </nav>

          {/* Daily challenge interactive game start */}
          <button 
            type="button"
            onClick={() => setShowDailyChallenge(true)}
            className="w-full bg-primary text-white py-3.5 px-4 rounded-xl font-bold whitespace-nowrap shadow-md hover:brightness-110 active:scale-95 transition-all text-xs"
          >
            Start Daily Challenge
          </button>

          <div className="pt-md border-t border-outline-variant/40 space-y-1 text-xs font-semibold text-on-surface-variant">
            <button 
              onClick={() => handleNavigate('admin')}
              className="w-full flex items-center gap-md px-md py-2.5 rounded-lg hover:bg-surface-container-high"
            >
              <Settings className="w-4 h-4 text-outline" />
              <span>Settings</span>
            </button>
            <button 
              onClick={() => alert("Welcome to SignMentor help portal! Start learning ASL by clicking on the first lesson map. You can also turn on your camera and test sign positions in 'AI Practice' sandbox.")}
              className="w-full flex items-center gap-md px-md py-2.5 rounded-lg hover:bg-surface-container-high"
            >
              <HelpCircle className="w-4 h-4 text-outline" />
              <span>Help</span>
            </button>
          </div>
        </aside>

        {/* Mobile side menu slide-over drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-40" onClick={() => setMobileMenuOpen(false)}>
            <aside 
              className="w-64 max-w-xs bg-surface-container-lowest h-full p-md flex flex-col space-y-md shadow-2xl relative z-50 animate-slide-in-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center bg-white border-b border-outline-variant/30 pb-md">
                <h3 className="font-headline text-lg font-black text-primary">SignMentor Navigation</h3>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-full hover:bg-surface-container text-outline">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 space-y-2 text-sm font-semibold">
                <button 
                  onClick={() => handleNavigate('dashboard')}
                  className={`w-full text-left flex items-center gap-md p-md rounded-xl ${activeTab === 'dashboard' ? 'bg-primary/5 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container'}`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Dashboard</span>
                </button>
                <button 
                  onClick={() => handleNavigate('lessons')}
                  className={`w-full text-left flex items-center gap-md p-md rounded-xl ${activeTab === 'lessons' ? 'bg-primary text-white font-bold' : 'text-on-surface-variant hover:bg-surface-container'}`}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>Lessons Catalog</span>
                </button>
                <button 
                  onClick={() => handleNavigate('practice')}
                  className={`w-full text-left flex items-center gap-md p-md rounded-xl ${activeTab === 'practice' ? 'bg-primary/5 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container'}`}
                >
                  <Brain className="w-4 h-4 shrink-0" />
                  <span>AI Practice</span>
                </button>
                <button 
                  onClick={() => handleNavigate('profile')}
                  className={`w-full text-left flex items-center gap-md p-md rounded-xl ${activeTab === 'profile' ? 'bg-primary/5 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container'}`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span>Student Profile</span>
                </button>
                <button 
                  onClick={() => handleNavigate('admin')}
                  className={`w-full text-left flex items-center gap-md p-md rounded-xl ${activeTab === 'admin' ? 'bg-primary/5 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container'}`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Curriculum Admin</span>
                </button>
                
                <button 
                  onClick={() => { setShowDailyChallenge(true); setMobileMenuOpen(false); }}
                  className="w-full block bg-primary text-center text-white py-3 rounded-xl font-bold mt-4 shrink-0 text-xs shadow"
                >
                  Start Daily Challenge
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* 3. Primary Content Workspace */}
        <main className="flex-1 p-md sm:p-lg md:p-xl overflow-y-auto w-full pb-20 md:pb-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView 
                stats={stats} 
                lessons={lessons} 
                onNavigateToLessons={() => handleNavigate('lessons')}
                onStartLesson={(l) => setActiveLesson(l)}
              />
            )}

            {activeTab === 'lessons' && (
              <LessonsCatalog 
                lessons={lessons} 
                onStartLesson={(l) => setActiveLesson(l)}
                onNavigateToCreator={() => handleNavigate('admin')}
              />
            )}

            {activeTab === 'practice' && (
              <AIPracticeView 
                lessons={lessons}
                stats={stats}
                onGrantXP={(xp, isAIClaim) => handleGrantXP(xp, isAIClaim)}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileView 
                stats={stats}
                onUpdateNameAndBio={(newName, newBio, newGoal) => {
                  setStats(prev => ({ ...prev })); // triggers serialization sync
                }}
                onStartDailyChallenge={() => setShowDailyChallenge(true)}
              />
            )}

            {activeTab === 'admin' && (
              <AdminPortal 
                lessons={lessons}
                onAddCustomLesson={handleAddCustomLesson}
                onDeleteLesson={handleDeleteLesson}
              />
            )}
          </div>
        </main>

      </div>

      {/* 4. Mobile Bottom Toolbar as precisely rendered in mockup */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40 flex justify-around p-sm border-t border-outline-variant bg-white">
        <button 
          onClick={() => handleNavigate('dashboard')}
          className={`flex flex-col items-center gap-1 text-xs py-1 px-3 rounded-lg ${activeTab === 'dashboard' ? 'text-primary font-bold bg-primary/5' : 'text-on-surface-variant'}`}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          <span className="text-[10px]">Home</span>
        </button>
        <button 
          onClick={() => handleNavigate('lessons')}
          className={`flex flex-col items-center gap-1 text-xs py-1 px-3 rounded-lg ${activeTab === 'lessons' ? 'text-primary font-bold bg-primary/5' : 'text-on-surface-variant'}`}
        >
          <BookOpen className="w-5 h-5 shrink-0" />
          <span className="text-[10px]">Lessons</span>
        </button>
        <button 
          onClick={() => handleNavigate('practice')}
          className={`flex flex-col items-center gap-1 text-xs py-1 px-3 rounded-lg ${activeTab === 'practice' ? 'text-primary font-bold bg-primary/5' : 'text-on-surface-variant'}`}
        >
          <Brain className="w-5 h-5 shrink-0" />
          <span className="text-[10px]">AI Practice</span>
        </button>
        <button 
          onClick={() => handleNavigate('profile')}
          className={`flex flex-col items-center gap-1 text-xs py-1 px-3 rounded-lg ${activeTab === 'profile' ? 'text-primary font-bold bg-primary/5' : 'text-on-surface-variant'}`}
        >
          <User className="w-5 h-5 shrink-0" />
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>

      {/* 5. Course Learning Chapters Modal viewport */}
      {activeLesson && (
        <LessonModal 
          lesson={activeLesson}
          onClose={() => setActiveLesson(null)}
          onUpdateProgress={handleUpdateProgress}
        />
      )}

      {/* 6. Active Daily gamified ASL Word Builder view */}
      {showDailyChallenge && (
        <DailyChallengeModal 
          onClose={() => setShowDailyChallenge(false)}
          onSuccess={(xpReward) => handleGrantXP(xpReward, false)}
        />
      )}

    </div>
  );
}
