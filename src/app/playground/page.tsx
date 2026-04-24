import type { ReactNode } from 'react';

type Swatch = { name: string; className: string; note?: string };

const surfaceSwatches: Swatch[] = [
  { name: 'bg-bg', className: 'bg-bg' },
  { name: 'bg-surface', className: 'bg-surface' },
  { name: 'bg-card', className: 'bg-card' },
  { name: 'bg-card-hover', className: 'bg-card-hover' },
  { name: 'bg-border', className: 'bg-border' },
  { name: 'bg-border-hi', className: 'bg-border-hi' },
];

const accentSwatches: Swatch[] = [
  { name: 'bg-accent', className: 'bg-accent' },
  { name: 'bg-accent-hi', className: 'bg-accent-hi' },
  { name: 'bg-accent-dim', className: 'bg-accent-dim' },
  { name: 'bg-accent-soft', className: 'bg-accent-soft' },
];

const semanticSwatches: Swatch[] = [
  { name: 'bg-success', className: 'bg-success' },
  { name: 'bg-success-dim', className: 'bg-success-dim' },
  { name: 'bg-warn', className: 'bg-warn' },
  { name: 'bg-warn-dim', className: 'bg-warn-dim' },
  { name: 'bg-amber', className: 'bg-amber' },
  { name: 'bg-amber-dim', className: 'bg-amber-dim' },
  { name: 'bg-danger', className: 'bg-danger' },
  { name: 'bg-danger-dim', className: 'bg-danger-dim' },
];

const spacingScale: { name: string; token: string; px: number }[] = [
  { name: 's-1', token: '--spacing-s-1', px: 4 },
  { name: 's-2', token: '--spacing-s-2', px: 8 },
  { name: 's-3', token: '--spacing-s-3', px: 12 },
  { name: 's-4', token: '--spacing-s-4', px: 16 },
  { name: 's-5', token: '--spacing-s-5', px: 20 },
  { name: 's-6', token: '--spacing-s-6', px: 24 },
  { name: 's-8', token: '--spacing-s-8', px: 32 },
  { name: 's-10', token: '--spacing-s-10', px: 40 },
  { name: 's-12', token: '--spacing-s-12', px: 48 },
];

const typographyScale: { name: string; className: string; px: number; usage: string }[] = [
  { name: 'text-display', className: 'text-display', px: 40, usage: 'Auth 브랜드 타이틀' },
  { name: 'text-title-lg', className: 'text-title-lg', px: 26, usage: '페이지 대제목, Auth form' },
  { name: 'text-title', className: 'text-title', px: 20, usage: '섹션 제목, Sidebar title' },
  { name: 'text-subtitle', className: 'text-subtitle', px: 18, usage: 'Topbar title' },
  { name: 'text-body', className: 'text-body', px: 14, usage: '본문 기본' },
  { name: 'text-caption', className: 'text-caption', px: 13, usage: '보조 텍스트, 메타' },
  { name: 'text-micro', className: 'text-micro', px: 11, usage: '라벨, 힌트' },
];

const layoutWidths: { token: string; px: number; usage: string }[] = [
  { token: '--sidebar-w', px: 240, usage: 'Sidebar 고정 너비' },
  { token: '--list-pane-w', px: 340, usage: 'Master-Detail 목록 패널' },
  { token: '--band-list-pane-w', px: 360, usage: '밴드 목록 패널 (넓은 버전)' },
];

const breakpointScale: { token: string; name: string; px: number; tailwindPrefix: string }[] = [
  { token: '--breakpoint-sm', name: 'sm', px: 480, tailwindPrefix: 'sm:' },
  { token: '--breakpoint-md', name: 'md', px: 768, tailwindPrefix: 'md:' },
  { token: '--breakpoint-lg', name: 'lg', px: 960, tailwindPrefix: 'lg:' },
  { token: '--breakpoint-xl', name: 'xl', px: 1280, tailwindPrefix: 'xl:' },
];

const roleSwatches: Swatch[] = [
  { name: 'bg-role-leader', className: 'bg-role-leader' },
  { name: 'bg-role-admin', className: 'bg-role-admin' },
  { name: 'bg-role-member', className: 'bg-role-member' },
];

const radii: { name: string; className: string }[] = [
  { name: 'rounded-sm', className: 'rounded-sm' },
  { name: 'rounded-md', className: 'rounded-md' },
  { name: 'rounded-lg', className: 'rounded-lg' },
  { name: 'rounded-xl', className: 'rounded-xl' },
  { name: 'rounded-pill', className: 'rounded-pill' },
];

const shadows: { name: string; className: string }[] = [
  { name: 'shadow-sm', className: 'shadow-sm' },
  { name: 'shadow-md', className: 'shadow-md' },
  { name: 'shadow-lg', className: 'shadow-lg' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-foreground-sub text-sm font-semibold tracking-wide uppercase">{title}</h2>
      {children}
    </section>
  );
}

function SwatchGrid({ items }: { items: Swatch[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.name} className="border-border bg-surface overflow-hidden rounded-md border">
          <div className={`${item.className} h-16 w-full`} />
          <div className="px-3 py-2">
            <div className="text-foreground text-sm font-medium">{item.name}</div>
            {item.note && <div className="text-foreground-muted text-xs">{item.note}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-10 p-6">
      <header className="space-y-2">
        <h1 className="text-foreground text-2xl font-bold">Design Token Playground</h1>
        <p className="text-foreground-sub text-sm">
          Bandage 디자인 토큰이 Tailwind v4 @theme을 통해 올바르게 노출되는지 확인하는 페이지.
        </p>
      </header>

      <Section title="Surfaces">
        <SwatchGrid items={surfaceSwatches} />
      </Section>

      <Section title="Text">
        <div className="bg-surface border-border space-y-2 rounded-md border p-4">
          <p className="text-foreground">text-foreground — 본문 기본 텍스트</p>
          <p className="text-foreground-sub">text-foreground-sub — 보조 텍스트</p>
          <p className="text-foreground-muted">text-foreground-muted — 비활성/힌트</p>
        </div>
      </Section>

      <Section title="Accent">
        <SwatchGrid items={accentSwatches} />
      </Section>

      <Section title="Semantic">
        <SwatchGrid items={semanticSwatches} />
      </Section>

      <Section title="Role">
        <SwatchGrid items={roleSwatches} />
      </Section>

      <Section title="Radii">
        <div className="flex flex-wrap gap-4">
          {radii.map((r) => (
            <div key={r.name} className="flex flex-col items-center gap-2">
              <div className={`bg-card-hover h-16 w-16 ${r.className}`} />
              <span className="text-foreground-sub text-xs">{r.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Shadows">
        <div className="flex flex-wrap gap-4">
          {shadows.map((s) => (
            <div key={s.name} className="flex flex-col items-center gap-2">
              <div className={`bg-card h-16 w-24 rounded-md ${s.className}`} />
              <span className="text-foreground-sub text-xs">{s.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Animations">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="bg-card border-border animate-fade-in rounded-md border p-4">
            <div className="text-foreground text-sm font-medium">animate-fade-in</div>
            <div className="text-foreground-muted text-xs">페이지 진입/카드 등장</div>
          </div>
          <div className="bg-card border-border animate-modal-in rounded-md border p-4">
            <div className="text-foreground text-sm font-medium">animate-modal-in</div>
            <div className="text-foreground-muted text-xs">모달 오픈</div>
          </div>
          <div className="bg-card border-border rounded-md border p-4">
            <div className="flex items-center gap-2">
              <div className="border-border-hi border-t-accent rounded-pill h-5 w-5 animate-spin border-2" />
              <span className="text-foreground text-sm font-medium">animate-spin</span>
            </div>
            <div className="text-foreground-muted mt-1 text-xs">로딩 스피너</div>
          </div>
        </div>
      </Section>

      <Section title="Typography Scale">
        <div className="bg-surface border-border space-y-3 rounded-md border p-4">
          {typographyScale.map((t) => (
            <div key={t.name} className="flex items-baseline gap-3">
              <p className={`${t.className} text-foreground flex-1`}>{t.name} — 한글 샘플</p>
              <span className="text-foreground-muted text-xs tabular-nums">{t.px}px</span>
              <span className="text-foreground-sub w-40 text-xs">{t.usage}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Font">
        <div className="bg-surface border-border space-y-1 rounded-md border p-4">
          <p className="text-foreground font-sans text-lg font-bold">Bandage · 밴드 매니저</p>
          <p className="text-foreground-sub font-sans">font-sans (Noto Sans KR · fallback chain)</p>
        </div>
      </Section>

      <Section title="Spacing Scale">
        <div className="bg-surface border-border space-y-2 rounded-md border p-4">
          {spacingScale.map((s) => (
            <div key={s.name} className="flex items-center gap-3">
              <span className="text-foreground-sub w-12 text-xs">{s.name}</span>
              <div
                className="bg-accent-dim border-accent/30 h-4 border"
                style={{ width: `${s.px}px` }}
              />
              <span className="text-foreground-muted w-12 text-xs tabular-nums">{s.px}px</span>
              <span className="text-foreground-muted font-mono text-xs">{s.token}</span>
            </div>
          ))}
          <p className="text-foreground-muted pt-2 text-xs">
            Tailwind 클래스로 <code className="bg-card rounded-sm px-1">p-s-4</code>,{' '}
            <code className="bg-card rounded-sm px-1">m-s-2</code>,{' '}
            <code className="bg-card rounded-sm px-1">gap-s-6</code> 등으로 사용.
          </p>
        </div>
      </Section>

      <Section title="Layout Widths">
        <div className="bg-surface border-border space-y-2 overflow-x-auto rounded-md border p-4">
          {layoutWidths.map((l) => (
            <div key={l.token} className="flex items-center gap-3">
              <div
                className="bg-accent-soft border-border-hi h-6 border"
                style={{ width: `${l.px}px` }}
              />
              <span className="text-foreground-muted w-16 text-xs tabular-nums">{l.px}px</span>
              <span className="text-foreground-muted font-mono text-xs">{l.token}</span>
              <span className="text-foreground-sub text-xs">{l.usage}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Breakpoints">
        <div className="bg-surface border-border space-y-2 rounded-md border p-4">
          {breakpointScale.map((b) => (
            <div key={b.name} className="flex items-center gap-3 text-sm">
              <span className="bg-accent-dim text-accent rounded-sm px-2 py-0.5 font-mono text-xs">
                {b.tailwindPrefix}
              </span>
              <span className="text-foreground-muted font-mono text-xs">{b.token}</span>
              <span className="text-foreground tabular-nums">{b.px}px 이상에서 활성화</span>
            </div>
          ))}
          <p className="text-foreground-muted pt-2 text-xs">
            디자인 원본 기준 <code className="bg-card rounded-sm px-1">lg:</code> 가 960px 로 동작.
            Tailwind 기본값(1024px) 보다 좁은 태블릿 가로모드에서 데스크톱 레이아웃이 활성화됩니다.
          </p>
        </div>
      </Section>

      <Section title="Auth Brand Gradient">
        <div className="bg-surface border-border rounded-md border p-4">
          <div
            className="relative h-32 w-full overflow-hidden rounded-md"
            style={{ backgroundImage: 'var(--gradient-auth-brand)' }}
          >
            <span className="text-foreground absolute bottom-2 left-3 font-mono text-xs">
              --gradient-auth-brand
            </span>
          </div>
          <p className="text-foreground-muted mt-2 text-xs">
            <code className="bg-card rounded-sm px-1">
              style=&#123;&#123; backgroundImage: &apos;var(--gradient-auth-brand)&apos;
              &#125;&#125;
            </code>{' '}
            로 소비.
          </p>
        </div>
      </Section>
    </main>
  );
}
