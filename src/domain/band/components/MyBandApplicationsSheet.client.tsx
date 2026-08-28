'use client';

import { formatInTimeZone } from 'date-fns-tz';
import Link from 'next/link';
import { useState } from 'react';

import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/global/config/routes';
import type { ApplicationStatus } from '@/global/types';
import { useIsDesktop } from '@/hooks/use-media-query';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

import { useApplyBand } from '../hooks/useApplyBand';
import { useMyBandApplications } from '../hooks/useMyBandApplications';
import { useWithdrawApplication } from '../hooks/useWithdrawApplication';
import type { MyBandApplicationResponse } from '../types/res';

const STATUS_FILTERS: { label: string; value: ApplicationStatus | undefined }[] = [
  { label: '전체', value: undefined },
  { label: '대기중', value: 'PENDING' },
  { label: '승인됨', value: 'APPROVED' },
  { label: '거절됨', value: 'REJECTED' },
  { label: '탈퇴', value: 'LEAVED' },
];

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  REJECTED: '거절됨',
  WITHDRAWN: '철회됨',
  LEAVED: '탈퇴',
};

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  PENDING: 'text-yellow-400 bg-yellow-400/10',
  APPROVED: 'bg-blue-dim text-blue',
  REJECTED: 'text-red-400 bg-red-400/10',
  WITHDRAWN: 'text-foreground-muted bg-white/5',
  LEAVED: 'text-foreground-muted bg-white/5',
};

function ApplicationRow({ item }: { item: MyBandApplicationResponse }) {
  const toast = useToast();
  const withdrawMutation = useWithdrawApplication(item.bandId, {
    onSuccess: () => toast.success('가입 신청을 철회했습니다.'),
    onError: (err) => toast.error(err.message || '철회에 실패했습니다.'),
  });
  const applyMutation = useApplyBand(item.bandId, {
    onSuccess: () => toast.success('가입 신청을 다시 보냈습니다.'),
    onError: (err) => toast.error(err.message || '재가입 신청에 실패했습니다.'),
  });

  const appliedAt = item.appliedAt
    ? formatInTimeZone(new Date(item.appliedAt), 'Asia/Seoul', 'yyyy-MM-dd')
    : null;

  return (
    <li className="gap-s-3 px-s-4 py-s-3 flex items-center">
      <Link
        href={ROUTES.BAND_DETAIL(item.bandId)}
        className="gap-s-3 text-foreground flex min-w-0 flex-1 items-center hover:no-underline"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.bandProfileImg || '/img/band_img.png'}
          alt={item.bandName}
          className="h-10 w-10 shrink-0 rounded-md object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="gap-s-2 flex items-center">
            <span className="text-caption truncate font-semibold">{item.bandName}</span>
            <span
              className={cn(
                'text-micro rounded px-1.5 py-0.5 font-medium',
                STATUS_COLOR[item.status],
              )}
            >
              {STATUS_LABEL[item.status]}
            </span>
          </div>
          {appliedAt && <p className="text-foreground-muted text-micro mt-0.5">{appliedAt} 신청</p>}
        </div>
      </Link>
      {item.status === 'PENDING' && (
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0 rounded-[5px] text-red-400 hover:bg-red-400/10 hover:text-red-400"
          onClick={() => withdrawMutation.mutate()}
          loading={withdrawMutation.isPending}
        >
          철회
        </Button>
      )}
      {item.status === 'LEAVED' && (
        <Button
          size="sm"
          variant="ghost"
          className="text-foreground-muted hover:text-foreground shrink-0 rounded-[5px] hover:bg-white/10"
          onClick={() => applyMutation.mutate()}
          loading={applyMutation.isPending}
        >
          재가입
        </Button>
      )}
    </li>
  );
}

function SheetInner({
  status,
  setStatus,
  items,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  status: ApplicationStatus | undefined;
  setStatus: (v: ApplicationStatus | undefined) => void;
  items: MyBandApplicationResponse[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}) {
  const loadMoreRef = useInfiniteScrollSentinel({ hasNextPage, isFetchingNextPage, fetchNextPage });

  return (
    <>
      <div className="gap-s-2 px-s-4 py-s-3 flex shrink-0 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setStatus(f.value)}
            className={cn(
              'rounded-full px-3 py-1 text-sm transition-colors',
              status === f.value
                ? 'bg-white font-medium text-neutral-900'
                : 'text-foreground-sub hover:bg-white/10',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="px-s-4 space-y-s-2 py-2">
            <Skeleton className="h-14 w-full" rounded="md" />
            <Skeleton className="h-14 w-full" rounded="md" />
            <Skeleton className="h-14 w-full" rounded="md" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-foreground-muted py-s-8 text-center text-sm">신청 내역이 없습니다.</p>
        ) : (
          <>
            <ul className="divide-border divide-y">
              {items.map((item) => (
                <ApplicationRow key={item.bandApplicationId} item={item} />
              ))}
            </ul>
            {hasNextPage && <div ref={loadMoreRef} className="h-4" aria-hidden="true" />}
            {isFetchingNextPage && (
              <div className="px-s-4 py-2">
                <Skeleton className="h-14 w-full" rounded="md" />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export function MyBandApplicationsSheet({ trigger }: { trigger: React.ReactNode }) {
  const isDesktop = useIsDesktop();
  const [status, setStatus] = useState<ApplicationStatus | undefined>(undefined);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMyBandApplications(
    status,
    30,
  );
  const items = data?.pages.flatMap((p) => p.content) ?? [];

  if (isDesktop) {
    return (
      <Dialog>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="flex max-h-[85dvh] w-full max-w-md flex-col">
          <div className="border-border px-s-4 py-s-4 shrink-0 border-b">
            <DialogTitle className="text-foreground text-base font-bold">
              밴드 가입 내역
            </DialogTitle>
          </div>
          <SheetInner
            status={status}
            setStatus={setStatus}
            items={items}
            isLoading={isLoading}
            hasNextPage={!!hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={() => fetchNextPage()}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <BottomSheet>
      <BottomSheetTrigger asChild>{trigger}</BottomSheetTrigger>
      <BottomSheetContent
        style={{ height: 'calc(100dvh - 3rem)', maxHeight: 'calc(100dvh - 3rem)' }}
      >
        <BottomSheetTitle className="sr-only">밴드 가입 내역</BottomSheetTitle>
        <div className="border-border px-s-4 py-s-3 shrink-0 border-b">
          <span className="text-foreground text-base font-bold">밴드 가입 내역</span>
        </div>
        <SheetInner
          status={status}
          setStatus={setStatus}
          items={items}
          isLoading={isLoading}
          hasNextPage={!!hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={() => fetchNextPage()}
        />
      </BottomSheetContent>
    </BottomSheet>
  );
}
