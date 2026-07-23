// UI hien nhan xet tu the tay. Thay cho o "Goi Y Tu AI Coach" hardcode truoc day.
import type { HandFeedback as HandFeedbackData } from '../handAnalysis';

interface Props {
  feedback: HandFeedbackData | null;
  loading: boolean;
}

export default function HandFeedback({ feedback, loading }: Props) {
  // Dang phan tich clip (chay offline sau khi record).
  if (loading) {
    return (
      <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center gap-3">
        <span className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin"></span>
        <p className="text-xs text-on-surface-variant">Đang phân tích tư thế tay của bạn...</p>
      </div>
    );
  }

  // Chua quay lan nao.
  if (!feedback) {
    return (
      <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-start gap-3">
        <span className="material-symbols-outlined text-primary text-2xl shrink-0 mt-0.5">feedback</span>
        <div className="space-y-1">
          <h5 className="font-label-bold text-xs text-on-surface">Nhận xét tư thế tay</h5>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Quay một video luyện tập để nhận nhận xét chi tiết về hình dạng ngón tay, hướng lòng bàn tay và số tay.
          </p>
        </div>
      </div>
    );
  }

  // Co mau nhung khong nhan xet duoc (thieu mau / khong bat duoc tay).
  if (!feedback.available) {
    return (
      <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-start gap-3">
        <span className="material-symbols-outlined text-amber-500 text-2xl shrink-0 mt-0.5">info</span>
        <div className="space-y-1">
          <h5 className="font-label-bold text-xs text-on-surface">Chưa thể nhận xét tư thế tay</h5>
          <p className="text-xs text-on-surface-variant leading-relaxed">{feedback.note}</p>
        </div>
      </div>
    );
  }

  const scoreCls = (s: number) =>
    s >= 75 ? 'bg-green-100 text-green-700' : s >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  const dotCls = (sev: string) =>
    sev === 'good' ? 'bg-green-500' : sev === 'warn' ? 'bg-red-500' : 'bg-amber-500';

  return (
    <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-2xl">back_hand</span>
        <h5 className="font-label-bold text-xs text-on-surface">Nhận xét tư thế tay (từ tọa độ bàn tay)</h5>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border border-outline-variant/30 bg-surface-container-lowest flex justify-between items-center">
          <span className="text-[11px] font-bold text-on-surface">Hình dạng ngón</span>
          <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${scoreCls(feedback.handShapeScore)}`}>
            {feedback.handShapeScore}%
          </span>
        </div>
        <div className="p-3 rounded-lg border border-outline-variant/30 bg-surface-container-lowest flex justify-between items-center">
          <span className="text-[11px] font-bold text-on-surface">Hướng lòng bàn tay</span>
          <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${scoreCls(feedback.palmScore)}`}>
            {feedback.palmScore}%
          </span>
        </div>
      </div>

      <ul className="space-y-1.5">
        {feedback.comments.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-on-surface-variant leading-relaxed">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dotCls(c.severity)}`}></span>
            <span>{c.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
