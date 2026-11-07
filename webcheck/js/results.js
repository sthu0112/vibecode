'use strict';
/*
 * WebCheck — trang kết quả (Mốc 1, Đề 5)
 * Đọc Result qua WebCheck.docKetQua() (?demo=1 → Result mẫu, ngược lại sessionStorage)
 * rồi dựng: phần tóm tắt + checklist tạm (WebCheck.renderChecklist) + các slot trống
 * chờ mốc 2 (điểm), 3 (AI), 4 (xuất báo cáo), 5 (lịch sử).
 * Nếu mở trực tiếp results.html?demo=1 → dùng Result mẫu (không cần mạng),
 * các mốc dựng phần của mình dựa trên dữ liệu này được ngay.
 */

(function () {
  const summary = document.getElementById('summary');
  const empty = document.getElementById('empty');

  const result = WebCheck.docKetQua();
  if (!result) {
    empty.hidden = false;
    return;
  }

  summary.hidden = false;

  let host = result.finalUrl || result.url || '';
  try {
    host = new URL(result.finalUrl || result.url).hostname;
  } catch {
    /* giữ nguyên chuỗi gốc nếu không parse được */
  }
  document.title = 'Kiểm tra ' + host + ' — WebCheck';

  document.getElementById('site-title').textContent = (result.title || '').trim() || host;

  // Hàng thông tin: địa chỉ gốc, thời điểm, thời gian tải, mã HTTP.
  const metaItems = [];
  const fullUrl = result.finalUrl || result.url;
  if (fullUrl) {
    metaItems.push({ text: fullUrl, mono: true });
  }
  if (result.fetchedAt) {
    const d = new Date(result.fetchedAt);
    if (!Number.isNaN(d.getTime())) {
      metaItems.push({ text: 'Kiểm tra lúc ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) });
    }
  }
  if (result.elapsedMs != null) {
    const s = (result.elapsedMs / 1000).toFixed(1).replace('.', ',');
    metaItems.push({ text: 'Tải trong ' + s + ' giây' });
  }
  if (result.statusCode != null) {
    metaItems.push({ text: 'HTTP ' + result.statusCode });
  }

  const metaLine = document.getElementById('meta-line');
  for (const item of metaItems) {
    const li = document.createElement('li');
    if (item.mono) li.className = 'mono';
    li.textContent = item.text;
    metaLine.appendChild(li);
  }

  if (result.statusCode != null && result.statusCode >= 400) {
    const notice = document.getElementById('notice');
    notice.textContent =
      'Trang trả về mã HTTP ' + result.statusCode +
      ' — nội dung kiểm tra dưới đây có thể không trọn vẹn kết quả như trang hoạt động bình thường.';
    notice.hidden = false;
  }

  WebCheck.renderChecklist(result, document.getElementById('checklist'));
})();
