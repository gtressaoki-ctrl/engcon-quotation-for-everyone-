import type { SStandard } from '@/types/quote';

// 品名（価格マスタの正式名）に含まれるS規格の番号を取り出す。
// 例: "EC214S-QSM60Q-QS60-DC2-24V-H28-T1" → [60, 60]
//     "GRD45/50B-QSD45/50/QSM45/50"       → [45, 50, 45, 50]
const S_TOKEN = /\bQS[MD]?(\d{2})/g;

export function sClassTokens(name: string): number[] {
  const re = new RegExp(S_TOKEN.source, 'g');
  const out: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(name)) !== null) out.push(parseInt(m[1], 10));
  return out;
}

// 品名のS規格が、選択したS規格と食い違っていれば true。
// 複数サイズ対応品（GRD45/50 など）は該当サイズを含んでいればOK。
// S30はS40のインターフェース品を使うため、S30×40 は不一致としない。
export function isSClassMismatch(name: string, s_standard: SStandard): boolean {
  const tokens = sClassTokens(name);
  if (tokens.length === 0) return false;   // S規格表記のない品名（ホース等）は判定対象外
  const want = parseInt(s_standard.slice(1), 10);
  if (tokens.includes(want)) return false;
  if (want === 30 && tokens.includes(40)) return false;
  return true;
}

// 警告文（画面表示用）
export function sClassMismatchNote(name: string, s_standard: SStandard): string | null {
  if (!isSClassMismatch(name, s_standard)) return null;
  const tokens = Array.from(new Set(sClassTokens(name)));
  return `S${tokens.join('/')}用の品番です（選択中のS規格は ${s_standard}）。品番をご確認ください。`;
}

// 警告の短縮表記（一覧の狭い列で使う）
export function sClassMismatchShort(name: string, s_standard: SStandard): string | null {
  if (!isSClassMismatch(name, s_standard)) return null;
  const tokens = Array.from(new Set(sClassTokens(name)));
  return `S${tokens.join('/')}用`;
}
