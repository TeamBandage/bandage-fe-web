import type { Metadata } from 'next';

import { MeetingCreateWizard } from './MeetingCreateWizard.client';

export const metadata: Metadata = {
  title: '선곡 회의 만들기 | Bandage',
};

export default function SetlistMeetingNewPage() {
  return <MeetingCreateWizard />;
}
