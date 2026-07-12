import axiosClient from './axiosClient';
import { PageResponse } from './adminApi';

export interface AdminSummaryResponse {
  totalStudents: number;
  totalVisits: number;
  totalVocabularies: number;
  totalBlogs: number;
}

export interface VisitTimePoint {
  label: string;
  count: number;
}

export interface VisitLogResponse {
  id: number;
  visitorType: 'USER' | 'GUEST';
  userId: number | null;
  userName: string | null;
  userAvatar: string | null;
  deviceInfo: string | null;
  ipAddress: string | null;
  location: string | null;
  visitedAt: string;
}

export type Granularity = 'DAY' | 'MONTH' | 'YEAR';

// Dinh danh on dinh cho 1 phien tab (giu trong sessionStorage: reload/dieu huong
// noi bo van giu, tab moi thi sinh moi). Gui kem moi lan track de BE upsert: luot
// GUEST luc mo app va luot USER luc dang nhap la CUNG 1 phien -> chi 1 dong log.
function getVisitSessionId(): string {
  let id = sessionStorage.getItem('visit_session_id');
  if (!id) {
    id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('visit_session_id', id);
  }
  return id;
}

export const analyticsApi = {
  // Cong khai: ghi 1 luot truy cap (khach hoac hoc vien)
  trackVisit: (): Promise<void> => {
    return axiosClient.post('/visits/track', null, {
      headers: { 'X-Visit-Session': getVisitSessionId() },
    });
  },

  getSummary: (): Promise<AdminSummaryResponse> => {
    return axiosClient.get('/admin/analytics/summary');
  },

  getVisitTimeSeries: (from: string, to: string, granularity: Granularity): Promise<VisitTimePoint[]> => {
    return axiosClient.get(`/admin/analytics/visits/timeseries?from=${from}&to=${to}&granularity=${granularity}`);
  },

  getVisitLogs: (page = 0, size = 10): Promise<PageResponse<VisitLogResponse>> => {
    return axiosClient.get(`/admin/analytics/visits?page=${page}&size=${size}`);
  },
};
