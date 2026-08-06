'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';

import {
  SessionComposer,
  defaultSessionRows,
  deriveSessionRows,
  expandSessionRows,
  type SessionRowState,
} from '@/components/ui/session-composer';
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
import { useCreateTrackSelectionItem } from '@/domain/track-selection/hooks/useCreateTrackSelectionItem';
import { useUpdateTrackSelectionItem } from '@/domain/track-selection/hooks/useUpdateTrackSelectionItem';
import { mmSsToSeconds } from '@/domain/track-selection/utils/toSong';
import type { SessionDefDto } from '@/domain/track-selection/types/req';

import { searchMockSongs, type SongSearchResult } from '../mock/songSearchMock';
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
  // 입력 필드는 0 패딩된 형식을 그대로 보여줌. 단일 자리 입력 후 onBlur 가 패딩을 보장.
  return { mm: m[1]!.padStart(2, '0'), ss: m[2]! };
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
      const dur = parseDuration(song.duration);
      return {
        sessionRows: deriveSessionRows(
          song.sessions.map((s) => ({ label: s.label, sessionId: s.id })),
        ),
        durationMm: dur.mm,
        durationSs: dur.ss,
        formValues: {
          title: song.title,
          artist: song.artist,
          album: song.album ?? '',
          note: song.note ?? '',
          reference: song.reference ?? '',
        },
      };
    }
    return {
      sessionRows: defaultSessionRows(),
      durationMm: '',
      durationSs: '',
      formValues: {
        title: '',
        artist: '',
        album: '',
        note: '',
        reference: '',
      } as AddSongSchema,
    };
  }, [song]);

  const [mode, setMode] = useState<Mode>('manual');
  const [searchQuery, setSearchQuery] = useState('');
  // '계속해서 추가하기' 토글. 새로 추가 시에만 의미 있음(수정 모드에서는 비활성).
  const [keepOpen, setKeepOpen] = useState(false);
  const [sessionRows, setSessionRows] = useState<SessionRowState[]>(initial.sessionRows);
  const [durationMm, setDurationMm] = useState(initial.durationMm);
  const [durationSs, setDurationSs] = useState(initial.durationSs);
  const ssInputRef = useRef<HTMLInputElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  const updateSong = useSetlistStore((s) => s.updateSong);
  const toast = useToast();

  const createItem = useCreateTrackSelectionItem(meetingId);
  const updateItem = useUpdateTrackSelectionItem(meetingId);

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
    setSessionRows(initial.sessionRows);
    setDurationMm(initial.durationMm);
    setDurationSs(initial.durationSs);
    form.reset(initial.formValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial 은 song 변경 시에만 갱신됨
  }, [open, initial]);

  /** 다음 곡 입력을 위해 폼/duration 만 비움. 세션/extras/keepOpen 은 유지. */
  const resetForNext = () => {
    form.reset({ title: '', artist: '', album: '', note: '', reference: '' });
    setDurationMm('');
    setDurationSs('');
    // 다음 입력에 즉시 포커스.
    setTimeout(() => titleRef.current?.focus(), 0);
  };

  // 세션 1개 = 인원 1명. 인원수(count)만큼 같은 라벨을 그대로 중복 전송(예: VOCAL 2명 → VOCAL, VOCAL).
  const expandedSessions = useMemo(() => expandSessionRows(sessionRows), [sessionRows]);
  // 로컬 mock store 낙관적 업데이트용. short 는 서버가 생성하므로 실제 값이 아닌 임시 표시값.
  // 신규 자리는 아직 서버 sessionId 가 없으므로 로컬 전용 임시 키를 사용(다음 refetch 로 교체됨).
  const composedSessions = useMemo<SessionDef[]>(
    () =>
      expandedSessions.map((s, i) => ({
        id: s.sessionId ?? `local-${s.label}-${i}`,
        label: s.label,
        short: s.label.slice(0, 1),
        need: 1,
        custom: s.custom,
      })),
    [expandedSessions],
  );

  const canSubmit = form.formState.isValid && expandedSessions.length > 0;

  const onSubmit = form.handleSubmit(async (values) => {
    if (expandedSessions.length === 0) {
      toast.error('세션을 최소 1개 이상 선택해 주세요.');
      return;
    }
    const durationStr = formatDuration(durationMm, durationSs);
    const duration = mmSsToSeconds(durationStr);

    const sessionDtos: SessionDefDto[] = expandedSessions;

    if (song) {
      try {
        await updateItem.mutateAsync({
          itemId: song.id,
          body: {
            title: values.title,
            artist: values.artist || undefined,
            album: values.album || undefined,
            duration,
            note: values.note || undefined,
            reference: values.reference || undefined,
            sessions: sessionDtos,
          },
        });
        updateSong(song.id, {
          title: values.title,
          artist: values.artist,
          album: values.album || undefined,
          duration: durationStr !== '00:00' ? durationStr : undefined,
          note: values.note || undefined,
          reference: values.reference || undefined,
          sessions: composedSessions,
        });
        toast.success('곡 정보가 수정되었습니다.');
        setOpen(false);
      } catch {
        toast.error('곡 수정에 실패했습니다.');
      }
      return;
    }

    try {
      await createItem.mutateAsync({
        title: values.title,
        artist: values.artist,
        album: values.album || undefined,
        duration,
        note: values.note || undefined,
        reference: values.reference || undefined,
        sessions: sessionDtos,
      });
      toast.success('곡이 추가되었습니다.');
      if (keepOpen) {
        resetForNext();
      } else {
        setOpen(false);
      }
    } catch {
      toast.error('곡 추가에 실패했습니다.');
    }
  });

  // Enter 로 다음 입력 필드 포커스 이동. 마지막 ss 까지 가면 더 이상 이동하지 않고 유지(submit 은 버튼).
  const advanceTo = (target: 'artist' | 'album' | 'mmInput' | 'ssInput' | 'reference' | 'note') => {
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
    (next: 'artist' | 'album' | 'ssInput' | 'reference' | 'note') =>
    (e: KeyboardEvent<HTMLInputElement>) => {
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
    form.setFocus('reference');
  };

  // 외부 곡 DB mock 검색. 향후 SONG 검색 API 도입 시 fetcher 만 교체.
  const searchResults = useMemo(() => searchMockSongs(searchQuery, 30), [searchQuery]);

  const pickSearchResult = (s: SongSearchResult) => {
    form.setValue('title', s.title);
    form.setValue('artist', s.artist);
    form.setValue('album', s.album ?? '');
    form.setValue('note', '');
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
          setSessionRows(initial.sessionRows);
          setDurationMm(initial.durationMm);
          setDurationSs(initial.durationSs);
          setMode('manual');
          setSearchQuery('');
          setKeepOpen(false);
        }
      }}
    >
      {trigger && <ResponsiveSheetTrigger asChild>{trigger}</ResponsiveSheetTrigger>}
      <ResponsiveSheetContent className="lg:max-w-2xl">
        <ResponsiveSheetHeader className="border-b-0 pb-2">
          <ResponsiveSheetTitle>{isEdit ? '곡 수정' : '곡 추가'}</ResponsiveSheetTitle>
        </ResponsiveSheetHeader>
        <form onSubmit={onSubmit}>
          <ResponsiveSheetBody>
            {/* 모드 탭 — 밴드 정보/멤버 탭과 동일한 underline 스타일. 수정 모드에서는 검색 비활성. */}
            {!isEdit && (
              <div className="border-border mb-s-4 gap-s-6 -mx-s-1 flex border-b">
                {[
                  { id: 'manual' as const, label: '직접 추가' },
                  { id: 'search' as const, label: '검색' },
                ].map((tab) => {
                  const active = mode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setMode(tab.id)}
                      aria-pressed={active}
                      className={cn(
                        'px-s-1 -mb-px h-10 border-b-2 text-sm font-semibold transition-colors',
                        active
                          ? 'border-white text-white'
                          : 'text-foreground-sub hover:text-foreground border-transparent',
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="gap-s-3 flex flex-col">
              {mode === 'manual' || isEdit ? (
                <div className="gap-s-3 flex flex-col">
                  <div className="gap-s-3 grid grid-cols-1 sm:grid-cols-2">
                    <Input
                      label="곡명"
                      required
                      error={form.formState.errors.title?.message}
                      placeholder="예: Vicarious"
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
                  </div>
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
                      <div className="bg-surface border-border hover:border-border-hi gap-s-1 px-s-3 mt-2.5 flex h-10 items-center rounded-[5px] border transition-colors focus-within:border-white/70">
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
                          onBlur={() => {
                            // 한 자리만 입력했을 때 0 패딩(예: "7" → "07").
                            if (durationMm.length === 1) setDurationMm(durationMm.padStart(2, '0'));
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
                          onBlur={() => {
                            if (durationSs.length === 1) setDurationSs(durationSs.padStart(2, '0'));
                          }}
                          onKeyDown={onSsKeyDown}
                          placeholder="00"
                          aria-label="재생 시간 초"
                          className="placeholder:text-foreground-muted w-7 bg-transparent text-center font-mono text-sm tabular-nums outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <Input
                    label="참고 링크"
                    error={form.formState.errors.reference?.message}
                    placeholder="예: https://youtube.com/..."
                    {...form.register('reference')}
                    onKeyDown={onEnterAdvance('note')}
                  />
                </div>
              ) : (
                <div>
                  <label className="text-foreground text-sm font-medium">곡 검색</label>
                  <div className="bg-surface border-border hover:border-border-hi gap-s-2 px-s-3 mt-2.5 flex h-10 items-center rounded-[5px] border transition-colors focus-within:border-white/70">
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
                    외부 곡 DB 에서 검색합니다 (현재 mock — 추후 SONG 검색 API 로 교체). 결과 클릭
                    시 폼이 채워지고 직접 추가 탭으로 전환됩니다.
                  </div>
                  {/* 결과 영역 — 카드 ~64px × 3곡 + 약간 = 200px. 그 이상은 스크롤. */}
                  <div className="border-border mt-s-3 h-[200px] overflow-y-auto rounded-md border">
                    {!searchQuery ? (
                      <div className="text-foreground-muted gap-s-2 px-s-4 py-s-12 text-caption flex flex-col items-center justify-center text-center">
                        <Search className="h-6 w-6 opacity-50" />
                        <p>검색어를 입력하면 합주곡 풀에서 매칭되는 곡을 보여드립니다.</p>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="text-foreground-muted px-s-4 py-s-12 text-caption text-center">
                        &lsquo;{searchQuery}&rsquo; 와 일치하는 곡이 없습니다.
                      </div>
                    ) : (
                      <ul>
                        {searchResults.map((s) => (
                          <li key={s.externalId}>
                            <button
                              type="button"
                              onClick={() => pickSearchResult(s)}
                              className="hover:bg-card border-border px-s-4 py-s-3 flex w-full items-center justify-between border-b text-left last:border-b-0"
                            >
                              <div className="min-w-0">
                                <div className="text-body truncate font-bold">{s.title}</div>
                                <div className="text-foreground-muted text-caption mt-0.5 truncate">
                                  {s.artist}
                                  {s.album ? ` · ${s.album}` : ''}
                                </div>
                              </div>
                              {s.duration && (
                                <span className="text-foreground-muted text-caption shrink-0 font-mono tabular-nums">
                                  {s.duration}
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* 세션 구성 — 두 모드 공통 */}
              <div>
                <div className="text-foreground-sub text-caption mb-s-2 font-semibold">
                  세션 구성
                </div>
                <div className="text-foreground-muted text-micro mb-s-2">
                  세션별 인원수를 +/- 로 조정하고, 필요하면 영문 이름으로 커스텀 세션을 추가하세요.
                </div>

                <SessionComposer rows={sessionRows} onChange={setSessionRows} />
              </div>

              <Textarea
                label="추천자 의견"
                error={form.formState.errors.note?.message}
                rows={3}
                placeholder="이 곡을 추천하는 이유, 합주 시 유의사항 등"
                className="rounded-[5px] focus-visible:border-white/70 focus-visible:ring-0"
                {...form.register('note')}
              />
            </div>
          </ResponsiveSheetBody>
          <ResponsiveSheetFooter className="border-t-0">
            {/* 새로 추가 모드일 때만 '계속 추가' 토글 노출. */}
            {!isEdit && (
              <label className="text-foreground-sub gap-s-2 text-body mr-auto inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={keepOpen}
                  onChange={(e) => setKeepOpen(e.target.checked)}
                  className="h-4 w-4 accent-white"
                />
                계속해서 추가하기
              </label>
            )}
            <ResponsiveSheetClose asChild>
              <Button type="button" variant="ghost" size="sm" className="rounded-[5px]">
                취소
              </Button>
            </ResponsiveSheetClose>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!canSubmit}
              className="rounded-[5px] bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30"
            >
              {isEdit ? '저장' : keepOpen ? '다음 곡 추가' : '곡 추가'}
            </Button>
          </ResponsiveSheetFooter>
        </form>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
