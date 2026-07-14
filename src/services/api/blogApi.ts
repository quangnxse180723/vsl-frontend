import axiosClient from './axiosClient';
import { AdminBlogResponse, PageResponse, BlogCommentResponse, LikeToggleResponse } from './adminApi';

export const blogApi = {
  getPublished: (page = 0, size = 10): Promise<PageResponse<AdminBlogResponse>> => {
    return axiosClient.get(`/blogs?page=${page}&size=${size}`);
  },

  getById: (id: number): Promise<AdminBlogResponse> => {
    return axiosClient.get(`/blogs/${id}`);
  },

  // ─── Tuong tac (yeu cau dang nhap tru GET comments) ───
  toggleLike: (id: number): Promise<LikeToggleResponse> => {
    return axiosClient.post(`/blogs/${id}/like`);
  },

  getComments: (id: number): Promise<BlogCommentResponse[]> => {
    return axiosClient.get(`/blogs/${id}/comments`);
  },

  addComment: (id: number, content: string): Promise<BlogCommentResponse> => {
    return axiosClient.post(`/blogs/${id}/comments`, { content });
  },

  deleteComment: (blogId: number, commentId: number): Promise<string> => {
    return axiosClient.delete(`/blogs/${blogId}/comments/${commentId}`);
  },

  report: (id: number, reason: string): Promise<string> => {
    return axiosClient.post(`/blogs/${id}/report`, { reason });
  },
};
