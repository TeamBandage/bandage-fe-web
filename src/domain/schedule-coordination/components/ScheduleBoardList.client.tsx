'use client';

import { CheckCircle2, Lock, MoreVertical, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

import { SCHEDULE_BOARD_LIMIT, useBoardStore } from '../store/boardStore';
import type { ScheduleBoard, ScheduleBlock } from '../types';

interface Props {
  meetingId: string;
  selectedBoardId: string | null;
  onSelect: (boardId: string) => void;
  /** Task 12 — 자동 추천 시안 변형 목록 (3개 권장). 빈 배열이면 빈 시안만 추가. */
  generateRecommendations?: () => ScheduleBlock[][];
}

export function ScheduleBoardList({
  meetingId,
  selectedBoardId,
  onSelect,
  generateRecommendations,
}: Props) {
  const boards = useBoardStore((s) => s.getBoardsByMeeting(meetingId));
  const createBoard = useBoardStore((s) => s.createBoard);
  const renameBoard = useBoardStore((s) => s.renameBoard);
  const deleteBoard = useBoardStore((s) => s.deleteBoard);
  const toast = useToast();

  const [deleteTarget, setDeleteTarget] = useState<ScheduleBoard | null>(null);
  const [recommendWarn, setRecommendWarn] = useState(false);

  const atLimit = boards.length >= SCHEDULE_BOARD_LIMIT;
  const hasUserEdits = boards.some((b) => b.blocks.length > 0);

  const performRecommendation = () => {
    // 자동 추천 안 3개 + 빈 카드 2개. 한도 초과 시 가능한 만큼만.
    const remaining = SCHEDULE_BOARD_LIMIT - boards.length;
    if (remaining <= 0) {
      toast.error(`시간표는 최대 ${SCHEDULE_BOARD_LIMIT}개까지 만들 수 있습니다.`);
      return;
    }
    const variants = generateRecommendations?.() ?? [];
    const recommendedCount = Math.min(3, remaining, variants.length || 3);
    const blankCount = Math.min(2, remaining - recommendedCount);
    for (let i = 0; i < recommendedCount; i++) {
      createBoard({
        meetingId,
        name: `추천 안 ${boards.length + i + 1}`,
        blocks: variants[i] ?? [],
        paletteSeed: boards.length + i,
      });
    }
    for (let i = 0; i < blankCount; i++) {
      createBoard({
        meetingId,
        name: `빈 시안 ${boards.length + recommendedCount + i + 1}`,
        paletteSeed: boards.length + recommendedCount + i,
      });
    }
    toast.success(`추천 ${recommendedCount}개 + 빈 시안 ${blankCount}개를 만들었습니다.`);
  };

  return (
    <div className="px-s-3 py-s-3 gap-s-2 flex flex-col">
      <div className="gap-s-2 flex items-center justify-between">
        <div className="text-foreground-muted text-micro font-bold uppercase">
          시간표 시안 ({boards.length}/{SCHEDULE_BOARD_LIMIT})
        </div>
        <Button
          size="sm"
          variant="primary"
          disabled={atLimit}
          onClick={() => {
            if (hasUserEdits) {
              setRecommendWarn(true);
              return;
            }
            performRecommendation();
          }}
        >
          <Sparkles className="h-4 w-4" /> 시간표 생성
        </Button>
      </div>

      {boards.length === 0 ? (
        <div className="border-border bg-card px-s-4 py-s-6 rounded-md border border-dashed text-center">
          <p className="text-foreground-muted text-caption">
            아직 시간표 시안이 없습니다. ‘시간표 생성’으로 자동 추천을 받아보세요.
          </p>
        </div>
      ) : (
        <ul className="gap-s-2 flex flex-col">
          {boards.map((board) => (
            <li key={board.boardId}>
              <BoardCard
                board={board}
                active={board.boardId === selectedBoardId}
                onSelect={() => onSelect(board.boardId)}
                onRename={() => {
                  const next = window.prompt('시안 이름', board.name)?.trim();
                  if (next) {
                    renameBoard(board.boardId, next);
                    toast.success('이름을 저장했습니다.');
                  }
                }}
                onDelete={() => setDeleteTarget(board)}
              />
            </li>
          ))}
        </ul>
      )}

      <Button
        size="sm"
        variant="accent-outline"
        disabled={atLimit}
        onClick={() => {
          const board = createBoard({
            meetingId,
            name: `빈 시안 ${boards.length + 1}`,
            paletteSeed: boards.length,
          });
          if (board) onSelect(board.boardId);
        }}
      >
        <Plus className="h-4 w-4" /> 빈 시안 추가
      </Button>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="시안 삭제"
        description={`'${deleteTarget?.name}' 시안을 삭제할까요? 배치된 블록도 함께 사라집니다.`}
        confirmLabel="삭제"
        onConfirm={() => {
          if (deleteTarget) {
            deleteBoard(deleteTarget.boardId);
            toast.success('시안을 삭제했습니다.');
          }
          setDeleteTarget(null);
        }}
      />

      <ConfirmDialog
        open={recommendWarn}
        onOpenChange={setRecommendWarn}
        title="기존 시안이 있습니다"
        description="현재 편집된 시안이 있습니다. 그대로 두고 추천 시안을 추가할까요?"
        confirmLabel="추가"
        onConfirm={() => {
          performRecommendation();
          setRecommendWarn(false);
        }}
      />
    </div>
  );
}

function BoardCard({
  board,
  active,
  onSelect,
  onRename,
  onDelete,
}: {
  board: ScheduleBoard;
  active: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const blockCount = board.blocks.length;
  const lockedCount = board.pinned.length;
  return (
    <div
      className={cn(
        'border-border bg-card relative rounded-md border transition-colors',
        active ? 'border-accent ring-accent ring-2 ring-offset-0' : 'hover:border-foreground-muted',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="px-s-3 py-s-3 gap-s-2 flex w-full items-start text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="gap-s-2 flex items-center">
            <span className="text-caption truncate font-bold">{board.name}</span>
            {board.confirmed && (
              <span className="bg-success-dim text-success text-micro px-s-2 inline-flex items-center gap-1 rounded-full py-0.5 font-bold">
                <CheckCircle2 className="h-3 w-3" /> 확정
              </span>
            )}
          </div>
          <div className="text-foreground-muted text-micro gap-s-2 mt-0.5 flex flex-wrap">
            <span>{blockCount}블록</span>
            {lockedCount > 0 && (
              <span className="gap-s-1 inline-flex items-center">
                <Lock className="h-3 w-3" /> {lockedCount} 잠금
              </span>
            )}
            <span>{board.updatedAt.slice(0, 16).replace('T', ' ')}</span>
          </div>
        </div>
        <span className="bg-bg/40 text-foreground-muted text-micro h-2 w-2 self-center rounded-full" />
      </button>
      <button
        type="button"
        aria-label="시안 메뉴"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
        className="text-foreground-muted hover:text-foreground top-s-2 right-s-2 absolute rounded-md p-1"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {menuOpen && (
        <div className="bg-surface border-border absolute top-9 right-2 z-10 w-32 rounded-md border shadow-lg">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onRename();
            }}
            className="text-caption hover:bg-card px-s-3 py-s-2 gap-s-2 flex w-full items-center"
          >
            <Pencil className="h-3.5 w-3.5" /> 이름 변경
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onDelete();
            }}
            className="text-caption text-danger hover:bg-card px-s-3 py-s-2 gap-s-2 flex w-full items-center"
          >
            <Trash2 className="h-3.5 w-3.5" /> 삭제
          </button>
        </div>
      )}
    </div>
  );
}
