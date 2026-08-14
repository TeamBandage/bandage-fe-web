'use client';

import { useState } from 'react';

import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ScheduleManagerModal } from '@/domain/member/components/ScheduleManagerModal.client';
import { WeeklyTimetable } from '@/domain/member/components/WeeklyTimetable.client';
import { useMe } from '@/domain/member/hooks/useMe';
import { useMyAvailability } from '@/domain/member/hooks/useMyAvailability';
import { useUpdateMyAvailability } from '@/domain/member/hooks/useUpdateMyAvailability';
import type { AvailabilityExceptionRequest, WeeklyRuleRequest } from '@/domain/member/types';
import { useToast } from '@/hooks/useToast';

export function ScheduleContent() {
  const toast = useToast();
  const { isLoading, isError, refetch } = useMe();
  const { data: availability } = useMyAvailability();

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const updateAvailabilityMutation = useUpdateMyAvailability({
    onSuccess: () => {
      toast.success('스케줄이 저장되었습니다.');
      setScheduleModalOpen(false);
    },
    onError: (err) => toast.error(err.message || '스케줄 저장에 실패했습니다.'),
  });

  const handleSaveSchedule = (
    weeklyRules: WeeklyRuleRequest[],
    note: string,
    exceptions: AvailabilityExceptionRequest[],
    effectiveFrom: string,
    effectiveTo: string,
  ) => {
    updateAvailabilityMutation.mutate({
      weeklyRules,
      exceptions,
      note,
      effectiveFrom,
      effectiveTo,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" rounded="lg" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-s-6">
      <section>
        <h2 className="text-foreground text-title mb-s-3 font-bold">나의 스케줄 정보</h2>
        <WeeklyTimetable
          availability={availability}
          onManageSchedule={() => setScheduleModalOpen(true)}
        />
      </section>

      <ScheduleManagerModal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        availability={availability}
        onSave={handleSaveSchedule}
        isSaving={updateAvailabilityMutation.isPending}
      />
    </div>
  );
}
