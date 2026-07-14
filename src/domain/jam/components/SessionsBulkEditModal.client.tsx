'use client';

import { ListChecks, Plus, RotateCcw, Trash2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { useUpdateSessions } from '@/domain/jam/hooks/useUpdateSessions';
import { useToast } from '@/hooks/useToast';

import type { JamSessionResponse } from '../types';

type DraftRow = {
  key: string;
  sessionId: string;
  label: string;
  short: string;
  custom: boolean;
  isNew: boolean;
  removed: boolean;
  assignedCount: number;
};

function toDraftRows(sessions: JamSessionResponse[]): DraftRow[] {
  return sessions.map((s) => ({
    key: s.sessionId,
    sessionId: s.sessionId,
    label: s.label,
    short: s.short,
    custom: s.custom,
    isNew: false,
    removed: false,
    assignedCount: s.participants.length,
  }));
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
  const [rows, setRows] = useState<DraftRow[]>([]);

  const mutation = useUpdateSessions(jamId, {
    onSuccess: () => {
      toast.success('세션 구성을 저장했습니다.');
      setOpen(false);
    },
    onError: (err) => toast.error(err.message || '세션 정의 교체에 실패했습니다.'),
  });

  function handleOpenChange(next: boolean) {
    if (next) setRows(toDraftRows(sessions));
    setOpen(next);
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        sessionId: crypto.randomUUID(),
        label: '',
        short: '',
        custom: true,
        isNew: true,
        removed: false,
        assignedCount: 0,
      },
    ]);
  }

  function updateRow(key: string, patch: Partial<Pick<DraftRow, 'label' | 'short'>>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  // 신규(미저장) 행은 즉시 제거하고, 기존 행은 취소 가능한 삭제 예정 상태로 표시.
  function removeRow(key: string) {
    setRows((prev) =>
      prev.flatMap((r) => {
        if (r.key !== key) return [r];
        if (r.isNew) return [];
        return [{ ...r, removed: true }];
      }),
    );
  }

  function undoRemove(key: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, removed: false } : r)));
  }

  function handleSave() {
    const active = rows.filter((r) => !r.removed);
    const invalid = active.some((r) => !r.label.trim() || !r.short.trim());
    if (invalid) {
      toast.error('모든 세션에 이름과 약어를 입력해 주세요.');
      return;
    }
    mutation.mutate({
      sessions: active.map((r) => ({
        sessionId: r.sessionId,
        label: r.label.trim(),
        short: r.short.trim().toUpperCase().slice(0, 3),
        custom: r.custom,
      })),
    });
  }

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
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>세션 구성 전체 편집</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-3">
              <p className="text-foreground-muted text-xs">
                저장하면 목록에 없는 세션은 삭제되고, 배정되어 있던 참여자는 미배정 상태가 됩니다.
              </p>

              {rows.length === 0 ? (
                <p className="text-foreground-muted py-6 text-center text-sm">
                  세션이 없습니다. 아래에서 추가해 주세요.
                </p>
              ) : (
                <div>
                  {rows.map((r) =>
                    r.removed ? (
                      <div
                        key={r.key}
                        className="border-border flex items-center justify-between gap-2 border-b py-3 last:border-b-0"
                      >
                        <span className="text-foreground-muted min-w-0 truncate text-sm line-through">
                          {r.short || '?'} · {r.label || '(이름 없음)'}
                        </span>
                        <div className="flex shrink-0 items-center gap-2">
                          {r.assignedCount > 0 && (
                            <p className="text-danger text-xs">배정된 참여자가 미배정 처리됩니다</p>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label="삭제 취소"
                            className="text-foreground-muted hover:text-foreground h-10 shrink-0"
                            onClick={() => undoRemove(r.key)}
                          >
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={r.key}
                        className="border-border flex items-center gap-2 border-b py-3 last:border-b-0"
                      >
                        <Input
                          value={r.short}
                          onChange={(e) => updateRow(r.key, { short: e.target.value })}
                          maxLength={3}
                          aria-label="약어"
                          className="w-16 rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0"
                        />
                        <div className="flex-1">
                          <Input
                            value={r.label}
                            onChange={(e) => updateRow(r.key, { label: e.target.value })}
                            aria-label="세션 이름"
                            className="w-full rounded-[5px] border-white/20 hover:border-white/35 focus-visible:border-white/70 focus-visible:ring-0"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="세션 삭제"
                          className="text-foreground-muted hover:text-foreground h-10 shrink-0"
                          onClick={() => removeRow(r.key)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    ),
                  )}
                </div>
              )}

              <Button
                size="sm"
                variant="ghost"
                className="text-foreground-muted hover:text-foreground"
                onClick={addRow}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                세션 추가
              </Button>
            </div>
          </DialogBody>
          <DialogFooter>
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
