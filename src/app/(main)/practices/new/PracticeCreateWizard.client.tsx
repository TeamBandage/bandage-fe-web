'use client';

import { Check, Music2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BandPickerModal } from '@/domain/band/components/BandPickerModal.client';
import type { BandInfoResponse, MyBandInfoResponse } from '@/domain/band/types';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { StepIndicator } from '@/components/ui/step-indicator';
import { WizardSummaryCard } from '@/components/ui/wizard-summary-card';
import { useMyBands } from '@/domain/band/hooks/useMyBands';
import { useCreatePractice } from '@/domain/practice/hooks/useCreatePractice';
import { useSearchSongs } from '@/domain/practice-song/hooks/useSearchSongs';
import type { SongSearchItem } from '@/domain/practice-song/types';
import { ROUTES } from '@/global/config/routes';
import { useRegisterDirtyForm } from '@/global/navigation/dirty-form-context';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';

const STEPS = ['밴드 선택', '곡 선택', '일정 설정', '검토'] as const;
type Step = 0 | 1 | 2 | 3;

type SongPick =
  | { mode: 'picked'; picked: SongSearchItem }
  | {
      mode: 'custom';
      custom: { title: string; artist: string; album: string; duration: number; refLink?: string };
    };

export function PracticeCreateWizard() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<Step>(0);

  // Step 1 상태
  const [bandId, setBandId] = useState<string>('');
  const myBands = useMyBands(50);
  const [bandPickerOpen, setBandPickerOpen] = useState(false);
  // 검색 모달에서 추가된 외부 밴드 (myBands 그리드에 안 보이는 것).
  const [extraBands, setExtraBands] = useState<BandInfoResponse[]>([]);

  // Step 2 상태
  const [songMode, setSongMode] = useState<'picked' | 'custom'>('picked');
  const [songQuery, setSongQuery] = useState('');
  const debouncedQuery = useDebounce(songQuery, 250);
  const songSearch = useSearchSongs(debouncedQuery);
  const [picked, setPicked] = useState<SongSearchItem | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [customAlbum, setCustomAlbum] = useState('');
  const [customDuration, setCustomDuration] = useState<number>(0);

  // Step 3 상태
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [startAt, setStartAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  // Navigation Guard 등록 — 어느 단계든 입력값이 있으면 dirty.
  const dirty =
    step > 0 ||
    !!bandId ||
    !!picked ||
    customTitle.length > 0 ||
    customArtist.length > 0 ||
    title.length > 0 ||
    venue.length > 0 ||
    !!startAt;
  useRegisterDirtyForm('practice-create-wizard', dirty);

  const mutation = useCreatePractice({
    onSuccess: (data) => {
      toast.resourceCreated('합주', { name: title || '새 합주' });
      router.replace(ROUTES.PRACTICE_DETAIL(data.practiceId));
    },
    onError: (err) => toast.error(err.message || '합주 생성에 실패했습니다.'),
  });

  const songPick: SongPick | null =
    songMode === 'picked'
      ? picked
        ? { mode: 'picked', picked }
        : null
      : customTitle && customArtist
        ? {
            mode: 'custom',
            custom: {
              title: customTitle,
              artist: customArtist,
              album: customAlbum,
              duration: customDuration,
            },
          }
        : null;

  const canNext =
    step === 0
      ? !!bandId
      : step === 1
        ? !!songPick
        : step === 2
          ? !!startAt && durationMinutes >= 15
          : false;
  const canSubmit = step === 3 && !!songPick && !!startAt && durationMinutes >= 15;

  function next() {
    if (step === 0 && !bandId) return toast.error('밴드를 선택해 주세요.');
    if (step === 1 && !songPick) return toast.error('곡을 선택하거나 직접 입력해 주세요.');
    if (step === 2 && !startAt) return toast.error('시작 시각을 설정해 주세요.');
    if (step < 3) setStep((step + 1) as Step);
  }

  function back() {
    if (step > 0) setStep((step - 1) as Step);
  }

  function submit() {
    if (!songPick) return;
    if (!startAt) return toast.error('시작 시각을 설정해 주세요.');
    // NOTE: §4-1 song 필드는 songId(UUID) 를 요구하지만 §5-2/§5-3 합주곡 생성은 practiceId 가 선행되어야 하는 닭-달걀
    //       문제. 본 라운드는 곡 메타 텍스트(`title — artist`) 를 임시 식별자로 전송하고, 백엔드 응답을 Task 8 에서
    //       검증 후 후속 보정 (FE-API-020 등록).
    const songIdentifier =
      songPick.mode === 'picked'
        ? `${songPick.picked.title} — ${songPick.picked.artist}`
        : `${songPick.custom.title} — ${songPick.custom.artist}`;
    mutation.mutate({
      title: title || undefined,
      song: songIdentifier,
      venue: venue || undefined,
      startAt,
      durationMinutes,
    });
  }

  return (
    <div
      className="px-s-5 py-s-6 lg:px-s-8 lg:py-s-8 mx-auto max-w-3xl"
      data-slot="practice-create-wizard"
    >
      <header className="mb-s-6 flex items-baseline justify-between gap-3">
        <h1 className="text-title font-bold">합주 시작하기</h1>
      </header>

      <StepIndicator steps={STEPS} current={step} />

      {/* Step 1 — 밴드 선택 */}
      {step === 0 && (
        <section data-slot="wizard-step-band" className="space-y-s-4">
          <h2 className="text-subtitle font-semibold">합주를 진행할 밴드를 선택하세요</h2>
          {myBands.isLoading ? (
            <p className="text-foreground-muted text-caption">불러오는 중…</p>
          ) : !myBands.data || myBands.data.length === 0 ? (
            <p className="text-foreground-muted text-caption">
              참여 중인 밴드가 없습니다. 먼저 밴드에 가입하거나 새 밴드를 만들어 주세요.
            </p>
          ) : (
            <>
              <ul className="gap-s-2 grid grid-cols-1 sm:grid-cols-2">
                {/* 최대 6 개 + 검색 모달로 추가된 외부 밴드 */}
                {[...myBands.data.slice(0, 6), ...extraBands].map((b) => {
                  const selected = b.bandId === bandId;
                  const myRole = (b as MyBandInfoResponse).myRole;
                  return (
                    <li key={b.bandId}>
                      <button
                        type="button"
                        onClick={() => setBandId(b.bandId)}
                        aria-pressed={selected}
                        className={
                          'border-border bg-card hover:bg-card-hover gap-s-3 px-s-4 py-s-3 flex w-full items-center rounded-md border text-left transition-colors ' +
                          (selected ? 'border-l-accent bg-accent-dim border-accent border-l-4' : '')
                        }
                      >
                        <span className="bg-accent-dim text-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
                          <Music2 className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-body truncate font-semibold">{b.bandName}</div>
                          <div className="text-foreground-muted text-caption truncate">
                            {myRole === 'LEADER'
                              ? '리더'
                              : myRole === 'ADMIN'
                                ? '관리자'
                                : myRole === 'MEMBER'
                                  ? '멤버'
                                  : '검색에서 추가'}
                          </div>
                        </div>
                        {selected && (
                          <span
                            className="bg-accent text-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                            aria-label="선택됨"
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setBandPickerOpen(true)}
                className="w-full"
              >
                <Search className="h-4 w-4" /> 다른 밴드 검색해서 찾기
              </Button>
            </>
          )}
        </section>
      )}

      {/* Step 2 — 곡 선택 */}
      {step === 1 && (
        <section data-slot="wizard-step-song" className="space-y-s-4">
          <div className="border-border gap-s-2 flex border-b">
            <button
              type="button"
              onClick={() => setSongMode('picked')}
              className={
                'px-s-4 py-s-2 text-caption -mb-px border-b-2 ' +
                (songMode === 'picked'
                  ? 'border-accent text-accent'
                  : 'text-foreground-sub border-transparent')
              }
            >
              검색
            </button>
            <button
              type="button"
              onClick={() => setSongMode('custom')}
              className={
                'px-s-4 py-s-2 text-caption -mb-px border-b-2 ' +
                (songMode === 'custom'
                  ? 'border-accent text-accent'
                  : 'text-foreground-sub border-transparent')
              }
            >
              직접 입력
            </button>
          </div>

          {songMode === 'picked' ? (
            <>
              <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 flex items-center rounded-md border">
                <Search className="text-foreground-muted h-4 w-4" aria-hidden="true" />
                <input
                  type="search"
                  value={songQuery}
                  onChange={(e) => setSongQuery(e.target.value)}
                  placeholder="곡 제목·아티스트로 검색…"
                  className="text-body placeholder:text-foreground-muted w-full bg-transparent outline-none"
                />
              </div>
              {!debouncedQuery ? (
                <p className="text-foreground-muted text-caption">검색어를 입력해 주세요.</p>
              ) : songSearch.isLoading ? (
                <p className="text-foreground-muted text-caption">검색 중…</p>
              ) : !songSearch.data || songSearch.data.length === 0 ? (
                <p className="text-foreground-muted text-caption">결과가 없습니다.</p>
              ) : (
                <ul className="gap-s-2 flex flex-col">
                  {songSearch.data.map((s, i) => {
                    const isPick = picked?.title === s.title && picked?.artist === s.artist;
                    return (
                      <li key={`${s.title}-${s.artist}-${i}`}>
                        <button
                          type="button"
                          onClick={() => setPicked(s)}
                          aria-pressed={isPick}
                          className={
                            'gap-s-3 border-border bg-card hover:bg-card-hover px-s-4 py-s-3 flex w-full items-center rounded-md border text-left transition-colors ' +
                            (isPick ? 'border-l-accent bg-accent-dim border-accent border-l-4' : '')
                          }
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-body truncate font-semibold">{s.title}</div>
                            <div className="text-foreground-muted text-caption truncate">
                              {s.artist} · {s.album}
                            </div>
                          </div>
                          <span className="text-foreground-muted text-micro shrink-0">
                            {Math.floor(s.duration / 60)}:{String(s.duration % 60).padStart(2, '0')}
                          </span>
                          {isPick && (
                            <span
                              className="bg-accent text-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                              aria-label="선택됨"
                            >
                              <Check className="h-4 w-4" aria-hidden="true" />
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : (
            <div className="space-y-s-3">
              <Input
                label="곡 제목"
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
              <Input
                label="아티스트"
                required
                value={customArtist}
                onChange={(e) => setCustomArtist(e.target.value)}
              />
              <Input
                label="앨범"
                value={customAlbum}
                onChange={(e) => setCustomAlbum(e.target.value)}
              />
              <Input
                label="재생 시간 (초)"
                type="number"
                min={0}
                value={customDuration}
                onChange={(e) => setCustomDuration(Number(e.target.value) || 0)}
              />
            </div>
          )}
        </section>
      )}

      {/* Step 3 — 메타 */}
      {step === 2 && (
        <section data-slot="wizard-step-meta" className="space-y-s-4">
          <Input
            label="합주 제목 (선택)"
            placeholder="예: TuNA 정기공연 1주차 합주"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="장소 (선택)"
            placeholder="예: 홍대 스튜디오"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />
          {/* 시작 시각 / 소요 시간 — 강조 패널 (success 톤, 굵은 글씨) */}
          <div className="gap-s-3 grid grid-cols-1 sm:grid-cols-2">
            <div className="border-success/40 bg-success/10 px-s-4 py-s-3 space-y-s-2 rounded-md border-2">
              <label className="text-success text-caption font-bold">
                시작 시각 <span aria-hidden="true">*</span>
              </label>
              <DateTimePicker
                value={startAt}
                onChange={setStartAt}
                aria-label="시작 시각"
                required
                futureOnly
              />
            </div>
            <div className="border-success/40 bg-success/10 px-s-4 py-s-3 space-y-s-2 rounded-md border-2">
              <label className="text-success text-caption font-bold">
                소요 시간 (분) <span aria-hidden="true">*</span>
              </label>
              <input
                type="number"
                min={15}
                max={480}
                step={15}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value) || 0)}
                className="text-success text-title w-full border-0 bg-transparent font-bold outline-none"
              />
            </div>
          </div>
        </section>
      )}

      {/* Step 4 — 검토 및 확정 */}
      {step === 3 && (
        <section data-slot="wizard-step-review" className="space-y-s-4">
          <h2 className="text-subtitle font-semibold">아래 내용을 확인해주세요</h2>
          <WizardSummaryCard
            sections={[
              {
                label: '밴드',
                value: myBands.data?.find((b) => b.bandId === bandId)?.bandName ?? '—',
                onEdit: () => setStep(0),
              },
              {
                label: '곡',
                value: songPick
                  ? songPick.mode === 'picked'
                    ? `${songPick.picked.title} — ${songPick.picked.artist}`
                    : `${songPick.custom.title} — ${songPick.custom.artist} (직접 입력)`
                  : '—',
                onEdit: () => setStep(1),
              },
              {
                label: '시작 시각',
                value: startAt || '—',
                emphasized: true,
                onEdit: () => setStep(2),
              },
              {
                label: '소요 시간',
                value: `${durationMinutes}분`,
                emphasized: true,
                onEdit: () => setStep(2),
              },
              {
                label: '제목',
                value: title || '미지정',
                onEdit: () => setStep(2),
              },
              {
                label: '장소',
                value: venue || '미지정',
                onEdit: () => setStep(2),
              },
            ]}
          />
          <p className="text-foreground-muted text-caption">
            확정 버튼을 눌러야 실제로 합주가 생성됩니다.
          </p>
        </section>
      )}

      <footer className="mt-s-6 gap-s-3 flex items-center justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0}>
          이전
        </Button>
        {step < 3 ? (
          <Button onClick={next} disabled={!canNext}>
            다음
          </Button>
        ) : (
          <Button onClick={submit} loading={mutation.isPending} disabled={!canSubmit}>
            합주 만들기
          </Button>
        )}
      </footer>

      <BandPickerModal
        open={bandPickerOpen}
        onOpenChange={setBandPickerOpen}
        title="밴드 검색"
        onConfirm={(bands) => {
          const picked = bands[0];
          if (!picked) return;
          // 이미 표시 중이면 무시. 아니면 extraBands 에 추가.
          const isInMine = myBands.data?.slice(0, 6).some((b) => b.bandId === picked.bandId);
          const isInExtra = extraBands.some((b) => b.bandId === picked.bandId);
          if (!isInMine && !isInExtra) {
            setExtraBands((prev) => [...prev, picked]);
          }
          setBandId(picked.bandId);
        }}
      />
    </div>
  );
}
