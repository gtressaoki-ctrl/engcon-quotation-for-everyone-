import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Returns { [partNumber]: totalBalance } for all parts with balance > 0
export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('inventory').select('item_no, balance');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const inventory: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.item_no) inventory[row.item_no] = Number(row.balance);
  }

  return NextResponse.json(inventory);
}
