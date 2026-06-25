'use client';

import { ListMusic } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  ResponsiveSheet,
  ResponsiveSheetBody,
  ResponsiveSheetContent,
  ResponsiveSheetFooter,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
} from '@/components/ui/responsive-sheet';
import { useMySetlists } from '@/domain/setlist/hooks/useMySetlists';
import type { SetlistResponse } from '@/domain/setlist/types/res';

export interface SetlistSelectorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSelection?: SetlistResponse[];
  onConfirm: (setlists: SetlistResponse[]) => void;
}

export function SetlistSelectorSheet({
  open,
  onOpenChange,
  initialSelection = [],
  onConfirm,
}: SetlistSelectorSheetProps) {
  const { data, isLoading, isError } = useMySetlists();
  const setlists = data?.content ?? [];

  const [selection, setSelection] = useState<SetlistResponse[]>(initialSelection);

  useEffect(() => {
    if (open) setSelection(initialSelection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggle(item: SetlistResponse) {
    setSelection((prev) =>
      prev.some((s) => s.setlistId === item.setlistId)
        ? prev.filter((s) => s.setlistId !== item.setlistId)
        : [...prev, item],
    );
  }

  function confirm() {
    onConfirm(selection);
    onOpenChange(false);
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent>
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>셋리스트 선택</ResponsiveSheetTitle>
        </ResponsiveSheetHeader>

        <ResponsiveSheetBody>
          {isLoading && <p className="text-foreground-muted text-caption p-s-4">불러오는 중...</p>}
          {isError && (
            <p className="text-danger text-caption p-s-4">셋리스트를 불러오지 못했습니다.</p>
          )}
          {!isLoading && !isError && setlists.length === 0 && (
            <p className="text-foreground-muted text-caption p-s-4">
              참여 중인 셋리스트가 없습니다.
            </p>
          )}
          <ul className="gap-s-2 flex max-h-[420px] flex-col overflow-y-auto">
            {setlists.map((item) => {
              const sel = selection.some((s) => s.setlistId === item.setlistId);
              const date = (item.updatedAt ?? item.createdAt)?.slice(0, 10) ?? '';

              return (
                <li key={item.setlistId}>
                  <button
                    type="button"
                    onClick={() => toggle(item)}
                    aria-pressed={sel}
                    className="w-full text-left"
                  >
                    <div
                      className={
                        'border-border bg-card hover:bg-card-hover gap-s-3 px-s-4 py-s-3 flex items-center rounded-md border transition-colors ' +
                        (sel ? 'border-white/40 bg-white/5' : '')
                      }
                    >
                      <span
                        className={
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors ' +
                          (sel ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60')
                        }
                      >
                        <ListMusic className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-body truncate font-semibold">{item.title}</p>
                        {date && (
                          <p className="text-foreground-muted" style={{ fontSize: 11 }}>
                            {date}
                          </p>
                        )}
                      </div>
                      {sel && (
                        <span className="text-caption rounded-full bg-white/20 px-2 py-0.5 text-white">
                          선택됨
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </ResponsiveSheetBody>

        <ResponsiveSheetFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={confirm}
            disabled={selection.length === 0}
            className="rounded-[5px] bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30"
          >
            선택 ({selection.length})
          </Button>
        </ResponsiveSheetFooter>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
