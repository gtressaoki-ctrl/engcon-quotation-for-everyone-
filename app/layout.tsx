import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegister from './ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'engcon 見積もり作成システム',
  description: '株式会社 G.TRES engcon チルトローテータ 見積もり作成',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'engcon見積',
  },
};

export const viewport: Viewport = {
  themeColor: '#1d4ed8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
