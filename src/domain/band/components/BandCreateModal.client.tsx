'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
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
import { useCreateBand } from '@/domain/band/hooks/useCreateBand';
import { createBandSchema, type CreateBandSchema } from '@/domain/band/types';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

const STEPS = ['기본 정보', '프로필(선택)'] as const;

export function BandCreateModal({ trigger }: { trigger: ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<0 | 1>(0);

  const form = useForm<CreateBandSchema>({
    resolver: zodResolver(createBandSchema),
    defaultValues: { name: '', description: '', profileImg: '' },
    mode: 'onTouched',
  });

  const mutation = useCreateBand({
    onSuccess: (data) => {
      toast.success('밴드가 생성되었습니다.');
      setOpen(false);
      setStep(0);
      form.reset();
      router.replace(ROUTES.BAND_DETAIL(data.bandId));
    },
    onError: (err) => toast.error(err.message || '밴드 생성에 실패했습니다.'),
  });

  async function goNext() {
    const ok = await form.trigger(['name', 'description']);
    if (ok) setStep(1);
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
          <ResponsiveSheetTitle>새 밴드 만들기</ResponsiveSheetTitle>
        </ResponsiveSheetHeader>
        <ResponsiveSheetBody>
          <form
            id="band-create-form"
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            noValidate
            className="space-y-s-4"
          >
            <StepIndicator steps={STEPS} current={step} />
            {step === 0 && (
              <>
                <Input
                  label="밴드 이름"
                  placeholder="예: TuNA"
                  required
                  error={form.formState.errors.name?.message}
                  {...form.register('name')}
                />
                <Textarea
                  label="소개"
                  placeholder="밴드 소개 (최대 200자)"
                  error={form.formState.errors.description?.message}
                  {...form.register('description')}
                />
              </>
            )}
            {step === 1 && (
              <Input
                label="프로필 이미지 URL (선택)"
                placeholder="https://..."
                error={form.formState.errors.profileImg?.message}
                {...form.register('profileImg')}
              />
            )}
          </form>
        </ResponsiveSheetBody>
        <ResponsiveSheetFooter>
          {step === 0 ? (
            <>
              <ResponsiveSheetClose asChild>
                <Button type="button" variant="ghost">
                  취소
                </Button>
              </ResponsiveSheetClose>
              <Button type="button" onClick={goNext} disabled={mutation.isPending}>
                다음
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={() => setStep(0)}>
                이전
              </Button>
              <Button type="submit" form="band-create-form" loading={mutation.isPending}>
                밴드 만들기
              </Button>
            </>
          )}
        </ResponsiveSheetFooter>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
