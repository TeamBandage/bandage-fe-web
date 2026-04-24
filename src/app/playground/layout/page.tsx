import { PaneDetail, PaneList, PaneSplit, Shell, Sidebar, Topbar } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Task 2 에서 추가한 Shell 레이아웃 컴포넌트의 조합 데모.
 * 960px 이상에서는 Sidebar + PaneSplit(PaneList + PaneDetail) 이 그대로 보이고,
 * 미만에서는 Sidebar 가 hidden, 내부 컨텐츠는 stacked 로 표시됩니다.
 */
export default function LayoutPlaygroundPage() {
  return (
    <div className="bg-bg text-foreground">
      <header className="border-border p-s-6 max-w-5xl border-b">
        <h1 className="text-title-lg font-bold">Shell Layout Demo</h1>
        <p className="text-foreground-sub text-caption mt-1">
          Shell / Sidebar / Topbar / PaneSplit / PaneList / PaneDetail 조합 시연. 브라우저 창 크기를
          960px 기준으로 조절하여 반응형 동작을 확인하세요.
        </p>
      </header>

      <section className="p-s-6">
        <h2 className="text-foreground-sub mb-s-3 text-micro font-semibold tracking-wide uppercase">
          Full shell composition
        </h2>
        <div
          className="border-border overflow-hidden rounded-lg border"
          style={{ height: '520px' }}
        >
          <Shell>
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Topbar
                title="합주 상세"
                breadcrumb="합주 / 2024년 4월 25일"
                actions={
                  <>
                    <Button variant="ghost" size="sm">
                      편집
                    </Button>
                    <Button variant="primary" size="sm">
                      저장
                    </Button>
                  </>
                }
              />
              <PaneSplit>
                <PaneList
                  width="list"
                  header={<div className="text-subtitle font-bold">합주 목록</div>}
                >
                  <ul className="space-y-s-2">
                    {['금요일 합주', '토요일 리허설', '공연 전 마지막 합주'].map((t) => (
                      <li key={t}>
                        <Card interactive padding="sm">
                          <div className="text-body font-semibold">{t}</div>
                          <div className="text-foreground-muted text-micro">
                            2024-04-{Math.floor(Math.random() * 28) + 1} 19:00
                          </div>
                        </Card>
                      </li>
                    ))}
                  </ul>
                </PaneList>
                <PaneDetail>
                  <div className="space-y-s-4">
                    <h3 className="text-title font-bold">토요일 리허설</h3>
                    <p className="text-foreground-sub text-body">
                      PaneDetail 내부 컨텐츠 샘플. 좌우/상하 padding 은 토큰화된{' '}
                      <code className="bg-card rounded-sm px-1">py-s-6</code> +{' '}
                      <code className="bg-card rounded-sm px-1">lg:px-7</code> 로 설정됩니다.
                    </p>
                    <Card padding="md">
                      <div className="text-body">세션 구성</div>
                    </Card>
                  </div>
                </PaneDetail>
              </PaneSplit>
            </div>
          </Shell>
        </div>
      </section>

      <section className="p-s-6">
        <h2 className="text-foreground-sub mb-s-3 text-micro font-semibold tracking-wide uppercase">
          PaneList width=&ldquo;band-list&rdquo;
        </h2>
        <div
          className="border-border overflow-hidden rounded-lg border"
          style={{ height: '320px' }}
        >
          <PaneSplit>
            <PaneList
              width="band-list"
              header={<div className="text-subtitle font-bold">밴드 (360px)</div>}
            >
              <div className="text-foreground-sub text-caption">목록 영역</div>
            </PaneList>
            <PaneDetail>
              <div className="text-foreground-sub text-body">
                밴드 목록은 360px 폭의 wider variant 를 사용합니다.
              </div>
            </PaneDetail>
          </PaneSplit>
        </div>
      </section>
    </div>
  );
}
