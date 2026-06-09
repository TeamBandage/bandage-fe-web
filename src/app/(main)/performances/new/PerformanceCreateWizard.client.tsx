'use client';

import { CalendarDays, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { StepIndicator } from '@/components/ui/step-indicator';
import { WizardSummaryCard } from '@/components/ui/wizard-summary-card';
import { SetlistPickerModal } from '@/domain/setlist-meeting/components/SetlistPickerModal.client';
import type { Meeting } from '@/domain/setlist-meeting/types';
import { useCreatePerformance } from '@/domain/performance/hooks/useCreatePerformance';
import { ROUTES } from '@/global/config/routes';
import { useRegisterDirtyForm } from '@/global/navigation/dirty-form-context';
import { useToast } from '@/hooks/useToast';

const STEPS = ['기본 정보', '셋리스트', '검토'] as const;

export function PerformanceCreateWizard() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<0 | 1 | 2>(0);

  // Step 1
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [startAt, setStartAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(120);

  // Step 2
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedMeetings, setSelectedMeetings] = useState<Meeting[]>([]);

  const dirty =
    step > 0 || title.length > 0 || venue.length > 0 || !!startAt || selectedMeetings.length > 0;
  useRegisterDirtyForm('performance-create-wizard', dirty);

  const mutation = useCreatePerformance({
    onSuccess: (data) => {
      toast.resourceCreated('공연', { name: title });
      router.replace(ROUTES.PERFORMANCE_DETAIL(data.performanceId));
    },
    onError: (err) => toast.error(err.message || '공연 생성에 실패했습니다.'),
  });

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

  function submit() {
    if (!title || !startAt) return;
    mutation.mutate({
      title,
      setlistMeetingIds: selectedMeetings.map((m) => m.id),
      startAt,
      durationMinutes,
      venue: venue || undefined,
    });
  }

  return (
    <div
      className="px-s-5 py-s-6 lg:px-s-8 lg:py-s-8 mx-auto max-w-3xl"
      data-slot="performance-create-wizard"
    >
      <header className="mb-s-6 flex items-baseline justify-between gap-3">
        <h1 className="text-title font-bold">공연 생성</h1>
      </header>

      <StepIndicator steps={STEPS} current={step} />

      {/* Step 1 */}
      {step === 0 && (
        <section data-slot="wizard-step-meta" className="space-y-s-4">
          <Input
            label="공연 제목"
            required
            placeholder="예: TuNA 정기공연"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="장소 (선택)"
            placeholder="예: Club FF"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />
          <div className="space-y-s-2">
            <label className="text-foreground text-caption font-semibold">
              시작 시각 <span className="text-danger">*</span>
            </label>
            <DateTimePicker
              value={startAt}
              onChange={setStartAt}
              aria-label="공연 시작 시각"
              required
              futureOnly
            />
          </div>
          <Input
            label="소요 시간 (분)"
            type="number"
            min={30}
            max={600}
            step={30}
            required
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value) || 0)}
          />
        </section>
      )}

      {/* Step 2 */}
      {step === 1 && (
        <section data-slot="wizard-step-setlists" className="space-y-s-4">
          <h2 className="text-subtitle font-semibold">셋리스트를 추가하세요 (선택)</h2>
          {selectedMeetings.length === 0 ? (
            <p className="text-foreground-muted text-caption">
              추가하지 않으면 셋리스트 없이 공연이 생성됩니다.
            </p>
          ) : (
            <ul className="gap-s-2 flex flex-wrap">
              {selectedMeetings.map((m) => (
                <li
                  key={m.id}
                  className="bg-card border-border gap-s-2 px-s-3 py-s-1 inline-flex items-center rounded-full border"
                >
                  <span className="text-caption">{m.title}</span>
                  <button
                    type="button"
                    aria-label={`${m.title} 제거`}
                    className="text-foreground-muted hover:text-foreground"
                    onClick={() => setSelectedMeetings((prev) => prev.filter((x) => x.id !== m.id))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPickerOpen(true)}
            className="w-full"
          >
            셋리스트 검색해서 추가
          </Button>
        </section>
      )}

      {/* Step 3 — 검토 */}
      {step === 2 && (
        <section data-slot="wizard-step-review" className="space-y-s-4">
          <h2 className="text-subtitle font-semibold">아래 내용을 확인해주세요</h2>
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
                  selectedMeetings.length === 0
                    ? '없음'
                    : selectedMeetings.map((m) => m.title).join(', '),
                onEdit: () => setStep(1),
              },
            ]}
          />
          <p className="text-foreground-muted text-caption">
            확정 버튼을 눌러야 실제로 공연이 생성됩니다.
          </p>
        </section>
      )}

      <footer className="mt-s-6 gap-s-3 flex items-center justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0}>
          이전
        </Button>
        {step < 2 ? (
          <Button onClick={next}>다음</Button>
        ) : (
          <Button onClick={submit} loading={mutation.isPending}>
            공연 만들기
          </Button>
        )}
      </footer>

      <SetlistPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        initialSelection={selectedMeetings}
        onConfirm={(meetings) => setSelectedMeetings(meetings)}
      />
    </div>
  );
}
