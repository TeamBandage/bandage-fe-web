'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCreateSession } from '@/domain/practice/hooks/useCreateSession';
import { createSessionSchema, type CreateSessionSchema } from '@/domain/practice/types';
import { useToast } from '@/hooks/useToast';

const SESSION_TYPE_OPTIONS = [
  { value: 'VOCAL', label: 'VOCAL' },
  { value: 'CHORUS', label: 'CHORUS' },
  { value: 'GUITAR', label: 'GUITAR' },
  { value: 'BASS', label: 'BASS' },
  { value: 'DRUM', label: 'DRUM' },
  { value: 'PERCUSSION', label: 'PERCUSSION' },
  { value: 'SYNTH', label: 'SYNTH' },
  { value: 'ETC', label: 'ETC' },
] as const;

export function SessionCreateForm({
  practiceId,
  onCreated,
}: {
  practiceId: string;
  onCreated?: () => void;
}) {
  const toast = useToast();

  const form = useForm<CreateSessionSchema>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: { label: '', type: 'GUITAR' },
  });

  const mutation = useCreateSession(practiceId, {
    onSuccess: () => {
      toast.success('세션이 추가되었습니다.');
      form.reset({ label: '', type: 'GUITAR' });
      onCreated?.();
    },
    onError: (err) => toast.error(err.message || '세션 추가에 실패했습니다.'),
  });

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      noValidate
    >
      <Input
        label="라벨"
        placeholder="예: Guitar 2"
        error={form.formState.errors.label?.message}
        className="sm:flex-1"
        {...form.register('label')}
      />
      <Select
        label="타입"
        options={SESSION_TYPE_OPTIONS}
        error={form.formState.errors.type?.message}
        className="sm:w-40"
        {...form.register('type')}
      />
      <Button type="submit" loading={mutation.isPending}>
        추가
      </Button>
    </form>
  );
}
