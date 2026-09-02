// 在庫表示の共通バッジ。
// 既定（ディーラー向け）は実在庫数を出さず「在庫あり／なし」に丸める。
// showQuantity=true（G.TRES/管理者が閲覧時）は在庫数量も表示する。
// 在庫データが無い（未管理）品番は「—」表示。
export default function InventoryBadge({
  itemNo,
  inventory,
  showQuantity = false,
}: {
  itemNo?: string;
  inventory: Record<string, number> | null;
  showQuantity?: boolean;
}) {
  if (!itemNo || inventory === null) return <span className="text-gray-300 text-xs">—</span>;
  const bal = inventory[itemNo];
  if (bal === undefined) return <span className="text-gray-300 text-xs">—</span>;
  if (bal > 0) {
    return (
      <span className="text-green-600 text-xs font-medium whitespace-nowrap">
        ● 在庫あり{showQuantity ? `（${bal}）` : ''}
      </span>
    );
  }
  return (
    <span className="text-red-500 text-xs font-medium whitespace-nowrap">
      ● 在庫なし{showQuantity ? `（${bal}）` : ''}
    </span>
  );
}
