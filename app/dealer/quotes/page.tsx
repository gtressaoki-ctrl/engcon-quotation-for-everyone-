'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useWizardStore } from '@/lib/wizardStore';
import { DEALER_ROLE } from '@/lib/dealerAuth';
import type { QuoteRecord, QuoteItem } from '@/types/quote';

const CLIENT_TYPE_LABELS: Record<string, string> = {
  dealer: 'ディーラー', reseller: '未登録販売店', enduser: 'エンドユーザー',
};

export default function DealerQuotes() {
  const router = useRouter();
  const loadQuote = useWizardStore((s) => s.loadQuote);
  const reset = useWizardStore((s) => s.reset);
  const [company, setCompany] = useState('');
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<{ quote: QuoteRecord; items: QuoteItem[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    const meta = session?.user?.user_metadata as { role?: string; company?: string } | undefined;
    if (!session || meta?.role !== DEALER_ROLE) {
      router.push('/dealer/login');
      return;
    }
    setCompany(meta?.company ?? '');
    const res = await fetch(`/api/quotes?creator_user_id=${session.user.id}`);
    const json = await res.json();
    setQuotes(json.data || []);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/dealer/login');
  }

  function newQuote() {
    reset();
    router.push('/wizard');
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

  function reviseFromDetail() {
    if (!detail) return;
    loadQuote(detail.quote, detail.items);
    router.push('/wizard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-800">見積一覧</h1>
          {company && <p className="text-xs text-gray-500">{company}</p>}
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={newQuote} className="text-sm bg-primary hover:bg-neutral-800 text-white px-4 py-2 rounded-lg">
            ＋ 新規見積を作成
          </button>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">ログアウト</button>
        </div>
      </header>

      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-sm text-gray-500">{quotes.length}件（行をタップで詳細）</div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">読み込み中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-3 whitespace-nowrap">見積番号</th>
                    <th className="text-left px-4 py-3 whitespace-nowrap">作成日</th>
                    <th className="text-left px-4 py-3 whitespace-nowrap">担当者</th>
                    <th className="text-left px-4 py-3 whitespace-nowrap">見積先</th>
                    <th className="text-left px-4 py-3 whitespace-nowrap">種別</th>
                    <th className="text-left px-4 py-3 whitespace-nowrap">状態</th>
                    <th className="text-right px-4 py-3 whitespace-nowrap">合計金額</th>
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
                        {q.admin_comment && (
                          <div className="text-xs text-red-600 font-sans mt-1 whitespace-pre-wrap">管理者：{q.admin_comment}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{q.created_at ? new Date(q.created_at).toLocaleDateString('ja-JP') : ''}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{q.creator_name}</td>
                      <td className="px-4 py-3">{q.client_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{CLIENT_TYPE_LABELS[q.client_type] || q.client_type}</td>
                      <td className="px-4 py-3">
                        {q.status === 'approved'
                          ? <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded whitespace-nowrap">承認済み</span>
                          : <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded whitespace-nowrap">審査中</span>}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">¥{q.total.toLocaleString()}</td>
                    </tr>
                  ))}
                  {quotes.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      まだ見積がありません。「＋ 新規見積を作成」から作成できます。
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 詳細モーダル（読み取り専用） */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="p-8 text-center text-gray-400">読み込み中...</div>
            ) : detail && (
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                      見積番号 {detail.quote.quote_number}
                      {detail.quote.status === 'approved'
                        ? <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded">承認済み（正式見積）</span>
                        : <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">審査中</span>}
                    </h2>
                    {detail.quote.revision_of_quote_number && (
                      <p className="text-xs text-gray-400 mt-0.5">元見積：{detail.quote.revision_of_quote_number}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={reviseFromDetail} className="text-sm bg-primary hover:bg-neutral-800 text-white px-3 py-1.5 rounded whitespace-nowrap">改訂する</button>
                    <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                  </div>
                </div>

                {detail.quote.admin_comment && (
                  <div className="border border-red-200 bg-red-50 rounded-lg p-3">
                    <p className="text-sm text-red-600 whitespace-pre-wrap">管理者コメント：{detail.quote.admin_comment}</p>
                  </div>
                )}

                <div className="text-sm text-gray-700 grid grid-cols-2 gap-x-4 gap-y-1">
                  <div><span className="text-gray-400">作成日：</span>{detail.quote.created_at ? new Date(detail.quote.created_at).toLocaleDateString('ja-JP') : ''}</div>
                  <div><span className="text-gray-400">担当者：</span>{detail.quote.creator_name}</div>
                  <div><span className="text-gray-400">見積先：</span>{detail.quote.client_name}</div>
                  <div><span className="text-gray-400">種別：</span>{CLIENT_TYPE_LABELS[detail.quote.client_type] || detail.quote.client_type}</div>
                  <div><span className="text-gray-400">メーカー：</span>{detail.quote.machine_maker}</div>
                  <div><span className="text-gray-400">機種：</span>{detail.quote.machine_model}</div>
                  <div><span className="text-gray-400">取付：</span>{detail.quote.mount_type === 'SW' ? 'サンドイッチ（SW）' : 'ダイレクトマウント（DM）'}</div>
                  <div><span className="text-gray-400">S規格 / EC / DC：</span>{detail.quote.s_standard} / {detail.quote.ec_model} / {detail.quote.dc_system}</div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">品目一覧</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[420px]">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600">
                          <th className="text-left py-1 px-2">品名</th>
                          <th className="text-left py-1 px-2 whitespace-nowrap">品番</th>
                          <th className="text-right py-1 px-2">数量</th>
                          <th className="text-right py-1 px-2">金額</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.items.map((item, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="py-1 px-2">{item.name_ja}</td>
                            <td className="py-1 px-2 font-mono text-xs text-gray-500 whitespace-nowrap">{item.item_no || '—'}</td>
                            <td className="py-1 px-2 text-right">{item.qty}</td>
                            <td className="py-1 px-2 text-right whitespace-nowrap">{item.amount != null ? `¥${item.amount.toLocaleString()}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="text-sm text-gray-700 text-right space-y-0.5">
                  <div>小計：¥{detail.quote.subtotal?.toLocaleString?.() ?? detail.quote.subtotal}</div>
                  <div>消費税：¥{detail.quote.tax?.toLocaleString?.() ?? detail.quote.tax}</div>
                  <div className="font-bold text-base">合計：¥{detail.quote.total?.toLocaleString?.() ?? detail.quote.total}</div>
                </div>

                {detail.quote.note && (
                  <div className="text-sm text-gray-700">
                    <p className="text-gray-400">備考：</p>
                    <p className="whitespace-pre-wrap">{detail.quote.note}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
