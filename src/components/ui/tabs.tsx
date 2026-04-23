'use client';

import { Root, List, Trigger, Content } from '@radix-ui/react-tabs';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';

import { cn } from '@/lib/cn';

export const Tabs = Root;

export const TabsList = forwardRef<ElementRef<typeof List>, ComponentPropsWithoutRef<typeof List>>(
  function TabsList({ className, ...props }, ref) {
    return (
      <List
        ref={ref}
        className={cn(
          'border-border bg-surface text-foreground-sub inline-flex gap-1 rounded-md border p-1',
          className,
        )}
        {...props}
      />
    );
  },
);

export const TabsTrigger = forwardRef<
  ElementRef<typeof Trigger>,
  ComponentPropsWithoutRef<typeof Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
        'hover:text-foreground focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});

export const TabsContent = forwardRef<
  ElementRef<typeof Content>,
  ComponentPropsWithoutRef<typeof Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <Content
      ref={ref}
      className={cn(
        'text-foreground focus-visible:ring-accent focus-visible:ring-offset-bg mt-4 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  );
});
