'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import InventoryBadge from '@/components/InventoryBadge';

interface PriceRow {
  item_no: string;
  description: string | null;
  price_jpy: number | null;
}

export default function PriceLookupPage() {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [inventory, setInventory] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/inventory').then((r) => r.json()).then(setInventory).catch(() => {});
  }, []);

  async function search() {
    const q = query.trim();
    if (!q) { setRows([]); setSearched(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('price_master')
      .select('item_no, description, price_jpy')
      .or(`item_no.ilike.%${q}%,description.ilike.%${q}%`)
      .order('item_no', { ascending: true })
      .limit(100);
    setRows((data as PriceRow[]) ?? []);
    setSearched(true);
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') search();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">品番から金額を確認</h1>
          <Link href="/" className="text-sm text-blue-600 hover:underline">← トップへ</Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">品番 または 品名</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="例：1080310 / Direct connect"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={search}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition whitespace-nowrap shrink-0"
            >
              検索
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm mt-6 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">検索中...</div>
          ) : searched && rows.length === 0 ? (
            <div className="p-8 text-center text-gray-400">一致する品番が見つかりませんでした</div>
          ) : rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="text-left px-4 py-3 whitespace-nowrap">品番</th>
                    <th className="text-left px-4 py-3">品名</th>
                    <th className="text-center px-4 py-3 whitespace-nowrap">在庫</th>
                    <th className="text-right px-4 py-3 whitespace-nowrap">定価</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    return (
                      <tr key={r.item_no} className="border-t border-gray-100">
                        <td className="px-4 py-3 font-mono text-xs">{r.item_no}</td>
                        <td className="px-4 py-3">{r.description ?? '—'}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <InventoryBadge itemNo={r.item_no} inventory={inventory} />
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {r.price_jpy != null ? `¥${r.price_jpy.toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
                {rows.length}件（最大100件）
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">品番または品名を入力して検索してください</div>
          )}
        </div>
      </div>
    </div>
  );
}
