'use client';

import { Check, X } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDecideApplication } from '@/domain/band/hooks/useDecideApplication';
import { useToast } from '@/hooks/useToast';

import type { BandApplicationInfoResponse } from '../types';

type Props = {
  bandId: string;
  application: BandApplicationInfoResponse;
};

export function BandApplicationRow({ bandId, application }: Props) {
  const toast = useToast();
  const mutation = useDecideApplication(bandId, {
    onSuccess: (vars) =>
      toast.success(vars.decision === 'APPROVED' ? '가입을 승인했습니다.' : '가입을 거절했습니다.'),
    onError: (err) => toast.error(err.message || '처리에 실패했습니다.'),
  });

  const isPending = application.status === 'PENDING';

  return (
    <div className="border-border flex items-center justify-between gap-3 border-b py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar size="md" fallback={`M${application.memberId}`} />
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-medium">
            Member #{application.memberId}
          </p>
          <p className="text-foreground-muted truncate text-xs">{application.bandApplicationId}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isPending ? (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                mutation.mutate({
                  applicationId: application.bandApplicationId,
                  decision: 'APPROVED',
                })
              }
              loading={mutation.isPending}
            >
              <Check className="h-4 w-4" />
              승인
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-danger hover:opacity-80"
              onClick={() =>
                mutation.mutate({
                  applicationId: application.bandApplicationId,
                  decision: 'REJECTED',
                })
              }
              loading={mutation.isPending}
            >
              <X className="h-4 w-4" />
              거절
            </Button>
          </>
        ) : (
          <Badge>{application.status}</Badge>
        )}
      </div>
    </div>
  );
}
