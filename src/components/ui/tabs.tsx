'use client';

import { Root, List, Trigger, Content } from '@radix-ui/react-tabs';
import {
  createContext,
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';

import { cn } from '@/lib/cn';

export type TabsVariant = 'pill' | 'underline';

const TabsVariantContext = createContext<TabsVariant>('pill');

type TabsRootProps = ComponentPropsWithoutRef<typeof Root> & { variant?: TabsVariant };

export const Tabs = forwardRef<ElementRef<typeof Root>, TabsRootProps>(function Tabs(
  { variant = 'pill', children, ...props },
  ref,
) {
  return (
    <TabsVariantContext.Provider value={variant}>
      <Root ref={ref} {...props}>
        {children}
      </Root>
    </TabsVariantContext.Provider>
  );
});

const listVariantClasses: Record<TabsVariant, string> = {
  pill: 'border-border bg-surface text-foreground-sub inline-flex gap-1 rounded-md border p-1',
  underline: 'border-border text-foreground-sub flex w-full gap-s-6 border-b',
};

export const TabsList = forwardRef<ElementRef<typeof List>, ComponentPropsWithoutRef<typeof List>>(
  function TabsList({ className, ...props }, ref) {
    const variant = useContext(TabsVariantContext);
    return <List ref={ref} className={cn(listVariantClasses[variant], className)} {...props} />;
  },
);

const triggerVariantClasses: Record<TabsVariant, string> = {
  pill: cn(
    'inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
    'hover:text-foreground focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
    'data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:shadow-sm',
    'disabled:pointer-events-none disabled:opacity-50',
  ),
  underline: cn(
    'inline-flex h-12 items-center justify-center -mb-px border-b-2 border-transparent px-1 text-sm font-medium transition-colors',
    'hover:text-foreground focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
    'data-[state=active]:border-accent data-[state=active]:text-accent',
    'disabled:pointer-events-none disabled:opacity-50',
  ),
};

export const TabsTrigger = forwardRef<
  ElementRef<typeof Trigger>,
  ComponentPropsWithoutRef<typeof Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  const variant = useContext(TabsVariantContext);
  return <Trigger ref={ref} className={cn(triggerVariantClasses[variant], className)} {...props} />;
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
