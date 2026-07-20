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

  register: (data: RegisterRequest & { otp: string }): Promise<ApiResponse<UserResponse>> => {
    return axiosClient.post('/auth/register', data);
  },

  sendRegisterOtp: (email: string, username: string): Promise<ApiResponse<void>> => {
    return axiosClient.post('/auth/send-register-otp', { email, username });
  },

  logout: (refreshToken: string): Promise<ApiResponse<void>> => {
    return axiosClient.post('/auth/logout', { refreshToken });
  },

  getCurrentUser: (): Promise<ApiResponse<UserResponse>> => {
    return axiosClient.get('/auth/me');
  },
  
  refreshToken: (refreshToken: string): Promise<ApiResponse<AuthResponse>> => {
    return axiosClient.post('/auth/refresh', { refreshToken });
  },

  forgotPassword: (email: string): Promise<ApiResponse<void>> => {
    return axiosClient.post('/auth/forgot-password', { email });
  },

  verifyOtp: (email: string, otp: string): Promise<ApiResponse<void>> => {
    return axiosClient.post('/auth/verify-otp', { email, otp });
  },

  resetPassword: (email: string, otp: string, newPassword: string): Promise<ApiResponse<void>> => {
    return axiosClient.post('/auth/reset-password', { email, otp, newPassword });
  }
};
