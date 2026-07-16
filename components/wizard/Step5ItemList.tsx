'use client';

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
import { calculateSalesPrice, calculateRsmCustomerPrice, roundPrice } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import { appendNote, buildStandardConfigPlan } from '@/lib/standardConfig';
import type { QuoteItem, PriceType } from '@/types/quote';
import InventoryBadge from '@/components/InventoryBadge';
import InventoryAsOfNote from '@/components/InventoryAsOfNote';
import Stepper from '@/components/Stepper';

export default function Step5ItemList() {
  const {
    mount_type, s_standard, ec_model, dc_system, price_type, reseller_rate, machine_maker, machine_model,
    client_type, note, items, setItems, update, nextStep, prevStep,
  } = useWizardStore();
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<Record<string, number> | null>(null);
  const [lookupNo, setLookupNo] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);

  useEffect(() => {
    fetch('/api/inventory')
      .then((r) => r.json())
      .then((data) => setInventory(data))
      .catch(() => setInventory({}));
  }, []);

  useEffect(() => {
    if (items.length === 0) buildDefaultItems();
  }, []);

  async function lookup(item_no: string): Promise<{ price?: number; description?: string }> {
    const { data } = await supabase
      .from('price_master')
      .select('price_jpy, description')
      .eq('item_no', item_no)
      .single();
    return { price: data?.price_jpy, description: data?.description ?? undefined };
  }

  function makeItem(
    fallback_name: string,
    list_price: number | undefined,
    price_type_: PriceType,
    item_no?: string,
    qty = 1,
    official_name?: string
  ): QuoteItem {
    const unit_price = list_price != null ? calculateSalesPrice(list_price, price_type_, reseller_rate) : undefined;
    return {
      sort_order: 0,
      item_no,
      name_ja: official_name ?? fallback_name,
      list_price,
      qty,
      unit_price,
      amount: unit_price != null ? unit_price * qty : undefined,
      is_custom: false,
    };
  }

  async function buildDefaultItems() {
    setLoading(true);

    // 品番プランは lib/standardConfig.ts（純関数）が生成し、
    // ここでは price_master の定価解決と販売価計算のみを行う
    const plan = buildStandardConfigPlan({
      machine_maker, machine_model, mount_type, s_standard, ec_model, dc_system, client_type,
    });

    const built: QuoteItem[] = [];
    for (const planned of plan.items) {
      const info = planned.item_no ? await lookup(planned.item_no) : {};
      built.push(makeItem(planned.fallback_name, info.price, price_type, planned.item_no, planned.qty, info.description));
    }

    if (plan.noteAdditions.length > 0) {
      let updatedNote = note;
      for (const addition of plan.noteAdditions) updatedNote = appendNote(updatedNote, addition);
      if (updatedNote !== note) update({ note: updatedNote });
    }

    const sorted = built.map((item, i) => ({ ...item, sort_order: i + 1 }));
    setItems(sorted);
    setLoading(false);
  }

  function updateItem(index: number, field: keyof QuoteItem, value: number | string | boolean) {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    if (field === 'qty' || field === 'unit_price') {
      const qty = field === 'qty' ? (value as number) : item.qty;
      const up = field === 'unit_price' ? (value as number) : item.unit_price;
      if (up != null) item.amount = roundPrice(up * qty);
    }
    updated[index] = item;
    setItems(updated);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems([...items, { sort_order: items.length + 1, name_ja: '', qty: 1, is_custom: true }]);
  }

  // 品番を入力して価格マスタから品名・定価を引き当てて明細に追加する。
  // 構成品に不足があるとき、品番だけで品目・価格を反映できる。
  async function addByItemNo() {
    const no = lookupNo.trim();
    if (!no) return;
    setLookupBusy(true);
    const r = await lookup(no);
    setLookupBusy(false);
    if (r.price == null && r.description == null) {
      alert(`品番「${no}」は価格マスタに見つかりませんでした。品番をご確認ください（見つからない場合は「+ 空の品目を追加」で手動入力できます）。`);
      return;
    }
    const item = makeItem(r.description ?? no, r.price, price_type, no, 1, r.description);
    setItems([...items, { ...item, sort_order: items.length + 1 }]);
    setLookupNo('');
  }

  function renderAddRow(extraClass = '') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${extraClass}`}>
        <input
          type="text"
          value={lookupNo}
          onChange={(e) => setLookupNo(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addByItemNo(); } }}
          placeholder="品番を入力（例: 1080111）"
          className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-[10rem] focus:outline-none focus:ring-1 focus:ring-black"
        />
        <button onClick={addByItemNo} disabled={lookupBusy}
          className="bg-primary hover:bg-neutral-800 disabled:bg-gray-400 text-white text-sm px-4 py-2 rounded whitespace-nowrap shrink-0">
          {lookupBusy ? '検索中...' : '品番で追加'}
        </button>
        <button onClick={addItem} className="text-sm text-black hover:underline whitespace-nowrap shrink-0">+ 空の品目を追加</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {loading ? (
        <p className="text-gray-500">標準構成を読み込み中...</p>
      ) : (
        <>
        <InventoryAsOfNote className="mb-1" />
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-3 py-2 text-left">品名</th>
                <th className="border border-gray-200 px-3 py-2 text-left w-24">品番</th>
                <th className="border border-gray-200 px-3 py-2 text-center w-24">在庫</th>
                <th className="border border-gray-200 px-3 py-2 text-right w-24">定価</th>
                <th className="border border-gray-200 px-3 py-2 text-right w-16">数量</th>
                <th className="border border-gray-200 px-3 py-2 text-right w-24">販売価</th>
                <th className="border border-gray-200 px-3 py-2 text-right w-24">金額</th>
                {price_type === 'rsm' && (
                  <>
                    <th className="border border-gray-200 px-3 py-2 text-right w-24">御客様販売価</th>
                    <th className="border border-gray-200 px-3 py-2 text-right w-24">御客様販売金額</th>
                  </>
                )}
                <th className="border border-gray-200 px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className={`hover:bg-gray-50 ${item.list_price == null && !item.is_custom ? 'bg-yellow-50' : ''}`}>
                  <td className="border border-gray-200 px-2 py-1">
                    {item.is_custom ? (
                      <input type="text" value={item.name_ja}
                        onChange={(e) => updateItem(i, 'name_ja', e.target.value)}
                        className="w-full border-0 focus:outline-none focus:ring-1 focus:ring-black rounded px-1" />
                    ) : (
                      <span>{item.name_ja}</span>
                    )}
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-xs text-gray-500">
                    {item.item_no ?? '—'}
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-center">
                    <InventoryBadge itemNo={item.item_no} inventory={inventory} />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-right">
                    {item.list_price != null ? item.list_price.toLocaleString() : <span className="text-yellow-600 text-xs">要確認</span>}
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <Stepper value={item.qty} onChange={(v) => updateItem(i, 'qty', v)} />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-right">
                    <input type="number" min={0} value={item.unit_price ?? ''}
                      onChange={(e) => updateItem(i, 'unit_price', parseInt(e.target.value) || 0)}
                      placeholder="—"
                      className="w-24 text-right border border-gray-200 rounded px-1 focus:outline-none focus:ring-1 focus:ring-black" />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-right">
                    {item.amount != null ? item.amount.toLocaleString() : '—'}
                  </td>
                  {price_type === 'rsm' && (
                    <>
                      <td className="border border-gray-200 px-2 py-1 text-right">
                        {item.list_price != null ? calculateRsmCustomerPrice(item.list_price).toLocaleString() : '—'}
                      </td>
                      <td className="border border-gray-200 px-2 py-1 text-right">
                        {item.list_price != null ? (calculateRsmCustomerPrice(item.list_price) * item.qty).toLocaleString() : '—'}
                      </td>
                    </>
                  )}
                  <td className="border border-gray-200 px-2 py-1 text-center">
                    <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {renderAddRow('mt-3')}
        </div>

        {/* モバイル：品目カード */}
        <div className="md:hidden space-y-3">
          {items.map((item, i) => (
            <div key={i} className={`border rounded-lg p-3 space-y-2 ${item.list_price == null && !item.is_custom ? 'bg-yellow-50 border-yellow-200' : 'border-gray-200'}`}>
              <div className="flex justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {item.is_custom ? (
                    <input type="text" value={item.name_ja} placeholder="品名"
                      onChange={(e) => updateItem(i, 'name_ja', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                  ) : (
                    <p className="text-sm font-medium break-words">{item.name_ja}</p>
                  )}
                  <p className="font-mono text-xs text-gray-500 mt-0.5">{item.item_no ?? '—'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <InventoryBadge itemNo={item.item_no} inventory={inventory} />
                  <button onClick={() => removeItem(i)} className="text-red-500 text-xs">✕ 削除</button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-gray-500">
                  定価 {item.list_price != null ? `¥${item.list_price.toLocaleString()}` : <span className="text-yellow-600">要確認</span>}
                </span>
                <Stepper value={item.qty} onChange={(v) => updateItem(i, 'qty', v)} />
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <label className="text-gray-500">販売価</label>
                <div className="flex items-center gap-1">
                  <span>¥</span>
                  <input type="number" min={0} value={item.unit_price ?? ''} placeholder="—"
                    onChange={(e) => updateItem(i, 'unit_price', parseInt(e.target.value) || 0)}
                    className="w-28 text-right border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-black tabular-nums" />
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 pt-2">
                <span className="text-sm text-gray-500">金額</span>
                <span className="font-semibold tabular-nums">{item.amount != null ? `¥${item.amount.toLocaleString()}` : '—'}</span>
              </div>
              {price_type === 'rsm' && item.list_price != null && (
                <div className="flex justify-between text-xs text-gray-500 tabular-nums">
                  <span>御客様販売価 ¥{calculateRsmCustomerPrice(item.list_price).toLocaleString()}</span>
                  <span>金額 ¥{(calculateRsmCustomerPrice(item.list_price) * item.qty).toLocaleString()}</span>
                </div>
              )}
            </div>
          ))}
          {renderAddRow('')}
        </div>
        </>
      )}

      <div className="flex justify-between gap-3 -mx-8 px-8 pt-3 pb-3 mt-2 sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-200">
        <button onClick={prevStep} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">← 戻る</button>
        <button onClick={nextStep} className="bg-primary hover:bg-neutral-800 text-white font-medium px-8 py-3 rounded-lg transition">次へ →</button>
      </div>
    </div>
  );
}
