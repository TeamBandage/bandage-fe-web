'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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
  ResponsiveSheetDescription,
  ResponsiveSheetTitle,
  ResponsiveSheetTrigger,
} from '@/components/ui/responsive-sheet';
import { Textarea } from '@/components/ui/textarea';
import { useCreateBand } from '@/domain/band/hooks/useCreateBand';
import { createBandSchema, type CreateBandSchema } from '@/domain/band/types';
import { useToast } from '@/hooks/useToast';

export function BandCreateModal({ trigger }: { trigger: ReactNode }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<CreateBandSchema>({
    resolver: zodResolver(createBandSchema),
    defaultValues: { name: '', description: '' },
    mode: 'onTouched',
  });

  const mutation = useCreateBand({
    onSuccess: () => {
      toast.success('밴드가 생성되었습니다.');
      setOpen(false);
      form.reset();
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
      <ResponsiveSheetContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <ResponsiveSheetHeader className="border-b-0 pb-2">
          <ResponsiveSheetTitle>밴드 생성</ResponsiveSheetTitle>
          <ResponsiveSheetDescription>
            밴드 프로필 이미지는 밴드 생성 후 [밴드 설정 → 사진] 에서 업로드할 수 있습니다.
          </ResponsiveSheetDescription>
        </ResponsiveSheetHeader>
        <div className="border-border mx-5 border-b" />
        <ResponsiveSheetBody>
          <form
            id="band-create-form"
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            noValidate
            className="space-y-s-4"
          >
            <Input
              label="밴드 이름"
              placeholder="밴드 이름을 입력하세요"
              required
              hint={
                <span className="block text-right">{(form.watch('name') ?? '').length}/50자</span>
              }
              error={form.formState.errors.name?.message}
              className="rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0"
              {...form.register('name')}
            />
            <Textarea
              label="소개"
              required
              placeholder="밴드 소개글을 입력하세요"
              hint={
                <span className="block text-right">
                  {(form.watch('description') ?? '').length}/200자
                </span>
              }
              error={form.formState.errors.description?.message}
              className="rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0"
              {...form.register('description')}
            />
          </form>
        </ResponsiveSheetBody>
        <ResponsiveSheetFooter className="border-t-0 pt-1">
          <ResponsiveSheetClose asChild>
            <Button type="button" variant="ghost" className="h-8 rounded-[5px]">
              취소
            </Button>
          </ResponsiveSheetClose>
          <Button
            type="submit"
            form="band-create-form"
            variant="secondary"
            className="h-8 rounded-[5px] border-white bg-white px-2 text-neutral-900 hover:border-neutral-100 hover:bg-neutral-100 active:border-neutral-200 active:bg-neutral-200"
            loading={mutation.isPending}
          >
            밴드 생성
          </Button>
        </ResponsiveSheetFooter>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
