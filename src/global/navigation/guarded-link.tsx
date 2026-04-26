'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { forwardRef, type ComponentPropsWithoutRef, type MouseEvent } from 'react';

import { useDirtyFormGuard } from './dirty-form-context';

type Props = ComponentPropsWithoutRef<typeof Link>;

/**
 * Next.js Link 의 drop-in 대체. 진행 중인 dirty form 이 있으면 이동 직전에 LeaveConfirmDialog
 * 를 띄워 사용자 확인을 받음.
 *
 * 단, 외부 링크/새 탭/modifier-click(Cmd/Ctrl/Shift) 은 인터셉트하지 않고 기본 동작 유지.
 */
export const GuardedLink = forwardRef<HTMLAnchorElement, Props>(function GuardedLink(
  { href, onClick, target, ...rest },
  ref,
) {
  const router = useRouter();
  const { hasDirty, confirmLeave } = useDirtyFormGuard();

  async function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (target && target !== '_self') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (typeof href !== 'string') return;
    if (!hasDirty) return;

    e.preventDefault();
    const confirmed = await confirmLeave();
    if (confirmed) router.push(href);
  }

  return <Link ref={ref} href={href} target={target} onClick={handleClick} {...rest} />;
});
