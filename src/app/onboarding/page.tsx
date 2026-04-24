import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ROUTES } from '@/global/config/routes';

import { OnboardingHero } from './OnboardingHero';

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

  // Features 섹션은 subtask 10.3 에서 추가.
  return (
    <main className="bg-bg text-foreground min-h-screen" data-slot="onboarding">
      <OnboardingHero />
    </main>
  );
}
