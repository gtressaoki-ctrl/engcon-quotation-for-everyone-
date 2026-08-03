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
              placeholder="会社名（例：ヤマノ）"
              className="flex-1 min-w-[160px] border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
            <input type="text" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="パスワード（6文字以上）"
              className="flex-1 min-w-[160px] border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
            <button onClick={issueAccount} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm">発行 / 更新</button>
          </div>
          {accountMsg && <p className="text-xs text-gray-600 mt-2">{accountMsg}</p>}
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
