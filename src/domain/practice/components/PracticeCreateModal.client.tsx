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
import { useCreatePractice } from '@/domain/practice/hooks/useCreatePractice';
import { createPracticeSchema, type CreatePracticeSchema } from '@/domain/practice/types';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

const STEPS = ['제목·곡', '장소', '시간'] as const;

export function PracticeCreateModal({ trigger }: { trigger: ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const form = useForm<CreatePracticeSchema>({
    resolver: zodResolver(createPracticeSchema),
    defaultValues: { title: '', song: '', venue: '', startAt: '', durationMinutes: 60 },
    mode: 'onTouched',
  });

  const mutation = useCreatePractice({
    onSuccess: (data) => {
      toast.success('합주가 생성되었습니다.');
      setOpen(false);
      setStep(0);
      form.reset();
      router.replace(ROUTES.PRACTICE_DETAIL(data.practiceId));
    },
    onError: (err) => toast.error(err.message || '합주 생성에 실패했습니다.'),
  });

  async function next() {
    if (step === 0) {
      const ok = await form.trigger(['title', 'song']);
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
          <ResponsiveSheetTitle>새 합주 만들기</ResponsiveSheetTitle>
        </ResponsiveSheetHeader>
        <ResponsiveSheetBody>
          <form
            id="practice-create-form"
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            noValidate
            className="space-y-s-4"
          >
            <StepIndicator steps={STEPS} current={step} />
            {step === 0 && (
              <>
                <Input
                  label="제목 (선택)"
                  placeholder="예: 정기공연 1주차"
                  error={form.formState.errors.title?.message}
                  {...form.register('title')}
                />
                <Input
                  label="합주곡 ID"
                  required
                  hint="백엔드 합주곡 목록 구축 전까지는 songId(UUID) 직접 입력"
                  error={form.formState.errors.song?.message}
                  {...form.register('song')}
                />
              </>
            )}
            {step === 1 && (
              <Input
                label="장소 (선택)"
                placeholder="예: 홍대 스튜디오"
                error={form.formState.errors.venue?.message}
                {...form.register('venue')}
              />
            )}
            {step === 2 && (
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
                  min={15}
                  max={480}
                  step={15}
                  required
                  error={form.formState.errors.durationMinutes?.message}
                  {...form.register('durationMinutes', { valueAsNumber: true })}
                />
              </div>
            )}
          </form>
        </ResponsiveSheetBody>
        <ResponsiveSheetFooter>
          {step > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => (s === 2 ? 1 : s === 1 ? 0 : 0))}
            >
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
            <Button type="submit" form="practice-create-form" loading={mutation.isPending}>
              합주 만들기
            </Button>
          )}
        </ResponsiveSheetFooter>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
