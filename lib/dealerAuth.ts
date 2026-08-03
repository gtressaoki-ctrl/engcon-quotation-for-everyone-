// ディーラーログイン用の認証ヘルパー
// ログインは「会社名（株抜き）＋パスワード」。ディーラーはメールアドレス不要。
// 内部的には会社名から固定の合成メールアドレスを生成し、Supabase Auth に載せる。

export const DEALER_ROLE = 'dealer';

// 会社名を正規化（法人格・記号・空白を除去して小文字化）
export function normalizeCompany(company: string): string {
  return company
    .toLowerCase()
    .replace(/株式会社|有限会社|合同会社|（株）|（有）|\(株\)|\(有\)|㈱|㈲/g, '')
    .replace(/\s+/g, '');
}

// 会社名（株抜き）から Supabase Auth 用の固定・ASCIIの合成メールアドレスを生成する。
// 発行時とログイン時で同じ会社名から同じアドレスになるよう、SHA-256 で決定的に変換。
export async function dealerEmailFromCompany(company: string): Promise<string> {
  const norm = normalizeCompany(company);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(norm));
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `d${hex.slice(0, 24)}@dealer.local`;
}
