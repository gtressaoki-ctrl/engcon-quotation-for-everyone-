import type { WizardState } from '@/types/quote';

interface Props {
  state: WizardState & { subtotal: number; tax: number; total: number };
  quoteNumber: string;
  createdAt: string;
}

export function generateQuoteHtml({ state, quoteNumber, createdAt }: Props): string {
  const freight = state.pallet_count * 35000;
  const travelTotal = state.travel_unit_cost * state.travel_count;
  const guidanceTotal = state.guidance_unit_cost * state.guidance_count;

  // 行番号カウンター（5行ごとに表示）
  let lineCounter = 0;
  function nextLine() {
    lineCounter++;
    return lineCounter % 5 === 0 ? String(lineCounter) : '';
  }

  function itemRow(name: string, qty: number | null, unitPrice: number | null, amount: number | null, techFee = '') {
    const ln = nextLine();
    const qtyStr = qty != null ? qty.toFixed(2) : '';
    const upStr = unitPrice != null ? unitPrice.toLocaleString() : '';
    const amtStr = amount != null ? amount.toLocaleString() : '';
    return `<tr>
      <td class="ln">${ln}</td>
      <td class="col-name">${name}</td>
      <td class="col-qty">${qtyStr}</td>
      <td class="col-price">${upStr}</td>
      <td class="col-amount">${amtStr}</td>
      <td class="col-tech">${techFee}</td>
    </tr>`;
  }

  function sectionRow(label: string) {
    const ln = nextLine();
    return `<tr class="section-row">
      <td class="ln">${ln}</td>
      <td colspan="5">${label}</td>
    </tr>`;
  }

  function blankRow() {
    const ln = nextLine();
    return `<tr class="blank-row"><td class="ln">${ln}</td><td colspan="5"></td></tr>`;
  }

  // メイン品目行（Step5 items）
  const mainItems = state.items.map((item) => {
    const name = item.item_no ? `${item.name_ja}` : item.name_ja;
    return itemRow(name, item.qty, item.unit_price ?? null, item.amount ?? null);
  }).join('');

  // 追加費用行
  const costRows: string[] = [];

  if (freight > 0) {
    costRows.push(itemRow(`送料（国内輸送）`, state.pallet_count, 35000, freight));
  }
  if (state.install_cost > 0) {
    costRows.push(itemRow('取付費用', 1, state.install_cost, state.install_cost));
  }
  if (state.hose_parts_cost > 0) {
    costRows.push(itemRow('ホース取付部材一式', 1, state.hose_parts_cost, state.hose_parts_cost));
  }
  if (travelTotal > 0) {
    costRows.push(itemRow(`出張費用`, state.travel_count, state.travel_unit_cost, travelTotal));
  }
  if (guidanceTotal > 0) {
    costRows.push(itemRow(`納入指導費`, state.guidance_count, state.guidance_unit_cost, guidanceTotal));
  }
  state.extra_costs?.filter((e) => e.amount > 0).forEach((ec) => {
    costRows.push(itemRow(ec.name, 1, ec.amount, ec.amount));
  });

  // 追加費用がある場合は区切り行を入れる
  const extraBlock = costRows.length > 0 ? [blankRow(), ...costRows].join('') : '';

  // 備考：ICT情報
  const ictNote = state.has_ict
    ? `ICT取付予定：${state.ict_maker || ''} ${state.ict_model || ''}${state.ict_note ? '　' + state.ict_note : ''}`
    : '';
  const catDc3Note = state.machine_maker === 'CAT' && state.dc_system === 'DC3'
    ? 'ICTをご利用の場合は別途 Grade Indication for 3rd party が必要な場合があります。CAT DC3システムをご利用の場合は別途 SEA が必要な場合があります。'
    : '';

  const noteLines = [
    state.delivery_location ? `取付場所：${state.delivery_location}` : '',
    state.note || '',
    ictNote,
    catDc3Note,
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
  font-size: 10px;
  color: #000;
  padding: 14px 18px;
  width: 210mm;
}

/* ===== タイトル ===== */
.doc-title {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  letter-spacing: 0.6em;
  margin-bottom: 10px;
}

/* ===== ヘッダー上段：宛先（左）＋会社情報（右） ===== */
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 16px;
}
.client-block {
  flex: 1;
  font-size: 10px;
  line-height: 1.6;
}
.client-name {
  font-size: 15px;
  font-weight: bold;
  margin-top: 6px;
  border-bottom: 1px solid #000;
  padding-bottom: 2px;
  display: inline-block;
}
.company-block {
  border: 1px solid #999;
  padding: 5px 8px;
  font-size: 8.5px;
  line-height: 1.65;
  min-width: 270px;
  max-width: 310px;
}
.company-block strong {
  font-size: 12px;
  display: block;
  margin-bottom: 2px;
}

/* ===== 日付・番号グリッド ===== */
.info-grid {
  display: grid;
  grid-template-columns: 44px 1fr 44px 1fr 72px 1fr 60px 1fr 76px 1fr 24px 1fr;
  border: 1px solid #000;
  border-bottom: none;
  font-size: 8.5px;
}
.ig-label {
  background: #f0f0f0;
  border-right: 1px solid #666;
  border-bottom: 1px solid #000;
  padding: 2px 3px;
  text-align: center;
  white-space: nowrap;
}
.ig-value {
  border-right: 1px solid #ccc;
  border-bottom: 1px solid #000;
  padding: 2px 4px;
}

/* ===== 機器情報グリッド ===== */
.machine-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid #000;
  border-bottom: none;
  font-size: 8.5px;
}
.mg-left { border-right: 1px solid #000; }
.mg-field {
  display: flex;
  border-bottom: 1px solid #ccc;
  min-height: 18px;
}
.mg-label {
  width: 58px;
  background: #f0f0f0;
  border-right: 1px solid #ccc;
  padding: 2px 3px;
  white-space: nowrap;
  font-size: 8px;
}
.mg-value { flex: 1; padding: 2px 4px; }
.mg-right .mg-field { }

/* ===== メインテーブル ===== */
table.main {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #000;
  font-size: 9.5px;
}
table.main thead th {
  background: #f0f0f0;
  border: 1px solid #000;
  padding: 3px 4px;
  text-align: center;
  font-size: 8.5px;
  letter-spacing: 0.05em;
}
table.main tbody td {
  border-right: 1px solid #ccc;
  border-bottom: 1px solid #eee;
  padding: 2px 4px;
  vertical-align: middle;
}
table.main tbody tr:last-child td { border-bottom: 1px solid #000; }

.ln { width: 14px; text-align: right; color: #888; font-size: 7.5px; border-right: 1px solid #ccc !important; padding-right: 2px; }
.col-name { }
.col-qty   { text-align: right; white-space: nowrap; }
.col-price { text-align: right; white-space: nowrap; }
.col-amount { text-align: right; white-space: nowrap; }
.col-tech  { text-align: right; white-space: nowrap; }

.section-row td { font-weight: bold; background: #fafafa; }
.blank-row td { height: 16px; }

/* ===== 下部：備考（左）＋集計（右） ===== */
.bottom-section {
  display: flex;
  border: 1px solid #000;
  border-top: none;
}
.remarks-block {
  flex: 1;
  padding: 6px 8px;
  border-right: 1px solid #000;
  font-size: 8.5px;
  line-height: 2;
}
.totals-block {
  width: 210px;
  font-size: 9px;
}
.total-row {
  display: flex;
  border-bottom: 1px solid #ccc;
}
.total-label {
  flex: 1;
  padding: 3px 8px;
  border-right: 1px solid #ccc;
}
.total-value {
  width: 90px;
  text-align: right;
  padding: 3px 8px;
}
.grand-total {
  border-top: 2px solid #000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 8px;
}
.grand-total-label { font-size: 13px; font-weight: bold; }
.grand-total-value { font-size: 14px; font-weight: bold; }
</style>
</head>
<body>

<div class="doc-title">御　見　積　書</div>

<!-- ヘッダー上段 -->
<div class="header-top">
  <div class="client-block">
    <div class="client-name">${state.client_name}　御中</div>
  </div>
  <div class="company-block">
    <strong>株式会社Ｇ．ＴＲＥＳ</strong>
    本社　〒761-0301　香川県高松市林町2008-1<br>
    ＴＥＬ＆ＦＡＸ　087-868-2677<br>
    特定自主検査指定工場　〒768-0105　香川県三豊市山本町河内1049-11<br>
    ＴＥＬ：0875-24-8222　ＦＡＸ：0875-24-8202<br>
    AdBlue<sup>®</sup>製造販売　〒761-1706　香川県高松市香川町川東上2404-1<br>
    ＴＥＬ：087-802-2988　ＦＡＸ：087-802-2987
  </div>
</div>

<!-- 日付・番号グリッド -->
<div class="info-grid">
  <div class="ig-label">コード</div>
  <div class="ig-value"></div>
  <div class="ig-label">ＴＥＬ</div>
  <div class="ig-value"></div>
  <div class="ig-label">御見積作成日</div>
  <div class="ig-value">${createdAt}</div>
  <div class="ig-label">有効期限</div>
  <div class="ig-value">1ヶ月</div>
  <div class="ig-label">見積番号</div>
  <div class="ig-value">${quoteNumber}</div>
  <div class="ig-label">頁</div>
  <div class="ig-value">1</div>
</div>

<!-- 機器情報グリッド -->
<div class="machine-grid">
  <div class="mg-left">
    <div class="mg-field">
      <div class="mg-label">メーカー</div>
      <div class="mg-value">ｅｎｇｃｏｎ</div>
      <div class="mg-label" style="width:52px;border-left:1px solid #ccc;">稼動時間</div>
      <div class="mg-value" style="width:70px;"></div>
    </div>
    <div class="mg-field">
      <div class="mg-label">型　式</div>
      <div class="mg-value">${state.ec_model}</div>
      <div class="mg-label" style="width:52px;border-left:1px solid #ccc;">次回特自検</div>
      <div class="mg-value" style="width:70px;">　．　．</div>
    </div>
    <div class="mg-field" style="border-bottom:none;">
      <div class="mg-label">シリアル番号</div>
      <div class="mg-value"></div>
      <div class="mg-label" style="width:52px;border-left:1px solid #ccc;">管理番号</div>
      <div class="mg-value" style="width:70px;"></div>
    </div>
  </div>
  <div class="mg-right">
    <div class="mg-field">
      <div class="mg-label">受付担当</div>
      <div class="mg-value">${state.creator_name}</div>
    </div>
    <div class="mg-field">
      <div class="mg-label">メカ担当</div>
      <div class="mg-value"></div>
    </div>
    <div class="mg-field" style="border-bottom:none;">
      <div class="mg-label">所有者</div>
      <div class="mg-value"></div>
    </div>
  </div>
</div>

<!-- メインテーブル -->
<table class="main">
  <thead>
    <tr>
      <th style="width:14px;"></th>
      <th style="width:50%;">作　業　内　容　・　使　用　部　品　名</th>
      <th style="width:9%;">部品数量</th>
      <th style="width:13%;">部品単価</th>
      <th style="width:13%;">部品金額</th>
      <th style="width:11%;">技　術　料</th>
    </tr>
  </thead>
  <tbody>
    ${sectionRow(`【${state.machine_condition === 'new' ? '新車' : '中古車'}御見積書】`)}
    ${itemRow(`ｅｎｇｃｏｎ 製　チルトローテータ`, null, null, null)}
    ${blankRow()}
    ${sectionRow('【詳細】')}
    ${mainItems}
    ${extraBlock}
    ${blankRow()}
    ${blankRow()}
    ${blankRow()}
  </tbody>
</table>

<!-- 下部：備考＋集計 -->
<div class="bottom-section">
  <div class="remarks-block">
    【納期】${state.delivery_date || state.delivery_terms || '別途御協議'}<br>
    <br>
    【備考】<br>
    対象機種：${state.machine_maker}&nbsp;${state.machine_model}<br>
    ${noteLines.map((l) => `${l}<br>`).join('')}
    御見積書有効期限：御見積作成日より1ヶ月<br>
    振込手数料はお客様ご負担にてお願致します<br>
    香川銀行&nbsp;&nbsp;伏石支店&nbsp;&nbsp;普通&nbsp;&nbsp;3620256<br>
    百十四銀行&nbsp;&nbsp;伏石支店&nbsp;&nbsp;普通&nbsp;&nbsp;0440274<br>
    観音寺信用金庫&nbsp;&nbsp;財田支店&nbsp;&nbsp;普通&nbsp;&nbsp;0099602<br>
    名義人：カ）ジー．トレス<br>
    適格請求書発行事業者登録番号：T6470001016892
  </div>
  <div class="totals-block">
    <div class="total-row">
      <div class="total-label">技術料合計</div>
      <div class="total-value">0</div>
    </div>
    <div class="total-row">
      <div class="total-label">部品合計</div>
      <div class="total-value">${state.subtotal.toLocaleString()}</div>
    </div>
    <div class="total-row">
      <div class="total-label">整備小計</div>
      <div class="total-value">${state.subtotal.toLocaleString()}</div>
    </div>
    <div class="total-row">
      <div class="total-label">一般消費税</div>
      <div class="total-value">${state.tax.toLocaleString()}</div>
    </div>
    <div class="total-row" style="border-bottom: 2px solid #000;">
      <div class="total-label">整備料合計</div>
      <div class="total-value">${state.total.toLocaleString()}</div>
    </div>
    <div class="grand-total">
      <span class="grand-total-label">御見積金額</span>
      <span class="grand-total-value">¥${state.total.toLocaleString()}</span>
    </div>
  </div>
</div>

</body>
</html>`;
}
