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
  imageUrl: string | null;
}

export interface AdminBlogResponse {
  id: number;
  title: string;
  content: string;
  thumbnailUrl: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  authorId: number | null;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlogPayload {
  title: string;
  content: string;
  status?: string;
}

export interface UpdateBlogPayload {
  title: string;
  content: string;
  status?: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateUserPayload {
  fullName?: string;
  role?: 'USER' | 'ADMIN';
  status?: 'ACTIVE' | 'INACTIVE';
  password?: string;
}

export const adminApi = {
  getUsers: (page = 0, size = 100): Promise<PageResponse<AdminUserResponse>> => {
    // AdminUserController returns ResponseEntity<Page<UserResponse>> directly (no ApiResponse wrapper)
    return axiosClient.get(`/admin/users?page=${page}&size=${size}`);
  },

  createUser: (payload: CreateUserPayload): Promise<AdminUserResponse> => {
    return axiosClient.post('/admin/users', payload);
  },

  updateUser: (id: number, payload: UpdateUserPayload): Promise<AdminUserResponse> => {
    return axiosClient.put(`/admin/users/${id}`, payload);
  },

  toggleUserStatus: (id: number, status: string): Promise<AdminUserResponse> => {
    return axiosClient.put(`/admin/users/${id}`, { status });
  },

  deleteUser: (id: number): Promise<string> => {
    return axiosClient.delete(`/admin/users/${id}`);
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

  uploadVocabularyImage: (vocabularyId: number, imageFile: File): Promise<ApiResponse<string>> => {
    const formData = new FormData();
    formData.append('image', imageFile);

    return axiosClient.post(`/admin/vocabulary/${vocabularyId}/image`, formData, {
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
  },

  uploadCategoryImage: (id: number, imageFile: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', imageFile);

    return axiosClient.post(`/admin/categories/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // ─── Blog ───────────────────────────────────────────────────────────────
  getBlogs: (page = 0, size = 20): Promise<PageResponse<AdminBlogResponse>> => {
    return axiosClient.get(`/admin/blogs?page=${page}&size=${size}`);
  },

  getBlogById: (id: number): Promise<AdminBlogResponse> => {
    return axiosClient.get(`/admin/blogs/${id}`);
  },

  createBlog: (payload: CreateBlogPayload): Promise<AdminBlogResponse> => {
    return axiosClient.post('/admin/blogs', payload);
  },

  updateBlog: (id: number, payload: UpdateBlogPayload): Promise<AdminBlogResponse> => {
    return axiosClient.put(`/admin/blogs/${id}`, payload);
  },

  deleteBlog: (id: number): Promise<string> => {
    return axiosClient.delete(`/admin/blogs/${id}`);
  },

  uploadBlogThumbnail: (id: number, imageFile: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return axiosClient.post(`/admin/blogs/${id}/thumbnail`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
