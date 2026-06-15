// ディーラー担当者の連絡先一覧
// 見積保存時の通知メールを、作成したディーラー担当者にもCCするためのマッピング
interface DealerContact {
  // 会社名・担当者名のどちらかに含まれていれば一致とみなすキーワード群
  aliases: string[];
  email: string;
}

const DEALER_CONTACTS: DealerContact[] = [
  { aliases: ['生振商会'], email: 'oyahuru@shirt.ocn.ne.jp' },
  { aliases: ['ヤマノ', 'yamano'], email: 'ymn-taku.yamano@yamano-inc.com' },
  { aliases: ['IB', '石橋'], email: 'ishibashi@ib-ltd.co.jp' },
  { aliases: ['RSM', '箕輪'], email: 'keisuke_minowa@r-solution-m.com' },
  { aliases: ['寿', 'kotobuki', '菅沼'], email: 'y.suganuma@kotobuki-nagano.com' },
  { aliases: ['ICM', '五十嵐'], email: 'm.igarashi@icm.co.jp' },
  { aliases: ['イッシキ', '一色'], email: 'n.isski1977@gmail.com' },
  { aliases: ['ダイト', 'daito'], email: 'oka@daito2019.co.jp' },
  { aliases: ['GEARTRYM', 'GEAR TRYM', 'ギアトライム'], email: 'geartrym.maeta@gmail.com' },
  { aliases: ['原商'], email: 'y-kobayashi@harasho.co.jp' },
  { aliases: ['喜多機械'], email: 'takahide.hashimoto@kitakikai.co.jp' },
  { aliases: ['富士岡山'], email: 'tanino@fuji-group.com' },
  { aliases: ['SWAGETEC'], email: 'swagetec01@outlook.jp' },
  { aliases: ['リーサステック', 'リ―サステック', '武田'], email: 'risus.t.0126@gmail.com' },
  { aliases: ['ゆいまーる', '大城'], email: 'yuimaru_kenki@outlook.jp' },
  { aliases: ['下元'], email: 'shimomoto@sage.ocn.ne.jp' },
  { aliases: ['横田'], email: 'h.yokota@kawabata-k.jp' },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/株式会社|有限会社|合同会社|（株）|（有）|\(株\)|\(有\)/g, '')
    .replace(/\s+/g, '');
}

// 会社名・担当者名のいずれかからディーラー担当者のメールアドレスを探す
export function findDealerEmail(company: string, name: string): string | undefined {
  const targets = [normalize(company || ''), normalize(name || '')];
  for (const contact of DEALER_CONTACTS) {
    for (const alias of contact.aliases) {
      const normalizedAlias = normalize(alias);
      if (targets.some((t) => t && (t.includes(normalizedAlias) || normalizedAlias.includes(t)))) {
        return contact.email;
      }
    }
  }
  return undefined;
}
