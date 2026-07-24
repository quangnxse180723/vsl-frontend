import axiosClient from './axiosClient';
import { ApiResponse } from './authApi';

export type SuggestionStatus = 'PENDING' | 'REVIEWED';

export interface VocabularyExistsResult {
  exists: boolean;
  word: string | null;         // cach viet chuan (co dau) cua tu da ton tai
  categoryId: number | null;
  categoryName: string | null;
}

export interface SynonymItem {
  word: string;
  categoryName: string;
}

export interface VocabularySynonymResult {
  aiChecked: boolean;   // AI bật & được gọi (false = tắt/không có key)
  aiError: boolean;     // đã gọi nhưng thất bại (vd hết quota) -> hiện thông báo lỗi
  synonyms: SynonymItem[];
}

export interface VocabularySuggestionResponse {
  id: number;
  word: string;
  description: string | null;
  status: SuggestionStatus;
  createdAt: string;
  reviewedAt: string | null;
  categoryId: number;
  categoryName: string;
  requesterId: number;
  requesterName: string;
}

export interface CreateSuggestionPayload {
  categoryId: number;
  word: string;
  description?: string;
}

export const vocabularySuggestionApi = {
  // Kiem tra tu vung da ton tai chua (so khop chinh xac, toan he thong)
  checkExists: (word: string): Promise<ApiResponse<VocabularyExistsResult>> => {
    return axiosClient.get(`/vocabularies/exists?word=${encodeURIComponent(word)}`);
  },
  // Quet AI tim tu dong nghia da co (goi y, khong chan submit).
  // Gemini co the cham nen tang timeout rieng cho request nay (mac dinh axios 15s).
  checkSynonyms: (word: string): Promise<ApiResponse<VocabularySynonymResult>> => {
    return axiosClient.get(`/vocabularies/ai-synonyms?word=${encodeURIComponent(word)}`, { timeout: 50000 });
  },
  submit: (payload: CreateSuggestionPayload): Promise<ApiResponse<VocabularySuggestionResponse>> => {
    return axiosClient.post('/vocabulary-suggestions', payload);
  },
  getMine: (): Promise<ApiResponse<VocabularySuggestionResponse[]>> => {
    return axiosClient.get('/vocabulary-suggestions/mine');
  },
};
