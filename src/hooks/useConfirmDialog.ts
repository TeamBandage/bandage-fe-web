'use client';

import { useCallback, useState } from 'react';

export type ConfirmOpenParams = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

type ConfirmDialogState = ConfirmOpenParams & { isOpen: boolean; isLoading: boolean };

const INITIAL_STATE: ConfirmDialogState = {
  isOpen: false,
  isLoading: false,
  title: '',
  description: undefined,
  confirmLabel: '확인',
  cancelLabel: '취소',
  destructive: false,
  onConfirm: () => undefined,
};

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState>(INITIAL_STATE);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false, isLoading: false }));
  }, []);

  const open = useCallback((params: ConfirmOpenParams) => {
    setState({
      isOpen: true,
      isLoading: false,
      title: params.title,
      description: params.description,
      confirmLabel: params.confirmLabel ?? '확인',
      cancelLabel: params.cancelLabel ?? '취소',
      destructive: params.destructive ?? false,
      onConfirm: params.onConfirm,
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      await state.onConfirm();
      setState((prev) => ({ ...prev, isOpen: false, isLoading: false }));
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  }, [state]);

  return {
    isOpen: state.isOpen,
    isLoading: state.isLoading,
    title: state.title,
    description: state.description,
    confirmLabel: state.confirmLabel,
    cancelLabel: state.cancelLabel,
    destructive: state.destructive,
    open,
    close,
    confirm: handleConfirm,
  };
}
