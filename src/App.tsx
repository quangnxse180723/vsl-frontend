import React, { useState, useEffect } from 'react';
import { INITIAL_LESSONS, INITIAL_ACHIEVEMENTS } from './data';
import { User, Lesson, Vocabulary, RecentResult, Achievement } from './types';
import {
  api,
  BEUser, BEVocab, BEAttempt, BECategory,
  saveTokens, clearTokens, getRefreshToken,
} from './services/api';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import LessonsView from './components/LessonsView';
import LessonDetailView from './components/LessonDetailView';
import AIPracticeView from './components/AIPracticeView';
import AdminView from './components/AdminView';
import ProfileView from './components/ProfileView';

// ── mappers ──────────────────────────────────────────────────────────────────

const DEFAULT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCMy9-SdPa9x8ZD7EDImuDsWy9UD4_M-lCxo2_zZ1TSdh6GMk-_uKkdsooMAVrJvBiVstA-Bz5t4sSpDDbWZ355wNtoSgWxBngZyl3z_0HKazXsSbJvE9v8oAI8Mwcg7SvbjsP4h31I49mQLt1Fh_QfYbKEYJFdrDj6eo_xD04NyH95tkrefWuYywsTcjg9z624nNis-HRUFfPZluEMquSWsiG6zjX4kB0S4M3OyQ4G7bfkTqc6o6dmz7vBPBxL4GTCjj05ZVtwIiCd';

const PLACEHOLDER_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCoKYzPFx3Xn0vGAwpzYP9EjYQp3pWd5lx0xWN3n3UtgoIs0U6cytkejgaHc6kUvTPYgciONKdeYXtweQ9rI33qK6MTZvo6g_x4YepsJNyVGFWFhBAuvLldc2lPqi0pPLJYmZvP6oyEIeO0jm1SLnaNVrpF3zf6hEjDPGOORbtmZ4OmXE23r-ZKv4d0D3FkfG1HAbfwMP59fODnS_mfCjG5-U319CjGAKJiEQ_pnb2imWqILcKfBGHaLCNxcVFsZu2jCVSQ904QK7Ml';

function mapBEUser(u: BEUser): User {
  return {
    id: String(u.userId),
    name: u.fullName || u.username,
    email: u.email,
    status: u.status === 'ACTIVE' ? 'Active' : 'Idle',
    proficiency: 0,
    lastActive: 'Just now',
    avatar: u.avatarUrl || DEFAULT_AVATAR,
  };
}

function mapBEVocab(v: BEVocab): Vocabulary {
  return {
    id: String(v.id),
    name: v.word,
    category: v.categoryName,
    attribute: 'Movement',
    image: v.videoTutorialUrl || PLACEHOLDER_IMG,
    description: v.description || '',
    expectedId: v.expectedId ?? undefined,
  };
}

const ATTEMPT_ICONS: RecentResult['icon'][] = ['front_hand', 'back_hand', 'waving_hand'];

function mapBEAttempt(a: BEAttempt, idx: number): RecentResult {
  return {
    id: String(a.attemptId),
    sign: `VSL '${a.word}'`,
    accuracy: a.isCorrect ? 100 : 0,
    icon: ATTEMPT_ICONS[idx % 3],
    statusText: a.isCorrect ? 'Correct' : 'Incorrect',
    timeAgo: new Date(a.attemptedAt).toLocaleDateString('vi-VN'),
  };
}

// ── component ─────────────────────────────────────────────────────────────────

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const [currentUser, setCurrentUser] = useState<User>({
    id: '',
    name: '',
    email: '',
    status: 'Active',
    proficiency: 0,
    lastActive: '',
    avatar: DEFAULT_AVATAR,
  });

  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'lessons' | 'practice' | 'profile' | 'admin'
  >('dashboard');

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedPracticeSignName, setSelectedPracticeSignName] = useState('Letter A');

  const [users, setUsers] = useState<User[]>([]);
  const [lessons] = useState<Lesson[]>(INITIAL_LESSONS);
  const [vocabularyList, setVocabularyList] = useState<Vocabulary[]>([]);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [achievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [beCategories, setBeCategories] = useState<BECategory[]>([]);

  const [toastMessage, setToastMessage] = useState('');

  // ── session restore ────────────────────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoadingSession(false);
      return;
    }
    api
      .getMe()
      .then((res) => {
        setCurrentUser(mapBEUser(res.data));
        setIsLoggedIn(true);
        loadAppData(res.data.role === 'ADMIN');
      })
      .catch(() => clearTokens())
      .finally(() => setIsLoadingSession(false));
  }, []);

  // ── data loading ───────────────────────────────────────────────────────────

  const loadAppData = (isAdmin: boolean) => {
    api
      .getRecentAttempts(5)
      .then((res) => setRecentResults(res.data.map(mapBEAttempt)))
      .catch(() => {});

    api
      .getVocabularies()
      .then((res) => setVocabularyList(res.data.content.map(mapBEVocab)))
      .catch(() => {});

    if (isAdmin) {
      api
        .adminGetUsers()
        .then((res) => setUsers(res.content.map(mapBEUser)))
        .catch(() => {});

      api
        .adminGetCategories()
        .then((res) => setBeCategories(res.content))
        .catch(() => {});
    }
  };

  // ── helpers ────────────────────────────────────────────────────────────────

  const displayToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // ── auth handlers ──────────────────────────────────────────────────────────

  const handleLogin = async (
    email: string,
    password: string,
  ): Promise<string | null> => {
    try {
      const res = await api.login(email, password);
      const { accessToken, refreshToken, user } = res.data;
      saveTokens(accessToken, refreshToken);
      setCurrentUser(mapBEUser(user));
      setIsLoggedIn(true);
      setCurrentTab('dashboard');
      loadAppData(user.role === 'ADMIN');
      displayToast('Signed in successfully!');
      return null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      return msg;
    }
  };

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await api.logout(refreshToken).catch(() => {});
    }
    clearTokens();
    setIsLoggedIn(false);
    setSelectedLessonId(null);
    setUsers([]);
    setVocabularyList([]);
    setRecentResults([]);
    displayToast('Goodbye! You have been signed out.');
  };

  // ── admin handlers ─────────────────────────────────────────────────────────

  const handleToggleUserStatus = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const newBEStatus: 'ACTIVE' | 'INACTIVE' =
      user.status === 'Active' ? 'INACTIVE' : 'ACTIVE';

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: newBEStatus === 'ACTIVE' ? 'Active' : 'Idle', lastActive: 'Just now' }
          : u,
      ),
    );

    try {
      await api.adminUpdateUser(Number(userId), { status: newBEStatus });
    } catch {
      // Revert on failure
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: user.status } : u)),
      );
      displayToast('Failed to update user status.');
    }
  };

  const handleAddVocabulary = async (newVocab: {
    name: string;
    category: string;
    description: string;
    file?: File;
  }) => {
    const category = beCategories.find(
      (c) => c.name.toLowerCase() === newVocab.category.toLowerCase(),
    );

    if (!category) {
      displayToast(`Category "${newVocab.category}" not found in BE. Please refresh.`);
      return;
    }

    try {
      const res = await api.adminCreateVocabulary({
        categoryId: category.id,
        word: newVocab.name,
        description: newVocab.description || undefined,
      });

      const created = res.data;

      if (newVocab.file) {
        await api.adminUploadVocabVideo(created.id, newVocab.file, 0).catch(() => {});
      }

      setVocabularyList((prev) => [mapBEVocab(created), ...prev]);
      displayToast(`Library Updated! Added "${newVocab.name}" successfully.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      displayToast(`Failed to add vocabulary: ${msg}`);
    }
  };

  const handleDeleteVocabulary = (vocabId: string) => {
    const deletedItem = vocabularyList.find((v) => v.id === vocabId);
    setVocabularyList((prev) => prev.filter((v) => v.id !== vocabId));
    if (deletedItem) {
      displayToast(`Removed "${deletedItem.name}" from active configuration.`);
    }
  };

  // ── practice handlers ──────────────────────────────────────────────────────

  const handleRecordPracticeResult = (signName: string, score: number) => {
    const freshResult: RecentResult = {
      id: `res-${Date.now()}`,
      sign: `VSL '${signName}'`,
      accuracy: score,
      icon: 'front_hand',
      statusText: 'Verified now',
      timeAgo: 'Just now',
    };
    setRecentResults((prev) => [freshResult, ...prev.slice(0, 4)]);
    displayToast(`AI Evaluation Complete! Accuracy: ${score}% on Sign '${signName}'`);
  };

  const handleLaunchPracticeAndFocus = (_lessonId: string, initialSignName?: string) => {
    setSelectedPracticeSignName(initialSignName || 'Letter A');
    setCurrentTab('practice');
  };

  // ── render ─────────────────────────────────────────────────────────────────

  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">
          progress_activity
        </span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  const currentActiveLesson = lessons.find((l) => l.id === selectedLessonId);

  return (
    <div className="bg-mesh min-h-screen flex flex-col md:flex-row antialiased font-sans">

      {/* GLOBAL TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-on-surface text-surface text-sm font-semibold rounded-xl shadow-xl flex items-center gap-2 border border-outline-variant/30 animate-pulse">
          <span className="material-symbols-outlined text-primary text-xl">info</span>
          {toastMessage}
        </div>
      )}

      {/* Side Nav */}
      <aside className="w-full md:w-64 bg-surface-container-lowest shrink-0 border-b md:border-b-0 md:border-r border-outline-variant/30 px-5 py-6 flex flex-col justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-2 px-2">
            <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center border border-primary/20 shadow-sm text-primary">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                sign_language
              </span>
            </div>
            <div>
              <span className="font-display font-bold text-xl text-primary leading-none block">SignMentor</span>
              <p className="text-[10px] text-outline font-semibold">AI Sign Learning</p>
            </div>
          </div>

          <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 gap-1.5 scrollbar-none select-none">
            {(
              [
                { tab: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
                { tab: 'lessons', icon: 'school', label: 'Lessons' },
                { tab: 'practice', icon: 'psychology', label: 'AI Practice' },
                { tab: 'profile', icon: 'account_circle', label: 'Profile' },
                { tab: 'admin', icon: 'admin_panel_settings', label: 'Admin Console' },
              ] as const
            ).map(({ tab, icon, label }) => (
              <button
                key={tab}
                onClick={() => { setCurrentTab(tab); setSelectedLessonId(null); }}
                className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition-colors shrink-0 text-sm font-bold ${
                  currentTab === tab
                    ? 'bg-primary-container/10 text-primary'
                    : 'text-outline hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{icon}</span>
                <span className="md:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>

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

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {selectedLessonId && currentActiveLesson ? (
          <LessonDetailView
            lesson={currentActiveLesson}
            vocabList={vocabularyList}
            onBack={() => setSelectedLessonId(null)}
            onLaunchPractice={handleLaunchPracticeAndFocus}
            onUpdateLessonProgress={() => {}}
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
                  displayToast('Daily challenge started!');
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
                categories={beCategories}
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
