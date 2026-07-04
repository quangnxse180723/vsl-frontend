const BASE_URL = 'http://localhost:8080';

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

function getToken(): string | null {
  return localStorage.getItem('accessToken');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// BE response shapes
export interface ApiResp<T> {
  code: string;
  data: T;
  message: string;
  success: boolean;
}

export interface BEUser {
  userId: number;
  username: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface BEAuthData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: BEUser;
}

export interface BEVocab {
  id: number;
  categoryId: number;
  categoryName: string;
  word: string;
  description: string | null;
  videoTutorialUrl: string | null;
  expectedId: number | null;
}

export interface BECategory {
  id: number;
  name: string;
  description: string | null;
}

export interface BEAttempt {
  attemptId: number;
  vocabularyId: number;
  word: string;
  categoryId: number;
  categoryName: string;
  expectedId: number;
  isCorrect: boolean;
  aiPredictedCode: number;
  attemptedAt: string;
}

export interface BEPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

export const api = {
  login: (email: string, password: string) =>
    request<ApiResp<BEAuthData>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: (refreshToken: string) =>
    request<ApiResp<void>>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  getMe: () => request<ApiResp<BEUser>>('/api/auth/me'),

  getRecentAttempts: (limit = 5) =>
    request<ApiResp<BEAttempt[]>>(`/api/attempts/recent?limit=${limit}`),

  getVocabularies: (page = 0, size = 100) =>
    request<ApiResp<BEPage<BEVocab>>>(`/api/vocabularies?page=${page}&size=${size}`),

  adminGetUsers: (page = 0, size = 50) =>
    request<BEPage<BEUser>>(`/api/admin/users?page=${page}&size=${size}`),

  adminUpdateUser: (id: number, data: { status?: 'ACTIVE' | 'INACTIVE'; role?: 'USER' | 'ADMIN' }) =>
    request<BEUser>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  adminGetCategories: (page = 0, size = 50) =>
    request<BEPage<BECategory>>(`/api/admin/categories?page=${page}&size=${size}`),

  adminCreateVocabulary: (data: { categoryId: number; word: string; description?: string }) =>
    request<ApiResp<BEVocab>>('/api/admin/vocabulary', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminUploadVocabVideo: (vocabId: number, file: File, expectedId: number) => {
    const formData = new FormData();
    formData.append('video', file);
    return request<ApiResp<string>>(
      `/api/admin/vocabulary/${vocabId}/tutorial-video?expectedId=${expectedId}`,
      { method: 'POST', body: formData },
    );
  },

  getPracticeStats: () =>
    request<ApiResp<PracticeStats>>('/api/practice/stats'),

  getAchievements: () =>
    request<ApiResp<AchievementItem[]>>('/api/practice/achievements'),

  evaluate: (videoBlob: Blob, expectedId: number) => {
    const formData = new FormData();
    formData.append('video', videoBlob, 'practice.webm');
    return request<ApiResp<EvaluationResponse>>(
      `/api/practice/evaluate?expectedId=${expectedId}`,
      { method: 'POST', body: formData },
    );
  },
};

export interface PracticeStats {
  totalAttempts: number;
  correctAttempts: number;
  learnedCount: number;
  totalVocabs: number;
  accuracyRate: number;
  proficiency: number;
}

export interface AchievementItem {
  id: number;
  key: string;
  name: string;
  description: string;
  iconKey: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface EvaluationResponse {
  status: 'CORRECT' | 'ALMOST_CORRECT' | 'INCORRECT';
  message: string;
  confidence: number;
  predictedId: number;
  rank: number;
}
