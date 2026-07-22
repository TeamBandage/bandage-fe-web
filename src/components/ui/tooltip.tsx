'use client';

import { Content, Portal, Provider, Root, Trigger } from '@radix-ui/react-tooltip';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';

import { cn } from '@/lib/cn';

export const TooltipProvider = Provider;
export const Tooltip = Root;
export const TooltipTrigger = Trigger;

export const TooltipContent = forwardRef<
  ElementRef<typeof Content>,
  ComponentPropsWithoutRef<typeof Content>
>(function TooltipContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <Portal>
      <Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'bg-card border-border text-foreground text-micro z-50 rounded-md border px-2 py-1 shadow-md',
          className,
        )}
        {...props}
      />
    </Portal>
  );
});
