import axiosClient from './axiosClient';
import { ApiResponse } from './authApi';
import { PageResponse } from './categoryApi';

export interface VocabularyResponse {
  id: number;
  categoryId: number;
  categoryName: string;
  word: string;
  description: string;
  videoTutorialUrl: string;
  expectedId: number;
}

export const vocabularyApi = {
  getAll: (page = 0, size = 100): Promise<ApiResponse<PageResponse<VocabularyResponse>>> => {
    return axiosClient.get(`/vocabularies?page=${page}&size=${size}`);
  },
  getById: (id: number): Promise<ApiResponse<VocabularyResponse>> => {
    return axiosClient.get(`/vocabularies/${id}`);
  },
  getByCategory: (categoryId: number, page = 0, size = 100): Promise<ApiResponse<PageResponse<VocabularyResponse>>> => {
    return axiosClient.get(`/vocabularies/category/${categoryId}?page=${page}&size=${size}`);
  },
  search: (keyword: string, page = 0, size = 100): Promise<ApiResponse<PageResponse<VocabularyResponse>>> => {
    return axiosClient.get(`/vocabularies/search?keyword=${keyword}&page=${page}&size=${size}`);
  }
};
