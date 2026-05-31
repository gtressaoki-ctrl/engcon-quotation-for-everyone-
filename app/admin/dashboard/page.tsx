'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { QuoteRecord } from '@/types/quote';

export default function AdminDashboard() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState('');
  const [setupResult, setSetupResult] = useState('');
  const [filters, setFilters] = useState({ since: '', until: '', creator_company: '', creator_name: '', client_type: '' });

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
    const key = prompt('サービスロールキーを入力してください:');
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
    const key = prompt('サービスロールキーを入力してください:');
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

  const CLIENT_TYPE_LABELS: Record<string, string> = {
    dealer: 'ディーラー', reseller: '未登録販売店', enduser: 'エンドユーザー',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-800">管理者ダッシュボード</h1>
        <div className="flex gap-4 items-center">
          <a href="/admin/dealers" className="text-sm text-blue-600 hover:underline">ディーラー管理</a>
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
            <button onClick={fetchQuotes} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">検索</button>
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
            <table className="w-full text-sm">
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
                  <tr key={q.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono">{q.quote_number}</td>
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
          )}
        </div>
      </div>
    </div>
  );
}
