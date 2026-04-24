'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { useCreatePractice } from '@/domain/practice/hooks/useCreatePractice';
import { createPracticeSchema, type CreatePracticeSchema } from '@/domain/practice/types';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

export function PracticeCreateForm() {
  const router = useRouter();
  const toast = useToast();

  const form = useForm<CreatePracticeSchema>({
    resolver: zodResolver(createPracticeSchema),
    defaultValues: { title: '', song: '', venue: '', startAt: '', durationMinutes: 60 },
  });

  const mutation = useCreatePractice({
    onSuccess: (data) => {
      toast.success('합주가 생성되었습니다.');
      router.replace(ROUTES.PRACTICE_DETAIL(data.practiceId));
    },
    onError: (err) => toast.error(err.message || '합주 생성에 실패했습니다.'),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        mutation.mutate({
          title: values.title,
          song: values.song,
          venue: values.venue,
          startAt: values.startAt,
          durationMinutes: values.durationMinutes,
        }),
      )}
      noValidate
    >
      <Input
        label="제목 (선택)"
        placeholder="예: TuNA 정기공연 1주차 합주"
        error={form.formState.errors.title?.message}
        {...form.register('title')}
      />
      <Input
        label="합주곡 ID"
        placeholder="songId (UUID)"
        required
        hint="백엔드 합주곡 목록이 구축될 때까지는 songId 를 직접 입력합니다."
        error={form.formState.errors.song?.message}
        {...form.register('song')}
      />
      <Input
        label="장소 (선택)"
        placeholder="예: 홍대 스튜디오"
        error={form.formState.errors.venue?.message}
        {...form.register('venue')}
      />
      <div className="space-y-s-2">
        <label className="text-foreground text-caption font-semibold">
          시작 시각 <span className="text-danger">*</span>
        </label>
        <Controller
          name="startAt"
          control={form.control}
          render={({ field }) => (
            <DateTimePicker
              value={field.value ?? ''}
              onChange={field.onChange}
              aria-label="시작 시각"
              required
            />
          )}
        />
        <p className="text-foreground-muted text-micro">
          Asia/Seoul 기준 yyyy-MM-dd HH:mm 형식으로 저장됩니다.
        </p>
        {form.formState.errors.startAt?.message && (
          <p className="text-danger text-micro">{form.formState.errors.startAt.message}</p>
        )}
      </div>
      <Input
        label="소요 시간 (분)"
        type="number"
        min={15}
        max={480}
        step={15}
        required
        error={form.formState.errors.durationMinutes?.message}
        {...form.register('durationMinutes', { valueAsNumber: true })}
      />
      <Button type="submit" className="w-full" loading={mutation.isPending}>
        합주 만들기
      </Button>
    </form>
  );
}
