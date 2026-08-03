'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useWizardStore } from '@/lib/wizardStore';
import { DEALER_ROLE } from '@/lib/dealerAuth';
import type { QuoteRecord } from '@/types/quote';

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

  async function revise(id?: number) {
    if (!id) return;
    const res = await fetch(`/api/quotes/${id}`);
    const json = await res.json();
    if (res.ok) {
      loadQuote(json.quote, json.items);
      router.push('/wizard');
    }
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
          <div className="px-4 py-3 border-b border-gray-100 text-sm text-gray-500">{quotes.length}件</div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">読み込み中...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3">見積番号</th>
                  <th className="text-left px-4 py-3">作成日</th>
                  <th className="text-left px-4 py-3">担当者</th>
                  <th className="text-left px-4 py-3">見積先</th>
                  <th className="text-left px-4 py-3">種別</th>
                  <th className="text-right px-4 py-3">合計金額</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono">
                      {q.quote_number}
                      {q.revision_of_quote_number && (
                        <div className="text-xs text-gray-400 font-sans">← {q.revision_of_quote_number} の改訂</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{q.created_at ? new Date(q.created_at).toLocaleDateString('ja-JP') : ''}</td>
                    <td className="px-4 py-3">{q.creator_name}</td>
                    <td className="px-4 py-3">{q.client_name}</td>
                    <td className="px-4 py-3">{CLIENT_TYPE_LABELS[q.client_type] || q.client_type}</td>
                    <td className="px-4 py-3 text-right">¥{q.total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => revise(q.id)} className="text-sm text-black hover:underline">改訂</button>
                    </td>
                  </tr>
                ))}
                {quotes.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    まだ見積がありません。「＋ 新規見積を作成」から作成できます。
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
