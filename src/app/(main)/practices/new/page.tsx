import type { Metadata } from 'next';

import { PracticeCreateWizard } from './PracticeCreateWizard.client';

export const metadata: Metadata = {
  title: '합주 시작하기 | Bandage',
};

export default function PracticeNewPage() {
  return <PracticeCreateWizard />;
}
