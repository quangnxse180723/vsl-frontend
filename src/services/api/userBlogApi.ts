import axiosClient from './axiosClient';
import { AdminBlogResponse, PageResponse, CreateBlogPayload, UpdateBlogPayload } from './adminApi';

export const userBlogApi = {
  getBlogs: (page = 0, size = 20): Promise<PageResponse<AdminBlogResponse>> => {
    return axiosClient.get(`/user/blogs?page=${page}&size=${size}`);
  },

  createBlog: (payload: CreateBlogPayload): Promise<AdminBlogResponse> => {
    return axiosClient.post('/user/blogs', payload);
  },

  updateBlog: (id: number, payload: UpdateBlogPayload): Promise<AdminBlogResponse> => {
    return axiosClient.put(`/user/blogs/${id}`, payload);
  },

  deleteBlog: (id: number): Promise<string> => {
    return axiosClient.delete(`/user/blogs/${id}`);
  },

  uploadBlogThumbnail: (id: number, imageFile: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return axiosClient.post(`/user/blogs/${id}/thumbnail`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
