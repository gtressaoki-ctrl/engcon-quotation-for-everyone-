'use client';

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
import { calculateSalesPrice } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import { ATTACHMENT_CATEGORIES, getStdNum } from '@/lib/attachmentCategories';
import type { QuoteItem } from '@/types/quote';

interface Variant {
  item_no: string;
  description: string;
  price_jpy: number;
}

export default function Step6bVariants() {
  const { s_standard, price_type, pending_attachments, items, setItems, update, nextStep, prevStep } = useWizardStore();
  const [variants, setVariants] = useState<Record<string, Variant[]>>({});
  const [selections, setSelections] = useState<Record<string, string>>({});  // category_id → item_no
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<Record<string, number>>({});

  const selectedCategories = Object.keys(pending_attachments).filter((id) => pending_attachments[id] > 0);
  const stdNum = getStdNum(s_standard);

  useEffect(() => {
    if (selectedCategories.length === 0) { setLoading(false); return; }
    fetchAllVariants();
  }, []);

  useEffect(() => {
    fetch('/api/inventory').then((r) => r.json()).then(setInventory).catch(() => {});
  }, []);

  async function fetchAllVariants() {
    setLoading(true);
    const result: Record<string, Variant[]> = {};

    for (const catId of selectedCategories) {
      const cat = ATTACHMENT_CATEGORIES.find((c) => c.id === catId);
      if (!cat) continue;

      const patterns = cat.getPatterns(stdNum);

      if (patterns.length === 0) {
        // グラップルソー等 - no catalog, will add as custom
        result[catId] = [];
        continue;
      }

      const orClause = patterns.map((p) => `description.ilike.${p}`).join(',');
      const { data } = await supabase
        .from('price_master')
        .select('item_no, description, price_jpy')
        .or(orClause)
        .order('description')
        .limit(100);

      let rows = (data ?? []) as Variant[];
      if (cat.keepFn) rows = rows.filter((r) => cat.keepFn!(r.description));

      // Deduplicate by item_no
      const seen = new Set<string>();
      rows = rows.filter((r) => { if (seen.has(r.item_no)) return false; seen.add(r.item_no); return true; });

      result[catId] = rows;

      // Auto-select if only one option
      if (rows.length === 1) {
        setSelections((prev) => ({ ...prev, [catId]: rows[0].item_no }));
      }
    }

    setVariants(result);
    setLoading(false);
  }

  function handleNext() {
    const newItems: QuoteItem[] = [];
    const startSort = items.length + 1;

    for (const catId of selectedCategories) {
      const qty = pending_attachments[catId];
      const cat = ATTACHMENT_CATEGORIES.find((c) => c.id === catId)!;
      const selectedItemNo = selections[catId];
      const variantList = variants[catId] ?? [];

      if (selectedItemNo) {
        const v = variantList.find((r) => r.item_no === selectedItemNo);
        if (v) {
          const unit_price = calculateSalesPrice(v.price_jpy, price_type);
          newItems.push({
            sort_order: startSort + newItems.length,
            item_no: v.item_no,
            name_ja: v.description,
            list_price: v.price_jpy,
            qty,
            unit_price,
            amount: unit_price * qty,
            is_custom: false,
          });
          continue;
        }
      }

      // No catalog or no selection → add as custom
      newItems.push({
        sort_order: startSort + newItems.length,
        name_ja: cat.label_ja,
        qty,
        is_custom: true,
      });
    }

    setItems([...items, ...newItems]);
    update({ pending_attachments: {} });
    nextStep();
  }

  if (selectedCategories.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-700">STEP 7：アタッチメント詳細選択</h2>
        <p className="text-gray-500 text-sm">アタッチメントが選択されていません。</p>
        <div className="flex justify-between pt-4">
          <button onClick={prevStep} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">← 戻る</button>
          <button onClick={() => { update({ pending_attachments: {} }); nextStep(); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition">次へ →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">STEP 7：アタッチメント詳細選択</h2>
      <p className="text-xs text-gray-500">S規格：<strong>{s_standard}</strong> に対応する品番を選択してください。</p>

      {loading ? (
        <p className="text-gray-500 text-sm">候補を読み込み中...</p>
      ) : (
        <div className="space-y-6">
          {selectedCategories.map((catId) => {
            const cat = ATTACHMENT_CATEGORIES.find((c) => c.id === catId)!;
            const variantList = variants[catId] ?? [];
            const qty = pending_attachments[catId];

            return (
              <div key={catId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-700">{cat.label_ja}</h3>
                  <span className="text-xs text-gray-500">数量: {qty}</span>
                </div>

                {variantList.length === 0 ? (
                  <p className="text-sm text-yellow-600">カタログ品番なし — Step8（品目一覧）で手動入力してください</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {variantList.map((v) => (
                      <label key={v.item_no} className="flex items-start gap-2 cursor-pointer text-sm hover:bg-gray-50 rounded px-2 py-1">
                        <input
                          type="radio"
                          name={catId}
                          value={v.item_no}
                          checked={selections[catId] === v.item_no}
                          onChange={() => setSelections((prev) => ({ ...prev, [catId]: v.item_no }))}
                          className="w-4 h-4 text-blue-600 mt-0.5 shrink-0"
                        />
                        <span className="flex-1">
                          <span className="font-mono text-xs text-gray-600">{v.item_no}</span>
                          {'　'}
                          {v.description}
                        </span>
                        <span className="text-gray-500 shrink-0">¥{v.price_jpy.toLocaleString()}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button onClick={prevStep} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">← 戻る</button>
        <button onClick={handleNext} disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium px-8 py-3 rounded-lg transition">次へ →</button>
      </div>
    </div>
  );
}
