import React, { useEffect, useState } from 'react';
import { blogApi } from '../services/api/blogApi';
import { AdminBlogResponse, BlogCommentResponse } from '../services/api/adminApi';
import { getApiErrorMessage } from '../services/api/apiError';
import { User } from '../types';
import {
  BookOpen, Calendar, User as UserIcon, ChevronRight, X, Search,
  Heart, MessageCircle, Flag, Send, Trash2, RefreshCw, ShieldAlert
} from 'lucide-react';

interface BlogViewProps {
  currentUser: User;
}

export default function BlogView({ currentUser }: BlogViewProps) {
  const [blogs, setBlogs] = useState<AdminBlogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState<AdminBlogResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Tuong tac cho bai dang mo
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<BlogCommentResponse[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Report
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportDone, setReportDone] = useState(false);

  useEffect(() => {
    blogApi.getPublished(0, 50)
      .then(res => setBlogs(res.content))
      .catch(err => console.error('Failed to load blogs', err))
      .finally(() => setLoading(false));
  }, []);

  const openBlog = async (blog: AdminBlogResponse) => {
    setSelectedBlog(blog);
    setLiked(blog.likedByMe);
    setLikeCount(blog.likeCount);
    setNewComment('');
    setShowReport(false);
    setReportReason('');
    setReportError('');
    setReportDone(false);
    setCommentsLoading(true);
    try {
      const list = await blogApi.getComments(blog.id);
      setComments(list);
    } catch (err) {
      console.error('Failed to load comments', err);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!selectedBlog) return;
    // optimistic
    const prevLiked = liked, prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevCount + (prevLiked ? -1 : 1));
    try {
      const res = await blogApi.toggleLike(selectedBlog.id);
      setLiked(res.liked);
      setLikeCount(res.likeCount);
    } catch (err) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlog || !newComment.trim()) return;
    setPostingComment(true);
    try {
      const created = await blogApi.addComment(selectedBlog.id, newComment.trim());
      setComments(prev => [created, ...prev]);
      setNewComment('');
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
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      alert('Không thể xóa bình luận.');
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

  const filtered = blogs.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-outline">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-sm font-medium">Đang tải bài viết...</span>
        </div>
      </div>
    );
  }

  // ── Detail View ───────────────────────────────────────────────────────────
  if (selectedBlog) {
    return (
      <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => setSelectedBlog(null)}
          className="flex items-center gap-2 text-sm font-semibold text-outline hover:text-primary transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Quay lại danh sách
        </button>

        {selectedBlog.thumbnailUrl && (
          <div className="w-full h-64 rounded-2xl overflow-hidden border border-outline-variant/20">
            <img src={selectedBlog.thumbnailUrl} alt={selectedBlog.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="space-y-3">
          <h1 className="font-display text-3xl font-extrabold text-gradient-brand leading-tight">{selectedBlog.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-outline">
            <span className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5" />{selectedBlog.authorName || 'Admin'}</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(selectedBlog.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="border-t border-outline-variant/20" />

        <div className="prose prose-sm max-w-none text-on-surface leading-relaxed whitespace-pre-wrap text-sm" style={{ lineHeight: 1.8 }}>
          {selectedBlog.content}
        </div>

        {/* Action bar: like + report */}
        <div className="flex items-center gap-3 py-4 border-y border-outline-variant/20">
          <button
            onClick={handleToggleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              liked ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-surface-container-low text-outline hover:text-red-600 border border-outline-variant/40'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-red-600' : ''}`} />
            {likeCount} thích
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-surface-container-low text-outline border border-outline-variant/40">
            <MessageCircle className="w-4 h-4" />
            {comments.length} bình luận
          </div>
          {/* Khong cho tac gia tu bao cao bai cua chinh minh */}
          {String(selectedBlog.authorId) !== currentUser.id && (
            <button
              onClick={() => { setShowReport(true); setReportDone(false); setReportError(''); setReportReason(''); }}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-outline hover:text-amber-600 hover:bg-amber-50 border border-outline-variant/40 transition-colors"
              title="Báo cáo bài viết vi phạm"
            >
              <Flag className="w-4 h-4" />
              Báo cáo
            </button>
          )}
        </div>

        {/* Comments */}
        <div className="space-y-4">
          <h3 className="font-bold text-on-surface flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" /> Bình luận
          </h3>

          <form onSubmit={handleAddComment} className="flex items-start gap-3">
            <img src={currentUser.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-outline-variant/40 shrink-0" />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
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
          </form>

          {commentsLoading ? (
            <div className="flex items-center gap-2 text-outline text-sm py-4"><RefreshCw className="w-4 h-4 animate-spin" /> Đang tải bình luận...</div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-outline py-4 text-center">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
          ) : (
            <div className="space-y-4">
              {comments.map(c => (
                <div key={c.id} className="flex items-start gap-3">
                  <img src={c.userAvatar || currentUser.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-outline-variant/40 shrink-0" />
                  <div className="flex-1 bg-surface-container-low rounded-2xl px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-on-surface">{c.userName || 'Người dùng'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-outline">{new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
                        {String(c.userId) === currentUser.id && (
                          <button onClick={() => handleDeleteComment(c.id)} className="text-outline hover:text-red-600 transition-colors" title="Xóa bình luận">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-on-surface mt-1 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report modal */}
        {showReport && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-2xl p-6 w-full max-w-md space-y-4 border border-outline-variant/30 shadow-2xl">
              <div className="flex justify-between items-center">
                <h4 className="text-base font-bold text-on-surface flex items-center gap-2"><Flag className="w-4 h-4 text-amber-600" /> Báo cáo bài viết</h4>
                <button onClick={() => setShowReport(false)} className="p-1.5 hover:bg-surface-variant rounded-lg"><X className="w-4 h-4" /></button>
              </div>

              {reportDone ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                    <Send className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-on-surface font-medium">Đã gửi báo cáo. Cảm ơn bạn — quản trị viên sẽ xem xét sớm.</p>
                  <button onClick={() => setShowReport(false)} className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl">Đóng</button>
                </div>
              ) : (
                <form onSubmit={handleReport} className="space-y-3">
                  <p className="text-xs text-outline">Cho biết vì sao bài viết này vi phạm (spam, lừa đảo, phản cảm...).</p>
                  <textarea
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    rows={4}
                    placeholder="Nhập lý do báo cáo..."
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm outline-none focus:border-primary resize-y"
                  />
                  {reportError && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> {reportError}</p>
                  )}
                  <div className="flex gap-2">
                    <button type="submit" disabled={reportSubmitting} className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-60 flex items-center gap-2">
                      {reportSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                      Gửi báo cáo
                    </button>
                    <button type="button" onClick={() => setShowReport(false)} className="px-4 py-2 bg-surface-variant text-on-surface-variant text-sm font-semibold rounded-xl">Huỷ</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── List View ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-fade-in">
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-gradient-brand flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" />
            Blog
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">Các bài viết, kiến thức và tin tức về ngôn ngữ ký hiệu.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input
            type="text"
            placeholder="Tìm bài viết..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
      </section>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-outline">
          <BookOpen className="w-14 h-14 opacity-30" />
          <p className="text-sm font-medium">{searchQuery ? 'Không tìm thấy bài viết nào.' : 'Chưa có bài viết nào được xuất bản.'}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(blog => (
          <button
            key={blog.id}
            onClick={() => openBlog(blog)}
            className="group text-left bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="w-full h-44 bg-surface-container-low overflow-hidden relative">
              {blog.thumbnailUrl ? (
                <img src={blog.thumbnailUrl} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/15">
                  <BookOpen className="w-12 h-12 text-primary/30" />
                </div>
              )}
            </div>
            <div className="p-4 space-y-3">
              <h3 className="font-bold text-on-surface text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">{blog.title}</h3>
              <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{blog.content}</p>
              <div className="flex items-center justify-between pt-1 border-t border-outline-variant/15">
                <div className="flex items-center gap-3 text-[11px] text-outline">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {blog.likeCount}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {blog.commentCount}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-outline">
                  <UserIcon className="w-3 h-3" />
                  <span>{blog.authorName || 'Admin'}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
