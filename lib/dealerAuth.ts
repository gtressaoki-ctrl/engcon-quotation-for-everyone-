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

// 会社名の別名。作成者会社が「別名（左）」の見積は「正規会社名（右）」として扱う。
// 表記揺れ（ローマ字・MSJ併記など）や別会社名を正規会社名に寄せる。追加はここに1行。
const RAW_COMPANY_ALIASES: [string, string][] = [
  ['MSJ', 'ヤマノ'],
  ['yamano', 'ヤマノ'],
  ['ヤマノMSJ', 'ヤマノ'],
  ['ギアトライム', 'GEARTRYM'],
  ['リーサステツク', 'リーサステック'],
];
export const COMPANY_ALIASES: Record<string, string> = Object.fromEntries(
  RAW_COMPANY_ALIASES.map(([alias, canonical]) => [normalizeCompany(alias), normalizeCompany(canonical)])
);

// 会社名を正規化し、別名なら正規会社名の正規化形に解決する。会社照合の共通キー。
export function resolveCompanyNorm(company: string): string {
  const norm = normalizeCompany(company);
  return COMPANY_ALIASES[norm] ?? norm;
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
