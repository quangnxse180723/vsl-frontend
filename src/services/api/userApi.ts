import axiosClient from './axiosClient';

export interface UserProfileResponse {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  status: string;
  createdAt: string;
  emailNotificationsEnabled: boolean;
}

export const userApi = {
  // UserController returns these DTOs/strings directly (no ApiResponse wrapper)
  getProfile: (): Promise<UserProfileResponse> => {
    return axiosClient.get('/users/me');
  },

  updateProfile: (data: { username: string; email: string; fullName: string }): Promise<UserProfileResponse> => {
    return axiosClient.put('/users/me', data);
  },

  updatePassword: (data: { oldPassword: string; newPassword: string }): Promise<string> => {
    return axiosClient.put('/users/password', data);
  },

  deleteAccount: (): Promise<string> => {
    return axiosClient.delete('/users/me');
  },

  uploadAvatar: (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post('/users/avatar/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  updateAvatarUrl: (avatarUrl: string): Promise<UserProfileResponse> => {
    return axiosClient.put('/users/avatar', { avatarUrl });
  },

  updateNotificationSettings: (emailNotificationsEnabled: boolean): Promise<UserProfileResponse> => {
    return axiosClient.patch(`/users/me/notifications?emailNotificationsEnabled=${emailNotificationsEnabled}`);
  }
};
