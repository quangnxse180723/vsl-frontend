import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { blogApi } from '../services/api/blogApi';
import {
  AdminBlogResponse,
  BlogCommentResponse,
  BlogNotificationResponse,
  BlogReplyResponse,
  BlogUserSummaryResponse
} from '../services/api/adminApi';
import { getApiErrorMessage } from '../services/api/apiError';
import { User } from '../types';
import {
  AtSign,
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  Copy,
  Flag,
  Heart,
  MessageCircle,
  RefreshCw,
  Reply,
  Search,
  Send,
  Share2,
  ShieldAlert,
  Trash2,
  User as UserIcon,
  UserCheck,
  UserPlus,
  Users,
  X
} from 'lucide-react';

interface BlogViewProps {
  currentUser: User;
}

type MentionTarget = {
  userId: number;
  name: string;
  avatarUrl: string | null;
};

const PAGE_SIZE = 50;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function displayUserName(user: Pick<BlogUserSummaryResponse, 'fullName' | 'username'>) {
  return user.fullName || user.username || 'Người dùng';
}

function insertMention(text: string, name: string) {
  const handle = `@${name.replace(/\s+/g, '')} `;
  if (!text.trim()) return handle;
  if (/@\S*$/.test(text)) return text.replace(/@\S*$/, handle);
  return `${handle}${text}`;
}

export default function BlogView({ currentUser }: BlogViewProps) {
  const currentUserId = Number(currentUser.id);
  const [blogs, setBlogs] = useState<AdminBlogResponse[]>([]);
  const [userResults, setUserResults] = useState<BlogUserSummaryResponse[]>([]);
  const [viewingUser, setViewingUser] = useState<BlogUserSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState<AdminBlogResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [comments, setComments] = useState<BlogCommentResponse[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentMention, setCommentMention] = useState<MentionTarget | null>(null);
  const [postingComment, setPostingComment] = useState(false);

  const [activeReplyCommentId, setActiveReplyCommentId] = useState<number | null>(null);
  const [repliesByComment, setRepliesByComment] = useState<Record<number, BlogReplyResponse[]>>({});
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});
  const [replyMentions, setReplyMentions] = useState<Record<number, MentionTarget | null>>({});
  const [replyLoading, setReplyLoading] = useState<Record<number, boolean>>({});

  const [notifications, setNotifications] = useState<BlogNotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [friends, setFriends] = useState<BlogUserSummaryResponse[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportDone, setReportDone] = useState(false);

  const updateBlogState = useCallback((blogId: number, patch: Partial<AdminBlogResponse>) => {
    setBlogs(prev => prev.map(blog => (blog.id === blogId ? { ...blog, ...patch } : blog)));
    setSelectedBlog(prev => (prev?.id === blogId ? { ...prev, ...patch } : prev));
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        blogApi.getNotifications(0, 10),
        blogApi.getUnreadNotificationCount()
      ]);
      setNotifications(list.content);
      setUnreadCount(count);
    } catch (err) {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  const loadPublishedBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogApi.getPublished(0, PAGE_SIZE);
      setBlogs(res.content);
      setUserResults([]);
      setViewingUser(null);
    } catch (err) {
      console.error('Failed to load blogs', err);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPublishedBlogs();
    refreshNotifications();
  }, [loadPublishedBlogs, refreshNotifications]);

  useEffect(() => {
    const term = searchQuery.trim();
    const timer = window.setTimeout(async () => {
      if (!term) {
        await loadPublishedBlogs();
        return;
      }

      setLoading(true);
      try {
        const res = await blogApi.search(term, 0, PAGE_SIZE);
        setBlogs(res.blogs.content);
        setUserResults(res.users.content);
        setViewingUser(null);
      } catch (err) {
        console.error('Failed to search blogs', err);
        setBlogs([]);
        setUserResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchQuery, loadPublishedBlogs]);

  const openBlog = useCallback(async (blog: AdminBlogResponse) => {
    setSelectedBlog(blog);
    setNewComment('');
    setCommentMention(null);
    setShowReport(false);
    setReportReason('');
    setReportError('');
    setReportDone(false);
    setShareOpen(false);
    setShareMessage('');
    setRepliesByComment({});
    setReplyInputs({});
    setReplyMentions({});
    setActiveReplyCommentId(null);
    setCommentsLoading(true);

    try {
      const [freshBlog, list] = await Promise.all([
        blogApi.getById(blog.id).catch(() => blog),
        blogApi.getComments(blog.id)
      ]);
      setSelectedBlog(freshBlog);
      setComments(list);
      setBlogs(prev => prev.map(item => (item.id === freshBlog.id ? freshBlog : item)));
    } catch (err) {
      console.error('Failed to load comments', err);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const openBlogById = async (blogId: number) => {
    try {
      const blog = await blogApi.getById(blogId);
      await openBlog(blog);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể mở bài viết.'));
    }
  };

  const mentionTargets = useMemo(() => {
    const map = new Map<number, MentionTarget>();
    if (selectedBlog?.authorId) {
      map.set(selectedBlog.authorId, {
        userId: selectedBlog.authorId,
        name: selectedBlog.authorName || 'Tác giả',
        avatarUrl: null
      });
    }
    comments.forEach(comment => {
      if (comment.userId) {
        map.set(comment.userId, {
          userId: comment.userId,
          name: comment.userName || 'Người dùng',
          avatarUrl: comment.userAvatar
        });
      }
    });
    Object.values(repliesByComment).flat().forEach(replyItem => {
      if (replyItem.userId) {
        map.set(replyItem.userId, {
          userId: replyItem.userId,
          name: replyItem.userName || 'Người dùng',
          avatarUrl: replyItem.userAvatar
        });
      }
    });
    return Array.from(map.values()).filter(target => target.userId !== currentUserId);
  }, [comments, currentUserId, repliesByComment, selectedBlog]);

  const handleToggleBlogLike = async () => {
    if (!selectedBlog) return;
    const previous = selectedBlog;
    updateBlogState(selectedBlog.id, {
      likedByMe: !previous.likedByMe,
      likeCount: previous.likeCount + (previous.likedByMe ? -1 : 1)
    });
    try {
      const res = await blogApi.toggleLike(selectedBlog.id);
      updateBlogState(selectedBlog.id, { likedByMe: res.liked, likeCount: res.likeCount });
    } catch (err) {
      updateBlogState(previous.id, {
        likedByMe: previous.likedByMe,
        likeCount: previous.likeCount
      });
    }
  };

  const handleToggleFollow = async (authorId: number, currentlyFollowing: boolean) => {
    try {
      const status = currentlyFollowing
        ? await blogApi.unfollow(authorId)
        : await blogApi.follow(authorId);

      setBlogs(prev => prev.map(blog => (
        blog.authorId === authorId
          ? { ...blog, followedAuthor: status.followedByMe, friendWithAuthor: status.friend }
          : blog
      )));
      setSelectedBlog(prev => (
        prev?.authorId === authorId
          ? { ...prev, followedAuthor: status.followedByMe, friendWithAuthor: status.friend }
          : prev
      ));
      setUserResults(prev => prev.map(user => (
        user.userId === authorId
          ? {
              ...user,
              followedByMe: status.followedByMe,
              followsMe: status.followsMe,
              friend: status.friend,
              followerCount: status.followerCount,
              followingCount: status.followingCount
            }
          : user
      )));
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể cập nhật theo dõi.'));
    }
  };

  const handleViewUserBlogs = async (user: BlogUserSummaryResponse) => {
    setLoading(true);
    try {
      const res = await blogApi.getPublishedByUser(user.userId, 0, PAGE_SIZE);
      setBlogs(res.content);
      setViewingUser(user);
      setUserResults([]);
      setSelectedBlog(null);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể tải bài viết của người dùng này.'));
    } finally {
      setLoading(false);
    }
  };

  const chooseCommentMention = (target: MentionTarget) => {
    setCommentMention(target);
    setNewComment(prev => insertMention(prev, target.name));
  };

  const chooseReplyMention = (commentId: number, target: MentionTarget) => {
    setReplyMentions(prev => ({ ...prev, [commentId]: target }));
    setReplyInputs(prev => ({
      ...prev,
      [commentId]: insertMention(prev[commentId] || '', target.name)
    }));
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlog || !newComment.trim()) return;
    setPostingComment(true);
    try {
      const created = await blogApi.addComment(
        selectedBlog.id,
        newComment.trim(),
        commentMention?.userId || null
      );
      setComments(prev => [created, ...prev]);
      updateBlogState(selectedBlog.id, { commentCount: selectedBlog.commentCount + 1 });
      setNewComment('');
      setCommentMention(null);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể gửi bình luận.'));
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!selectedBlog) return;
    if (!window.confirm('Xóa bình luận này?')) return;
    try {
      await blogApi.deleteComment(selectedBlog.id, commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      updateBlogState(selectedBlog.id, {
        commentCount: Math.max(0, selectedBlog.commentCount - 1)
      });
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể xóa bình luận.'));
    }
  };

  const handleToggleCommentLike = async (commentId: number) => {
    const previous = comments.find(comment => comment.id === commentId);
    if (!previous) return;

    setComments(prev => prev.map(comment => (
      comment.id === commentId
        ? {
            ...comment,
            likedByMe: !comment.likedByMe,
            likeCount: comment.likeCount + (comment.likedByMe ? -1 : 1)
          }
        : comment
    )));

    try {
      const res = await blogApi.toggleCommentLike(commentId);
      setComments(prev => prev.map(comment => (
        comment.id === commentId
          ? { ...comment, likedByMe: res.liked, likeCount: res.likeCount }
          : comment
      )));
    } catch (err) {
      setComments(prev => prev.map(comment => (comment.id === commentId ? previous : comment)));
    }
  };

  const loadReplies = async (commentId: number, force = false) => {
    if (!force && repliesByComment[commentId]) return;
    setReplyLoading(prev => ({ ...prev, [commentId]: true }));
    try {
      const res = await blogApi.getReplies(commentId, 0, 20);
      setRepliesByComment(prev => ({ ...prev, [commentId]: res.content }));
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể tải trả lời.'));
    } finally {
      setReplyLoading(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const handleAddReply = async (commentId: number) => {
    const content = replyInputs[commentId]?.trim();
    if (!content) return;
    try {
      const created = await blogApi.addReply(commentId, content, replyMentions[commentId]?.userId || null);
      setRepliesByComment(prev => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), created]
      }));
      setComments(prev => prev.map(comment => (
        comment.id === commentId
          ? { ...comment, replyCount: comment.replyCount + 1 }
          : comment
      )));
      setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
      setReplyMentions(prev => ({ ...prev, [commentId]: null }));
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể gửi trả lời.'));
    }
  };

  const handleDeleteReply = async (commentId: number, replyId: number) => {
    if (!window.confirm('Xóa trả lời này?')) return;
    try {
      await blogApi.deleteReply(replyId);
      setRepliesByComment(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || []).filter(replyItem => replyItem.id !== replyId)
      }));
      setComments(prev => prev.map(comment => (
        comment.id === commentId
          ? { ...comment, replyCount: Math.max(0, comment.replyCount - 1) }
          : comment
      )));
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể xóa trả lời.'));
    }
  };

  const handleToggleReplyLike = async (commentId: number, replyId: number) => {
    const previous = repliesByComment[commentId]?.find(replyItem => replyItem.id === replyId);
    if (!previous) return;

    setRepliesByComment(prev => ({
      ...prev,
      [commentId]: (prev[commentId] || []).map(replyItem => (
        replyItem.id === replyId
          ? {
              ...replyItem,
              likedByMe: !replyItem.likedByMe,
              likeCount: replyItem.likeCount + (replyItem.likedByMe ? -1 : 1)
            }
          : replyItem
      ))
    }));

    try {
      const res = await blogApi.toggleReplyLike(replyId);
      setRepliesByComment(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || []).map(replyItem => (
          replyItem.id === replyId
            ? { ...replyItem, likedByMe: res.liked, likeCount: res.likeCount }
            : replyItem
        ))
      }));
    } catch (err) {
      setRepliesByComment(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || []).map(replyItem => (
          replyItem.id === replyId ? previous : replyItem
        ))
      }));
    }
  };

  const handleCopyShare = async () => {
    if (!selectedBlog) return;
    try {
      const res = await blogApi.share(selectedBlog.id, 'COPY_URL');
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(res.blogUrl);
      }
      setShareMessage('Đã sao chép liên kết.');
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể chia sẻ bài viết.'));
    }
  };

  const loadFriends = async () => {
    setFriendsLoading(true);
    try {
      const res = await blogApi.getFollowing(currentUserId, 0, 100);
      setFriends(res.content.filter(user => user.friend));
    } catch (err) {
      setFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleToggleSharePanel = async () => {
    const next = !shareOpen;
    setShareOpen(next);
    setShareMessage('');
    if (next && friends.length === 0) {
      await loadFriends();
    }
  };

  const handleShareToFriend = async (friend: BlogUserSummaryResponse) => {
    if (!selectedBlog) return;
    try {
      await blogApi.share(selectedBlog.id, 'PROFILE', friend.userId);
      setShareMessage(`Đã chia sẻ với ${displayUserName(friend)}.`);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Chỉ có thể chia sẻ qua profile với bạn bè.'));
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlog || !reportReason.trim()) {
      setReportError('Vui lòng nhập lý do báo cáo.');
      return;
    }
    setReportSubmitting(true);
    setReportError('');
    try {
      await blogApi.report(selectedBlog.id, reportReason.trim());
      setReportDone(true);
    } catch (err) {
      setReportError(getApiErrorMessage(err, 'Không thể gửi báo cáo. Vui lòng thử lại.'));
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleNotificationClick = async (notification: BlogNotificationResponse) => {
    try {
      if (!notification.read) {
        await blogApi.markNotificationRead(notification.id);
        setNotifications(prev => prev.map(item => (
          item.id === notification.id ? { ...item, read: true } : item
        )));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      if (notification.blogId) {
        await openBlogById(notification.blogId);
      }
      setNotificationsOpen(false);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể mở thông báo.'));
    }
  };

  const handleMarkAllNotifications = async () => {
    try {
      await blogApi.markAllNotificationsRead();
      setNotifications(prev => prev.map(item => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể cập nhật thông báo.'));
    }
  };

  const renderMentionPicker = (
    visible: boolean,
    onPick: (target: MentionTarget) => void
  ) => {
    if (!visible || mentionTargets.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 pt-2">
        {mentionTargets.slice(0, 6).map(target => (
          <button
            key={target.userId}
            type="button"
            onClick={() => onPick(target)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container text-xs font-semibold text-on-surface-variant hover:text-primary border border-outline-variant/30"
          >
            <AtSign className="w-3 h-3" />
            {target.name}
          </button>
        ))}
      </div>
    );
  };

  if (loading && !selectedBlog) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-outline">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-sm font-medium">Đang tải bài viết...</span>
        </div>
      </div>
    );
  }

  if (selectedBlog) {
    const isOwnBlog = selectedBlog.authorId != null && selectedBlog.authorId === currentUserId;

    return (
      <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setSelectedBlog(null)}
            className="flex items-center gap-2 text-sm font-semibold text-outline hover:text-primary transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Quay lại danh sách
          </button>

          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(prev => !prev)}
              className="relative p-2 rounded-lg border border-outline-variant/40 text-outline hover:text-primary hover:bg-surface-container-low transition-colors"
              title="Thông báo"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface border border-outline-variant/30 rounded-xl shadow-xl z-30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                  <span className="text-sm font-bold text-on-surface">Thông báo</span>
                  <button onClick={handleMarkAllNotifications} className="text-xs font-semibold text-primary">
                    Đánh dấu đã đọc
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-outline px-4 py-6 text-center">Chưa có thông báo.</p>
                  ) : notifications.map(notification => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left px-4 py-3 border-b border-outline-variant/10 hover:bg-surface-container-low ${
                        notification.read ? 'text-outline' : 'text-on-surface bg-primary/5'
                      }`}
                    >
                      <p className="text-sm font-semibold line-clamp-2">{notification.message}</p>
                      {notification.blogTitle && (
                        <p className="text-xs mt-1 line-clamp-1">{notification.blogTitle}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedBlog.thumbnailUrl && (
          <div className="w-full h-64 sm:h-80 rounded-xl overflow-hidden border border-outline-variant/20">
            <img src={selectedBlog.thumbnailUrl} alt={selectedBlog.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="space-y-3">
          <h1 className="font-display text-3xl font-extrabold text-gradient-brand leading-tight">{selectedBlog.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-outline">
            <span className="flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5" />
              {selectedBlog.authorName || 'Admin'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(selectedBlog.createdAt)}
            </span>
            {selectedBlog.friendWithAuthor && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 font-semibold">
                <Users className="w-3 h-3" />
                Bạn bè
              </span>
            )}
            {!isOwnBlog && selectedBlog.authorId && (
              <button
                onClick={() => handleToggleFollow(selectedBlog.authorId!, selectedBlog.followedAuthor)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                  selectedBlog.followedAuthor
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-surface-container-low text-outline border-outline-variant/40 hover:text-primary'
                }`}
              >
                {selectedBlog.followedAuthor ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                {selectedBlog.followedAuthor ? 'Đang theo dõi' : 'Theo dõi'}
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-outline-variant/20" />

        <div className="prose prose-sm max-w-none text-on-surface leading-relaxed whitespace-pre-wrap text-sm" style={{ lineHeight: 1.8 }}>
          {selectedBlog.content}
        </div>

        <div className="relative flex flex-wrap items-center gap-3 py-4 border-y border-outline-variant/20">
          <button
            onClick={handleToggleBlogLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              selectedBlog.likedByMe ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-surface-container-low text-outline hover:text-red-600 border border-outline-variant/40'
            }`}
          >
            <Heart className={`w-4 h-4 ${selectedBlog.likedByMe ? 'fill-red-600' : ''}`} />
            {selectedBlog.likeCount} thích
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-surface-container-low text-outline border border-outline-variant/40">
            <MessageCircle className="w-4 h-4" />
            {selectedBlog.commentCount} bình luận
          </div>
          <button
            onClick={handleCopyShare}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-outline hover:text-primary bg-surface-container-low border border-outline-variant/40 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Sao chép
          </button>
          <button
            onClick={handleToggleSharePanel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-outline hover:text-primary bg-surface-container-low border border-outline-variant/40 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Chia sẻ
          </button>
          {!isOwnBlog && (
            <button
              onClick={() => { setShowReport(true); setReportDone(false); setReportError(''); setReportReason(''); }}
              className="sm:ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-outline hover:text-amber-600 hover:bg-amber-50 border border-outline-variant/40 transition-colors"
              title="Báo cáo bài viết"
            >
              <Flag className="w-4 h-4" />
              Báo cáo
            </button>
          )}

          {shareOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface border border-outline-variant/30 rounded-xl shadow-xl z-20 p-3 space-y-2">
              {friendsLoading ? (
                <div className="flex items-center gap-2 text-sm text-outline py-3">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang tải bạn bè...
                </div>
              ) : friends.length === 0 ? (
                <p className="text-sm text-outline py-3 text-center">Chưa có bạn bè để chia sẻ.</p>
              ) : friends.map(friend => (
                <button
                  key={friend.userId}
                  onClick={() => handleShareToFriend(friend)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-surface-container-low text-left"
                >
                  <span className="text-sm font-semibold text-on-surface">{displayUserName(friend)}</span>
                  <Share2 className="w-4 h-4 text-outline" />
                </button>
              ))}
              {shareMessage && <p className="text-xs font-semibold text-green-700 px-1">{shareMessage}</p>}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-on-surface flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Bình luận
          </h3>

          <form onSubmit={handleAddComment} className="flex items-start gap-3">
            <img src={currentUser.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-outline-variant/40 shrink-0" />
            <div className="flex-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => {
                    setNewComment(e.target.value);
                    if (!e.target.value.includes('@')) setCommentMention(null);
                  }}
                  placeholder="Viết bình luận..."
                  className="flex-1 px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={postingComment || !newComment.trim()}
                  className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {postingComment ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              {renderMentionPicker(newComment.includes('@'), chooseCommentMention)}
            </div>
          </form>

          {commentsLoading ? (
            <div className="flex items-center gap-2 text-outline text-sm py-4">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Đang tải bình luận...
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-outline py-4 text-center">Chưa có bình luận nào.</p>
          ) : (
            <div className="space-y-5">
              {comments.map(comment => {
                const replies = repliesByComment[comment.id] || [];
                const replyText = replyInputs[comment.id] || '';
                return (
                  <div key={comment.id} className="space-y-3">
                    <div className="flex items-start gap-3">
                      <img src={comment.userAvatar || currentUser.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-outline-variant/40 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="bg-surface-container-low rounded-xl px-4 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-on-surface">{comment.userName || 'Người dùng'}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-outline">{formatDate(comment.createdAt)}</span>
                              {comment.userId === currentUserId && (
                                <button onClick={() => handleDeleteComment(comment.id)} className="text-outline hover:text-red-600 transition-colors" title="Xóa bình luận">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-on-surface mt-1 whitespace-pre-wrap">
                            {comment.mentionedUserName && (
                              <span className="font-bold text-primary">@{comment.mentionedUserName} </span>
                            )}
                            {comment.content}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-outline">
                          <button
                            onClick={() => handleToggleCommentLike(comment.id)}
                            className={`inline-flex items-center gap-1 font-semibold hover:text-red-600 ${comment.likedByMe ? 'text-red-600' : ''}`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${comment.likedByMe ? 'fill-red-600' : ''}`} />
                            {comment.likeCount}
                          </button>
                          <button
                            onClick={async () => {
                              setActiveReplyCommentId(prev => (prev === comment.id ? null : comment.id));
                              await loadReplies(comment.id);
                            }}
                            className="inline-flex items-center gap-1 font-semibold hover:text-primary"
                          >
                            <Reply className="w-3.5 h-3.5" />
                            Trả lời
                          </button>
                          {comment.replyCount > 0 && (
                            <button onClick={() => loadReplies(comment.id, true)} className="font-semibold hover:text-primary">
                              {comment.replyCount} trả lời
                            </button>
                          )}
                        </div>

                        {(replyLoading[comment.id] || replies.length > 0 || activeReplyCommentId === comment.id) && (
                          <div className="mt-3 ml-4 pl-4 border-l border-outline-variant/30 space-y-3">
                            {replyLoading[comment.id] && (
                              <div className="flex items-center gap-2 text-xs text-outline">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Đang tải trả lời...
                              </div>
                            )}

                            {replies.map(replyItem => (
                              <div key={replyItem.id} className="flex items-start gap-2">
                                <img src={replyItem.userAvatar || currentUser.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-outline-variant/40 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-3 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-bold text-on-surface">{replyItem.userName || 'Người dùng'}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-outline">{formatDate(replyItem.createdAt)}</span>
                                        {replyItem.userId === currentUserId && (
                                          <button onClick={() => handleDeleteReply(comment.id, replyItem.id)} className="text-outline hover:text-red-600" title="Xóa trả lời">
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-xs text-on-surface mt-1 whitespace-pre-wrap">
                                      {replyItem.mentionedUserName && (
                                        <span className="font-bold text-primary">@{replyItem.mentionedUserName} </span>
                                      )}
                                      {replyItem.content}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleToggleReplyLike(comment.id, replyItem.id)}
                                    className={`inline-flex items-center gap-1 mt-1 text-xs font-semibold hover:text-red-600 ${replyItem.likedByMe ? 'text-red-600' : 'text-outline'}`}
                                  >
                                    <Heart className={`w-3 h-3 ${replyItem.likedByMe ? 'fill-red-600' : ''}`} />
                                    {replyItem.likeCount}
                                  </button>
                                </div>
                              </div>
                            ))}

                            {activeReplyCommentId === comment.id && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    value={replyText}
                                    onChange={e => {
                                      setReplyInputs(prev => ({ ...prev, [comment.id]: e.target.value }));
                                      if (!e.target.value.includes('@')) {
                                        setReplyMentions(prev => ({ ...prev, [comment.id]: null }));
                                      }
                                    }}
                                    placeholder="Viết trả lời..."
                                    className="flex-1 px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs outline-none focus:border-primary"
                                  />
                                  <button
                                    onClick={() => handleAddReply(comment.id)}
                                    disabled={!replyText.trim()}
                                    className="p-2 bg-primary text-white rounded-xl disabled:opacity-50"
                                    title="Gửi trả lời"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                {renderMentionPicker(replyText.includes('@'), target => chooseReplyMention(comment.id, target))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showReport && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-2xl p-6 w-full max-w-md space-y-4 border border-outline-variant/30 shadow-2xl">
              <div className="flex justify-between items-center">
                <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <Flag className="w-4 h-4 text-amber-600" />
                  Báo cáo bài viết
                </h4>
                <button onClick={() => setShowReport(false)} className="p-1.5 hover:bg-surface-variant rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {reportDone ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                    <Send className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-on-surface font-medium">Đã gửi báo cáo. Quản trị viên sẽ xem xét sớm.</p>
                  <button onClick={() => setShowReport(false)} className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl">
                    Đóng
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReport} className="space-y-3">
                  <textarea
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    rows={4}
                    placeholder="Nhập lý do báo cáo..."
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm outline-none focus:border-primary resize-y"
                  />
                  {reportError && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {reportError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button type="submit" disabled={reportSubmitting} className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-60 flex items-center gap-2">
                      {reportSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                      Gửi báo cáo
                    </button>
                    <button type="button" onClick={() => setShowReport(false)} className="px-4 py-2 bg-surface-variant text-on-surface-variant text-sm font-semibold rounded-xl">
                      Hủy
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-extrabold text-gradient-brand flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-primary" />
              Blog
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">Bài viết và chia sẻ từ cộng đồng học ngôn ngữ ký hiệu.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                type="text"
                placeholder="Tìm bài viết hoặc tác giả..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(prev => !prev)}
                className="relative p-2.5 rounded-xl border border-outline-variant/40 text-outline hover:text-primary hover:bg-surface-container-low transition-colors"
                title="Thông báo"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface border border-outline-variant/30 rounded-xl shadow-xl z-30 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <span className="text-sm font-bold text-on-surface">Thông báo</span>
                    <button onClick={handleMarkAllNotifications} className="text-xs font-semibold text-primary">
                      Đánh dấu đã đọc
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-outline px-4 py-6 text-center">Chưa có thông báo.</p>
                    ) : notifications.map(notification => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full text-left px-4 py-3 border-b border-outline-variant/10 hover:bg-surface-container-low ${
                          notification.read ? 'text-outline' : 'text-on-surface bg-primary/5'
                        }`}
                      >
                        <p className="text-sm font-semibold line-clamp-2">{notification.message}</p>
                        {notification.blogTitle && (
                          <p className="text-xs mt-1 line-clamp-1">{notification.blogTitle}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {viewingUser && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-on-surface">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-semibold">{displayUserName(viewingUser)}</span>
            </div>
            <button onClick={loadPublishedBlogs} className="inline-flex items-center gap-1.5 text-sm font-semibold text-outline hover:text-primary">
              <X className="w-4 h-4" />
              Đóng
            </button>
          </div>
        )}

        {searchQuery.trim() && userResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {userResults.map(user => (
              <div key={user.userId} className="flex items-center justify-between gap-3 px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{displayUserName(user)}</p>
                  <p className="text-xs text-outline truncate">@{user.username} · {user.followerCount} theo dõi</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleFollow(user.userId, user.followedByMe)}
                    className={`p-2 rounded-lg border transition-colors ${
                      user.followedByMe
                        ? 'text-primary bg-primary/10 border-primary/30'
                        : 'text-outline border-outline-variant/40 hover:text-primary'
                    }`}
                    title={user.followedByMe ? 'Đang theo dõi' : 'Theo dõi'}
                  >
                    {user.followedByMe ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleViewUserBlogs(user)}
                    className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold"
                  >
                    Xem bài
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-outline">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          Đang tải...
        </div>
      ) : blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-outline">
          <BookOpen className="w-14 h-14 opacity-30" />
          <p className="text-sm font-medium">Không tìm thấy bài viết nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map(blog => {
            const isOwnBlog = blog.authorId != null && blog.authorId === currentUserId;
            return (
              <article
                key={blog.id}
                className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-200"
              >
                <button onClick={() => openBlog(blog)} className="w-full text-left group">
                  <div className="w-full h-44 bg-surface-container-low overflow-hidden relative">
                    {blog.thumbnailUrl ? (
                      <img src={blog.thumbnailUrl} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10">
                        <BookOpen className="w-12 h-12 text-primary/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-on-surface text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">{blog.title}</h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{blog.content}</p>
                  </div>
                </button>
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between pt-1 border-t border-outline-variant/15">
                    <div className="flex items-center gap-3 text-[11px] text-outline">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {blog.likeCount}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {blog.commentCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-outline min-w-0">
                      <UserIcon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{blog.authorName || 'Admin'}</span>
                    </div>
                  </div>
                  {!isOwnBlog && blog.authorId && (
                    <button
                      onClick={() => handleToggleFollow(blog.authorId!, blog.followedAuthor)}
                      className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                        blog.followedAuthor
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-surface-container-low text-outline border-outline-variant/40 hover:text-primary'
                      }`}
                    >
                      {blog.followedAuthor ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                      {blog.followedAuthor ? 'Đang theo dõi' : 'Theo dõi tác giả'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
