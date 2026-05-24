/**
 * @file layout.tsx
 * @description 루트 레이아웃입니다.
 * 전역 스타일, 폰트, 메타데이터를 설정하고,
 * 인증 상태를 확인하여 AppHeader에 전달합니다.
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppHeader } from '@/components/common';
import { AppFooter } from '@/components/common';
import { getCurrentUser } from '@/services/authService';
import { Toaster } from '@/components/ui';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Insight Hub',
  description: '서로의 인사이트를 공유하고 성장하는 플랫폼',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>
          <AppHeader user={user} />
          <main className="min-h-screen">{children}</main>
          <AppFooter />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
