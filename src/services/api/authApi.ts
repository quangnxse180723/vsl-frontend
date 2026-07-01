import axiosClient from './axiosClient';
import { RegisterRequest, LoginRequest, AuthResponse, UserResponse } from '../../types/api';

// Definition of the generic API response to match backend's ApiResponse<T>
export interface ApiResponse<T> {
  message: string;
  data: T;
  timestamp: string;
  success: boolean;
}

export const authApi = {
  login: (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    return axiosClient.post('/auth/login', data);
  },

  register: (data: RegisterRequest): Promise<ApiResponse<UserResponse>> => {
    return axiosClient.post('/auth/register', data);
  },

  logout: (refreshToken: string): Promise<ApiResponse<void>> => {
    return axiosClient.post('/auth/logout', { refreshToken });
  },

  getCurrentUser: (): Promise<ApiResponse<UserResponse>> => {
    return axiosClient.get('/auth/me');
  },
  
  refreshToken: (refreshToken: string): Promise<ApiResponse<AuthResponse>> => {
    return axiosClient.post('/auth/refresh', { refreshToken });
  }
};
