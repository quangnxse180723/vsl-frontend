import React, { useState, useEffect } from 'react';
import { User, Lesson, Vocabulary, RecentResult, Achievement } from './types';
import { UserResponse } from './types/api';
import { authApi } from './services/api/authApi';
import { categoryApi } from './services/api/categoryApi';
import { vocabularyApi, VocabularyResponse } from './services/api/vocabularyApi';
import { attemptApi } from './services/api/attemptApi';
import { practiceApi, PracticeStatsResponse } from './services/api/practiceApi';
import { achievementApi, AchievementApiResponse } from './services/api/achievementApi';
import { adminApi } from './services/api/adminApi';
import { analyticsApi } from './services/api/analyticsApi';
import LoginView from './pages/LoginView';
import RegisterView from './pages/RegisterView';
import ForgotPasswordView from './pages/ForgotPasswordView';
import DashboardView from './pages/DashboardView';
import LessonsView from './pages/LessonsView';
import LessonDetailView from './pages/LessonDetailView';
import AIPracticeView from './pages/AIPracticeView';
import AdminView from './pages/AdminView';
import ProfileView from './pages/ProfileView';
import BlogView from './pages/BlogView';
import MyBlogsView from './pages/MyBlogsView';
import LandingPage from './pages/LandingPage';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop';
const VOCAB_THUMBNAIL = 'https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
const LESSON_THUMBNAIL = 'https://images.unsplash.com/photo-1621644788102-171bba70eb10?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

// BE's Achievement entity has no color field (it's presentation-only), so each
// known achievement key gets a fixed gradient here. Unknown future keys fall
// back to a neutral gradient instead of breaking the badge grid.
const ACHIEVEMENT_COLORS: Record<string, string> = {
  FIRST_STEP: 'from-sky-400 to-blue-500',
  CORRECT_10: 'from-emerald-400 to-green-500',
  CORRECT_50: 'from-fuchsia-400 to-purple-500',
  LEARNED_5: 'from-amber-400 to-orange-500',
  LEARNED_20: 'from-teal-400 to-cyan-500',
  ALL_LEARNED: 'from-yellow-400 to-amber-500',
  PROFICIENCY_50: 'from-indigo-400 to-violet-500',
  PROFICIENCY_100: 'from-pink-400 to-rose-500'
};
const DEFAULT_ACHIEVEMENT_COLOR = 'from-slate-400 to-slate-500';

// Mirrors the unlock thresholds in AchievementServiceImpl.checkAndUnlock (BE has
// no endpoint that returns "how close am I", so it's derived here from /practice/stats
// using the same keys/thresholds as the backend source of truth).
const ACHIEVEMENT_PROGRESS: Record<string, (s: PracticeStatsResponse) => { current: number; target: number; unit: string }> = {
  FIRST_STEP: s => ({ current: s.totalAttempts, target: 1, unit: 'lượt' }),
  CORRECT_10: s => ({ current: s.correctAttempts, target: 10, unit: 'lần đúng' }),
  CORRECT_50: s => ({ current: s.correctAttempts, target: 50, unit: 'lần đúng' }),
  LEARNED_5: s => ({ current: s.learnedCount, target: 5, unit: 'từ' }),
  LEARNED_20: s => ({ current: s.learnedCount, target: 20, unit: 'từ' }),
  ALL_LEARNED: s => ({ current: s.learnedCount, target: Math.max(s.totalVocabs, 1), unit: 'từ' }),
  PROFICIENCY_50: s => ({ current: s.proficiency, target: 50, unit: '%' }),
  PROFICIENCY_100: s => ({ current: s.proficiency, target: 100, unit: '%' })
};

function mapAchievementResponse(a: AchievementApiResponse, stats: PracticeStatsResponse | null): Achievement {
  const progressFn = ACHIEVEMENT_PROGRESS[a.key];
  const progress = progressFn && stats ? progressFn(stats) : undefined;

  return {
    id: a.id.toString(),
    title: a.name,
    description: a.description,
    icon: a.iconKey,
    color: ACHIEVEMENT_COLORS[a.key] || DEFAULT_ACHIEVEMENT_COLOR,
    secured: a.unlocked,
    progressCurrent: progress ? Math.min(progress.current, progress.target) : undefined,
    progressTarget: progress?.target,
    progressUnit: progress?.unit
  };
}

function mapUserResponseToUser(u: UserResponse): User {
  return {
    id: u.userId.toString(),
    name: u.fullName,
    email: u.email,
    status: u.status === 'ACTIVE' ? 'Active' : 'Idle',
    proficiency: 0,
    lastActive: 'Vừa xong',
    avatar: u.avatarUrl || DEFAULT_AVATAR,
    role: u.role === 'ADMIN' ? 'ADMIN' : 'USER'
  };
}

function mapVocabularyResponse(v: VocabularyResponse): Vocabulary {
  return {
    id: v.id.toString(),
    name: v.word,
    category: v.categoryName,
    categoryId: v.categoryId,
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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'lessons' | 'practice' | 'profile' | 'admin' | 'blog' | 'my-blogs'>('dashboard');
  const [showLanding, setShowLanding] = useState(true);

  // Drill-down Detail Lesson State
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedPracticeSignName, setSelectedPracticeSignName] = useState<string | undefined>(undefined);

  // Dynamic Data States
  const [users, setUsers] = useState<User[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [vocabularyList, setVocabularyList] = useState<Vocabulary[]>([]);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [practiceStats, setPracticeStats] = useState<PracticeStatsResponse | null>(null);

  // Global Toasts
  const [toastMessage, setToastMessage] = useState('');

  // Admin accounts get a completely separate admin-only experience (no learner UI).
  const isAdmin = currentUser?.role === 'ADMIN';

  // Fetches category/vocabulary/attempt/progress and rebuilds derived dashboard state.
  // Shared by initial load, post-login load, and post-practice refresh so lesson
  // progress always reflects the real backend state instead of a local guess.
  const loadDashboardData = async () => {
    // Core lesson/progress/history data. Kept in its own try so a failure in the
    // secondary stats/achievements block below can't wipe the lessons + recent list
    // (previously all six calls shared one Promise.all, so any single rejection
    // nuked the entire dashboard).
    try {
      const [catRes, vocabRes, attemptRes, progressRes] = await Promise.all([
        categoryApi.getAll(0, 100),
        vocabularyApi.getAll(0, 500),
        attemptApi.getRecentAttempts(5),
        practiceApi.getMyProgress()
      ]);

      // Gan learningStatus tung tu vung tu /practice/progress (khong co dong nao
      // trong do = chua tung luyen tap = "Chua hoc", hien thi mac dinh undefined).
      const progressByVocabId = new Map(progressRes.data.map(p => [p.vocabularyId, p.learningStatus]));
      const vocabList: Vocabulary[] = vocabRes.data.content.map(v => ({
        ...mapVocabularyResponse(v),
        learningStatus: progressByVocabId.get(v.id)
      }));

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
          level: 'Beginner',
          category: cat.name,
          image: cat.imageUrl || LESSON_THUMBNAIL,
          vocabulary: relatedVocab.map(v => v.id.toString()),
          progress,
          status,
          thumbnail: cat.imageUrl || LESSON_THUMBNAIL
        };
      });

      // Use the real model confidence (probability assigned to the expected sign,
      // 0-100) as this attempt's accuracy. Legacy rows saved before confidence was
      // tracked have null - fall back to the binary correct/incorrect value there.
      const recentResultsMapped: RecentResult[] = attemptRes.data.map(att => ({
        id: att.attemptId.toString(),
        sign: att.word,
        accuracy: att.confidence != null ? Math.round(att.confidence) : (att.isCorrect ? 100 : 0),
        icon: 'front_hand',
        statusText: att.isCorrect ? 'Chính xác' : 'Cần luyện thêm',
        timeAgo: new Date(att.attemptedAt).toLocaleDateString()
      }));

      setVocabularyList(vocabList);
      setLessons(mappedLessons);
      setRecentResults(recentResultsMapped);
    } catch (error) {
      console.error("Failed to fetch core dashboard data", error);
    }

    // Practice stats (proficiency, streak) + achievements. Independent from the
    // core block so if this fails, lessons/recent still update, and vice versa.
    try {
      const [statsRes, achievementsRes] = await Promise.all([
        practiceApi.getStats(),
        achievementApi.getAll()
      ]);
      setPracticeStats(statsRes.data);
      setAchievements(achievementsRes.data.map(a => mapAchievementResponse(a, statsRes.data)));
    } catch (error) {
      console.error("Failed to fetch practice stats / achievements", error);
    }
  };

  // Ghi 1 luot truy cap moi phien trinh duyet (ca khach lan hoc vien).
  // sessionStorage giu co trong 1 phien tab -> reload khong dem trung; tab/phien
  // moi se dem lai. Chay 1 lan khi mo app, bat ke da dang nhap hay chua.
  useEffect(() => {
    if (sessionStorage.getItem('visit_tracked')) return;
    sessionStorage.setItem('visit_tracked', '1');
    analyticsApi.trackVisit().catch(() => {
      // Tracking that bai khong duoc anh huong trai nghiem
      sessionStorage.removeItem('visit_tracked');
    });
  }, []);

  // Attempt auto-login if token exists
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    authApi.getCurrentUser().then(userRes => {
      if (userRes.data) {
        setCurrentUser(mapUserResponseToUser(userRes.data));
        setIsLoggedIn(true);
        setShowLanding(false);
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
        // Hoat dong gan nhat = lan dang nhap thuc te (khong phai ngay tao tai khoan)
        lastActive: u.lastLogin ? new Date(u.lastLogin).toLocaleString('vi-VN') : 'Chưa đăng nhập',
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
    if (isAdmin && isLoggedIn) {
      loadAdminUsers();
    }
  }, [isAdmin, isLoggedIn]);

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

  const handleUpdateVocabulary = async (vocabId: string, data: { name: string; categoryId: number; description: string; expectedId?: number; videoFile?: File; imageFile?: File }) => {
    try {
      await adminApi.updateVocabulary(Number(vocabId), data.categoryId, data.name, data.description);

      // Video moi (thay video cu) - can expectedId di kem
      if (data.videoFile && data.expectedId !== undefined) {
        await adminApi.uploadVocabularyVideo(Number(vocabId), data.expectedId, data.videoFile);
      }
      // Anh moi (endpoint tu xoa anh cu tren MinIO)
      if (data.imageFile) {
        await adminApi.uploadVocabularyImage(Number(vocabId), data.imageFile);
      }

      // Tai lai danh sach de dong bo ten danh muc / URL anh-video moi
      const vocabRes = await vocabularyApi.getAll(0, 500);
      setVocabularyList(vocabRes.data.content.map(mapVocabularyResponse));
      displayToast(`Đã cập nhật từ vựng "${data.name}"!`);
    } catch (error) {
      displayToast('Không thể cập nhật từ vựng');
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
    // KHONG bat loi o day: man dang ky khong render toast, nen de loi lan ra
    // cho RegisterView hien thi truc tiep (kem thong bao that tu backend).
    const response = await authApi.register({ email, password, fullName: name, username });
    if (response.data) {
      setIsRegistering(false);
      displayToast('Tạo tài khoản thành công! Vui lòng đăng nhập.');
    }
  };

  const handleLogin = async (email: string, password?: string) => {
    if (password) {
      try {
        const response = await authApi.login({ email, password });
        if (response.data) {
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);

          // Ghi lai 1 luot truy cap SAU khi da co token -> backend gan visit voi
          // user (interceptor tu dinh kem Bearer). Luot track luc mo app la GUEST
          // vi luc do chua dang nhap, nen neu khong track lai o day thi admin luon
          // thay hoc vien duoi dang "Khach".
          analyticsApi.trackVisit().catch(() => { /* tracking that bai khong anh huong dang nhap */ });

          // Login response already includes the user profile, no need for a
          // separate GET /auth/me round-trip right after signing in.
          const newUser = mapUserResponseToUser(response.data.user);
          setCurrentUser(newUser);
          setUsers(prev => prev.some(u => u.id === newUser.id) ? prev : [newUser, ...prev]);
        }
        setIsLoggedIn(true);
        displayToast('Đăng nhập thành công. Chào mừng trở lại!');
      } catch (error: any) {
        // AUTH_1006 = tai khoan bi admin chuyen sang INACTIVE (xem GlobalExceptionHandler).
        // Nem loi ra ngoai (thay vi displayToast) de LoginView hien thi truc tiep -
        // toast KHONG duoc render tren man dang nhap nen truoc day loi bi "cam nin".
        const errorCode = error?.response?.data?.code;
        throw new Error(
          errorCode === 'AUTH_1006'
            ? 'Tài khoản của bạn đã bị quản trị viên vô hiệu hóa.'
            : 'Sai thông tin đăng nhập. Vui lòng kiểm tra lại email và mật khẩu.'
        );
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
      setCurrentUser(null);
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

  // Show landing page when explicitly requested (works for both logged-in and logged-out users)
  if (showLanding) {
    // Build real stats from practiceStats + lessons when logged in
    const realStats = practiceStats ? {
      streak: practiceStats.currentStreak ?? 0,
      accuracy: practiceStats.accuracyRate != null ? Math.round(practiceStats.accuracyRate) : 0,
      learnedCount: practiceStats.totalAttempts ?? 0,
    } : null;

    const realLessons = lessons.slice(0, 2).map(l => ({
      title: l.title,
      progress: l.progress ?? 0,
    }));

    return (
      <LandingPage
        currentUser={currentUser ? { name: currentUser.name, avatar: currentUser.avatar } : null}
        realStats={isLoggedIn ? realStats : null}
        realLessons={isLoggedIn && realLessons.length > 0 ? realLessons : undefined}
        onNavigate={(tab) => {
          setShowLanding(false);
          setCurrentTab(tab);
        }}
        onGetStarted={() => {
          setShowLanding(false);
          if (isLoggedIn) {
            setCurrentTab('lessons');
          } else {
            setIsRegistering(true);
          }
        }}
        onLogin={() => {
          setShowLanding(false);
          if (isLoggedIn) {
            setCurrentTab('dashboard');
          }
        }}
      />
    );
  }

  // Sign in conditional block
  if (!isLoggedIn || !currentUser) {
    if (isForgotPassword) {
      return (
        <ForgotPasswordView
          onBack={() => { setIsForgotPassword(false); setShowLanding(true); }}
          onResetSuccess={() => {
            setIsForgotPassword(false);
            displayToast('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
          }}
        />
      );
    }
    
    if (isRegistering) {
      return (
        <RegisterView
          onRegister={handleRegister}
          onSwitchToLogin={() => setIsRegistering(false)}
          onBack={() => { setIsRegistering(false); setShowLanding(true); }}
        />
      );
    }
    return (
      <LoginView
        onLogin={handleLogin}
        onSwitchToRegister={() => setIsRegistering(true)}
        onForgotPassword={() => setIsForgotPassword(true)}
        onBack={() => setShowLanding(true)}
      />
    );
  }

  // Admin accounts land straight in the admin panel - a fully separate full-screen
  // experience with its own vertical sidebar. They never see the learner UI.
  if (isAdmin) {
    return (
      <>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 p-4 bg-on-surface text-surface text-sm font-semibold rounded-xl shadow-xl flex items-center gap-2 border border-outline-variant/30 animate-pulse">
            <span className="material-symbols-outlined text-primary text-xl">info</span>
            {toastMessage}
          </div>
        )}
        <AdminView
          currentUser={currentUser}
          users={users}
          vocabularyList={vocabularyList}
          lessons={lessons}
          onToggleUserStatus={handleToggleUserStatus}
          onAddVocabulary={handleAddVocabulary}
          onDeleteVocabulary={handleDeleteVocabulary}
          onUpdateVocabulary={handleUpdateVocabulary}
          onRefreshCategories={loadDashboardData}
          onLogout={handleLogout}
        />
      </>
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
          {/* Brand Logo - click to go to landing page */}
          <button
            onClick={() => setShowLanding(true)}
            className="flex items-center gap-2 px-2 w-full text-left bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center border border-primary/20 shadow-sm text-primary">
              <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>sign_language</span>
            </div>
            <div>
              <span className="font-display font-bold text-xl text-primary leading-none block">SignMentor</span>
              <p className="text-[10px] text-outline font-semibold">Học Ngôn Ngữ Ký Hiệu Cùng AI</p>
            </div>
          </button>

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
                practiceStats={practiceStats}
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

            {currentTab === 'blog' && (
              <BlogView currentUser={currentUser} />
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
