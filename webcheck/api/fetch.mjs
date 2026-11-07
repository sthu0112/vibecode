'use strict';
/*
 * WebCheck — cầu nối HTML (Mốc 1, Đề 5)
 * ---------------------------------------------------------------
 * Serverless function chạy trên Vercel (Node 20+). Việc duy nhất:
 * nhận ?url=… → fetch HTML thô → trả về cho trình duyệt.
 *
 * KHÔNG phân tích gì ở đây: toàn bộ logic kiểm tra nằm ở js/analyze.js
 * chạy phía client (đúng chữ "phía client" của đề).
 *
 * Hợp đồng API:
 *   GET /api/fetch?url=<encoded>
 *   → 200 { html, statusCode, finalUrl, elapsedMs }
 *   → lỗi { error: "...tiếng Việt...", detail: "...giải thích thêm..." }
 *
 * Chế độ phụ ?soft=1 (dùng riêng cho robots.txt / sitemap.xml):
 *   - lỗi HTTP của trang gốc (404…) → coi như kết quả: 200 { statusCode: 404, html: '' }
 *   - không lọc content-type (robots.txt là text/plain, sitemap là XML)
 *   các luồng phân tích trang chính không dùng flag này — hành vi giữ nguyên.
 * KHÔNG sửa file này ở các mốc sau (độc quyền của mốc 1).
 */

const MAX_HTML_BYTES = 2 * 1024 * 1024; // 2 MB
const TIMEOUT_MS = 8000;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
};

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function fail(res, status, error, detail) {
  send(res, status, { error, detail: detail || '' });
}

function statusHint(status) {
  if (status === 404) return 'Trang không còn tồn tại — kiểm tra lại địa chỉ, hoặc chủ trang đã xoá/gỡ nó.';
  if (status === 401 || status === 403) return 'Trang từ chối truy cập tự động (tường lửa chống bot). Công cụ không đọc được nội dung trang này.';
  if (status === 429) return 'Trang đang giới hạn số lượng truy cập — thử lại sau vài phút.';
  if (status >= 500) return 'Máy chủ của website đang gặp sự cố — thử lại sau.';
  return 'Trang không trả về nội dung dùng được.';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return fail(res, 405, 'Chỉ nhận yêu cầu GET.');
  }

  const params = new URL(req.url, 'http://internal');
  const raw = params.searchParams.get('url');
  const isSoft = params.searchParams.get('soft') === '1'; // chế độ phụ cho robots.txt/sitemap.xml
  if (!raw) {
    return fail(res, 400, 'Thiếu địa chỉ trang cần kiểm tra.',
      'Dùng đúng dạng: GET /api/fetch?url=https%3A%2F%2Ften-mien.vn');
  }

  let target;
  try {
    target = new URL(raw);
  } catch {
    return fail(res, 400, 'Địa chỉ chưa hợp lệ.', `Nhận được: "${raw.slice(0, 200)}"`);
  }
  if (!/^https?:$/.test(target.protocol)) {
    return fail(res, 400, 'Chỉ hỗ trợ địa chỉ http hoặc https.');
  }

  const started = Date.now();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);

  try {
    const r = await fetch(target.href, {
      headers: HEADERS,
      redirect: 'follow',
      signal: ac.signal,
    });

    if (!r.ok) {
      if (isSoft) {
        // Với robots/sitemap, lỗi HTTP của trang gốc là DỮ LIỆU (404 = chưa có tệp).
        return send(res, 200, {
          html: '',
          statusCode: r.status,
          finalUrl: r.url,
          elapsedMs: Date.now() - started,
        });
      }
      return fail(res, 502, `Trang trả về lỗi HTTP ${r.status}.`, statusHint(r.status));
    }

    const contentType = r.headers.get('content-type') || '';
    if (!isSoft && !/text\/html|application\/xhtml/i.test(contentType)) {
      return fail(res, 415, 'Địa chỉ này không trả về một trang web HTML.',
        `Nội dung nhận được là: ${contentType || 'không rõ loại'}.`);
    }

    // Đọc giới hạn để không nuốt cả máy chủ.
    const reader = r.body.getReader();
    const chunks = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_HTML_BYTES) {
        await reader.cancel();
        return fail(res, 413,
          'HTML của trang quá lớn (trên 2 MB) — không đọc để tránh treo máy khách.',
          'Thường gặp ở trang xuất toàn bộ kho dữ liệu ra một trang. Cần tối ưu lại trang gốc.');
      }
      chunks.push(Buffer.from(value));
    }

    const html = Buffer.concat(chunks).toString('utf-8');
    return send(res, 200, {
      html,
      statusCode: r.status,
      finalUrl: r.url,
      elapsedMs: Date.now() - started,
    });
  } catch (err) {
    if (err && err.name === 'AbortError') {
      return fail(res, 504,
        `Hết thời gian chờ (${TIMEOUT_MS / 1000} giây) — trang không phản hồi.`,
        'Trang quá chậm, hoặc đang chặn truy cập tự động.');
    }
    const code = err && err.cause && err.cause.code;
    if (code === 'ENOTFOUND') {
      return fail(res, 502, 'Không tìm thấy máy chủ — tên miền có thể sai chính tả hoặc đã hết hạn. Kiểm tra lại chính tả địa chỉ.');
    }
    if (code === 'ECONNREFUSED') {
      return fail(res, 502, 'Máy chủ từ chối kết nối — website có thể đã ngừng hoạt động.');
    }
    return fail(res, 502, 'Không kết nối được trang web này.',
      'Lỗi mạng hoặc trang chặn truy cập tự động. Thử lại, hoặc thử một địa chỉ khác.');
  } finally {
    clearTimeout(timer);
  }
}
