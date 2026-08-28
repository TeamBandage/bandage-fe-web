'use client';

import { Search } from 'lucide-react';
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
import { DOMAIN_IMAGES } from '@/lib/domain-icons';

import { useSetlistStore } from '../store/setlistStore';
import type { Meeting } from '../types';

export interface SetlistPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSelection?: Meeting[];
  onConfirm: (meetings: Meeting[]) => void;
}

export function SetlistPickerModal({
  open,
  onOpenChange,
  initialSelection = [],
  onConfirm,
}: SetlistPickerModalProps) {
  const meetings = useSetlistStore((s) => s.meetings);
  const songs = useSetlistStore((s) => s.songs);

  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState<Meeting[]>(initialSelection);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelection(initialSelection);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered =
    query.trim() === ''
      ? meetings
      : meetings.filter((m) => m.title.includes(query.trim()) || m.bandName.includes(query.trim()));

  function songCount(meetingId: string) {
    return songs.filter((s) => s.meetingId === meetingId).length;
  }

  function confirmedCount(meetingId: string) {
    const meetingSongs = songs.filter((s) => s.meetingId === meetingId);
    return meetingSongs.filter((song) =>
      song.sessions.every((sess) => (song.confirmed[sess.id]?.length ?? 0) >= sess.need),
    ).length;
  }

  function toggle(m: Meeting) {
    setSelection((prev) =>
      prev.some((p) => p.id === m.id) ? prev.filter((p) => p.id !== m.id) : [...prev, m],
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
          <ResponsiveSheetTitle>셋리스트 추가</ResponsiveSheetTitle>
        </ResponsiveSheetHeader>

        <ResponsiveSheetBody>
          <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 mb-s-3 flex items-center rounded-md border">
            <Search className="text-foreground-muted h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="셋리스트 또는 밴드명으로 검색…"
              className="text-body placeholder:text-foreground-muted w-full bg-transparent outline-none"
              aria-label="셋리스트 검색"
            />
          </div>

          <ul className="gap-s-2 flex max-h-[420px] flex-col overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="text-foreground-muted p-s-4 text-caption">검색 결과가 없습니다.</li>
            ) : (
              filtered.map((m) => {
                const total = songCount(m.id);
                const confirmed = confirmedCount(m.id);
                const sel = selection.some((p) => p.id === m.id);
                const progress = total > 0 ? confirmed / total : 0;
                const date = (m.updatedAt ?? m.createdAt).slice(0, 10);

                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => toggle(m)}
                      aria-pressed={sel}
                      className="w-full text-left"
                    >
                      <div
                        className={
                          'border-border bg-card hover:bg-card-hover gap-s-3 px-s-4 py-s-3 flex items-start rounded-md border transition-colors ' +
                          (sel ? 'border-accent bg-accent-dim' : '')
                        }
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={DOMAIN_IMAGES.setlist}
                          alt=""
                          aria-hidden="true"
                          className="mt-0.5 h-8 w-8 shrink-0 rounded-sm object-cover"
                        />

                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-foreground-muted text-caption truncate font-medium">
                            {m.bandName}
                          </p>
                          <p className="text-body truncate font-semibold">{m.title}</p>

                          <div className="gap-s-2 flex items-center">
                            <div
                              className="bg-surface flex-1 overflow-hidden rounded-full"
                              style={{ height: 4 }}
                            >
                              <div
                                className="bg-accent h-full rounded-full transition-all"
                                style={{ width: `${progress * 100}%` }}
                              />
                            </div>
                            <span
                              className="text-foreground-muted shrink-0 tabular-nums"
                              style={{ fontSize: 11 }}
                            >
                              {confirmed}/{total}
                            </span>
                          </div>

                          <p className="text-foreground-muted" style={{ fontSize: 11 }}>
                            {date}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </ResponsiveSheetBody>

        <ResponsiveSheetFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={confirm} disabled={selection.length === 0}>
            선택 ({selection.length})
          </Button>
        </ResponsiveSheetFooter>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
