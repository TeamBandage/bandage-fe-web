import { PageTitle } from '@/components/layout/page-title';

export default function BandsPage() {
  return (
    <div className="space-y-6">
      <PageTitle title="밴드" description="참여 중인 밴드 목록" />
      <p className="text-foreground-sub text-sm">밴드 도메인은 Task 7에서 구현됩니다.</p>
    </div>
  );
}
