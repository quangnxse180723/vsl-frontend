import axiosClient from './axiosClient';
import { ApiResponse } from './authApi';

export interface AchievementApiResponse {
  id: number;
  key: string;
  name: string;
  description: string;
  iconKey: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export const achievementApi = {
  getAll: (): Promise<ApiResponse<AchievementApiResponse[]>> => {
    return axiosClient.get('/practice/achievements');
  }
};
