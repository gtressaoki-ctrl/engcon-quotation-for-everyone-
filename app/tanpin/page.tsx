'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { DEALER_ROLE } from '@/lib/dealerAuth';

// 単品見積：品番をコピペ（または1件ずつ追加）→定価で一覧化→正式見積として保存（番号発行）。
// 販売価の掛け率は使わず「定価のみ」。金額＝定価×数量。

interface LineItem {
  item_no: string;
  name_ja: string;
  list_price: number;
  qty: number;
}

// 貼り付け1行を {品番, 数量} に分解する。
// タブ/カンマ区切り（Excel貼り付け等）なら列扱い、スペースのみなら空白区切り。
// 先頭列を品番、末尾列が数値なら数量として扱う（なければ数量1）。
function parseLine(line: string): { partNo: string; qty: number } | null {
  const raw = line.trim();
  if (!raw) return null;
  let cols: string[];
  if (raw.includes('\t')) cols = raw.split('\t');
  else if (raw.includes(',') || raw.includes('、')) cols = raw.split(/[,、]/);
  else cols = raw.split(/[\s　]+/);
  cols = cols.map((c) => c.trim()).filter(Boolean);
  if (cols.length === 0) return null;
  const partNo = cols[0];
  let qty = 1;
  const last = cols[cols.length - 1];
  if (cols.length >= 2 && /^\d+(\.\d+)?$/.test(last)) qty = parseFloat(last);
  return { partNo, qty: qty > 0 ? qty : 1 };
}

export default function TanpinQuotePage() {
  // 作成者・見積先
  const [dealerLocked, setDealerLocked] = useState(false);
  const [creatorType, setCreatorType] = useState<'gtres' | 'dealer'>('gtres');
  const [creatorCompany, setCreatorCompany] = useState('株式会社 G.TRES');
  const [creatorName, setCreatorName] = useState('');
  const [creatorUserId, setCreatorUserId] = useState<string | undefined>(undefined);
  const [clientName, setClientName] = useState('');
  const [note, setNote] = useState('');

  // 貼り付け・品目
  const [pasteText, setPasteText] = useState('');
  const [singlePartNo, setSinglePartNo] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [notFound, setNotFound] = useState<string[]>([]);
  const [resolving, setResolving] = useState(false);

  // 保存
  const [saving, setSaving] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState<string | null>(null);
  const [error, setError] = useState('');

  // ディーラーログイン中なら作成者をその会社に固定
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const meta = session?.user?.user_metadata as { role?: string; company?: string } | undefined;
      if (session && meta?.role === DEALER_ROLE) {
        setDealerLocked(true);
        setCreatorType('dealer');
        setCreatorCompany(meta.company ?? '');
        setCreatorUserId(session.user.id);
      }
    });
  }, []);

  // 品番配列をprice_masterで引いて、既存品目にマージする（同一品番は数量加算）
  async function resolveParts(parsed: { partNo: string; qty: number }[]) {
    if (parsed.length === 0) return;
    setResolving(true);
    setError('');
    try {
      // 入力順を保ったまま品番ごとに数量を合算
      const wantQty = new Map<string, number>();
      const order: string[] = [];
      for (const p of parsed) {
        if (!wantQty.has(p.partNo)) order.push(p.partNo);
        wantQty.set(p.partNo, (wantQty.get(p.partNo) ?? 0) + p.qty);
      }

      const { data } = await supabase
        .from('price_master')
        .select('item_no, description, price_jpy')
        .in('item_no', order);

      const found = new Map<string, { description: string | null; price_jpy: number | null }>();
      for (const r of (data ?? []) as { item_no: string; description: string | null; price_jpy: number | null }[]) {
        found.set(r.item_no, { description: r.description, price_jpy: r.price_jpy });
      }

      setItems((prev) => {
        const next = [...prev];
        for (const partNo of order) {
          const rec = found.get(partNo);
          if (!rec) continue;
          const addQty = wantQty.get(partNo) ?? 1;
          const idx = next.findIndex((it) => it.item_no === partNo);
          if (idx >= 0) {
            next[idx] = { ...next[idx], qty: next[idx].qty + addQty };
          } else {
            next.push({
              item_no: partNo,
              name_ja: rec.description ?? partNo,
              list_price: rec.price_jpy ?? 0,
              qty: addQty,
            });
          }
        }
        return next;
      });

      setNotFound(order.filter((p) => !found.has(p)));
    } finally {
      setResolving(false);
    }
  }

  async function handleReflect() {
    const parsed = pasteText.split(/\r?\n/).map(parseLine).filter((v): v is { partNo: string; qty: number } => v !== null);
    if (parsed.length === 0) {
      setError('品番が読み取れませんでした。1行に1品番で貼り付けてください。');
      return;
    }
    await resolveParts(parsed);
    setPasteText('');
  }

  async function handleAddSingle() {
    const p = parseLine(singlePartNo);
    if (!p) return;
    await resolveParts([p]);
    setSinglePartNo('');
  }

  function setQty(itemNo: string, qty: number) {
    setItems((prev) => prev.map((it) => (it.item_no === itemNo ? { ...it, qty: qty > 0 ? qty : 1 } : it)));
  }

  function removeItem(itemNo: string) {
    setItems((prev) => prev.filter((it) => it.item_no !== itemNo));
  }

  const subtotal = items.reduce((s, it) => s + it.list_price * it.qty, 0);
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + tax;

  async function handleSave() {
    if (!creatorName.trim()) { setError('担当者名を入力してください'); return; }
    if (creatorType === 'dealer' && !creatorCompany.trim()) { setError('会社名を入力してください'); return; }
    if (!clientName.trim()) { setError('見積先名を入力してください'); return; }
    if (items.length === 0) { setError('品目がありません。品番を反映してください'); return; }

    setSaving(true);
    setError('');
    try {
      // 定価のみ：販売価(unit_price)＝定価、金額＝定価×数量
      const bodyItems = items.map((it, i) => ({
        sort_order: i + 1,
        item_no: it.item_no,
        name_ja: it.name_ja,
        list_price: it.list_price,
        qty: it.qty,
        unit_price: it.list_price,
        amount: it.list_price * it.qty,
        is_custom: false,
      }));

      const body = {
        quote_mode: 'attachment',
        creator_type: creatorType,
        creator_company: creatorCompany,
        creator_name: creatorName,
        creator_user_id: creatorUserId,
        client_type: 'enduser',
        client_name: clientName,
        machine_condition: 'new',
        machine_maker: '',
        machine_model: '',
        machine_year: '',
        mount_type: 'SW',
        s_standard: '',
        ec_model: '',
        dc_system: '',
        has_ict: false,
        ict_maker: '',
        ict_model: '',
        ict_note: '',
        pallet_count: 0,
        install_cost: 0,
        hose_parts_cost: 0,
        travel_unit_cost: 0,
        travel_count: 0,
        guidance_unit_cost: 0,
        guidance_count: 0,
        extra_costs: [],
        delivery_location: '',
        delivery_date: '',
        delivery_terms: '',
        payment_terms: '',
        note: note || '単品見積（定価）',
        price_type: 'enduser',
        items: bodyItems,
        subtotal,
        tax,
        total,
      };

      const res = await fetch('/api/save-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '見積の保存に失敗しました');
      setQuoteNumber(data.quoteNumber);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">単品見積（定価）</h1>
          <Link href="/" className="text-sm text-black hover:underline">← トップへ</Link>
        </div>

        {quoteNumber ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              見積番号 <strong>{quoteNumber}</strong> で保存しました。
            </div>
            <p className="text-sm text-gray-500">管理者ダッシュボードの見積一覧に表示されます。</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setQuoteNumber(null);
                  setItems([]);
                  setNotFound([]);
                  setClientName('');
                  setNote('');
                }}
                className="bg-primary hover:bg-neutral-800 text-white font-medium px-6 py-3 rounded-lg transition"
              >
                続けて別の見積を作成
              </button>
              <Link href="/" className="border border-gray-300 hover:bg-gray-100 px-6 py-3 rounded-lg transition">トップへ</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 作成者・見積先 */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              {!dealerLocked && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">種別</label>
                  <div className="flex gap-6">
                    {(['gtres', 'dealer'] as const).map((t) => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={creatorType === t}
                          onChange={() => {
                            setCreatorType(t);
                            setCreatorCompany(t === 'gtres' ? '株式会社 G.TRES' : '');
                          }}
                          className="w-4 h-4 text-black"
                        />
                        <span>{t === 'gtres' ? 'G.TRES社員' : 'ディーラー'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">会社名</label>
                  {creatorType === 'gtres' ? (
                    <p className="text-gray-800 font-medium py-2">株式会社 G.TRES（固定）</p>
                  ) : dealerLocked ? (
                    <p className="text-gray-800 font-medium py-2">{creatorCompany}（ログイン中）</p>
                  ) : (
                    <input
                      type="text"
                      value={creatorCompany}
                      onChange={(e) => setCreatorCompany(e.target.value)}
                      placeholder="会社名を入力"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">担当者名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="担当者名を入力"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">見積先名 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="見積先の会社名・お客様名"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            {/* 品番の貼り付け */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
              <label className="block text-sm font-medium text-gray-700">品番を貼り付けて反映</label>
              <p className="text-xs text-gray-500">
                1行に1品番。数量は品番の後ろに半角スペース／タブ／カンマ区切りで指定できます（省略時は1）。<br />
                例：<span className="font-mono">1073879　2</span> / Excelから「品番・数量」列をそのまま貼り付けも可。
              </p>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={5}
                placeholder={'1073879\n1082347 1\n540190,4'}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={handleReflect}
                  disabled={resolving}
                  className="bg-primary hover:bg-neutral-800 disabled:bg-gray-400 text-white font-medium px-6 py-2 rounded-lg transition"
                >
                  {resolving ? '照合中...' : '反映する'}
                </button>
                <span className="text-gray-400 text-sm">または</span>
                <input
                  type="text"
                  value={singlePartNo}
                  onChange={(e) => setSinglePartNo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddSingle(); }}
                  placeholder="品番を1件追加"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button onClick={handleAddSingle} disabled={resolving}
                  className="border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm transition">追加</button>
              </div>
              {notFound.length > 0 && (
                <p className="text-sm text-red-500">
                  見つからなかった品番：<span className="font-mono">{notFound.join(', ')}</span>
                </p>
              )}
            </div>

            {/* 品目一覧 */}
            {items.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600">
                        <th className="text-left px-3 py-2 whitespace-nowrap">品番</th>
                        <th className="text-left px-3 py-2">品名</th>
                        <th className="text-right px-3 py-2 whitespace-nowrap">定価</th>
                        <th className="text-center px-3 py-2 whitespace-nowrap">数量</th>
                        <th className="text-right px-3 py-2 whitespace-nowrap">金額</th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it.item_no} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{it.item_no}</td>
                          <td className="px-3 py-2">{it.name_ja}</td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">¥{it.list_price.toLocaleString()}</td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              min={1}
                              value={it.qty}
                              onChange={(e) => setQty(it.item_no, parseInt(e.target.value, 10) || 1)}
                              className="w-16 border border-gray-300 rounded px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap font-medium">¥{(it.list_price * it.qty).toLocaleString()}</td>
                          <td className="px-2 py-2 text-center">
                            <button onClick={() => removeItem(it.item_no)} className="text-red-400 hover:text-red-600 text-sm">削除</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-gray-100 p-4 space-y-2 text-sm bg-gray-50">
                  <div className="flex justify-between"><span>小計（税抜）</span><span className="font-medium">¥{subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>消費税（10%）</span><span>¥{tax.toLocaleString()}</span></div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                    <span>御見積金額（税込）</span><span className="text-black">¥{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 備考 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">備考（任意）</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="納期・条件などがあれば記入"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium px-8 py-3 rounded-lg transition"
            >
              {saving ? '保存中...' : '単品見積を保存（番号発行）'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
