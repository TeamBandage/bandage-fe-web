'use client';

import { CalendarDays, ImagePlus, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { StepIndicator } from '@/components/ui/step-indicator';
import { WizardSummaryCard } from '@/components/ui/wizard-summary-card';
import {
  createPerformancePoster,
  issuePerformancePosterPresignedUrl,
} from '@/domain/performance-poster/api';
import { SetlistSelectorSheet } from '@/domain/performance/components/SetlistSelectorSheet.client';
import { createPerformance } from '@/domain/performance/api/createPerformance';
import type { SetlistResponse } from '@/domain/setlist/types/res';
import { ROUTES } from '@/global/config/routes';
import { useRegisterDirtyForm } from '@/global/navigation/dirty-form-context';
import {
  ALLOWED_IMAGE_ACCEPT,
  MAX_IMAGE_SIZE_BYTES,
  extFromMime,
  isAllowedImageMime,
} from '@/global/upload/constants';
import { uploadToPresignedUrl } from '@/global/upload/uploadToPresignedUrl';
import { useToast } from '@/hooks/useToast';

const STEPS = ['기본 정보', '포스터 등록', '셋리스트 추가', '검토'] as const;
const inputCls =
  'rounded-[5px] hover:border-white/30 focus-visible:border-white/80 focus-visible:ring-0';

export function PerformanceCreateWizard() {
  const router = useRouter();
  const toast = useToast();
  const posterInputRef = useRef<HTMLInputElement>(null);
  const posterInputId = useId();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [isPending, setIsPending] = useState(false);

  // Step 0
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [startAt, setStartAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(120);

  // Step 1
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedSetlists, setSelectedSetlists] = useState<SetlistResponse[]>([]);

  // Step 2
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [posterDescription, setPosterDescription] = useState('');

  const dirty =
    step > 0 || title.length > 0 || venue.length > 0 || !!startAt || selectedSetlists.length > 0;
  useRegisterDirtyForm('performance-create-wizard', dirty);

  const canNext =
    step === 0
      ? !!title && !!startAt && durationMinutes >= 30
      : step === 1
        ? true
        : step === 2
          ? true
          : false;

  function next() {
    if (step === 0) {
      if (!title) return toast.error('공연 제목을 입력해 주세요.');
      if (!startAt) return toast.error('시작 시각을 선택해 주세요.');
      if (durationMinutes < 30) return toast.error('소요 시간은 최소 30분 이상이어야 합니다.');
    }
    if (step < 3) setStep((step + 1) as 0 | 1 | 2 | 3);
  }

  function back() {
    if (step > 0) setStep((step - 1) as 0 | 1 | 2 | 3);
  }

  function handlePosterFile(file: File) {
    if (!isAllowedImageMime(file.type)) {
      toast.error('JPEG / PNG / WEBP 형식만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }
    if (posterPreview) URL.revokeObjectURL(posterPreview);
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  }

  function removePoster() {
    if (posterPreview) URL.revokeObjectURL(posterPreview);
    setPosterFile(null);
    setPosterPreview(null);
    setPosterDescription('');
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

      if (posterFile) {
        const ext = extFromMime(posterFile.type);
        if (!ext) throw new Error('지원하지 않는 이미지 형식입니다.');
        const presign = await issuePerformancePosterPresignedUrl({
          contentType: posterFile.type,
          contentLength: posterFile.size,
          ext,
        });
        await uploadToPresignedUrl(presign.uploadUrl, posterFile);
        await createPerformancePoster({
          performanceId: perf.performanceId,
          objectKey: presign.objectKey,
          description: posterDescription || undefined,
        });
      }

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

      {/* Step 1 — 포스터 등록 */}
      {step === 1 && (
        <section className="space-y-s-4">
          <h2 className="text-foreground-sub text-base font-semibold">
            공연 포스터를 등록하세요{' '}
            <span className="text-foreground-muted text-caption font-normal">(선택)</span>
          </h2>

          {posterPreview ? (
            <div className="relative mx-auto w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={posterPreview}
                alt="공연 포스터 미리보기"
                className="max-h-72 rounded-[5px] object-contain"
              />
              <button
                type="button"
                aria-label="포스터 제거"
                onClick={removePoster}
                className="bg-surface border-border absolute -top-2 -right-2 rounded-full border p-0.5 text-white/70 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor={posterInputId}
              className="border-border hover:border-border-hover flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-[5px] border border-dashed transition-colors"
            >
              <ImagePlus className="text-foreground-muted h-8 w-8" />
              <span className="text-foreground-muted text-caption">
                클릭하여 포스터 이미지 선택
              </span>
              <span className="text-foreground-muted text-xs">JPEG · PNG · WEBP · 최대 5MB</span>
            </label>
          )}

          <input
            ref={posterInputRef}
            id={posterInputId}
            type="file"
            accept={ALLOWED_IMAGE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) handlePosterFile(file);
            }}
          />

          {posterFile && (
            <>
              <button
                type="button"
                onClick={() => posterInputRef.current?.click()}
                className="text-foreground-sub text-caption hover:text-foreground underline"
              >
                다른 이미지로 변경
              </button>
              <div className="space-y-1">
                <label
                  htmlFor="poster-description"
                  className="text-foreground-sub text-caption font-semibold"
                >
                  포스터 설명 <span className="text-foreground-muted font-normal">(선택)</span>
                </label>
                <textarea
                  id="poster-description"
                  rows={2}
                  placeholder="예: 2025 정기공연 포스터"
                  value={posterDescription}
                  onChange={(e) => setPosterDescription(e.target.value)}
                  className="bg-surface border-border w-full resize-none rounded-[5px] border px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/50"
                />
              </div>
            </>
          )}

          {!posterFile && (
            <p className="text-foreground-muted text-caption">
              포스터를 등록하지 않으면 공연 포스터 없이 생성됩니다.
            </p>
          )}
        </section>
      )}

      {/* Step 2 — 셋리스트 */}
      {step === 2 && (
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

      {/* Step 3 — 검토 */}
      {step === 3 && (
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
                label: '포스터',
                value: posterFile ? (
                  <span className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={posterPreview!}
                      alt="포스터 미리보기"
                      className="h-10 w-auto rounded object-contain"
                    />
                    <span className="text-foreground-sub text-caption">{posterFile.name}</span>
                  </span>
                ) : (
                  '없음'
                ),
                onEdit: () => setStep(1),
              },
              {
                label: '셋리스트',
                value:
                  selectedSetlists.length === 0
                    ? '없음'
                    : selectedSetlists.map((s) => s.title).join(', '),
                onEdit: () => setStep(2),
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
