'use client';

import { CalendarDays, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { StepIndicator } from '@/components/ui/step-indicator';
import { WizardSummaryCard } from '@/components/ui/wizard-summary-card';
import { SetlistSelectorSheet } from '@/domain/performance/components/SetlistSelectorSheet.client';
import { createPerformance } from '@/domain/performance/api/createPerformance';
import type { SetlistResponse } from '@/domain/setlist/types/res';
import { ROUTES } from '@/global/config/routes';
import { useRegisterDirtyForm } from '@/global/navigation/dirty-form-context';
import { useToast } from '@/hooks/useToast';

const STEPS = ['기본 정보', '셋리스트 추가', '검토'] as const;
const inputCls =
  'rounded-[5px] hover:border-white/30 focus-visible:border-white/80 focus-visible:ring-0';

export function PerformanceCreateWizard() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [isPending, setIsPending] = useState(false);

  // Step 0
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [startAt, setStartAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(120);

  // Step 1
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedSetlists, setSelectedSetlists] = useState<SetlistResponse[]>([]);

  const dirty =
    step > 0 || title.length > 0 || venue.length > 0 || !!startAt || selectedSetlists.length > 0;
  useRegisterDirtyForm('performance-create-wizard', dirty);

  const canNext =
    step === 0 ? !!title && !!startAt && durationMinutes >= 30 : step === 1 ? true : false;

  function next() {
    if (step === 0) {
      if (!title) return toast.error('공연 제목을 입력해 주세요.');
      if (!startAt) return toast.error('시작 시각을 선택해 주세요.');
      if (durationMinutes < 30) return toast.error('소요 시간은 최소 30분 이상이어야 합니다.');
    }
    if (step < 2) setStep((step + 1) as 0 | 1 | 2);
  }

  function back() {
    if (step > 0) setStep((step - 1) as 0 | 1 | 2);
  }

  async function submit() {
    if (!title || !startAt || isPending) return;
    setIsPending(true);
    try {
      const perf = await createPerformance({
        title,
        setlistIds: selectedSetlists.map((s) => s.setlistId),
        startAt,
        durationMinutes,
        venue: venue || undefined,
      });
      toast.resourceCreated('공연', { name: title });
      router.replace(ROUTES.PERFORMANCE_DETAIL(perf.performanceId));
    } catch (err) {
      const message = err instanceof Error ? err.message : '공연 생성에 실패했습니다.';
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="p-s-4 mx-auto w-full max-w-3xl lg:py-10" data-slot="performance-create-wizard">
      <header className="mb-s-6">
        <h1 className="text-title font-bold">공연 생성</h1>
      </header>

      <StepIndicator steps={STEPS} current={step} colorScheme="white" />

      {/* Step 0 — 기본 정보 */}
      {step === 0 && (
        <section className="space-y-s-3">
          <h2 className="text-foreground-sub text-base font-semibold">공연 정보를 입력하세요</h2>
          <Input
            label="공연 제목"
            required
            placeholder="예: TuNA 정기공연"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
          <Input
            label="장소 (선택)"
            placeholder="예: Club FF"
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
                  aria-label="공연 시작 시각"
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
                  min={30}
                  max={600}
                  step={10}
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

      {/* Step 1 — 셋리스트 */}
      {step === 1 && (
        <section className="space-y-s-4">
          <h2 className="text-foreground-sub text-base font-semibold">
            셋리스트를 추가하세요{' '}
            <span className="text-foreground-muted text-caption font-normal">(선택)</span>
          </h2>

          {selectedSetlists.length > 0 && (
            <ul className="gap-s-2 flex flex-wrap">
              {selectedSetlists.map((s) => (
                <li
                  key={s.setlistId}
                  className="gap-s-2 px-s-3 py-s-1 inline-flex items-center rounded-full border border-white/20 bg-white/10"
                >
                  <span className="text-caption">{s.title}</span>
                  <button
                    type="button"
                    aria-label={`${s.title} 제거`}
                    className="text-foreground-muted hover:text-foreground"
                    onClick={() =>
                      setSelectedSetlists((prev) => prev.filter((x) => x.setlistId !== s.setlistId))
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedSetlists.length === 0 && (
            <p className="text-foreground-muted text-caption">
              추가하지 않으면 셋리스트 없이 공연이 생성됩니다.
            </p>
          )}

          <Button
            type="button"
            onClick={() => setSelectorOpen(true)}
            className="w-full rounded-[5px] bg-white/70 text-neutral-900 transition-transform hover:bg-white/85 active:scale-95 active:bg-white"
          >
            셋리스트 선택
          </Button>
        </section>
      )}

      {/* Step 2 — 검토 */}
      {step === 2 && (
        <section className="space-y-s-4">
          <h2 className="text-foreground-sub text-base font-semibold">아래 내용을 확인해주세요</h2>
          <WizardSummaryCard
            sections={[
              { label: '제목', value: title || '—', onEdit: () => setStep(0) },
              { label: '장소', value: venue || '미지정', onEdit: () => setStep(0) },
              {
                label: '시작 시각',
                value: (
                  <span>
                    <CalendarDays className="mr-1 inline h-4 w-4" aria-hidden="true" />
                    {startAt || '—'}
                  </span>
                ),
                emphasized: true,
                onEdit: () => setStep(0),
              },
              {
                label: '소요 시간',
                value: `${durationMinutes}분`,
                emphasized: true,
                onEdit: () => setStep(0),
              },
              {
                label: '셋리스트',
                value:
                  selectedSetlists.length === 0
                    ? '없음'
                    : selectedSetlists.map((s) => s.title).join(', '),
                onEdit: () => setStep(1),
              },
            ]}
          />
          <p className="text-foreground-muted text-caption">
            확정 버튼을 눌러야 실제로 공연이 생성됩니다.
          </p>
        </section>
      )}

      <footer className="gap-s-3 mt-6.75 flex items-center justify-between">
        {step > 0 ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={back}
            disabled={isPending}
            className="rounded-[5px]"
          >
            이전
          </Button>
        ) : (
          <span />
        )}
        {step < 2 ? (
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
            disabled={isPending}
            className="rounded-[5px] bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30"
          >
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" />
                생성 중…
              </span>
            ) : (
              '공연 만들기'
            )}
          </Button>
        )}
      </footer>

      <SetlistSelectorSheet
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        initialSelection={selectedSetlists}
        onConfirm={(setlists) => setSelectedSetlists(setlists)}
      />
    </div>
  );
}
