# WebCheck — hợp đồng ghép code (bản cho mốc 2, 3, 4, 5)

Tài liệu này chốt cách các mốc cắm vào phần Mốc 1. Quy ước của nhóm là **làm riêng rồi ghép**,
nên mọi thứ các bạn cần đều nằm ở đây — đọc kỹ trước khi viết code để không phải chỉnh sau.

---

## 1. Cách lấy kết quả (con đường duy nhất)

Mốc 1 chạy kiểm tra xong sẽ **lưu object Result vào `sessionStorage["webcheck:result"]`** rồi
tự chuyển sang trang `results.html`. Các mốc **chỉ cần đọc key này**, không gọi lại API, không
parse lại HTML:

```js
const result = JSON.parse(sessionStorage.getItem('webcheck:result'));
```

Lưu ý: sessionStorage sống theo tab/phien — đóng tab là mất (đúng ý chuyền trang; lịch sử lâu dài là việc của mốc 5, tự lưu vào localStorage riêng).

**Muốn có Result ngay không cần mạng?** Mở `results.html?demo=1` — một Result hoàn chỉnh cho
one quán cà phê Đà Lạt mẫu (có cả warn/fail đủ điều) sẽ dựng sẵn trên trang.

## 2. Shape Result v1.2

```js
{
  version: '1.2',
  url: 'quan-moc-da-lat.vn',           // người dùng nhập
  finalUrl: 'https://quan-moc-da-lat.vn/', // sau redirects
  statusCode: 200,
  elapsedMs: 1240,                      // thời gian tải HTML
  fetchedAt: '2026-11-07T02:15:30.000Z',
  title: 'Quán cà phê Mộc — Đà Lạt',   // chuỗi title (nếu có) — tiện cho nhận xét
  checks: [
    {
      id: 'title',                       // 1 trong 22 id ở mục 3
      label: 'Tiêu đề trang (<title>)',  // tiếng Việt, sẵn để hiển thị
      group: 'SEO & hiển thị',
      weight: 10,                        // GỢI Ý; mốc 2 được tự định lại trọng số
      level: 'pass',                     // 'pass' | 'warn' | 'fail' | 'unknown'
      passed: true,                      // true chỉ khi level==='pass'; warn/fail=false; unknown=null
      detail: 'Thẻ <title> chỉ 24 ký tự — ngắn hơn khuyến nghị (30–60).',
      suggestion: 'Viết lại tiêu đề 30–60 ký tự: nêu mặt hàng chính…',
    }
    // … 22 mục
  ],
}
```

Nghĩa của từng mức (mốc 3 (AI) nên phản chiếu đúng sắc thái này):
- `pass` — đạt chuẩn.
- `warn` — **có nhưng chưa chuẩn** (ví dụ title 24 ký tự). Đây là sự tinh tế quan trọng: coi như đạt một phần khi tính điểm, nhắc riêng khi nhận xét.
- `fail` — thiếu hoặc sai rõ ràng.
- `unknown` — không xác định được (trang trả lỗi). Với `robots_txt`/`sitemap`, unknown = không fetch được
  tệp (lỗi mạng / site chặn), không phải lỗi cấu hình của website. Mốc 2 cân nhắc: xử lý như 0
  điểm hoặc loại khỏi tổng.

## 3. 22 hạng mục

**SEO & hiển thị** (37)
| id | Mục | Weight |
|---|---|---|
| title | Tiêu đề trang (`<title>`) | 8 |
| meta_description | Mô tả tìm kiếm (meta description) | 8 |
| open_graph | Chia sẻ mạng xã hội (Open Graph) | 3 |
| canonical | Địa chỉ chuẩn (canonical) | 4 |
| robots_meta | Chỉ dẫn công cụ tìm kiếm (robots) | 4 |
| robots_txt | Tệp robots.txt (chỉ dẫn quét toàn site) | 3 |
| sitemap | Sơ đồ trang (sitemap.xml) | 3 |
| structured_data | Dữ liệu có cấu trúc (JSON-LD) | 4 |

**Chuẩn kỹ thuật** (33)
| id | Mục | Weight |
|---|---|---|
| https | Kết nối bảo mật (HTTPS) | 7 |
| lang | Định nghĩa ngôn ngữ (lang) | 4 |
| charset | Bảng mã ký tự (charset) | 4 |
| h1 | Tiêu đề chính (h1) | 7 |
| heading_system | Hệ thống đề mục (h2–h6) | 4 |
| links | Liên kết (link) | 3 |
| analytics | Đo lường truy cập (Analytics) | 4 |

**Di động & hình ảnh** (26)
| id | Mục | Weight |
|---|---|---|
| viewport | Hiển thị trên di động (viewport) | 9 |
| img_alt | Mô tả ảnh (alt) | 7 |
| favicon | Biểu tượng tab (favicon) | 4 |
| theme_color | Màu giao diện (theme-color) | 2 |
| lazy_load | Tải ảnh trễ (lazy loading) | 4 |

**Tốc độ tải nội dung**
| id | Mục | Weight |
|---|---|---|
| resources | Số lượng tài nguyên (JS/CSS) | 2 |
| page_weight | Dung lượng HTML | 2 |

Tổng weight = 100.

## 4. Vị trí cắm trên results.html

| Mốc | Slot id | Nhiệm vụ |
|---|---|---|
| 2 | `#score-slot` | Điểm /100 + tổng hợp theo nhóm |
| 3 | `#ai-slot` | Nhận xét AI — **khung `js/moc3-ai.js` + thẻ script đã cắm sẵn**, chỉ đụng 2 chổ đánh dấu "VIỆC CỦA MỘC 3"; spec đầy đủ ở mục 8 |
| 4 | `#export-slot` | Nút xuất báo cáo text (copy gửi khách) — nên dựng từ Result để không phụ thuộc mốc 3; nếu muốn lồng phần AI thì đọc DOM `#ai-slot` khi có |
| 5 | `#history-slot` | Lịch sử các lần kiểm tra (localStorage do mốc 5 tự quản, key riêng) |

Slot trống tự ẩn (CSS `:empty { display:none }`). Các mốc còn lại làm đúng động tác cũ:
thêm file `js/<ten-moc>.js` của mình và **1 dòng** `<script defer src="js/&lt;ten-moc&gt;.js">` cuối `results.html`
(mốc 3 là ngoại lệ duy nhất — khung đã cắm sẵn như trên).

## 5. Cái người khác có sẵn

- `window.WebCheck` (từ `js/analyze.js`):
  - `runChecks(html, meta, buildDoc)` — chạy lại bộ phân tích (hiếm khi cần; main.js đã làm).
  - `renderChecklist(result, mount)` — checklist tạm của mốc 1; mốc 2 thay phần này bằng bảng chấm điểm đẹp (chỉ cần đổi nội dung bên dưới `#score-slot`, có thể dùng `#checklist` lại hoặc dựng riêng DOM của mình).
  - `demoResult(buildDoc)` — Result mẫu.
  - `docKetQua()` — nạp Result giúp bạn: `?demo=1` → Result mẫu, ngược lại đọc `sessionStorage["webcheck:result"]`; trả `null` khi hỏng/shape sai. **Mốc 2–5 nên dùng hàm này thay tự đọc sessionStorage.**
- `styles.css` có sẵn biến màu 4 mức: `--pass/--warn/--fail/--unknown` + nền `*-bg` — dùng trùng để cả trang một giọng.

## 6. Quy tắc giữ cho ghép không đau

1. Mốc 1 độc quyền: `js/analyze.js`, `js/main.js`, `js/results.js`, `api/fetch.mjs`, `tests/`.
   Mốc 3 độc quyền: `js/moc3-ai.js` (+ `api/ai.mjs` nếu tự tạo proxy).
   Cần thêm hàm gì thì trao đổi — đừng sửa trực tiếp file của người khác.
2. Các mốc **chỉ đụng slot của mình** (đặt trong `results.html`, comment đánh dấu sẵn) và file JS riêng.
3. Đọc kết quả duy nhất từ `sessionStorage["webcheck:result"]` — không tự gọi lại `/api/fetch`.
4. Không thêm thư viện mới mà không thống nhất cả nhóm (hiện frontend không có dependency — cây thư mục nhẹ, deploy nhanh).
5. Đặt tên biến/hàm tiếng Việt hoặc tiếng Anh đều được, nhưng **nội dung hiển thị người dùng phải tiếng Việt**.

## 7. Chi tiết API (khi cần hiểu sâu — không dùng)

`GET /api/fetch?url=<encoded>` chỉ kéo HTML thô về cho trình duyệt (tránh CORS và bị chặn):
- 200 → `{ html, statusCode, finalUrl, elapsedMs }`
- lỗi → `{ error, detail }` (thông báo tiếng Việt thân thiện: hết giờ, 404, bị chặn, không phải HTML, quá lớn…)

Có thêm chế độ phụ `&soft=1` — riêng mốc 1 dùng để lấy robots.txt/sitemap.xml (lỗi 404 của
trang gốc trả về 200 kèm `statusCode` thay vì báo lỗi). Các mốc 2–5 không cần biết flag này.

## 8. Mốc 3 — Nhận xét AI (spec + khung sẵn, dùng để vibecode tiếp)

Khung **hoạt động được ngay**: `js/moc3-ai.js` (thẻ `<script defer>` đã cắm vào `results.html`).
Bạn mốc 3 chỉ đụng **2 chổ đánh dấu `VIỆC CỦA MỘC 3`** trong file: (1) hàm `layNhanXet(result)` —
cắm lời gọi AI thật; (2) một dòng chú thích trong `render()` khi đã cắm AI thật. Phần đọc dữ liệu
(dùng `WebCheck.docKetQua()`), render, báo lỗi và fallback đã dựng xong. Chưa cắm AI thì khung
demo được bằng "bản dự phóng" (rule-heuristic) nên cả nhóm không bị kẹt demo.

**Input** (khung đã lấy sẵn): object Result v1.2 — hữu dụng nhất là `result.title` và
`result.checks[]` (mỗi mục: `label` tiếng Việt, `level` pass/warn/fail/unknown, `detail`,
`suggestion`). Muốn feed gọn cho AI: chỉ gửi mảng `{ label, level, suggestion }` của 22 mục (~1,5 KB).

**Output bắt buộc** (render khung chờ đúng shape này):

```js
{
  summary: '1 câu tóm tắt tình trạng trang',
  strengths: ['điểm mạnh 1', 'điểm mạnh 2', 'điểm mạnh 3'],
  improvements: ['việc cần làm 1', 'việc cần làm 2', 'việc cần làm 3'],
}
// đúng 3 phần tử mỗi mảng, mỗi câu ≤ 160 ký tự, tiếng Việt
// (lưu ý: ràn buộc "đúng 3 phần tử" áp cho lời gọi AI thật; bản dự phóng fallback
// được phép trả ít hơn — render đã đón cả mảng <3)
```

**Ba cách làm AI — chọn 1 làm đường chính:**

| Cách | Cụ thể | Khi nào dùng |
|---|---|---|
| A. Key nằm trong trình duyệt | `fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=API_KEY', …)` gọi thẳng từ `layNhanXet()` | Nhanh nhất, không cần thêm file. Key bị lộ trong code public → chỉ hợp demo nội bộ |
| B. Proxy serverless (khuyên dùng) | Tạo `api/ai.mjs` kiểu giống `api/fetch.mjs`: nhận POST từ `layNhanXet()` → gọi Gemini/Groq bằng key lấy từ biến môi trường → trả lại JSON đã rút gọn | Key nằm trong Vercel Environment Variables → không lộ, link live dùng được cho mọi người |
| C. Không gọi AI | Bản "dự phóng" đang có sẵn trong khung (sinh lời nhận xét từ rule trên 22 mục) | Mặc định fallback khi A/B hỏng — **giữ nguyên, đừng xoá** |

**Key miễn phí + model:** Google AI Studio (aistudio.google.com) — tạo key Gemini không phí;
Groq cũng có free tier. Quán: `gemini-2.5-flash` (nhanh, hiểu tiếng Việt tốt, đủ cho việc này).
Key vào Vercel: Settings → Environment Variables (hoặc `vercel env add GEMINI_API_KEY`); chạy local
bằng `vercel dev` đọc `.env.local`.

**Prompt mẫu dán cho model** (soạn trong `layNhanXet()`):

```
Bạn là cố vấn SEO bằng tiếng Việt cho chủ doanh nghiệp nhỏ. Trả về DUY NHẤT một JSON hợp lệ,
không giải thích, theo dạng {"summary": "…", "strengths": ["…","…","…"], "improvements": ["…","…","…"]}.
Mỗi chuỗi ≤ 160 ký tự, giọng thân thiện, dựa CHỈ vào dữ liệu bên dưới, không bịa con số.
Dữ liệu 22 hạng mục: <JSON checks[]>
```

**Chống lỗi format:** dùng responseMimeType JSON của Gemini (hoặc thêm "chỉ trả JSON" vào prompt),
`JSON.parse` trong try/catch — hỏng thì ném lỗi để khung rơi về bản dự phóng (C).

**Chưa có key kiểm thử:** mở `results.html?demo=1` — khung tự chạy bản dự phóng.

## 9. Lịch sử hợp đồng

- **v1.1** (mốc 1 ban đầu) — 19 mục.
- **v1.2** (hiện tại) — thêm 3 mục: `robots_txt`, `sitemap` (nhóm SEO & hiển thị) và `links`
  (nhóm Chuẩn kỹ thuật). Cân chỉnh lại weight để tổng vẫn = 100: title 10→8, meta_description
  10→8, open_graph 4→3, https 8→7, h1 8→7, viewport 10→9, img_alt 8→7; 3 mục mới mỗi mục 3.
  Nếu mốc 2 đã tự định trọng số riêng thì cứ dùng — weight chỉ là gợi ý; nhưng **danh sách 22 id
  ở mục 3 là bắt buộc** (rendering và xử lý `unknown` phải đúng cho cả 3 mục mới).
  Dữ liệu robots/sitemap do mốc 1 fetch sẵn vào `meta` — mốc 2–5 chỉ đọc `checks[]` như cũ.
- **v1.2 — tinh chỉnh sau review (cùng bản)**: robots.txt/sitemap chỉ trả `warn` ("chưa có tệp")
  khi HTTP **404**; 403/5xx → `unknown` (site chặn bot / server sự cố — đúng định nghĩa mục 2,
  đừng kết luận nhầm). Thêm `WebCheck.docKetQua()` (mục 5) — mốc 2–5 dùng nạp Result; spinner
  trang nhập (plan yêu cầu, giờ CSS thật sự sử dụng).
- **v1.2.1** — hai vá nhỏ phát hiện khi soi độ sâu (số test vẫn 22, shape không đổi):
  `links` không trừ oan link icon có chữ cho trợ năng (`aria-label`/`title`);
  chi tiết sitemap nêu đích danh dạng `sitemapindex` (đếm theo nhóm — VnExpress thật:
  sitemap.xml là nhóm dẫn tới 9455 sơ đồ con, không phải 9455 trang).
