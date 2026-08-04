import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { DEALER_ROLE, normalizeCompany } from '@/lib/dealerAuth';

export const dynamic = 'force-dynamic';

function authorized(req: NextRequest): boolean {
  const key = req.headers.get('x-admin-key')?.trim();
  return !!key && key === process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
}

// 会社名の別名。作成者会社が「別名（左）」の見積は「正規会社名（右）」のアカウントに紐付ける。
// 表記揺れ（ローマ字・MSJ併記など）を吸収する。追加の同一会社が出たらここに1行追記する。
const RAW_COMPANY_ALIASES: [string, string][] = [
  ['MSJ', 'ヤマノ'],          // MSJ はヤマノさん
  ['yamano', 'ヤマノ'],       // ローマ字表記
  ['ヤマノMSJ', 'ヤマノ'],    // 「(株)ヤマノ MSJ」等も正規化で ヤマノmsj に集約される
  ['ギアトライム', 'GEARTRYM'], // ギアトライム＝GEARTRYM
  ['リーサステツク', 'リーサステック'], // 見積側「リーサステツク」をアカウント名「リーサステック」へ
];
const COMPANY_ALIASES: Record<string, string> = Object.fromEntries(
  RAW_COMPANY_ALIASES.map(([alias, canonical]) => [normalizeCompany(alias), normalizeCompany(canonical)])
);
function resolveCompanyNorm(company: string): string {
  const norm = normalizeCompany(company);
  return COMPANY_ALIASES[norm] ?? norm;
}

// 紐付け状況の確認。各ディーラーアカウントに何件の見積が紐付いているか、未紐付けが何件かを返す。
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const supabase = createServiceClient();

    const { data: userList, error: userErr } = await supabase.auth.admin.listUsers({ perPage: 200 });
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });
    const dealers = (userList.users || [])
      .filter((u) => (u.user_metadata as { role?: string })?.role === DEALER_ROLE)
      .map((u) => ({ id: u.id, company: (u.user_metadata as { company?: string })?.company ?? '' }));

    const totalRes = await supabase.from('quotes').select('id', { count: 'exact', head: true });
    if (totalRes.error) return NextResponse.json({ error: totalRes.error.message }, { status: 500 });
    const total = totalRes.count ?? 0;

    const unlinkedRes = await supabase.from('quotes').select('id', { count: 'exact', head: true }).is('creator_user_id', null);
    if (unlinkedRes.error) return NextResponse.json({ error: unlinkedRes.error.message }, { status: 500 });
    const unlinked = unlinkedRes.count ?? 0;

    const byDealer: { company: string; count: number }[] = [];
    for (const d of dealers) {
      const r = await supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('creator_user_id', d.id);
      if (r.error) return NextResponse.json({ error: r.error.message }, { status: 500 });
      byDealer.push({ company: d.company, count: r.count ?? 0 });
    }
    byDealer.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      ok: true,
      total,
      linked: total - unlinked,
      unlinked,
      byDealer,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// 既存見積（creator_user_id 未設定）を、作成者会社名でディーラーアカウントに紐付ける。
// body.apply=false（既定）はプレビュー（件数のみ・DB更新なし）、true で実際に更新。
// 会社名は normalizeCompany で正規化して照合。既に紐付いている見積は対象外（上書きしない）。
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const body = await req.json().catch(() => ({}));
    const apply: boolean = body?.apply === true;

    const supabase = createServiceClient();

    // 1. ディーラーアカウント一覧（正規化会社名 -> user_id）
    const { data: userList, error: userErr } = await supabase.auth.admin.listUsers({ perPage: 200 });
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });

    const byNorm = new Map<string, { id: string; company: string; ambiguous: boolean }>();
    for (const u of userList.users || []) {
      const meta = u.user_metadata as { role?: string; company?: string } | undefined;
      if (meta?.role !== DEALER_ROLE) continue;
      const company = (meta.company ?? '').trim();
      if (!company) continue;
      const norm = normalizeCompany(company);
      if (!norm) continue;
      const cur = byNorm.get(norm);
      if (cur) cur.ambiguous = true; // 同じ正規化名の口座が複数 → 曖昧
      else byNorm.set(norm, { id: u.id, company, ambiguous: false });
    }

    // 2. 未紐付けの見積を取得（id と 作成者会社）
    const PAGE = 1000;
    const nullQuotes: { id: number; creator_company: string | null }[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('quotes')
        .select('id, creator_company')
        .is('creator_user_id', null)
        .range(from, from + PAGE - 1);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      nullQuotes.push(...(data ?? []));
      if (!data || data.length < PAGE) break;
    }

    // 3. 会社名で照合
    const idsByUser = new Map<string, number[]>();
    const perCompany = new Map<string, { company: string; count: number }>();
    const unmatchedNames = new Map<string, number>(); // 未一致の作成者会社名 -> 件数
    let unmatched = 0;
    let ambiguousCount = 0;
    for (const q of nullQuotes) {
      const norm = resolveCompanyNorm(q.creator_company ?? '');
      const dealer = norm ? byNorm.get(norm) : undefined;
      if (!dealer) {
        unmatched++;
        const label = (q.creator_company ?? '').trim() || '(空欄)';
        unmatchedNames.set(label, (unmatchedNames.get(label) ?? 0) + 1);
        continue;
      }
      if (dealer.ambiguous) { ambiguousCount++; continue; }
      if (!idsByUser.has(dealer.id)) idsByUser.set(dealer.id, []);
      idsByUser.get(dealer.id)!.push(q.id);
      const pc = perCompany.get(dealer.id) ?? { company: dealer.company, count: 0 };
      pc.count++;
      perCompany.set(dealer.id, pc);
    }

    const matched = Array.from(idsByUser.values()).reduce((s, a) => s + a.length, 0);

    // 4. apply のときだけ更新
    let updated = 0;
    if (apply) {
      const BATCH = 200;
      for (const [userId, ids] of Array.from(idsByUser.entries())) {
        for (let i = 0; i < ids.length; i += BATCH) {
          const chunk = ids.slice(i, i + BATCH);
          const { error } = await supabase
            .from('quotes')
            .update({ creator_user_id: userId })
            .in('id', chunk);
          if (error) return NextResponse.json({ error: error.message, at: userId }, { status: 500 });
          updated += chunk.length;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      apply,
      dealers: byNorm.size,
      unlinkedQuotes: nullQuotes.length,
      matched,
      updated,
      unmatched,
      ambiguous: ambiguousCount,
      byCompany: Array.from(perCompany.values()).sort((a, b) => b.count - a.count),
      dealerCompanies: Array.from(byNorm.values()).map((d) => d.company).sort(),
      unmatchedByCompany: Array.from(unmatchedNames.entries())
        .map(([company, count]) => ({ company, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 40),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
