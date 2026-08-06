'use client';

import { Check, Pencil, Trash2, X } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { normalizeSessionLabel } from '@/components/ui/session-composer';
import { useDeleteSession } from '@/domain/jam/hooks/useDeleteSession';
import { useUpdateSession } from '@/domain/jam/hooks/useUpdateSession';
import { useToast } from '@/hooks/useToast';

import type { JamSessionResponse } from '../types';

type Props = {
  jamId: string;
  session: JamSessionResponse;
};

export function SessionRow({ jamId, session }: Props) {
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [labelDraft, setLabelDraft] = useState(session.label);

  const deleteMutation = useDeleteSession(jamId, {
    onSuccess: () => {
      toast.success('세션을 삭제했습니다.');
      setConfirmDelete(false);
    },
    onError: (err) => toast.error(err.message || '세션 삭제에 실패했습니다.'),
  });

  const updateMutation = useUpdateSession(jamId, session.sessionId, {
    onSuccess: () => {
      toast.success('세션 정보를 수정했습니다.');
      setEditing(false);
    },
    onError: (err) => toast.error(err.message || '세션 수정에 실패했습니다.'),
  });

  function startEdit() {
    setLabelDraft(session.label);
    setEditing(true);
  }

  function saveEdit() {
    if (!labelDraft.trim()) {
      toast.error('세션 이름을 입력해 주세요.');
      return;
    }
    updateMutation.mutate({ label: labelDraft.trim() });
  }

  // 세션 1개 = 정원 1명 고정. 배정된 사람이 있으면 이름을, 없으면 빈 자리임을 표시.
  const assignee = session.participants[0];

  if (editing) {
    return (
      <div className="border-border flex items-center gap-2 border-b py-3 last:border-b-0 last:pb-0">
        <div className="flex-1">
          <Input
            value={labelDraft}
            onChange={(e) => setLabelDraft(normalizeSessionLabel(e.target.value).slice(0, 20))}
            aria-label="세션 이름"
            className="w-full rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0"
          />
        </div>
        <Button
          size="sm"
          variant="ghost"
          aria-label="저장"
          className="text-foreground-muted hover:text-foreground h-10"
          loading={updateMutation.isPending}
          onClick={saveEdit}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label="취소"
          className="text-foreground-muted hover:text-foreground h-10"
          onClick={() => setEditing(false)}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <div className="border-border flex items-center justify-between gap-3 border-b py-3 last:border-b-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-3">
        <Chip className="rounded-[5px] border-white/30">{session.short}</Chip>
        <div className="min-w-0">
          <span className="text-foreground truncate text-sm font-medium">{session.label}</span>
          <span className="text-foreground-muted ml-2 text-xs">
            {assignee ? assignee.name : '빈 자리'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          aria-label="세션 수정"
          className="text-foreground-muted hover:text-foreground h-10"
          onClick={startEdit}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label="세션 삭제"
          className="text-foreground-muted hover:text-foreground h-10"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader className="border-b-0 pb-2">
            <DialogTitle>세션을 삭제하시겠어요?</DialogTitle>
          </DialogHeader>
          <div className="border-border mx-5 border-b" />
          <DialogBody className="pt-2">
            <p className="text-foreground-sub text-sm">
              &apos;{session.label}&apos; 세션은 복구할 수 없습니다.
            </p>
          </DialogBody>
          <DialogFooter className="border-t-0">
            <Button
              variant="ghost"
              className="h-8 rounded-[5px]"
              onClick={() => setConfirmDelete(false)}
            >
              취소
            </Button>
            <Button
              variant="danger"
              className="h-8 rounded-[5px] px-2"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(session.sessionId)}
            >
              삭제하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
