'use client';

import Image from 'next/image';
import { useState } from 'react';

import { NotificationBell } from '@/domain/notification/components/NotificationBell.client';

import { ProfileMenu } from './ProfileMenu.client';

type ActivePanel = 'notification' | 'profile' | null;

export function GlobalTopbar() {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  return (
    // z-37: 사이드바(z-20)보다 위, 전체화면 오버레이/모달(z-40 이상)보다는 아래에 둬서
    // 알림 드롭다운이 항상 콘텐츠 위에 뜨고, topbar 로고도 사이드바에 가리지 않게 함.
    // 로고는 이제 여기 한 곳에서만 렌더 — 사이드바는 접힘/펼침과 무관하게 자체 로고를 갖지 않음.
    <header className="bg-surface border-border fixed top-0 right-0 left-0 z-37 flex h-14 shrink-0 items-center justify-between border-b px-4">
      <Image
        src="/brand/bandage_wave_text_white.png"
        alt="Bandage"
        width={110}
        height={23}
        priority
      />
      <div className="flex items-center gap-5">
        {/* 아바타가 사라지는 데스크톱에서는 알림벨이 우측 끝에 바짝 붙어 살짝 왼쪽으로 띄움 */}
        <div className="lg:mr-3">
          <NotificationBell
            collapsed
            placement="topbar"
            open={activePanel === 'notification'}
            onOpenChange={(v) => setActivePanel(v ? 'notification' : null)}
          />
        </div>
        {/* 데스크톱은 사이드바 하단에 프로필 메뉴가 이미 있어 topbar에서는 모바일에서만 노출 */}
        <ProfileMenu
          open={activePanel === 'profile'}
          onOpenChange={(v) => setActivePanel(v ? 'profile' : null)}
        />
      </div>
    </header>
  );
}
