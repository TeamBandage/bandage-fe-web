import type { Metadata } from 'next';
import { Suspense } from 'react';

import { GoogleCallback } from './GoogleCallback.client';

export const metadata: Metadata = {
  title: '구글 로그인 처리 중 | Bandage',
};

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleCallback />
    </Suspense>
  );
}
