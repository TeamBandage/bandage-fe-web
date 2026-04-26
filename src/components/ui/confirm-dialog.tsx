'use client';

import { type ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { Button } from './button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';

export type ConfirmDialogTone = 'primary' | 'danger';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  /** 비동기 처리도 가능. 반환값 무관하게 다이얼로그는 닫힘. */
  onConfirm: () => void | Promise<void>;
}

/**
 * 브라우저 기본 confirm 대신 사용하는 디자인 토큰 적용 확인 다이얼로그.
 * tone='danger' 일 때 confirm 버튼이 위험 색(danger) 으로 강조됨.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  tone = 'primary',
  onConfirm,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent srOnlyTitle={typeof title === 'string' ? title : '확인'}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && (
          <DialogBody>
            <p className="text-foreground-sub text-caption leading-relaxed">{description}</p>
          </DialogBody>
        )}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            className={cn(tone === 'danger' && 'bg-danger hover:bg-danger/90 text-white')}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
