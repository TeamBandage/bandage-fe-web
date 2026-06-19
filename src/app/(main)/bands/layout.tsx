import type { ReactNode } from 'react';

export default function BandsLayout({ children }: { children: ReactNode }) {
  return <div className="h-full">{children}</div>;
}
