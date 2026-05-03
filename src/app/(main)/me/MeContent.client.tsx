'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LogOut, Pencil, UserX } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { ErrorState } from '@/components/feedback/error-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ProfileImageUpload } from '@/components/ui/profile-image-upload';
import { Skeleton } from '@/components/ui/skeleton';
import { useLogout } from '@/domain/auth/hooks/useLogout';
import { useMe } from '@/domain/member/hooks/useMe';
import { useUpdateMe } from '@/domain/member/hooks/useUpdateMe';
import { useWithdraw } from '@/domain/member/hooks/useWithdraw';
import {
  updateMeSchema,
  type MemberInfoResponse,
  type UpdateMeSchema,
} from '@/domain/member/types';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

export function MeContent() {
  const router = useRouter();
  const toast = useToast();
  const { data: me, isLoading, isError, refetch } = useMe();

  const [isEditing, setEditing] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const updateProfileImgMutation = useUpdateMe({
    onSuccess: () => toast.success('프로필 이미지를 변경했습니다.'),
    onError: (err) => toast.error(err.message || '프로필 이미지 변경에 실패했습니다.'),
  });

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
    <div className="space-y-4">
      {isEditing ? (
        <EditCard
          member={me}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      ) : (
        <Card padding="lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-4">
              <ProfileImageUpload
                value={me.profileImg ?? null}
                onChange={(objectKey) => updateProfileImgMutation.mutate({ profileImg: objectKey })}
                domain="MEMBER"
                label=""
                size={72}
                disabled={updateProfileImgMutation.isPending}
              />
              <div className="space-y-1">
                <div className="text-foreground text-lg font-semibold">{me.name}</div>
                <div className="text-foreground-sub text-sm">{me.email}</div>
                <div className="text-foreground-muted text-xs">{me.contact}</div>
              </div>
            </div>
            <Badge variant="accent">Member</Badge>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              정보 수정
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={ROUTES.PASSWORD_CHANGE}>비밀번호 변경</Link>
            </Button>
          </div>
        </Card>
      )}

      <Card padding="md">
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            onClick={() => logoutMutation.mutate()}
            loading={logoutMutation.isPending}
            className="justify-start"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </Button>
          <Button
            variant="ghost"
            onClick={() => setWithdrawOpen(true)}
            className="text-danger justify-start hover:opacity-80"
          >
            <UserX className="h-4 w-4" />
            회원 탈퇴
          </Button>
        </div>
      </Card>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정말 탈퇴하시겠어요?</DialogTitle>
            <DialogDescription>
              탈퇴 후에는 참여 중인 밴드 · 합주 · 공연 데이터에 접근할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-foreground-sub text-sm">
              이 동작은 되돌릴 수 없으며 일부 기록은 감사 로그 목적 상 보관됩니다.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setWithdrawOpen(false)}>
              취소
            </Button>
            <Button
              variant="danger"
              onClick={() => withdrawMutation.mutate()}
              loading={withdrawMutation.isPending}
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
  member,
  onCancel,
  onSaved,
}: {
  member: MemberInfoResponse;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const form = useForm<UpdateMeSchema>({
    resolver: zodResolver(updateMeSchema),
    defaultValues: { name: member.name, contact: member.contact },
  });

  const mutation = useUpdateMe({
    onSuccess: () => {
      toast.success('회원 정보가 수정되었습니다.');
      onSaved();
    },
    onError: (err) => toast.error(err.message || '수정에 실패했습니다.'),
  });

  return (
    <Card padding="lg">
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        <Input
          label="이름"
          error={form.formState.errors.name?.message}
          {...form.register('name')}
        />
        <Input
          label="연락처"
          error={form.formState.errors.contact?.message}
          {...form.register('contact')}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            취소
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            저장
          </Button>
        </div>
      </form>
    </Card>
  );
}
