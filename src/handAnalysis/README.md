# Tầng nhận xét tư thế tay (hand feedback)

Nhận xét chi tiết "tay sai chỗ nào" khi người dùng thực hiện ký hiệu — **độc lập** với
model MViTv2 ở backend (MViTv2 chỉ trả về đúng/sai *từ nào*, không nói được về tay).

## Nguyên lý (không dùng ma trận màu để chấm)

```
clip đã ghi (pixel)
   │  MediaPipe HandLandmarker
   ▼
21 điểm xương/tay có tọa độ (x,y,z)      ← màu bị vứt đi từ đây
   │  features.ts
   ▼
đặc trưng hình học: độ co 5 ngón + hướng lòng bàn tay
   │  compare.ts (so với mẫu)
   ▼
feedbackRules.ts → nhận xét tiếng Việt
```

Mọi phán xét đúng/sai diễn ra trên **hình học của bộ xương tay**, không phải màu sắc.

## Chạy ở đâu

- **OFFLINE, sau khi record xong** (trong `mediaRecorder.onstop`), chạy **song song**
  với việc gửi video lên backend. Không đụng vòng lặp live nên không tăng tải CPU khi
  đang quay (máy yếu vẫn ổn).

## Mẫu tham chiếu lấy từ đâu

`reference.ts` → `loadReference()` ưu tiên:
1. `localStorage` cache (đã dựng trước đó).
2. File precompute `public/references/{classId}.json` (tùy chọn, nếu bạn dựng sẵn hàng loạt).
3. **Dựng ngay trong browser từ `videoUrl` — video mẫu của chính từ đó** (mặc định).

Vì mẫu và clip user đi qua **cùng code** trích landmark + rút đặc trưng → toán học khớp
tuyệt đối, không lo lệch pipeline. Từ nào chưa có mẫu → tự ẩn phần nhận xét (degrade an toàn).

## Các nút tinh chỉnh (trong `constants.ts`)

| Hằng số | Ý nghĩa | Mặc định |
|---------|---------|----------|
| `CURL_TOLERANCE` | Lệch độ co ngón > ngưỡng → báo ngón sai | `0.35` |
| `PALM_ANGLE_TOLERANCE_DEG` | Lệch hướng lòng bàn tay (độ) → báo xoay tay | `35°` |
| `MIN_HAND_SCORE` | Bỏ qua bàn tay có độ tin cậy thấp | `0.5` |
| `SAMPLE_FRAMES` | Số frame lấy mẫu/clip để phân tích | `24` |

Nếu nhận xét **quá gắt** (báo sai với biến thể hợp lệ) → tăng các ngưỡng.
Nếu **quá dễ dãi** (không bắt được lỗi rõ ràng) → giảm ngưỡng.

## Phạm vi hiện tại (MVP)

✅ Số tay (1 hay 2) · Hình dạng ngón (duỗi/co) · Hướng lòng bàn tay

## Mở rộng sau (Phase 2)

- **Vị trí tay so với thân** (dùng thêm pose landmark đã có ở AIPracticeView).
- **Quỹ đạo chuyển động** + **DTW** căn thời gian (xử lý ký nhanh/chậm).
- **Precompute hàng loạt** từ `center_AIGestureVideos/` để bỏ chi phí dựng mẫu lần đầu:
  viết mẫu ra `public/references/{classId}.json` đúng interface `SignReference`.

## Xóa cache mẫu (khi đổi ngưỡng/logic dựng mẫu)

```js
Object.keys(localStorage).filter(k => k.startsWith('handref:')).forEach(k => localStorage.removeItem(k));
```
Hoặc đổi `CACHE_PREFIX` (`handref:v1:` → `handref:v2:`) trong `reference.ts`.

## Yêu cầu tài nguyên

- Model `public/models/mediapipe_hands/hand_landmarker.task` (đã tải, ~7.8MB).
- WASM dùng chung `public/models/mediapipe_hands/wasm` (đã có sẵn từ PoseLandmarker).
