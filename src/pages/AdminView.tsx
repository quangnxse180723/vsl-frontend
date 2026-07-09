import React, { useEffect, useState } from 'react';
import { User, Vocabulary, Lesson } from '../types';
import { adminApi, AdminCategoryResponse, AdminBlogResponse, CreateBlogPayload, UpdateBlogPayload } from '../services/api/adminApi';
import { Upload, Users, Activity, BarChart, Server, Sparkles, Plus, Smile, RefreshCw, Trash2, Pencil, X, BookOpen, Eye, EyeOff } from 'lucide-react';

interface AdminViewProps {
  users: User[];
  vocabularyList: Vocabulary[];
  lessons: Lesson[];
  onToggleUserStatus: (userId: string) => void;
  onCreateUser: (payload: { username: string; email: string; password: string; fullName: string; role: 'USER' | 'ADMIN'; status: 'ACTIVE' | 'INACTIVE' }) => void;
  onUpdateUser: (userId: string, payload: { fullName?: string; role?: 'USER' | 'ADMIN'; status?: 'ACTIVE' | 'INACTIVE'; password?: string }) => void;
  onDeleteUser: (userId: string) => void;
  onAddVocabulary: (newVocab: { name: string; categoryId: number; description: string; expectedId?: number; file?: File; imageFile?: File }) => void;
  onDeleteVocabulary: (vocabId: string) => void;
  onRefreshCategories: () => void;
}

export default function AdminView({
  users,
  vocabularyList,
  lessons,
  onToggleUserStatus,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onAddVocabulary,
  onDeleteVocabulary,
  onRefreshCategories
}: AdminViewProps) {
  // Add vocab fields
  const [vocabName, setVocabName] = useState('');
  const [vocabCategoryId, setVocabCategoryId] = useState(lessons[0]?.id || '');
  const [vocabDescription, setVocabDescription] = useState('');
  const [vocabExpectedId, setVocabExpectedId] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [vocabSearchQuery, setVocabSearchQuery] = useState('');

  const [notification, setNotification] = useState('');

  // Category management (fetched directly here - not part of App's shared state)
  const [categories, setCategories] = useState<AdminCategoryResponse[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDescription, setEditCategoryDescription] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState<File | null>(null);
  const [uploadingCategoryImageId, setUploadingCategoryImageId] = useState<number | null>(null);

  const loadCategories = async () => {
    try {
      const res = await adminApi.getCategories(0, 100);
      setCategories(res.content);
    } catch (error) {
      console.error('Failed to load categories', error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // ─── Blog management ──────────────────────────────────────────────────────
  const [blogs, setBlogs] = useState<AdminBlogResponse[]>([]);
  const [blogLoading, setBlogLoading] = useState(false);

  // Create blog form
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogStatus, setBlogStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [blogThumbnail, setBlogThumbnail] = useState<File | null>(null);

  // Edit blog
  const [editingBlog, setEditingBlog] = useState<AdminBlogResponse | null>(null);
  const [editBlogTitle, setEditBlogTitle] = useState('');
  const [editBlogContent, setEditBlogContent] = useState('');
  const [editBlogStatus, setEditBlogStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');

  const loadBlogs = async () => {
    setBlogLoading(true);
    try {
      const res = await adminApi.getBlogs(0, 100);
      setBlogs(res.content);
    } catch (err) {
      console.error('Failed to load blogs', err);
    } finally {
      setBlogLoading(false);
    }
  };

  useEffect(() => { loadBlogs(); }, []);

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim() || !blogContent.trim()) {
      alert('Vui lòng điền tiêu đề và nội dung bài viết!');
      return;
    }
    try {
      const payload: CreateBlogPayload = { title: blogTitle, content: blogContent, status: blogStatus };
      const created = await adminApi.createBlog(payload);
      if (blogThumbnail) await adminApi.uploadBlogThumbnail(created.id, blogThumbnail);
      setBlogTitle('');
      setBlogContent('');
      setBlogStatus('DRAFT');
      setBlogThumbnail(null);
      setShowBlogForm(false);
      await loadBlogs();
    } catch (err) {
      alert('Không thể tạo bài viết.');
    }
  };

  const startEditBlog = (blog: AdminBlogResponse) => {
    setEditingBlog(blog);
    setEditBlogTitle(blog.title);
    setEditBlogContent(blog.content);
    setEditBlogStatus(blog.status);
  };

  const handleSaveBlog = async () => {
    if (!editingBlog) return;
    if (!editBlogTitle.trim() || !editBlogContent.trim()) {
      alert('Tiêu đề và nội dung không được để trống!');
      return;
    }
    try {
      const payload: UpdateBlogPayload = { title: editBlogTitle, content: editBlogContent, status: editBlogStatus };
      await adminApi.updateBlog(editingBlog.id, payload);
      setEditingBlog(null);
      await loadBlogs();
    } catch (err) {
      alert('Không thể cập nhật bài viết.');
    }
  };

  const handleDeleteBlog = async (id: number) => {
    if (!window.confirm('Xác nhận xóa bài viết này?')) return;
    try {
      await adminApi.deleteBlog(id);
      await loadBlogs();
    } catch (err) {
      alert('Không thể xóa bài viết.');
    }
  };
  // ──────────────────────────────────────────────────────────────────────────

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const created = await adminApi.createCategory(newCategoryName, newCategoryDescription);
      if (newCategoryImage) {
        await adminApi.uploadCategoryImage(created.id, newCategoryImage);
      }
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryImage(null);
      await loadCategories();
      onRefreshCategories();
    } catch (error) {
      alert('Không thể tạo danh mục. Tên có thể đã tồn tại.');
    }
  };

  const handleUploadCategoryImage = async (categoryId: number, file: File) => {
    setUploadingCategoryImageId(categoryId);
    try {
      await adminApi.uploadCategoryImage(categoryId, file);
      await loadCategories();
      onRefreshCategories();
    } catch (error) {
      alert('Không thể tải lên ảnh danh mục.');
    } finally {
      setUploadingCategoryImageId(null);
    }
  };

  const startEditCategory = (cat: AdminCategoryResponse) => {
    setEditingCategoryId(cat.id);
    setEditCategoryName(cat.name);
    setEditCategoryDescription(cat.description || '');
  };

  const handleSaveCategory = async (id: number) => {
    try {
      await adminApi.updateCategory(id, editCategoryName, editCategoryDescription);
      setEditingCategoryId(null);
      await loadCategories();
      onRefreshCategories();
    } catch (error) {
      alert('Không thể cập nhật danh mục. Tên có thể đã tồn tại.');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Xóa danh mục này? Thao tác sẽ thất bại nếu vẫn còn từ vựng thuộc danh mục.')) return;
    try {
      await adminApi.deleteCategory(id);
      await loadCategories();
      onRefreshCategories();
    } catch (error) {
      alert('Không thể xóa danh mục - có thể vẫn còn từ vựng thuộc danh mục này.');
    }
  };

  // User management: create + inline edit
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'USER' | 'ADMIN'>('USER');

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserFullName, setEditUserFullName] = useState('');
  const [editUserRole, setEditUserRole] = useState<'USER' | 'ADMIN'>('USER');
  const [editUserPassword, setEditUserPassword] = useState('');

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newUserEmail.trim() || !newUserPassword.trim() || !newUserFullName.trim()) {
      alert('Vui lòng điền đầy đủ thông tin để tạo người dùng.');
      return;
    }
    onCreateUser({
      username: newUsername,
      email: newUserEmail,
      password: newUserPassword,
      fullName: newUserFullName,
      role: newUserRole,
      status: 'ACTIVE'
    });
    setNewUsername('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserFullName('');
    setNewUserRole('USER');
    setShowAddUserForm(false);
  };

  const startEditUser = (u: User) => {
    setEditingUserId(u.id);
    setEditUserFullName(u.name);
    setEditUserRole(u.role || 'USER');
    setEditUserPassword('');
  };

  const handleSaveUser = (userId: string) => {
    onUpdateUser(userId, {
      fullName: editUserFullName,
      role: editUserRole,
      password: editUserPassword ? editUserPassword : undefined
    });
    setEditingUserId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(true);
  };

  const handleImageDragLeave = () => {
    setIsDraggingImage(false);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadedImage(e.dataTransfer.files[0]);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedImage(e.target.files[0]);
    }
  };

  const handleAddVocabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vocabName.trim()) {
      alert('Vui lòng điền tên từ vựng!');
      return;
    }
    if (!vocabCategoryId) {
      alert('Vui lòng chọn danh mục!');
      return;
    }
    if (uploadedFile && !vocabExpectedId.trim()) {
      alert('Vui lòng nhập Expected ID (chỉ số class của model AI) khi tải video mẫu!');
      return;
    }
    onAddVocabulary({
      name: vocabName,
      categoryId: Number(vocabCategoryId),
      description: vocabDescription || 'Chưa có mô tả.',
      expectedId: uploadedFile ? Number(vocabExpectedId) : undefined,
      file: uploadedFile || undefined,
      imageFile: uploadedImage || undefined
    });

    setNotification(`Đã thêm "${vocabName}" vào thư viện thành công!`);
    setTimeout(() => setNotification(''), 4000);

    // Reset Form
    setVocabName('');
    setVocabDescription('');
    setVocabExpectedId('');
    setUploadedFile(null);
    setUploadedImage(null);
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      
      {/* Intro Header */}
      <section>
        <h2 className="font-display text-3xl font-extrabold text-[#111111]">Bảng Quản Trị</h2>
        <p className="text-body-md text-on-surface-variant">Theo dõi số liệu hệ thống, quản lý người dùng và bổ sung từ vựng mới.</p>
      </section>

      {/* Notifications */}
      {notification && (
        <div className="p-4 bg-green-100 text-green-800 rounded-xl font-semibold flex items-center gap-2 border border-green-200">
          <span className="material-symbols-outlined text-green-700">check_circle</span>
          {notification}
        </div>
      )}

      {/* System Telemetry stats row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active users */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 inset-shadow flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-outline">Người Dùng Hoạt Động</p>
            <h3 className="text-3xl font-extrabold text-[#111111] mt-1">12.4k</h3>
            <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5 mt-1.5 bg-green-50 px-1.5 py-0.5 rounded-full w-max">
              +18% so với tuần trước
            </span>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">group</span>
          </div>
        </div>

        {/* Lessons completed */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 inset-shadow flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-outline">Bài Học Đã Hoàn Thành</p>
            <h3 className="text-3xl font-extrabold text-[#111111] mt-1">84.2k</h3>
            <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5 mt-1.5 bg-green-50 px-1.5 py-0.5 rounded-full w-max">
              +24% so với tuần trước
            </span>
          </div>
          <div className="w-12 h-12 bg-[#2170e4]/10 rounded-xl flex items-center justify-center text-[#2170e4]">
            <span className="material-symbols-outlined text-2xl">done_all</span>
          </div>
        </div>

        {/* Average Match Accuracy */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 inset-shadow flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-outline">Độ Chính Xác Trung Bình</p>
            <h3 className="text-3xl font-extrabold text-[#111111] mt-1">94.2%</h3>
            <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5 mt-1.5 bg-green-50 px-1.5 py-0.5 rounded-full w-max">
              +2.4% so với tuần trước
            </span>
          </div>
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600">
            <span className="material-symbols-outlined text-2xl">analytics</span>
          </div>
        </div>

        {/* System Health Status */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 inset-shadow flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-outline">Tình Trạng Hệ Thống</p>
            <h3 className="text-3xl font-extrabold text-green-600 mt-1">Ổn định</h3>
            <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5 mt-1.5 bg-green-50 px-1.5 py-0.5 rounded-full w-max">
              99.9% Thời gian hoạt động
            </span>
          </div>
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600">
            <span className="material-symbols-outlined text-2xl">dns</span>
          </div>
        </div>
      </section>

      {/* Main Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        
        {/* Left Grid: AI Accuracy Trends (8/12 wide) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-6">
          <header className="flex justify-between items-center pb-2 border-b border-outline-variant/15">
            <div>
              <h3 className="font-display text-lg font-bold text-on-surface">Xu Hướng Độ Chính Xác AI</h3>
              <p className="text-xs text-on-surface-variant font-medium">Thống kê hàng ngày về độ tin cậy phân loại của mô hình.</p>
            </div>
            <div className="flex items-center space-x-2 text-xs text-primary font-bold">
              <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>
              <span>Model Acc v2.4</span>
            </div>
          </header>

          {/* CUSTOM SVG ACCURACY CHART (matches 1st screenshot exactly!) */}
          <div className="relative h-64 w-full bg-surface-container-low/30 rounded-xl p-4 flex flex-col justify-between">
            <svg 
              className="w-full h-full" 
              viewBox="0 0 500 200" 
              preserveAspectRatio="none"
            >
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="#dae2fd" strokeWidth="0.5" strokeDasharray="4,4" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#dae2fd" strokeWidth="0.5" strokeDasharray="4,4" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#dae2fd" strokeWidth="0.5" strokeDasharray="4,4" />
              <line x1="0" y1="160" x2="500" y2="160" stroke="#dae2fd" strokeWidth="0.5" strokeDasharray="4,4" />

              {/* Smoothed curving path coordinates */}
              {/* Mon: 90%, Tue: 88%, Wed: 94%, Thu: 92%, Fri: 96% */}
              {/* Map: x ranges 20 to 480, y values inverted (higher values mean more accuracy, i.e. lower coordinate in SVG space) */}
              <path 
                d="M 20 120 C 100 130, 130 50, 250 70 C 370 80, 420 30, 480 25" 
                fill="none" 
                stroke="#4648d4" 
                strokeWidth="4" 
                strokeLinecap="round"
              />

              {/* Shaded Area fill below curve */}
              <path 
                d="M 20 120 C 100 130, 130 50, 250 70 C 370 80, 420 30, 480 25 L 480 200 L 20 200 Z" 
                fill="url(#indigoGrad)" 
                opacity="0.15" 
              />

              {/* SVG Gradient definitions */}
              <defs>
                <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4a4be5" />
                  <stop offset="100%" stopColor="#faf8ff" />
                </linearGradient>
              </defs>

              {/* Data points nodes */}
              <circle cx="20" cy="120" r="5" fill="#4648d4" stroke="#ffffff" strokeWidth="2" />
              <circle cx="135" cy="110" r="5" fill="#4648d4" stroke="#ffffff" strokeWidth="2" />
              <circle cx="250" cy="70" r="5" fill="#4a4be5" stroke="#ffffff" strokeWidth="2" />
              <circle cx="365" cy="78" r="5" fill="#4a4be5" stroke="#ffffff" strokeWidth="2" />
              <circle cx="480" cy="25" r="5" fill="#0058be" stroke="#ffffff" strokeWidth="2" />
            </svg>

            {/* Custom overlay labels matching screenshots */}
            <div className="flex justify-between text-[10px] text-outline px-2 font-mono">
              <span>THỨ HAI (90%)</span>
              <span>THỨ BA (88%)</span>
              <span>THỨ TƯ (94%)</span>
              <span>THỨ NĂM (92%)</span>
              <span>THỨ SÁU (96%)</span>
            </div>
          </div>
        </div>

        {/* Right Grid: Content Management (4/12 wide) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-4">
          <header className="pb-2 border-b border-outline-variant/15">
            <h3 className="font-display text-lg font-bold text-on-surface">Quản Lý Nội Dung</h3>
            <p className="text-xs text-on-surface-variant font-medium">Thêm nhanh từ vựng và video HD.</p>
          </header>

          <form onSubmit={handleAddVocabSubmit} className="space-y-4">

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-outline">Danh Mục</label>
              <select
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium outline-none text-on-surface focus:border-primary"
                value={vocabCategoryId}
                onChange={(e) => setVocabCategoryId(e.target.value)}
              >
                {lessons.map(l => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>

            {/* Word Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-outline">Tên Từ Vựng</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium outline-none text-on-surface focus:border-primary"
                placeholder="vd: Chữ B, Cô/Dì"
                value={vocabName}
                onChange={(e) => setVocabName(e.target.value)}
                required
              />
            </div>

            {/* Description of sign */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-outline">Mô Tả Ký Hiệu</label>
              <textarea
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium outline-none text-on-surface focus:border-primary h-20 resize-none"
                placeholder="Mô tả chính xác tư thế cơ thể..."
                value={vocabDescription}
                onChange={(e) => setVocabDescription(e.target.value)}
              />
            </div>

            {/* Upload Video reference dropzone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-outline">File Video Mẫu</label>
              <div
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : uploadedFile
                      ? 'border-green-400 bg-green-50/20'
                      : 'border-outline-variant/60 hover:border-outline'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('admin-file-picker')?.click()}
              >
                <input
                  type="file"
                  id="admin-file-picker"
                  className="hidden"
                  accept="video/*"
                  onChange={handleFileChange}
                />
                <span className="material-symbols-outlined text-outline text-3xl mb-1.5">
                  {uploadedFile ? 'check_circle' : 'cloud_upload'}
                </span>
                <p className="text-xs text-on-surface font-semibold truncate">
                  {uploadedFile ? uploadedFile.name : 'Kéo thả video hoặc bấm để chọn'}
                </p>
                <p className="text-[10px] text-outline mt-1 font-medium select-none">MP4 hoặc WEBM, tối đa 10MB</p>
              </div>
            </div>

            {/* Upload Illustration image dropzone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-outline">Ảnh Minh Họa</label>
              <div
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                  isDraggingImage
                    ? 'border-primary bg-primary/5'
                    : uploadedImage
                      ? 'border-green-400 bg-green-50/20'
                      : 'border-outline-variant/60 hover:border-outline'
                }`}
                onDragOver={handleImageDragOver}
                onDragLeave={handleImageDragLeave}
                onDrop={handleImageDrop}
                onClick={() => document.getElementById('admin-image-picker')?.click()}
              >
                <input
                  type="file"
                  id="admin-image-picker"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageFileChange}
                />
                <span className="material-symbols-outlined text-outline text-3xl mb-1.5">
                  {uploadedImage ? 'check_circle' : 'add_photo_alternate'}
                </span>
                <p className="text-xs text-on-surface font-semibold truncate">
                  {uploadedImage ? uploadedImage.name : 'Kéo thả ảnh hoặc bấm để chọn'}
                </p>
                <p className="text-[10px] text-outline mt-1 font-medium select-none">JPG, PNG hoặc WEBP, tối đa 10MB</p>
              </div>
            </div>

            {/* Expected AI class index, required alongside the reference video */}
            {uploadedFile && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-outline">Expected ID (chỉ số lớp của mô hình AI)</label>
                <input
                  type="number"
                  min={0}
                  max={999}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium outline-none text-on-surface focus:border-primary"
                  placeholder="vd: 61"
                  value={vocabExpectedId}
                  onChange={(e) => setVocabExpectedId(e.target.value)}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs shadow hover:bg-primary/95 active-scale flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Thêm Từ Vựng Nhanh
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Section: User Management (matches 1st screenshot!) */}
      <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/15">
          <div>
            <h3 className="font-display text-lg font-bold text-on-surface">Quản Lý Người Dùng</h3>
            <p className="text-xs text-on-surface-variant font-medium">Kiểm tra trạng thái đăng nhập, vai trò và bật/tắt hoạt động.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-outline uppercase tracking-wider">{users.length} học viên đã đăng ký</span>
            <button
              type="button"
              onClick={() => setShowAddUserForm(!showAddUserForm)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-on-primary flex items-center gap-1.5 active-scale"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm Người Dùng
            </button>
          </div>
        </header>

        {showAddUserForm && (
          <form onSubmit={handleCreateUserSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-surface-container-low/40 rounded-xl border border-outline-variant/30">
            <input
              type="text" placeholder="Tên đăng nhập" required value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-xs font-medium outline-none focus:border-primary"
            />
            <input
              type="text" placeholder="Họ và tên" required value={newUserFullName}
              onChange={(e) => setNewUserFullName(e.target.value)}
              className="px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-xs font-medium outline-none focus:border-primary"
            />
            <input
              type="email" placeholder="Email" required value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-xs font-medium outline-none focus:border-primary"
            />
            <input
              type="password" placeholder="Mật khẩu" required value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              className="px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-xs font-medium outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as 'USER' | 'ADMIN')}
                className="flex-1 px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-xs font-medium outline-none focus:border-primary"
              >
                <option value="USER">Người dùng</option>
                <option value="ADMIN">Quản trị viên</option>
              </select>
              <button type="submit" className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold shrink-0">Tạo</button>
            </div>
          </form>
        )}

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 text-outline text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 font-bold select-none">Tên / Hồ Sơ</th>
                <th className="py-3 px-4 font-bold select-none">Email</th>
                <th className="py-3 px-4 font-bold select-none">Vai Trò</th>
                <th className="py-3 px-4 font-bold select-none">Trạng Thái</th>
                <th className="py-3 px-4 font-bold select-none">Hoạt Động Gần Nhất</th>
                <th className="py-3 px-4 text-center font-bold select-none">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                editingUserId === u.id ? (
                  <tr key={u.id} className="border-b border-outline-variant/15 bg-primary-container/5">
                    <td className="py-3 px-4" colSpan={2}>
                      <input
                        type="text" value={editUserFullName}
                        onChange={(e) => setEditUserFullName(e.target.value)}
                        className="w-full px-2 py-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-xs"
                      />
                      <input
                        type="password" placeholder="Mật khẩu mới (tùy chọn)" value={editUserPassword}
                        onChange={(e) => setEditUserPassword(e.target.value)}
                        className="w-full mt-1.5 px-2 py-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-xs"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={editUserRole}
                        onChange={(e) => setEditUserRole(e.target.value as 'USER' | 'ADMIN')}
                        className="px-2 py-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-xs"
                      >
                        <option value="USER">Người dùng</option>
                        <option value="ADMIN">Quản trị viên</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-outline text-xs">{u.status === 'Active' ? 'Hoạt động' : 'Ngừng hoạt động'}</td>
                    <td className="py-3 px-4 text-outline text-xs">{u.lastActive}</td>
                    <td className="py-3 px-4 text-center space-x-1.5">
                      <button onClick={() => handleSaveUser(u.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500/10 text-green-700 border border-green-500/20">Lưu</button>
                      <button onClick={() => setEditingUserId(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-surface-container-high text-outline">Hủy</button>
                    </td>
                  </tr>
                ) : (
                <tr key={u.id} className="border-b border-outline-variant/15 hover:bg-surface-container-low/25 transition-colors">
                  {/* Name */}
                  <td className="py-4 px-4 flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-surface-variant overflow-hidden border border-outline-variant/60">
                      <img className="w-full h-full object-cover" src={u.avatar} alt={u.name} />
                    </div>
                    <span className="font-label-bold text-[#111111]">{u.name}</span>
                  </td>

                  {/* Email */}
                  <td className="py-4 px-4 font-medium text-on-surface-variant">{u.email}</td>

                  {/* Role */}
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold leading-none ${
                      u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {u.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold leading-none ${
                      u.status === 'Active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {u.status === 'Active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </span>
                  </td>

                  {/* Last active */}
                  <td className="py-4 px-4 text-outline font-medium">{u.lastActive}</td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-center space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => onToggleUserStatus(u.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 ${
                        u.status === 'Active'
                          ? 'bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/15'
                          : 'bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/15'
                      }`}
                    >
                      {u.status === 'Active' ? 'Chuyển Ngừng HĐ' : 'Chuyển Hoạt Động'}
                    </button>
                    <button
                      onClick={() => startEditUser(u)}
                      title="Sửa người dùng"
                      className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-primary-container/10 transition-colors inline-flex"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { if (window.confirm(`Vô hiệu hóa ${u.name}?`)) onDeleteUser(u.id); }}
                      title="Vô hiệu hóa người dùng"
                      className="p-1.5 rounded-lg text-outline hover:text-[#ba1a1a] hover:bg-red-50 transition-colors inline-flex"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Category Management */}
      <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-4">
        <header className="pb-2 border-b border-outline-variant/15">
          <h3 className="font-display text-lg font-bold text-on-surface">Quản Lý Danh Mục</h3>
          <p className="text-xs text-on-surface-variant">Tạo, đổi tên hoặc xóa danh mục từ vựng.</p>
        </header>

        <form onSubmit={handleCreateCategory} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text" placeholder="Tên danh mục mới" value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium outline-none focus:border-primary"
          />
          <input
            type="text" placeholder="Mô tả (tùy chọn)" value={newCategoryDescription}
            onChange={(e) => setNewCategoryDescription(e.target.value)}
            className="flex-1 px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium outline-none focus:border-primary"
          />
          <label className="px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium text-outline cursor-pointer flex items-center gap-1.5 shrink-0 hover:border-outline">
            <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
            <span className="truncate max-w-[120px]">{newCategoryImage ? newCategoryImage.name : 'Ảnh bìa'}</span>
            <input
              type="file" accept="image/*" className="hidden"
              onChange={(e) => setNewCategoryImage(e.target.files?.[0] || null)}
            />
          </label>
          <button type="submit" className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 justify-center">
            <Plus className="w-3.5 h-3.5" /> Thêm
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map(cat => (
            <div key={cat.id} className="p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant/30 space-y-2">
              {editingCategoryId === cat.id ? (
                <>
                  <input
                    type="text" value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    className="w-full px-2 py-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-xs"
                  />
                  <input
                    type="text" value={editCategoryDescription}
                    onChange={(e) => setEditCategoryDescription(e.target.value)}
                    className="w-full px-2 py-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-xs"
                  />
                  <div className="flex gap-1.5">
                    <button onClick={() => handleSaveCategory(cat.id)} className="flex-1 py-1.5 bg-green-500/10 text-green-700 border border-green-500/20 rounded-lg text-xs font-bold">Lưu</button>
                    <button onClick={() => setEditingCategoryId(null)} className="flex-1 py-1.5 bg-surface-container-high text-outline rounded-lg text-xs font-bold">Hủy</button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-surface-variant shrink-0 overflow-hidden border border-outline-variant/45 flex items-center justify-center">
                      {cat.imageUrl ? (
                        <img className="w-full h-full object-cover" src={cat.imageUrl} alt={cat.name} />
                      ) : (
                        <span className="material-symbols-outlined text-outline text-[18px]">image</span>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-label-bold text-xs truncate text-[#111111]">{cat.name}</h4>
                      <p className="text-[10px] text-outline truncate">{cat.description || 'Chưa có mô tả'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <label
                      title="Tải lên ảnh bìa"
                      className="p-1.5 hover:bg-primary-container/10 text-outline hover:text-primary rounded-lg cursor-pointer"
                    >
                      {uploadingCategoryImageId === cat.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[16px] leading-none">add_photo_alternate</span>
                      )}
                      <input
                        type="file" accept="image/*" className="hidden"
                        disabled={uploadingCategoryImageId === cat.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadCategoryImage(cat.id, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <button onClick={() => startEditCategory(cat)} className="p-1.5 hover:bg-primary-container/10 text-outline hover:text-primary rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 hover:bg-red-50 text-outline hover:text-[#ba1a1a] rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Vocabulary List Editor (Manage catalog words) */}
      <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-4">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-outline-variant/15">
          <div>
            <h3 className="font-display text-lg font-bold text-on-surface">Danh Sách Từ Vựng Đã Đăng Ký</h3>
            <p className="text-xs text-on-surface-variant">Xem lại các từ đã tích hợp vào mẫu hiệu chỉnh đang hoạt động.</p>
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm từ vựng..."
            value={vocabSearchQuery}
            onChange={(e) => setVocabSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium outline-none focus:border-primary"
          />
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vocabularyList
            .filter(v => v.name.toLowerCase().includes(vocabSearchQuery.toLowerCase()))
            .map(v => (
            <div 
              key={v.id} 
              className="p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant/30 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-10 h-10 bg-surface-variant rounded-lg shrink-0 overflow-hidden border border-outline-variant/45">
                  <img className="w-full h-full object-cover" src={v.image} alt={v.name} />
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-label-bold text-xs truncate text-[#111111]">{v.name}</h4>
                  <p className="text-[10px] text-outline truncate">{v.category}</p>
                </div>
              </div>
              <button 
                onClick={() => onDeleteVocabulary(v.id)}
                className="p-2 hover:bg-[#ba1a1a]/10 text-outline hover:text-[#ba1a1a] rounded-lg transition-colors flex items-center justify-center shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
        {/* ──────────── Blog Management Section ──────────── */}
      <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-5">
        <header className="flex justify-between items-center pb-2 border-b border-outline-variant/15">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg font-bold text-on-surface">Quản Lý Blog</h3>
            <span className="text-xs text-outline ml-1">({blogs.length} bài viết)</span>
          </div>
          <button
            onClick={() => { setShowBlogForm(v => !v); setEditingBlog(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Tạo bài viết
          </button>
        </header>

        {/* Create form */}
        {showBlogForm && (
          <form onSubmit={handleCreateBlog} className="bg-surface-container-low/60 rounded-xl p-5 space-y-4 border border-outline-variant/30">
            <h4 className="text-sm font-bold text-on-surface">Tạo bài viết mới</h4>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-outline">Tiêu đề *</label>
              <input
                type="text"
                value={blogTitle}
                onChange={e => setBlogTitle(e.target.value)}
                placeholder="Nhập tiêu đề bài viết..."
                className="w-full px-3 py-2 bg-surface border border-outline-variant/50 rounded-lg text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-outline">Nội dung *</label>
              <textarea
                value={blogContent}
                onChange={e => setBlogContent(e.target.value)}
                placeholder="Nhập nội dung bài viết..."
                rows={6}
                className="w-full px-3 py-2 bg-surface border border-outline-variant/50 rounded-lg text-sm outline-none focus:border-primary resize-y"
              />
            </div>
            <div className="flex gap-4 flex-wrap">
              <div className="space-y-2 flex-1 min-w-[160px]">
                <label className="text-xs font-semibold text-outline">Trạng thái</label>
                <select
                  value={blogStatus}
                  onChange={e => setBlogStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant/50 rounded-lg text-sm outline-none focus:border-primary"
                >
                  <option value="DRAFT">Nháp (Draft)</option>
                  <option value="PUBLISHED">Xuất bản (Published)</option>
                </select>
              </div>
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="text-xs font-semibold text-outline">Thumbnail (tuỳ chọn)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setBlogThumbnail(e.target.files?.[0] || null)}
                  className="w-full text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Tạo bài viết
              </button>
              <button
                type="button"
                onClick={() => setShowBlogForm(false)}
                className="px-4 py-2 bg-surface-variant text-on-surface-variant text-xs font-semibold rounded-lg hover:bg-outline-variant/30 transition-colors"
              >
                Huỷ
              </button>
            </div>
          </form>
        )}

        {/* Edit modal */}
        {editingBlog && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-2xl p-6 w-full max-w-2xl space-y-4 border border-outline-variant/30 shadow-2xl">
              <div className="flex justify-between items-center">
                <h4 className="text-base font-bold text-on-surface">Sửa bài viết #{editingBlog.id}</h4>
                <button onClick={() => setEditingBlog(null)} className="p-1.5 hover:bg-surface-variant rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-outline">Tiêu đề *</label>
                <input
                  type="text"
                  value={editBlogTitle}
                  onChange={e => setEditBlogTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-outline">Nội dung *</label>
                <textarea
                  value={editBlogContent}
                  onChange={e => setEditBlogContent(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm outline-none focus:border-primary resize-y"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-outline">Trạng thái</label>
                <select
                  value={editBlogStatus}
                  onChange={e => setEditBlogStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm outline-none focus:border-primary"
                >
                  <option value="DRAFT">Nháp (Draft)</option>
                  <option value="PUBLISHED">Xuất bản (Published)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveBlog}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Lưu thay đổi
                </button>
                <button
                  onClick={() => setEditingBlog(null)}
                  className="px-4 py-2 bg-surface-variant text-on-surface-variant text-xs font-semibold rounded-lg hover:bg-outline-variant/30 transition-colors"
                >
                  Huỷ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Blog table */}
        {blogLoading ? (
          <div className="flex items-center justify-center py-10 text-outline">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Đang tải bài viết...
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-10 text-outline text-sm">Chưa có bài viết nào. Nhấn "Tạo bài viết" để bắt đầu!</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-container-low/60 text-outline uppercase tracking-wider">
                  <th className="py-3 px-4 text-left font-semibold">ID</th>
                  <th className="py-3 px-4 text-left font-semibold">Tiêu đề</th>
                  <th className="py-3 px-4 text-left font-semibold">Tác giả</th>
                  <th className="py-3 px-4 text-left font-semibold">Trạng thái</th>
                  <th className="py-3 px-4 text-left font-semibold">Ngày tạo</th>
                  <th className="py-3 px-4 text-center font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {blogs.map(blog => (
                  <tr key={blog.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-outline">#{blog.id}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {blog.thumbnailUrl && (
                          <img src={blog.thumbnailUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-outline-variant/30" />
                        )}
                        <span className="font-semibold text-on-surface truncate max-w-[220px]" title={blog.title}>{blog.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-outline">{blog.authorName || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        blog.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {blog.status === 'PUBLISHED' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {blog.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Nháp'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-outline">{new Date(blog.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => startEditBlog(blog)}
                          className="p-1.5 hover:bg-primary/10 text-outline hover:text-primary rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBlog(blog.id)}
                          className="p-1.5 hover:bg-red-50 text-outline hover:text-red-600 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
