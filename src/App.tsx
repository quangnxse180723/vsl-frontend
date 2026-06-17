import React, { useState } from 'react';
import { 
  INITIAL_USERS, 
  INITIAL_LESSONS, 
  INITIAL_VOCABULARY, 
  INITIAL_ACHIEVEMENTS, 
  INITIAL_RECENT_RESULTS 
} from './data';
import { User, Lesson, Vocabulary, RecentResult, Achievement } from './types';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import LessonsView from './components/LessonsView';
import LessonDetailView from './components/LessonDetailView';
import AIPracticeView from './components/AIPracticeView';
import AdminView from './components/AdminView';
import ProfileView from './components/ProfileView';

export default function App() {
  // Session States
  const [isLoggedIn, setIsLoggedIn] = useState(true); // pre-log in Felix to offer a stunning instant experience
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Felix Chen
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'lessons' | 'practice' | 'profile' | 'admin'>('dashboard');
  
  // Drill-down Detail Lesson State
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedPracticeSignName, setSelectedPracticeSignName] = useState<string>('Letter A');

  // Dynamic Data States
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [lessons, setLessons] = useState<Lesson[]>(INITIAL_LESSONS);
  const [vocabularyList, setVocabularyList] = useState<Vocabulary[]>(INITIAL_VOCABULARY);
  const [recentResults, setRecentResults] = useState<RecentResult[]>(INITIAL_RECENT_RESULTS);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);

  // Global Toasts
  const [toastMessage, setToastMessage] = useState('');

  const displayToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4500);
  };

  // Handler Actions
  const handleLogin = (email: string) => {
    // Try to find matching preloaded user, else fallback to custom simulation placeholder
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
      setCurrentUser(foundUser);
    } else {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        status: 'Active',
        proficiency: 0,
        lastActive: 'Just now',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMy9-SdPa9x8ZD7EDImuDsWy9UD4_M-lCxo2_zZ1TSdh6GMk-_uKkdsooMAVrJvBiVstA-Bz5t4sSpDDbWZ355wNtoSgWxBngZyl3z_0HKazXsSbJvE9v8oAI8Mwcg7SvbjsP4h31I49mQLt1Fh_QfYbKEYJFdrDj6eo_xD04NyH95tkrefWuYywsTcjg9z624nNis-HRUFfPZluEMquSWsiG6zjX4kB0S4M3OyQ4G7bfkTqc6o6dmz7vBPBxL4GTCjj05ZVtwIiCd'
      };
      setUsers(prev => [newUser, ...prev]);
      setCurrentUser(newUser);
    }
    setIsLoggedIn(true);
    setCurrentTab('dashboard');
    displayToast('Signmentor: Signed in successfully!');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSelectedLessonId(null);
    displayToast('Goodbye! You have been signed out.');
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'Active' ? 'Idle' : 'Active';
        return {
          ...u,
          status: nextStatus as 'Active' | 'Idle',
          lastActive: 'Just now'
        };
      }
      return u;
    }));
  };

  // Content addition: operational with instant Practice feedback hook!
  const handleAddVocabulary = (newVocab: { name: string; category: string; description: string; file?: File }) => {
    const freshId = `vocab-added-${Date.now()}`;
    const freshItem: Vocabulary = {
      id: freshId,
      name: newVocab.name,
      category: newVocab.category,
      attribute: 'Movement',
      image: newVocab.file 
        ? URL.createObjectURL(newVocab.file) 
        // Fallback placeholder
        : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCoKYzPFx3Xn0vGAwpzYP9EjYQp3pWd5lx0xWN3n3UtgoIs0U6cytkejgaHc6kUvTPYgciONKdeYXtweQ9rI33qK6MTZvo6g_x4YepsJNyVGFWFhBAuvLldc2lPqi0pPLJYmZvP6oyEIeO0jm1SLnaNVrpF3zf6hEjDPGOORbtmZ4OmXE23r-ZKv4d0D3FkfG1HAbfwMP59fODnS_mfCjG5-U319CjGAKJiEQ_pnb2imWqILcKfBGHaLCNxcVFsZu2jCVSQ904QK7Ml',
      description: newVocab.description
    };

    setVocabularyList(prev => [freshItem, ...prev]);
    displayToast(`Library Updated! Added "${newVocab.name}" successfully.`);
  };

  const handleDeleteVocabulary = (vocabId: string) => {
    const deletedItem = vocabularyList.find(v => v.id === vocabId);
    setVocabularyList(prev => prev.filter(v => v.id !== vocabId));
    if (deletedItem) {
      displayToast(`Removed "${deletedItem.name}" from active configuration.`);
    }
  };

  // Add a newly scanned/tested accuracy rating
  const handleRecordPracticeResult = (signName: string, score: number) => {
    const freshResult: RecentResult = {
      id: `res-${Date.now()}`,
      sign: `ASL '${signName}'`,
      accuracy: score,
      icon: 'front_hand',
      statusText: 'Verified now',
      timeAgo: 'Just now'
    };

    setRecentResults(prev => [freshResult, ...prev.slice(0, 4)]);
    displayToast(`AI Evaluation Complete! Accuracy: ${score}% on Sign '${signName}'`);

    // Increment corresponding lesson progress in real-time
    const linkedVocab = vocabularyList.find(v => v.name === signName);
    if (linkedVocab) {
      setLessons(prev => prev.map(l => {
        if (l.vocabulary.includes(linkedVocab.id)) {
          const nextProgress = Math.min(100, l.progress + Math.floor(Math.random() * 20) + 15);
          return {
            ...l,
            progress: nextProgress,
            status: nextProgress === 100 ? 'Mastered' : 'In Progress'
          };
        }
        return l;
      }));
    }
  };

  // Launch AI Practice lab from a custom selected Lesson
  const handleLaunchPracticeAndFocus = (lessonId: string, initialSignName?: string) => {
    setSelectedPracticeSignName(initialSignName || 'Letter A');
    setCurrentTab('practice');
  };

  const currentActiveLesson = lessons.find(l => l.id === selectedLessonId);

  // Sign in conditional block
  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="bg-mesh min-h-screen flex flex-col md:flex-row antialiased font-sans">
      
      {/* GLOBAL TOAST BANNER OVERLAY */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-on-surface text-surface text-sm font-semibold rounded-xl shadow-xl flex items-center gap-2 border border-outline-variant/30 animate-pulse">
          <span className="material-symbols-outlined text-primary text-xl">info</span>
          {toastMessage}
        </div>
      )}

      {/* Side Navigation Rail (Left Rail) */}
      <aside className="w-full md:w-64 bg-surface-container-lowest shrink-0 border-b md:border-b-0 md:border-r border-outline-variant/30 px-5 py-6 flex flex-col justify-between">
        <div className="space-y-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 px-2">
            <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center border border-primary/20 shadow-sm text-primary">
              <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>sign_language</span>
            </div>
            <div>
              <span className="font-display font-bold text-xl text-primary leading-none block">SignMentor</span>
              <p className="text-[10px] text-outline font-semibold">AI Sign Learning</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 gap-1.5 scrollbar-none select-none">
            {/* Dashboard link */}
            <button
              onClick={() => {
                setCurrentTab('dashboard');
                setSelectedLessonId(null);
              }}
              className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition-colors shrink-0 text-sm font-bold ${
                currentTab === 'dashboard'
                  ? 'bg-primary-container/10 text-primary'
                  : 'text-outline hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-lg">dashboard</span>
              <span className="md:inline">Dashboard</span>
            </button>

            {/* Lessons link */}
            <button
              onClick={() => {
                setCurrentTab('lessons');
                setSelectedLessonId(null);
              }}
              className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition-colors shrink-0 text-sm font-bold ${
                currentTab === 'lessons'
                  ? 'bg-primary-container/10 text-primary'
                  : 'text-outline hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-lg">school</span>
              <span className="md:inline">Lessons</span>
            </button>

            {/* AI Practice link */}
            <button
              onClick={() => {
                setCurrentTab('practice');
                setSelectedLessonId(null);
              }}
              className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition-colors shrink-0 text-sm font-bold ${
                currentTab === 'practice'
                  ? 'bg-primary-container/10 text-primary'
                  : 'text-outline hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-lg">psychology</span>
              <span className="md:inline">AI Practice</span>
            </button>

            {/* Profile link */}
            <button
              onClick={() => {
                setCurrentTab('profile');
                setSelectedLessonId(null);
              }}
              className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition-colors shrink-0 text-sm font-bold ${
                currentTab === 'profile'
                  ? 'bg-primary-container/10 text-primary'
                  : 'text-outline hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-lg">account_circle</span>
              <span className="md:inline">Profile</span>
            </button>

            {/* Admin link */}
            <button
              onClick={() => {
                setCurrentTab('admin');
                setSelectedLessonId(null);
              }}
              className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition-colors shrink-0 text-sm font-bold ${
                currentTab === 'admin'
                  ? 'bg-primary-container/10 text-primary'
                  : 'text-outline hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
              <span className="md:inline">Admin Console</span>
            </button>
          </nav>
        </div>

        {/* Account thumbnail footer */}
        <div className="hidden md:flex items-center justify-between p-3 border border-outline-variant/30 rounded-2xl bg-surface-container-low">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-outline-variant/60">
              <img className="w-full h-full object-cover" src={currentUser.avatar} alt={currentUser.name} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-on-surface truncate leading-none">{currentUser.name}</p>
              <p className="text-[9px] text-outline truncate mt-0.5">{currentUser.email}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleLogout}
            className="p-1 hover:bg-red-50 text-outline hover:text-[#ba1a1a] rounded-lg transition-colors flex items-center justify-center shrink-0"
            title="Logout"
          >
            <span className="material-symbols-outlined text-lg leading-none">power_settings_new</span>
          </button>
        </div>
      </aside>

      {/* Main View Work Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {selectedLessonId && currentActiveLesson ? (
          <LessonDetailView
            lesson={currentActiveLesson}
            vocabList={vocabularyList}
            onBack={() => setSelectedLessonId(null)}
            onLaunchPractice={handleLaunchPracticeAndFocus}
            onUpdateLessonProgress={(lessonId, progress) => {
              setLessons(prev => prev.map(l => {
                if (l.id === lessonId) {
                  return { ...l, progress, status: progress === 100 ? 'Mastered' : 'In Progress' };
                }
                return l;
              }));
            }}
          />
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                currentUser={currentUser}
                lessons={lessons}
                recentResults={recentResults}
                achievements={achievements}
                onNavigateToTab={setCurrentTab}
                onSelectLesson={setSelectedLessonId}
                onStartDailyChallenge={() => {
                  setSelectedPracticeSignName('Letter A');
                  setCurrentTab('practice');
                  displayToast('Daily challenge started! Align hand shape for "Letter A" in AI Practice Lab.');
                }}
              />
            )}

            {currentTab === 'lessons' && (
              <LessonsView
                lessons={lessons}
                onSelectLesson={setSelectedLessonId}
                onNavigateToTab={setCurrentTab}
              />
            )}

            {currentTab === 'practice' && (
              <AIPracticeView
                vocabularyList={vocabularyList}
                initialSelectedSignName={selectedPracticeSignName}
                onRecordResult={handleRecordPracticeResult}
              />
            )}

            {currentTab === 'profile' && (
              <ProfileView
                currentUser={currentUser}
                achievements={achievements}
                onLogout={handleLogout}
              />
            )}

            {currentTab === 'admin' && (
              <AdminView
                users={users}
                vocabularyList={vocabularyList}
                onToggleUserStatus={handleToggleUserStatus}
                onAddVocabulary={handleAddVocabulary}
                onDeleteVocabulary={handleDeleteVocabulary}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
