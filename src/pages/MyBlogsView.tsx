import React, { useEffect, useState } from 'react';
import { AdminBlogResponse, CreateBlogPayload, UpdateBlogPayload } from '../services/api/adminApi';
import { userBlogApi } from '../services/api/userBlogApi';
import { BookOpen, Plus, RefreshCw, Trash2, Pencil, X, Eye, EyeOff } from 'lucide-react';

export default function MyBlogsView() {
  const [blogs, setBlogs] = useState<AdminBlogResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Create blog form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  // Edit blog
  const [editingBlog, setEditingBlog] = useState<AdminBlogResponse | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editStatus, setEditStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const res = await userBlogApi.getBlogs(0, 100);
      setBlogs(res.content);
    } catch (err) {
      console.error('Failed to load user blogs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBlogs(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Vui lòng điền tiêu đề và nội dung bài viết!');
      return;
    }
    try {
      const payload: CreateBlogPayload = { title, content, status };
      const created = await userBlogApi.createBlog(payload);
      if (thumbnail) await userBlogApi.uploadBlogThumbnail(created.id, thumbnail);
      setTitle('');
      setContent('');
      setStatus('DRAFT');
      setThumbnail(null);
      setShowForm(false);
      await loadBlogs();
    } catch (err) {
      alert('Không thể tạo bài viết.');
    }
  };

  const startEdit = (blog: AdminBlogResponse) => {
    setEditingBlog(blog);
    setEditTitle(blog.title);
    setEditContent(blog.content);
    setEditStatus(blog.status);
  };

  const handleSave = async () => {
    if (!editingBlog) return;
    if (!editTitle.trim() || !editContent.trim()) {
      alert('Tiêu đề và nội dung không được để trống!');
      return;
    }
    try {
      const payload: UpdateBlogPayload = { title: editTitle, content: editContent, status: editStatus };
      await userBlogApi.updateBlog(editingBlog.id, payload);
      setEditingBlog(null);
      await loadBlogs();
    } catch (err) {
      alert('Không thể cập nhật bài viết.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Xác nhận xóa bài viết này?')) return;
    try {
      await userBlogApi.deleteBlog(id);
      await loadBlogs();
    } catch (err) {
      alert('Không thể xóa bài viết.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-[#111111] flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" />
            Bài Viết Của Tôi
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Quản lý và xuất bản các bài viết do bạn sáng tác.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setEditingBlog(null); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Viết bài mới
        </button>
      </section>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface-container-lowest rounded-2xl p-6 space-y-5 border border-outline-variant/30 elevation-1">
          <h4 className="text-base font-bold text-on-surface">Tạo bài viết mới</h4>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-outline">Tiêu đề *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài viết..."
              className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-outline">Nội dung *</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Nhập nội dung bài viết..."
              rows={8}
              className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm outline-none focus:border-primary resize-y"
            />
          </div>
          <div className="flex gap-6 flex-wrap">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <label className="text-sm font-semibold text-outline">Trạng thái</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm outline-none focus:border-primary appearance-none"
              >
                <option value="DRAFT">Lưu Nháp (Chỉ mình bạn xem được)</option>
                <option value="PUBLISHED">Xuất Bản (Công khai trên Blog)</option>
              </select>
            </div>
            <div className="space-y-2 flex-1 min-w-[200px]">
              <label className="text-sm font-semibold text-outline">Ảnh bìa (tuỳ chọn)</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setThumbnail(e.target.files?.[0] || null)}
                className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 bg-surface-container-low border border-outline-variant/50 rounded-xl px-3 py-1.5"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-md">
              Lưu bài viết
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-surface-variant text-on-surface-variant text-sm font-semibold rounded-xl hover:bg-outline-variant/30 transition-colors">
              Huỷ
            </button>
          </div>
        </form>
      )}

      {/* Edit modal */}
      {editingBlog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-3xl p-8 w-full max-w-3xl space-y-5 border border-outline-variant/30 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-bold text-on-surface">Chỉnh sửa bài viết</h4>
              <button onClick={() => setEditingBlog(null)} className="p-2 hover:bg-surface-variant rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-outline">Tiêu đề *</label>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-outline">Nội dung *</label>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm outline-none focus:border-primary resize-y"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-outline">Trạng thái</label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm outline-none focus:border-primary"
              >
                <option value="DRAFT">Lưu Nháp</option>
                <option value="PUBLISHED">Xuất Bản</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={handleSave} className="px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-md">
                Lưu thay đổi
              </button>
              <button onClick={() => setEditingBlog(null)} className="px-6 py-3 bg-surface-variant text-on-surface-variant text-sm font-semibold rounded-xl hover:bg-outline-variant/30 transition-colors">
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blogs list */}
      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 elevation-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-outline">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" /> <span className="font-medium">Đang tải bài viết...</span>
          </div>
        ) : blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-outline">
            <BookOpen className="w-16 h-16 opacity-30" />
            <p className="font-medium">Bạn chưa có bài viết nào.</p>
            <button onClick={() => setShowForm(true)} className="mt-2 text-primary hover:underline font-semibold text-sm">
              Tạo bài viết đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {blogs.map(blog => (
              <div key={blog.id} className="group bg-surface border border-outline-variant/40 rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all flex flex-col">
                <div className="w-full h-40 bg-surface-container-low overflow-hidden relative">
                  {blog.thumbnailUrl ? (
                    <img src={blog.thumbnailUrl} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                      <BookOpen className="w-10 h-10 text-primary/30" />
                    </div>
                  )}
                  <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md flex items-center gap-1.5 shadow-sm
                    ${blog.status === 'PUBLISHED' ? 'bg-green-500/90 text-white' : 'bg-surface/90 text-outline'}
                  `}>
                    {blog.status === 'PUBLISHED' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {blog.status === 'PUBLISHED' ? 'CÔNG KHAI' : 'NHÁP'}
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-on-surface text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">{blog.title}</h3>
                  <p className="text-sm text-on-surface-variant line-clamp-2 mb-4 flex-1">{blog.content}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
                    <span className="text-[11px] text-outline font-medium">
                      {new Date(blog.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(blog)} className="p-2 hover:bg-primary/10 text-outline hover:text-primary rounded-xl transition-colors" title="Sửa bài">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(blog.id)} className="p-2 hover:bg-red-50 text-outline hover:text-red-600 rounded-xl transition-colors" title="Xóa bài">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
