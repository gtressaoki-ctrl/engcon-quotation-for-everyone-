import type { WizardState } from '@/types/quote';

interface Props {
  state: WizardState & { subtotal: number; tax: number; total: number };
  quoteNumber: string;
  createdAt: string;
}

export function QuoteTemplate({ state, quoteNumber, createdAt }: Props) {
  const freight = state.pallet_count * 35000;
  const travelTotal = state.travel_unit_cost * state.travel_count;
  const guidanceTotal = state.guidance_unit_cost * state.guidance_count;

  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif; font-size: 11px; color: #000; padding: 20px; }
          h1 { font-size: 20px; text-align: center; letter-spacing: 0.5em; margin-bottom: 16px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 16px; }
          .client-block { font-size: 13px; }
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
        `}</style>
      </head>
      <body>
        <h1>御　見　積　書</h1>

        <div className="header">
          <div className="client-block">
            <p className="client-name">{state.client_name}　御中</p>
          </div>
          <div className="date-block">
            <p>御見積作成日：{createdAt}</p>
            <p>見積番号：{quoteNumber}</p>
          </div>
        </div>

        <div className="info-block">
          <div className="left-info">
            <p>下記の通り御見積り申し上げますので、</p>
            <p>何卒御用命賜りたく、御願い申し上げます。</p>
            <br />
            <p className="total-amount">御見積金額：¥{state.total.toLocaleString()}（消費税含）</p>
            <p>受　渡　場　所：貴社御指定の場所</p>
            <p>受　渡　期　限：{state.delivery_terms}</p>
            <p>御　支　払　条　件：{state.payment_terms}</p>
            <p>見積有効期限：見積日から1カ月</p>
          </div>
          <div className="right-info">
            <p><strong>株式会社 G.TRES</strong></p>
            <p>〒761-0301</p>
            <p>香川県高松市2008番地1</p>
            <p>TEL/FAX：087-868-2677</p>
            <br />
            <p style={{ color: '#999', fontSize: '9px' }}>[ロゴ・角印]</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ width: '40%' }}>機種 / 特別仕様 / 付属品等</th>
              <th style={{ width: '12%' }}>定価</th>
              <th style={{ width: '6%' }}>数量</th>
              <th style={{ width: '6%' }}>単位</th>
              <th style={{ width: '12%' }}>販売価</th>
              <th style={{ width: '14%' }}>金額</th>
            </tr>
          </thead>
          <tbody>
            <tr className="section-header">
              <td colSpan={6}>
                【{state.machine_condition === 'new' ? '新車' : '中古車'}販売】engcon製チルトローテータ
                　{state.mount_type === 'SW' ? 'サンドイッチ' : 'ダイレクトマウント'}
                　対象機種：{state.machine_maker} {state.machine_model}
              </td>
            </tr>
            <tr>
              <td colSpan={6} style={{ paddingLeft: '12px', fontSize: '10px', color: '#555' }}>【詳細】</td>
            </tr>
            {state.items.map((item, i) => (
              <tr key={i}>
                <td>{item.item_no ? `${item.item_no}　` : ''}{item.name_ja}</td>
                <td className="text-right">{item.list_price?.toLocaleString() ?? ''}</td>
                <td className="text-center">{item.qty}</td>
                <td className="text-center">式</td>
                <td className="text-right">{item.unit_price?.toLocaleString() ?? ''}</td>
                <td className="text-right">{item.amount?.toLocaleString() ?? ''}</td>
              </tr>
            ))}
            {freight > 0 && (
              <tr>
                <td>国内運賃</td>
                <td className="text-right">35,000</td>
                <td className="text-center">{state.pallet_count}</td>
                <td className="text-center">便</td>
                <td className="text-right">35,000</td>
                <td className="text-right">{freight.toLocaleString()}</td>
              </tr>
            )}
            {state.install_cost > 0 && (
              <tr>
                <td>取付費用</td><td></td><td className="text-center">1</td><td className="text-center">式</td>
                <td className="text-right">{state.install_cost.toLocaleString()}</td>
                <td className="text-right">{state.install_cost.toLocaleString()}</td>
              </tr>
            )}
            {state.hose_parts_cost > 0 && (
              <tr>
                <td>ホース取付部材一式</td><td></td><td className="text-center">1</td><td className="text-center">式</td>
                <td className="text-right">{state.hose_parts_cost.toLocaleString()}</td>
                <td className="text-right">{state.hose_parts_cost.toLocaleString()}</td>
              </tr>
            )}
            {travelTotal > 0 && (
              <tr>
                <td>出張費用</td>
                <td className="text-right">{state.travel_unit_cost.toLocaleString()}</td>
                <td className="text-center">{state.travel_count}</td>
                <td className="text-center">回</td>
                <td className="text-right">{state.travel_unit_cost.toLocaleString()}</td>
                <td className="text-right">{travelTotal.toLocaleString()}</td>
              </tr>
            )}
            {guidanceTotal > 0 && (
              <tr>
                <td>納入指導費</td>
                <td className="text-right">{state.guidance_unit_cost.toLocaleString()}</td>
                <td className="text-center">{state.guidance_count}</td>
                <td className="text-center">回</td>
                <td className="text-right">{state.guidance_unit_cost.toLocaleString()}</td>
                <td className="text-right">{guidanceTotal.toLocaleString()}</td>
              </tr>
            )}
            {state.extra_costs.filter(e => e.amount > 0).map((ec, i) => (
              <tr key={i}>
                <td>{ec.name}</td><td></td><td className="text-center">1</td><td className="text-center">式</td>
                <td className="text-right">{ec.amount.toLocaleString()}</td>
                <td className="text-right">{ec.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="footer-row">
              <td colSpan={5} style={{ textAlign: 'right', paddingRight: '24px' }}>計</td>
              <td style={{ borderTop: '1px solid #ccc', textAlign: 'right', padding: '4px 6px' }}>
                {state.subtotal.toLocaleString()}
              </td>
            </tr>
            <tr className="footer-row">
              <td colSpan={5} style={{ textAlign: 'right', paddingRight: '24px' }}>消費税</td>
              <td style={{ borderTop: '1px solid #ccc', textAlign: 'right', padding: '4px 6px' }}>
                {state.tax.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>

        {(state.note || state.has_ict || state.delivery_location) && (
          <div className="remarks">
            <h4>【備考】</h4>
            <p>対象機種：{state.machine_maker} {state.machine_model}</p>
            {state.delivery_location && <p>取付場所：{state.delivery_location}</p>}
            {state.note && <p>{state.note}</p>}
            {state.has_ict && (
              <p>
                ICT取付予定あり（{state.ict_maker} {state.ict_model}）
                　ICTをご利用になる場合は別途 Grade Indication for 3rd party が必要になる場合があります。
              </p>
            )}
          </div>
        )}
      </body>
    </html>
  );
}
