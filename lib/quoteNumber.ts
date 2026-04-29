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
