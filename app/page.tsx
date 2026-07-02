import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="bg-white rounded-2xl shadow-lg p-12 max-w-lg w-full text-center">
        <div className="flex justify-center mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/engcon-logo-on-yellow.jpg" alt="engcon" className="h-14 rounded-lg" />
        </div>
        <h2 className="text-xl text-gray-600 mb-8">チルトローテータ 見積もり作成システム</h2>
        <p className="text-gray-500 mb-2 text-sm">株式会社 G.TRES</p>
        <p className="text-gray-400 mb-10 text-xs">〒761-0301 香川県高松市2008番地1</p>

        <Link
          href="/wizard"
          className="block w-full bg-primary hover:bg-neutral-800 text-white font-semibold py-4 px-8 rounded-xl text-lg transition"
        >
          見積もりを作成する
        </Link>

        <Link
          href="/lookup"
          className="block w-full mt-3 border border-black text-black hover:bg-neutral-50 font-semibold py-4 px-8 rounded-xl text-lg transition"
        >
          品番から金額を確認する
        </Link>

        <div className="mt-6 flex flex-col gap-2">
          <Link href="/dealer/login" className="text-sm text-black hover:underline">
            ディーラーログイン（自分の見積を見返す）
          </Link>
          <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600">
            管理者ログイン
          </Link>
        </div>
      </div>
    </main>
  );
}
