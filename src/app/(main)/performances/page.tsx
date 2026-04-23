import { PageTitle } from '@/components/layout/page-title';

export default function PerformancesPage() {
  return (
    <div className="space-y-6">
      <PageTitle title="공연" description="공연 일정과 신청 현황" />
      <p className="text-foreground-sub text-sm">공연 도메인은 Task 9에서 구현됩니다.</p>
    </div>
  );
}
