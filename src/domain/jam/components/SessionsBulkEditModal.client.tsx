'use client';

import { ListChecks } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  SessionComposer,
  deriveSessionRows,
  expandSessionRows,
  type SessionRowState,
} from '@/components/ui/session-composer';
import { useUpdateSessions } from '@/domain/jam/hooks/useUpdateSessions';
import { useToast } from '@/hooks/useToast';

import type { JamSessionResponse } from '../types';

/** 라벨별 배정 인원 합계(감소/삭제 시 어떤 세션의 배정이 해제될 수 있는지 안내용). */
function assignedCountsByLabel(sessions: JamSessionResponse[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    if (s.participants.length === 0) continue;
    const label = s.label.toUpperCase();
    counts.set(label, (counts.get(label) ?? 0) + s.participants.length);
  }
  return counts;
}

export function SessionsBulkEditModal({
  jamId,
  sessions,
}: {
  jamId: string;
  sessions: JamSessionResponse[];
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<SessionRowState[]>([]);
  const [assignedCounts, setAssignedCounts] = useState<Map<string, number>>(new Map());

  const mutation = useUpdateSessions(jamId, {
    onSuccess: () => {
      toast.success('세션 구성을 저장했습니다.');
      setOpen(false);
    },
    onError: (err) => toast.error(err.message || '세션 정의 교체에 실패했습니다.'),
  });

  function handleOpenChange(next: boolean) {
    if (next) {
      setRows(deriveSessionRows(sessions.map((s) => s.label)));
      setAssignedCounts(assignedCountsByLabel(sessions));
    }
    setOpen(next);
  }

  function handleSave() {
    mutation.mutate({
      sessions: expandSessionRows(rows).map((r) => ({
        sessionId: r.id,
        label: r.label,
        custom: r.custom,
      })),
    });
  }

  const assignedEntries = Array.from(assignedCounts.entries());

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="text-foreground-muted hover:text-foreground"
        onClick={() => handleOpenChange(true)}
      >
        <ListChecks className="h-4 w-4" aria-hidden="true" />
        전체 편집
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader className="pb-2">
            <DialogTitle>세션 구성 전체 편집</DialogTitle>
          </DialogHeader>
          <DialogBody className="pt-2 pb-2">
            <div className="space-y-3">
              <p className="text-foreground-muted text-micro">
                세션별 인원수를 +/- 로 조정하고, 필요하면 영문 이름으로 커스텀 세션을 추가하세요.
              </p>

              <SessionComposer rows={rows} onChange={setRows} requireAtLeastOne={false} />

              <p className="text-foreground-sub text-micro">
                저장하면 목록에 없는 세션은 삭제되고, 배정되어 있던 참여자는 미배정 상태가 됩니다.
              </p>
              {assignedEntries.length > 0 && (
                <p className="text-danger text-xs">
                  현재 배정된 세션:{' '}
                  {assignedEntries.map(([label, count]) => `${label}(${count}명)`).join(', ')}
                </p>
              )}
            </div>
          </DialogBody>
          <DialogFooter className="border-t-0 pt-2">
            <Button variant="ghost" className="h-8 rounded-[5px]" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button
              variant="secondary"
              className="h-8 rounded-[5px] border-white bg-white px-3 text-neutral-900 hover:bg-white/90 active:bg-white/80"
              loading={mutation.isPending}
              onClick={handleSave}
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
