import React, { useState, useEffect } from 'react';
import { User, Lesson, Vocabulary, RecentResult, Achievement } from './types';
import { UserResponse } from './types/api';
import { authApi } from './services/api/authApi';
import { categoryApi } from './services/api/categoryApi';
import { vocabularyApi, VocabularyResponse } from './services/api/vocabularyApi';
import { attemptApi } from './services/api/attemptApi';
import { practiceApi } from './services/api/practiceApi';
import { adminApi } from './services/api/adminApi';
import LoginView from './pages/LoginView';
import RegisterView from './pages/RegisterView';
import DashboardView from './pages/DashboardView';
import LessonsView from './pages/LessonsView';
import LessonDetailView from './pages/LessonDetailView';
import AIPracticeView from './pages/AIPracticeView';
import AdminView from './pages/AdminView';
import ProfileView from './pages/ProfileView';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop';
const VOCAB_THUMBNAIL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCoKYzPFx3Xn0vGAwpzYP9EjYQp3pWd5lx0xWN3n3UtgoIs0U6cytkejgaHc6kUvTPYgciONKdeYXtweQ9rI33qK6MTZvo6g_x4YepsJNyVGFWFhBAuvLldc2lPqi0pPLJYmZvP6oyEIeO0jm1SLnaNVrpF3zf6hEjDPGOORbtmZ4OmXE23r-ZKv4d0D3FkfG1HAbfwMP59fODnS_mfCjG5-U319CjGAKJiEQ_pnb2imWqILcKfBGHaLCNxcVFsZu2jCVSQ904QK7Ml';
const LESSON_THUMBNAIL = 'https://images.unsplash.com/photo-1621644788102-171bba70eb10?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

function mapUserResponseToUser(u: UserResponse): User {
  return {
    id: u.userId.toString(),
    name: u.fullName,
    email: u.email,
    status: u.status === 'ACTIVE' ? 'Active' : 'Idle',
    proficiency: 0,
    lastActive: 'Just now',
    avatar: u.avatarUrl || DEFAULT_AVATAR
  };
}

function mapVocabularyResponse(v: VocabularyResponse): Vocabulary {
  return {
    id: v.id.toString(),
    name: v.word,
    category: v.categoryName,
    attribute: 'Movement',
    image: VOCAB_THUMBNAIL,
    description: v.description,
    videoUrl: v.videoTutorialUrl,
    expectedId: v.expectedId
  };
}

export default function App() {
  // Session States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'lessons' | 'practice' | 'profile' | 'admin'>('dashboard');

  // Drill-down Detail Lesson State
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedPracticeSignName, setSelectedPracticeSignName] = useState<string>('Letter A');

  // Dynamic Data States
  const [users, setUsers] = useState<User[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [vocabularyList, setVocabularyList] = useState<Vocabulary[]>([]);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Global Toasts
  const [toastMessage, setToastMessage] = useState('');

  // Fetches category/vocabulary/attempt/progress and rebuilds derived dashboard state.
  // Shared by initial load, post-login load, and post-practice refresh so lesson
  // progress always reflects the real backend state instead of a local guess.
  const loadDashboardData = async () => {
    try {
      const [catRes, vocabRes, attemptRes, progressRes] = await Promise.all([
        categoryApi.getAll(0, 100),
        vocabularyApi.getAll(0, 500),
        attemptApi.getRecentAttempts(5),
        practiceApi.getMyProgress()
      ]);

      const vocabList: Vocabulary[] = vocabRes.data.content.map(mapVocabularyResponse);

      const mappedLessons: Lesson[] = catRes.content.map(cat => {
        const relatedVocab = vocabRes.data.content.filter(v => v.categoryId === cat.id);
        let progress = 0;
        let status: 'Not Started' | 'In Progress' | 'Mastered' = 'Not Started';
        if (relatedVocab.length > 0 && progressRes.data) {
          const vocabIds = relatedVocab.map(v => v.id);
          const learnedCount = progressRes.data.filter(p => vocabIds.includes(p.vocabularyId) && p.learningStatus === 'LEARNED').length;
          const learningCount = progressRes.data.filter(p => vocabIds.includes(p.vocabularyId) && p.learningStatus === 'LEARNING').length;

          if (learnedCount === relatedVocab.length) {
            progress = 100;
            status = 'Mastered';
          } else if (learnedCount > 0 || learningCount > 0) {
            progress = Math.round((learnedCount / relatedVocab.length) * 100);
            status = 'In Progress';
          }
        }

        return {
          id: cat.id.toString(),
          title: cat.name,
          description: cat.description,
          duration: '10 min',
          level: 'Beginner',
          category: 'Alphabet',
          image: LESSON_THUMBNAIL,
          rating: 5,
          vocabulary: relatedVocab.map(v => v.id.toString()),
          progress,
          status,
          thumbnail: LESSON_THUMBNAIL
        };
      });

      // BE's AttemptResponse only carries a boolean isCorrect (no confidence score
      // for incorrect attempts), so 0/100 is the honest value here, not a guess.
      const recentResultsMapped: RecentResult[] = attemptRes.data.map(att => ({
        id: att.attemptId.toString(),
        sign: att.word,
        accuracy: att.isCorrect ? 100 : 0,
        icon: 'front_hand',
        statusText: att.isCorrect ? 'Correct' : 'Needs Practice',
        timeAgo: new Date(att.attemptedAt).toLocaleDateString()
      }));

      setVocabularyList(vocabList);
      setLessons(mappedLessons);
      setRecentResults(recentResultsMapped);
    } catch (error) {
      console.error("Failed to fetch initial data", error);
    }
  };

  // Attempt auto-login if token exists
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    authApi.getCurrentUser().then(userRes => {
      if (userRes.data) {
        setCurrentUser(mapUserResponseToUser(userRes.data));
        setIsLoggedIn(true);
        loadDashboardData();
      }
    }).catch(() => {
      // Token might be expired, user needs to login manually
      localStorage.removeItem('accessToken');
    });
  }, []);

  // Admin functions
  useEffect(() => {
    if (currentTab === 'admin' && isLoggedIn) {
      adminApi.getUsers(0, 50).then(res => {
        const mappedUsers: User[] = res.content.map(u => ({
          id: u.userId.toString(),
          name: u.fullName,
          email: u.email,
          status: u.status === 'ACTIVE' ? 'Active' : 'Idle',
          proficiency: 0, // BE khong tra ve chi so nay, chua co du lieu thuc de hien thi
          lastActive: new Date(u.createdAt).toLocaleDateString(),
          avatar: u.avatarUrl || DEFAULT_AVATAR
        }));
        setUsers(mappedUsers);
      }).catch(err => {
        console.error("Admin access denied or failed", err);
      });
    }
  }, [currentTab, isLoggedIn]);

  const handleToggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newStatus = user.status === 'Active' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminApi.toggleUserStatus(Number(userId), newStatus);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus === 'ACTIVE' ? 'Active' : 'Idle' } : u));
      displayToast(`User status updated to ${newStatus}`);
    } catch (error) {
      displayToast('Failed to update user status');
    }
  };

  const handleAddVocabulary = async (newVocab: { name: string; categoryId: number; description: string; expectedId?: number; file?: File }) => {
    try {
      const res = await adminApi.createVocabulary(newVocab.categoryId, newVocab.name, newVocab.description);
      const createdId = res.data.id;

      if (newVocab.file && newVocab.expectedId !== undefined) {
        await adminApi.uploadVocabularyVideo(createdId, newVocab.expectedId, newVocab.file);
      }

      displayToast(`Vocabulary ${newVocab.name} added!`);
      // Refresh vocab list
      const vocabRes = await vocabularyApi.getAll(0, 500);
      setVocabularyList(vocabRes.data.content.map(mapVocabularyResponse));
    } catch (error) {
      displayToast('Failed to add vocabulary');
    }
  };

  const handleDeleteVocabulary = async (vocabId: string) => {
    try {
      await adminApi.deleteVocabulary(Number(vocabId));
      setVocabularyList(prev => prev.filter(v => v.id !== vocabId));
      displayToast('Vocabulary deleted');
    } catch (error) {
      displayToast('Failed to delete vocabulary');
    }
  };

  const displayToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4500);
  };

  // Handler Actions
  const handleRegister = async (name: string, email: string, password: string) => {
    try {
      const response = await authApi.register({ email, password, fullName: name, username: email.split('@')[0] });
      if (response.data) {
        displayToast('Account created successfully! Please sign in.');
        setIsRegistering(false);
      }
    } catch (error) {
      displayToast('Registration failed. Email might already exist.');
    }
  };

  const handleLogin = async (email: string, password?: string) => {
    if (password) {
      try {
        const response = await authApi.login({ email, password });
        if (response.data) {
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);

          // Login response already includes the user profile, no need for a
          // separate GET /auth/me round-trip right after signing in.
          const newUser = mapUserResponseToUser(response.data.user);
          setCurrentUser(newUser);
          setUsers(prev => prev.some(u => u.id === newUser.id) ? prev : [newUser, ...prev]);
        }
        setIsLoggedIn(true);
        displayToast('Successfully signed in. Welcome back!');
      } catch (error) {
        displayToast('Invalid credentials. Please try again.');
        return; // Important: Stop execution so we don't login
      }
    } else {
      // Guest login fallback when no password is provided
      const guestId = `guest_${Date.now()}`;
      const guestUser: User = {
        id: guestId,
        name: email.split('@')[0],
        email: email,
        status: 'Active',
        proficiency: 15,
        lastActive: 'Just now',
        avatar: DEFAULT_AVATAR
      };

      setCurrentUser(guestUser);
      setUsers(prev => [guestUser, ...prev]);
      setIsLoggedIn(true);
    }

    setCurrentTab('dashboard');
    displayToast('Signmentor: Signed in successfully!');

    // Fetch data after login
    await loadDashboardData();
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setIsLoggedIn(false);
      setSelectedLessonId(null);
      displayToast('Goodbye! You have been signed out.');
    }
  };

  // Called after a real AI evaluation completes: refresh recent results and
  // lesson progress from the backend instead of faking a local increment.
  const handleRecordPracticeResult = async (signName: string, score: number) => {
    displayToast(`AI Evaluation Complete! Accuracy: ${score}% on Sign '${signName}'`);
    await loadDashboardData();
  };

  // Launch AI Practice lab from a custom selected Lesson
  const handleLaunchPracticeAndFocus = (lessonId: string, initialSignName?: string) => {
    setSelectedPracticeSignName(initialSignName || 'Letter A');
    setCurrentTab('practice');
  };

  const handleUpdateUser = (updated: User) => {
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  const currentActiveLesson = lessons.find(l => l.id === selectedLessonId);

  // Sign in conditional block
  if (!isLoggedIn || !currentUser) {
    if (isRegistering) {
      return (
        <RegisterView
          onRegister={handleRegister}
          onSwitchToLogin={() => setIsRegistering(false)}
        />
      );
    }
    return (
      <LoginView
        onLogin={handleLogin}
        onSwitchToRegister={() => setIsRegistering(true)}
      />
    );
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
                onUpdateUser={handleUpdateUser}
              />
            )}

            {currentTab === 'admin' && <AdminView users={users} vocabularyList={vocabularyList} lessons={lessons} onToggleUserStatus={handleToggleUserStatus} onAddVocabulary={handleAddVocabulary} onDeleteVocabulary={handleDeleteVocabulary} />}
          </>
        )}
      </main>
    </div>
  );
}
