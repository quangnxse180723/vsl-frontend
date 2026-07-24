import axiosClient from './axiosClient';
import {
  AdminBlogResponse,
  BlogCommentResponse,
  BlogNotificationResponse,
  BlogReplyResponse,
  BlogSearchResponse,
  BlogShareResponse,
  BlogUserSummaryResponse,
  FollowStatusResponse,
  LikeToggleResponse,
  PageResponse
} from './adminApi';

export const blogApi = {
  getPublished: (page = 0, size = 10): Promise<PageResponse<AdminBlogResponse>> => {
    return axiosClient.get(`/blogs?page=${page}&size=${size}`);
  },

  getById: (id: number): Promise<AdminBlogResponse> => {
    return axiosClient.get(`/blogs/${id}`);
  },

  search: (keyword: string, page = 0, size = 10): Promise<BlogSearchResponse> => {
    const q = encodeURIComponent(keyword);
    return axiosClient.get(`/blogs/search?keyword=${q}&page=${page}&size=${size}`);
  },

  getPublishedByUser: (userId: number, page = 0, size = 20): Promise<PageResponse<AdminBlogResponse>> => {
    return axiosClient.get(`/blogs/users/${userId}?page=${page}&size=${size}`);
  },

  // ─── Tuong tac (yeu cau dang nhap tru GET comments) ───
  toggleLike: (id: number): Promise<LikeToggleResponse> => {
    return axiosClient.post(`/blogs/${id}/like`);
  },

  getComments: (id: number): Promise<BlogCommentResponse[]> => {
    return axiosClient.get(`/blogs/${id}/comments`);
  },

  addComment: (id: number, content: string, mentionedUserId?: number | null): Promise<BlogCommentResponse> => {
    return axiosClient.post(`/blogs/${id}/comments`, { content, mentionedUserId });
  },

  deleteComment: (blogId: number, commentId: number): Promise<string> => {
    return axiosClient.delete(`/blogs/${blogId}/comments/${commentId}`);
  },

  report: (id: number, reason: string): Promise<string> => {
    return axiosClient.post(`/blogs/${id}/report`, { reason });
  },

  toggleCommentLike: (commentId: number): Promise<LikeToggleResponse> => {
    return axiosClient.post(`/blogs/comments/${commentId}/like`);
  },

  getReplies: (commentId: number, page = 0, size = 10): Promise<PageResponse<BlogReplyResponse>> => {
    return axiosClient.get(`/blogs/comments/${commentId}/replies?page=${page}&size=${size}`);
  },

  addReply: (commentId: number, content: string, mentionedUserId?: number | null): Promise<BlogReplyResponse> => {
    return axiosClient.post(`/blogs/comments/${commentId}/replies`, { content, mentionedUserId });
  },

  deleteReply: (replyId: number): Promise<void> => {
    return axiosClient.delete(`/blogs/replies/${replyId}`);
  },

  toggleReplyLike: (replyId: number): Promise<LikeToggleResponse> => {
    return axiosClient.post(`/blogs/replies/${replyId}/like`);
  },

  share: (blogId: number, shareType: 'COPY_URL' | 'PROFILE', recipientUserId?: number | null): Promise<BlogShareResponse> => {
    const recipient = recipientUserId ? `&recipientUserId=${recipientUserId}` : '';
    return axiosClient.post(`/blogs/${blogId}/share?shareType=${shareType}${recipient}`);
  },

  follow: (userId: number): Promise<FollowStatusResponse> => {
    return axiosClient.post(`/users/${userId}/follow`);
  },

  unfollow: (userId: number): Promise<FollowStatusResponse> => {
    return axiosClient.delete(`/users/${userId}/follow`);
  },

  getFollowers: (userId: number, page = 0, size = 20): Promise<PageResponse<BlogUserSummaryResponse>> => {
    return axiosClient.get(`/users/${userId}/followers?page=${page}&size=${size}`);
  },

  getFollowing: (userId: number, page = 0, size = 20): Promise<PageResponse<BlogUserSummaryResponse>> => {
    return axiosClient.get(`/users/${userId}/following?page=${page}&size=${size}`);
  },

  getNotifications: (page = 0, size = 20): Promise<PageResponse<BlogNotificationResponse>> => {
    return axiosClient.get(`/blogs/notifications?page=${page}&size=${size}`);
  },

  getUnreadNotificationCount: (): Promise<number> => {
    return axiosClient.get('/blogs/notifications/unread-count');
  },

  markNotificationRead: (id: number): Promise<BlogNotificationResponse> => {
    return axiosClient.patch(`/blogs/notifications/${id}/read`);
  },

  markAllNotificationsRead: (): Promise<string> => {
    return axiosClient.patch('/blogs/notifications/read-all');
  },
};
