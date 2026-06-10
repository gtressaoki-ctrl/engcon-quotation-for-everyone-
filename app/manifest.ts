import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'engcon 見積もり作成システム',
    short_name: 'engcon見積',
    description: '株式会社 G.TRES engcon チルトローテータ 見積もり作成',
    start_url: '/',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#1d4ed8',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
