import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQuotes = !inQuotes; }
    else if (line[i] === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += line[i]; }
  }
  result.push(current);
  return result;
}

export async function GET() {
  const csvPath = path.join(process.cwd(), 'public', 'inventory.csv');
  if (!existsSync(csvPath)) return NextResponse.json({});
  const text = readFileSync(csvPath, 'utf-8').replace(/^﻿/, '');
  const lines = text.split('\n').filter((l) => l.trim());
  const header = parseCSVLine(lines[0]);
  const partIdx = header.findIndex((h) => h.toLowerCase().includes('part number'));
  const balanceIdx = header.findIndex((h) => h.toLowerCase().includes('total balance'));
  const inventory: Record<string, number> = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const partNo = cols[partIdx]?.trim();
    const balance = parseFloat(cols[balanceIdx] || '0') || 0;
    if (partNo) inventory[partNo] = (inventory[partNo] ?? 0) + balance;
  }
  return NextResponse.json(inventory);
}
