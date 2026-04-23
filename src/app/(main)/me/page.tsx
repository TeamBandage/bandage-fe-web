import { PageTitle } from '@/components/layout/page-title';

export default function MyPage() {
  return (
    <div className="space-y-6">
      <PageTitle title="MY" description="프로필과 계정 설정" />
      <p className="text-foreground-sub text-sm">마이페이지는 Task 6/10에서 구현됩니다.</p>
    </div>
  );
}
