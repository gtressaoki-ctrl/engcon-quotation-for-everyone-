import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { DEALER_ROLE, resolveCompanyNorm } from '@/lib/dealerAuth';

export const dynamic = 'force-dynamic';

// ログイン中ディーラーの見積一覧。
// 「作成ユーザーが自分」または「作成者会社が自分の会社名（別名込み）と一致」する見積を返す。
// これにより creator_user_id 未紐付けの見積でも、会社名が一致すれば表示される。
// 認証：ディーラーのアクセストークンを Authorization: Bearer で受け取りサーバー側で検証。
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
    if (!token) return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });

    const supabase = createServiceClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
    }
    const meta = userData.user.user_metadata as { role?: string; company?: string } | undefined;
    if (meta?.role !== DEALER_ROLE) {
      return NextResponse.json({ error: 'ディーラーのみ利用できます' }, { status: 403 });
    }
    const uid = userData.user.id;
    const companyNorm = resolveCompanyNorm(meta.company ?? '');

    // 全見積を取得（ページング）してサーバー側で会社/ユーザー一致のみ返す
    const PAGE = 1000;
    const rows: Record<string, unknown>[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      rows.push(...(data ?? []));
      if (!data || data.length < PAGE) break;
    }

    const mine = rows.filter((q) => {
      if (q.creator_user_id && q.creator_user_id === uid) return true;
      const cn = resolveCompanyNorm(String(q.creator_company ?? ''));
      return !!companyNorm && cn === companyNorm;
    });

    return NextResponse.json({ data: mine, count: mine.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
