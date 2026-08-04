import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { DEALER_ROLE, normalizeCompany } from '@/lib/dealerAuth';

export const dynamic = 'force-dynamic';

function authorized(req: NextRequest): boolean {
  const key = req.headers.get('x-admin-key');
  return !!key && key === process.env.SUPABASE_SERVICE_ROLE_KEY;
}

// 会社名の別名。作成者会社が「別名（キー）」の見積は「正規会社名（値）」のアカウントに紐付ける。
// 例：MSJ はヤマノさんの別名。追加の別名が出たらここに追記する。
const COMPANY_ALIASES: Record<string, string> = {
  [normalizeCompany('MSJ')]: normalizeCompany('ヤマノ'),
};
function resolveCompanyNorm(company: string): string {
  const norm = normalizeCompany(company);
  return COMPANY_ALIASES[norm] ?? norm;
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
    let unmatched = 0;
    let ambiguousCount = 0;
    for (const q of nullQuotes) {
      const norm = resolveCompanyNorm(q.creator_company ?? '');
      const dealer = norm ? byNorm.get(norm) : undefined;
      if (!dealer) { unmatched++; continue; }
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
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
