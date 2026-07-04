'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { ErrorState } from '@/components/feedback/error-state';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PasswordStrength } from '@/components/ui/password-strength';
import { ProfileImageUpload } from '@/components/ui/profile-image-upload';
import { Skeleton } from '@/components/ui/skeleton';
import { useChangePassword } from '@/domain/auth/hooks/useChangePassword';
import { useLogout } from '@/domain/auth/hooks/useLogout';
import { passwordChangeSchema, type PasswordChangeSchema } from '@/domain/auth/types/schema';
import { ScheduleManagerModal } from '@/domain/member/components/ScheduleManagerModal.client';
import { WeeklyTimetable } from '@/domain/member/components/WeeklyTimetable.client';
import { useMe } from '@/domain/member/hooks/useMe';
import { useMyAvailability } from '@/domain/member/hooks/useMyAvailability';
import { useUpdateMyAvailability } from '@/domain/member/hooks/useUpdateMyAvailability';
import { useDeleteMyProfileImage } from '@/domain/member/hooks/useDeleteMyProfileImage';
import { useUpdateMe } from '@/domain/member/hooks/useUpdateMe';
import { useWithdraw } from '@/domain/member/hooks/useWithdraw';
import {
  updateMeSchema,
  type AvailabilityExceptionRequest,
  type MemberInfoResponse,
  type UpdateMeSchema,
  type WeeklyRuleRequest,
} from '@/domain/member/types';
import { useMyPerformances } from '@/domain/performance/hooks/useMyPerformances';
import { useMyJams } from '@/domain/jam/hooks/useMyJams';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

export function MeContent() {
  const router = useRouter();
  const toast = useToast();
  const { data: me, isLoading, isError, refetch } = useMe();
  const { data: availability } = useMyAvailability();
  const { data: practicesData } = useMyJams(100);
  const { data: performancesData } = useMyPerformances(100);

  const practices = practicesData?.pages.flatMap((p) => p.content) ?? [];
  const performances = performancesData?.pages.flatMap((p) => p.content) ?? [];

  const [isEditing, setEditing] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const editContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isEditing) return;
    const id = requestAnimationFrame(() => {
      (document.activeElement as HTMLElement)?.blur();
    });
    return () => cancelAnimationFrame(id);
  }, [isEditing]);

  const updateAvailabilityMutation = useUpdateMyAvailability({
    onSuccess: () => {
      toast.success('스케줄이 저장되었습니다.');
      setScheduleModalOpen(false);
    },
    onError: (err) => toast.error(err.message || '스케줄 저장에 실패했습니다.'),
  });

  const handleSaveSchedule = (
    weeklyRules: WeeklyRuleRequest[],
    note: string,
    exceptions: AvailabilityExceptionRequest[],
    effectiveFrom: string,
    effectiveTo: string,
  ) => {
    updateAvailabilityMutation.mutate({
      weeklyRules,
      exceptions,
      note,
      effectiveFrom,
      effectiveTo,
    });
  };

  const logoutMutation = useLogout({
    onSuccess: () => {
      toast.success('로그아웃되었습니다.');
      router.replace(ROUTES.LOGIN);
    },
    onError: (err) => toast.error(err.message || '로그아웃에 실패했습니다.'),
  });

  const withdrawMutation = useWithdraw({
    onSuccess: () => {
      toast.success('회원 탈퇴가 완료되었습니다.');
      router.replace(ROUTES.LOGIN);
    },
    onError: (err) => toast.error(err.message || '회원 탈퇴에 실패했습니다.'),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" rounded="lg" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  if (isError || !me) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div ref={editContainerRef} tabIndex={-1} className="space-y-s-6 outline-none">
      {/* 프로필 정보 섹션 */}
      <section>
        <div className="mb-s-3 relative flex min-h-8 items-center">
          {isEditing && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-foreground hover:text-foreground-sub absolute top-1/2 -left-10 -translate-y-1/2 transition-colors"
              aria-label="뒤로가기"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          <h2 className="text-foreground text-title flex-1 font-bold">
            {isEditing ? '프로필 정보 관리' : '프로필 정보'}
          </h2>
          {!isEditing && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditing(true)}
              className="rounded-[5px]"
            >
              프로필 정보 관리
            </Button>
          )}
        </div>

        {isEditing ? (
          <EditCard member={me} onSaved={() => setEditing(false)} />
        ) : (
          <Card padding="lg" className="rounded-md border-[3px]">
            <div className="flex items-start gap-[40px]">
              <Avatar
                src={me.profileImg ?? undefined}
                fallback={me.name}
                className="h-[72px] w-[72px] rounded-md text-xl"
              />
              <div className="space-y-1 pt-0.5">
                <div className="text-foreground text-lg font-semibold">{me.name}</div>
                <div className="text-foreground-sub text-sm">{me.email}</div>
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* 주간 타임테이블 — 편집 모드에서는 숨김 */}
      {!isEditing && (
        <WeeklyTimetable
          availability={availability}
          practices={practices}
          performances={performances}
          onManageSchedule={() => setScheduleModalOpen(true)}
        />
      )}

      {/* 비밀번호 변경 — 편집 모드에서만 표시 */}
      {isEditing && (
        <section className="mt-[60px]">
          <h2 className="text-foreground mb-s-3 text-[16px] font-bold">비밀번호 변경</h2>
          <PasswordChangeCard />
        </section>
      )}

      {/* 계정 탈퇴 — 편집 모드에서만 표시 */}
      {isEditing && (
        <section className="mt-[60px]">
          <h2 className="text-foreground mb-s-3 text-[16px] font-bold">계정 탈퇴</h2>
          <Card padding="lg" className="border-foreground-sub bg-bg">
            <div className="flex items-center justify-between gap-4">
              <p className="text-foreground-sub text-[14px]">
                탈퇴 후에는 참여 중인 밴드·합주·공연 데이터에 접근할 수 없습니다. 탈퇴를
                진행하시겠습니까?
              </p>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setWithdrawOpen(true)}
                className="shrink-0 rounded-[5px]"
              >
                회원 탈퇴
              </Button>
            </div>
          </Card>
        </section>
      )}

      {/* 모바일 전용 로그아웃 — 데스크톱은 사이드바에서 처리 */}
      <section className="lg:hidden">
        <Card padding="md">
          <Button
            variant="ghost"
            onClick={() => logoutMutation.mutate()}
            loading={logoutMutation.isPending}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </Button>
        </Card>
      </section>

      <ScheduleManagerModal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        availability={availability}
        onSave={handleSaveSchedule}
        isSaving={updateAvailabilityMutation.isPending}
      />

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader className="border-0">
            <DialogTitle>정말 탈퇴하시겠어요?</DialogTitle>
            <DialogDescription>
              이 동작은 되돌릴 수 없으며 일부 기록은 감사 로그 목적 상 보관됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWithdrawOpen(false)}
              className="rounded-[5px]"
            >
              취소
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => withdrawMutation.mutate()}
              loading={withdrawMutation.isPending}
              className="rounded-[5px]"
            >
              탈퇴하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditCard({
  member: initialMember,
  onSaved,
}: {
  member: MemberInfoResponse;
  onSaved: () => void;
}) {
  const toast = useToast();
  const { data: liveMe } = useMe();
  const member = liveMe ?? initialMember;
  const form = useForm<UpdateMeSchema>({
    resolver: zodResolver(updateMeSchema),
    defaultValues: { name: member.name },
  });

  const mutation = useUpdateMe({
    onSuccess: () => {
      toast.success('회원 정보가 수정되었습니다.');
      onSaved();
    },
    onError: (err) => toast.error(err.message || '수정에 실패했습니다.'),
  });

  const imgMutation = useUpdateMe({
    onSuccess: () => toast.success('프로필 이미지를 변경했습니다.'),
    onError: (err) => toast.error(err.message || '프로필 이미지 변경에 실패했습니다.'),
  });

  const deleteImgMutation = useDeleteMyProfileImage({
    onSuccess: () => toast.success('프로필 이미지가 삭제되었습니다.'),
    onError: (err) => toast.error(err.message || '프로필 이미지 삭제에 실패했습니다.'),
  });

  return (
    <Card padding="none" className="overflow-visible rounded-md border-[3px]">
      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        <div className="flex">
          {/* 좌측: 프로필 이미지 */}
          <div className="py-s-6 flex w-[180px] shrink-0 items-center justify-center">
            <ProfileImageUpload
              value={member.profileImg ?? null}
              onChange={(objectKey) => imgMutation.mutate({ profileImg: objectKey })}
              domain="MEMBER"
              label=""
              size={120}
              disabled={imgMutation.isPending}
              imageClassName="rounded-[100px]"
              showButton={false}
              onDelete={() => deleteImgMutation.mutate()}
            />
          </div>

          <div className="border-border my-s-4 w-0 border-r" />

          {/* 우측: 폼 필드 */}
          <div className="gap-s-4 p-s-6 flex flex-1 flex-col">
            <div className="grid grid-cols-[80px_1fr] items-center gap-4">
              <span className="text-foreground-sub text-sm">이름</span>
              <Input
                error={form.formState.errors.name?.message}
                className={EDIT_INPUT_CLASS}
                {...form.register('name')}
              />
            </div>
            <div className="grid grid-cols-[80px_1fr] items-center gap-4">
              <span className="text-foreground-sub text-sm">이메일</span>
              <Input value={member.email} disabled readOnly className="focus-visible:ring-white" />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                loading={mutation.isPending}
                className="rounded-[5px]"
              >
                수정 완료
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
}

const EDIT_INPUT_CLASS =
  'rounded-[5px] border-white/20 hover:border-white/35 focus-visible:ring-0 focus-visible:border-white/70';

const PASSWORD_INPUT_CLASS =
  'rounded-[5px] border-white/20 hover:border-white/35 focus-visible:ring-0 focus-visible:border-white/70 not-placeholder-shown:border-white/70';

function PasswordChangeCard() {
  const toast = useToast();
  const form = useForm<PasswordChangeSchema>({
    resolver: zodResolver(passwordChangeSchema),
    mode: 'onChange',
    defaultValues: { originalPassword: '', newPassword: '', confirmPassword: '' },
  });

  const mutation = useChangePassword({
    onSuccess: () => {
      toast.success('비밀번호가 변경되었습니다.');
      form.reset();
    },
    onError: (err) => toast.error(err.message || '비밀번호 변경에 실패했습니다.'),
  });

  return (
    <Card padding="none" className="overflow-visible rounded-md border-[3px]">
      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        <div className="gap-s-4 p-s-6 flex flex-col">
          <div className="flex items-start gap-6">
            <span className="text-foreground-sub w-36 shrink-0 pt-2.5 text-sm whitespace-nowrap">
              현재 비밀번호
            </span>
            <div className="min-w-0 flex-1">
              <Input
                type="password"
                placeholder="현재 비밀번호 입력"
                error={form.formState.errors.originalPassword?.message}
                className={PASSWORD_INPUT_CLASS}
                {...form.register('originalPassword')}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-6">
              <span className="text-foreground-sub w-36 shrink-0 pt-2.5 text-sm whitespace-nowrap">
                새 비밀번호
              </span>
              <div className="min-w-0 flex-1">
                <Input
                  type="password"
                  placeholder="새 비밀번호 입력"
                  error={form.formState.errors.newPassword?.message}
                  className={PASSWORD_INPUT_CLASS}
                  {...form.register('newPassword')}
                />
              </div>
            </div>
            {form.watch('newPassword') && (
              <div className="flex items-start gap-6">
                <span className="w-36 shrink-0" aria-hidden="true" />
                <PasswordStrength password={form.watch('newPassword')} className="flex-1" />
              </div>
            )}
          </div>
          <div className="flex items-start gap-6">
            <span className="text-foreground-sub w-36 shrink-0 pt-2.5 text-sm whitespace-nowrap">
              새 비밀번호 확인
            </span>
            <div className="min-w-0 flex-1">
              <Input
                type="password"
                placeholder="새 비밀번호 재입력"
                error={form.formState.errors.confirmPassword?.message}
                className={PASSWORD_INPUT_CLASS}
                {...form.register('confirmPassword')}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              loading={mutation.isPending}
              className="rounded-[5px]"
            >
              변경하기
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
