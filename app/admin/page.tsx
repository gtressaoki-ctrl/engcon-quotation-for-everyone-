'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupMsg, setSetupMsg] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません');
    } else {
      router.push('/admin/dashboard');
    }
    setLoading(false);
  }

  // 管理者アカウントの作成／パスワード再設定（サービスロールキーが必要）
  async function setupAdmin() {
    if (!email.trim() || password.length < 6) {
      setSetupMsg('メールアドレスと6文字以上のパスワードを入力してください');
      return;
    }
    const key = prompt('サービスロールキーを入力してください:')?.trim();
    if (!key) return;
    setSetupMsg('設定中...');
    try {
      const res = await fetch('/api/admin/set-admin-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setSetupMsg(json.updated ? '✓ パスワードを再設定しました。ログインしてください。' : '✓ 管理者を作成しました。ログインしてください。');
      } else {
        setSetupMsg(`✗ ${json.error || `HTTP ${res.status}`}`);
      }
    } catch (e) {
      setSetupMsg(`✗ 通信に失敗しました（${String(e)}）。少し待って再試行するか、Supabaseの稼働状況をご確認ください。`);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-800 mb-2 text-center">管理者ログイン</h1>
        <p className="text-gray-500 text-sm text-center mb-6">engcon 見積もり作成システム</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
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

        <div className="mt-5 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => setShowSetup((v) => !v)} className="text-xs text-gray-400 hover:text-gray-600">
            管理者アカウントを作成 / パスワード再設定
          </button>
          {showSetup && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-500">
                上のメール・パスワード欄に設定したい内容を入力し、下のボタンでサービスロールキーを使って作成／再設定します。
              </p>
              <button type="button" onClick={setupAdmin}
                className="w-full text-sm border border-gray-300 hover:bg-gray-100 py-2 rounded-lg">
                このメール・パスワードで作成／再設定
              </button>
              {setupMsg && <p className="text-xs text-gray-600 whitespace-pre-wrap">{setupMsg}</p>}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
