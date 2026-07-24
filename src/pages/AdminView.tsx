import React, { useEffect, useRef, useState } from "react";
import { User, Vocabulary, Lesson } from "../types";
import {
  adminApi,
  AdminCategoryResponse,
  AdminBlogResponse,
  CreateBlogPayload,
  BlogReportResponse,
  BlogCommentResponse,
  LikeUserResponse,
  VocabSuggestionResponse,
} from "../services/api/adminApi";
import {
  analyticsApi,
  AdminSummaryResponse,
  VisitTimePoint,
  VisitLogResponse,
  Granularity,
} from "../services/api/analyticsApi";
import {
  validateText,
  validateRequired,
  validateNonNegativeInt,
} from "../utils/validation";
import {
  Upload,
  Users,
  Activity,
  BarChart,
  Server,
  Sparkles,
  Plus,
  Smile,
  RefreshCw,
  Trash2,
  Pencil,
  X,
  BookOpen,
  Eye,
  EyeOff,
  Flag,
  ShieldAlert,
  Check,
  Heart,
  MessageCircle,
  MapPin,
  Monitor,
  Clock,
  UserCircle,
  TrendingUp,
  Search,
} from "lucide-react";

// Mac dinh khoang thoi gian bieu do: 30 ngay gan nhat
const toDateInput = (d: Date) => d.toISOString().slice(0, 10);
const DEFAULT_TO = toDateInput(new Date());
const DEFAULT_FROM = toDateInput(new Date(Date.now() - 29 * 86400000));

interface AdminViewProps {
  currentUser: User;
  users: User[];
  vocabularyList: Vocabulary[];
  lessons: Lesson[];
  onToggleUserStatus: (userId: string) => void;
  onAddVocabulary: (newVocab: {
    name: string;
    categoryId: number;
    description: string;
    expectedId?: number;
    file?: File;
    imageFile?: File;
  }) => void;
  onDeleteVocabulary: (vocabId: string) => void;
  onUpdateVocabulary: (
    vocabId: string,
    data: {
      name: string;
      categoryId: number;
      description: string;
      expectedId?: number;
      videoFile?: File;
      imageFile?: File;
    },
  ) => Promise<void>;
  onRefreshCategories: () => void;
  onLogout: () => void;
}

export default function AdminView({
  currentUser,
  users,
  vocabularyList,
  lessons,
  onToggleUserStatus,
  onAddVocabulary,
  onDeleteVocabulary,
  onUpdateVocabulary,
  onRefreshCategories,
  onLogout,
}: AdminViewProps) {
  // Add vocab fields
  const [vocabName, setVocabName] = useState("");
  const [vocabCategoryId, setVocabCategoryId] = useState(lessons[0]?.id || "");
  const [vocabDescription, setVocabDescription] = useState("");
  const [vocabExpectedId, setVocabExpectedId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [vocabSearchQuery, setVocabSearchQuery] = useState("");

  // Sua tu vung (edit modal)
  const [editingVocab, setEditingVocab] = useState<Vocabulary | null>(null);
  const [editVocabName, setEditVocabName] = useState("");
  const [editVocabCategoryId, setEditVocabCategoryId] = useState("");
  const [editVocabDescription, setEditVocabDescription] = useState("");
  const [editVocabExpectedId, setEditVocabExpectedId] = useState("");
  const [editVocabVideo, setEditVocabVideo] = useState<File | null>(null);
  const [editVocabImage, setEditVocabImage] = useState<File | null>(null);
  const [editVocabSaving, setEditVocabSaving] = useState(false);

  const openEditVocab = (v: Vocabulary) => {
    setEditingVocab(v);
    setEditVocabName(v.name);
    setEditVocabCategoryId(String(v.categoryId));
    setEditVocabDescription(v.description || "");
    setEditVocabExpectedId(v.expectedId != null ? String(v.expectedId) : "");
    setEditVocabVideo(null);
    setEditVocabImage(null);
  };

  const handleEditVocabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVocab) return;
    if (!editVocabName.trim()) {
      alert("Tên từ vựng không được để trống.");
      return;
    }
    // Doi video moi thi bat buoc co expectedId (chi so class ONNX) di kem
    if (editVocabVideo && !editVocabExpectedId.trim()) {
      alert(
        "Vui lòng nhập Expected ID (chỉ số class ONNX) khi thay video mẫu.",
      );
      return;
    }
    setEditVocabSaving(true);
    try {
      await onUpdateVocabulary(editingVocab.id, {
        name: editVocabName.trim(),
        categoryId: Number(editVocabCategoryId),
        description: editVocabDescription.trim(),
        expectedId: editVocabExpectedId.trim()
          ? Number(editVocabExpectedId)
          : undefined,
        videoFile: editVocabVideo || undefined,
        imageFile: editVocabImage || undefined,
      });
      setEditingVocab(null);
    } finally {
      setEditVocabSaving(false);
    }
  };

  const [notification, setNotification] = useState("");

  // Muc dang xem trong trang admin - chia trang lon thanh cac phan rieng cho de quan ly.
  const [adminSection, setAdminSection] = useState<
    | "overview"
    | "users"
    | "admins"
    | "categories"
    | "vocabulary"
    | "blog"
    | "reports"
    | "suggestions"
  >("overview");

  // ─── Reports (to cao bai blog) ───
  const [reports, setReports] = useState<BlogReportResponse[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [pendingReportCount, setPendingReportCount] = useState(0);
  // Bo loc trang thai don to cao: tat ca / chua xu ly / da xu ly
  const [reportFilter, setReportFilter] = useState<
    "ALL" | "PENDING" | "RESOLVED"
  >("ALL");
  // Tim kiem (ten/email) va loc trang thai o muc Nguoi dung
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [viewingReport, setViewingReport] = useState<BlogReportResponse | null>(
    null,
  );
  const [removeReason, setRemoveReason] = useState("");
  const [removingBlog, setRemovingBlog] = useState(false);

  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const res = await adminApi.getReports(0, 100);
      setReports(res.content);
      setPendingReportCount(
        res.content.filter((r) => r.status === "PENDING").length,
      );
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // ─── Vocabulary suggestions (de xuat tu vung tu nguoi dung) ───
  const [suggestions, setSuggestions] = useState<VocabSuggestionResponse[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [pendingSuggestionCount, setPendingSuggestionCount] = useState(0);

  const loadSuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      const res = await adminApi.getVocabSuggestions(0, 100);
      setSuggestions(res.content);
      setPendingSuggestionCount(
        res.content.filter((s) => s.status === "PENDING").length,
      );
    } catch (err) {
      console.error("Failed to load vocabulary suggestions", err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const handleMarkSuggestionReviewed = async (id: number) => {
    try {
      await adminApi.markVocabSuggestionReviewed(id);
      await loadSuggestions();
    } catch (err) {
      setNotification("Không thể cập nhật đề xuất. Vui lòng thử lại.");
    }
  };

  const handleResolveReport = async (reportId: number) => {
    try {
      await adminApi.resolveReport(reportId);
      await loadReports();
    } catch (err) {
      alert("Không thể cập nhật đơn báo cáo.");
    }
  };

  const handleRemoveBlog = async () => {
    if (!viewingReport || viewingReport.blogId == null) return;
    if (!removeReason.trim()) {
      alert("Vui lòng nhập lý do gỡ bài.");
      return;
    }
    setRemovingBlog(true);
    try {
      await adminApi.removeBlogWithReason(
        viewingReport.blogId,
        removeReason.trim(),
      );
      setViewingReport(null);
      setRemoveReason("");
      await loadReports();
    } catch (err) {
      alert("Không thể gỡ bài viết.");
    } finally {
      setRemovingBlog(false);
    }
  };

  // Category management (fetched directly here - not part of App's shared state)
  const [categories, setCategories] = useState<AdminCategoryResponse[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null,
  );
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryDescription, setEditCategoryDescription] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState<File | null>(null);
  const [uploadingCategoryImageId, setUploadingCategoryImageId] = useState<
    number | null
  >(null);

  const loadCategories = async () => {
    try {
      const res = await adminApi.getCategories(0, 100);
      setCategories(res.content);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // ─── Overview / Analytics ─────────────────────────────────────────────────
  const [summary, setSummary] = useState<AdminSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Bieu do luot truy cap + bo loc
  const [chartFrom, setChartFrom] = useState(DEFAULT_FROM);
  const [chartTo, setChartTo] = useState(DEFAULT_TO);
  const [chartGranularity, setChartGranularity] = useState<Granularity>("DAY");
  const [timeSeries, setTimeSeries] = useState<VisitTimePoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  // Diem dang di chuot toi tren bieu do (de hien tooltip so lieu)
  const [chartHover, setChartHover] = useState<number | null>(null);

  // Log truy cap chi tiet (infinite scroll, 10/trang)
  const [visitLogs, setVisitLogs] = useState<VisitLogResponse[]>([]);
  const [visitPage, setVisitPage] = useState(0);
  const [visitHasMore, setVisitHasMore] = useState(true);
  const [visitLoading, setVisitLoading] = useState(false);
  const visitSentinelRef = useRef<HTMLDivElement | null>(null);

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      setSummary(await analyticsApi.getSummary());
    } catch (err) {
      console.error("Failed to load summary", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadTimeSeries = async (
    from = chartFrom,
    to = chartTo,
    gran = chartGranularity,
  ) => {
    setChartLoading(true);
    try {
      setTimeSeries(await analyticsApi.getVisitTimeSeries(from, to, gran));
    } catch (err) {
      console.error("Failed to load time series", err);
      setTimeSeries([]);
    } finally {
      setChartLoading(false);
    }
  };

  // Tai 1 trang log ke tiep (dung cho ca lan dau va infinite scroll)
  const loadMoreVisitLogs = async (reset = false) => {
    if (visitLoading) return;
    if (!reset && !visitHasMore) return;
    setVisitLoading(true);
    const pageToLoad = reset ? 0 : visitPage;
    try {
      const res = await analyticsApi.getVisitLogs(pageToLoad, 10);
      setVisitLogs((prev) => (reset ? res.content : [...prev, ...res.content]));
      setVisitPage(pageToLoad + 1);
      setVisitHasMore(pageToLoad + 1 < res.totalPages);
    } catch (err) {
      console.error("Failed to load visit logs", err);
    } finally {
      setVisitLoading(false);
    }
  };

  // Tai du lieu tong quan khi vao tab (1 lan)
  const overviewLoadedRef = useRef(false);
  useEffect(() => {
    if (adminSection !== "overview" || overviewLoadedRef.current) return;
    overviewLoadedRef.current = true;
    loadSummary();
    loadTimeSeries();
    loadMoreVisitLogs(true);
  }, [adminSection]);

  // loadMoreVisitLogs duoc tao lai moi render (dong theo state moi nhat) - luu vao
  // ref de observer ben duoi luon goi duoc ban moi nhat ma khong can rebuild observer.
  const loadMoreVisitLogsRef = useRef(loadMoreVisitLogs);
  useEffect(() => {
    loadMoreVisitLogsRef.current = loadMoreVisitLogs;
  });

  // Infinite scroll: quan sat sentinel de tai them khi luot toi cuoi danh sach.
  // Chi tao observer 1 lan khi vao tab overview - KHONG phu thuoc visitLoading/
  // visitPage/visitHasMore, vi IntersectionObserver bao trang thai hien tai ngay
  // khi observe() duoc goi. Neu rebuild observer moi lan tai xong (nhu truoc day),
  // ma sentinel van con nam trong rootMargin (bang 10 dong/trang thuong khong du
  // cao de day sentinel ra khoi vung quan sat), no se bao isIntersecting=true ngay
  // lap tuc -> tai them -> rebuild -> bao lai -> vong lap tai lien tuc gay giat UI.
  useEffect(() => {
    const el = visitSentinelRef.current;
    if (!el || adminSection !== "overview") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreVisitLogsRef.current();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [adminSection]);

  const handleApplyChartFilter = () => {
    if (chartFrom > chartTo) {
      alert(
        "Khoảng thời gian không hợp lệ: ngày bắt đầu phải trước ngày kết thúc.",
      );
      return;
    }
    loadTimeSeries(chartFrom, chartTo, chartGranularity);
  };

  // ─── Blog management ──────────────────────────────────────────────────────
  const [blogs, setBlogs] = useState<AdminBlogResponse[]>([]);
  const [blogLoading, setBlogLoading] = useState(false);
  // Bo loc trang thai bai viet o muc Quan Ly Blog
  const [blogFilter, setBlogFilter] = useState<
    "ALL" | "PUBLISHED" | "DRAFT" | "REMOVED"
  >("ALL");

  // Create blog form
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogStatus, setBlogStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [blogThumbnail, setBlogThumbnail] = useState<File | null>(null);

  // Xem chi tiet blog (admin chi doc, khong sua)
  const [viewingBlog, setViewingBlog] = useState<AdminBlogResponse | null>(
    null,
  );
  const [blogComments, setBlogComments] = useState<BlogCommentResponse[]>([]);
  const [blogLikers, setBlogLikers] = useState<LikeUserResponse[]>([]);
  const [blogDetailLoading, setBlogDetailLoading] = useState(false);

  // Go bai tu bang quan ly (kem ly do + thong bao tac gia)
  const [removingBlogItem, setRemovingBlogItem] =
    useState<AdminBlogResponse | null>(null);
  const [blogRemoveReason, setBlogRemoveReason] = useState("");
  const [blogRemoving, setBlogRemoving] = useState(false);

  const loadBlogs = async () => {
    setBlogLoading(true);
    try {
      const res = await adminApi.getBlogs(0, 100);
      setBlogs(res.content);
    } catch (err) {
      console.error("Failed to load blogs", err);
    } finally {
      setBlogLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    const err =
      validateText(blogTitle, "Tiêu đề", 255) ||
      validateRequired(blogContent, "Nội dung");
    if (err) {
      alert(err);
      return;
    }
    try {
      const payload: CreateBlogPayload = {
        title: blogTitle,
        content: blogContent,
        status: blogStatus,
      };
      const created = await adminApi.createBlog(payload);
      if (blogThumbnail)
        await adminApi.uploadBlogThumbnail(created.id, blogThumbnail);
      setBlogTitle("");
      setBlogContent("");
      setBlogStatus("DRAFT");
      setBlogThumbnail(null);
      setShowBlogForm(false);
      await loadBlogs();
    } catch (err) {
      alert("Không thể tạo bài viết.");
    }
  };

  // Mo modal chi tiet + tai binh luan/luot tim that
  const openBlogDetail = async (blog: AdminBlogResponse) => {
    setViewingBlog(blog);
    setBlogComments([]);
    setBlogLikers([]);
    setBlogDetailLoading(true);
    try {
      const [comments, likers] = await Promise.all([
        adminApi.getBlogComments(blog.id),
        adminApi.getBlogLikers(blog.id),
      ]);
      setBlogComments(comments);
      setBlogLikers(likers);
    } catch (err) {
      console.error("Failed to load blog engagement", err);
    } finally {
      setBlogDetailLoading(false);
    }
  };

  const closeBlogDetail = () => {
    setViewingBlog(null);
    setBlogComments([]);
    setBlogLikers([]);
  };

  // Go bai kem ly do (bang quan ly) -> chuyen REMOVED, tac gia thay ly do
  const handleRemoveBlogFromTable = async () => {
    if (!removingBlogItem) return;
    if (!blogRemoveReason.trim()) {
      alert("Vui lòng nhập lý do gỡ bài.");
      return;
    }
    setBlogRemoving(true);
    try {
      await adminApi.removeBlogWithReason(
        removingBlogItem.id,
        blogRemoveReason.trim(),
      );
      setRemovingBlogItem(null);
      setBlogRemoveReason("");
      await loadBlogs();
    } catch (err) {
      alert("Không thể gỡ bài viết.");
    } finally {
      setBlogRemoving(false);
    }
  };
  // ──────────────────────────────────────────────────────────────────────────

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = validateText(newCategoryName, "Tên danh mục", 255);
    if (nameErr) {
      alert(nameErr);
      return;
    }
    try {
      const created = await adminApi.createCategory(
        newCategoryName,
        newCategoryDescription,
      );
      if (newCategoryImage) {
        await adminApi.uploadCategoryImage(created.id, newCategoryImage);
      }
      setNewCategoryName("");
      setNewCategoryDescription("");
      setNewCategoryImage(null);
      await loadCategories();
      onRefreshCategories();
    } catch (error) {
      alert("Không thể tạo danh mục. Tên có thể đã tồn tại.");
    }
  };

  const handleUploadCategoryImage = async (categoryId: number, file: File) => {
    setUploadingCategoryImageId(categoryId);
    try {
      await adminApi.uploadCategoryImage(categoryId, file);
      await loadCategories();
      onRefreshCategories();
    } catch (error) {
      alert("Không thể tải lên ảnh danh mục.");
    } finally {
      setUploadingCategoryImageId(null);
    }
  };

  const startEditCategory = (cat: AdminCategoryResponse) => {
    setEditingCategoryId(cat.id);
    setEditCategoryName(cat.name);
    setEditCategoryDescription(cat.description || "");
  };

  const handleSaveCategory = async (id: number) => {
    const nameErr = validateText(editCategoryName, "Tên danh mục", 255);
    if (nameErr) {
      alert(nameErr);
      return;
    }
    try {
      await adminApi.updateCategory(
        id,
        editCategoryName,
        editCategoryDescription,
      );
      setEditingCategoryId(null);
      await loadCategories();
      onRefreshCategories();
    } catch (error) {
      alert("Không thể cập nhật danh mục. Tên có thể đã tồn tại.");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (
      !window.confirm(
        "Xóa danh mục này? Thao tác sẽ thất bại nếu vẫn còn từ vựng thuộc danh mục.",
      )
    )
      return;
    try {
      await adminApi.deleteCategory(id);
      await loadCategories();
      onRefreshCategories();
    } catch (error) {
      alert(
        "Không thể xóa danh mục - có thể vẫn còn từ vựng thuộc danh mục này.",
      );
    }
  };

  // Danh sach nguoi dung (USER) va tai khoan admin duoc tach rieng khi render ben duoi
  const learnerUsers = users.filter((u) => u.role !== "ADMIN");
  const adminUsers = users.filter((u) => u.role === "ADMIN");

  // Ap dung tim kiem (ten/email) + loc trang thai cho danh sach hoc vien
  const filteredLearnerUsers = learnerUsers.filter((u) => {
    const matchStatus =
      userStatusFilter === "ALL" ||
      (userStatusFilter === "ACTIVE" && u.status === "Active") ||
      (userStatusFilter === "INACTIVE" && u.status !== "Active");
    const q = userSearch.trim().toLowerCase();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });
  const activeLearnerCount = learnerUsers.filter(
    (u) => u.status === "Active",
  ).length;

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
    const wordErr = validateText(vocabName, "Tên từ vựng", 255);
    if (wordErr) {
      alert(wordErr);
      return;
    }
    if (!vocabCategoryId) {
      alert("Vui lòng chọn danh mục!");
      return;
    }
    if (vocabDescription.length > 255) {
      alert("Mô tả tối đa 255 ký tự.");
      return;
    }
    if (uploadedFile) {
      const idErr = validateNonNegativeInt(vocabExpectedId, "Expected ID");
      if (idErr) {
        alert(idErr + " (bắt buộc khi tải video mẫu)");
        return;
      }
    }
    onAddVocabulary({
      name: vocabName,
      categoryId: Number(vocabCategoryId),
      description: vocabDescription || "Chưa có mô tả.",
      expectedId: uploadedFile ? Number(vocabExpectedId) : undefined,
      file: uploadedFile || undefined,
      imageFile: uploadedImage || undefined,
    });

    setNotification(`Đã thêm "${vocabName}" vào thư viện thành công!`);
    setTimeout(() => setNotification(""), 4000);

    // Reset Form
    setVocabName("");
    setVocabDescription("");
    setVocabExpectedId("");
    setUploadedFile(null);
    setUploadedImage(null);
  };

  const SECTION_META = {
    overview: {
      title: "Tổng Quan",
      desc: "Theo dõi học viên, lượt truy cập, từ vựng, blog và nhật ký truy cập chi tiết.",
    },
    users: {
      title: "Quản Lý Người Dùng",
      desc: "Theo dõi trạng thái và bật/tắt hoạt động của học viên.",
    },
    admins: {
      title: "Nhật Ký Truy Cập Admin",
      desc: "lần đăng nhập gần nhất.",
    },
    categories: {
      title: "Quản Lý Danh Mục",
      desc: "Tạo, đổi tên hoặc xóa danh mục từ vựng.",
    },
    vocabulary: {
      title: "Quản Lý Từ Vựng",
      desc: "Thêm từ vựng mới và quản lý danh sách đã đăng ký.",
    },
    blog: {
      title: "Quản Lý Blog",
      desc: "Tạo, chỉnh sửa và xuất bản bài viết cộng đồng.",
    },
    reports: {
      title: "Báo Cáo Vi Phạm",
      desc: "Xử lý đơn tố cáo bài viết từ người dùng.",
    },
  } as const;

  const NAV_TABS = [
    { key: "overview", label: "Tổng Quan", icon: "monitoring" },
    { key: "users", label: "Người Dùng", icon: "group" },
    { key: "admins", label: "Nhật Ký Admin", icon: "admin_panel_settings" },
    { key: "categories", label: "Danh Mục", icon: "category" },
    { key: "vocabulary", label: "Từ Vựng", icon: "menu_book" },
    { key: "blog", label: "Blog", icon: "article" },
    { key: "reports", label: "Báo Cáo", icon: "flag" },
    { key: "suggestions", label: "Đề Xuất Từ Vựng", icon: "bookmark_add" },
  ] as const;

  return (
    <div className="bg-mesh min-h-screen flex flex-col md:flex-row antialiased font-sans text-on-surface">
      {/* Admin vertical sidebar - tach biet hoan toan voi sidebar cua nguoi dung */}
      <aside className="w-full md:w-64 md:h-screen md:sticky md:top-0 md:overflow-y-auto bg-surface-container-lowest shrink-0 border-b md:border-b-0 md:border-r border-outline-variant/30 px-5 py-6 flex flex-col justify-between">
        <div className="space-y-8">
          {/* Brand */}
          <div className="flex items-center gap-2 px-2">
            <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center border border-primary/20 shadow-sm text-primary">
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                admin_panel_settings
              </span>
            </div>
            <div>
              <span className="font-display font-bold text-xl text-primary leading-none block">
                Admin
              </span>
              <p className="text-[10px] text-outline font-semibold">
                Bảng Quản Trị SignMentor
              </p>
            </div>
          </div>

          {/* Vertical section nav */}
          <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 gap-1.5 scrollbar-none select-none">
            {NAV_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setAdminSection(tab.key)}
                className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition-colors shrink-0 text-sm font-bold ${
                  adminSection === tab.key
                    ? "bg-primary-container/10 text-primary"
                    : "text-outline hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {tab.icon}
                </span>
                <span className="md:inline">{tab.label}</span>
                {tab.key === "reports" && pendingReportCount > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                    {pendingReportCount}
                  </span>
                )}
                {tab.key === "suggestions" && pendingSuggestionCount > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                    {pendingSuggestionCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer: tai khoan + dang xuat */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 border border-outline-variant/30 rounded-2xl bg-surface-container-low">
            <div className="flex items-center space-x-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-outline-variant/60">
                <img
                  className="w-full h-full object-cover"
                  src={currentUser.avatar}
                  alt={currentUser.name}
                />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-on-surface truncate leading-none">
                  {currentUser.name}
                </p>
                <p className="text-[9px] text-outline truncate mt-0.5">
                  Quản trị viên
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="p-1 hover:bg-red-50 text-outline hover:text-[#ba1a1a] rounded-lg transition-colors flex items-center justify-center shrink-0"
              title="Đăng xuất"
            >
              <span className="material-symbols-outlined text-lg leading-none">
                power_settings_new
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Admin content area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="space-y-8 animate-fade-in">
          {/* Section header */}
          <section>
            <h2 className="font-display text-3xl font-extrabold text-gradient-brand">
              {SECTION_META[adminSection].title}
            </h2>
            <p className="text-body-md text-on-surface-variant">
              {SECTION_META[adminSection].desc}
            </p>
          </section>

          {/* Notifications */}
          {notification && (
            <div className="p-4 bg-green-100 text-green-800 rounded-xl font-semibold flex items-center gap-2 border border-green-200">
              <span className="material-symbols-outlined text-green-700">
                check_circle
              </span>
              {notification}
            </div>
          )}

          {/* System Telemetry stats row (du lieu that) */}
          {adminSection === "overview" && (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: "Tổng Học Viên",
                  value: summary?.totalStudents,
                  icon: "group",
                  color: "text-primary",
                  bg: "bg-primary/10",
                },
                {
                  label: "Lượt Truy Cập",
                  value: summary?.totalVisits,
                  icon: "visibility",
                  color: "text-[#2170e4]",
                  bg: "bg-[#2170e4]/10",
                },
                {
                  label: "Tổng Từ Vựng",
                  value: summary?.totalVocabularies,
                  icon: "menu_book",
                  color: "text-purple-600",
                  bg: "bg-purple-500/10",
                },
                {
                  label: "Tổng Bài Blog",
                  value: summary?.totalBlogs,
                  icon: "article",
                  color: "text-green-600",
                  bg: "bg-green-500/10",
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 inset-shadow flex items-center justify-between"
                >
                  <div>
                    <p className="text-[10px] font-bold uppercase text-outline">
                      {card.label}
                    </p>
                    <h3 className="text-3xl font-extrabold text-gradient-brand mt-1">
                      {summaryLoading && card.value == null ? (
                        <span className="inline-block w-16 h-8 bg-surface-variant/60 rounded animate-pulse align-middle" />
                      ) : (
                        (card.value ?? 0).toLocaleString("vi-VN")
                      )}
                    </h3>
                  </div>
                  <div
                    className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center ${card.color}`}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {card.icon}
                    </span>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Overview: bieu do luot truy cap theo thoi gian + bo loc */}
          {adminSection === "overview" && (
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-5">
              <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 pb-2 border-b border-outline-variant/15">
                <div>
                  <h3 className="font-display text-lg font-bold text-gradient-brand flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" /> Lượt Truy
                    Cập Theo Thời Gian
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium">
                    Thống kê lượt truy cập (khách &amp; học viên) theo ngày /
                    tháng / năm.
                  </p>
                </div>
              </header>

              {/* Bo loc khoang thoi gian + do chi tiet */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-outline">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={chartFrom}
                    max={chartTo}
                    onChange={(e) => setChartFrom(e.target.value)}
                    className="px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-outline">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={chartTo}
                    min={chartFrom}
                    onChange={(e) => setChartTo(e.target.value)}
                    className="px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-outline">
                    Độ chi tiết
                  </label>
                  <select
                    value={chartGranularity}
                    onChange={(e) =>
                      setChartGranularity(e.target.value as Granularity)
                    }
                    className="px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm outline-none focus:border-primary"
                  >
                    <option value="DAY">Theo ngày</option>
                    <option value="MONTH">Theo tháng</option>
                    <option value="YEAR">Theo năm</option>
                  </select>
                </div>
                <button
                  onClick={handleApplyChartFilter}
                  disabled={chartLoading}
                  className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-1.5"
                >
                  {chartLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Lọc
                </button>
                <div className="ml-auto text-right">
                  <p className="text-[10px] font-bold uppercase text-outline">
                    Tổng trong khoảng
                  </p>
                  <p className="text-lg font-extrabold text-primary">
                    {timeSeries
                      .reduce((s, p) => s + p.count, 0)
                      .toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>

              {/* Bieu do SVG dong */}
              <div className="relative h-64 w-full bg-surface-container-low/30 rounded-xl p-4">
                {chartLoading ? (
                  <div className="h-full flex items-center justify-center text-outline text-sm">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Đang tải
                    biểu đồ...
                  </div>
                ) : timeSeries.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-outline text-sm">
                    Không có dữ liệu trong khoảng thời gian này.
                  </div>
                ) : (
                  (() => {
                    const pts = timeSeries;
                    const W = 500,
                      H = 200,
                      padX = 20,
                      padTop = 15,
                      padBottom = 15;
                    const n = pts.length;
                    // Truc Y: chia thanh cac moc tron deu nhau tu 0 -> axisMax
                    const rawMax = Math.max(1, ...pts.map((p) => p.count));
                    const tickCount = Math.min(4, rawMax);
                    const stepV = Math.max(1, Math.ceil(rawMax / tickCount));
                    const axisMax = stepV * tickCount;
                    const yTicks = Array.from(
                      { length: tickCount + 1 },
                      (_, k) => k * stepV,
                    ); // 0..axisMax
                    const xAt = (i: number) =>
                      n <= 1 ? W / 2 : padX + (i / (n - 1)) * (W - 2 * padX);
                    const yAt = (v: number) =>
                      padTop + (1 - v / axisMax) * (H - padTop - padBottom);
                    const linePath = pts
                      .map(
                        (p, i) =>
                          `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(p.count).toFixed(1)}`,
                      )
                      .join(" ");
                    const areaPath = `${linePath} L ${xAt(n - 1).toFixed(1)} ${H - padBottom} L ${xAt(0).toFixed(1)} ${H - padBottom} Z`;
                    const step = Math.max(1, Math.ceil(n / 6));
                    const labelIdx = pts
                      .map((_, i) => i)
                      .filter((i) => i % step === 0 || i === n - 1);
                    const hover =
                      chartHover != null && chartHover < n ? chartHover : null;
                    return (
                      <div className="h-full flex flex-col">
                        <div className="flex-1 flex min-h-0">
                          {/* Cot nhan truc Y (so doc) */}
                          <div className="relative w-9 shrink-0">
                            {yTicks.map((v) => (
                              <span
                                key={v}
                                className="absolute right-1 -translate-y-1/2 text-[9px] text-outline font-mono tabular-nums"
                                style={{ top: `${(yAt(v) / H) * 100}%` }}
                              >
                                {v}
                              </span>
                            ))}
                          </div>

                          {/* Vung ve bieu do (bat su kien di chuot de hien so lieu) */}
                          <div
                            className="relative flex-1 h-full"
                            onMouseMove={(e) => {
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              const relX =
                                ((e.clientX - rect.left) / rect.width) * W;
                              let best = 0,
                                bestD = Infinity;
                              for (let i = 0; i < n; i++) {
                                const d = Math.abs(xAt(i) - relX);
                                if (d < bestD) {
                                  bestD = d;
                                  best = i;
                                }
                              }
                              setChartHover(best);
                            }}
                            onMouseLeave={() => setChartHover(null)}
                          >
                            <svg
                              className="w-full h-full"
                              viewBox="0 0 500 200"
                              preserveAspectRatio="none"
                            >
                              {yTicks.map((v) => (
                                <line
                                  key={v}
                                  x1="0"
                                  y1={yAt(v)}
                                  x2="500"
                                  y2={yAt(v)}
                                  stroke="#dae2fd"
                                  strokeWidth="0.5"
                                  strokeDasharray="4,4"
                                />
                              ))}
                              <path
                                d={areaPath}
                                fill="url(#visitGrad)"
                                opacity="0.18"
                              />
                              <path
                                d={linePath}
                                fill="none"
                                stroke="#4648d4"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <defs>
                                <linearGradient
                                  id="visitGrad"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop offset="0%" stopColor="#4a4be5" />
                                  <stop offset="100%" stopColor="#faf8ff" />
                                </linearGradient>
                              </defs>
                              {pts.map((p, i) => (
                                <circle
                                  key={i}
                                  cx={xAt(i)}
                                  cy={yAt(p.count)}
                                  r={n > 40 ? 2 : 4}
                                  fill="#4648d4"
                                  stroke="#ffffff"
                                  strokeWidth="1.5"
                                >
                                  <title>
                                    {p.label}: {p.count} lượt
                                  </title>
                                </circle>
                              ))}
                            </svg>

                            {/* Duong doc + diem noi bat + tooltip khi di chuot */}
                            {hover != null && (
                              <>
                                <div
                                  className="absolute top-0 bottom-0 w-px bg-primary/40 pointer-events-none"
                                  style={{ left: `${(xAt(hover) / W) * 100}%` }}
                                />
                                <div
                                  className="absolute w-2.5 h-2.5 rounded-full bg-primary border-2 border-white shadow pointer-events-none"
                                  style={{
                                    left: `${(xAt(hover) / W) * 100}%`,
                                    top: `${(yAt(pts[hover].count) / H) * 100}%`,
                                    transform: "translate(-50%, -50%)",
                                  }}
                                />
                                <div
                                  className="absolute z-10 px-2.5 py-1.5 rounded-lg bg-on-surface text-surface text-[10px] font-semibold shadow-lg whitespace-nowrap pointer-events-none"
                                  style={{
                                    left: `${(xAt(hover) / W) * 100}%`,
                                    top: `${(yAt(pts[hover].count) / H) * 100}%`,
                                    transform: `translate(${xAt(hover) / W > 0.7 ? "-100%" : xAt(hover) / W < 0.3 ? "0" : "-50%"}, calc(-100% - 8px))`,
                                  }}
                                >
                                  <div className="text-[9px] font-normal opacity-80">
                                    {pts[hover].label}
                                  </div>
                                  <div className="tabular-nums">
                                    {pts[hover].count.toLocaleString("vi-VN")}{" "}
                                    lượt
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Nhan truc X (le theo cot Y) */}
                        <div className="flex pt-1">
                          <div className="w-9 shrink-0" />
                          <div className="flex-1 flex justify-between text-[9px] text-outline px-1 font-mono">
                            {labelIdx.map((i) => (
                              <span key={i}>{pts[i].label}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}

          {/* Overview: bang log truy cap chi tiet (infinite scroll) */}
          {adminSection === "overview" && (
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-4">
              <header className="flex justify-between items-center pb-2 border-b border-outline-variant/15">
                <div>
                  <h3 className="font-display text-lg font-bold text-gradient-brand flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" /> Nhật Ký Truy Cập
                    Chi Tiết
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium">
                    Người dùng &amp; khách, thời gian, thiết bị và vị trí truy
                    cập.
                  </p>
                </div>
                <button
                  onClick={() => {
                    loadMoreVisitLogs(true);
                  }}
                  disabled={visitLoading}
                  className="p-2 hover:bg-surface-variant rounded-lg text-outline hover:text-primary transition-colors"
                  title="Tải lại"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${visitLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </header>

              <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface-container-low/60 text-outline uppercase tracking-wider">
                      <th className="py-3 px-4 text-left font-semibold">
                        Người truy cập
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        Thời gian
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        Thiết bị
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">IP</th>
                      <th className="py-3 px-4 text-left font-semibold">
                        Vị trí
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {visitLogs.map((v) => (
                      <tr
                        key={v.id}
                        className="hover:bg-surface-container-low/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          {v.visitorType === "USER" ? (
                            <div className="flex items-center gap-2">
                              {v.userAvatar ? (
                                <img
                                  src={v.userAvatar}
                                  alt=""
                                  className="w-6 h-6 rounded-full object-cover border border-outline-variant/30"
                                />
                              ) : (
                                <UserCircle className="w-6 h-6 text-primary" />
                              )}
                              <span className="font-semibold text-on-surface truncate max-w-[160px]">
                                {v.userName || "Học viên"}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant font-semibold text-[10px]">
                              <UserCircle className="w-3.5 h-3.5" /> Khách
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-outline whitespace-nowrap">
                          {new Date(v.visitedAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant">
                          <span className="inline-flex items-center gap-1">
                            <Monitor className="w-3.5 h-3.5 text-outline" />{" "}
                            {v.deviceInfo || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-outline">
                          {v.ipAddress || "—"}
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-outline" />{" "}
                            {v.location || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {visitLogs.length === 0 && !visitLoading && (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-10 text-outline text-sm"
                        >
                          Chưa có lượt truy cập nào được ghi nhận.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sentinel + trang thai tai them */}
              <div
                ref={visitSentinelRef}
                className="flex items-center justify-center py-3 text-outline text-xs"
              >
                {visitLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải
                    thêm...
                  </span>
                ) : visitHasMore ? (
                  <button
                    onClick={() => loadMoreVisitLogs()}
                    className="hover:text-primary font-semibold"
                  >
                    Tải thêm
                  </button>
                ) : visitLogs.length > 0 ? (
                  <span>— Đã hiển thị tất cả —</span>
                ) : null}
              </div>
            </div>
          )}

          {/* Vocabulary: form them tu vung */}
          {adminSection === "vocabulary" && (
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-4">
              <header className="pb-2 border-b border-outline-variant/15">
                <h3 className="font-display text-lg font-bold text-gradient-brand">
                  Quản Lý Nội Dung
                </h3>
                <p className="text-xs text-on-surface-variant font-medium">
                  Thêm nhanh từ vựng và video HD.
                </p>
              </header>

              <form onSubmit={handleAddVocabSubmit} className="space-y-4">
                {/* Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-outline">
                    Danh Mục
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium outline-none text-on-surface focus:border-primary"
                    value={vocabCategoryId}
                    onChange={(e) => setVocabCategoryId(e.target.value)}
                  >
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Word Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-outline">
                    Tên Từ Vựng
                  </label>
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
                  <label className="text-xs font-semibold text-outline">
                    Mô Tả Ký Hiệu
                  </label>
                  <textarea
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium outline-none text-on-surface focus:border-primary h-20 resize-none"
                    placeholder="Mô tả chính xác tư thế cơ thể..."
                    value={vocabDescription}
                    onChange={(e) => setVocabDescription(e.target.value)}
                  />
                </div>

                {/* Upload Video reference dropzone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-outline">
                    File Video Mẫu
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? "border-primary bg-primary/5"
                        : uploadedFile
                          ? "border-green-400 bg-green-50/20"
                          : "border-outline-variant/60 hover:border-outline"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() =>
                      document.getElementById("admin-file-picker")?.click()
                    }
                  >
                    <input
                      type="file"
                      id="admin-file-picker"
                      className="hidden"
                      accept="video/*"
                      onChange={handleFileChange}
                    />
                    <span className="material-symbols-outlined text-outline text-3xl mb-1.5">
                      {uploadedFile ? "check_circle" : "cloud_upload"}
                    </span>
                    <p className="text-xs text-on-surface font-semibold truncate">
                      {uploadedFile
                        ? uploadedFile.name
                        : "Kéo thả video hoặc bấm để chọn"}
                    </p>
                    <p className="text-[10px] text-outline mt-1 font-medium select-none">
                      MP4 hoặc WEBM, tối đa 10MB
                    </p>
                  </div>
                </div>

                {/* Upload Illustration image dropzone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-outline">
                    Ảnh Minh Họa
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                      isDraggingImage
                        ? "border-primary bg-primary/5"
                        : uploadedImage
                          ? "border-green-400 bg-green-50/20"
                          : "border-outline-variant/60 hover:border-outline"
                    }`}
                    onDragOver={handleImageDragOver}
                    onDragLeave={handleImageDragLeave}
                    onDrop={handleImageDrop}
                    onClick={() =>
                      document.getElementById("admin-image-picker")?.click()
                    }
                  >
                    <input
                      type="file"
                      id="admin-image-picker"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageFileChange}
                    />
                    <span className="material-symbols-outlined text-outline text-3xl mb-1.5">
                      {uploadedImage ? "check_circle" : "add_photo_alternate"}
                    </span>
                    <p className="text-xs text-on-surface font-semibold truncate">
                      {uploadedImage
                        ? uploadedImage.name
                        : "Kéo thả ảnh hoặc bấm để chọn"}
                    </p>
                    <p className="text-[10px] text-outline mt-1 font-medium select-none">
                      JPG, PNG hoặc WEBP, tối đa 10MB
                    </p>
                  </div>
                </div>

                {/* Expected AI class index, required alongside the reference video */}
                {uploadedFile && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-outline">
                      Expected ID (chỉ số lớp của mô hình AI)
                    </label>
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
          )}

          {/* Users: Quan Ly Nguoi Dung */}
          {adminSection === "users" && (
            <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-6">
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/15">
                <div>
                  <h3 className="font-display text-lg font-bold text-gradient-brand">
                    Quản Lý Người Dùng
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium">
                    Theo dõi trạng thái và bật/tắt hoạt động của học viên.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-outline uppercase tracking-wider">
                    {learnerUsers.length} học viên đã đăng ký
                  </span>
                </div>
              </header>

              {/* Thanh cong cu: tim kiem ten/email + loc trang thai */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Tìm theo tên hoặc email..."
                    className="w-full pl-9 pr-8 py-2 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs font-medium outline-none text-on-surface focus:border-primary transition-colors"
                  />
                  {userSearch && (
                    <button
                      onClick={() => setUserSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                      title="Xóa tìm kiếm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(
                    [
                      {
                        key: "ALL",
                        label: "Tất cả",
                        count: learnerUsers.length,
                      },
                      {
                        key: "ACTIVE",
                        label: "Hoạt động",
                        count: activeLearnerCount,
                      },
                      {
                        key: "INACTIVE",
                        label: "Ngừng hoạt động",
                        count: learnerUsers.length - activeLearnerCount,
                      },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setUserStatusFilter(f.key)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        userStatusFilter === f.key
                          ? "bg-primary text-white border-primary"
                          : "text-outline border-outline-variant/40 hover:bg-surface-container-low hover:text-on-surface"
                      }`}
                    >
                      {f.label}{" "}
                      <span
                        className={
                          userStatusFilter === f.key
                            ? "text-white/80"
                            : "text-outline"
                        }
                      >
                        ({f.count})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Responsive Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-outline text-xs uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4 font-bold select-none">
                        Tên / Hồ Sơ
                      </th>
                      <th className="py-3 px-4 font-bold select-none">Email</th>
                      <th className="py-3 px-4 font-bold select-none">
                        Vai Trò
                      </th>
                      <th className="py-3 px-4 font-bold select-none">
                        Trạng Thái
                      </th>
                      <th className="py-3 px-4 font-bold select-none">
                        Hoạt Động Gần Nhất
                      </th>
                      <th className="py-3 px-4 text-center font-bold select-none">
                        Hành Động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {learnerUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-outline text-sm"
                        >
                          Chưa có học viên nào đăng ký.
                        </td>
                      </tr>
                    )}
                    {learnerUsers.length > 0 &&
                      filteredLearnerUsers.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-8 text-center text-outline text-sm"
                          >
                            Không tìm thấy học viên phù hợp.
                          </td>
                        </tr>
                      )}
                    {filteredLearnerUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-outline-variant/15 hover:bg-surface-container-low/25 transition-colors"
                      >
                        {/* Name */}
                        <td className="py-4 px-4 flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-surface-variant overflow-hidden border border-outline-variant/60">
                            <img
                              className="w-full h-full object-cover"
                              src={u.avatar}
                              alt={u.name}
                            />
                          </div>
                          <span className="font-label-bold text-[#111111]">
                            {u.name}
                          </span>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-4 font-medium text-on-surface-variant">
                          {u.email}
                        </td>

                        {/* Role */}
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold leading-none ${
                              u.role === "ADMIN"
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {u.role === "ADMIN"
                              ? "Quản trị viên"
                              : "Người dùng"}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold leading-none ${
                              u.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {u.status === "Active"
                              ? "Hoạt động"
                              : "Ngừng hoạt động"}
                          </span>
                        </td>

                        {/* Last active */}
                        <td className="py-4 px-4 text-outline font-medium">
                          {u.lastActive}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-center space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => {
                              const confirmMsg =
                                u.status === "Active"
                                  ? `Chuyển ${u.name} sang trạng thái Ngừng hoạt động? Người dùng sẽ không thể đăng nhập cho đến khi được kích hoạt lại.`
                                  : `Chuyển ${u.name} sang trạng thái Hoạt động?`;
                              if (window.confirm(confirmMsg))
                                onToggleUserStatus(u.id);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 ${
                              u.status === "Active"
                                ? "bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/15"
                                : "bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/15"
                            }`}
                          >
                            {u.status === "Active"
                              ? "Chuyển Ngừng HĐ"
                              : "Chuyển Hoạt Động"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Admin access log: Nhat Ky Truy Cap Admin */}
          {adminSection === "admins" && (
            <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-6">
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/15">
                <div>
                  <h3 className="font-display text-lg font-bold text-gradient-brand">
                    Nhật Ký Truy Cập Admin
                  </h3>
                </div>
                <span className="text-xs font-bold text-outline uppercase tracking-wider">
                  {adminUsers.length} tài khoản quản trị
                </span>
              </header>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-outline text-xs uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4 font-bold select-none">
                        Tên / Hồ Sơ
                      </th>
                      <th className="py-3 px-4 font-bold select-none">Email</th>
                      <th className="py-3 px-4 font-bold select-none">
                        Trạng Thái
                      </th>
                      <th className="py-3 px-4 font-bold select-none">
                        Đăng Nhập Gần Nhất
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-8 text-center text-outline text-sm"
                        >
                          Chưa có nhật ký truy cập admin nào.
                        </td>
                      </tr>
                    )}
                    {adminUsers.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-outline-variant/15 hover:bg-surface-container-low/25 transition-colors"
                      >
                        <td className="py-4 px-4 flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-surface-variant overflow-hidden border border-outline-variant/60">
                            <img
                              className="w-full h-full object-cover"
                              src={a.avatar}
                              alt={a.name}
                            />
                          </div>
                          <span className="font-label-bold text-[#111111]">
                            {a.name}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-on-surface-variant">
                          {a.email}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold leading-none ${
                              a.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {a.status === "Active"
                              ? "Hoạt động"
                              : "Ngừng hoạt động"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-outline font-medium">
                          {a.lastActive}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Categories: Quan Ly Danh Muc */}
          {adminSection === "categories" && (
            <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-4">
              <header className="pb-2 border-b border-outline-variant/15">
                <h3 className="font-display text-lg font-bold text-gradient-brand">
                  Quản Lý Danh Mục
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Tạo, đổi tên hoặc xóa danh mục từ vựng.
                </p>
              </header>

              <form
                onSubmit={handleCreateCategory}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="text"
                  placeholder="Tên danh mục mới"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="Mô tả (tùy chọn)"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  className="flex-1 px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium outline-none focus:border-primary"
                />
                <label className="px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium text-outline cursor-pointer flex items-center gap-1.5 shrink-0 hover:border-outline">
                  <span className="material-symbols-outlined text-[16px]">
                    add_photo_alternate
                  </span>
                  <span className="truncate max-w-[120px]">
                    {newCategoryImage ? newCategoryImage.name : "Ảnh bìa"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      setNewCategoryImage(e.target.files?.[0] || null)
                    }
                  />
                </label>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 justify-center"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant/30 space-y-2"
                  >
                    {editingCategoryId === cat.id ? (
                      <>
                        <input
                          type="text"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="w-full px-2 py-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-xs"
                        />
                        <input
                          type="text"
                          value={editCategoryDescription}
                          onChange={(e) =>
                            setEditCategoryDescription(e.target.value)
                          }
                          className="w-full px-2 py-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-xs"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleSaveCategory(cat.id)}
                            className="flex-1 py-1.5 bg-green-500/10 text-green-700 border border-green-500/20 rounded-lg text-xs font-bold"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingCategoryId(null)}
                            className="flex-1 py-1.5 bg-surface-container-high text-outline rounded-lg text-xs font-bold"
                          >
                            Hủy
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-10 h-10 rounded-lg bg-surface-variant shrink-0 overflow-hidden border border-outline-variant/45 flex items-center justify-center">
                            {cat.imageUrl ? (
                              <img
                                className="w-full h-full object-cover"
                                src={cat.imageUrl}
                                alt={cat.name}
                              />
                            ) : (
                              <span className="material-symbols-outlined text-outline text-[18px]">
                                image
                              </span>
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="font-label-bold text-xs truncate text-[#111111]">
                              {cat.name}
                            </h4>
                            <p className="text-[10px] text-outline truncate">
                              {cat.description || "Chưa có mô tả"}
                            </p>
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
                              <span className="material-symbols-outlined text-[16px] leading-none">
                                add_photo_alternate
                              </span>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingCategoryImageId === cat.id}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file)
                                  handleUploadCategoryImage(cat.id, file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          <button
                            onClick={() => startEditCategory(cat)}
                            className="p-1.5 hover:bg-primary-container/10 text-outline hover:text-primary rounded-lg"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 hover:bg-red-50 text-outline hover:text-[#ba1a1a] rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Vocabulary: danh sach tu vung da dang ky */}
          {adminSection === "vocabulary" && (
            <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-4">
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-outline-variant/15">
                <div>
                  <h3 className="font-display text-lg font-bold text-gradient-brand">
                    Danh Sách Từ Vựng Đã Đăng Ký
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Xem lại các từ đã tích hợp vào mẫu hiệu chỉnh đang hoạt
                    động.
                  </p>
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
                  .filter((v) =>
                    v.name
                      .toLowerCase()
                      .includes(vocabSearchQuery.toLowerCase()),
                  )
                  .map((v) => (
                    <div
                      key={v.id}
                      className="p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant/30 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-10 h-10 bg-surface-variant rounded-lg shrink-0 overflow-hidden border border-outline-variant/45">
                          <img
                            className="w-full h-full object-cover"
                            src={v.image}
                            alt={v.name}
                          />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-label-bold text-xs truncate text-[#111111]">
                            {v.name}
                          </h4>
                          <p className="text-[10px] text-outline truncate">
                            {v.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditVocab(v)}
                          className="p-2 hover:bg-primary/10 text-outline hover:text-primary rounded-lg transition-colors flex items-center justify-center"
                          title="Sửa từ vựng"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteVocabulary(v.id)}
                          className="p-2 hover:bg-[#ba1a1a]/10 text-outline hover:text-[#ba1a1a] rounded-lg transition-colors flex items-center justify-center"
                          title="Xóa từ vựng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Modal: sua tu vung */}
          {editingVocab && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-surface rounded-2xl w-full max-w-md shadow-2xl border border-outline-variant/30 overflow-hidden">
                <header className="flex justify-between items-center px-5 py-4 border-b border-outline-variant/15">
                  <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-primary" /> Sửa từ vựng
                  </h4>
                  <button
                    onClick={() => setEditingVocab(null)}
                    className="p-1.5 hover:bg-surface-variant rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </header>
                <form
                  onSubmit={handleEditVocabSubmit}
                  className="p-5 space-y-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-outline">
                      Danh Mục
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium outline-none text-on-surface focus:border-primary"
                      value={editVocabCategoryId}
                      onChange={(e) => setEditVocabCategoryId(e.target.value)}
                    >
                      {lessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-outline">
                      Tên Từ Vựng
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium outline-none text-on-surface focus:border-primary"
                      value={editVocabName}
                      onChange={(e) => setEditVocabName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-outline">
                      Mô Tả Ký Hiệu
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium outline-none text-on-surface focus:border-primary h-20 resize-none"
                      value={editVocabDescription}
                      onChange={(e) => setEditVocabDescription(e.target.value)}
                    />
                  </div>

                  {/* Anh minh hoa: xem anh hien tai + doi anh moi (tuy chon) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-outline">
                      Ảnh minh họa (tuỳ chọn — để trống nếu giữ nguyên)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-outline-variant/40 bg-surface-variant shrink-0">
                        <img
                          src={
                            editVocabImage
                              ? URL.createObjectURL(editVocabImage)
                              : editingVocab.image
                          }
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setEditVocabImage(e.target.files?.[0] || null)
                        }
                        className="flex-1 text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                    </div>
                  </div>

                  {/* Video mau: doi video moi (tuy chon) - can expectedId */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-outline">
                      Video mẫu (tuỳ chọn — để trống nếu giữ nguyên)
                      {editingVocab.videoUrl && (
                        <span className="ml-1 text-green-600 font-normal">
                          · đã có video
                        </span>
                      )}
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) =>
                        setEditVocabVideo(e.target.files?.[0] || null)
                      }
                      className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                  </div>

                  {editVocabVideo && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-outline">
                        Expected ID (chỉ số class ONNX) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs font-medium outline-none text-on-surface focus:border-primary"
                        placeholder="vd: 42"
                        value={editVocabExpectedId}
                        onChange={(e) => setEditVocabExpectedId(e.target.value)}
                      />
                      <p className="text-[10px] text-outline">
                        Bắt buộc khi thay video mới — phải khớp chỉ số class của
                        mô hình.
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={editVocabSaving}
                      className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                      {editVocabSaving && (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      )}
                      Lưu thay đổi
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingVocab(null)}
                      className="px-4 py-2 bg-surface-variant text-on-surface-variant text-xs font-semibold rounded-lg hover:bg-outline-variant/30 transition-colors"
                    >
                      Huỷ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Blog: Quan Ly Blog */}
          {adminSection === "blog" && (
            <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-5">
              <header className="flex justify-between items-center pb-2 border-b border-outline-variant/15">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-lg font-bold text-gradient-brand">
                    Quản Lý Blog
                  </h3>
                  <span className="text-xs text-outline ml-1">
                    ({blogs.length} bài viết)
                  </span>
                </div>
                <button
                  onClick={() => setShowBlogForm((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tạo bài viết
                </button>
              </header>

              {/* Create form */}
              {showBlogForm && (
                <form
                  onSubmit={handleCreateBlog}
                  className="bg-surface-container-low/60 rounded-xl p-5 space-y-4 border border-outline-variant/30"
                >
                  <h4 className="text-sm font-bold text-on-surface">
                    Tạo bài viết mới
                  </h4>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-outline">
                      Tiêu đề *
                    </label>
                    <input
                      type="text"
                      value={blogTitle}
                      onChange={(e) => setBlogTitle(e.target.value)}
                      placeholder="Nhập tiêu đề bài viết..."
                      className="w-full px-3 py-2 bg-surface border border-outline-variant/50 rounded-lg text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-outline">
                      Nội dung *
                    </label>
                    <textarea
                      value={blogContent}
                      onChange={(e) => setBlogContent(e.target.value)}
                      placeholder="Nhập nội dung bài viết..."
                      rows={6}
                      className="w-full px-3 py-2 bg-surface border border-outline-variant/50 rounded-lg text-sm outline-none focus:border-primary resize-y"
                    />
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    <div className="space-y-2 flex-1 min-w-[160px]">
                      <label className="text-xs font-semibold text-outline">
                        Trạng thái
                      </label>
                      <select
                        value={blogStatus}
                        onChange={(e) =>
                          setBlogStatus(e.target.value as "DRAFT" | "PUBLISHED")
                        }
                        className="w-full px-3 py-2 bg-surface border border-outline-variant/50 rounded-lg text-sm outline-none focus:border-primary"
                      >
                        <option value="DRAFT">Nháp (Draft)</option>
                        <option value="PUBLISHED">Xuất bản (Published)</option>
                      </select>
                    </div>
                    <div className="space-y-2 flex-1 min-w-[200px]">
                      <label className="text-xs font-semibold text-outline">
                        Thumbnail (tuỳ chọn)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setBlogThumbnail(e.target.files?.[0] || null)
                        }
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

              {/* Bo loc trang thai bai viet */}
              <div className="flex items-center gap-2 flex-wrap">
                {(
                  [
                    { key: "ALL", label: "Tất cả", count: blogs.length },
                    {
                      key: "PUBLISHED",
                      label: "Đã xuất bản",
                      count: blogs.filter((b) => b.status === "PUBLISHED")
                        .length,
                    },
                    {
                      key: "DRAFT",
                      label: "Nháp",
                      count: blogs.filter((b) => b.status === "DRAFT").length,
                    },
                    {
                      key: "REMOVED",
                      label: "Đã gỡ",
                      count: blogs.filter((b) => b.status === "REMOVED").length,
                    },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setBlogFilter(f.key)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      blogFilter === f.key
                        ? "bg-primary text-white border-primary"
                        : "text-outline border-outline-variant/40 hover:bg-surface-container-low hover:text-on-surface"
                    }`}
                  >
                    {f.label}{" "}
                    <span
                      className={
                        blogFilter === f.key ? "text-white/80" : "text-outline"
                      }
                    >
                      ({f.count})
                    </span>
                  </button>
                ))}
              </div>

              {/* Edit modal */}
              {/* Blog table */}
              {blogLoading ? (
                <div className="flex items-center justify-center py-10 text-outline">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Đang tải
                  bài viết...
                </div>
              ) : blogs.length === 0 ? (
                <div className="text-center py-10 text-outline text-sm">
                  Chưa có bài viết nào. Nhấn "Tạo bài viết" để bắt đầu!
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-container-low/60 text-outline uppercase tracking-wider">
                        <th className="py-3 px-4 text-left font-semibold">
                          ID
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">
                          Tiêu đề
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">
                          Tác giả
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">
                          Trạng thái
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">
                          Ngày tạo
                        </th>
                        <th className="py-3 px-4 text-center font-semibold">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {blogs
                        .filter(
                          (b) =>
                            blogFilter === "ALL" || b.status === blogFilter,
                        )
                        .map((blog) => (
                          <tr
                            key={blog.id}
                            className="hover:bg-surface-container-low/40 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono text-outline">
                              #{blog.id}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {blog.thumbnailUrl && (
                                  <img
                                    src={blog.thumbnailUrl}
                                    alt=""
                                    className="w-8 h-8 rounded-lg object-cover border border-outline-variant/30"
                                  />
                                )}
                                <span
                                  className="font-semibold text-on-surface truncate max-w-[220px]"
                                  title={blog.title}
                                >
                                  {blog.title}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-outline">
                              {blog.authorName || "—"}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                                  blog.status === "PUBLISHED"
                                    ? "bg-green-100 text-green-700"
                                    : blog.status === "REMOVED"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {blog.status === "PUBLISHED" ? (
                                  <Eye className="w-3 h-3" />
                                ) : blog.status === "REMOVED" ? (
                                  <ShieldAlert className="w-3 h-3" />
                                ) : (
                                  <EyeOff className="w-3 h-3" />
                                )}
                                {blog.status === "PUBLISHED"
                                  ? "Đã xuất bản"
                                  : blog.status === "REMOVED"
                                    ? "Đã gỡ"
                                    : "Nháp"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-outline">
                              {new Date(blog.createdAt).toLocaleDateString(
                                "vi-VN",
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openBlogDetail(blog)}
                                  className="p-1.5 hover:bg-primary/10 text-outline hover:text-primary rounded-lg transition-colors"
                                  title="Xem chi tiết"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setRemovingBlogItem(blog);
                                    setBlogRemoveReason("");
                                  }}
                                  disabled={blog.status === "REMOVED"}
                                  className="p-1.5 hover:bg-red-50 text-outline hover:text-red-600 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                  title={
                                    blog.status === "REMOVED"
                                      ? "Bài đã bị gỡ"
                                      : "Gỡ bài"
                                  }
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {blogs.filter(
                        (b) => blogFilter === "ALL" || b.status === blogFilter,
                      ).length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-8 text-outline text-sm"
                          >
                            Không có bài viết nào ở trạng thái này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Reports: xu ly to cao bai blog */}
          {adminSection === "reports" && (
            <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-5">
              <header className="flex justify-between items-center pb-2 border-b border-outline-variant/15">
                <div className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-lg font-bold text-gradient-brand">
                    Đơn Tố Cáo
                  </h3>
                  <span className="text-xs text-outline ml-1">
                    ({reports.length} đơn · {pendingReportCount} chờ xử lý)
                  </span>
                </div>
                <button
                  onClick={loadReports}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-outline hover:text-primary rounded-lg hover:bg-surface-container-low transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Tải lại
                </button>
              </header>

              {/* Bo loc trang thai don */}
              <div className="flex items-center gap-2">
                {(
                  [
                    { key: "ALL", label: "Tất cả", count: reports.length },
                    {
                      key: "PENDING",
                      label: "Chưa xử lý",
                      count: pendingReportCount,
                    },
                    {
                      key: "RESOLVED",
                      label: "Đã xử lý",
                      count: reports.length - pendingReportCount,
                    },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setReportFilter(f.key)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      reportFilter === f.key
                        ? "bg-primary text-white border-primary"
                        : "text-outline border-outline-variant/40 hover:bg-surface-container-low hover:text-on-surface"
                    }`}
                  >
                    {f.label}{" "}
                    <span
                      className={
                        reportFilter === f.key
                          ? "text-white/80"
                          : "text-outline"
                      }
                    >
                      ({f.count})
                    </span>
                  </button>
                ))}
              </div>

              {reportsLoading ? (
                <div className="flex items-center justify-center py-10 text-outline">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Đang
                  tải...
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-10 text-outline text-sm">
                  Chưa có đơn tố cáo nào.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-container-low/60 text-outline uppercase tracking-wider">
                        <th className="py-3 px-4 text-left font-semibold">
                          ID Bài
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">
                          Tiêu đề bài
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">
                          Người tố cáo
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">
                          Lý do
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">
                          Trạng thái
                        </th>
                        <th className="py-3 px-4 text-center font-semibold">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {reports
                        .filter(
                          (r) =>
                            reportFilter === "ALL" || r.status === reportFilter,
                        )
                        .map((r) => (
                          <tr
                            key={r.id}
                            className="hover:bg-surface-container-low/40 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono font-bold text-primary">
                              #{r.blogId ?? "—"}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className="font-semibold text-on-surface truncate max-w-[200px] inline-block align-middle"
                                title={r.blogTitle || ""}
                              >
                                {r.blogTitle || "(đã xóa)"}
                              </span>
                              {r.blogStatus === "REMOVED" && (
                                <span className="ml-2 text-[9px] font-bold uppercase text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                  đã gỡ
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-outline">
                              {r.reporterName || "—"}
                            </td>
                            <td
                              className="py-3 px-4 text-on-surface truncate max-w-[220px]"
                              title={r.reason}
                            >
                              {r.reason}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                                  r.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {r.status === "PENDING"
                                  ? "Chờ xử lý"
                                  : "Đã xử lý"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setViewingReport(r);
                                    setRemoveReason("");
                                  }}
                                  className="p-1.5 hover:bg-primary/10 text-outline hover:text-primary rounded-lg transition-colors"
                                  title="Đọc nội dung & xử lý"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                {r.status === "PENDING" && (
                                  <button
                                    onClick={() => handleResolveReport(r.id)}
                                    className="p-1.5 hover:bg-green-50 text-outline hover:text-green-600 rounded-lg transition-colors"
                                    title="Bỏ qua (đánh dấu đã xử lý)"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      {reports.filter(
                        (r) =>
                          reportFilter === "ALL" || r.status === reportFilter,
                      ).length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-8 text-outline text-sm"
                          >
                            Không có đơn nào ở trạng thái này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {adminSection === "suggestions" && (
            <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 elevation-1 space-y-5">
              <header className="flex justify-between items-center pb-2 border-b border-outline-variant/15">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-lg font-bold text-gradient-brand">
                    Đề Xuất Từ Vựng
                  </h3>
                  <span className="text-xs text-outline ml-1">
                    ({suggestions.length} đề xuất · {pendingSuggestionCount} chờ xem)
                  </span>
                </div>
                <button
                  onClick={loadSuggestions}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-outline hover:text-primary rounded-lg hover:bg-surface-container-low transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Tải lại
                </button>
              </header>

              {suggestionsLoading ? (
                <div className="flex items-center justify-center py-10 text-outline">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Đang tải...
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-10 text-outline text-sm">
                  Chưa có đề xuất từ vựng nào.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-container-low/60 text-outline uppercase tracking-wider">
                        <th className="py-3 px-4 text-left font-semibold">Từ vựng</th>
                        <th className="py-3 px-4 text-left font-semibold">Danh mục</th>
                        <th className="py-3 px-4 text-left font-semibold">Mô tả</th>
                        <th className="py-3 px-4 text-left font-semibold">Người đề xuất</th>
                        <th className="py-3 px-4 text-left font-semibold">Ngày gửi</th>
                        <th className="py-3 px-4 text-left font-semibold">Trạng thái</th>
                        <th className="py-3 px-4 text-center font-semibold">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {suggestions.map((s) => (
                        <tr
                          key={s.id}
                          className="hover:bg-surface-container-low/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-semibold text-on-surface">
                            {s.word}
                          </td>
                          <td className="py-3 px-4 text-outline">{s.categoryName}</td>
                          <td
                            className="py-3 px-4 text-on-surface truncate max-w-[220px]"
                            title={s.description || ""}
                          >
                            {s.description || "—"}
                          </td>
                          <td className="py-3 px-4 text-outline">{s.requesterName}</td>
                          <td className="py-3 px-4 text-outline whitespace-nowrap">
                            {new Date(s.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                                s.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {s.status === "PENDING" ? "Chờ xem" : "Đã xem"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {s.status === "PENDING" && (
                                <button
                                  onClick={() => handleMarkSuggestionReviewed(s.id)}
                                  className="p-1.5 hover:bg-green-50 text-outline hover:text-green-600 rounded-lg transition-colors"
                                  title="Đánh dấu đã xem"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Modal: xem chi tiet bai viet (admin chi doc) */}
          {viewingBlog && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-surface rounded-2xl p-6 w-full max-w-2xl space-y-4 border border-outline-variant/30 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                  <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" /> Chi tiết bài
                    viết
                    <span className="font-mono text-primary">
                      #{viewingBlog.id}
                    </span>
                  </h4>
                  <button
                    onClick={closeBlogDetail}
                    className="p-1.5 hover:bg-surface-variant rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Thong tin lien quan */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/20">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-outline mb-0.5">
                      Tác giả
                    </p>
                    <p className="text-sm font-semibold text-on-surface">
                      {viewingBlog.authorName || "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/20">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-outline mb-0.5">
                      Trạng thái
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        viewingBlog.status === "PUBLISHED"
                          ? "bg-green-100 text-green-700"
                          : viewingBlog.status === "REMOVED"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {viewingBlog.status === "PUBLISHED"
                        ? "Đã xuất bản"
                        : viewingBlog.status === "REMOVED"
                          ? "Đã gỡ"
                          : "Nháp"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/20">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-outline mb-0.5">
                      Lượt thích
                    </p>
                    <p className="text-sm font-semibold text-on-surface">
                      {viewingBlog.likeCount}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/20">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-outline mb-0.5">
                      Bình luận
                    </p>
                    <p className="text-sm font-semibold text-on-surface">
                      {viewingBlog.commentCount}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/20">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-outline mb-0.5">
                      Ngày tạo
                    </p>
                    <p className="text-sm font-semibold text-on-surface">
                      {new Date(viewingBlog.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/20">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-outline mb-0.5">
                      Cập nhật
                    </p>
                    <p className="text-sm font-semibold text-on-surface">
                      {new Date(viewingBlog.updatedAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>

                {viewingBlog.status === "REMOVED" &&
                  viewingBlog.deletionReason && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-red-700 mb-1 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Lý do đã gỡ
                      </p>
                      <p className="text-sm text-red-700">
                        {viewingBlog.deletionReason}
                      </p>
                    </div>
                  )}

                {/* Noi dung bai */}
                <div className="space-y-2 pt-1 border-t border-outline-variant/15">
                  {viewingBlog.thumbnailUrl && (
                    <img
                      src={viewingBlog.thumbnailUrl}
                      alt=""
                      className="w-full h-40 object-cover rounded-xl border border-outline-variant/20"
                    />
                  )}
                  <h5 className="font-bold text-on-surface text-lg">
                    {viewingBlog.title}
                  </h5>
                  <p className="text-sm text-on-surface-variant whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {viewingBlog.content}
                  </p>
                </div>

                {/* Luot tim that + Binh luan that */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-outline-variant/15">
                  {/* Nguoi da tim */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-outline flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500" /> Lượt tim (
                      {viewingBlog.likeCount})
                    </p>
                    {blogDetailLoading ? (
                      <div className="flex items-center gap-2 text-outline text-xs py-3">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang
                        tải...
                      </div>
                    ) : blogLikers.length === 0 ? (
                      <p className="text-xs text-outline py-2">
                        Chưa có ai tim bài này.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        {blogLikers.map((liker) => (
                          <div
                            key={liker.userId ?? Math.random()}
                            className="flex items-center gap-2"
                          >
                            {liker.userAvatar ? (
                              <img
                                src={liker.userAvatar}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover border border-outline-variant/30"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                                {(liker.userName || "?")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}
                            <span className="text-xs text-on-surface truncate">
                              {liker.userName || "Ẩn danh"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Binh luan */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-outline flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-primary" />{" "}
                      Bình luận ({viewingBlog.commentCount})
                    </p>
                    {blogDetailLoading ? (
                      <div className="flex items-center gap-2 text-outline text-xs py-3">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang
                        tải...
                      </div>
                    ) : blogComments.length === 0 ? (
                      <p className="text-xs text-outline py-2">
                        Chưa có bình luận nào.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {blogComments.map((c) => (
                          <div
                            key={c.id}
                            className="p-2 rounded-lg bg-surface-container-low/60 border border-outline-variant/20"
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              {c.userAvatar ? (
                                <img
                                  src={c.userAvatar}
                                  alt=""
                                  className="w-5 h-5 rounded-full object-cover border border-outline-variant/30"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-surface-variant flex items-center justify-center text-[9px] font-bold text-on-surface-variant">
                                  {(c.userName || "?").charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-[11px] font-semibold text-on-surface truncate">
                                {c.userName || "Ẩn danh"}
                              </span>
                              <span className="text-[10px] text-outline ml-auto shrink-0">
                                {new Date(c.createdAt).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </span>
                            </div>
                            <p className="text-xs text-on-surface-variant whitespace-pre-wrap">
                              {c.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal: go bai kem ly do (tu bang quan ly) */}
          {removingBlogItem && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-surface rounded-2xl p-6 w-full max-w-md space-y-4 border border-outline-variant/30 shadow-2xl">
                <div className="flex justify-between items-center">
                  <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-600" /> Gỡ bài viết
                    <span className="font-mono text-primary">
                      #{removingBlogItem.id}
                    </span>
                  </h4>
                  <button
                    onClick={() => {
                      setRemovingBlogItem(null);
                      setBlogRemoveReason("");
                    }}
                    className="p-1.5 hover:bg-surface-variant rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-on-surface-variant">
                  Bài{" "}
                  <span className="font-semibold text-on-surface">
                    "{removingBlogItem.title}"
                  </span>{" "}
                  sẽ bị gỡ khỏi cộng đồng. Tác giả{" "}
                  <span className="font-semibold text-on-surface">
                    {removingBlogItem.authorName || "—"}
                  </span>{" "}
                  sẽ nhận được lý do bên dưới.
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-outline">
                    Lý do gỡ bài (sẽ gửi cho tác giả) *
                  </label>
                  <textarea
                    value={blogRemoveReason}
                    onChange={(e) => setBlogRemoveReason(e.target.value)}
                    rows={3}
                    placeholder="VD: Bài viết vi phạm quy định cộng đồng, chứa nội dung không phù hợp."
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm outline-none focus:border-primary resize-y"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleRemoveBlogFromTable}
                    disabled={blogRemoving}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-2"
                  >
                    {blogRemoving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Gỡ bài & thông báo tác giả
                  </button>
                  <button
                    onClick={() => {
                      setRemovingBlogItem(null);
                      setBlogRemoveReason("");
                    }}
                    className="px-4 py-2 bg-surface-variant text-on-surface-variant text-sm font-semibold rounded-xl hover:bg-outline-variant/30 transition-colors"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: doc noi dung bai bi to cao + go bai kem ly do */}
          {viewingReport && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-surface rounded-2xl p-6 w-full max-w-2xl space-y-4 border border-outline-variant/30 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                  <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <Flag className="w-4 h-4 text-amber-600" /> Bài viết bị tố
                    cáo
                    <span className="font-mono text-primary">
                      #{viewingReport.blogId}
                    </span>
                  </h4>
                  <button
                    onClick={() => setViewingReport(null)}
                    className="p-1.5 hover:bg-surface-variant rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Ly do to cao */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700 mb-1">
                    Lý do tố cáo · bởi {viewingReport.reporterName || "ẩn danh"}
                  </p>
                  <p className="text-sm text-on-surface">
                    {viewingReport.reason}
                  </p>
                </div>

                {/* Noi dung bai */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-outline">
                    Nội dung bài viết · tác giả{" "}
                    {viewingReport.blogAuthorName || "—"}
                  </p>
                  {viewingReport.blogThumbnailUrl && (
                    <img
                      src={viewingReport.blogThumbnailUrl}
                      alt=""
                      className="w-full h-40 object-cover rounded-xl border border-outline-variant/20"
                    />
                  )}
                  <h5 className="font-bold text-on-surface">
                    {viewingReport.blogTitle || "(bài đã bị xóa)"}
                  </h5>
                  <p className="text-sm text-on-surface-variant whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {viewingReport.blogContent || "—"}
                  </p>
                </div>

                {/* Go bai kem ly do (chi khi bai chua bi go) */}
                {viewingReport.blogStatus === "REMOVED" ? (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Bài này đã bị gỡ.
                  </div>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-outline-variant/15">
                    <label className="text-xs font-semibold text-outline">
                      Lý do gỡ bài (sẽ gửi cho tác giả)
                    </label>
                    <textarea
                      value={removeReason}
                      onChange={(e) => setRemoveReason(e.target.value)}
                      rows={3}
                      placeholder="VD: Bài viết chứa nội dung quảng cáo/lừa đảo, vi phạm quy định cộng đồng."
                      className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm outline-none focus:border-primary resize-y"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleRemoveBlog}
                        disabled={removingBlog}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-2"
                      >
                        {removingBlog ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Gỡ bài & thông báo tác giả
                      </button>
                      <button
                        onClick={() => {
                          handleResolveReport(viewingReport.id);
                          setViewingReport(null);
                        }}
                        className="px-4 py-2 bg-surface-variant text-on-surface-variant text-sm font-semibold rounded-xl hover:bg-outline-variant/30 transition-colors"
                      >
                        Bỏ qua đơn
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
