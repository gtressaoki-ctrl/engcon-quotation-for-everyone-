'use client';

import { useEffect, useState } from 'react';

// 在庫は棚卸スナップショット（リアルタイムではない）。いつ時点の在庫かを注記表示する。
// 棚卸日(asOf)が取れればその年月＋旬（初旬/中旬/下旬）を、無ければアップロード日から表示。

function phaseOfDay(day: number): string {
  return day <= 10 ? '初旬' : day <= 20 ? '中旬' : '下旬';
}

function asOfLabel(iso: string | null): string | null {
  if (!iso) return null;
  // 'YYYY-MM-DD' 形式を優先的に手動パース（タイムゾーンのズレを避ける）
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}年${Number(mo)}月${phaseOfDay(Number(d))}時点`;
  }
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return null;
  return `${dt.getFullYear()}年${dt.getMonth() + 1}月${phaseOfDay(dt.getDate())}時点`;
}

export default function InventoryAsOfNote({ className = '' }: { className?: string }) {
  const [text, setText] = useState<string>('※在庫は棚卸時点の情報です（リアルタイムではありません）');

  useEffect(() => {
    fetch('/api/inventory-meta')
      .then((r) => r.json())
      .then((d) => {
        const label = asOfLabel(d?.asOf) ?? asOfLabel(d?.uploadedAt);
        if (label) setText(`※在庫は${label}の情報です（リアルタイムではありません）`);
      })
      .catch(() => { /* 表示だけなので握りつぶす */ });
  }, []);

  return <p className={`text-xs text-gray-400 ${className}`}>{text}</p>;
}
