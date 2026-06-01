import type { WizardState } from '@/types/quote';
import { calcFreight } from '@/lib/pricing';

interface Props {
  state: WizardState & { subtotal: number; tax: number; total: number };
  quoteNumber: string;
  createdAt: string;
}

export function generateStep10Html({ state, quoteNumber, createdAt }: Props): string {
  const freight = calcFreight(state.pallet_count);
  const travelTotal = state.travel_unit_cost * state.travel_count;
  const guidanceTotal = state.guidance_unit_cost * state.guidance_count;

  function section(title: string, content: string) {
    return `
      <div class="section">
        <div class="section-title">${title}</div>
        <div class="section-body">${content}</div>
      </div>`;
  }

  function row(label: string, value: string | undefined | null) {
    if (!value) return '';
    return `<div class="row"><span class="label">${label}</span><span class="value">${value}</span></div>`;
  }

  const creatorSection = section('作成者情報', [
    row('種別', state.creator_type === 'gtres' ? 'G.TRES社員' : 'ディーラー'),
    row('会社名', state.creator_company),
    row('担当者名', state.creator_name),
  ].join(''));

  const clientSection = section('見積先情報', [
    row('種別', { dealer: 'ディーラー向け', reseller: '未登録販売店向け', enduser: 'エンドユーザー・その他' }[state.client_type as string]),
    row('見積先名', state.client_name),
  ].join(''));

  const machineSection = section('ベースマシン', [
    row('状態', state.machine_condition === 'new' ? '新車' : '中古車'),
    row('メーカー', state.machine_maker),
    row('機種名', state.machine_model),
    state.machine_year ? row('製造年月', state.machine_year) : '',
    row('取付方式', state.mount_type === 'SW' ? 'サンドイッチ（SW）' : 'ダイレクトマウント（DM）'),
    row('S規格', state.s_standard),
    row('ECモデル', state.ec_model),
    row('DCシステム', state.dc_system),
  ].join(''));

  const itemRows = state.items.map((item) => `
    <tr>
      <td class="td-name">${item.name_ja}</td>
      <td class="td-r">${item.list_price != null ? item.list_price.toLocaleString() : '—'}</td>
      <td class="td-r">${item.qty}</td>
      <td class="td-r">${item.unit_price != null ? item.unit_price.toLocaleString() : '—'}</td>
      <td class="td-r">${item.amount != null ? item.amount.toLocaleString() : '—'}</td>
    </tr>`).join('');

  const itemsSection = section('品目一覧', `
    <table class="items-table">
      <thead>
        <tr>
          <th class="th-name">品名</th>
          <th class="th-r">定価</th>
          <th class="th-r">数量</th>
          <th class="th-r">販売価</th>
          <th class="th-r">金額</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>`);

  const extraRows: string[] = [];
  if (freight > 0) extraRows.push(row(`国内運賃（${state.pallet_count}パレット）`, `¥${freight.toLocaleString()}`));
  if (state.install_cost > 0) extraRows.push(row('取付費用', `¥${state.install_cost.toLocaleString()}`));
  if (state.hose_parts_cost > 0) extraRows.push(row('ホース取付部材', `¥${state.hose_parts_cost.toLocaleString()}`));
  if (travelTotal > 0) extraRows.push(row(`出張費用（${state.travel_count}回）`, `¥${travelTotal.toLocaleString()}`));
  if (guidanceTotal > 0) extraRows.push(row(`納入指導費（${state.guidance_count}回）`, `¥${guidanceTotal.toLocaleString()}`));
  state.extra_costs?.filter((e) => e.amount > 0).forEach((ec, i) => {
    extraRows.push(row(ec.name || `その他${i + 1}`, `¥${ec.amount.toLocaleString()}`));
  });

  const extraSection = extraRows.length > 0
    ? section('追加費用', extraRows.join(''))
    : '';

  const totalsBlock = `
    <div class="totals-block">
      <div class="totals-row"><span>小計（税抜）</span><span>¥${state.subtotal.toLocaleString()}</span></div>
      <div class="totals-row"><span>消費税（10%）</span><span>¥${state.tax.toLocaleString()}</span></div>
      <div class="totals-row grand"><span>御見積金額（税込）</span><span class="grand-val">¥${state.total.toLocaleString()}</span></div>
    </div>`;

  const ictSection = state.has_ict ? section('ICT情報', [
    row('メーカー', state.ict_maker),
    row('機種名', state.ict_model),
    state.ict_note ? row('備考', state.ict_note) : '',
  ].join('')) : '';

  const noteLines: string[] = [];
  if (state.delivery_location) noteLines.push(`取付場所：${state.delivery_location}`);
  if (state.note) noteLines.push(state.note);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8"/>
<style>
@page { size: A4; margin: 18px 22px; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
  font-size: 10px;
  color: #000;
}

.doc-title {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  letter-spacing: 0.5em;
  margin-bottom: 10px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #555;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #ccc;
}

.section {
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.section-title {
  background: #f0f0f0;
  padding: 4px 8px;
  font-weight: bold;
  font-size: 9.5px;
  color: #333;
  border-bottom: 1px solid #ccc;
}

.section-body {
  padding: 6px 8px;
}

.row {
  display: flex;
  gap: 10px;
  font-size: 9.5px;
  margin-bottom: 2px;
}

.label {
  color: #666;
  width: 80px;
  flex-shrink: 0;
}

.value {
  color: #000;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9px;
}

.items-table thead tr {
  background: #f5f5f5;
}

.th-name, .th-r {
  padding: 3px 5px;
  border-bottom: 1px solid #ccc;
  font-weight: bold;
  text-align: right;
}

.th-name {
  text-align: left;
}

.td-name, .td-r {
  padding: 2px 5px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

.td-name {
  text-align: left;
}

.td-r {
  text-align: right;
  white-space: nowrap;
}

.th-r { width: 14%; }
.th-r:nth-child(3) { width: 8%; }

.totals-block {
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.totals-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 10px;
  font-size: 10px;
  border-bottom: 1px solid #eee;
}

.totals-row:last-child {
  border-bottom: none;
}

.grand {
  border-top: 1px solid #bbb;
  font-size: 12px;
  font-weight: bold;
  padding: 6px 10px;
}

.grand-val {
  color: #1a4fa0;
}

.footer {
  margin-top: 10px;
  font-size: 8.5px;
  color: #555;
  border-top: 1px solid #ddd;
  padding-top: 6px;
}

.footer-grid {
  display: flex;
  justify-content: space-between;
}

.footer-notes {
  line-height: 1.8;
}

.footer-bank {
  text-align: right;
  line-height: 1.8;
}
</style>
</head>
<body>

<div class="doc-title">御　見　積　書</div>

<div class="meta-row">
  <span>見積番号：${quoteNumber}</span>
  <span>作成日：${createdAt}</span>
  <span>有効期限：作成日より1ヶ月</span>
</div>

${creatorSection}
${clientSection}
${machineSection}
${itemsSection}
${extraSection}
${totalsBlock}
${ictSection}

<div class="footer">
  <div class="footer-grid">
    <div class="footer-notes">
      【納期】${state.delivery_date || state.delivery_terms || '別途御協議賜度'}<br>
      ${noteLines.map((l) => l + '<br>').join('')}
      御見積書有効期限：御見積作成日より1ヶ月<br>
      振込手数料はお客様ご負担にてお願致します<br>
      適格請求書発行事業者登録番号：T6470001016892
    </div>
    <div class="footer-bank">
      香川銀行&emsp;伏石支店&emsp;普通&emsp;3620256<br>
      百十四銀行&emsp;伏石支店&emsp;普通&emsp;0440274<br>
      観音寺信用金庫&emsp;財田支店&emsp;普通&emsp;0099602<br>
      名義人：カ）ジー．トレス
    </div>
  </div>
</div>

</body>
</html>`;
}
