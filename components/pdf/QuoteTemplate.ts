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

  // 行番号（5の倍数のみ表示）
  let lineNo = 0;
  function nextLn(): string {
    lineNo++;
    return lineNo % 5 === 0 ? String(lineNo) : '';
  }

  function tr(name: string, qty: number | null, unitPrice: number | null, amount: number | null) {
    return `<tr>
      <td class="ln">${nextLn()}</td>
      <td class="col-name">${name}</td>
      <td class="col-r">${qty != null ? qty.toFixed(2) : ''}</td>
      <td class="col-r">${unitPrice != null ? unitPrice.toLocaleString() : ''}</td>
      <td class="col-r">${amount != null ? amount.toLocaleString() : ''}</td>
      <td class="col-r"></td>
    </tr>`;
  }

  function sectionTr(label: string) {
    return `<tr class="sec"><td class="ln">${nextLn()}</td><td colspan="5">${label}</td></tr>`;
  }

  function blankTr() {
    return `<tr class="blank"><td class="ln">${nextLn()}</td><td colspan="5"></td></tr>`;
  }

  const mainRows = state.items.map((item) => tr(item.name_ja, item.qty, item.unit_price ?? null, item.amount ?? null)).join('');

  const costRows: string[] = [];
  if (freight > 0) costRows.push(tr('送料（国内輸送）', state.pallet_count, 35000, freight));
  if (state.install_cost > 0) costRows.push(tr('取付費用', 1, state.install_cost, state.install_cost));
  if (state.hose_parts_cost > 0) costRows.push(tr('ホース取付部材一式', 1, state.hose_parts_cost, state.hose_parts_cost));
  if (travelTotal > 0) costRows.push(tr('出張費用', state.travel_count, state.travel_unit_cost, travelTotal));
  if (guidanceTotal > 0) costRows.push(tr('納入指導費', state.guidance_count, state.guidance_unit_cost, guidanceTotal));
  state.extra_costs?.filter((e) => e.amount > 0).forEach((ec) => {
    costRows.push(tr(ec.name, 1, ec.amount, ec.amount));
  });

  const extraBlock = costRows.length > 0 ? costRows.join('') : '';

  // 備考行
  const noteLines: string[] = [];
  if (state.delivery_location) noteLines.push(`取付場所：${state.delivery_location}`);
  if (state.note) noteLines.push(state.note);
  if (state.has_ict) {
    noteLines.push(`ICT取付予定：${state.ict_maker || ''} ${state.ict_model || ''}${state.ict_note ? '　' + state.ict_note : ''}`.trim());
    if (state.machine_maker === 'CAT' && state.dc_system === 'DC3') {
      noteLines.push('ICTをご利用の場合は別途 Grade Indication for 3rd party が必要な場合があります。CAT DC3システムをご利用の場合は別途 SEA が必要な場合があります。');
    }
  }

  // 角印SVG（2つ）
  const stamp = (text: string) => `<svg width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="20" fill="none" stroke="#c0392b" stroke-width="2"/>
    <circle cx="22" cy="22" r="17" fill="none" stroke="#c0392b" stroke-width="1"/>
    <text x="22" y="27" text-anchor="middle" font-size="13" fill="#c0392b"
      font-family="'Hiragino Mincho ProN','Yu Mincho','MS Mincho',serif">${text}</text>
  </svg>`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8"/>
<style>
@page { size: A4; margin: 14px 18px; }
* { margin:0; padding:0; box-sizing:border-box; }
body {
  font-family:'Hiragino Kaku Gothic ProN','Yu Gothic','Meiryo',sans-serif;
  font-size:10px; color:#000;
}
a { color:inherit; text-decoration:none; }

/* タイトル */
.title {
  font-size:22px; font-weight:bold; text-align:center;
  letter-spacing:.7em; margin-bottom:10px;
}

/* ヘッダー上段 */
.hdr { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; margin-bottom:7px; }

/* 宛先ブロック */
.client { flex:1; font-size:10px; line-height:1.7; min-width:180px; }
.client-name {
  font-size:15px; font-weight:bold; margin-top:10px;
  border-bottom:1px solid #000; padding-bottom:2px; display:inline-block;
}

/* 会社情報ブロック */
.company {
  border:1px solid #555; padding:5px 7px;
  font-size:8.5px; line-height:1.7;
  min-width:260px; max-width:300px;
  display:flex; gap:6px; align-items:flex-start;
}
.company-text { flex:1; }
.company-name { font-size:13px; font-weight:bold; margin-bottom:2px; }
.stamps { display:flex; gap:4px; flex-shrink:0; padding-top:2px; }

/* 日付グリッド */
.dg {
  display:grid;
  grid-template-columns:44px 1fr 44px 1fr 72px 1fr 60px 1fr 72px 1fr 24px 1fr;
  border:1px solid #000; border-bottom:none; font-size:8px;
}
.dg-l { background:#f0f0f0; border-right:1px solid #777; border-bottom:1px solid #000; padding:2px 3px; text-align:center; white-space:nowrap; }
.dg-v { border-right:1px solid #ccc; border-bottom:1px solid #000; padding:2px 4px; }

/* 機器情報グリッド */
.mg { display:grid; grid-template-columns:1fr 1fr; border:1px solid #000; border-bottom:none; font-size:8.5px; }
.mg-l { border-right:1px solid #000; }
.mf { display:flex; border-bottom:1px solid #ccc; min-height:18px; }
.ml { background:#f0f0f0; border-right:1px solid #ccc; padding:2px 3px; white-space:nowrap; font-size:8px; }
.mv { flex:1; padding:2px 4px; }

/* メインテーブル */
table { width:100%; border-collapse:collapse; border:1px solid #000; font-size:9.5px; }
thead th {
  background:#f0f0f0; border:1px solid #000;
  padding:3px 4px; text-align:center; font-size:8.5px; white-space:nowrap;
}
tbody td { border-right:1px solid #ccc; border-bottom:1px solid #eee; padding:2px 4px; vertical-align:middle; }
tbody tr:last-child td { border-bottom:1px solid #999; }

.ln { width:14px; text-align:right; color:#999; font-size:7.5px; border-right:1px solid #ccc !important; padding:2px 2px; }
.col-name { }
.col-r { text-align:right; white-space:nowrap; }
.sec td { font-weight:bold; font-size:9.5px; }
.blank td { height:15px; }

/* 下部 */
.bottom { display:flex; border:1px solid #000; border-top:none; }
.remarks { flex:1; padding:6px 8px; border-right:1px solid #000; font-size:8.5px; line-height:1.95; }
.totals { width:215px; font-size:9.5px; }
.tot-row { display:flex; border-bottom:1px solid #ccc; }
.tot-l { flex:1; padding:3px 8px; border-right:1px solid #ccc; }
.tot-r { width:88px; text-align:right; padding:3px 6px; }
.grand { border-top:2px solid #000; display:flex; justify-content:space-between; align-items:center; padding:6px 8px; }
.grand-lbl { font-size:13px; font-weight:bold; }
.grand-val { font-size:14px; font-weight:bold; }
</style>
</head>
<body>

<div class="title">御　見　積　書</div>

<!-- ヘッダー上段 -->
<div class="hdr">
  <div class="client">
    <div class="client-name">${state.client_name || '　'}　御中</div>
  </div>
  <div class="company">
    <div class="company-text">
      <div class="company-name">株式会社Ｇ．ＴＲＥＳ</div>
      本社　〒761-0301　香川県高松市林町2008-1<br>
      ＴＥＬ＆ＦＡＸ　087-868-2677<br>
      特定自主検査指定工場　〒768-0105　香川県三豊市山本町河内1049-11<br>
      ＴＥＬ：0875-24-8222　ＦＡＸ：0875-24-8202<br>
      AdBlue<sup>®</sup>製造販売　〒761-1706　香川県高松市香川町川東上2404-1<br>
      ＴＥＬ：087-802-2988　ＦＡＸ：087-802-2987
    </div>
    <div class="stamps">
      ${stamp('蒲生')}
      ${stamp('三野')}
    </div>
  </div>
</div>

<!-- 日付グリッド -->
<div class="dg">
  <div class="dg-l">コード</div><div class="dg-v"></div>
  <div class="dg-l">ＴＥＬ</div><div class="dg-v"></div>
  <div class="dg-l">御見積作成日</div><div class="dg-v">${createdAt}</div>
  <div class="dg-l">有効期限</div><div class="dg-v">1ヶ月</div>
  <div class="dg-l">見積番号</div><div class="dg-v">${quoteNumber}</div>
  <div class="dg-l">頁</div><div class="dg-v">1</div>
</div>

<!-- 機器情報グリッド -->
<div class="mg">
  <div class="mg-l">
    <div class="mf">
      <div class="ml" style="width:52px">メーカー</div><div class="mv">ｅｎｇｃｏｎ</div>
      <div class="ml" style="width:50px;border-left:1px solid #ccc">稼動時間</div><div class="mv" style="width:70px"></div>
    </div>
    <div class="mf">
      <div class="ml" style="width:52px">型　式</div><div class="mv">${state.ec_model}</div>
      <div class="ml" style="width:50px;border-left:1px solid #ccc">次回特自検</div><div class="mv" style="width:70px">　．　．</div>
    </div>
    <div class="mf" style="border-bottom:none">
      <div class="ml" style="width:52px">シリアル番号</div><div class="mv"></div>
      <div class="ml" style="width:50px;border-left:1px solid #ccc">管理番号</div><div class="mv" style="width:70px"></div>
    </div>
  </div>
  <div>
    <div class="mf">
      <div class="ml" style="width:52px">受付担当</div><div class="mv">${state.creator_name}</div>
    </div>
    <div class="mf">
      <div class="ml" style="width:52px">メカ担当</div><div class="mv"></div>
    </div>
    <div class="mf" style="border-bottom:none">
      <div class="ml" style="width:52px">所有者</div><div class="mv"></div>
    </div>
  </div>
</div>

<!-- メインテーブル -->
<table>
  <thead>
    <tr>
      <th style="width:14px"></th>
      <th>作　業　内　容　・　使　用　部　品　名</th>
      <th style="width:9%">部品数量</th>
      <th style="width:13%">部品単価</th>
      <th style="width:13%">部品金額</th>
      <th style="width:11%">技　術　料</th>
    </tr>
  </thead>
  <tbody>
    ${sectionTr(`【${state.machine_condition === 'new' ? '新車' : '中古車'}御見積書】`)}
    ${tr('ｅｎｇｃｏｎ 製　チルトローテータ', null, null, null)}
    ${blankTr()}
    ${sectionTr('【詳細】')}
    ${mainRows}
    ${costRows.length > 0 ? blankTr() + extraBlock : ''}
    ${blankTr()}
    ${blankTr()}
    ${blankTr()}
  </tbody>
</table>

<!-- 下部 -->
<div class="bottom">
  <div class="remarks">
    【納期】${state.delivery_date || state.delivery_terms || '別途御協議'}<br>
    <br>
    【備考】<br>
    対象機種：${state.machine_maker}&nbsp;${state.machine_model}<br>
    ${noteLines.map((l) => l + '<br>').join('')}
    御見積書有効期限：御見積作成日より1ヶ月<br>
    振込手数料はお客様ご負担にてお願致します<br>
    香川銀行&emsp;伏石支店&emsp;普通&emsp;3620256<br>
    百十四銀行&emsp;伏石支店&emsp;普通&emsp;0440274<br>
    観音寺信用金庫&emsp;財田支店&emsp;普通&emsp;0099602<br>
    名義人：カ）ジー．トレス<br>
    適格請求書発行事業者登録番号：T6470001016892
  </div>
  <div class="totals">
    <div class="tot-row"><div class="tot-l">技術料合計</div><div class="tot-r">0</div></div>
    <div class="tot-row"><div class="tot-l">部品合計</div><div class="tot-r">${state.subtotal.toLocaleString()}</div></div>
    <div class="tot-row"><div class="tot-l">整備小計</div><div class="tot-r">${state.subtotal.toLocaleString()}</div></div>
    <div class="tot-row"><div class="tot-l">一般消費税</div><div class="tot-r">${state.tax.toLocaleString()}</div></div>
    <div class="tot-row" style="border-bottom:2px solid #000"><div class="tot-l">整備料合計</div><div class="tot-r">${state.total.toLocaleString()}</div></div>
    <div class="grand">
      <span class="grand-lbl">御見積金額</span>
      <span class="grand-val">¥${state.total.toLocaleString()}</span>
    </div>
  </div>
</div>

</body>
</html>`;
}
