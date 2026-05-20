/**
 * @file ScrollToTop.tsx
 * @description 페이지 이동 시 스크롤을 맨 위로 이동시키는 컴포넌트입니다.
 * Next.js에서는 자동으로 처리되므로 빈 컴포넌트로 유지합니다.
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
