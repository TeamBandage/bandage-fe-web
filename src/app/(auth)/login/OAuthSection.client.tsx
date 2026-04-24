'use client';

import { OAuthButton } from '@/components/ui/oauth-button';
import { useToast } from '@/hooks/useToast';

/**
 * OAuth 로그인 섹션 (카카오/구글/애플 빈 버튼).
 * 실제 OAuth 연결은 후속 작업에서 구현. 현재는 토스트로 "준비 중" 안내.
 */
export function OAuthSection() {
  const toast = useToast();
  const notReady = () => toast.info('준비 중입니다.');

  return (
    <section aria-label="OAuth 로그인" className="space-y-s-3" data-slot="oauth-section">
      <OAuthButton provider="kakao" onClick={notReady} />
      <OAuthButton provider="google" onClick={notReady} />
      <OAuthButton provider="apple" onClick={notReady} />
      <div className="gap-s-3 py-s-2 flex items-center">
        <span className="bg-border h-px flex-1" aria-hidden="true" />
        <span className="text-foreground-muted text-micro">또는</span>
        <span className="bg-border h-px flex-1" aria-hidden="true" />
      </div>
    </section>
  );
}
