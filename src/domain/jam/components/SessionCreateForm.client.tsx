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

  function handleSubmit(e: React.FormEvent) {
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
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={handleSubmit}
      noValidate
    >
      <Input
        label="세션 이름"
        placeholder="예: Guitar 2"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="sm:flex-1"
      />
      <Input
        label="약어"
        placeholder="예: G2"
        value={short}
        onChange={(e) => setShort(e.target.value)}
        className="sm:w-24"
        maxLength={3}
      />
      <Input
        label="정원"
        type="number"
        min={1}
        max={20}
        value={need}
        onChange={(e) => setNeed(Number(e.target.value) || 1)}
        className="sm:w-20"
      />
      <Button type="submit" loading={mutation.isPending}>
        추가
      </Button>
    </form>
  );
}
