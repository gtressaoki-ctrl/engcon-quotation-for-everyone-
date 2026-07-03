'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useWizardStore } from '@/lib/wizardStore';
import type { QuoteRecord, QuoteItem } from '@/types/quote';

const CLIENT_TYPE_LABELS: Record<string, string> = {
  dealer: 'ディーラー', reseller: '未登録販売店', enduser: 'エンドユーザー',
};

export default function AdminDashboard() {
  const router = useRouter();
  const loadQuote = useWizardStore((s) => s.loadQuote);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState('');
  const [setupResult, setSetupResult] = useState('');
  const [inventoryUploading, setInventoryUploading] = useState(false);
  const [inventoryResult, setInventoryResult] = useState('');
  const [filters, setFilters] = useState({ since: '', until: '', creator_company: '', creator_name: '', client_type: '' });
  const [detail, setDetail] = useState<{ quote: QuoteRecord; items: QuoteItem[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchQuotes();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) router.push('/admin');
  }

  async function fetchQuotes() {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await fetch(`/api/quotes?${params}`);
    const json = await res.json();
    setQuotes(json.data || []);
    setTotal(json.count || 0);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/admin');
  }

  async function runSetup() {
    const key = prompt('サービスロールキーを入力してください:')?.trim();
    if (!key) return;
    setSetupResult('実行中...');
    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'x-admin-key': key },
      });
      const json = await res.json();
      if (json.ok) {
        const r = json.results;
        setSetupResult(`✓ バケット:${r.bucket} / price_master:${r.price_master_count}件`);
      } else {
        setSetupResult(`✗ ${json.error}`);
      }
    } catch {
      setSetupResult('✗ ネットワークエラー');
    }
  }

  async function seedPriceMaster() {
    const key = prompt('サービスロールキーを入力してください:')?.trim();
    if (!key) return;
    setSeeding(true);
    setSeedResult('');
    try {
      const res = await fetch('/api/admin/seed-prices', {
        method: 'POST',
        headers: { 'x-admin-key': key },
      });
      const json = await res.json();
      if (json.ok) {
        setSeedResult(`✓ price_master投入完了: ${json.inserted}件`);
      } else {
        setSeedResult(`✗ エラー: ${json.error}`);
      }
    } catch {
      setSeedResult('✗ ネットワークエラー');
    }
    setSeeding(false);
  }

  async function uploadInventory(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const key = prompt('サービスロールキーを入力してください:')?.trim();
    if (!key) return;

    setInventoryUploading(true);
    setInventoryResult('');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'x-admin-key': key },
        body,
      });
      const json = await res.json();
      if (json.ok) {
        setInventoryResult(`✓ 在庫データ更新完了: ${json.inserted}件`);
      } else {
        setInventoryResult(`✗ エラー: ${json.error}`);
      }
    } catch {
      setInventoryResult('✗ ネットワークエラー');
    }
    setInventoryUploading(false);
  }

  function exportCsv() {
    const headers = ['見積番号', '作成日', '作成者会社', '担当者', '見積先', '種別', '合計金額'];
    const rows = quotes.map((q) => [
      q.quote_number,
      q.created_at ? new Date(q.created_at).toLocaleDateString('ja-JP') : '',
      q.creator_company,
      q.creator_name,
      q.client_name,
      { dealer: 'ディーラー', reseller: '未登録販売店', enduser: 'エンドユーザー' }[q.client_type] || q.client_type,
      q.total,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function openDetail(id?: number) {
    if (!id) return;
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/quotes/${id}`);
      const json = await res.json();
      if (res.ok) setDetail(json);
    } finally {
      setDetailLoading(false);
    }
  }

  function reviseQuote() {
    if (!detail) return;
    loadQuote(detail.quote, detail.items);
    router.push('/wizard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-800">管理者ダッシュボード</h1>
        <div className="flex gap-4 items-center">
          <a href="/admin/dealers" className="text-sm text-black hover:underline">ディーラー管理</a>
          <button
            onClick={runSetup}
            className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded"
          >
            初期セットアップ
          </button>
          {setupResult && <span className="text-xs text-gray-600">{setupResult}</span>}
          <button
            onClick={seedPriceMaster}
            disabled={seeding}
            className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded disabled:opacity-50"
          >
            {seeding ? '投入中...' : '価格マスタ投入'}
          </button>
          {seedResult && <span className="text-xs text-gray-600">{seedResult}</span>}
          <label className={`text-sm bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded cursor-pointer ${inventoryUploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {inventoryUploading ? '更新中...' : '在庫データ更新'}
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={uploadInventory} disabled={inventoryUploading} />
          </label>
          {inventoryResult && <span className="text-xs text-gray-600">{inventoryResult}</span>}
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">ログアウト</button>
        </div>
      </header>

      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">開始日</label>
              <input type="date" value={filters.since} onChange={(e) => setFilters((p) => ({ ...p, since: e.target.value }))}
                className="w-full border border-gray-200 rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">終了日</label>
              <input type="date" value={filters.until} onChange={(e) => setFilters((p) => ({ ...p, until: e.target.value }))}
                className="w-full border border-gray-200 rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">会社名</label>
              <input type="text" value={filters.creator_company} onChange={(e) => setFilters((p) => ({ ...p, creator_company: e.target.value }))}
                className="w-full border border-gray-200 rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">担当者</label>
              <input type="text" value={filters.creator_name} onChange={(e) => setFilters((p) => ({ ...p, creator_name: e.target.value }))}
                className="w-full border border-gray-200 rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">見積先種別</label>
              <select value={filters.client_type} onChange={(e) => setFilters((p) => ({ ...p, client_type: e.target.value }))}
                className="w-full border border-gray-200 rounded px-2 py-1 text-sm">
                <option value="">全て</option>
                <option value="dealer">ディーラー</option>
                <option value="reseller">未登録販売店</option>
                <option value="enduser">エンドユーザー</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-3">
            <button onClick={fetchQuotes} className="bg-primary hover:bg-neutral-800 text-white text-sm px-4 py-2 rounded-lg">検索</button>
            <button onClick={exportCsv} className="border border-gray-300 hover:bg-gray-50 text-sm px-4 py-2 rounded-lg">CSVエクスポート</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-sm text-gray-500">
            {total}件
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">読み込み中...</div>
          ) : (
            <>
            <table className="w-full text-sm hidden md:table">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3">見積番号</th>
                  <th className="text-left px-4 py-3">作成日</th>
                  <th className="text-left px-4 py-3">作成者</th>
                  <th className="text-left px-4 py-3">見積先</th>
                  <th className="text-left px-4 py-3">種別</th>
                  <th className="text-right px-4 py-3">合計金額</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id} onClick={() => openDetail(q.id)} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3 font-mono">
                      {q.quote_number}
                      {q.revision_of_quote_number && (
                        <div className="text-xs text-gray-400 font-sans">← {q.revision_of_quote_number} の改訂</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{q.created_at ? new Date(q.created_at).toLocaleDateString('ja-JP') : ''}</td>
                    <td className="px-4 py-3">{q.creator_company}　{q.creator_name}</td>
                    <td className="px-4 py-3">{q.client_name}</td>
                    <td className="px-4 py-3">{CLIENT_TYPE_LABELS[q.client_type] || q.client_type}</td>
                    <td className="px-4 py-3 text-right">¥{q.total.toLocaleString()}</td>
                  </tr>
                ))}
                {quotes.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">データがありません</td></tr>
                )}
              </tbody>
            </table>

            {/* モバイル：見積カード */}
            <div className="md:hidden divide-y divide-gray-100">
              {quotes.map((q) => (
                <button key={q.id} onClick={() => openDetail(q.id)} className="w-full text-left p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-mono text-sm">{q.quote_number}</span>
                    <span className="font-semibold tabular-nums shrink-0">¥{q.total.toLocaleString()}</span>
                  </div>
                  {q.revision_of_quote_number && (
                    <div className="text-xs text-gray-400">← {q.revision_of_quote_number} の改訂</div>
                  )}
                  <div className="text-sm text-gray-800 mt-1">{q.client_name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {q.created_at ? new Date(q.created_at).toLocaleDateString('ja-JP') : ''}　{q.creator_company} {q.creator_name}
                  </div>
                </button>
              ))}
              {quotes.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-400">データがありません</div>
              )}
            </div>
            </>
          )}
        </div>
      </div>

      {(detailLoading || detail) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="p-8 text-center text-gray-400">読み込み中...</div>
            ) : detail && (
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">見積番号 {detail.quote.quote_number}</h2>
                    {detail.quote.revision_of_quote_number && (
                      <p className="text-xs text-gray-400 mt-0.5">元見積：{detail.quote.revision_of_quote_number}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={reviseQuote} className="text-sm bg-primary hover:bg-neutral-800 text-white px-3 py-1.5 rounded">
                      この見積を改訂する
                    </button>
                    <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                  </div>
                </div>

                <DetailSection title="作成者情報">
                  <DetailRow label="種別" value={detail.quote.creator_type === 'gtres' ? 'G.TRES社員' : 'ディーラー'} />
                  <DetailRow label="会社名" value={detail.quote.creator_company} />
                  <DetailRow label="担当者名" value={detail.quote.creator_name} />
                  <DetailRow label="作成日" value={detail.quote.created_at ? new Date(detail.quote.created_at).toLocaleString('ja-JP') : ''} />
                </DetailSection>

                <DetailSection title="見積先情報">
                  <DetailRow label="種別" value={CLIENT_TYPE_LABELS[detail.quote.client_type] || detail.quote.client_type} />
                  <DetailRow label="見積先名" value={detail.quote.client_name} />
                  <DetailRow label="価格区分" value={detail.quote.price_type} />
                </DetailSection>

                <DetailSection title="ベースマシン">
                  <DetailRow label="状態" value={detail.quote.machine_condition === 'new' ? '新車' : '中古車'} />
                  <DetailRow label="メーカー" value={detail.quote.machine_maker} />
                  <DetailRow label="機種名" value={detail.quote.machine_model} />
                  <DetailRow label="製造年月" value={detail.quote.machine_year} />
                  <DetailRow label="取付方式" value={detail.quote.mount_type === 'SW' ? 'サンドイッチ（SW）' : 'ダイレクトマウント（DM）'} />
                  <DetailRow label="S規格" value={detail.quote.s_standard} />
                  <DetailRow label="ECモデル" value={detail.quote.ec_model} />
                  <DetailRow label="DCシステム" value={detail.quote.dc_system} />
                </DetailSection>

                <DetailSection title="品目一覧">
                  <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left py-1 px-2">品番</th>
                        <th className="text-left py-1 px-2">品名</th>
                        <th className="text-right py-1 px-2">定価</th>
                        <th className="text-right py-1 px-2">数量</th>
                        <th className="text-right py-1 px-2">販売価</th>
                        <th className="text-right py-1 px-2">金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.items.map((item, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="py-1 px-2 font-mono text-xs">{item.item_no || '—'}</td>
                          <td className="py-1 px-2">{item.name_ja}</td>
                          <td className="py-1 px-2 text-right">{item.list_price?.toLocaleString() ?? '—'}</td>
                          <td className="py-1 px-2 text-right">{item.qty}</td>
                          <td className="py-1 px-2 text-right">{item.unit_price?.toLocaleString() ?? '—'}</td>
                          <td className="py-1 px-2 text-right">{item.amount?.toLocaleString() ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>

                  {/* モバイル：品目カード */}
                  <div className="md:hidden space-y-2">
                    {detail.items.map((item, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-3">
                        <p className="text-sm font-medium break-words">{item.name_ja}</p>
                        <p className="font-mono text-xs text-gray-500">{item.item_no || '—'}</p>
                        <div className="mt-1 flex justify-between text-xs text-gray-500 tabular-nums">
                          <span>定価 {item.list_price != null ? `¥${item.list_price.toLocaleString()}` : '—'}</span>
                          <span>数量 {item.qty}</span>
                        </div>
                        <div className="mt-1 flex justify-between items-center border-t border-gray-100 pt-1">
                          <span className="text-xs text-gray-500">販売価 {item.unit_price != null ? `¥${item.unit_price.toLocaleString()}` : '—'}</span>
                          <span className="font-semibold tabular-nums">{item.amount != null ? `¥${item.amount.toLocaleString()}` : '—'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </DetailSection>

                <DetailSection title="追加費用・配送条件">
                  <DetailRow label={`国内運賃（${detail.quote.pallet_count}パレット）`} value={detail.quote.freight_cost ? `¥${detail.quote.freight_cost.toLocaleString()}` : undefined} />
                  <DetailRow label="取付費用" value={detail.quote.install_cost ? `¥${detail.quote.install_cost.toLocaleString()}` : undefined} />
                  <DetailRow label="ホース取付部材" value={detail.quote.hose_parts_cost ? `¥${detail.quote.hose_parts_cost.toLocaleString()}` : undefined} />
                  <DetailRow label={`出張費用（${detail.quote.travel_count}回）`} value={detail.quote.travel_cost ? `¥${(detail.quote.travel_cost * detail.quote.travel_count).toLocaleString()}` : undefined} />
                  <DetailRow label={`納入指導費（${detail.quote.guidance_count}回）`} value={detail.quote.guidance_cost ? `¥${(detail.quote.guidance_cost * detail.quote.guidance_count).toLocaleString()}` : undefined} />
                  <DetailRow label="納入場所" value={detail.quote.delivery_location} />
                  <DetailRow label="納期" value={detail.quote.delivery_date} />
                  <DetailRow label="納品条件" value={detail.quote.delivery_terms} />
                  <DetailRow label="支払条件" value={detail.quote.payment_terms} />
                  <DetailRow label="備考" value={detail.quote.note} />
                </DetailSection>

                {detail.quote.has_ict && (
                  <DetailSection title="ICT情報">
                    <DetailRow label="メーカー" value={detail.quote.ict_maker} />
                    <DetailRow label="機種名" value={detail.quote.ict_model} />
                    <DetailRow label="備考" value={detail.quote.ict_note} />
                  </DetailSection>
                )}

                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span>小計（税抜）</span><span className="font-medium">¥{detail.quote.subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>消費税</span><span>¥{detail.quote.tax.toLocaleString()}</span></div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                    <span>御見積金額（税込）</span><span className="text-black">¥{detail.quote.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 font-medium text-sm text-gray-700">{title}</div>
      <div className="p-4 space-y-1">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex text-sm gap-4">
      <span className="text-gray-500 w-40 shrink-0">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}
