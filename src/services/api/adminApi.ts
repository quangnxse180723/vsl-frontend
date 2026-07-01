import axiosClient from './axiosClient';
import { ApiResponse } from './authApi';

export interface AdminUserResponse {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface AdminCategoryResponse {
  id: number;
  name: string;
  description: string;
}

export const adminApi = {
  getUsers: (page = 0, size = 100): Promise<PageResponse<AdminUserResponse>> => {
    // AdminUserController returns ResponseEntity<Page<UserResponse>> directly (no ApiResponse wrapper)
    return axiosClient.get(`/admin/users?page=${page}&size=${size}`);
  },

  toggleUserStatus: (id: number, status: string): Promise<AdminUserResponse> => {
    return axiosClient.put(`/admin/users/${id}`, { status });
  },

  createVocabulary: (categoryId: number, word: string, description: string): Promise<ApiResponse<any>> => {
    return axiosClient.post('/admin/vocabulary', {
      categoryId,
      word,
      description
    });
  },

  uploadVocabularyVideo: (vocabularyId: number, expectedId: number, videoFile: File): Promise<ApiResponse<string>> => {
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('expectedId', expectedId.toString());

    return axiosClient.post(`/admin/vocabulary/${vocabularyId}/tutorial-video`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteVocabulary: (id: number): Promise<ApiResponse<void>> => {
    return axiosClient.delete(`/admin/vocabulary/${id}`);
  },

  getCategories: (page = 0, size = 100): Promise<PageResponse<AdminCategoryResponse>> => {
    // Note: GET /api/admin/categories doesn't wrap in ApiResponse in backend
    return axiosClient.get(`/admin/categories?page=${page}&size=${size}`);
  },

  createCategory: (name: string, description: string): Promise<AdminCategoryResponse> => {
    return axiosClient.post('/admin/categories', { name, description });
  },

  updateCategory: (id: number, name: string, description: string): Promise<AdminCategoryResponse> => {
    return axiosClient.put(`/admin/categories/${id}`, { name, description });
  },

  deleteCategory: (id: number): Promise<string> => {
    return axiosClient.delete(`/admin/categories/${id}`);
  }
};
