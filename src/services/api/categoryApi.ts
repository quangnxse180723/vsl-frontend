import axiosClient from './axiosClient';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CategoryResponse {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
}

export const categoryApi = {
  getAll: (page = 0, size = 100): Promise<PageResponse<CategoryResponse>> => {
    return axiosClient.get(`/categories?page=${page}&size=${size}`);
  },
  getById: (id: number): Promise<CategoryResponse> => {
    return axiosClient.get(`/categories/${id}`);
  }
};
