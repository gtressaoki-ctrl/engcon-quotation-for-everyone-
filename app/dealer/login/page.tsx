'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { dealerEmailFromCompany } from '@/lib/dealerAuth';

export default function DealerLogin() {
  const router = useRouter();
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const email = await dealerEmailFromCompany(company);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError('会社名またはパスワードが正しくありません');
      } else {
        router.push('/dealer/quotes');
      }
    } catch {
      setError('ログインに失敗しました');
    }
    setLoading(false);
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-800 mb-2 text-center">ディーラーログイン</h1>
        <p className="text-gray-500 text-sm text-center mb-6">engcon 見積もり作成システム</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">会社名</label>
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} required
              placeholder="例：G.TRES（「株式会社」は不要）"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-primary hover:bg-neutral-800 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition">
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← トップへ</Link>
        </div>
      </div>
    </main>
  );
}
