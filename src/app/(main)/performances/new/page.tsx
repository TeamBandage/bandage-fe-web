import type { Metadata } from 'next';

import { PerformanceCreateWizard } from './PerformanceCreateWizard.client';

export const metadata: Metadata = {
  title: '공연 생성 | Bandage',
};

export default function PerformanceNewPage() {
  return <PerformanceCreateWizard />;
}
