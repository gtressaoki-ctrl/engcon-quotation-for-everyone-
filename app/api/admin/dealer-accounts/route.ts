import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { dealerEmailFromCompany, DEALER_ROLE } from '@/lib/dealerAuth';

function authorized(req: NextRequest): boolean {
  const key = req.headers.get('x-admin-key');
  return !!key && key === process.env.SUPABASE_SERVICE_ROLE_KEY;
}

// ディーラーログインアカウント一覧
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const dealers = (data.users || [])
      .filter((u) => (u.user_metadata as { role?: string })?.role === DEALER_ROLE)
      .map((u) => ({
        id: u.id,
        company: (u.user_metadata as { company?: string })?.company ?? '',
        created_at: u.created_at,
      }));
    return NextResponse.json({ data: dealers });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// ディーラーログインアカウントの発行（既存があればパスワード・会社名を更新）
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const { company, password } = await req.json();
    if (!company?.trim() || !password?.trim()) {
      return NextResponse.json({ error: '会社名とパスワードは必須です' }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'パスワードは6文字以上にしてください' }, { status: 400 });
    }
    const email = await dealerEmailFromCompany(company);
    const supabase = createServiceClient();

    const { data: list } = await supabase.auth.admin.listUsers({ perPage: 200 });
    const existing = (list?.users || []).find((u) => u.email === email);
    const metadata = { role: DEALER_ROLE, company: String(company).trim() };

    if (existing) {
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: String(password),
        user_metadata: metadata,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, updated: true });
    }

    const { error } = await supabase.auth.admin.createUser({
      email,
      password: String(password),
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, created: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// ディーラーログインアカウントの削除
export async function DELETE(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const supabase = createServiceClient();
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
