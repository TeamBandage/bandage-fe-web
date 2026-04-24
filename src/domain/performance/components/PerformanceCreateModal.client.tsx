'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import {
  ResponsiveSheet,
  ResponsiveSheetBody,
  ResponsiveSheetClose,
  ResponsiveSheetContent,
  ResponsiveSheetFooter,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
  ResponsiveSheetTrigger,
} from '@/components/ui/responsive-sheet';
import { StepIndicator } from '@/components/ui/step-indicator';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePerformance } from '@/domain/performance/hooks/useCreatePerformance';
import { createPerformanceSchema, type CreatePerformanceSchema } from '@/domain/performance/types';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

const STEPS = ['기본 정보', '일정', '장소'] as const;

type FormValues = CreatePerformanceSchema & { bandIdsRaw?: string };

export function PerformanceCreateModal({ trigger }: { trigger: ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(createPerformanceSchema),
    defaultValues: { title: '', bandIds: [], startAt: '', durationMinutes: 120, venue: '' },
    mode: 'onTouched',
  });

  const mutation = useCreatePerformance({
    onSuccess: (data) => {
      toast.success('공연이 생성되었습니다.');
      setOpen(false);
      setStep(0);
      form.reset();
      router.replace(ROUTES.PERFORMANCE_DETAIL(data.performanceId));
    },
    onError: (err) => toast.error(err.message || '공연 생성에 실패했습니다.'),
  });

  async function next() {
    if (step === 0) {
      const ok = await form.trigger(['title']);
      if (ok) setStep(1);
    } else if (step === 1) {
      setStep(2);
    }
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setStep(0);
          form.reset();
        }
      }}
    >
      <ResponsiveSheetTrigger asChild>{trigger}</ResponsiveSheetTrigger>
      <ResponsiveSheetContent>
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>새 공연 만들기</ResponsiveSheetTitle>
        </ResponsiveSheetHeader>
        <ResponsiveSheetBody>
          <form
            id="performance-create-form"
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
            className="space-y-s-4"
          >
            <StepIndicator steps={STEPS} current={step} />
            {step === 0 && (
              <>
                <Input
                  label="공연 제목"
                  required
                  placeholder="예: TuNA 정기공연"
                  error={form.formState.errors.title?.message}
                  {...form.register('title')}
                />
                <Input
                  label="참여 밴드 ID (쉼표/공백 구분, 선택)"
                  placeholder="예: <uuid1>, <uuid2>"
                  {...form.register('bandIdsRaw')}
                />
              </>
            )}
            {step === 1 && (
              <div className="space-y-s-4">
                <div className="space-y-s-2">
                  <label className="text-foreground text-caption font-semibold">
                    시작 시각 <span className="text-danger">*</span>
                  </label>
                  <Controller
                    name="startAt"
                    control={form.control}
                    render={({ field }) => (
                      <DateTimePicker value={field.value ?? ''} onChange={field.onChange} />
                    )}
                  />
                  {form.formState.errors.startAt?.message && (
                    <p className="text-danger text-micro">
                      {form.formState.errors.startAt.message}
                    </p>
                  )}
                </div>
                <Input
                  label="소요 시간(분)"
                  type="number"
                  min={30}
                  max={600}
                  step={30}
                  required
                  error={form.formState.errors.durationMinutes?.message}
                  {...form.register('durationMinutes', { valueAsNumber: true })}
                />
              </div>
            )}
            {step === 2 && (
              <Textarea
                label="장소 (선택)"
                placeholder="예: Club FF"
                error={form.formState.errors.venue?.message}
                {...form.register('venue')}
              />
            )}
          </form>
        </ResponsiveSheetBody>
        <ResponsiveSheetFooter>
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={() => setStep((s) => (s === 2 ? 1 : 0))}>
              이전
            </Button>
          ) : (
            <ResponsiveSheetClose asChild>
              <Button type="button" variant="ghost">
                취소
              </Button>
            </ResponsiveSheetClose>
          )}
          {step < 2 ? (
            <Button type="button" onClick={next} disabled={mutation.isPending}>
              다음
            </Button>
          ) : (
            <Button type="submit" form="performance-create-form" loading={mutation.isPending}>
              공연 만들기
            </Button>
          )}
        </ResponsiveSheetFooter>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
