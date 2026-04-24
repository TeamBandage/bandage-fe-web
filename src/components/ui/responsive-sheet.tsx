'use client';

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

import { useIsDesktop } from '@/hooks/use-media-query';

import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from './bottom-sheet';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

/**
 * ResponsiveSheet: 데스크톱(lg 이상)에서는 Dialog, 모바일에서는 BottomSheet 로 자동 전환.
 * Open state 는 Radix Dialog 의 Root 를 공유하므로 Dialog / BottomSheet 어느 쪽이든 동일 open prop 으로 제어 가능.
 */
export const ResponsiveSheet = Dialog;
export const ResponsiveSheetTrigger = DialogTrigger;
export const ResponsiveSheetClose = DialogClose;

export const ResponsiveSheetContent = forwardRef<
  ElementRef<typeof DialogContent>,
  ComponentPropsWithoutRef<typeof DialogContent>
>(function ResponsiveSheetContent(props, ref) {
  const isDesktop = useIsDesktop();
  if (isDesktop) {
    return <DialogContent ref={ref} {...props} />;
  }
  return (
    <BottomSheetContent
      ref={ref}
      {...(props as ComponentPropsWithoutRef<typeof BottomSheetContent>)}
    />
  );
});

export function ResponsiveSheetHeader(props: HTMLAttributes<HTMLDivElement>) {
  const isDesktop = useIsDesktop();
  return isDesktop ? <DialogHeader {...props} /> : <BottomSheetHeader {...props} />;
}

export function ResponsiveSheetBody(props: HTMLAttributes<HTMLDivElement>) {
  const isDesktop = useIsDesktop();
  return isDesktop ? <DialogBody {...props} /> : <BottomSheetBody {...props} />;
}

export function ResponsiveSheetFooter(props: HTMLAttributes<HTMLDivElement>) {
  const isDesktop = useIsDesktop();
  return isDesktop ? <DialogFooter {...props} /> : <BottomSheetFooter {...props} />;
}

type TitleProps = ComponentPropsWithoutRef<typeof DialogTitle> & { children?: ReactNode };
export const ResponsiveSheetTitle = forwardRef<ElementRef<typeof DialogTitle>, TitleProps>(
  function ResponsiveSheetTitle(props, ref) {
    const isDesktop = useIsDesktop();
    return isDesktop ? (
      <DialogTitle ref={ref} {...props} />
    ) : (
      <BottomSheetTitle ref={ref} {...props} />
    );
  },
);

type DescriptionProps = ComponentPropsWithoutRef<typeof DialogDescription> & {
  children?: ReactNode;
};
export const ResponsiveSheetDescription = forwardRef<
  ElementRef<typeof DialogDescription>,
  DescriptionProps
>(function ResponsiveSheetDescription(props, ref) {
  const isDesktop = useIsDesktop();
  return isDesktop ? (
    <DialogDescription ref={ref} {...props} />
  ) : (
    <BottomSheetDescription ref={ref} {...props} />
  );
});

export {
  BottomSheet as _BottomSheet,
  BottomSheetTrigger as _BottomSheetTrigger,
  BottomSheetClose as _BottomSheetClose,
};
