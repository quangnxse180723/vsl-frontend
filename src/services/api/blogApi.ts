import axiosClient from './axiosClient';
import { AdminBlogResponse, PageResponse } from './adminApi';

export const blogApi = {
  getPublished: (page = 0, size = 10): Promise<PageResponse<AdminBlogResponse>> => {
    return axiosClient.get(`/blogs?page=${page}&size=${size}`);
  },

  getById: (id: number): Promise<AdminBlogResponse> => {
    return axiosClient.get(`/blogs/${id}`);
  },
};
