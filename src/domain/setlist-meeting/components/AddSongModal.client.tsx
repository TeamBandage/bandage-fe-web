'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
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
import type { SessionDef, Song } from '../types';
import { addSongSchema, type AddSongSchema } from '../types/schema';

export interface AddSongModalProps {
  meetingId: string;
  /** 제공 시 수정 모드. 기존 곡 데이터로 폼이 사전 채움된다. */
  song?: Song;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
}

/** 표준 프리셋. 1행: 기본 + G2, 2행: 보조/멀티 세션. */
const PRESETS: Record<string, SessionDef> = {
  V: { id: 'V', label: '보컬', short: 'V', need: 1 },
  G: { id: 'G', label: '기타', short: 'G', need: 1 },
  B: { id: 'B', label: '베이스', short: 'B', need: 1 },
  D: { id: 'D', label: '드럼', short: 'D', need: 1 },
  V2: { id: 'V2', label: '보컬2', short: 'V2', need: 1 },
  G2: { id: 'G2', label: '기타2', short: 'G2', need: 1 },
  G3: { id: 'G3', label: '기타3', short: 'G3', need: 1 },
  D2: { id: 'D2', label: '드럼2', short: 'D2', need: 1 },
  S1: { id: 'S1', label: '신스1', short: 'S1', need: 1 },
  S2: { id: 'S2', label: '신스2', short: 'S2', need: 1 },
};

const PRESET_ROWS: ReadonlyArray<ReadonlyArray<string>> = [
  ['V', 'G', 'G2', 'B', 'D'],
  ['V2', 'G3', 'D2', 'S1', 'S2'],
];

const CANONICAL_ORDER: ReadonlyArray<string> = [
  'V',
  'V2',
  'G',
  'G2',
  'G3',
  'B',
  'D',
  'D2',
  'S1',
  'S2',
];

const DEFAULT_ACTIVE_PRESETS: ReadonlyArray<string> = ['V', 'G', 'B', 'D'];

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

function parseDuration(d?: string): { mm: string; ss: string } {
  if (!d) return { mm: '', ss: '' };
  const m = d.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return { mm: '', ss: '' };
  return { mm: String(parseInt(m[1]!, 10)), ss: String(parseInt(m[2]!, 10)) };
}

function splitSessions(sessions: SessionDef[]): {
  activeIds: ReadonlyArray<string>;
  extras: SessionDef[];
} {
  const activeIds: string[] = [];
  const extras: SessionDef[] = [];
  for (const s of sessions) {
    if (s.id in PRESETS) activeIds.push(s.id);
    else extras.push(s);
  }
  return { activeIds, extras };
}

type Mode = 'manual' | 'search';

export function AddSongModal({
  meetingId,
  song,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: AddSongModalProps) {
  const isEdit = !!song;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setInternalOpen(v);
  };

  const initial = useMemo(() => {
    if (song) {
      const split = splitSessions(song.sessions);
      const dur = parseDuration(song.duration);
      return {
        activeIds: split.activeIds,
        extras: split.extras,
        durationMm: dur.mm,
        durationSs: dur.ss,
        formValues: {
          title: song.title,
          artist: song.artist,
          album: song.album ?? '',
          note: song.note ?? '',
        },
      };
    }
    return {
      activeIds: DEFAULT_ACTIVE_PRESETS,
      extras: [] as SessionDef[],
      durationMm: '',
      durationSs: '',
      formValues: { title: '', artist: '', album: '', note: '' } as AddSongSchema,
    };
  }, [song]);

  const [mode, setMode] = useState<Mode>('manual');
  const [searchQuery, setSearchQuery] = useState('');
  // '계속해서 추가하기' 토글. 새로 추가 시에만 의미 있음(수정 모드에서는 비활성).
  const [keepOpen, setKeepOpen] = useState(false);
  const [activePresetIds, setActivePresetIds] = useState<ReadonlyArray<string>>(initial.activeIds);
  const [extras, setExtras] = useState<SessionDef[]>(initial.extras);
  const [extraDraft, setExtraDraft] = useState('');
  const [durationMm, setDurationMm] = useState(initial.durationMm);
  const [durationSs, setDurationSs] = useState(initial.durationSs);
  const ssInputRef = useRef<HTMLInputElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  const allSongs = useSetlistStore((s) => s.songs);
  const addSong = useSetlistStore((s) => s.addSong);
  const updateSong = useSetlistStore((s) => s.updateSong);
  const currentUserId = useSetlistStore((s) => s.currentUserId);
  const toast = useToast();

  const form = useForm<AddSongSchema>({
    resolver: zodResolver(addSongSchema),
    defaultValues: initial.formValues,
    mode: 'onTouched',
  });

  // 모달이 열릴 때, 또는 song 이 변경될 때(다른 곡 수정으로 전환) 폼/세션 상태를 initial 로 동기화.
  useEffect(() => {
    if (!open) return;
    setMode('manual');
    setSearchQuery('');
    setKeepOpen(false);
    setActivePresetIds(initial.activeIds);
    setExtras(initial.extras);
    setExtraDraft('');
    setDurationMm(initial.durationMm);
    setDurationSs(initial.durationSs);
    form.reset(initial.formValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial 은 song 변경 시에만 갱신됨
  }, [open, initial]);

  /** 다음 곡 입력을 위해 폼/duration 만 비움. 세션/extras/keepOpen 은 유지. */
  const resetForNext = () => {
    form.reset({ title: '', artist: '', album: '', note: '' });
    setDurationMm('');
    setDurationSs('');
    // 다음 입력에 즉시 포커스.
    setTimeout(() => titleRef.current?.focus(), 0);
  };

  const togglePreset = (id: string) =>
    setActivePresetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const composedSessions = useMemo<SessionDef[]>(() => {
    const ordered: SessionDef[] = [];
    for (const id of CANONICAL_ORDER) {
      if (activePresetIds.includes(id)) ordered.push(PRESETS[id]!);
    }
    return [...ordered, ...extras];
  }, [activePresetIds, extras]);

  const addExtra = () => {
    const cleaned = extraDraft
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    if (!cleaned) return;
    const id = `X_${cleaned}`;
    const short = cleaned.slice(0, 2);
    if (composedSessions.some((s) => s.id === id || s.short === short || s.label === cleaned)) {
      toast.warn('이미 같은 라벨의 세션이 있습니다.');
      return;
    }
    setExtras((prev) => [...prev, { id, label: cleaned, short, need: 1, custom: true }]);
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
    const payload = {
      title: values.title,
      artist: values.artist,
      album: values.album,
      duration: duration === '00:00' ? undefined : duration,
      note: values.note,
      sessions: composedSessions,
    };
    if (song) {
      updateSong(song.id, payload);
      toast.success('곡 정보가 수정되었습니다.');
      setOpen(false);
      return;
    }
    addSong(meetingId, { ...payload, proposerId: currentUserId });
    toast.success('곡이 추가되었습니다.');
    if (keepOpen) {
      resetForNext();
    } else {
      setOpen(false);
    }
  });

  // Enter 로 다음 입력 필드 포커스 이동. 마지막 ss 까지 가면 더 이상 이동하지 않고 유지(submit 은 버튼).
  const advanceTo = (target: 'artist' | 'album' | 'mmInput' | 'ssInput' | 'note') => {
    if (target === 'mmInput') {
      // mm input ref 는 별도로 관리하지 않음 — 그냥 album 다음은 ss 또는 note 로.
      return;
    }
    if (target === 'ssInput') {
      ssInputRef.current?.focus();
      return;
    }
    form.setFocus(target);
  };

  const onEnterAdvance =
    (next: 'artist' | 'album' | 'ssInput' | 'note') => (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return;
      if (e.nativeEvent.isComposing) return;
      e.preventDefault();
      advanceTo(next);
    };

  const onMmKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (e.nativeEvent.isComposing) return;
    e.preventDefault();
    ssInputRef.current?.focus();
  };

  const onSsKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (e.nativeEvent.isComposing) return;
    e.preventDefault();
    form.setFocus('note');
  };

  // 검색 결과 — 전체 곡 풀(현재 모든 회의)에서 부분 매칭. BE 도입 시 별도 API 로 교체 예정.
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allSongs
      .filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          (s.album ?? '').toLowerCase().includes(q) ||
          (s.duration ?? '').toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [allSongs, searchQuery]);

  const pickSearchResult = (s: Song) => {
    form.setValue('title', s.title);
    form.setValue('artist', s.artist);
    form.setValue('album', s.album ?? '');
    form.setValue('note', s.note ?? '');
    const dur = parseDuration(s.duration);
    setDurationMm(dur.mm);
    setDurationSs(dur.ss);
    setMode('manual');
    setSearchQuery('');
    toast.info('검색한 곡 정보를 불러왔습니다. 세션 구성을 확인하고 추가하세요.');
  };

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          // Close 시 다음 오픈을 위해 상태 리셋.
          form.reset(initial.formValues);
          setActivePresetIds(initial.activeIds);
          setExtras(initial.extras);
          setExtraDraft('');
          setDurationMm(initial.durationMm);
          setDurationSs(initial.durationSs);
          setMode('manual');
          setSearchQuery('');
          setKeepOpen(false);
        }
      }}
    >
      {trigger && <ResponsiveSheetTrigger asChild>{trigger}</ResponsiveSheetTrigger>}
      <ResponsiveSheetContent>
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>{isEdit ? '곡 수정' : '곡 추가'}</ResponsiveSheetTitle>
        </ResponsiveSheetHeader>
        <form onSubmit={onSubmit}>
          <ResponsiveSheetBody>
            {/* 모드 탭 — 수정 모드에서는 검색 비활성(편집은 직접만). */}
            {!isEdit && (
              <div className="bg-card border-border mb-s-4 inline-flex items-center rounded-md border p-1">
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className={cn(
                    'px-s-3 py-s-1 text-caption rounded-sm font-semibold transition-colors',
                    mode === 'manual'
                      ? 'bg-accent text-foreground'
                      : 'text-foreground-muted hover:text-foreground',
                  )}
                >
                  직접 추가
                </button>
                <button
                  type="button"
                  onClick={() => setMode('search')}
                  className={cn(
                    'px-s-3 py-s-1 text-caption rounded-sm font-semibold transition-colors',
                    mode === 'search'
                      ? 'bg-accent text-foreground'
                      : 'text-foreground-muted hover:text-foreground',
                  )}
                >
                  검색
                </button>
              </div>
            )}

            <div className="gap-s-3 flex flex-col">
              {mode === 'manual' || isEdit ? (
                <>
                  <Input
                    label="곡명"
                    required
                    error={form.formState.errors.title?.message}
                    placeholder="예: Vicarious"
                    autoFocus
                    {...form.register('title')}
                    ref={(el) => {
                      form.register('title').ref(el);
                      titleRef.current = el;
                    }}
                    onKeyDown={onEnterAdvance('artist')}
                  />
                  <Input
                    label="아티스트"
                    required
                    error={form.formState.errors.artist?.message}
                    placeholder="예: Tool"
                    {...form.register('artist')}
                    onKeyDown={onEnterAdvance('album')}
                  />
                  <div className="gap-s-3 flex">
                    <div className="flex-1">
                      <Input
                        label="앨범"
                        error={form.formState.errors.album?.message}
                        placeholder="선택"
                        {...form.register('album')}
                        onKeyDown={onEnterAdvance('ssInput')}
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
                          onChange={(e) => {
                            const next = clampNumeric(e.target.value, 99);
                            setDurationMm(next);
                            // 두 자리 입력되면 자동으로 초 필드로 이동.
                            if (next.length === 2) ssInputRef.current?.focus();
                          }}
                          onKeyDown={onMmKeyDown}
                          placeholder="00"
                          aria-label="재생 시간 분"
                          className="placeholder:text-foreground-muted w-7 bg-transparent text-center font-mono text-sm tabular-nums outline-none"
                        />
                        <span className="text-foreground-muted font-mono text-sm">:</span>
                        <input
                          ref={ssInputRef}
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={durationSs}
                          onChange={(e) => setDurationSs(clampNumeric(e.target.value, 59))}
                          onKeyDown={onSsKeyDown}
                          placeholder="00"
                          aria-label="재생 시간 초"
                          className="placeholder:text-foreground-muted w-7 bg-transparent text-center font-mono text-sm tabular-nums outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-foreground text-sm font-medium">곡 검색</label>
                  <div className="bg-surface border-border gap-s-2 px-s-3 focus-within:ring-accent focus-within:ring-offset-bg mt-1.5 flex h-10 items-center rounded-md border focus-within:ring-2 focus-within:ring-offset-2">
                    <Search className="text-foreground-muted h-4 w-4 shrink-0" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="곡명 · 아티스트 · 앨범 · 재생 시간"
                      autoFocus
                      className="placeholder:text-foreground-muted w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                  <div className="text-foreground-muted text-micro mt-s-2">
                    합주곡 풀에서 검색합니다. 결과 클릭 시 폼이 채워지고 직접 추가 탭으로
                    전환됩니다.
                  </div>
                  {searchQuery && (
                    <div className="border-border mt-s-3 max-h-72 overflow-y-auto rounded-md border">
                      {searchResults.length === 0 ? (
                        <div className="text-foreground-muted px-s-4 py-s-6 text-caption text-center">
                          일치하는 곡이 없습니다.
                        </div>
                      ) : (
                        <ul>
                          {searchResults.map((s) => (
                            <li key={s.id}>
                              <button
                                type="button"
                                onClick={() => pickSearchResult(s)}
                                className="hover:bg-card border-border px-s-3 py-s-2 flex w-full items-center justify-between border-b text-left last:border-b-0"
                              >
                                <div className="min-w-0">
                                  <div className="text-caption truncate font-bold">{s.title}</div>
                                  <div className="text-foreground-muted text-micro mt-0.5 truncate">
                                    {s.artist}
                                    {s.album ? ` · ${s.album}` : ''}
                                  </div>
                                </div>
                                {s.duration && (
                                  <span className="text-foreground-muted text-micro shrink-0 font-mono tabular-nums">
                                    {s.duration}
                                  </span>
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 세션 구성 — 두 모드 공통 */}
              <div>
                <div className="text-foreground-sub text-caption mb-s-2 font-semibold">
                  세션 구성
                </div>
                <div className="text-foreground-muted text-micro mb-s-2">
                  자주 쓰는 세션을 토글하고, 필요하면 알파벳 라벨로 커스텀 세션을 추가하세요.
                </div>

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

                <div className="gap-s-2 mt-s-3 flex items-end">
                  <div className="flex-1">
                    <Input
                      value={extraDraft}
                      onChange={(e) =>
                        setExtraDraft(
                          e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z]/g, '')
                            .slice(0, 10),
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addExtra();
                        }
                      }}
                      placeholder="커스텀 세션 라벨 (영문 최대 10자, 표시는 앞 2자)"
                      autoComplete="off"
                      maxLength={10}
                    />
                  </div>
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
            {/* 새로 추가 모드일 때만 '계속 추가' 토글 노출. */}
            {!isEdit && (
              <label className="text-foreground-sub gap-s-2 text-caption mr-auto inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={keepOpen}
                  onChange={(e) => setKeepOpen(e.target.checked)}
                  className="accent-accent h-4 w-4"
                />
                계속해서 추가하기
              </label>
            )}
            <ResponsiveSheetClose asChild>
              <Button type="button" variant="ghost">
                취소
              </Button>
            </ResponsiveSheetClose>
            <Button type="submit" variant="primary" disabled={!canSubmit}>
              {isEdit ? '저장' : keepOpen ? '다음 곡 추가' : '곡 추가'}
            </Button>
          </ResponsiveSheetFooter>
        </form>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
