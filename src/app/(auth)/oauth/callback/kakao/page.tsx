import type { Metadata } from 'next';
import { Suspense } from 'react';

import { KakaoCallback } from './KakaoCallback.client';

export const metadata: Metadata = {
  title: '카카오 로그인 처리 중 | Bandage',
};

export default function KakaoCallbackPage() {
  return (
    <Suspense fallback={null}>
      <KakaoCallback />
    </Suspense>
  );
}
