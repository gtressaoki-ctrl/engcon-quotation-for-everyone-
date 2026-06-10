import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Returns { [partNumber]: totalBalance } for all parts with balance > 0
export async function GET() {
  const supabase = createServiceClient();
  const inventory: Record<string, number> = {};

  const PAGE_SIZE = 1000;
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('inventory')
      .select('item_no, balance')
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    for (const row of data ?? []) {
      if (row.item_no) inventory[row.item_no] = Number(row.balance);
    }

    if (!data || data.length < PAGE_SIZE) break;
  }

  return NextResponse.json(inventory);
}
