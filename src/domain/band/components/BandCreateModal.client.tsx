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
import { Textarea } from '@/components/ui/textarea';
import { useCreateBand } from '@/domain/band/hooks/useCreateBand';
import { createBandSchema, type CreateBandSchema } from '@/domain/band/types';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

export function BandCreateModal({ trigger }: { trigger: ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<CreateBandSchema>({
    resolver: zodResolver(createBandSchema),
    defaultValues: { name: '', description: '' },
    mode: 'onTouched',
  });

  const mutation = useCreateBand({
    onSuccess: (data) => {
      toast.success('밴드가 생성되었습니다.');
      setOpen(false);
      form.reset();
      router.replace(ROUTES.BAND_DETAIL(data.bandId));
    },
    onError: (err) => toast.error(err.message || '밴드 생성에 실패했습니다.'),
  });

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) form.reset();
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
            <p className="text-foreground-muted text-xs">
              프로필 이미지는 밴드 생성 후 [밴드 설정 → 사진] 에서 업로드할 수 있습니다.
            </p>
          </form>
        </ResponsiveSheetBody>
        <ResponsiveSheetFooter>
          <ResponsiveSheetClose asChild>
            <Button type="button" variant="ghost">
              취소
            </Button>
          </ResponsiveSheetClose>
          <Button type="submit" form="band-create-form" loading={mutation.isPending}>
            밴드 만들기
          </Button>
        </ResponsiveSheetFooter>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
