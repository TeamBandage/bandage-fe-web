import type { Metadata } from 'next';

import { MeetingCreateWizard } from './MeetingCreateWizard.client';

export const metadata: Metadata = {
  title: '선곡 회의 생성 | Bandage',
};

export default function TrackSelectionCreatePage() {
  return <MeetingCreateWizard />;
}
