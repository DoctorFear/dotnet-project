import type { PackingItemDetail, PackingDetail } from '../../../types/workflow';

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export const fulfillmentOrderCode = (orderId: number, orderCode?: string | null): string =>
  orderCode?.trim() || `ORD-${String(orderId).padStart(8, '0')}`;

const formatMoney = (value: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const formatDateTime = (value?: string | null): string => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('vi-VN');
};

const paymentSummary = (detail: PackingDetail): string => {
  const method = detail.paymentMethod?.trim() || 'Chưa cập nhật phương thức';
  if (detail.paymentMethod?.toUpperCase() === 'COD' && detail.isPaid === false) {
    return `${method} · Thu hộ ${formatMoney(detail.finalAmount ?? 0)}`;
  }
  if (detail.isPaid === true) return `${method} · Đã thanh toán`;
  return `${method} · Trạng thái thanh toán chưa cập nhật`;
};

const code39: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', A: 'wnnnnwnnw', B: 'nnwnnwnnw',
  C: 'wnwnnwnnn', D: 'nnnnwwnnw', E: 'wnnnwwnnn', F: 'nnwnwwnnn',
  G: 'nnnnnwwnw', H: 'wnnnnwwnn', I: 'nnwnnwwnn', J: 'nnnnwwwnn',
  K: 'wnnnnnnww', L: 'nnwnnnnww', M: 'wnwnnnnwn', N: 'nnnnwnnww',
  O: 'wnnnwnnwn', P: 'nnwnwnnwn', Q: 'nnnnnnwww', R: 'wnnnnnwwn',
  S: 'nnwnnnwwn', T: 'nnnnwnwwn', U: 'wwnnnnnnw', V: 'nwwnnnnnw',
  W: 'wwwnnnnnn', X: 'nwnnwnnnw', Y: 'wwnnwnnnn', Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '*': 'nwnnwnwnn',
  '$': 'nwnwnwnnn', '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn',
};

const barcodeSvg = (rawValue: string): string => {
  const value = rawValue.toUpperCase().replace(/[^0-9A-Z. $/+%-]/g, '');
  const encoded = `*${value}*`;
  let x = 0;
  const bars: string[] = [];

  for (const character of encoded) {
    const pattern = code39[character] ?? code39['-'];
    [...pattern].forEach((widthCode, index) => {
      const width = widthCode === 'w' ? 3 : 1;
      if (index % 2 === 0) {
        bars.push(`<rect x="${x}" y="0" width="${width}" height="44" fill="#000"/>`);
      }
      x += width;
    });
    x += 1;
  }

  return `<svg class="barcode" viewBox="0 0 ${x} 58" role="img" aria-label="Mã vạch ${escapeHtml(value)}" preserveAspectRatio="none">${bars.join('')}<text x="${x / 2}" y="56" text-anchor="middle" font-family="monospace" font-size="8">${escapeHtml(value)}</text></svg>`;
};

const commonStyles = `
  @page { margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #111; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 12px; }
  h1, h2, p { margin-top: 0; }
  h1 { margin-bottom: 5px; font-size: 22px; letter-spacing: .04em; }
  h2 { margin-bottom: 8px; font-size: 15px; }
  .muted { color: #555; }
  .row { display: flex; justify-content: space-between; gap: 24px; }
  .block { margin-top: 14px; padding: 10px; border: 1px solid #222; }
  .strong { font-weight: 700; }
  .code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 17px; font-weight: 700; letter-spacing: .06em; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 7px 6px; border: 1px solid #333; text-align: left; vertical-align: top; }
  th { background: #eee; font-size: 11px; text-transform: uppercase; }
  .number { text-align: right; white-space: nowrap; }
  .center { text-align: center; }
  .box { display: inline-block; width: 12px; height: 12px; margin-right: 4px; border: 1px solid #111; vertical-align: -2px; }
  .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 28px; text-align: center; }
  .signature-space { height: 55px; }
  .barcode { display: block; width: 100%; max-width: 380px; height: 80px; margin: 8px auto 0; }
  .no-break { break-inside: avoid; }
  @media print { .no-print { display: none !important; } }
`;

const writePrintDocument = (
  title: string,
  content: string,
  options?: { landscape?: boolean; target?: Window },
): void => {
  const popup = options?.target ?? window.open('', '_blank', 'width=980,height=760');
  if (!popup || popup.closed) {
    throw new Error('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép pop-up rồi thử lại.');
  }

  popup.opener = null;
  popup.document.open();
  popup.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(title)}</title><style>${options?.landscape ? '@page { size: A4 landscape; }' : ''}${commonStyles}</style></head><body>${content}</body></html>`);
  popup.document.close();
  popup.focus();
  window.setTimeout(() => {
    if (!popup.closed) popup.print();
  }, 250);
};

const itemRows = (items: PackingItemDetail[]): string =>
  items.map((item, index) => `
    <tr>
      <td class="center">${index + 1}</td>
      <td><span class="strong">${escapeHtml(item.bookTitle)}</span><br/><span class="muted">ISBN: ${escapeHtml(item.isbn || 'Chưa cập nhật')} · Book ID: ${item.bookId}</span></td>
      <td class="center">${item.quantity}</td>
      <td class="number">${escapeHtml(formatMoney(item.unitPrice))}</td>
      <td class="number">${escapeHtml(formatMoney(item.unitPrice * item.quantity))}</td>
      <td><span class="box"></span>Đủ SL<br/><span class="box"></span>Đúng ISBN<br/><span class="box"></span>Ngoại quan đạt</td>
    </tr>`).join('');

export const printPackingSlip = (detail: PackingDetail): void => {
  const orderCode = fulfillmentOrderCode(detail.orderId, detail.orderCode);
  const content = `
    <header class="row">
      <div><h1>PHIẾU ĐÓNG GÓI</h1><div class="muted">Ancient Book Store · Chứng từ nội bộ</div></div>
      <div style="text-align:right"><div class="code">${escapeHtml(orderCode)}</div><div>Ngày in: ${escapeHtml(formatDateTime(new Date().toISOString()))}</div></div>
    </header>
    <section class="block row no-break">
      <div><div class="muted">Người nhận</div><div class="strong">${escapeHtml(detail.customerName)}</div><div>${escapeHtml(detail.receiverPhone || 'Chưa cập nhật SĐT')}</div></div>
      <div style="max-width:58%"><div class="muted">Địa chỉ giao hàng</div><div class="strong">${escapeHtml(detail.shippingAddress)}</div></div>
    </section>
    <section class="block row no-break">
      <div><span class="muted">Ngày đặt: </span><span class="strong">${escapeHtml(formatDateTime(detail.orderDate))}</span></div>
      <div><span class="muted">Thanh toán: </span><span class="strong">${escapeHtml(paymentSummary(detail))}</span></div>
    </section>
    <section style="margin-top:14px">
      <table>
        <thead><tr><th class="center">STT</th><th>Sách / mã nhận dạng</th><th class="center">SL</th><th class="number">Đơn giá</th><th class="number">Thành tiền</th><th>Kiểm tra vật lý</th></tr></thead>
        <tbody>${itemRows(detail.items)}</tbody>
        <tfoot><tr><td colspan="4" class="number strong">Tổng đơn hàng</td><td class="number strong">${escapeHtml(formatMoney(detail.finalAmount ?? detail.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)))}</td><td></td></tr></tfoot>
      </table>
    </section>
    ${detail.packedAt || detail.packedBy ? `<section class="block no-break"><span class="strong">Đã hoàn tất đóng gói:</span> ${escapeHtml(formatDateTime(detail.packedAt))} · Nhân viên: ${escapeHtml(detail.packedBy || '—')}</section>` : ''}
    <section class="signatures no-break">
      <div><div class="strong">Nhân viên lấy hàng</div><div class="signature-space"></div><div>(Ký, ghi rõ họ tên)</div></div>
      <div><div class="strong">Nhân viên đóng gói</div><div class="signature-space"></div><div>(Ký, ghi rõ họ tên)</div></div>
      <div><div class="strong">Bàn giao vận chuyển</div><div class="signature-space"></div><div>(Ký, ghi rõ họ tên)</div></div>
    </section>`;

  writePrintDocument(`Phiếu đóng gói ${orderCode}`, content);
};

export const printShippingLabel = (detail: PackingDetail): void => {
  const orderCode = fulfillmentOrderCode(detail.orderId, detail.orderCode);
  const itemCount = detail.items.reduce((sum, item) => sum + item.quantity, 0);
  const collectCod = detail.paymentMethod?.toUpperCase() === 'COD' && detail.isPaid === false;
  const paymentLabel = collectCod
    ? `THU HỘ: ${formatMoney(detail.finalAmount ?? 0)}`
    : detail.isPaid === true
      ? 'ĐÃ THANH TOÁN · KHÔNG THU HỘ'
      : 'KIỂM TRA TRẠNG THÁI THANH TOÁN';
  const content = `
    <main style="max-width:760px;margin:0 auto;border:3px solid #111;padding:16px">
      <header class="row" style="align-items:flex-start;border-bottom:2px solid #111;padding-bottom:12px">
        <div><h1>NHÃN GIAO HÀNG</h1><div class="muted">Ancient Book Store</div></div>
        <div style="text-align:right"><div class="code">${escapeHtml(orderCode)}</div><div class="muted">Mã xử lý nội bộ</div></div>
      </header>
      <section style="padding:18px 0;border-bottom:2px solid #111">
        <div class="muted" style="font-size:13px">GIAO ĐẾN</div>
        <div class="strong" style="font-size:24px;margin:5px 0">${escapeHtml(detail.customerName)}</div>
        <div style="font-size:18px;line-height:1.45">${escapeHtml(detail.shippingAddress)}</div>
        <div style="font-size:17px;margin-top:8px">Điện thoại: <span class="strong">${escapeHtml(detail.receiverPhone)}</span></div>
      </section>
      <section class="row" style="padding-top:12px;align-items:center">
        <div><div><span class="strong">Số kiện:</span> 1/1</div><div><span class="strong">Số sách:</span> ${itemCount}</div><div><span class="strong">Lưu ý:</span> SÁCH · GIỮ KHÔ</div></div>
        <div style="width:58%">${barcodeSvg(orderCode)}</div>
      </section>
      <section class="block center strong" style="font-size:18px">${escapeHtml(paymentLabel)}</section>
      <p class="muted" style="margin:10px 0 0;text-align:center">Mã trên nhãn là mã đơn nội bộ, không phải mã theo dõi của hãng vận chuyển.</p>
    </main>`;

  writePrintDocument(`Nhãn giao hàng ${orderCode}`, content);
};

export const openWavePrintTarget = (): Window => {
  const popup = window.open('', '_blank', 'width=1100,height=760');
  if (!popup) {
    throw new Error('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép pop-up rồi thử lại.');
  }
  popup.document.write('<!doctype html><html lang="vi"><head><meta charset="utf-8"/><title>Đang tạo phiếu lấy hàng…</title></head><body style="font-family:Arial;padding:24px">Đang tải dữ liệu mới nhất của các đơn đã chọn…</body></html>');
  popup.document.close();
  return popup;
};

export const printWavePicking = (details: PackingDetail[], target?: Window): void => {
  if (details.length === 0) throw new Error('Chưa chọn đơn chờ đóng gói để in phiếu lấy hàng.');

  const grouped = new Map<number, { item: PackingItemDetail; quantity: number; orders: string[] }>();
  details.forEach((detail) => {
    const orderCode = fulfillmentOrderCode(detail.orderId, detail.orderCode);
    detail.items.forEach((item) => {
      const current = grouped.get(item.bookId) ?? { item, quantity: 0, orders: [] };
      current.quantity += item.quantity;
      current.orders.push(`${orderCode} × ${item.quantity}`);
      grouped.set(item.bookId, current);
    });
  });

  const picks = [...grouped.values()].sort((left, right) => {
    const byShelf = (left.item.shelfLocation || 'Kệ chờ phân bổ')
      .localeCompare(right.item.shelfLocation || 'Kệ chờ phân bổ', 'vi');
    return byShelf || (left.item.isbn || left.item.bookTitle)
      .localeCompare(right.item.isbn || right.item.bookTitle, 'vi');
  });
  const orderCodes = details.map((detail) => fulfillmentOrderCode(detail.orderId, detail.orderCode));
  const rows = picks.map((pick, index) => `
    <tr>
      <td class="center">${index + 1}</td>
      <td><span class="strong">${escapeHtml(pick.item.bookTitle)}</span><br/><span class="muted">Book ID: ${pick.item.bookId}</span></td>
      <td>${escapeHtml(pick.item.isbn || 'Chưa cập nhật')}</td>
      <td><span class="strong">${escapeHtml(pick.item.shelfLocation || 'Kệ chờ phân bổ')}</span></td>
      <td class="center strong" style="font-size:16px">${pick.quantity}</td>
      <td>${pick.orders.map(escapeHtml).join('<br/>')}</td>
      <td><span class="box"></span>Lấy đủ<br/><span class="box"></span>Đúng ISBN</td>
    </tr>`).join('');

  const content = `
    <header class="row">
      <div><h1>PHIẾU LẤY HÀNG THEO ĐỢT</h1><div class="muted">Chỉ gồm các đơn chờ đóng gói đã chọn</div></div>
      <div style="text-align:right"><span class="strong">${details.length}</span> đơn · <span class="strong">${picks.length}</span> đầu sách<br/>Ngày in: ${escapeHtml(formatDateTime(new Date().toISOString()))}</div>
    </header>
    <section class="block no-break"><span class="strong">Đơn trong đợt:</span> ${orderCodes.map(escapeHtml).join(' · ')}</section>
    <section class="block no-break"><span class="strong">Thứ tự lấy hàng:</span> Danh sách đã được sắp theo vị trí kệ/ngăn đang lưu trong hệ thống.</section>
    <table style="margin-top:14px">
      <thead><tr><th class="center">STT</th><th>Sách</th><th>ISBN</th><th>Kệ / ngăn</th><th class="center">Tổng SL</th><th>Phân bổ đơn</th><th>Xác nhận</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <section class="signatures no-break">
      <div><div class="strong">Người tạo đợt</div><div class="signature-space"></div><div>(Ký, ghi rõ họ tên)</div></div>
      <div><div class="strong">Người lấy hàng</div><div class="signature-space"></div><div>(Ký, ghi rõ họ tên)</div></div>
      <div><div class="strong">Người kiểm đếm</div><div class="signature-space"></div><div>(Ký, ghi rõ họ tên)</div></div>
    </section>`;

  writePrintDocument(`Phiếu lấy hàng ${details.length} đơn`, content, { landscape: true, target });
};
