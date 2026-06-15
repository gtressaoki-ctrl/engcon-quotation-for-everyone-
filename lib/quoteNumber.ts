import { createServiceClient } from './supabase';

export async function generateQuoteNumber(): Promise<string> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `${yy}${mm}${dd}`;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('quotes')
    .select('quote_number')
    .like('quote_number', `${prefix}-%`)
    .order('quote_number', { ascending: false })
    .limit(1);

  let seq = 1;
  if (data && data.length > 0) {
    const last = data[0].quote_number as string;
    const parts = last.split('-');
    seq = parseInt(parts[1], 10) + 1;
  }

  return `${prefix}-${String(seq).padStart(2, '0')}`;
}

// 改訂版の見積番号を生成する（元の見積番号に "-R{n}" を付与。既存の改訂数+1）
export async function generateRevisionQuoteNumber(baseQuoteNumber: string): Promise<string> {
  const base = baseQuoteNumber.replace(/-R\d+$/, '');

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('quotes')
    .select('quote_number')
    .like('quote_number', `${base}%`);

  let maxRev = 1;
  for (const row of data ?? []) {
    const match = (row.quote_number as string).match(/-R(\d+)$/);
    if (match) maxRev = Math.max(maxRev, parseInt(match[1], 10));
  }

  return `${base}-R${maxRev + 1}`;
}
