import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'engcon 見積もり作成システム',
  description: '株式会社 G.TRES engcon チルトローテータ 見積もり作成',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
