'use client';

import { useState } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
import { calcFreight, calcTax } from '@/lib/pricing';

export default function Step10Confirm() {
  const state = useWizardStore();
  const [loading, setLoading] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState<string | null>(null);

  const freight = calcFreight(state.pallet_count);
  const travelTotal = state.travel_unit_cost * state.travel_count;
  const guidanceTotal = state.guidance_unit_cost * state.guidance_count;
  const extraTotal = state.extra_costs.reduce((s, e) => s + e.amount, 0);
  const itemsTotal = state.items.reduce((s, i) => s + (i.amount ?? 0), 0);
  const subtotal = itemsTotal + freight + state.install_cost + state.hose_parts_cost + travelTotal + guidanceTotal + extraTotal;
  const tax = calcTax(subtotal);
  const total = subtotal + tax;

  async function handlePdf() {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state, subtotal, tax, total }),
      });
      if (!res.ok) throw new Error('PDF生成に失敗しました');
      const data = await res.json();
      setQuoteNumber(data.quoteNumber);

      const pdfRes = await fetch(`/api/generate-pdf?id=${data.quoteId}`);
      if (pdfRes.ok) {
        const blob = await pdfRes.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.quoteNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">STEP 10：確認・出力</h2>

      {quoteNumber && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          見積番号 <strong>{quoteNumber}</strong> で保存しました。
        </div>
      )}

      <Section title="作成者情報">
        <Row label="種別" value={state.creator_type === 'gtres' ? 'G.TRES社員' : 'ディーラー'} />
        <Row label="会社名" value={state.creator_company} />
        <Row label="担当者名" value={state.creator_name} />
      </Section>

      <Section title="見積先情報">
        <Row label="種別" value={{ dealer: 'ディーラー向け', reseller: '未登録販売店向け', enduser: 'エンドユーザー・その他' }[state.client_type]} />
        <Row label="見積先名" value={state.client_name} />
      </Section>

      <Section title="ベースマシン">
        <Row label="状態" value={state.machine_condition === 'new' ? '新車' : '中古車'} />
        <Row label="メーカー" value={state.machine_maker} />
        <Row label="機種名" value={state.machine_model} />
        {state.machine_year && <Row label="製造年月" value={state.machine_year} />}
        <Row label="取付方式" value={state.mount_type === 'SW' ? 'サンドイッチ（SW）' : 'ダイレクトマウント（DM）'} />
        <Row label="S規格" value={state.s_standard} />
        <Row label="ECモデル" value={state.ec_model} />
        <Row label="DCシステム" value={state.dc_system} />
      </Section>

      <Section title="品目一覧">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left py-1 px-2">品名</th>
              <th className="text-right py-1 px-2">定価</th>
              <th className="text-right py-1 px-2">数量</th>
              <th className="text-right py-1 px-2">販売価</th>
              <th className="text-right py-1 px-2">金額</th>
            </tr>
          </thead>
          <tbody>
            {state.items.map((item, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="py-1 px-2">{item.name_ja}</td>
                <td className="py-1 px-2 text-right">{item.list_price?.toLocaleString() ?? '—'}</td>
                <td className="py-1 px-2 text-right">{item.qty}</td>
                <td className="py-1 px-2 text-right">{item.unit_price?.toLocaleString() ?? '—'}</td>
                <td className="py-1 px-2 text-right">{item.amount?.toLocaleString() ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="追加費用">
        {freight > 0 && <Row label={`国内運賃（${state.pallet_count}パレット）`} value={`¥${freight.toLocaleString()}`} />}
        {state.install_cost > 0 && <Row label="取付費用" value={`¥${state.install_cost.toLocaleString()}`} />}
        {state.hose_parts_cost > 0 && <Row label="ホース取付部材" value={`¥${state.hose_parts_cost.toLocaleString()}`} />}
        {travelTotal > 0 && <Row label={`出張費用（${state.travel_count}回）`} value={`¥${travelTotal.toLocaleString()}`} />}
        {guidanceTotal > 0 && <Row label={`納入指導費（${state.guidance_count}回）`} value={`¥${guidanceTotal.toLocaleString()}`} />}
        {state.extra_costs.map((ec, i) => ec.amount > 0 && <Row key={i} label={ec.name || `その他${i + 1}`} value={`¥${ec.amount.toLocaleString()}`} />)}
      </Section>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span>小計（税抜）</span><span className="font-medium">¥{subtotal.toLocaleString()}</span></div>
        <div className="flex justify-between"><span>消費税（10%）</span><span>¥{tax.toLocaleString()}</span></div>
        <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
          <span>御見積金額（税込）</span><span className="text-blue-700">¥{total.toLocaleString()}</span>
        </div>
      </div>

      {state.has_ict && (
        <Section title="ICT情報">
          <Row label="メーカー" value={state.ict_maker} />
          <Row label="機種名" value={state.ict_model} />
          {state.ict_note && <Row label="備考" value={state.ict_note} />}
        </Section>
      )}

      <div className="flex justify-between pt-4">
        <button onClick={state.prevStep} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">← 戻る</button>
        <button onClick={handlePdf} disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium px-8 py-3 rounded-lg transition">
          {loading ? '生成中...' : 'PDFを出力する'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 font-medium text-sm text-gray-700">{title}</div>
      <div className="p-4 space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex text-sm gap-4">
      <span className="text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}
