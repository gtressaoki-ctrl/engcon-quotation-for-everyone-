'use client';

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/lib/wizardStore';
import { calculateSalesPrice } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import { ATTACHMENT_CATEGORIES, getStdNum } from '@/lib/attachmentCategories';
import Stepper from '@/components/Stepper';
import InventoryAsOfNote from '@/components/InventoryAsOfNote';
import { useViewerIsDealer } from '@/lib/useViewerIsDealer';
import type { QuoteItem } from '@/types/quote';

function parseBucketSize(description: string): string | null {
  const match = description.match(/-(\d+)-(\d+)/);
  if (!match) return null;
  return `${match[1]}ℓ ${match[2]}㎜`;
}

interface Variant {
  item_no: string;
  description: string;
  price_jpy: number;
}

export default function Step6bVariants() {
  const { s_standard, price_type, pending_attachments, items, setItems, update, nextStep, prevStep } = useWizardStore();
  const isDealer = useViewerIsDealer();
  const [variants, setVariants] = useState<Record<string, Variant[]>>({});
  // category_id → { item_no → qty }。複数品番を同時に選択・各々数量指定できる。
  const [selections, setSelections] = useState<Record<string, Record<string, number>>>({});
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
    const autoSel: Record<string, Record<string, number>> = {};

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

      // Auto-select if only one option（Step6で指定した数量を引き継ぐ）
      if (rows.length === 1) {
        autoSel[catId] = { [rows[0].item_no]: pending_attachments[catId] || 1 };
      }
    }

    setVariants(result);
    if (Object.keys(autoSel).length > 0) {
      setSelections((prev) => ({ ...prev, ...autoSel }));
    }
    setLoading(false);
  }

  function toggleVariant(catId: string, itemNo: string) {
    setSelections((prev) => {
      const cur = { ...(prev[catId] ?? {}) };
      if (cur[itemNo] !== undefined) {
        delete cur[itemNo];
      } else {
        cur[itemNo] = 1;
      }
      return { ...prev, [catId]: cur };
    });
  }

  function setVariantQty(catId: string, itemNo: string, qty: number) {
    setSelections((prev) => ({
      ...prev,
      [catId]: { ...(prev[catId] ?? {}), [itemNo]: qty },
    }));
  }

  function handleNext() {
    const newItems: QuoteItem[] = [];
    const startSort = items.length + 1;

    for (const catId of selectedCategories) {
      const cat = ATTACHMENT_CATEGORIES.find((c) => c.id === catId)!;
      const variantList = variants[catId] ?? [];
      const catSel = selections[catId] ?? {};
      const selectedItemNos = Object.keys(catSel);

      if (selectedItemNos.length > 0) {
        // 選択された各品番を個別の明細として追加（同カテゴリで複数品番OK）
        for (const v of variantList) {
          const qty = catSel[v.item_no];
          if (qty === undefined || qty <= 0) continue;
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
        }
        continue;
      }

      // No catalog or no selection → add as custom
      newItems.push({
        sort_order: startSort + newItems.length,
        name_ja: cat.label_ja,
        qty: pending_attachments[catId] || 1,
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
        <p className="text-gray-500 text-sm">アタッチメントが選択されていません。</p>
        <div className="flex justify-between gap-3 -mx-8 px-8 pt-3 pb-3 mt-2 sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-200">
          <button onClick={prevStep} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">← 戻る</button>
          <button onClick={() => { update({ pending_attachments: {} }); nextStep(); }}
            className="bg-primary hover:bg-neutral-800 text-white font-medium px-8 py-3 rounded-lg transition">次へ →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500">S規格：<strong>{s_standard}</strong> に対応する品番を選択してください。<br />同じアタッチメントでも複数の品番を選択でき、それぞれ数量を指定できます。</p>
      <InventoryAsOfNote />

      {loading ? (
        <p className="text-gray-500 text-sm">候補を読み込み中...</p>
      ) : (
        <div className="space-y-6">
          {selectedCategories.map((catId) => {
            const cat = ATTACHMENT_CATEGORIES.find((c) => c.id === catId)!;
            const variantList = variants[catId] ?? [];
            const catSel = selections[catId] ?? {};

            return (
              <div key={catId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-700">{cat.label_ja}</h3>
                  <span className="text-xs text-gray-500">選択中: {Object.keys(catSel).length}件</span>
                </div>

                {variantList.length === 0 ? (
                  <p className="text-sm text-yellow-600">カタログ品番なし — Step8（品目一覧）で手動入力してください</p>
                ) : (
                  <div className="space-y-1 max-h-72 overflow-y-auto">
                    {[...variantList].sort((a, b) => {
                      // 在庫あり→上、在庫データなし→中、在庫なし→下
                      const rank = (no: string) => {
                        const s = inventory[no];
                        if (s === undefined) return 1;
                        return s > 0 ? 0 : 2;
                      };
                      return rank(a.item_no) - rank(b.item_no);
                    }).map((v) => {
                      const stock = inventory[v.item_no] ?? null;
                      const outOfStock = stock !== null && stock <= 0;
                      const checked = catSel[v.item_no] !== undefined;
                      return (
                        // 在庫切れでも選択可能（赤字表示のみ・実在庫数は出さない）
                        <div key={v.item_no} className={`flex items-start gap-2 text-sm rounded px-2 py-1.5 ${checked ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                          <label className="flex items-start gap-2 flex-1 cursor-pointer min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleVariant(catId, v.item_no)}
                              className="w-4 h-4 text-black mt-0.5 shrink-0"
                            />
                            <span className={`flex-1 min-w-0 ${outOfStock ? 'text-red-500' : ''}`}>
                              <span className="font-mono text-xs text-gray-600">{v.item_no}</span>
                              {'　'}
                              {v.description}
                              {parseBucketSize(v.description) && (
                                <span className="ml-2 text-xs text-black font-medium">
                                  {parseBucketSize(v.description)}
                                </span>
                              )}
                              <span className="block text-gray-500 text-xs mt-0.5">
                                ¥{v.price_jpy.toLocaleString()}
                                {stock !== null && (
                                  <span className={`ml-2 font-medium ${outOfStock ? 'text-red-500' : 'text-green-600'}`}>
                                    ● {outOfStock ? '在庫なし' : '在庫あり'}{!isDealer ? `（${stock}）` : ''}
                                  </span>
                                )}
                              </span>
                            </span>
                          </label>
                          {checked && (
                            <div className="shrink-0">
                              <Stepper value={catSel[v.item_no]} onChange={(q) => setVariantQty(catId, v.item_no, q)} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between gap-3 -mx-8 px-8 pt-3 pb-3 mt-2 sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-200">
        <button onClick={prevStep} className="border border-gray-300 hover:bg-gray-100 px-8 py-3 rounded-lg transition">← 戻る</button>
        <button onClick={handleNext} disabled={loading}
          className="bg-primary hover:bg-neutral-800 disabled:bg-gray-400 text-white font-medium px-8 py-3 rounded-lg transition">次へ →</button>
      </div>
    </div>
  );
}
