import axiosClient from './axiosClient';
import { ApiResponse } from '../../types/api';

export interface PublicStats {
  totalUsers: number;
  totalVocabs: number;
  satisfactionRate: number;
}

export const publicApi = {
  getLandingStats: () => {
    return axiosClient.get<any, ApiResponse<PublicStats>>('/public/stats');
  }
};
