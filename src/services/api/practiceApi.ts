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

export const practiceApi = {
  getMyProgress: (): Promise<ApiResponse<UserProgressResponse[]>> => {
    return axiosClient.get('/practice/progress');
  },
  
  evaluate: (videoFile: File, expectedId: number): Promise<ApiResponse<EvaluationResponse>> => {
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('expectedId', expectedId.toString());
    
    return axiosClient.post('/practice/evaluate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};
