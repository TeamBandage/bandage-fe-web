'use client';

import {
  Root,
  Trigger,
  Portal,
  Overlay,
  Content,
  Title,
  Description,
  Close,
} from '@radix-ui/react-dialog';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/cn';

export const BottomSheet = Root;
export const BottomSheetTrigger = Trigger;
export const BottomSheetClose = Close;

type BottomSheetContentProps = ComponentPropsWithoutRef<typeof Content>;

const overlayClasses =
  'fixed inset-0 z-40 bg-black/60 animate-fade-in data-[state=closed]:opacity-0';

export const BottomSheetContent = forwardRef<ElementRef<typeof Content>, BottomSheetContentProps>(
  function BottomSheetContent({ className, children, ...props }, ref) {
    return (
      <Portal>
        <Overlay className={overlayClasses} />
        <Content
          ref={ref}
          className={cn(
            'bg-card text-foreground border-border fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-xl border border-b-0 shadow-lg outline-none',
            'animate-[sheet-in_var(--duration-normal)_var(--ease-default)]',
            className,
          )}
          {...props}
        >
          <div className="flex justify-center py-2" aria-hidden="true">
            <span className="bg-border-hi rounded-pill h-1 w-10" />
          </div>
          {children}
        </Content>
      </Portal>
    );
  },
);

export function BottomSheetHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border-border border-b px-5 py-3', className)} {...props}>
      {children}
    </div>
  );
}

export function BottomSheetBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-5 py-4 text-sm', className)} {...props}>
      {children}
    </div>
  );
}

export function BottomSheetFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-border flex justify-end gap-2 border-t px-5 py-3', className)}
      {...props}
    >
      {children}
    </div>
  );
}

type TitleProps = ComponentPropsWithoutRef<typeof Title> & { children?: ReactNode };
export const BottomSheetTitle = forwardRef<ElementRef<typeof Title>, TitleProps>(
  function BottomSheetTitle({ className, ...props }, ref) {
    return (
      <Title
        ref={ref}
        className={cn('text-foreground text-base font-semibold', className)}
        {...props}
      />
    );
  },
);

type DescriptionProps = ComponentPropsWithoutRef<typeof Description> & { children?: ReactNode };
export const BottomSheetDescription = forwardRef<ElementRef<typeof Description>, DescriptionProps>(
  function BottomSheetDescription({ className, ...props }, ref) {
    return (
      <Description
        ref={ref}
        className={cn('text-foreground-muted mt-1 text-xs', className)}
        {...props}
      />
    );
  },
);
