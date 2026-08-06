'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { normalizeSessionLabel } from '@/components/ui/session-composer';
import { useCreateSession } from '@/domain/jam/hooks/useCreateSession';
import { useToast } from '@/hooks/useToast';

export function SessionCreateForm({ jamId, onCreated }: { jamId: string; onCreated?: () => void }) {
  const toast = useToast();
  const [label, setLabel] = useState('');

  const mutation = useCreateSession(jamId, {
    onSuccess: () => {
      toast.success('세션이 추가되었습니다.');
      setLabel('');
      onCreated?.();
    },
    onError: (err) => toast.error(err.message || '세션 추가에 실패했습니다.'),
  });

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!label.trim()) return toast.error('세션 이름을 입력해 주세요.');
    // 세션 1개 = 인원 1명. 같은 악기가 여러 명 필요하면 같은 이름으로 여러 번 추가.
    // sessionId 는 서버가 발급(BD-269) — 신규 세션 생성 시 전송하지 않음.
    mutation.mutate({ label, custom: true });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-x-3 gap-y-1.5" style={{ gridTemplateColumns: '1fr auto' }}>
        <span className="text-foreground text-xs font-medium">세션 이름</span>
        <span />
        <Input
          placeholder="예: PERCUSSION (영문 대문자로 자동 변환)"
          value={label}
          onChange={(e) => setLabel(normalizeSessionLabel(e.target.value).slice(0, 20))}
          className="rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0"
        />
        <Button
          type="submit"
          variant="secondary"
          className="h-10 w-fit self-end rounded-[5px] border-white bg-white px-3 text-neutral-900 hover:bg-white/90 active:bg-white/80"
          loading={mutation.isPending}
        >
          추가
        </Button>
      </div>
    </form>
  );
}
