import type { Metadata } from 'next';

import { ScheduleContent } from './ScheduleContent.client';

export const metadata: Metadata = {
  title: '스케줄 관리 | Bandage',
};

export default function MySchedulePage() {
  return (
    <div className="space-y-s-6 py-s-4 mx-auto w-full max-w-4xl px-2.5 lg:py-10">
      <ScheduleContent />
    </div>
  );
}
