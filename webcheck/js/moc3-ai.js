'use strict';
/* MỘC 3 — Nhận xét AI (khung sẵn của mốc 1, để bạn phụ trách mốc 3 "vibecode" tiếp)
 * --------------------------------------------------------------------------------------------
 * File này KHÔNG phải code cuối của mốc 3 — nó là bệ đứng:
 *   1. Đọc Result v1.2 (sessionStorage["webcheck:result"], hoặc demo results.html?demo=1).
 *   2. Render khối nhận xét vào #ai-slot theo shape:
 *        { summary, strengths[3], improvements[3] }   — spec đầy đủ: contract.md mục 8.
 *   3. Đang hiển thị "bản dự phóng" (rule từ 22 mục) — KHÔNG cần AI, không cần key.
 *
 * Việc của bạn mốc 3 — 2 chổ đánh dấu "VIỆC CỦA MỘC 3" bên dưới:
 *   1. hàm layNhanXet() — cắm lời gọi AI thật (hướng A trực tiếp / B qua api/ai.mjs, so sánh ở contract.md mục 8);
 *   2. dòng chú thích trong render() — đổi chữ khi đã cắm AI thật.
 * Bản dự phóng ở hàm duPhongNhanXet là fallback bắt buộc giữ nguyên (mạng fail/hết hạn mức…).
 */
(function () {
  const SLOT = document.getElementById('ai-slot');
  if (!SLOT) return;

  // docKetQua(): nạp ?demo=1 hoặc sessionStorage — shape sai/hỏng trả null (xem analyze.js).
  const result = window.WebCheck.docKetQua();
  if (!result) return; // slot trống → tự ẩn

  /* ── Bản dự phóng (fallback): sinh nhận xét từ chính 22 mục bằng rule ───────
     Mảng được phép <3 phần tử (render đón trước); ràn buộc "đúng 3 phần tử,
     ≤160 ký tự" của hợp đồng áp cho lời gọi AI thật trong layNhanXet. */

  function duPhongNhanXet(res) {
    const c = res.checks;
    const so = (lv) => c.filter((x) => x.level === lv);
    const pass = so('pass'), warn = so('warn'), fail = so('fail');
    const theoTrongSo = (a, b) => b.weight - a.weight;

    const strengths = pass.slice().sort(theoTrongSo).slice(0, 3).map((x) => x.label);
    const improvements = fail.concat(warn).sort(theoTrongSo).slice(0, 3)
      .map((x) => `${x.label}: ${x.suggestion}`);

    let summary;
    if (fail.length) {
      summary = `Trang có ${fail.length} mục chưa đạt và ${warn.length} cảnh báo. Ưu tiên sửa 3 việc bên dưới trước.`;
    } else if (warn.length) {
      summary = `Trang đạt ${pass.length}/${c.length} mục — còn ${warn.length} điểm nên siết thêm. Chọn 1 trong 3 việc bên dưới là thấy khác ngay.`;
    } else {
      summary = `Trang đạt trọn ${pass.length}/${c.length} mục — nền móng ổn, chưa có việc cấp bách nào.`;
    }

    return { summary, strengths: strengths.length ? strengths : ['Chưa có mục nào đạt rõ ràng'], improvements };
  }

  /* ⬇⬇ VIỆC CỦA MỘC 3 (1/2): thay hàm này bằng lời gọi AI thật — hợp đồng mục 8 ┐
   *  Hướng A: fetch thẳng Gemini (key trong file — chỉ demo nội bộ).            │
   *  Hướng B: fetch('/api/ai', …) — bạn tự tạo api/ai.mjs, key ở Vercel env.    ┘
   *  Yêu cầu bắt buộc: đúng shape duPhongNhanXet trả; lỗi → THROW để rơi fallback. */
  async function layNhanXet(res) {
    // TODO MỘC 3: cắm prompt ở contract.md mục 8 + result.checks map gọn (label/level/suggestion).
    // Ví dụ hướng B (soạn sẵn — bỏ comment khi api/ai.mjs sẵn sàng):
    //
    // const r = await fetch('/api/ai', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     checks: res.checks.map((x) => ({ label: x.label, level: x.level, suggestion: x.suggestion })),
    //     title: res.title,
    //   }),
    // });
    // const nx = await r.json();
    // if (!r.ok || !nx.summary) throw new Error('AI trả không đúng shape');
    // return nx;

    throw new Error('MỘC 3: chưa cắm AI — dùng bản dự phóng'); // ← xoá dòng này khi cắm AI thật
  }

  /* ── Render (không cần sửa nếu bạn theo đúng shape ở trên) ─────────────────┘ */

  function render(nx) {
    const owner = SLOT.ownerDocument || document;
    const box = owner.createElement('aside');
    box.className = 'ai-note moc3-ai';

    const h = owner.createElement('h3');
    h.textContent = 'AI nhận xét';
    box.appendChild(h);

    const sum = owner.createElement('p');
    sum.className = 'ai-note-summary';
    sum.textContent = nx.summary;
    box.appendChild(sum);

    const dua = (tieuDeNhom, items, cls) => {
      if (!items || !items.length) return;
      const t = owner.createElement('p');
      t.className = 'ai-note-sub ' + cls;
      t.textContent = tieuDeNhom;
      box.appendChild(t);
      const ul = owner.createElement('ul');
      for (const item of items) {
        const li = owner.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      }
      box.appendChild(ul);
    };
    dua('Điểm mạnh', nx.strengths, 'ai-note-pos');
    dua('Việc nên làm đầu tiên', nx.improvements, 'ai-note-fix');

    const foot = owner.createElement('p');
    foot.className = 'ai-note-foot';
    /* VIỆC CỦA MỘC 3 (2/2): khi đã cắm AI thật → đổi dòng dưới thành
       "Nhận xét do AI tạo từ dữ liệu checklist." */
    foot.textContent = 'Bản dự phóng: sinh trực tiếp từ dữ liệu 22 mục — chưa qua AI.';
    box.appendChild(foot);

    SLOT.textContent = '';
    SLOT.appendChild(box);
  }

  // Luồng: đợi khung "đang soạn…" → gọi layNhanXet → lỗi thì rơi dự phóng.
  SLOT.textContent = '';
  const waiting = SLOT.ownerDocument || document;
  const waitP = waiting.createElement('p');
  waitP.className = 'ai-note ai-note-wait';
  waitP.textContent = 'Đang soạn nhận xét…';
  SLOT.appendChild(waitP);

  layNhanXet(result)
    .then((nx) => render(nx))
    .catch((err) => {
      console.warn('[moc3] AI hỏng → hiển thị bản dự phóng:', err && err.message);
      try {
        render(duPhongNhanXet(result));
      } catch {
        SLOT.textContent = ''; // hỏng cả dự phóng → bỏ trống, đừng lỗi trắng trang kết quả
      }
    });
})();
