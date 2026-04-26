'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/**
 * 진행 중인 마법사/폼이 있는지 추적하는 전역 컨텍스트.
 * 마운트된 마법사가 dirty=true 신호를 보내면, 사이드바/Link 인터셉터가
 * 라우트 이탈 직전에 LeaveConfirmDialog 를 띄울 수 있다.
 *
 * Provider 가 노출하는 핵심 API
 * - registerDirty(scope, dirty): 마법사가 자기 scope 의 dirty 상태를 갱신
 * - hasDirty: 어딘가에 dirty 가 있는지 여부 (탐색 인터셉터가 사용)
 * - confirmLeave(): 모달을 통해 사용자 확인 후 boolean 반환 (Promise)
 */

type DirtyScope = string;

interface DirtyFormContextValue {
  hasDirty: boolean;
  registerDirty: (scope: DirtyScope, dirty: boolean) => void;
  /** 라우트 이동 직전에 호출. dirty 가 있으면 모달을 띄우고 사용자 응답을 반환. */
  confirmLeave: () => Promise<boolean>;
  /** 내부용 — LeaveConfirmDialog 가 열려있는지. */
  pendingConfirm: boolean;
  /** 내부용 — 모달 응답. */
  resolveConfirm: (confirmed: boolean) => void;
}

const DirtyFormContext = createContext<DirtyFormContextValue | null>(null);

export function DirtyFormProvider({ children }: { children: ReactNode }) {
  const [scopes, setScopes] = useState<Record<DirtyScope, boolean>>({});
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const hasDirty = useMemo(() => Object.values(scopes).some(Boolean), [scopes]);

  const registerDirty = useCallback((scope: DirtyScope, dirty: boolean) => {
    setScopes((prev) => {
      if (Boolean(prev[scope]) === dirty) return prev;
      return { ...prev, [scope]: dirty };
    });
  }, []);

  const confirmLeave = useCallback((): Promise<boolean> => {
    if (!hasDirty) return Promise.resolve(true);
    setPendingConfirm(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, [hasDirty]);

  const resolveConfirm = useCallback((confirmed: boolean) => {
    if (resolverRef.current) {
      resolverRef.current(confirmed);
      resolverRef.current = null;
    }
    setPendingConfirm(false);
    if (confirmed) {
      // 사용자가 이동 확정 — dirty 해제 (이동 후 마법사가 unmount 되며 자동 unregister 되지만,
      // 즉시 모달이 다시 뜨지 않도록 선제 해제).
      setScopes({});
    }
  }, []);

  // 브라우저 새로고침/탭 닫기 가드 (dirty 일 때만).
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!hasDirty) return;
      e.preventDefault();
      // 일부 브라우저는 returnValue 필요.
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasDirty]);

  const value = useMemo<DirtyFormContextValue>(
    () => ({ hasDirty, registerDirty, confirmLeave, pendingConfirm, resolveConfirm }),
    [hasDirty, registerDirty, confirmLeave, pendingConfirm, resolveConfirm],
  );

  return <DirtyFormContext.Provider value={value}>{children}</DirtyFormContext.Provider>;
}

/**
 * 마법사/폼 컴포넌트가 호출. dirty 변경 시 자동 register, unmount 시 false 등록.
 *
 * @param scope 다중 마법사 충돌 방지용 식별자 (`practice-create`, `performance-create` 등)
 * @param dirty 입력값이 비어있지 않거나 step > 0 인 경우 true
 */
export function useRegisterDirtyForm(scope: DirtyScope, dirty: boolean) {
  const ctx = useContext(DirtyFormContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.registerDirty(scope, dirty);
    return () => {
      ctx.registerDirty(scope, false);
    };
  }, [ctx, scope, dirty]);
}

/** 사이드바/Link 인터셉터가 사용. */
export function useDirtyFormGuard() {
  const ctx = useContext(DirtyFormContext);
  if (!ctx) {
    return {
      hasDirty: false,
      confirmLeave: async () => true,
    };
  }
  return { hasDirty: ctx.hasDirty, confirmLeave: ctx.confirmLeave };
}

/** LeaveConfirmDialog 가 사용. Provider 외부에서는 null 반환. */
export function useDirtyFormController() {
  return useContext(DirtyFormContext);
}
