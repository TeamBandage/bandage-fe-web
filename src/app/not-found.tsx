import { Compass } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/global/config/routes';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Compass className="text-foreground-muted h-12 w-12" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-foreground text-xl font-semibold">페이지를 찾을 수 없어요</p>
        <p className="text-foreground-sub text-sm">주소가 바뀌었거나 더 이상 존재하지 않습니다.</p>
      </div>
      <Button asChild variant="secondary">
        <Link href={ROUTES.HOME}>홈으로 돌아가기</Link>
      </Button>
    </div>
  );
}
