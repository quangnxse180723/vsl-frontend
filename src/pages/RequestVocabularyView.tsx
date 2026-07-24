import React, { useEffect, useState } from 'react';
import { categoryApi, CategoryResponse } from '../services/api/categoryApi';
import {
  vocabularySuggestionApi,
  VocabularySuggestionResponse,
  SynonymItem,
} from '../services/api/vocabularySuggestionApi';
import { getApiErrorMessage } from '../services/api/apiError';
import { validateText } from '../utils/validation';
import {
  BookMarked, Plus, RefreshCw, ShieldAlert, Sparkles, CheckCircle2, Clock, Send, Lightbulb,
} from 'lucide-react';

export default function RequestVocabularyView() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [word, setWord] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');     // loi validate co ban / loi tu BE
  const [successMsg, setSuccessMsg] = useState('');

  // Ket qua kiem tra trung tu vung (auto search)
  const [checking, setChecking] = useState(false);
  const [duplicateOf, setDuplicateOf] = useState<{ word: string | null; categoryName: string | null } | null>(null);

  // Quet AI tim tu dong nghia - CHAY THEO YEU CAU (bam nut) de tiet kiem quota Gemini.
  const [aiChecking, setAiChecking] = useState(false);
  const [aiSynonyms, setAiSynonyms] = useState<SynonymItem[]>([]);
  const [aiError, setAiError] = useState(false);      // goi AI that bai (vd het quota)
  const [aiScanned, setAiScanned] = useState(false);  // da quet cho tu hien tai chua
  // Cache ket qua theo tu (chuan hoa) de khong goi lai cung 1 tu -> do ton quota.
  const aiCache = React.useRef<Map<string, SynonymItem[]>>(new Map());

  const [mine, setMine] = useState<VocabularySuggestionResponse[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);

  const loadCategories = async () => {
    try {
      const res = await categoryApi.getAll(0, 100);
      setCategories(res.content);
      if (res.content.length > 0) setCategoryId(prev => (prev === '' ? res.content[0].id : prev));
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const loadMine = async () => {
    setLoadingMine(true);
    try {
      const res = await vocabularySuggestionApi.getMine();
      setMine(res.data);
    } catch (err) {
      console.error('Failed to load my suggestions', err);
    } finally {
      setLoadingMine(false);
    }
  };

  useEffect(() => { loadCategories(); loadMine(); }, []);

  // Auto-search: khi go "ten tu vung", debounce 400ms roi goi API kiem tra trung.
  // Kiem tra la TOAN he thong (khong phu thuoc danh muc dang chon).
  useEffect(() => {
    const trimmed = word.trim();
    setDuplicateOf(null);
    if (!trimmed) { setChecking(false); return; }

    setChecking(true);
    const handle = setTimeout(async () => {
      try {
        const res = await vocabularySuggestionApi.checkExists(trimmed);
        if (res.data.exists) {
          setDuplicateOf({ word: res.data.word, categoryName: res.data.categoryName });
        } else {
          setDuplicateOf(null);
        }
      } catch (err) {
        // Loi mang khi kiem tra khong nen chan submit - de BE chan lai khi gui.
        setDuplicateOf(null);
      } finally {
        setChecking(false);
      }
    }, 400);

    return () => clearTimeout(handle);
  }, [word]);

  // Doi tu -> xoa ket qua AI cu (ket qua chi ung voi tu vua quet).
  useEffect(() => {
    setAiSynonyms([]);
    setAiError(false);
    setAiScanned(false);
  }, [word]);

  const isDuplicate = duplicateOf !== null;

  // Quet AI theo yeu cau (bam nut). Co cache theo tu de do goi lai -> tiet kiem quota.
  const runAiScan = async () => {
    const trimmed = word.trim();
    if (!trimmed || isDuplicate || aiChecking) return;

    const cached = aiCache.current.get(trimmed);
    if (cached) { setAiSynonyms(cached); setAiError(false); setAiScanned(true); return; }

    setAiChecking(true);
    setAiError(false);
    try {
      const res = await vocabularySuggestionApi.checkSynonyms(trimmed);
      if (res.data.aiError) {
        setAiError(true);
        setAiSynonyms([]);
      } else {
        const syns = res.data.aiChecked ? res.data.synonyms : [];
        setAiSynonyms(syns);
        aiCache.current.set(trimmed, syns);   // chi cache ket qua thanh cong
      }
      setAiScanned(true);
    } catch (err) {
      setAiError(true);
      setAiSynonyms([]);
      setAiScanned(true);
    } finally {
      setAiChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    const wordErr = validateText(word, 'Tên từ vựng', 255);
    if (wordErr) { setFormError(wordErr); return; }
    if (categoryId === '') { setFormError('Vui lòng chọn danh mục.'); return; }
    if (isDuplicate) { setFormError('Từ vựng này đã tồn tại, không thể đề xuất.'); return; }

    setSubmitting(true);
    try {
      await vocabularySuggestionApi.submit({
        categoryId: Number(categoryId),
        word: word.trim(),
        description: description.trim() || undefined,
      });
      setSuccessMsg('Đã gửi đề xuất từ vựng. Cảm ơn bạn đã đóng góp!');
      setWord('');
      setDescription('');
      setDuplicateOf(null);
      await loadMine();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Không thể gửi đề xuất. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisabled = submitting || checking || isDuplicate || !word.trim() || categoryId === '';

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      <section>
        <h2 className="font-display text-3xl font-extrabold text-gradient-brand flex items-center gap-2">
          <BookMarked className="w-7 h-7 text-primary" />
          Đề Xuất Từ Vựng
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Gợi ý một từ vựng ký hiệu mới cho hệ thống. Quản trị viên sẽ xem xét đề xuất của bạn.
        </p>
      </section>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-2xl p-6 space-y-5 border border-outline-variant/30 elevation-1">
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-on-surface-variant">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>Nhập tên từ vựng, hệ thống sẽ tự động kiểm tra xem từ đó đã tồn tại chưa. Nếu chưa có, bạn có thể gửi đề xuất.</span>
        </div>

        {formError && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Danh muc */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-outline">Danh mục *</label>
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm outline-none focus:border-primary appearance-none"
          >
            {categories.length === 0 && <option value="">Đang tải danh mục...</option>}
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Ten tu vung */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-outline">Tên từ vựng *</label>
          <div className="relative">
            <input
              type="text"
              value={word}
              onChange={e => setWord(e.target.value)}
              placeholder="Nhập tên từ vựng muốn đề xuất..."
              className={`w-full px-4 py-3 bg-surface-container-low border rounded-xl text-sm outline-none focus:border-primary ${
                isDuplicate ? 'border-red-300' : 'border-outline-variant/50'
              }`}
            />
            {checking && (
              <RefreshCw className="w-4 h-4 animate-spin text-outline absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Ket qua kiem tra trung */}
          {isDuplicate && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Từ vựng "{duplicateOf?.word || word.trim()}" đã tồn tại
                {duplicateOf?.categoryName ? <> trong danh mục "{duplicateOf.categoryName}"</> : null}.
                Vui lòng chọn từ khác.
              </span>
            </div>
          )}
          {!isDuplicate && !checking && word.trim() && (
            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Từ vựng này chưa có trong hệ thống.
            </p>
          )}

          {/* Quet AI tim tu dong nghia - CHAY THEO YEU CAU (bam nut) */}
          {!isDuplicate && word.trim() && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={runAiScan}
                disabled={aiChecking}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {aiChecking
                  ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang quét bằng AI...</>
                  : <><Sparkles className="w-3.5 h-3.5" /> Kiểm tra từ tương tự bằng AI</>}
              </button>

              {/* Loi goi AI (vd het quota) */}
              {aiError && (
                <p className="text-xs text-outline flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  Không thể quét AI lúc này (có thể đã hết lượt), vui lòng thử lại sau.
                </p>
              )}

              {/* Ket qua: co tu dong nghia */}
              {!aiError && aiSynonyms.length > 0 && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <div className="space-y-1.5">
                    <p className="font-semibold">Có thể trùng nghĩa — các từ tương tự đã có:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {aiSynonyms.map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/70 border border-amber-200 font-medium">
                          {s.word}
                          <span className="text-amber-500">· {s.categoryName}</span>
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-amber-700/80">Bạn vẫn có thể gửi đề xuất nếu cho rằng đây là từ khác.</p>
                  </div>
                </div>
              )}

              {/* Da quet, khong tim thay tu tuong tu */}
              {!aiError && aiScanned && !aiChecking && aiSynonyms.length === 0 && (
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> AI không tìm thấy từ nào trùng nghĩa.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Mo ta (tuy chon) */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-outline">Mô tả (tuỳ chọn)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Mô tả ngắn về từ vựng này (nếu có)..."
            rows={3}
            maxLength={255}
            className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm outline-none focus:border-primary resize-y"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitDisabled}
            className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Đang gửi...' : 'Gửi đề xuất'}
          </button>
        </div>
      </form>

      {/* De xuat cua toi */}
      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 elevation-1 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <h3 className="font-bold text-on-surface flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> Đề xuất của tôi
          </h3>
          <button onClick={loadMine} className="p-2 hover:bg-surface-variant rounded-lg text-outline" title="Tải lại">
            <RefreshCw className={`w-4 h-4 ${loadingMine ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingMine ? (
          <div className="flex items-center justify-center py-12 text-outline">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Đang tải...
          </div>
        ) : mine.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-outline">
            <BookMarked className="w-12 h-12 opacity-30" />
            <p className="font-medium text-sm">Bạn chưa gửi đề xuất nào.</p>
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant/15">
            {mine.map(s => (
              <li key={s.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface text-sm truncate">{s.word}</p>
                  <p className="text-xs text-outline mt-0.5">
                    {s.categoryName} · {new Date(s.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                  {s.description && <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{s.description}</p>}
                </div>
                {s.status === 'REVIEWED' ? (
                  <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-green-500/90 text-white">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã xem
                  </span>
                ) : (
                  <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-700">
                    <Clock className="w-3.5 h-3.5" /> Chờ duyệt
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
