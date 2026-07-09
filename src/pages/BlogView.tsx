import React, { useEffect, useState } from 'react';
import { blogApi } from '../services/api/blogApi';
import { AdminBlogResponse } from '../services/api/adminApi';
import { BookOpen, Calendar, User, ChevronRight, X, Search } from 'lucide-react';

export default function BlogView() {
  const [blogs, setBlogs] = useState<AdminBlogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState<AdminBlogResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    blogApi.getPublished(0, 50)
      .then(res => setBlogs(res.content))
      .catch(err => console.error('Failed to load blogs', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = blogs.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // ── Detail Modal ──────────────────────────────────────────────────────────
  if (selectedBlog) {
    return (
      <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => setSelectedBlog(null)}
          className="flex items-center gap-2 text-sm font-semibold text-outline hover:text-primary transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Quay lại danh sách
        </button>

        {/* Thumbnail */}
        {selectedBlog.thumbnailUrl && (
          <div className="w-full h-64 rounded-2xl overflow-hidden border border-outline-variant/20">
            <img
              src={selectedBlog.thumbnailUrl}
              alt={selectedBlog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header */}
        <div className="space-y-3">
          <h1 className="font-display text-3xl font-extrabold text-on-surface leading-tight">
            {selectedBlog.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-outline">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {selectedBlog.authorName || 'Admin'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(selectedBlog.createdAt).toLocaleDateString('vi-VN', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-outline-variant/20" />

        {/* Content */}
        <div
          className="prose prose-sm max-w-none text-on-surface leading-relaxed whitespace-pre-wrap text-sm"
          style={{ lineHeight: 1.8 }}
        >
          {selectedBlog.content}
        </div>
      </div>
    );
  }

  // ── List View ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-on-surface flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" />
            Blog
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Các bài viết, kiến thức và tin tức về ngôn ngữ ký hiệu.
          </p>
        </div>

        {/* Search */}
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

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-outline">
          <BookOpen className="w-14 h-14 opacity-30" />
          <p className="text-sm font-medium">
            {searchQuery ? 'Không tìm thấy bài viết nào.' : 'Chưa có bài viết nào được xuất bản.'}
          </p>
        </div>
      )}

      {/* Blog grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(blog => (
          <button
            key={blog.id}
            onClick={() => setSelectedBlog(blog)}
            className="group text-left bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5"
          >
            {/* Thumbnail */}
            <div className="w-full h-44 bg-surface-container-low overflow-hidden relative">
              {blog.thumbnailUrl ? (
                <img
                  src={blog.thumbnailUrl}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/15">
                  <BookOpen className="w-12 h-12 text-primary/30" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <h3 className="font-bold text-on-surface text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {blog.title}
              </h3>

              {/* Preview text */}
              <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                {blog.content}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-outline-variant/15">
                <div className="flex items-center gap-1.5 text-[11px] text-outline">
                  <User className="w-3 h-3" />
                  <span>{blog.authorName || 'Admin'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-outline">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(blog.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
