'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePerformance } from '@/domain/performance/hooks/useCreatePerformance';
import { createPerformanceSchema, type CreatePerformanceSchema } from '@/domain/performance/types';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

type FormValues = CreatePerformanceSchema & { bandIdsRaw?: string };

export function PerformanceCreateForm() {
  const router = useRouter();
  const toast = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(createPerformanceSchema),
    defaultValues: {
      title: '',
      bandIds: [],
      startAt: '',
      durationMinutes: 120,
      venue: '',
    },
  });

  const mutation = useCreatePerformance({
    onSuccess: (data) => {
      toast.success('공연이 생성되었습니다.');
      router.replace(ROUTES.PERFORMANCE_DETAIL(data.performanceId));
    },
    onError: (err) => toast.error(err.message || '공연 생성에 실패했습니다.'),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => {
        const raw = (values.bandIdsRaw ?? '').trim();
        const bandIds = raw
          ? raw
              .split(/[\s,]+/)
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;
        mutation.mutate({
          title: values.title,
          bandIds,
          startAt: values.startAt,
          durationMinutes: values.durationMinutes,
          venue: values.venue,
        });
      })}
      noValidate
    >
      <Input
        label="공연 제목"
        placeholder="예: TuNA 정기공연"
        required
        error={form.formState.errors.title?.message}
        {...form.register('title')}
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
              aria-label="공연 시작 시각"
              required
            />
          )}
        />
        <p className="text-foreground-muted text-micro">
          Asia/Seoul 기준 yyyy-MM-dd HH:mm 으로 저장됩니다.
        </p>
        {form.formState.errors.startAt?.message && (
          <p className="text-danger text-micro">{form.formState.errors.startAt.message}</p>
        )}
      </div>
      <Input
        label="소요 시간 (분)"
        type="number"
        min={30}
        max={600}
        step={30}
        required
        error={form.formState.errors.durationMinutes?.message}
        {...form.register('durationMinutes', { valueAsNumber: true })}
      />
      <Input
        label="장소 (선택)"
        placeholder="예: Club FF"
        error={form.formState.errors.venue?.message}
        {...form.register('venue')}
      />
      <Textarea
        label="참여 밴드 ID (선택)"
        placeholder="bandId 를 쉼표 또는 줄바꿈으로 구분해 입력"
        hint="백엔드 밴드 선택 UX 도입 전까지 bandId(UUID) 를 직접 입력합니다. 비워 두면 빈 배열로 전송됩니다."
        {...form.register('bandIdsRaw')}
      />
      <Button type="submit" className="w-full" loading={mutation.isPending}>
        공연 만들기
      </Button>
    </form>
  );
}
