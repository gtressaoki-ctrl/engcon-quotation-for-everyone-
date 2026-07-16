import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateQuoteNumber, generateRevisionQuoteNumber } from './quoteNumber';
import { createServiceClient } from './supabase';

vi.mock('./supabase', () => ({
  createServiceClient: vi.fn(),
}));

type QueryResult = { data: Array<{ quote_number: string }> | null };

// supabase-js のクエリビルダを模す：チェーン可能かつ await 可能（thenable）
interface Chain extends PromiseLike<QueryResult> {
  select: (columns: string) => Chain;
  like: (column: string, pattern: string) => Chain;
  order: (column: string, opts: { ascending: boolean }) => Chain;
  limit: (n: number) => Chain;
}

function makeClient(result: QueryResult) {
  const chain: Chain = {
    select: () => chain,
    like: () => chain,
    order: () => chain,
    limit: () => chain,
    then: (onfulfilled, onrejected) => Promise.resolve(result).then(onfulfilled, onrejected),
  };
  return { from: () => chain };
}

function mockQuotes(quoteNumbers: string[]) {
  vi.mocked(createServiceClient).mockReturnValue(
    makeClient({ data: quoteNumbers.map((quote_number) => ({ quote_number })) }) as unknown as ReturnType<
      typeof createServiceClient
    >
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-07-05T10:00:00+09:00'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('generateQuoteNumber', () => {
  it('当日1件目はYYMMDD-01', async () => {
    mockQuotes([]);
    expect(await generateQuoteNumber()).toBe('260705-01');
  });

  it('当日の最大連番+1を2桁ゼロ埋めで返す', async () => {
    mockQuotes(['260705-07']);
    expect(await generateQuoteNumber()).toBe('260705-08');
  });

  it('10件目以降も繰り上がる', async () => {
    mockQuotes(['260705-09']);
    expect(await generateQuoteNumber()).toBe('260705-10');
  });
});

describe('generateRevisionQuoteNumber', () => {
  it('初回改訂は-R2（既存改訂なし→maxRev=1の+1）', async () => {
    mockQuotes(['260701-03']);
    expect(await generateRevisionQuoteNumber('260701-03')).toBe('260701-03-R2');
  });

  it('既存の最大改訂+1を返す', async () => {
    mockQuotes(['260701-03', '260701-03-R2', '260701-03-R4']);
    expect(await generateRevisionQuoteNumber('260701-03')).toBe('260701-03-R5');
  });

  it('改訂番号付きを渡されてもベース番号に正規化してから採番する', async () => {
    mockQuotes(['260701-03', '260701-03-R2']);
    expect(await generateRevisionQuoteNumber('260701-03-R2')).toBe('260701-03-R3');
  });
});

// 注意: 本実装は SELECT max → +1 のためレース条件がある（docs/specs/quote-number-race-fix.md）。
// このテストは単発採番の回帰ガードであり、同時実行の安全性は保証しない。
