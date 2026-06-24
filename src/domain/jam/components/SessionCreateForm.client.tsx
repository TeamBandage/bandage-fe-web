'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateSession } from '@/domain/jam/hooks/useCreateSession';
import { useToast } from '@/hooks/useToast';

export function SessionCreateForm({ jamId, onCreated }: { jamId: string; onCreated?: () => void }) {
  const toast = useToast();
  const [label, setLabel] = useState('');
  const [short, setShort] = useState('');
  const [need, setNeed] = useState(1);

  const mutation = useCreateSession(jamId, {
    onSuccess: () => {
      toast.success('세션이 추가되었습니다.');
      setLabel('');
      setShort('');
      setNeed(1);
      onCreated?.();
    },
    onError: (err) => toast.error(err.message || '세션 추가에 실패했습니다.'),
  });

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!label.trim()) return toast.error('세션 이름을 입력해 주세요.');
    if (!short.trim()) return toast.error('약어를 입력해 주세요.');
    mutation.mutate({
      sessionId: short.toUpperCase(),
      label: label.trim(),
      short: short.toUpperCase().slice(0, 3),
      need,
      custom: true,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-x-3 gap-y-1.5" style={{ gridTemplateColumns: '2fr 1fr 1fr auto' }}>
        <span className="text-foreground text-xs font-medium">세션 이름</span>
        <span className="text-foreground text-xs font-medium">약어</span>
        <span className="text-foreground text-xs font-medium">정원</span>
        <span />
        <Input
          placeholder="예: Guitar 2"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0"
        />
        <Input
          placeholder="예: G2"
          value={short}
          onChange={(e) => setShort(e.target.value)}
          maxLength={3}
          className="rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0"
        />
        <Input
          type="number"
          min={1}
          max={20}
          value={need}
          onChange={(e) => setNeed(Number(e.target.value) || 1)}
          className="rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0"
        />
        <Button
          type="submit"
          variant="secondary"
          className="h-8 w-fit self-end rounded-[5px] border-white bg-white px-3 text-neutral-900 hover:bg-white/90 active:bg-white/80"
          loading={mutation.isPending}
        >
          추가
        </Button>
      </div>
    </form>
  );
}
