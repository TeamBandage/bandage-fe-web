'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDirtyFormController } from '@/global/navigation/dirty-form-context';

/**
 * 진행 중인 마법사/폼이 있을 때 라우트 이동 직전에 띄워지는 확인 모달.
 * DirtyFormProvider 의 pendingConfirm/resolveConfirm 와 연결.
 */
export function LeaveConfirmDialog() {
  const ctx = useDirtyFormController();
  if (!ctx) return null;

  return (
    <Dialog
      open={ctx.pendingConfirm}
      onOpenChange={(open) => {
        if (!open) ctx.resolveConfirm(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>진행 중인 작업이 있어요</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-foreground-sub text-sm">
            이 페이지를 떠나면 입력한 내용이 모두 사라집니다. 그래도 이동하시겠습니까?
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => ctx.resolveConfirm(false)}>
            머무르기
          </Button>
          <Button variant="danger" onClick={() => ctx.resolveConfirm(true)}>
            이동하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
