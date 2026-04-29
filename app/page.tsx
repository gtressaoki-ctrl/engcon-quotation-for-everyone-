import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="bg-white rounded-2xl shadow-lg p-12 max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">engcon</h1>
        <h2 className="text-xl text-gray-600 mb-8">チルトローテータ 見積もり作成システム</h2>
        <p className="text-gray-500 mb-2 text-sm">株式会社 G.TRES</p>
        <p className="text-gray-400 mb-10 text-xs">〒761-0301 香川県高松市2008番地1</p>

        <Link
          href="/wizard"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition"
        >
          見積もりを作成する
        </Link>

        <div className="mt-6">
          <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600">
            管理者ログイン
          </Link>
        </div>
      </div>
    </main>
  );
}
