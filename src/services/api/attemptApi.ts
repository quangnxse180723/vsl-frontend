import axiosClient from './axiosClient';
import { ApiResponse } from './authApi';
import { PageResponse } from './categoryApi';

export interface AttemptResponse {
  attemptId: number;
  vocabularyId: number;
  word: string;
  categoryId: number;
  categoryName: string;
  expectedId: number;
  isCorrect: boolean;
  aiPredictedCode: number;
  // Model's probability for the expected sign (0-100). Null for legacy attempts
  // recorded before confidence was tracked.
  confidence: number | null;
  attemptedAt: string;
}

export const attemptApi = {
  getMyAttempts: (page = 0, size = 20): Promise<ApiResponse<PageResponse<AttemptResponse>>> => {
    return axiosClient.get(`/attempts?page=${page}&size=${size}`);
  },
  
  getRecentAttempts: (limit = 5): Promise<ApiResponse<AttemptResponse[]>> => {
    return axiosClient.get(`/attempts/recent?limit=${limit}`);
  }
};
