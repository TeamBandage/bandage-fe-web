import type { ReactNode } from 'react';

export default function PerformancesLayout({ children }: { children: ReactNode }) {
  return <div className="h-full">{children}</div>;
}
