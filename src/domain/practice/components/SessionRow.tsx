'use client';

import { Trash2, UserPlus, UserX } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAssignSession } from '@/domain/practice/hooks/useAssignSession';
import { useDeleteSession } from '@/domain/practice/hooks/useDeleteSession';
import { useUnassignSession } from '@/domain/practice/hooks/useUnassignSession';
import { getMemberDisplayName } from '@/domain/member/utils';
import { useToast } from '@/hooks/useToast';

import type { PracticeSessionResponse } from '../types';

type Props = {
  practiceId: string;
  session: PracticeSessionResponse;
};

export function SessionRow({ practiceId, session }: Props) {
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const assignMutation = useAssignSession(practiceId, {
    onError: (err) => toast.error(err.message || '세션 배정에 실패했습니다.'),
  });
  const unassignMutation = useUnassignSession(practiceId, {
    onError: (err) => toast.error(err.message || '배정 해제에 실패했습니다.'),
  });
  const deleteMutation = useDeleteSession(practiceId, {
    onSuccess: () => {
      toast.success('세션을 삭제했습니다.');
      setConfirmDelete(false);
    },
    onError: (err) => toast.error(err.message || '세션 삭제에 실패했습니다.'),
  });

  const isAssigned = session.participant !== null;

  return (
    <div className="border-border flex items-center justify-between gap-3 border-b py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <Chip session={session.type}>{session.type}</Chip>
        <span className="text-foreground truncate text-sm font-medium">{session.label}</span>
        {isAssigned ? (
          <span className="text-foreground-sub truncate text-xs">
            담당:{' '}
            {getMemberDisplayName({
              memberId: session.participant!.memberId,
              name: session.participant!.name,
            })}
          </span>
        ) : (
          <span className="text-foreground-muted truncate text-xs">담당 없음</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isAssigned ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => unassignMutation.mutate(session.sessionId)}
            loading={unassignMutation.isPending}
          >
            <UserX className="h-4 w-4" />
            해제
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => assignMutation.mutate(session.sessionId)}
            loading={assignMutation.isPending}
          >
            <UserPlus className="h-4 w-4" />
            나를 배정
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          aria-label="세션 삭제"
          className="text-danger hover:opacity-80"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>세션 삭제</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-foreground-sub text-sm">
              &apos;{session.label}&apos; 세션을 삭제합니다. 배정된 담당자가 있다면 함께 해제됩니다.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              취소
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(session.sessionId)}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
