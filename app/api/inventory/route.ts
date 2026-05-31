import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Returns { [partNumber]: totalBalance } for all parts with balance > 0
export async function GET() {
  const csvPath = path.join(process.cwd(), 'Part list as of 20260501_v2 .csv');
  const text = fs.readFileSync(csvPath, 'utf-8');
  const lines = text.split('\n');

  const inventory: Record<string, number> = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV respecting quoted fields
    const cols = parseCsvLine(line);
    if (cols.length < 5) continue;

    const partNo = cols[0].trim();
    const balance = parseFloat(cols[4]);
    if (partNo && !isNaN(balance)) {
      inventory[partNo] = balance;
    }
  }

  return NextResponse.json(inventory);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}
