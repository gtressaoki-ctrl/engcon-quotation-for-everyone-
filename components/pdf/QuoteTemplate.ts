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

  const itemRows = state.items.map((item) => `
    <tr>
      <td>${item.item_no ? `${item.item_no}　` : ''}${item.name_ja}</td>
      <td class="text-right">${item.list_price != null ? item.list_price.toLocaleString() : ''}</td>
      <td class="text-center">${item.qty}</td>
      <td class="text-center">式</td>
      <td class="text-right">${item.unit_price != null ? item.unit_price.toLocaleString() : ''}</td>
      <td class="text-right">${item.amount != null ? item.amount.toLocaleString() : ''}</td>
    </tr>`).join('');

  const freightRow = freight > 0 ? `
    <tr>
      <td>国内運賃</td>
      <td class="text-right">35,000</td>
      <td class="text-center">${state.pallet_count}</td>
      <td class="text-center">便</td>
      <td class="text-right">35,000</td>
      <td class="text-right">${freight.toLocaleString()}</td>
    </tr>` : '';

  const installRow = state.install_cost > 0 ? `
    <tr>
      <td>取付費用</td><td></td><td class="text-center">1</td><td class="text-center">式</td>
      <td class="text-right">${state.install_cost.toLocaleString()}</td>
      <td class="text-right">${state.install_cost.toLocaleString()}</td>
    </tr>` : '';

  const hoseRow = state.hose_parts_cost > 0 ? `
    <tr>
      <td>ホース取付部材一式</td><td></td><td class="text-center">1</td><td class="text-center">式</td>
      <td class="text-right">${state.hose_parts_cost.toLocaleString()}</td>
      <td class="text-right">${state.hose_parts_cost.toLocaleString()}</td>
    </tr>` : '';

  const travelRow = travelTotal > 0 ? `
    <tr>
      <td>出張費用</td>
      <td class="text-right">${state.travel_unit_cost.toLocaleString()}</td>
      <td class="text-center">${state.travel_count}</td>
      <td class="text-center">回</td>
      <td class="text-right">${state.travel_unit_cost.toLocaleString()}</td>
      <td class="text-right">${travelTotal.toLocaleString()}</td>
    </tr>` : '';

  const guidanceRow = guidanceTotal > 0 ? `
    <tr>
      <td>納入指導費</td>
      <td class="text-right">${state.guidance_unit_cost.toLocaleString()}</td>
      <td class="text-center">${state.guidance_count}</td>
      <td class="text-center">回</td>
      <td class="text-right">${state.guidance_unit_cost.toLocaleString()}</td>
      <td class="text-right">${guidanceTotal.toLocaleString()}</td>
    </tr>` : '';

  const extraRows = state.extra_costs
    .filter((e) => e.amount > 0)
    .map((ec) => `
    <tr>
      <td>${ec.name}</td><td></td><td class="text-center">1</td><td class="text-center">式</td>
      <td class="text-right">${ec.amount.toLocaleString()}</td>
      <td class="text-right">${ec.amount.toLocaleString()}</td>
    </tr>`).join('');

  const remarksBlock = (state.note || state.has_ict || state.delivery_location) ? `
    <div class="remarks">
      <h4>【備考】</h4>
      <p>対象機種：${state.machine_maker} ${state.machine_model}</p>
      ${state.delivery_location ? `<p>取付場所：${state.delivery_location}</p>` : ''}
      ${state.note ? `<p>${state.note}</p>` : ''}
      ${state.has_ict ? `<p>ICT取付予定あり（${state.ict_maker} ${state.ict_model}）　ICTをご利用になる場合は別途 Grade Indication for 3rd party が必要になる場合があります。</p>` : ''}
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Hiragino Kaku Gothic ProN', sans-serif; font-size: 11px; color: #000; padding: 20px; }
    h1 { font-size: 20px; text-align: center; letter-spacing: 0.5em; margin-bottom: 16px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 16px; }
    .client-name { font-size: 16px; font-weight: bold; }
    .date-block { text-align: right; font-size: 11px; }
    .info-block { display: flex; justify-content: space-between; margin-bottom: 16px; }
    .left-info p { margin-bottom: 4px; }
    .total-amount { font-size: 15px; font-weight: bold; }
    .right-info { text-align: right; font-size: 11px; border: 1px solid #ccc; padding: 8px; min-width: 180px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; }
    th { background: #f0f0f0; border: 1px solid #ccc; padding: 4px 6px; text-align: center; }
    td { border: 1px solid #ccc; padding: 4px 6px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .section-header { background: #e8e8e8; font-weight: bold; }
    .footer-row td { border: none; text-align: right; padding: 3px 6px; }
    .remarks { margin-top: 12px; font-size: 10px; }
    .remarks h4 { font-weight: bold; margin-bottom: 4px; }
  </style>
</head>
<body>
  <h1>御　見　積　書</h1>
  <div class="header">
    <div><p class="client-name">${state.client_name}　御中</p></div>
    <div class="date-block">
      <p>御見積作成日：${createdAt}</p>
      <p>見積番号：${quoteNumber}</p>
    </div>
  </div>
  <div class="info-block">
    <div class="left-info">
      <p>下記の通り御見積り申し上げますので、</p>
      <p>何卒御用命賜りたく、御願い申し上げます。</p>
      <br />
      <p class="total-amount">御見積金額：¥${state.total.toLocaleString()}（消費税含）</p>
      <p>受　渡　場　所：貴社御指定の場所</p>
      <p>受　渡　期　限：${state.delivery_terms}</p>
      <p>御　支　払　条　件：${state.payment_terms}</p>
      <p>見積有効期限：見積日から1カ月</p>
    </div>
    <div class="right-info">
      <p><strong>株式会社 G.TRES</strong></p>
      <p>〒761-0301</p>
      <p>香川県高松市2008番地1</p>
      <p>TEL/FAX：087-868-2677</p>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:40%">機種 / 特別仕様 / 付属品等</th>
        <th style="width:12%">定価</th>
        <th style="width:6%">数量</th>
        <th style="width:6%">単位</th>
        <th style="width:12%">販売価</th>
        <th style="width:14%">金額</th>
      </tr>
    </thead>
    <tbody>
      <tr class="section-header">
        <td colspan="6">【${state.machine_condition === 'new' ? '新車' : '中古車'}販売】engcon製チルトローテータ　${state.mount_type === 'SW' ? 'サンドイッチ' : 'ダイレクトマウント'}　対象機種：${state.machine_maker} ${state.machine_model}</td>
      </tr>
      <tr><td colspan="6" style="padding-left:12px;font-size:10px;color:#555">【詳細】</td></tr>
      ${itemRows}
      ${freightRow}
      ${installRow}
      ${hoseRow}
      ${travelRow}
      ${guidanceRow}
      ${extraRows}
    </tbody>
    <tfoot>
      <tr class="footer-row">
        <td colspan="5" style="text-align:right;padding-right:24px">計</td>
        <td style="border-top:1px solid #ccc;text-align:right;padding:4px 6px">${state.subtotal.toLocaleString()}</td>
      </tr>
      <tr class="footer-row">
        <td colspan="5" style="text-align:right;padding-right:24px">消費税</td>
        <td style="border-top:1px solid #ccc;text-align:right;padding:4px 6px">${state.tax.toLocaleString()}</td>
      </tr>
    </tfoot>
  </table>
  ${remarksBlock}
</body>
</html>`;
}
