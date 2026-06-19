'use client';

import { Trash2, Users } from 'lucide-react';
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
import { useDeleteSession } from '@/domain/jam/hooks/useDeleteSession';
import { useToast } from '@/hooks/useToast';

import type { JamSessionResponse } from '../types';

type Props = {
  jamId: string;
  session: JamSessionResponse;
};

export function SessionRow({ jamId, session }: Props) {
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteMutation = useDeleteSession(jamId, {
    onSuccess: () => {
      toast.success('세션을 삭제했습니다.');
      setConfirmDelete(false);
    },
    onError: (err) => toast.error(err.message || '세션 삭제에 실패했습니다.'),
  });

  const filledCount = session.participants.length;

  return (
    <div className="border-border flex items-center justify-between gap-3 border-b py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <Chip>{session.short}</Chip>
        <div className="min-w-0">
          <span className="text-foreground truncate text-sm font-medium">{session.label}</span>
          <span className="text-foreground-muted ml-2 text-xs">
            <Users className="mb-0.5 inline h-3 w-3" aria-hidden="true" /> {filledCount}/
            {session.need}
          </span>
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        aria-label="세션 삭제"
        className="text-danger hover:opacity-80"
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>세션 삭제</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-foreground-sub text-sm">
              &apos;{session.label}&apos; 세션을 삭제합니다.
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
