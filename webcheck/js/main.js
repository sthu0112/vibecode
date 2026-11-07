'use strict';
/*
 * WebCheck — trang nhập (Mốc 1, Đề 5)
 * Flow: validate URL → gọi /api/fetch → WebCheck.runChecks phía client →
 * lưu sessionStorage "webcheck:result" → chuyển sang results.html
 */

(function () {
  const API_PATH = '/api/fetch?url=';
  const RESULT_KEY = 'webcheck:result';
  const TIMEOUT_NOTICE = 'có thể mất khoảng 8–15 giây'; // trang + robots/sitemap chạy xong mới nhảy trang

  const form = document.getElementById('f-check');
  const input = document.getElementById('url');
  const button = document.getElementById('btn-go');
  const help = document.getElementById('url-help');
  const statusLine = document.getElementById('status-line');
  const statusText = document.getElementById('status-text');
  const errorBox = document.getElementById('error-box');
  const errorTitle = document.getElementById('error-title');
  const errorDetail = document.getElementById('error-detail');

  let busy = false;

  function showError(title, detail) {
    errorTitle.textContent = title;
    errorDetail.textContent = detail || '';
    errorBox.hidden = false;
    help.hidden = !!detail; // nhường không gian cho giải thích dài
  }

  function clearErrors() {
    errorBox.hidden = true;
    help.hidden = false;
  }

  function setBusy(on, hostLabel) {
    busy = on;
    button.disabled = on;
    button.setAttribute('aria-busy', String(on));
    if (on) {
      statusLine.hidden = false;
      statusText.textContent = hostLabel
        ? `Đang tải ${hostLabel} — ${TIMEOUT_NOTICE}…`
        : `Đang tải — ${TIMEOUT_NOTICE}…`;
    } else {
      statusLine.hidden = true;
    }
  }

  // Trả về chuỗi chuẩn hoá hoặc { error } 
  function normalizeUrl(raw) {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { error: 'Chưa nhập địa chỉ website.' };
    }
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed;
    let parsed;
    try {
      parsed = new URL(withScheme);
    } catch {
      return { error: 'Địa chỉ chưa hợp lệ — ví dụ đúng: atelier-tra.vn hoặc https://atelier-tra.vn' };
    }
    if (!/^https?:$/.test(parsed.protocol)) {
      return { error: 'Chỉ hỗ trợ địa chỉ website http hoặc https.' };
    }
    if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
      return { error: 'Tên miền thiếu phần mở rộng — ví dụ đúng: atelier-tra.vn' };
    }
    return { value: parsed.href };
  }

  function apiError(data, httpStatus) {
    if (data && data.error) {
      return { title: data.error, detail: data.detail || '' };
    }
    return {
      title: 'Máy kiểm tra trả lỗi ' + httpStatus + '.',
      detail: 'Thử lại sau ít phút, hoặc thử một địa chỉ khác.',
    };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    clearErrors();

    const normalized = normalizeUrl(input.value);
    if (normalized.error) {
      input.focus();
      return showError(normalized.error, '');
    }

    setBusy(true, normalized.value.replace(/^https?:\/\//, ''));

    try {
      const res = await fetch(API_PATH + encodeURIComponent(normalized.value), {
        headers: { Accept: 'application/json' },
      });
      let data = null;
      try {
        data = await res.json();
      } catch {
        throw Object.assign(new Error('bad-json'), { handled: apiError(null, res.status) });
      }
      if (!res.ok || data.error) {
        throw Object.assign(new Error('api'), { handled: apiError(data, res.status) });
      }

      // SITE-LEVEL: lấy robots.txt + sitemap.xml qua cùng proxy (chế độ ?soft=1:
      // lỗi 404 của trang gốc trả về 200 kèm statusCode → client phân biệt
      // "chưa có tệp" với "mạng lỗi" một cách rõ ràng).
      let robots = null;
      let sitemap = null;
      try {
        const originBase = new URL(data.finalUrl || normalized.value).origin;
        const softFetch = (path) =>
          fetch(API_PATH + encodeURIComponent(originBase + path) + '&soft=1', {
            headers: { Accept: 'application/json' },
          })
            .then((r) => r.json())
            .then((d) => (d && !d.error ? { statusCode: d.statusCode, text: d.html || '' } : null))
            .catch(() => null);
        [robots, sitemap] = await Promise.all([
          softFetch('/robots.txt'),
          softFetch('/sitemap.xml'),
        ]);
      } catch {
        robots = null;
        sitemap = null;
      }

      const result = WebCheck.runChecks(data.html, {
        inputUrl: normalized.value,
        finalUrl: data.finalUrl || normalized.value,
        statusCode: data.statusCode,
        elapsedMs: data.elapsedMs,
        robots,
        sitemap,
      });
      sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
      window.location.assign('results.html');
    } catch (err) {
      if (err && err.handled) {
        showError(err.handled.title, err.handled.detail);
      } else if (err instanceof ReferenceError) {
        showError('Bộ máy phân tích chưa nạp xong.', 'Tải lại trang (Ctrl+R) rồi thử lại.');
      } else {
        showError('Không kết nối được máy kiểm tra.',
          'Kiểm tra kết nối mạng rồi thử lại. Nếu đang chạy trên máy (chưa deploy), cần khởi động bằng lệnh: npx vercel dev để API hoạt động.');
      }
      setBusy(false);
    }
  });
})();
