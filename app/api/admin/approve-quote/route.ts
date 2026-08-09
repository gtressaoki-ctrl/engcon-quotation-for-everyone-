import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { DEALER_ROLE } from '@/lib/dealerAuth';

export const dynamic = 'force-dynamic';

// 見積の承認／承認取消（管理者のみ）。
// 認証：管理者ログインのセッションのアクセストークンを Authorization: Bearer で受け取り、
// ディーラー以外の認証ユーザー（＝管理者）であることをサーバー側で検証する。
// body: { id: number, approve: boolean, adminComment?: string }
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
    if (!token) return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });

    const supabase = createServiceClient();

    // トークンからユーザーを検証
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
    }
    const role = (userData.user.user_metadata as { role?: string } | undefined)?.role;
    if (role === DEALER_ROLE) {
      return NextResponse.json({ error: '管理者のみ操作できます' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const id = Number(body?.id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: 'idが不正です' }, { status: 400 });
    const approve: boolean = body?.approve === true;
    const adminComment: string | null = typeof body?.adminComment === 'string' ? body.adminComment : null;

    const update: Record<string, unknown> = {
      status: approve ? 'approved' : 'pending',
      admin_comment: adminComment && adminComment.trim() ? adminComment.trim() : null,
      approved_at: approve ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from('quotes').update(update).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, status: update.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
