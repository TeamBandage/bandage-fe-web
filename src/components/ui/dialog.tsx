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
import { X } from 'lucide-react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/cn';

export const Dialog = Root;
export const DialogTrigger = Trigger;
export const DialogClose = Close;

type DialogContentProps = ComponentPropsWithoutRef<typeof Content> & {
  fullscreen?: boolean;
  hideCloseButton?: boolean;
};

const overlayClasses =
  'fixed inset-0 z-40 bg-black/60 animate-fade-in data-[state=closed]:animate-out data-[state=closed]:opacity-0';

export const DialogContent = forwardRef<ElementRef<typeof Content>, DialogContentProps>(
  function DialogContent(
    { className, children, fullscreen = false, hideCloseButton, ...props },
    ref,
  ) {
    return (
      <Portal>
        <Overlay className={overlayClasses} />
        <Content
          ref={ref}
          className={cn(
            'bg-card text-foreground fixed z-50 flex flex-col shadow-lg outline-none',
            fullscreen
              ? 'inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg'
              : 'top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg',
            'border-border animate-modal-in border',
            className,
          )}
          {...props}
        >
          {children}
          {!hideCloseButton && (
            <Close
              aria-label="닫기"
              className="text-foreground-sub hover:text-foreground focus-visible:ring-accent focus-visible:ring-offset-bg absolute top-3 right-3 rounded-sm p-1 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <X className="h-4 w-4" />
            </Close>
          )}
        </Content>
      </Portal>
    );
  },
);

export function DialogHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border-border border-b px-5 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function DialogBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-5 py-4 text-sm', className)} {...props}>
      {children}
    </div>
  );
}

export function DialogFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
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
export const DialogTitle = forwardRef<ElementRef<typeof Title>, TitleProps>(function DialogTitle(
  { className, ...props },
  ref,
) {
  return (
    <Title
      ref={ref}
      className={cn('text-foreground text-base font-semibold', className)}
      {...props}
    />
  );
});

type DescriptionProps = ComponentPropsWithoutRef<typeof Description> & { children?: ReactNode };
export const DialogDescription = forwardRef<ElementRef<typeof Description>, DescriptionProps>(
  function DialogDescription({ className, ...props }, ref) {
    return (
      <Description
        ref={ref}
        className={cn('text-foreground-muted mt-1 text-xs', className)}
        {...props}
      />
    );
  },
);
