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
  lastLogin: string | null;
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
  status: 'DRAFT' | 'PUBLISHED' | 'REMOVED';
  authorId: number | null;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
  // Tuong tac (BE luon tra ve)
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  // Chi co khi status = REMOVED (bai bi admin go) - chi tac gia thay
  deletionReason: string | null;
}

export interface BlogCommentResponse {
  id: number;
  blogId: number;
  userId: number | null;
  userName: string | null;
  userAvatar: string | null;
  content: string;
  createdAt: string;
}

export interface LikeToggleResponse {
  liked: boolean;
  likeCount: number;
}

export interface LikeUserResponse {
  userId: number | null;
  userName: string | null;
  userAvatar: string | null;
  createdAt: string;
}

export interface BlogReportResponse {
  id: number;
  reason: string;
  status: 'PENDING' | 'RESOLVED';
  createdAt: string;
  resolvedAt: string | null;
  reporterId: number | null;
  reporterName: string | null;
  blogId: number | null;
  blogTitle: string | null;
  blogContent: string | null;
  blogThumbnailUrl: string | null;
  blogStatus: 'DRAFT' | 'PUBLISHED' | 'REMOVED' | null;
  blogAuthorId: number | null;
  blogAuthorName: string | null;
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

  updateVocabulary: (id: number, categoryId: number, word: string, description: string): Promise<ApiResponse<any>> => {
    return axiosClient.put(`/admin/vocabulary/${id}`, {
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

  getBlogComments: (id: number): Promise<BlogCommentResponse[]> => {
    return axiosClient.get(`/admin/blogs/${id}/comments`);
  },

  getBlogLikers: (id: number): Promise<LikeUserResponse[]> => {
    return axiosClient.get(`/admin/blogs/${id}/likes`);
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

  // ─── Reports (admin xu ly to cao) ─────────────────────────────────────────
  getReports: (page = 0, size = 50): Promise<PageResponse<BlogReportResponse>> => {
    return axiosClient.get(`/admin/reports?page=${page}&size=${size}`);
  },

  getPendingReportCount: (): Promise<number> => {
    return axiosClient.get('/admin/reports/pending-count');
  },

  resolveReport: (reportId: number): Promise<string> => {
    return axiosClient.put(`/admin/reports/${reportId}/resolve`);
  },

  // Go bai bi to cao kem ly do -> bai chuyen REMOVED, tac gia thay ly do
  removeBlogWithReason: (blogId: number, reason: string): Promise<string> => {
    return axiosClient.post(`/admin/reports/blogs/${blogId}/remove`, { reason });
  },
};
