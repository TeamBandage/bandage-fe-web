'use client';

import { Minus, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

import { Button } from './button';
import { Input } from './input';

/** 세션 인원 한 자리. existingId 가 있으면 서버에 이미 존재하는 세션(수정 시 그대로 재전송), 없으면 아직 생성 전인 신규 자리. */
export type SessionInstance = { existingId?: string };

export type SessionRowState = {
  label: string;
  instances: SessionInstance[];
  /** 기본 세션이 아닌, 사용자가 직접 추가한 세션만 X 로 삭제 가능. */
  removable: boolean;
};

/** 기본 세션 4종. 설명(label)은 영문 대문자로 서버에 그대로 전송됨. */
export const DEFAULT_SESSION_LABELS: ReadonlyArray<string> = ['VOCAL', 'GUITAR', 'BASS', 'DRUM'];
/** 세션 1개당 인원 상한(스테퍼 +/- 범위). */
export const MAX_SESSION_COUNT = 9;

/** 세션 설명 입력값 정규화: 영문(대소문자 무관 입력)만 남기고 대문자로 변환. */
export function normalizeSessionLabel(raw: string): string {
  return raw.replace(/[^a-zA-Z]/g, '').toUpperCase();
}

/** 새로 만들 때 기본값: 기본 4종이 인원 1명씩(전부 신규 자리) 켜져 있는 상태. */
export function defaultSessionRows(): SessionRowState[] {
  return DEFAULT_SESSION_LABELS.map((label) => ({ label, instances: [{}], removable: false }));
}

/** 기존 세션(label+실제 sessionId) 목록 → 라벨별로 그룹핑, 각 자리에 실제 sessionId 보존. */
export function deriveSessionRows(
  sessions: Array<{ label: string; sessionId: string }>,
): SessionRowState[] {
  const grouped = new Map<string, SessionInstance[]>();
  for (const s of sessions) {
    const label = s.label.toUpperCase();
    const list = grouped.get(label) ?? [];
    list.push({ existingId: s.sessionId });
    grouped.set(label, list);
  }
  const rows: SessionRowState[] = DEFAULT_SESSION_LABELS.map((label) => ({
    label,
    instances: grouped.get(label) ?? [],
    removable: false,
  }));
  for (const [label, instances] of grouped) {
    if (DEFAULT_SESSION_LABELS.includes(label)) continue;
    rows.push({ label, instances, removable: true });
  }
  return rows;
}

/**
 * rows → 실제 전송용 세션 목록. 기존 자리는 원래 sessionId 그대로, 신규 자리는 sessionId 를
 * 아예 생략(BD-269: 서버가 발급 — 임의 값을 보내면 400 SESSION_NOT_FOUND/SESSION_DUPLICATED).
 */
export function expandSessionRows(
  rows: SessionRowState[],
): Array<{ sessionId?: string; label: string; custom: boolean }> {
  const out: Array<{ sessionId?: string; label: string; custom: boolean }> = [];
  for (const row of rows) {
    for (const instance of row.instances) {
      out.push({
        ...(instance.existingId ? { sessionId: instance.existingId } : {}),
        label: row.label,
        custom: row.removable,
      });
    }
  }
  return out;
}

function updateRowCount(rows: SessionRowState[], label: string, delta: number): SessionRowState[] {
  return rows.map((row) => {
    if (row.label !== label) return row;
    if (delta > 0) {
      if (row.instances.length >= MAX_SESSION_COUNT) return row;
      return { ...row, instances: [...row.instances, {}] };
    }
    if (row.instances.length === 0) return row;
    // 감소 시 아직 저장 안 된(신규) 자리부터 제거 — 이미 존재하는(배정된 인원이 있을 수 있는)
    // 세션은 더 이상 줄일 신규 자리가 없을 때만 제거된다.
    const lastNewIndex = row.instances.map((i) => !i.existingId).lastIndexOf(true);
    const removeIndex = lastNewIndex !== -1 ? lastNewIndex : row.instances.length - 1;
    return { ...row, instances: row.instances.filter((_, i) => i !== removeIndex) };
  });
}

function SessionRowItem({
  row,
  onChangeCount,
  onRemove,
}: {
  row: SessionRowState;
  onChangeCount: (label: string, delta: number) => void;
  onRemove?: (label: string) => void;
}) {
  const count = row.instances.length;
  return (
    <div
      className={cn(
        'gap-s-1 px-s-2 py-s-1 inline-flex shrink-0 items-center rounded-full border transition-colors',
        count > 0 ? 'border-white/40 bg-white/10' : 'bg-card border-border',
      )}
    >
      <span
        className={cn(
          'px-s-2 text-micro font-mono font-bold whitespace-nowrap',
          count > 0 ? 'text-white' : 'text-foreground-muted',
        )}
      >
        {row.label}
      </span>
      <button
        type="button"
        onClick={() => onChangeCount(row.label, -1)}
        disabled={count <= 0}
        aria-label={`${row.label} 인원 감소`}
        className="border-border text-foreground-sub hover:text-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors outline-none hover:border-white/50 disabled:opacity-30"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="text-micro w-3 shrink-0 text-center font-mono font-bold">{count}</span>
      <button
        type="button"
        onClick={() => onChangeCount(row.label, 1)}
        disabled={count >= MAX_SESSION_COUNT}
        aria-label={`${row.label} 인원 추가`}
        className="border-border text-foreground-sub hover:text-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors outline-none hover:border-white/50 disabled:opacity-30"
      >
        <Plus className="h-3 w-3" />
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(row.label)}
          aria-label={`${row.label} 세션 삭제`}
          className="text-foreground-muted hover:text-danger shrink-0 rounded p-0.5 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export interface SessionComposerProps {
  rows: SessionRowState[];
  onChange: (rows: SessionRowState[]) => void;
  /** 목록 스크롤 영역 최대 높이(Tailwind 클래스). 기본 max-h-28. */
  maxHeightClassName?: string;
  customPlaceholder?: string;
  className?: string;
  /** 세션 0개 상태에서 "최소 1개 선택하세요" 경고를 보여줄지. 세션이 선택사항이면 false. 기본 true. */
  requireAtLeastOne?: boolean;
}

/** 세션 인원 구성 UI. 기본 4종은 +/- 스테퍼로 인원수 조정, 커스텀 세션은 이름만 입력해 추가. */
export function SessionComposer({
  rows,
  onChange,
  maxHeightClassName = 'max-h-28',
  customPlaceholder = '예: PERCUSSION (영문 대문자로 자동 변환)',
  requireAtLeastOne = true,
  className,
}: SessionComposerProps) {
  const toast = useToast();
  const [customDraft, setCustomDraft] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);
  const justAddedRef = useRef(false);

  // 새 커스텀 세션 추가로 목록이 스크롤 영역을 넘어가면, 방금 추가한 행이 보이도록 하단으로 스크롤.
  useEffect(() => {
    if (!justAddedRef.current) return;
    justAddedRef.current = false;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [rows]);

  function updateCount(label: string, delta: number) {
    onChange(updateRowCount(rows, label, delta));
  }

  function removeRow(label: string) {
    onChange(rows.filter((row) => row.label !== label));
  }

  function addCustomRow() {
    const label = normalizeSessionLabel(customDraft);
    if (!label) return;
    if (rows.some((row) => row.label === label)) {
      toast.warn('이미 같은 이름의 세션이 있습니다.');
      return;
    }
    justAddedRef.current = true;
    onChange([...rows, { label, instances: [{}], removable: true }]);
    setCustomDraft('');
  }

  const defaults = rows.filter((row) => !row.removable);
  const customs = rows.filter((row) => row.removable);
  const totalCount = rows.reduce((acc, row) => acc + row.instances.length, 0);

  return (
    <div className={className}>
      <div ref={listRef} className={cn(maxHeightClassName, 'overflow-y-auto')}>
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          {defaults.map((row) => (
            <SessionRowItem key={row.label} row={row} onChangeCount={updateCount} />
          ))}
        </div>
        {customs.length > 0 && (
          <div className="mt-s-2 flex flex-wrap gap-x-3 gap-y-2">
            {customs.map((row) => (
              <SessionRowItem
                key={row.label}
                row={row}
                onChangeCount={updateCount}
                onRemove={removeRow}
              />
            ))}
          </div>
        )}
      </div>

      <div className="gap-s-2 mt-s-3 flex items-center">
        <div className="flex-1">
          <Input
            value={customDraft}
            onChange={(e) => setCustomDraft(normalizeSessionLabel(e.target.value).slice(0, 20))}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              addCustomRow();
            }}
            placeholder={customPlaceholder}
            aria-label="커스텀 세션 이름"
            autoComplete="off"
            maxLength={20}
          />
        </div>
        <Button type="button" variant="secondary" onClick={addCustomRow} disabled={!customDraft}>
          <Plus className="h-4 w-4" /> 추가
        </Button>
      </div>
      {requireAtLeastOne && totalCount === 0 && (
        <p className="text-danger text-micro mt-s-2">최소 1개 세션을 선택하세요.</p>
      )}
    </div>
  );
}
