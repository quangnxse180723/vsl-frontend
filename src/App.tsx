import { useState } from 'react';
import { 
  BookOpen, Brain, LayoutDashboard, User, Settings, X
} from 'lucide-react';
import { Lesson } from './types';
import { useSignMentor } from './hook/useSignMentor';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import DashboardView from './components/DashboardView';
import LessonsCatalog from './components/LessonsCatalog';
import LessonModal from './components/LessonModal';
import AIPracticeView from './components/AIPracticeView';
import ProfileView from './components/ProfileView';
import AdminPortal from './components/AdminPortal';
import DailyChallengeModal from './components/DailyChallengeModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lessons' | 'practice' | 'profile' | 'admin'>('dashboard');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [showDailyChallenge, setShowDailyChallenge] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const { 
    lessons, 
    stats, 
    handleUpdateProgress, 
    handleGrantXP, 
    handleAddCustomLesson, 
    handleDeleteLesson,
    setStats 
  } = useSignMentor();

  const handleNavigate = (tab: 'dashboard' | 'lessons' | 'practice' | 'profile' | 'admin') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="bg-slate-50 text-slate-900 font-sans h-screen flex flex-col overflow-hidden">
      <Header 
        activeTab={activeTab} 
        onNavigate={handleNavigate} 
        stats={stats} 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          activeTab={activeTab} 
          onNavigate={handleNavigate} 
          stats={stats} 
          onStartDailyChallenge={() => setShowDailyChallenge(true)} 
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-10 bg-slate-50">
          <div className="max-w-[1600px] mx-auto">
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
                onUpdateNameAndBio={() => { setStats(prev => ({ ...prev })); }}
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

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50" onClick={() => setMobileMenuOpen(false)}>
          <aside 
            className="w-64 max-w-xs bg-slate-50 h-full p-4 flex flex-col space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center bg-white border-b border-slate-200 pb-4 px-2">
              <h3 className="font-headline text-lg font-black text-indigo-600">Navigation</h3>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 space-y-2 text-sm font-semibold mt-4">
              <button onClick={() => handleNavigate('dashboard')} className={`w-full text-left flex items-center gap-3 p-4 rounded-xl ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </button>
              <button onClick={() => handleNavigate('lessons')} className={`w-full text-left flex items-center gap-3 p-4 rounded-xl ${activeTab === 'lessons' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Lessons Catalog</span>
              </button>
              <button onClick={() => handleNavigate('practice')} className={`w-full text-left flex items-center gap-3 p-4 rounded-xl ${activeTab === 'practice' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                <Brain className="w-4 h-4 shrink-0" />
                <span>AI Practice</span>
              </button>
              <button onClick={() => handleNavigate('profile')} className={`w-full text-left flex items-center gap-3 p-4 rounded-xl ${activeTab === 'profile' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                <User className="w-4 h-4 shrink-0" />
                <span>Student Profile</span>
              </button>
              <button onClick={() => handleNavigate('admin')} className={`w-full text-left flex items-center gap-3 p-4 rounded-xl ${activeTab === 'admin' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                <Settings className="w-4 h-4 shrink-0" />
                <span>Curriculum Admin</span>
              </button>
              
              <button 
                onClick={() => { setShowDailyChallenge(true); setMobileMenuOpen(false); }}
                className="w-full block bg-indigo-600 text-center text-white py-3 rounded-xl font-bold mt-6 shrink-0 text-xs shadow-md"
              >
                Start Daily Challenge
              </button>
            </div>
          </aside>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_15px_rgba(0,0,0,0.05)] z-40 flex justify-around p-2 border-t border-slate-200">
        <button onClick={() => handleNavigate('dashboard')} className={`flex flex-col items-center gap-1 text-xs py-2 px-3 rounded-lg ${activeTab === 'dashboard' ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-slate-500'}`}>
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          <span className="text-[10px]">Home</span>
        </button>
        <button onClick={() => handleNavigate('lessons')} className={`flex flex-col items-center gap-1 text-xs py-2 px-3 rounded-lg ${activeTab === 'lessons' ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-slate-500'}`}>
          <BookOpen className="w-5 h-5 shrink-0" />
          <span className="text-[10px]">Lessons</span>
        </button>
        <button onClick={() => handleNavigate('practice')} className={`flex flex-col items-center gap-1 text-xs py-2 px-3 rounded-lg ${activeTab === 'practice' ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-slate-500'}`}>
          <Brain className="w-5 h-5 shrink-0" />
          <span className="text-[10px]">Practice</span>
        </button>
        <button onClick={() => handleNavigate('profile')} className={`flex flex-col items-center gap-1 text-xs py-2 px-3 rounded-lg ${activeTab === 'profile' ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-slate-500'}`}>
          <User className="w-5 h-5 shrink-0" />
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>

      {activeLesson && (
        <LessonModal 
          lesson={activeLesson}
          onClose={() => setActiveLesson(null)}
          onUpdateProgress={handleUpdateProgress}
        />
      )}

      {showDailyChallenge && (
        <DailyChallengeModal 
          onClose={() => setShowDailyChallenge(false)}
          onSuccess={(xpReward) => handleGrantXP(xpReward, false)}
        />
      )}
    </div>
  );
}