'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { StepIndicator } from '@/components/ui/step-indicator';
import { WizardSummaryCard } from '@/components/ui/wizard-summary-card';
import { useCreateJam } from '@/domain/jam/hooks/useCreateJam';
import type { SessionDefDto } from '@/domain/jam/types';
import { ROUTES } from '@/global/config/routes';
import { useRegisterDirtyForm } from '@/global/navigation/dirty-form-context';
import { useToast } from '@/hooks/useToast';

const STEPS = ['곡 정보', '일정 설정', '세션 설정', '검토'] as const;
const inputCls =
  'rounded-[5px] hover:border-white/30 focus-visible:border-white/80 focus-visible:ring-0';
type Step = 0 | 1 | 2 | 3;

export function JamCreateWizard() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<Step>(0);

  // Step 0 — 곡 정보
  const [trackTitle, setTrackTitle] = useState('');
  const [trackArtist, setTrackArtist] = useState('');
  const [trackAlbum, setTrackAlbum] = useState('');
  const [trackDuration, setTrackDuration] = useState<number>(0);

  // Step 1 — 일정 설정
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [startAt, setStartAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  // Step 2 — 세션 설정
  const [sessions, setSessions] = useState<SessionDefDto[]>([]);
  const [sessionLabel, setSessionLabel] = useState('');
  const [sessionShort, setSessionShort] = useState('');
  const [sessionNeed, setSessionNeed] = useState(1);

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

  function addSession() {
    if (!sessionLabel.trim()) return toast.error('세션 이름을 입력해 주세요.');
    if (!sessionShort.trim()) return toast.error('약어를 입력해 주세요.');
    const short = sessionShort.toUpperCase().slice(0, 3);
    if (sessions.some((s) => s.short === short))
      return toast.error('같은 약어의 세션이 이미 있습니다.');
    setSessions((prev) => [
      ...prev,
      {
        sessionId: `${short}-${Date.now()}`,
        label: sessionLabel.trim(),
        short,
        need: sessionNeed,
        custom: true,
      },
    ]);
    setSessionLabel('');
    setSessionShort('');
    setSessionNeed(1);
  }

  function removeSession(sessionId: string) {
    setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
  }

  function submit() {
    if (!trackReady || !scheduleReady) return;
    mutation.mutate({
      title: title || undefined,
      track: {
        title: trackTitle.trim(),
        artist: trackArtist.trim(),
        album: trackAlbum.trim() || undefined,
        duration: trackDuration || undefined,
      },
      sessions,
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
          <Input
            label="앨범 (선택)"
            value={trackAlbum}
            onChange={(e) => setTrackAlbum(e.target.value)}
            className={inputCls}
          />
          <Input
            label="재생 시간 (초, 선택)"
            type="number"
            min={0}
            value={trackDuration}
            onChange={(e) => setTrackDuration(Number(e.target.value) || 0)}
            className={inputCls}
          />
        </section>
      )}

      {/* Step 1 — 일정 설정 */}
      {step === 1 && (
        <section className="space-y-s-4">
          <Input
            label="합주 제목 (선택)"
            placeholder="예: TuNA 정기공연 1주차 합주"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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

          {sessions.length > 0 && (
            <ul className="border-border divide-border divide-y rounded-md border">
              {sessions.map((s) => (
                <li
                  key={s.sessionId}
                  className="px-s-4 py-s-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-caption w-10 rounded bg-white/10 px-1 py-0.5 text-center font-bold text-white">
                      {s.short}
                    </span>
                    <span className="text-body font-medium">{s.label}</span>
                    <span className="text-foreground-muted text-caption">{s.need}명</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSession(s.sessionId)}
                    aria-label={`${s.label} 세션 삭제`}
                    className="text-foreground-muted hover:text-danger transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-border bg-card p-s-4 rounded-md border">
            <div className="gap-s-3 grid grid-cols-[1fr_auto_auto_auto] items-end">
              <Input
                label="세션 이름"
                placeholder="예: Guitar 2"
                value={sessionLabel}
                onChange={(e) => setSessionLabel(e.target.value)}
                className={inputCls}
              />
              <Input
                label="약어"
                placeholder="예: G2"
                value={sessionShort}
                onChange={(e) => setSessionShort(e.target.value)}
                className={`${inputCls} w-24`}
                maxLength={3}
              />
              <Input
                label="정원"
                type="number"
                min={1}
                max={20}
                value={sessionNeed}
                onChange={(e) => setSessionNeed(Number(e.target.value) || 1)}
                className={`${inputCls} w-20`}
              />
              <Button
                type="button"
                size="sm"
                onClick={addSession}
                className="self-end rounded-[5px] bg-white/70 text-neutral-900 transition-transform hover:bg-white/85 active:scale-95 active:bg-white"
              >
                추가
              </Button>
            </div>
          </div>
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
                value: startAt || '—',
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
                value:
                  sessions.length > 0
                    ? sessions.map((s) => `${s.label}(${s.short})×${s.need}`).join(', ')
                    : '없음',
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
