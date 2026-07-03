// 在庫表示の共通バッジ。実在庫数は出さず「在庫あり／なし」に丸める。
// 在庫データが無い（未管理）品番は「—」表示。
export default function InventoryBadge({ itemNo, inventory }: { itemNo?: string; inventory: Record<string, number> | null }) {
  if (!itemNo || inventory === null) return <span className="text-gray-300 text-xs">—</span>;
  const bal = inventory[itemNo];
  if (bal === undefined) return <span className="text-gray-300 text-xs">—</span>;
  return bal > 0
    ? <span className="text-green-600 text-xs font-medium whitespace-nowrap">● 在庫あり</span>
    : <span className="text-red-500 text-xs font-medium whitespace-nowrap">● 在庫なし</span>;
}
