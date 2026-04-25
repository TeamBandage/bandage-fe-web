'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { BandPickerModal } from '@/domain/band/components/BandPickerModal.client';
import type { BandInfoResponse } from '@/domain/band/types';
import { useCreatePerformance } from '@/domain/performance/hooks/useCreatePerformance';
import { createPerformanceSchema, type CreatePerformanceSchema } from '@/domain/performance/types';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

export function PerformanceCreateForm() {
  const router = useRouter();
  const toast = useToast();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedBands, setSelectedBands] = useState<BandInfoResponse[]>([]);

  const form = useForm<CreatePerformanceSchema>({
    resolver: zodResolver(createPerformanceSchema),
    defaultValues: {
      title: '',
      bandIds: [],
      startAt: '',
      durationMinutes: 120,
      venue: '',
    },
  });

  const mutation = useCreatePerformance({
    onSuccess: (data) => {
      toast.success('공연이 생성되었습니다.');
      router.replace(ROUTES.PERFORMANCE_DETAIL(data.performanceId));
    },
    onError: (err) => toast.error(err.message || '공연 생성에 실패했습니다.'),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        mutation.mutate({
          title: values.title,
          bandIds: selectedBands.length > 0 ? selectedBands.map((b) => b.bandId) : undefined,
          startAt: values.startAt,
          durationMinutes: values.durationMinutes,
          venue: values.venue,
        }),
      )}
      noValidate
    >
      <Input
        label="공연 제목"
        placeholder="예: TuNA 정기공연"
        required
        error={form.formState.errors.title?.message}
        {...form.register('title')}
      />
      <div className="space-y-s-2">
        <label className="text-foreground text-caption font-semibold">
          시작 시각 <span className="text-danger">*</span>
        </label>
        <Controller
          name="startAt"
          control={form.control}
          render={({ field }) => (
            <DateTimePicker
              value={field.value ?? ''}
              onChange={field.onChange}
              aria-label="공연 시작 시각"
              required
            />
          )}
        />
        <p className="text-foreground-muted text-micro">
          Asia/Seoul 기준 yyyy-MM-dd HH:mm 으로 저장됩니다.
        </p>
        {form.formState.errors.startAt?.message && (
          <p className="text-danger text-micro">{form.formState.errors.startAt.message}</p>
        )}
      </div>
      <Input
        label="소요 시간 (분)"
        type="number"
        min={30}
        max={600}
        step={30}
        required
        error={form.formState.errors.durationMinutes?.message}
        {...form.register('durationMinutes', { valueAsNumber: true })}
      />
      <Input
        label="장소 (선택)"
        placeholder="예: Club FF"
        error={form.formState.errors.venue?.message}
        {...form.register('venue')}
      />

      <div className="space-y-s-2">
        <label className="text-foreground text-caption font-semibold">참여 밴드 (선택)</label>
        {selectedBands.length === 0 ? (
          <p className="text-foreground-muted text-micro">
            참여 밴드를 추가하지 않으면 빈 배열로 전송됩니다.
          </p>
        ) : (
          <ul className="gap-s-2 flex flex-wrap">
            {selectedBands.map((b) => (
              <li
                key={b.bandId}
                className="bg-card border-border gap-s-2 px-s-3 py-s-1 inline-flex items-center rounded-full border"
              >
                <span className="text-caption">{b.bandName}</span>
                <button
                  type="button"
                  aria-label={`${b.bandName} 제거`}
                  className="text-foreground-muted hover:text-foreground"
                  onClick={() =>
                    setSelectedBands((prev) => prev.filter((x) => x.bandId !== b.bandId))
                  }
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
          size="sm"
          onClick={() => setPickerOpen(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4" />
          밴드 검색해서 추가
        </Button>
      </div>

      <Button type="submit" className="w-full" loading={mutation.isPending}>
        공연 만들기
      </Button>

      <BandPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        multiple
        initialSelection={selectedBands}
        onConfirm={(bands) => setSelectedBands(bands)}
        title="참여 밴드 추가"
      />
    </form>
  );
}
