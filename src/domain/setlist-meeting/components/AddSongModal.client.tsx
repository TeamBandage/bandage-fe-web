'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/cn';
import { useToast } from '@/hooks/useToast';

import { useSetlistStore } from '../store/setlistStore';
import type { SessionDef } from '../types';
import { addSongSchema, type AddSongSchema } from '../types/schema';

export interface AddSongModalProps {
  meetingId: string;
  trigger: ReactNode;
}

/** 표준 프리셋. 1행: 기본 4세션, 2행: 보조/멀티 세션. */
const PRESETS: Record<string, SessionDef> = {
  V: { id: 'V', label: '보컬', short: 'V', need: 1 },
  G: { id: 'G', label: '기타', short: 'G', need: 1 },
  B: { id: 'B', label: '베이스', short: 'B', need: 1 },
  D: { id: 'D', label: '드럼', short: 'D', need: 1 },
  V2: { id: 'V2', label: '보컬2', short: 'V2', need: 1 },
  G2: { id: 'G2', label: '기타2', short: 'G2', need: 1 },
  D2: { id: 'D2', label: '드럼2', short: 'D2', need: 1 },
  S1: { id: 'S1', label: '신스1', short: 'S1', need: 1 },
  S2: { id: 'S2', label: '신스2', short: 'S2', need: 1 },
};

const PRESET_ROWS: ReadonlyArray<ReadonlyArray<string>> = [
  ['V', 'G', 'B', 'D'],
  ['V2', 'G2', 'D2', 'S1', 'S2'],
];

/** 모달 오픈 시 기본 활성화되는 프리셋 — 1행 전체. */
const DEFAULT_ACTIVE_PRESETS: ReadonlyArray<string> = ['V', 'G', 'B', 'D'];

/** 0~99 범위의 숫자 두자리로 정규화. 빈 문자열은 그대로 두고, 화면에 표시할 때 padStart. */
function clampNumeric(raw: string, max: number): string {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 2);
  if (digits === '') return '';
  const n = Math.min(parseInt(digits, 10), max);
  return String(n);
}

function formatDuration(mm: string, ss: string): string {
  const m = mm === '' ? '00' : mm.padStart(2, '0');
  const s = ss === '' ? '00' : ss.padStart(2, '0');
  return `${m}:${s}`;
}

export function AddSongModal({ meetingId, trigger }: AddSongModalProps) {
  const [open, setOpen] = useState(false);
  // 활성화된 프리셋 id 집합. 토글로 켜고 끔.
  const [activePresetIds, setActivePresetIds] =
    useState<ReadonlyArray<string>>(DEFAULT_ACTIVE_PRESETS);
  const [extras, setExtras] = useState<SessionDef[]>([]);
  const [extraDraft, setExtraDraft] = useState('');
  // 재생 시간 — 분/초 분리 입력. 기본 '00:00'.
  const [durationMm, setDurationMm] = useState('');
  const [durationSs, setDurationSs] = useState('');
  const addSong = useSetlistStore((s) => s.addSong);
  const currentUserId = useSetlistStore((s) => s.currentUserId);
  const toast = useToast();

  const form = useForm<AddSongSchema>({
    resolver: zodResolver(addSongSchema),
    defaultValues: { title: '', artist: '', album: '', note: '' },
    mode: 'onTouched',
  });

  const reset = () => {
    form.reset();
    setActivePresetIds(DEFAULT_ACTIVE_PRESETS);
    setExtras([]);
    setExtraDraft('');
    setDurationMm('');
    setDurationSs('');
  };

  const togglePreset = (id: string) =>
    setActivePresetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  // 활성 프리셋 + 커스텀 결합. 출력 순서는 PRESET_ROWS 정의 순서를 따라 안정적으로 유지.
  const composedSessions = useMemo<SessionDef[]>(() => {
    const ordered: SessionDef[] = [];
    for (const row of PRESET_ROWS) {
      for (const id of row) {
        if (activePresetIds.includes(id)) ordered.push(PRESETS[id]!);
      }
    }
    return [...ordered, ...extras];
  }, [activePresetIds, extras]);

  const addExtra = () => {
    const raw = extraDraft.trim().toUpperCase();
    if (!raw) return;
    const cleaned = raw.replace(/[^A-Z]/g, '');
    if (!cleaned) return;
    const id = `X_${cleaned}`;
    if (composedSessions.some((s) => s.id === id || s.short === cleaned)) {
      toast.warn('이미 같은 라벨의 세션이 있습니다.');
      return;
    }
    setExtras((prev) => [...prev, { id, label: cleaned, short: cleaned, need: 1, custom: true }]);
    setExtraDraft('');
  };

  const removeExtra = (id: string) => setExtras((prev) => prev.filter((s) => s.id !== id));

  const canSubmit = form.formState.isValid && composedSessions.length > 0;

  const onSubmit = form.handleSubmit((values) => {
    if (composedSessions.length === 0) {
      toast.error('세션을 최소 1개 이상 선택해 주세요.');
      return;
    }
    const duration = formatDuration(durationMm, durationSs);
    addSong(meetingId, {
      title: values.title,
      artist: values.artist,
      album: values.album,
      duration: duration === '00:00' ? undefined : duration,
      note: values.note,
      proposerId: currentUserId,
      sessions: composedSessions,
    });
    toast.success('곡이 추가되었습니다.');
    setOpen(false);
    reset();
  });

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <ResponsiveSheetTrigger asChild>{trigger}</ResponsiveSheetTrigger>
      <ResponsiveSheetContent>
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>곡 추가</ResponsiveSheetTitle>
        </ResponsiveSheetHeader>
        <form onSubmit={onSubmit}>
          <ResponsiveSheetBody>
            <div className="gap-s-3 flex flex-col">
              <Input
                label="곡명"
                required
                error={form.formState.errors.title?.message}
                placeholder="예: Vicarious"
                autoFocus
                {...form.register('title')}
              />
              <Input
                label="아티스트"
                required
                error={form.formState.errors.artist?.message}
                placeholder="예: Tool"
                {...form.register('artist')}
              />
              <div className="gap-s-3 flex">
                <div className="flex-1">
                  <Input
                    label="앨범"
                    error={form.formState.errors.album?.message}
                    placeholder="선택"
                    {...form.register('album')}
                  />
                </div>
                <div>
                  <label className="text-foreground text-sm font-medium">재생 시간</label>
                  <div className="bg-surface border-border focus-within:ring-accent focus-within:ring-offset-bg gap-s-1 px-s-3 mt-1.5 flex h-10 items-center rounded-md border focus-within:ring-2 focus-within:ring-offset-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={durationMm}
                      onChange={(e) => setDurationMm(clampNumeric(e.target.value, 99))}
                      placeholder="00"
                      aria-label="재생 시간 분"
                      className="placeholder:text-foreground-muted w-7 bg-transparent text-center font-mono text-sm tabular-nums outline-none"
                    />
                    <span className="text-foreground-muted font-mono text-sm">:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={durationSs}
                      onChange={(e) => setDurationSs(clampNumeric(e.target.value, 59))}
                      placeholder="00"
                      aria-label="재생 시간 초"
                      className="placeholder:text-foreground-muted w-7 bg-transparent text-center font-mono text-sm tabular-nums outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 세션 구성 — 추천자 의견 위로 이동 */}
              <div>
                <div className="text-foreground-sub text-caption mb-s-2 font-semibold">
                  세션 구성
                </div>
                <div className="text-foreground-muted text-micro mb-s-2">
                  자주 쓰는 세션을 토글하고, 필요하면 알파벳 라벨로 커스텀 세션을 추가하세요.
                </div>

                {/* 1행: 기본 4세션 / 2행: 보조 5세션 */}
                <div className="gap-s-2 flex flex-col">
                  {PRESET_ROWS.map((row, rowIdx) => (
                    <div key={rowIdx} className="gap-s-2 flex flex-wrap">
                      {row.map((id) => {
                        const p = PRESETS[id]!;
                        const active = activePresetIds.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => togglePreset(id)}
                            aria-pressed={active}
                            className={cn(
                              'px-s-3 py-s-1 text-caption rounded-md border font-mono font-bold transition-colors',
                              active
                                ? 'bg-accent-dim border-accent/40 text-accent'
                                : 'bg-card border-border text-foreground-muted hover:border-border-hi',
                            )}
                          >
                            {p.short}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* 커스텀 세션 추가 — 영문 알파벳만 허용 */}
                <div className="gap-s-2 mt-s-3 flex">
                  <Input
                    value={extraDraft}
                    onChange={(e) =>
                      setExtraDraft(
                        e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z]/g, '')
                          .slice(0, 4),
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addExtra();
                      }
                    }}
                    placeholder="커스텀 라벨 (영문 알파벳만, 최대 4자)"
                    autoCapitalize="characters"
                    autoComplete="off"
                    pattern="[A-Za-z]*"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addExtra}
                    disabled={!extraDraft}
                  >
                    <Plus className="h-4 w-4" /> 추가
                  </Button>
                </div>
                {extras.length > 0 && (
                  <ul className="gap-s-2 mt-s-2 flex flex-wrap">
                    {extras.map((s) => (
                      <li
                        key={s.id}
                        className="bg-amber-dim text-amber border-amber/30 px-s-2 gap-s-1 text-micro inline-flex items-center rounded-full border py-0.5 font-bold"
                      >
                        {s.label}
                        <button
                          type="button"
                          onClick={() => removeExtra(s.id)}
                          aria-label={`${s.label} 세션 제거`}
                          className="hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {composedSessions.length === 0 && (
                  <p className="text-danger text-micro mt-s-2">최소 1개 세션을 선택하세요.</p>
                )}
              </div>

              <Textarea
                label="추천자 의견"
                error={form.formState.errors.note?.message}
                rows={3}
                placeholder="이 곡을 추천하는 이유, 합주 시 유의사항 등"
                {...form.register('note')}
              />
            </div>
          </ResponsiveSheetBody>
          <ResponsiveSheetFooter>
            <ResponsiveSheetClose asChild>
              <Button type="button" variant="ghost">
                취소
              </Button>
            </ResponsiveSheetClose>
            <Button type="submit" variant="primary" disabled={!canSubmit}>
              곡 추가
            </Button>
          </ResponsiveSheetFooter>
        </form>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
