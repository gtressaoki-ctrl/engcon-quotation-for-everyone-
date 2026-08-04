'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Dealer {
  id: number;
  name: string;
  is_active: boolean;
}

export default function DealersPage() {
  const router = useRouter();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [loginCompany, setLoginCompany] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [accountMsg, setAccountMsg] = useState('');
  const [backfillMsg, setBackfillMsg] = useState('');
  const [linkStatus, setLinkStatus] = useState<{ total: number; linked: number; unlinked: number; byDealer: { company: string; count: number }[] } | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    checkAuth();
    fetchDealers();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/admin'); return; }
    const meta = session.user?.user_metadata as { role?: string } | undefined;
    if (meta?.role === 'dealer') router.push('/dealer/quotes');
  }

  async function issueAccount() {
    if (!loginCompany.trim() || !loginPassword.trim()) {
      setAccountMsg('会社名とパスワードを入力してください');
      return;
    }
    const key = prompt('サービスロールキーを入力してください:')?.trim();
    if (!key) return;
    setAccountMsg('発行中...');
    const res = await fetch('/api/admin/dealer-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
      body: JSON.stringify({ company: loginCompany.trim(), password: loginPassword.trim() }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setAccountMsg(json.updated ? '✓ パスワードを更新しました' : '✓ アカウントを発行しました');
      setLoginCompany('');
      setLoginPassword('');
    } else {
      setAccountMsg(`✗ ${json.error || `HTTP ${res.status}`}`);
    }
  }

  // 既存見積（creator_user_id 未設定）を作成者会社名でアカウントに紐付ける。
  // まずプレビュー（件数のみ）→ 確認 → 適用、の流れ。
  async function backfillQuotes() {
    const key = prompt('サービスロールキーを入力してください:')?.trim();
    if (!key) return;
    setBackfillMsg('照合中...');
    const preview = await fetch('/api/admin/backfill-quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
      body: JSON.stringify({ apply: false }),
    });
    const p = await preview.json().catch(() => ({}));
    if (!preview.ok) { setBackfillMsg(`✗ ${p.error || `HTTP ${preview.status}`}`); return; }
    const detail = (p.byCompany || []).map((c: { company: string; count: number }) => `・${c.company}: ${c.count}件`).join('\n');
    const unmatchedList = (p.unmatchedByCompany || []).map((c: { company: string; count: number }) => `・${c.company}: ${c.count}件`).join('\n');
    const dealerList = (p.dealerCompanies || []).join('、');
    const ok = confirm(
      `未紐付けの見積 ${p.unlinkedQuotes} 件のうち、${p.matched} 件を会社名でアカウントに紐付けます。\n` +
      `対象外：未一致 ${p.unmatched} 件 / 会社名重複 ${p.ambiguous} 件\n\n` +
      `【紐付け対象】\n${detail || '（対象なし）'}\n\n` +
      `【未一致の作成者会社（上位）】\n${unmatchedList || '（なし）'}\n\n` +
      `【発行済みアカウント】\n${dealerList || '（なし）'}\n\n適用しますか？`
    );
    if (!ok) { setBackfillMsg('キャンセルしました'); return; }
    setBackfillMsg('適用中...');
    const applyRes = await fetch('/api/admin/backfill-quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
      body: JSON.stringify({ apply: true }),
    });
    const a = await applyRes.json().catch(() => ({}));
    if (applyRes.ok) setBackfillMsg(`✓ ${a.updated}件を紐付けました（未一致${a.unmatched}件は対象外）`);
    else setBackfillMsg(`✗ ${a.error || `HTTP ${applyRes.status}`}`);
  }

  // 紐付け状況の確認（各アカウントに何件紐付いているか）
  async function checkLinkStatus() {
    const key = prompt('サービスロールキーを入力してください:')?.trim();
    if (!key) return;
    setStatusMsg('確認中...');
    setLinkStatus(null);
    const res = await fetch('/api/admin/backfill-quotes', { headers: { 'x-admin-key': key } });
    const json = await res.json().catch(() => ({}));
    if (res.ok) { setLinkStatus(json); setStatusMsg(''); }
    else setStatusMsg(`✗ ${json.error || `HTTP ${res.status}`}`);
  }

  async function readError(res: Response): Promise<string> {
    try {
      const { error } = await res.json();
      return error || `HTTP ${res.status}`;
    } catch {
      return `HTTP ${res.status}`;
    }
  }

  async function fetchDealers() {
    setLoading(true);
    const res = await fetch('/api/admin/dealers');
    if (!res.ok) {
      alert(`一覧の取得に失敗しました：${await readError(res)}`);
      setLoading(false);
      return;
    }
    const { data } = await res.json();
    setDealers(data || []);
    setLoading(false);
  }

  async function addDealer() {
    if (!newName.trim()) return;
    const res = await fetch('/api/admin/dealers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!res.ok) {
      alert(`追加に失敗しました：${await readError(res)}`);
      return;
    }
    setNewName('');
    fetchDealers();
  }

  async function toggleActive(id: number, current: boolean) {
    const res = await fetch('/api/admin/dealers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    });
    if (!res.ok) {
      alert(`更新に失敗しました：${await readError(res)}`);
      return;
    }
    fetchDealers();
  }

  async function deleteDealer(id: number) {
    if (!confirm('このディーラーを削除しますか？')) return;
    const res = await fetch(`/api/admin/dealers?id=${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert(`削除に失敗しました：${await readError(res)}`);
      return;
    }
    fetchDealers();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-800">ディーラー管理</h1>
        <a href="/admin/dashboard" className="text-sm text-black hover:underline">← ダッシュボードへ</a>
      </header>

      <div className="p-6 max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">ディーラーログインアカウント発行</h2>
          <p className="text-xs text-gray-500 mb-3">
            ディーラーは「会社名（株式会社などは不要）＋パスワード」でログインし、自分が作成した見積を見返せます。
            同じ会社名で再発行するとパスワードを更新できます。
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <input type="text" value={loginCompany} onChange={(e) => setLoginCompany(e.target.value)}
              placeholder="会社名（例：G.TRES）"
              className="flex-1 min-w-[160px] border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
            <input type="text" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="パスワード（6文字以上）"
              className="flex-1 min-w-[160px] border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
            <button onClick={issueAccount} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm">発行 / 更新</button>
          </div>
          {accountMsg && <p className="text-xs text-gray-600 mt-2">{accountMsg}</p>}

          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">
              ログイン機能の導入前に作成された見積を、作成者会社名で各アカウントに紐付けます（既に紐付け済みの見積は変更しません）。
              アカウントを発行してから実行してください。
            </p>
            <button onClick={backfillQuotes} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
              既存見積をアカウントに紐付け
            </button>
            {backfillMsg && <p className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">{backfillMsg}</p>}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-sm font-semibold text-gray-700">紐付け状況チェック</h3>
              <button onClick={checkLinkStatus} className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs">
                状況を確認
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-2">各アカウントに紐付いている見積の件数を表示します。未紐付けが残っていれば別名の追加などで対応します。</p>
            {statusMsg && <p className="text-xs text-gray-600">{statusMsg}</p>}
            {linkStatus && (
              <div className="text-xs text-gray-700">
                <p className="mb-2">
                  全 {linkStatus.total} 件中、<span className="text-green-700 font-medium">紐付け済み {linkStatus.linked} 件</span> ／{' '}
                  <span className="text-red-600 font-medium">未紐付け {linkStatus.unlinked} 件</span>
                </p>
                <table className="w-full border border-gray-200 rounded">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600">
                      <th className="text-left px-3 py-1.5">アカウント（会社名）</th>
                      <th className="text-right px-3 py-1.5 whitespace-nowrap">紐付け見積数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkStatus.byDealer.map((d) => (
                      <tr key={d.company} className="border-t border-gray-100">
                        <td className="px-3 py-1.5">{d.company || '（会社名なし）'}</td>
                        <td className="px-3 py-1.5 text-right">{d.count}</td>
                      </tr>
                    ))}
                    {linkStatus.byDealer.length === 0 && (
                      <tr><td className="px-3 py-1.5 text-gray-400" colSpan={2}>アカウントがありません</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">ディーラー名リスト（見積作成時の候補）</h2>
          <div className="flex gap-3">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDealer()}
              placeholder="新しいディーラー名"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
            <button onClick={addDealer} className="bg-primary hover:bg-neutral-800 text-white px-6 py-2 rounded-lg text-sm whitespace-nowrap shrink-0">追加</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">読み込み中...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3">ディーラー名</th>
                  <th className="text-center px-4 py-3">有効</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {dealers.map((d) => (
                  <tr key={d.id} className="border-t border-gray-50">
                    <td className="px-4 py-3">{d.name}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActive(d.id, d.is_active)}
                        className={`px-3 py-1 rounded-full text-xs ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {d.is_active ? '有効' : '無効'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteDealer(d.id)} className="text-red-400 hover:text-red-600 text-xs">削除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
