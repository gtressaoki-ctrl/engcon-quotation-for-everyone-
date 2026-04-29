import { NextResponse } from 'next/server';
import { generateQuoteNumber } from '@/lib/quoteNumber';

export async function GET() {
  try {
    const quoteNumber = await generateQuoteNumber();
    return NextResponse.json({ quoteNumber });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
