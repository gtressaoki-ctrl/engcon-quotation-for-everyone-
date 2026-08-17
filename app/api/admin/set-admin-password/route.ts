import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { DEALER_ROLE } from '@/lib/dealerAuth';

export const dynamic = 'force-dynamic';

// 管理者アカウントの作成／パスワード再設定。
// サービスロールキー(x-admin-key)で認証。メール＋パスワードで、無ければ作成、有れば更新する。
// ディーラー(role=dealer)や合成メール(@dealer.local)は対象外（誤操作防止）。
// body: { email, password }
export async function POST(req: NextRequest) {
  const key = req.headers.get('x-admin-key')?.trim();
  if (!key || key !== process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const { email, password } = await req.json();
    const em = String(email ?? '').trim().toLowerCase();
    const pw = String(password ?? '');
    if (!em || !em.includes('@')) return NextResponse.json({ error: '有効なメールアドレスを入力してください' }, { status: 400 });
    if (pw.length < 6) return NextResponse.json({ error: 'パスワードは6文字以上にしてください' }, { status: 400 });
    if (em.endsWith('@dealer.local')) return NextResponse.json({ error: 'ディーラー用アドレスは指定できません' }, { status: 400 });

    const supabase = createServiceClient();
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 200 });
    if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

    const existing = (list?.users || []).find((u) => (u.email ?? '').toLowerCase() === em);
    if (existing) {
      const role = (existing.user_metadata as { role?: string } | undefined)?.role;
      if (role === DEALER_ROLE) {
        return NextResponse.json({ error: 'このアドレスはディーラーアカウントです' }, { status: 400 });
      }
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: pw,
        email_confirm: true,
        user_metadata: { ...(existing.user_metadata as object), role: 'admin' },
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, updated: true });
    }

    const { error } = await supabase.auth.admin.createUser({
      email: em,
      password: pw,
      email_confirm: true,
      user_metadata: { role: 'admin' },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, created: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
