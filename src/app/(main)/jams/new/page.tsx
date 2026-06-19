import type { Metadata } from 'next';

import { JamCreateWizard } from './JamCreateWizard.client';

export const metadata: Metadata = {
  title: '합주 시작하기 | Bandage',
};

export default function PracticeNewPage() {
  return <JamCreateWizard />;
}
