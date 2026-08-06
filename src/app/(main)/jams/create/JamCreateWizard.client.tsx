'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import {
  SessionComposer,
  defaultSessionRows,
  expandSessionRows,
  type SessionRowState,
} from '@/components/ui/session-composer';
import { StepIndicator } from '@/components/ui/step-indicator';
import { WizardSummaryCard } from '@/components/ui/wizard-summary-card';
import { useCreateJam } from '@/domain/jam/hooks/useCreateJam';
import { ROUTES } from '@/global/config/routes';
import { useRegisterDirtyForm } from '@/global/navigation/dirty-form-context';
import { useToast } from '@/hooks/useToast';
import { formatKst, parseKst } from '@/lib/date';

const STEPS = ['곡 정보', '일정 설정', '세션 설정', '검토'] as const;
const inputCls =
  'rounded-[5px] hover:border-white/30 focus-visible:border-white/80 focus-visible:ring-0';
type Step = 0 | 1 | 2 | 3;

function clampNumeric(raw: string, max: number): string {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 2);
  if (digits === '') return '';
  const n = Math.min(parseInt(digits, 10), max);
  return String(n);
}

/** 세션별 인원수 요약(예: VOCAL×2, GUITAR×1). */
function summarizeSessionRows(rows: SessionRowState[]): string {
  return rows
    .filter((r) => r.instances.length > 0)
    .map((r) => `${r.label}×${r.instances.length}`)
    .join(', ');
}

export function JamCreateWizard() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<Step>(0);

  // Step 0 — 곡 정보
  const [trackTitle, setTrackTitle] = useState('');
  const [trackArtist, setTrackArtist] = useState('');
  const [trackAlbum, setTrackAlbum] = useState('');
  const [trackDurationMm, setTrackDurationMm] = useState('');
  const [trackDurationSs, setTrackDurationSs] = useState('');
  const trackDurationSsRef = useRef<HTMLInputElement | null>(null);
  const trackDuration = (() => {
    const mm = trackDurationMm === '' ? 0 : parseInt(trackDurationMm, 10);
    const ss = trackDurationSs === '' ? 0 : parseInt(trackDurationSs, 10);
    const total = mm * 60 + ss;
    return total === 0 ? undefined : total;
  })();

  // Step 1 — 일정 설정
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [venue, setVenue] = useState('');
  const [startAt, setStartAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  // 합주 제목 미입력 시 1단계 곡 제목으로 자동 채움. 사용자가 직접 수정하면 더 이상 덮어쓰지 않음.
  useEffect(() => {
    if (!titleTouched) setTitle(trackTitle);
  }, [trackTitle, titleTouched]);

  // Step 2 — 세션 설정
  const [sessionRows, setSessionRows] = useState<SessionRowState[]>(defaultSessionRows());

  const dirty = trackTitle.length > 0 || trackArtist.length > 0 || !!startAt;
  useRegisterDirtyForm('jam-create-wizard', dirty);

  const mutation = useCreateJam({
    onSuccess: () => {
      toast.resourceCreated('합주', { name: title || '새 합주' });
      router.replace(ROUTES.JAMS);
    },
    onError: (err) => toast.error(err.message || '합주 생성에 실패했습니다.'),
  });

  const trackReady = !!trackTitle.trim() && !!trackArtist.trim();
  const scheduleReady = !!startAt && durationMinutes >= 5;

  const canNext =
    step === 0
      ? trackReady
      : step === 1
        ? scheduleReady
        : step === 2
          ? true // 세션은 선택사항
          : false;

  const canSubmit = step === 3 && trackReady && scheduleReady;

  function next() {
    if (step === 0 && !trackReady) return toast.error('곡 제목과 아티스트를 입력해 주세요.');
    if (step === 1 && !startAt) return toast.error('시작 시각을 설정해 주세요.');
    if (step < 3) setStep((step + 1) as Step);
  }

  function back() {
    if (step > 0) setStep((step - 1) as Step);
  }

  function submit() {
    if (!trackReady || !scheduleReady) return;
    mutation.mutate({
      title: title || undefined,
      track: {
        title: trackTitle.trim(),
        artist: trackArtist.trim(),
        album: trackAlbum.trim() || undefined,
        duration: trackDuration,
      },
      sessions: expandSessionRows(sessionRows),
      venue: venue || undefined,
      startAt,
      durationMinutes,
    });
  }

  return (
    <div className="p-s-4 mx-auto w-full max-w-3xl lg:py-10" data-slot="jam-create-wizard">
      <header className="mb-s-6">
        <h1 className="text-title font-bold">합주 생성</h1>
      </header>

      <StepIndicator steps={STEPS} current={step} colorScheme="white" />

      {/* Step 0 — 곡 정보 */}
      {step === 0 && (
        <section className="space-y-s-3">
          <h2 className="text-foreground-sub text-base font-semibold">
            합주할 곡 정보를 입력하세요
          </h2>
          <div className="gap-s-3 grid grid-cols-1 sm:grid-cols-2">
            <Input
              label="곡 제목"
              required
              value={trackTitle}
              onChange={(e) => setTrackTitle(e.target.value)}
              className={inputCls}
            />
            <Input
              label="아티스트"
              required
              value={trackArtist}
              onChange={(e) => setTrackArtist(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="gap-s-3 flex">
            <div className="flex-1">
              <Input
                label="앨범 (선택)"
                value={trackAlbum}
                onChange={(e) => setTrackAlbum(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-foreground block text-sm font-medium">재생 시간 (선택)</label>
              <div className="bg-surface border-border hover:border-border-hi gap-s-1 px-s-3 mt-2.5 flex h-10 items-center rounded-[5px] border transition-colors focus-within:border-white/70">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={trackDurationMm}
                  onChange={(e) => {
                    const next = clampNumeric(e.target.value, 99);
                    setTrackDurationMm(next);
                    if (next.length === 2) trackDurationSsRef.current?.focus();
                  }}
                  onBlur={() => {
                    if (trackDurationMm.length === 1) {
                      setTrackDurationMm(trackDurationMm.padStart(2, '0'));
                    }
                  }}
                  placeholder="00"
                  aria-label="재생 시간 분"
                  className="placeholder:text-foreground-muted w-7 bg-transparent text-center font-mono text-sm tabular-nums outline-none"
                />
                <span className="text-foreground-muted font-mono text-sm">:</span>
                <input
                  ref={trackDurationSsRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={trackDurationSs}
                  onChange={(e) => setTrackDurationSs(clampNumeric(e.target.value, 59))}
                  onBlur={() => {
                    if (trackDurationSs.length === 1) {
                      setTrackDurationSs(trackDurationSs.padStart(2, '0'));
                    }
                  }}
                  placeholder="00"
                  aria-label="재생 시간 초"
                  className="placeholder:text-foreground-muted w-7 bg-transparent text-center font-mono text-sm tabular-nums outline-none"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Step 1 — 일정 설정 */}
      {step === 1 && (
        <section className="space-y-s-4">
          <h2 className="text-foreground-sub text-base font-semibold">일정을 설정하세요</h2>
          <Input
            label="합주 제목 (선택)"
            placeholder="예: TuNA 정기공연 1주차 합주"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleTouched(true);
            }}
            className={inputCls}
          />
          <Input
            label="장소 (선택)"
            placeholder="예: 홍대 스튜디오"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className={inputCls}
          />
          <div className="gap-s-3 grid grid-cols-1 sm:grid-cols-2">
            <div className="bg-surface px-s-4 pt-s-2 pb-s-3 rounded-[5px] border border-white/20">
              <label className="text-foreground-sub text-caption font-bold">
                시작 시각{' '}
                <span aria-hidden="true" className="text-danger">
                  *
                </span>
              </label>
              <div className="mt-s-2">
                <DateTimePicker
                  value={startAt}
                  onChange={setStartAt}
                  aria-label="시작 시각"
                  required
                  futureOnly
                />
              </div>
            </div>
            <div className="bg-surface px-s-4 pt-s-2 pb-s-3 rounded-[5px] border border-white/20">
              <label className="text-foreground-sub text-caption font-bold">
                소요 시간 (분){' '}
                <span aria-hidden="true" className="text-danger">
                  *
                </span>
              </label>
              <div className="mt-s-2">
                <input
                  type="number"
                  min={5}
                  max={480}
                  step={5}
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value) || 0)}
                  className="text-foreground text-title w-full border-0 bg-transparent font-bold outline-none"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Step 2 — 세션 설정 */}
      {step === 2 && (
        <section className="space-y-s-4">
          <h2 className="text-foreground-sub text-base font-semibold">
            세션을 설정하세요{' '}
            <span className="text-foreground-muted text-caption font-normal">(선택)</span>
          </h2>
          <p className="text-foreground-muted text-micro -mt-s-2">
            세션별 인원수를 +/- 로 조정하고, 필요하면 영문 이름으로 커스텀 세션을 추가하세요.
          </p>

          <SessionComposer rows={sessionRows} onChange={setSessionRows} requireAtLeastOne={false} />
        </section>
      )}

      {/* Step 3 — 검토 */}
      {step === 3 && (
        <section className="space-y-s-4">
          <h2 className="text-foreground-sub text-base font-semibold">아래 내용을 확인해주세요</h2>
          <WizardSummaryCard
            sections={[
              {
                label: '곡',
                value: trackTitle && trackArtist ? `${trackTitle} — ${trackArtist}` : '—',
                onEdit: () => setStep(0),
              },
              {
                label: '시작 시각',
                value: startAt ? formatKst(parseKst(startAt), 'yyyy.MM.dd (EEE) HH:mm') : '—',
                emphasized: true,
                onEdit: () => setStep(1),
              },
              {
                label: '소요 시간',
                value: `${durationMinutes}분`,
                emphasized: true,
                onEdit: () => setStep(1),
              },
              { label: '제목', value: title || '미지정', onEdit: () => setStep(1) },
              { label: '장소', value: venue || '미지정', onEdit: () => setStep(1) },
              {
                label: '세션',
                value: summarizeSessionRows(sessionRows) || '없음',
                onEdit: () => setStep(2),
              },
            ]}
          />
          <p className="text-foreground-muted text-caption">
            확정 버튼을 눌러야 실제로 합주가 생성됩니다.
          </p>
        </section>
      )}

      <footer className="gap-s-3 mt-6.75 flex items-center justify-between">
        {step > 0 ? (
          <Button size="sm" variant="ghost" onClick={back} className="rounded-[5px]">
            이전
          </Button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <Button
            size="sm"
            onClick={next}
            disabled={!canNext}
            className="rounded-[5px] bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30"
          >
            다음
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={submit}
            loading={mutation.isPending}
            disabled={!canSubmit}
            className="rounded-[5px] bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30"
          >
            합주 만들기
          </Button>
        )}
      </footer>
    </div>
  );
}
