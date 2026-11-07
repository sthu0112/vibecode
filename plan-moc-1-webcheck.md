# Kế hoạch Mốc 1 — WebCheck (Đề 5) — hoàn thành + đã deploy
**Chức năng số 1: nhập URL → kiểm tra tự động các yếu tố cơ bản phía client**

| Hạng mục | Giá trị |
|---|---|
| **Link live** | https://webcheck-eta.vercel.app (alias production ổn định — không đổi theo lần deploy; deployment-hash: webcheck-gulv6skmo-tqbaoan2k11-8641.vercel.app) |
| Repo | https://github.com/TrinhQuangBaoAn-2011/vibecoding — `webcheck/` là thư mục con; mốc 2–5 đặt thư mục kế bên |
| Scope | Đúng chức năng số 1. Mốc 2 (điểm) · 3 (AI) · 4 (xuất báo cáo) · 5 (lịch sử) — bạn bè |
| Stack | Vanilla HTML/CSS/JS + Vercel serverless Node (`api/fetch.mjs`, 0 dependency) |
| Đã kiểm tra | `npm test` 22/22 (v1.2) · E2E Chrome thật qua Internet (nhập `vnexpress.net` không scheme → checklist 22 mục thật) · API live: VnExpress 200 / domain chết 502 tiếng Việt · chế độ `?soft=1` cho robots/sitemap · trang demo chạy |

---

## 1. Đã chốt thiết kế (khác so với bản kế hoạch gốc)

| Quyết định | Bản gốc | Đã chốt sau hỏi thêm |
|---|---|---|
| Số mục check | 11 | **22** (19 mục "mở rộng lớn" — bạn chọn; rồi nâng v1.2 thêm robots.txt, sitemap, liên kết) |
| Mức đánh giá | 3 trạng thái | **4 mức: Đạt / Cảnh báo / Chưa đạt / ?** — field `level` + giữ `passed` cho mốc 2 |
| Gợi ý sửa | Trách mốc AI | **Field `suggestion` riêng** (1 câu tiếng Việt cho từng nhánh) — tách khỏi `detail` |
| Giọng văn | — | **Việt dễ hiểu + thuật ngữ trong ngoặc** |
| Backend | Express+Render | **Vercel serverless** (bạn chọn A — không cold start) |

## 2. Kiến trúc đã dựng

```
Trình duyệt
  index.html (nhập URL, tự thêm https://, spinner, thông báo lỗi tiếng Việt)
    → GET /api/fetch?url=… (serverless, chỉ kéo HTML thô: UA trình duyệt, redirect, timeout 8s,
      cap 2 MB, không nhận non-HTML, đều trả {error,detail} tiếng Việt;
      cờ ?soft=1 riêng để lấy robots.txt/sitemap.xml — 404 trả về như dữ liệu)
  js/analyze.js — TRÁI TIM, chạy phía client (đúng chữ "phía client" trong đề):
    runChecks(html, meta, buildDoc) → Result v1.2
  results.html — tóm tắt (title site, URL mono, thời điểm, thời gian tải, HTTP code)
    + checklist theo 4 nhóm + 4 slot trống chờ mốc 2–5 (comment đánh dấu sẵn)
Result lưu: sessionStorage["webcheck:result"] → mốc 2,3,4 đọc; mốc 5 tự lưu localStorage
Result mẫu không cần mạng: results.html?demo=1 (quán cà phê Mộc — Đà Lạt, nhiều warn thực tế)
```

## 3. Bộ 19 mục (weight = 100, `level` ∈ pass/warn/fail/unknown)

**SEO & hiển thị (36)**: title 10 (30–60 ký tự) · meta_description 10 (70–160) · open_graph 4 (og:title+og:image) · canonical 4 · robots_meta 4 (noindex=fail) · structured_data 4 (JSON-LD, parse hợp lệ)
**Chuẩn kỹ thuật (32)**: https 8 · lang 4 · charset 4 (UTF-8) · h1 8 (đúng 1) · heading_system 4 (nhảy bậc h2→h4 = warn) · analytics 4 (GTM/GA4/Pixel/Matomo…)
**Di động & hình ảnh (28)**: viewport 10 (width=device-width) · img_alt 8 (0 ảnh thiếu; thiếu một phần=warn; thíu hết=fail) · favicon 4 · theme_color 2 · lazy_load 4 (≥5 ảnh mà 0 lazy=warn)
**Tốc độ tải nội dung (4)**: resources 2 (>8 file JS/CSS=warn) · page_weight 2 (>400 KB=fail, >100 KB=warn)

## 4. Việc còn lại — tự làm (10 phút)

1. Tạo repo GitHub (khuyên đặt tên `webcheck`) → `git remote add origin <link> && git push -u origin main`.
2. Vercel → Add New → Project → Import repo (không phải cấu hình gì; `api/` tự nhận serverless).
3. Mở link live: thử 3 kiểu địa chỉ — site tốt, site http, domain chết (kỳ vọng: checklist / kết quả lỗi thân thiện).
4. Gửi link + `contract.md` cho 3 bạn (ai cũng tự mở `results.html?demo=1` để dựng phần mình khi chưa có mạng).

## 5. Hợp đồng cho mốc 2–5 (chi tiết đầy đủ trong `webcheck/contract.md`)

- Đọc kết quả duy nhất qua `sessionStorage["webcheck:result"]` (Result shape v1.2: 22 mục — `level` + `suggestion` mỗi mục; `passed` giữ nguyên tương thích).
- Slot cắm trên results.html: `#score-slot` (mốc 2) · `#ai-slot` (mốc 3) · `#export-slot` (mốc 4) · `#history-slot` (mốc 5).
- Mỗi mốc thêm file `js/<moc>.js` + 1 thẻ script defer; không đụng `analyze.js`/`main.js`/`api/fetch.mjs` (độc quyền mốc 1).
- Không thêm thư viện khi chưa cả nhóm đồng ý (frontend hiện 0 dependency).

## 6. Giới hạn khai thật khi demo (chép vào slide)

1. Chỉ soi **HTML tĩnh** — site SPA (nội dung dệt bằng JS) chỉ đo được phần khai báo meta ban đầu.
2. Site chặn bot (tường lửa) → thông báo lỗi rõ ràng, không treo (đã test với domain chết: trả 502 + thông điệp tiếng Việt).
3. Điểm /100 chưa có — thuộc mốc 2 (`weight` là gợi ý đã đặt sẵn tổng = 100).
