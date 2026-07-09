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
import BlogView from './pages/BlogView';
import MyBlogsView from './pages/MyBlogsView';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop';
const VOCAB_THUMBNAIL = 'https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
const LESSON_THUMBNAIL = 'https://images.unsplash.com/photo-1621644788102-171bba70eb10?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

function mapUserResponseToUser(u: UserResponse): User {
  return {
    id: u.userId.toString(),
    name: u.fullName,
    email: u.email,
    status: u.status === 'ACTIVE' ? 'Active' : 'Idle',
    proficiency: 0,
    lastActive: 'Vừa xong',
    avatar: u.avatarUrl || DEFAULT_AVATAR
  };
}

function mapVocabularyResponse(v: VocabularyResponse): Vocabulary {
  return {
    id: v.id.toString(),
    name: v.word,
    category: v.categoryName,
    attribute: 'Chuyển động',
    image: v.imageUrl || VOCAB_THUMBNAIL,
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
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'lessons' | 'practice' | 'profile' | 'admin' | 'blog' | 'my-blogs'>('dashboard');

  // Drill-down Detail Lesson State
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedPracticeSignName, setSelectedPracticeSignName] = useState<string | undefined>(undefined);

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
          duration: '10 phút',
          level: 'Beginner',
          category: cat.name,
          image: cat.imageUrl || LESSON_THUMBNAIL,
          rating: 5,
          vocabulary: relatedVocab.map(v => v.id.toString()),
          progress,
          status,
          thumbnail: cat.imageUrl || LESSON_THUMBNAIL
        };
      });

      // BE's AttemptResponse only carries a boolean isCorrect (no confidence score
      // for incorrect attempts), so 0/100 is the honest value here, not a guess.
      const recentResultsMapped: RecentResult[] = attemptRes.data.map(att => ({
        id: att.attemptId.toString(),
        sign: att.word,
        accuracy: att.isCorrect ? 100 : 0,
        icon: 'front_hand',
        statusText: att.isCorrect ? 'Chính xác' : 'Cần luyện thêm',
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
  const loadAdminUsers = async () => {
    try {
      const res = await adminApi.getUsers(0, 50);
      const mappedUsers: User[] = res.content.map(u => ({
        id: u.userId.toString(),
        name: u.fullName,
        email: u.email,
        status: u.status === 'ACTIVE' ? 'Active' : 'Idle',
        proficiency: 0, // BE khong tra ve chi so nay, chua co du lieu thuc de hien thi
        lastActive: new Date(u.createdAt).toLocaleDateString(),
        avatar: u.avatarUrl || DEFAULT_AVATAR,
        username: u.username,
        role: u.role === 'ADMIN' ? 'ADMIN' : 'USER'
      }));
      setUsers(mappedUsers);
    } catch (err) {
      console.error("Admin access denied or failed", err);
    }
  };

  useEffect(() => {
    if (currentTab === 'admin' && isLoggedIn) {
      loadAdminUsers();
    }
  }, [currentTab, isLoggedIn]);

  const handleToggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newStatus = user.status === 'Active' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminApi.toggleUserStatus(Number(userId), newStatus);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus === 'ACTIVE' ? 'Active' : 'Idle' } : u));
      displayToast(`Đã cập nhật trạng thái người dùng thành ${newStatus === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'}`);
    } catch (error) {
      displayToast('Không thể cập nhật trạng thái người dùng');
    }
  };

  const handleCreateUser = async (payload: { username: string; email: string; password: string; fullName: string; role: 'USER' | 'ADMIN'; status: 'ACTIVE' | 'INACTIVE' }) => {
    try {
      await adminApi.createUser(payload);
      displayToast(`Đã tạo người dùng ${payload.username}`);
      await loadAdminUsers();
    } catch (error) {
      displayToast('Không thể tạo người dùng');
    }
  };

  const handleAdminUpdateUser = async (userId: string, payload: { fullName?: string; role?: 'USER' | 'ADMIN'; status?: 'ACTIVE' | 'INACTIVE'; password?: string }) => {
    try {
      await adminApi.updateUser(Number(userId), payload);
      displayToast('Đã cập nhật người dùng');
      await loadAdminUsers();
    } catch (error) {
      displayToast('Không thể cập nhật người dùng');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await adminApi.deleteUser(Number(userId));
      displayToast('Đã vô hiệu hóa người dùng');
      await loadAdminUsers();
    } catch (error) {
      displayToast('Không thể xóa người dùng');
    }
  };

  const handleAddVocabulary = async (newVocab: { name: string; categoryId: number; description: string; expectedId?: number; file?: File; imageFile?: File }) => {
    try {
      const res = await adminApi.createVocabulary(newVocab.categoryId, newVocab.name, newVocab.description);
      const createdId = res.data.id;

      if (newVocab.file && newVocab.expectedId !== undefined) {
        await adminApi.uploadVocabularyVideo(createdId, newVocab.expectedId, newVocab.file);
      }

      if (newVocab.imageFile) {
        await adminApi.uploadVocabularyImage(createdId, newVocab.imageFile);
      }

      displayToast(`Đã thêm từ vựng "${newVocab.name}"!`);
      // Refresh vocab list
      const vocabRes = await vocabularyApi.getAll(0, 500);
      setVocabularyList(vocabRes.data.content.map(mapVocabularyResponse));
    } catch (error) {
      displayToast('Không thể thêm từ vựng');
    }
  };

  const handleDeleteVocabulary = async (vocabId: string) => {
    try {
      await adminApi.deleteVocabulary(Number(vocabId));
      setVocabularyList(prev => prev.filter(v => v.id !== vocabId));
      displayToast('Đã xóa từ vựng');
    } catch (error) {
      displayToast('Không thể xóa từ vựng');
    }
  };

  const displayToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4500);
  };

  // Handler Actions
  const handleRegister = async (name: string, username: string, email: string, password: string) => {
    try {
      const response = await authApi.register({ email, password, fullName: name, username });
      if (response.data) {
        displayToast('Tạo tài khoản thành công! Vui lòng đăng nhập.');
        setIsRegistering(false);
      }
    } catch (error) {
      displayToast('Đăng ký thất bại. Email có thể đã được sử dụng.');
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
        displayToast('Đăng nhập thành công. Chào mừng trở lại!');
      } catch (error) {
        displayToast('Sai thông tin đăng nhập. Vui lòng thử lại.');
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
        lastActive: 'Vừa xong',
        avatar: DEFAULT_AVATAR
      };

      setCurrentUser(guestUser);
      setUsers(prev => [guestUser, ...prev]);
      setIsLoggedIn(true);
    }

    setCurrentTab('dashboard');
    displayToast('SignMentor: Đăng nhập thành công!');

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
      displayToast('Tạm biệt! Bạn đã đăng xuất.');
    }
  };

  // Called after a real AI evaluation completes: refresh recent results and
  // lesson progress from the backend instead of faking a local increment.
  const handleRecordPracticeResult = async (signName: string, score: number) => {
    displayToast(`Đánh giá AI hoàn tất! Độ chính xác: ${score}% với ký hiệu "${signName}"`);
    await loadDashboardData();
  };

  // Launch AI Practice lab from a custom selected Lesson
  const handleLaunchPracticeAndFocus = (lessonId: string, initialSignName?: string) => {
    setSelectedPracticeSignName(initialSignName);
    setCurrentTab('practice');
    // selectedLessonId takes precedence over currentTab in the main view switch below,
    // so it must be cleared here or the practice tab would never actually show.
    setSelectedLessonId(null);
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
              <p className="text-[10px] text-outline font-semibold">Học Ngôn Ngữ Ký Hiệu Cùng AI</p>
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
              <span className="md:inline">Tổng Quan</span>
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
              <span className="md:inline">Bài Học</span>
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
              <span className="md:inline">Luyện Tập AI</span>
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
              <span className="md:inline">Hồ Sơ</span>
            </button>

            {/* Blog link */}
            <button
              onClick={() => {
                setCurrentTab('blog');
                setSelectedLessonId(null);
              }}
              className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition-colors shrink-0 text-sm font-bold ${
                currentTab === 'blog'
                  ? 'bg-primary-container/10 text-primary'
                  : 'text-outline hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-lg">public</span>
              <span className="md:inline">Blog Cộng Đồng</span>
            </button>

            {/* My Blogs link */}
            <button
              onClick={() => {
                setCurrentTab('my-blogs');
                setSelectedLessonId(null);
              }}
              className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition-colors shrink-0 text-sm font-bold ${
                currentTab === 'my-blogs'
                  ? 'bg-primary-container/10 text-primary'
                  : 'text-outline hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-lg">edit_document</span>
              <span className="md:inline">Bài Viết Của Tôi</span>
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
              <span className="md:inline">Bảng Quản Trị</span>
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
                  // No backend concept of a "daily challenge" yet - deterministically
                  // pick a real vocabulary word for today instead of a fixed fake name.
                  if (vocabularyList.length > 0) {
                    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
                    const todayWord = vocabularyList[dayOfYear % vocabularyList.length];
                    setSelectedPracticeSignName(todayWord.name);
                    displayToast(`Thử thách hôm nay bắt đầu! Hãy luyện ký hiệu cho từ "${todayWord.name}".`);
                  } else {
                    setSelectedPracticeSignName(undefined);
                    displayToast('Thử thách hôm nay bắt đầu!');
                  }
                  setCurrentTab('practice');
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

            {currentTab === 'admin' && (
              <AdminView
                users={users}
                vocabularyList={vocabularyList}
                lessons={lessons}
                onToggleUserStatus={handleToggleUserStatus}
                onCreateUser={handleCreateUser}
                onUpdateUser={handleAdminUpdateUser}
                onDeleteUser={handleDeleteUser}
                onAddVocabulary={handleAddVocabulary}
                onDeleteVocabulary={handleDeleteVocabulary}
                onRefreshCategories={loadDashboardData}
              />
            )}

            {currentTab === 'blog' && (
              <BlogView />
            )}

            {currentTab === 'my-blogs' && (
              <MyBlogsView />
            )}
          </>
        )}
      </main>
    </div>
  );
}
