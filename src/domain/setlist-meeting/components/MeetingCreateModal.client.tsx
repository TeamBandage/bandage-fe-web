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
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

import { useSetlistStore } from '../store/setlistStore';
import { createMeetingSchema, type CreateMeetingSchema } from '../types/schema';

export interface MeetingCreateModalProps {
  trigger: ReactNode;
}

/**
 * 백엔드 미지원(FE-API-024) 단계의 클라이언트-only 회의 생성.
 * BE 도입 시 BandPickerModal 로 bandId 선택 + POST /api/v1/setlist-meetings 로 교체.
 */
export function MeetingCreateModal({ trigger }: MeetingCreateModalProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const addMeeting = useSetlistStore((s) => s.addMeeting);
  const currentUserId = useSetlistStore((s) => s.currentUserId);

  const form = useForm<CreateMeetingSchema>({
    resolver: zodResolver(createMeetingSchema),
    defaultValues: { title: '', bandName: '' },
    mode: 'onTouched',
  });

  const onSubmit = form.handleSubmit((values) => {
    const id = addMeeting({
      title: values.title,
      bandId: `local_${Date.now()}`,
      bandName: values.bandName,
      managerId: currentUserId,
    });
    toast.success('선곡 회의가 만들어졌습니다.');
    setOpen(false);
    form.reset();
    router.push(ROUTES.SETLIST_MEETING_DETAIL(id));
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
          <ResponsiveSheetTitle>선곡 회의 만들기</ResponsiveSheetTitle>
        </ResponsiveSheetHeader>
        <form onSubmit={onSubmit}>
          <ResponsiveSheetBody>
            <div className="gap-s-3 flex flex-col">
              <Input
                label="회의 제목"
                required
                error={form.formState.errors.title?.message}
                placeholder="예: 여름 공연 셋리스트"
                autoFocus
                {...form.register('title')}
              />
              <Input
                label="연결 밴드"
                required
                error={form.formState.errors.bandName?.message}
                hint="실제 밴드 연결은 백엔드 도입 후 BandPickerModal 로 교체됩니다 (FE-API-024)."
                placeholder="예: TOOL TRIBUTE"
                {...form.register('bandName')}
              />
            </div>
          </ResponsiveSheetBody>
          <ResponsiveSheetFooter>
            <ResponsiveSheetClose asChild>
              <Button type="button" variant="ghost">
                취소
              </Button>
            </ResponsiveSheetClose>
            <Button type="submit" variant="primary" disabled={!form.formState.isValid}>
              회의 만들기
            </Button>
          </ResponsiveSheetFooter>
        </form>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
