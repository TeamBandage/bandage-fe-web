import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ROUTES } from '@/global/config/routes';

const REFRESH_COOKIE = 'refreshToken';

export const metadata = {
  title: 'Bandage — 밴드 합주·공연을 한 곳에서',
  description: '밴드 합주 일정 / 세션 편성 / 공연을 하나의 워크스페이스에서 관리하세요.',
};

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  if (cookieStore.has(REFRESH_COOKIE)) {
    redirect(ROUTES.HOME);
  }

  // Hero + Features 는 후속 subtask (10.2, 10.3) 에서 채운다.
  return (
    <div className="bg-bg text-foreground min-h-screen" data-slot="onboarding">
      <section className="px-s-4 py-s-12">
        <h1 className="text-title-lg font-bold">Bandage</h1>
        <p className="text-foreground-sub mt-s-2 text-body">
          온보딩 페이지 기본 shell. Hero / Features 는 후속 서브태스크에서 채워집니다.
        </p>
      </section>
    </div>
  );
}
