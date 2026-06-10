import type { SStandard } from '@/types/quote';

// S規格別「ECOブロック付きブラケット」の対象品（GS-WD/GS-BPE系のEC-Oilブロック内蔵ブラケット）
const ECO_BRACKET_PATTERNS: Record<string, string[]> = {
  '40': ['GS-WD-QS40 -T59', 'GS-BPE1-QS40-T59', 'GS-BPE2-QS40-T59'],
  '45': ['GS-WD-QS45-T5', 'GS-BPE2-QS45-T5'],
  '60': [
    'GS-WD-QS60 -T1', 'GS-WD-QS60 -T2', 'GS-WD-QS60 -T8', 'GS-WD-QS60 -T26', 'GS-WD-QS60 -T37', 'GS-WD-QS60 -T38', 'GS-WD-QS60 -T44',
    'GS-BPE2-QS60-T2', 'GS-BPE2-QS60-T44', 'GS-BPE3-QS60-T2', 'GS-BPE3-QS60-T8', 'GS-BPE4-QS60-T2',
  ],
  '70': [
    'GS-WD-QS70 -T11', 'GS-WD-QS70 -T12', 'GS-WD-QS70 -T18', 'GS-WD-QS70 -T20', 'GS-WD-QS70 -T32', 'GS-WD-QS70 -T50',
    'GS-BPE2-QS70-T12', 'GS-BPE2-QS70-T20', 'GS-BPE3-QS70-T12', 'GS-BPE3-QS70-T20', 'GS-BPE4-QS70-T12',
  ],
  '80': ['GS-WD-QS80 -T35', 'GS-WD-QS80 -T40', 'GS-WD-QS80 -T41', 'GS-WD-QS80 -T53', 'GS-BPE-QS80 -SK30/TG55-T12'],
};

export interface AttachmentCategory {
  id: string;
  label_ja: string;
  group: 'mechanical' | 'hydraulic';
  getPatterns: (n: string) => string[];  // n = '40'/'45'/'60'/'70'
  keepFn?: (desc: string) => boolean;    // client-side filter; return false to exclude
}

export const ATTACHMENT_CATEGORIES: AttachmentCategory[] = [
  // --- 機械式 ---
  {
    id: 'grading_bucket', label_ja: 'グレーディングバケット', group: 'mechanical',
    getPatterns: (n) => [`Bucket GB%-S${n}%`],
  },
  {
    id: 'digging_bucket_cat', label_ja: '爪付き掘削バケット', group: 'mechanical',
    getPatterns: (n) => [`Bucket DB%-S${n}-CAT%`],
  },
  {
    id: 'digging_bucket', label_ja: '爪なし掘削バケット', group: 'mechanical',
    getPatterns: (n) => [`Bucket DB%-S${n}%`],
    keepFn: (d) => !d.includes('CAT'),
  },
  {
    id: 'cable_bucket', label_ja: 'ケーブルバケット', group: 'mechanical',
    getPatterns: (n) => [`Bucket CB%-S${n}%`],
  },
  {
    id: 'skeleton_bucket', label_ja: 'スケルトンバケット', group: 'mechanical',
    getPatterns: (n) => [`Bucket SB%-S${n}%`],
  },
  {
    id: 'grading_beam', label_ja: 'グレーディングビーム', group: 'mechanical',
    getPatterns: (n) => [`GRB%-QS${n}%`, `GRB%-S${n}%`, `Grading beam GRB%-S${n}%`],
  },
  {
    id: 'tarmac_cutter', label_ja: 'ターマックカッター', group: 'mechanical',
    getPatterns: (n) => [`TC%-S${n}%`],
    keepFn: (d) => /^TC\d/.test(d),
  },
  {
    id: 'ripper', label_ja: 'リッパー', group: 'mechanical',
    getPatterns: (n) => [`R%-S${n}%`],
    keepFn: (d) => /^R\d/.test(d),
  },
  {
    id: 'pallet_fork', label_ja: 'パレットフォーク', group: 'mechanical',
    getPatterns: (n) => [`GAF%-S${n}%`, `GAF%-QS${n}%`],
  },
  {
    id: 'mechanical_bracket', label_ja: '機械式ブラケット', group: 'mechanical',
    getPatterns: (n) => [`GS-WD-S${n}%`],
  },
  {
    id: 'eco_bracket', label_ja: 'ECOブロック付きブラケット', group: 'mechanical',
    getPatterns: (n) => ECO_BRACKET_PATTERNS[n] ?? [],
  },
  // --- 油圧式 ---
  {
    id: 'sg', label_ja: 'ストーン＆ソーティンググラブ', group: 'hydraulic',
    getPatterns: (n) => [`SG%-QS${n}%`],
    keepFn: (d) => /^SG\d/.test(d),
  },
  {
    id: 'tg', label_ja: 'ティンバーグラブ', group: 'hydraulic',
    getPatterns: (n) => [`TG%-QS${n}%`],
    keepFn: (d) => /^TG\d/.test(d),
  },
  {
    id: 'compactor', label_ja: 'コンパクター', group: 'hydraulic',
    getPatterns: (n) => [`PP%-QS${n}%`, `PC%-QS${n}%`],
    keepFn: (d) => /^(PP|PC)\d/.test(d),
  },
  {
    id: 'sweeper_roller', label_ja: 'スイーパーローラー', group: 'hydraulic',
    getPatterns: (n) => [`Sweeper-SWD${n}%`],
  },
  {
    id: 'detachable_sweeper', label_ja: '脱着式スイーパー', group: 'hydraulic',
    getPatterns: (n) => [`Sweeper-SR%-QS${n}%`, `Sweeper-SR%-S${n}%`],
  },
  {
    id: 'grapple_saw', label_ja: 'グラップルソー', group: 'hydraulic',
    getPatterns: () => [],  // カタログなし・手動入力
  },
];

export function getStdNum(s: SStandard): string {
  return s.replace('S', '');
}

export function getCategoryById(id: string): AttachmentCategory | undefined {
  return ATTACHMENT_CATEGORIES.find((c) => c.id === id);
}
