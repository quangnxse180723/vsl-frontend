import axiosClient from './axiosClient';
import { ApiResponse } from './authApi';

export interface UserProgressResponse {
  vocabularyId: number;
  word: string;
  categoryName: string;
  learningStatus: 'LEARNING' | 'LEARNED';
  lastAttemptedAt: string;
}

export interface EvaluationResponse {
  status: 'CORRECT' | 'ALMOST_CORRECT' | 'INCORRECT';
  message: string;
  confidence: number;
  predictedId: number;
  rank: number;
}

export interface PracticeStatsResponse {
  totalAttempts: number;
  correctAttempts: number;
  learnedCount: number;
  totalVocabs: number;
  accuracyRate: number; // 0.0 - 100.0
  proficiency: number;  // 0 - 100 composite score
  currentStreak: number; // consecutive practice days up to today
  longestStreak: number; // best streak ever
  weekActivity: boolean[]; // 7 entries, oldest -> newest; last = today
}

export const practiceApi = {
  getMyProgress: (): Promise<ApiResponse<UserProgressResponse[]>> => {
    return axiosClient.get('/practice/progress');
  },

  getStats: (): Promise<ApiResponse<PracticeStatsResponse>> => {
    return axiosClient.get('/practice/stats');
  },

  evaluate: (videoFile: File, expectedId: number): Promise<ApiResponse<EvaluationResponse>> => {
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('expectedId', expectedId.toString());

    // The AI model can take well over a minute on a cold start (first inference
    // after the backend restarts). Without an explicit timeout, axios has none
    // by default and the UI would just hang forever on a stuck/slow request.
    return axiosClient.post('/practice/evaluate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 110000,
    });
  }
};
