'use client';

import { Lock, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/domain/member/hooks/useMe';
import { useDeleteTrackSelection } from '@/domain/track-selection/hooks/useDeleteTrackSelection';
import { useMyTrackSelections } from '@/domain/track-selection/hooks/useMyTrackSelections';
import type { TrackSelectionResponse } from '@/domain/track-selection/types/res';
import { ROUTES } from '@/global/config/routes';
import { useIsDesktop } from '@/hooks/use-media-query';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { useToast } from '@/hooks/useToast';
import { DOMAIN_IMAGES, DOMAIN_LIST_SELECTED_TONES } from '@/lib/domain-icons';
import { listItemClasses } from '@/lib/list-item-styles';

function MeetingRow({
  item,
  active,
  isManager,
  onDeleteClick,
}: {
  item: TrackSelectionResponse;
  active: boolean;
  isManager: boolean;
  onDeleteClick: () => void;
}) {
  const locked = Boolean(item.lockedAt);

  return (
    <li>
      <div className={listItemClasses(active, DOMAIN_LIST_SELECTED_TONES['track-selection'])}>
        <Link
          href={ROUTES.TRACK_SELECTION_DETAIL(item.selectionId)}
          aria-current={active ? 'page' : undefined}
          data-slot="track-selection-row"
          className="gap-s-3 focus-visible:ring-offset-bg flex min-w-0 flex-1 items-center text-white no-underline focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={DOMAIN_IMAGES['track-selection']}
            alt=""
            aria-hidden="true"
            className="h-8 w-8 shrink-0 rounded-sm object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="gap-s-1 flex items-center">
              <span className="text-caption truncate font-semibold">{item.title}</span>
              {locked && <Lock className="text-foreground-muted h-3 w-3 shrink-0" />}
              {isManager && (
                <Badge variant="amber" className="bg-white/10 text-white">
                  매니저
                </Badge>
              )}
            </div>
          </div>
        </Link>
        {isManager && (
          <button
            type="button"
            onClick={onDeleteClick}
            aria-label={`${item.title} 삭제`}
            className="text-foreground-muted hover:text-danger shrink-0 rounded p-1.5 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}

export function TrackSelectionsMobileShell() {
  const pathname = usePathname() ?? '';
  const isDesktop = useIsDesktop();
  const { data: me } = useMe();
  const toast = useToast();

  const [deletingMeeting, setDeletingMeeting] = useState<TrackSelectionResponse | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMyTrackSelections(20);
  const meetings = data?.pages.flatMap((p) => p.content) ?? [];

  const loadMoreRef = useInfiniteScrollSentinel({ hasNextPage, isFetchingNextPage, fetchNextPage });

  const deleteMutation = useDeleteTrackSelection(deletingMeeting?.selectionId ?? '', {
    onSuccess: () => {
      toast.success('선곡 회의를 삭제했습니다.');
      setDeletingMeeting(null);
      setConfirmText('');
    },
    onError: (err) => toast.error(err.message || '선곡 회의 삭제에 실패했습니다.'),
  });

  function handleOpenChange(open: boolean) {
    if (!open) {
      setDeletingMeeting(null);
      setConfirmText('');
    }
  }

  if (!isDesktop) {
    return (
      <p className="text-foreground-muted py-s-10 text-center text-sm">
        모바일에서는 지원하지 않는 기능입니다. PC에서 이용해 주세요.
      </p>
    );
  }

  return (
    <>
      <div className="border-border mb-s-3 pb-s-2 pt-s-1 flex items-center justify-between border-b">
        <h2 className="text-foreground pl-2.5 text-2xl font-bold lg:text-3xl">내 선곡 회의</h2>
        <Button
          asChild
          size="sm"
          variant="accent-outline"
          aria-label="선곡 회의 생성"
          className="rounded-[5px] border-white text-white hover:border-transparent hover:bg-white hover:text-neutral-900 active:border-transparent active:bg-neutral-200 active:text-neutral-900"
        >
          <Link href={ROUTES.TRACK_SELECTION_CREATE}>
            <Plus className="h-4 w-4" /> 선곡 회의 생성
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-s-2">
          <Skeleton className="h-14 w-full" rounded="md" />
          <Skeleton className="h-14 w-full" rounded="md" />
          <Skeleton className="h-14 w-full" rounded="md" />
        </div>
      ) : meetings.length === 0 ? (
        <p className="text-foreground-muted py-s-6 text-center text-sm">
          참여 중인 선곡회의가 없습니다.
        </p>
      ) : (
        <>
          <ul className="gap-s-1 flex flex-col">
            {meetings.map((item) => {
              const href = ROUTES.TRACK_SELECTION_DETAIL(item.selectionId);
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <MeetingRow
                  key={item.selectionId}
                  item={item}
                  active={active}
                  isManager={item.managerId === me?.id}
                  onDeleteClick={() => {
                    setDeletingMeeting(item);
                    setConfirmText('');
                  }}
                />
              );
            })}
          </ul>
          {hasNextPage && <div ref={loadMoreRef} className="h-4" aria-hidden="true" />}
          {isFetchingNextPage && (
            <div className="space-y-s-2 py-2">
              <Skeleton className="h-14 w-full" rounded="md" />
            </div>
          )}
        </>
      )}

      <Dialog open={!!deletingMeeting} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>선곡 회의 삭제</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-s-3">
            <p className="text-foreground-sub text-xs">
              선곡 회의를 삭제하면 등록된 곡·세션·채팅 내용도 함께 사라지며 복구할 수 없습니다.
            </p>
            <Input
              label={`선곡 회의 이름(${deletingMeeting?.title ?? ''})을 그대로 입력해 주세요`}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={deletingMeeting?.title}
            />
          </DialogBody>
          <DialogFooter className="border-t-0">
            <Button
              variant="ghost"
              className="h-8 rounded-[5px]"
              onClick={() => handleOpenChange(false)}
            >
              취소
            </Button>
            <Button
              variant="danger"
              className="h-8 rounded-[5px] px-2"
              onClick={() => deleteMutation.mutate()}
              disabled={confirmText !== deletingMeeting?.title}
              loading={deleteMutation.isPending}
            >
              삭제하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
