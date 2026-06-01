import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { calcFreight } from '@/lib/pricing';

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuoteItem {
  name_ja: string;
  qty: number;
  unit_price?: number;
  amount?: number;
  is_custom: boolean;
}

interface ExtraCost {
  name: string;
  amount: number;
}

interface PdfState {
  // Creator
  creator_name: string;
  creator_company: string;
  // Client
  client_name: string;
  // Machine
  machine_maker: string;
  machine_model: string;
  ec_model: string;
  // ICT
  has_ict: boolean;
  ict_maker: string;
  ict_model: string;
  ict_note: string;
  // Costs
  pallet_count: number;
  install_cost: number;
  hose_parts_cost: number;
  travel_unit_cost: number;
  travel_count: number;
  guidance_unit_cost: number;
  guidance_count: number;
  extra_costs: ExtraCost[];
  // Delivery
  delivery_date: string;
  delivery_terms: string;
  note: string;
  // Items & totals
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Comma-formatted number */
const fmt = (n?: number): string =>
  n != null ? n.toLocaleString('ja-JP') : '';

/** Convert Gregorian date to Reiwa format: "R 8. 5.29" */
function toReiwa(date: Date): string {
  const ry = date.getFullYear() - 2018;
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `R ${ry}. ${m}.${String(d).padStart(2, ' ')}`;
}

// ─── Coordinate constants (A4 = 595.28 × 841.89 pts, origin bottom-left) ────
// Calibrate these values if text positions need adjustment.

const C = {
  // Customer address block (top-left)
  postalCode:   { x: 38,  y: 755 },
  address1:     { x: 38,  y: 742 },
  address2:     { x: 50,  y: 729 },
  customerName: { x: 38,  y: 703, size: 11 },

  // Customer info grid – left column values
  codeValue:      { x: 93,  y: 669 },
  telValue:       { x: 93,  y: 655 },
  mobileTelValue: { x: 93,  y: 642 },

  // Customer info grid – date columns (right side)
  saleDateValue:   { x: 222, y: 655 },
  workStartValue:  { x: 282, y: 655 },
  workEndValue:    { x: 342, y: 655 },
  slipNoValue:     { x: 395, y: 655, size: 8 },
  orderNoValue:    { x: 461, y: 655, size: 8 },
  pageValue:       { x: 547, y: 655 },

  // Machine info
  makerValue:      { x: 112, y: 622 },
  modelValue:      { x: 112, y: 609 },
  serialValue:     { x: 112, y: 596 },
  mgmtValue:       { x: 112, y: 583 },
  hoursValue:      { x: 348, y: 622 },
  receptionValue:  { x: 462, y: 622 },
  mechValue:       { x: 462, y: 609 },
  ownerValue:      { x: 462, y: 596 },

  // Items table
  rowStartY:    561,   // text baseline of row 1
  rowHeight:    13.0,  // pt per row
  nameX:        38,    // left edge of item name
  qtyRightX:    421,   // right edge of 部品数量 column
  unitPriceRightX: 490, // right edge of 部品単価 column
  amountRightX: 555,   // right edge of 部品金額 column
  techFeeRightX: 589,  // right edge of 技術料 column

  // Footer totals (right-aligned)
  totalsRightX:    588,
  techFeeTotalY:   141,
  partsTotalY:     128,
  subtotalLineY:   114,
  taxLineY:        101,
  grandTotalLineY: 87,

  // 御請求額
  billingRightX: 588,
  billingY:      41,
  billingSize:   14,
} as const;

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateInvoicePdf(
  state: PdfState,
  quoteNumber: string,
): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'public', 'templates', 'invoice-template.pdf');
  const fontPath     = path.join(process.cwd(), 'public', 'fonts', 'IPAGothic.ttf');

  const [templateBytes, fontBytes] = [
    fs.readFileSync(templatePath),
    fs.readFileSync(fontPath),
  ];

  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);
  const font = await pdfDoc.embedFont(fontBytes);

  const page = pdfDoc.getPages()[0];
  const BLACK = rgb(0, 0, 0);
  const NORMAL = 9;

  // draw left-aligned text
  const draw = (text: string, x: number, y: number, size = NORMAL) => {
    if (!text) return;
    page.drawText(text, { x, y, size, font, color: BLACK });
  };

  // draw right-aligned text
  const drawR = (text: string, rightEdge: number, y: number, size = NORMAL) => {
    if (!text) return;
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: rightEdge - w, y, size, font, color: BLACK });
  };

  const today = new Date();
  const dateStr = toReiwa(today);

  // ── Customer info ──────────────────────────────────────────────────────────
  draw(`${state.client_name}　御中`, C.customerName.x, C.customerName.y, C.customerName.size);

  // ── Date / order grid ─────────────────────────────────────────────────────
  draw(dateStr, C.saleDateValue.x, C.saleDateValue.y);
  if (state.delivery_date) {
    draw(state.delivery_date, C.workStartValue.x, C.workStartValue.y);
  }
  // 伝票番号: 8-digit numeric representation of quoteNumber
  const slipNo = quoteNumber.replace(/\D/g, '').padStart(8, '0');
  draw(slipNo,     C.slipNoValue.x,  C.slipNoValue.y,  C.slipNoValue.size);
  draw(quoteNumber, C.orderNoValue.x, C.orderNoValue.y, C.orderNoValue.size);
  draw('1',        C.pageValue.x,    C.pageValue.y);

  // ── Machine info ──────────────────────────────────────────────────────────
  draw('engcon',       C.makerValue.x, C.makerValue.y);
  draw(state.ec_model, C.modelValue.x, C.modelValue.y);
  draw(state.creator_name || '', C.receptionValue.x, C.receptionValue.y);

  // ── Build rows for items table ────────────────────────────────────────────
  type Row = { name: string; qty?: number; unitPrice?: number; amount?: number };
  const rows: Row[] = [];

  // Main quote items
  for (const item of state.items) {
    rows.push({
      name: item.name_ja,
      qty:       item.amount != null ? item.qty : undefined,
      unitPrice: item.unit_price,
      amount:    item.amount,
    });
  }

  // Freight
  const freight = calcFreight(state.pallet_count);
  if (freight > 0) {
    rows.push({
      name:      `国内運賃（${state.pallet_count}パレット）`,
      qty:       state.pallet_count,
      unitPrice: 35_000,
      amount:    freight,
    });
  }

  // Install cost
  if (state.install_cost > 0) {
    rows.push({ name: '取付費用', qty: 1, unitPrice: state.install_cost, amount: state.install_cost });
  }

  // Hose parts
  if (state.hose_parts_cost > 0) {
    rows.push({ name: 'ホース取付部材一式', qty: 1, unitPrice: state.hose_parts_cost, amount: state.hose_parts_cost });
  }

  // Travel
  const travelTotal = state.travel_unit_cost * state.travel_count;
  if (travelTotal > 0) {
    rows.push({ name: `出張費用（${state.travel_count}回）`, qty: state.travel_count, unitPrice: state.travel_unit_cost, amount: travelTotal });
  }

  // Guidance
  const guidanceTotal = state.guidance_unit_cost * state.guidance_count;
  if (guidanceTotal > 0) {
    rows.push({ name: `納入指導費（${state.guidance_count}回）`, qty: state.guidance_count, unitPrice: state.guidance_unit_cost, amount: guidanceTotal });
  }

  // Extra costs
  for (const ec of state.extra_costs) {
    if (ec.amount > 0) rows.push({ name: ec.name, qty: 1, unitPrice: ec.amount, amount: ec.amount });
  }

  // Notes rows (rows 21-25 area)
  rows.push({ name: '' });
  rows.push({ name: `【納期】${state.delivery_terms || '別途御協議賜度'}` });
  rows.push({ name: '' });
  rows.push({ name: '【備考】' });
  if (state.machine_model) {
    rows.push({ name: `対象機種：${state.machine_maker} ${state.machine_model}` });
  }
  if (state.has_ict && state.ict_maker) {
    rows.push({ name: `ICT：${state.ict_maker} ${state.ict_model}`.trim() });
  }
  if (state.note) {
    rows.push({ name: state.note });
  }

  // ── Render rows (max 25) ──────────────────────────────────────────────────
  rows.slice(0, 25).forEach((row, i) => {
    const y = C.rowStartY - i * C.rowHeight;
    draw(row.name, C.nameX, y);
    if (row.qty != null && row.amount != null) {
      drawR(row.qty.toFixed(2),      C.qtyRightX,      y);
      if (row.unitPrice != null) drawR(fmt(row.unitPrice), C.unitPriceRightX, y);
      drawR(fmt(row.amount),         C.amountRightX,   y);
    }
  });

  // ── Footer totals ─────────────────────────────────────────────────────────
  drawR('0',                   C.totalsRightX, C.techFeeTotalY);
  drawR(fmt(state.subtotal),   C.totalsRightX, C.partsTotalY);
  drawR(fmt(state.subtotal),   C.totalsRightX, C.subtotalLineY);
  drawR(fmt(state.tax),        C.totalsRightX, C.taxLineY);
  drawR(fmt(state.total),      C.totalsRightX, C.grandTotalLineY);

  // 御請求額（大きめ・太字相当）
  drawR(`¥${fmt(state.total)}`, C.billingRightX, C.billingY, C.billingSize);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
