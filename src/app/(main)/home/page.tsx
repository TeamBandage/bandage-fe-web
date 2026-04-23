import { PageTitle } from '@/components/layout/page-title';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <PageTitle title="홈" description="오늘의 합주와 공연을 한눈에 확인하세요." />
      <p className="text-foreground-sub text-sm">
        홈 대시보드는 Task 10에서 주요 위젯으로 채워집니다.
      </p>
    </div>
  );
}
