import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';

import { ErrorBoundary, Toaster } from '@/components/feedback';
import { QueryProvider } from '@/global/providers/query-provider';

import './globals.css';

const notoSansKr = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bandage',
  description: '밴드 합주·공연 매니저',
  icons: { icon: '/brand/bandage_wave_favicon_1.5.png' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`dark ${notoSansKr.variable}`}>
      <body className="min-h-screen">
        <QueryProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
