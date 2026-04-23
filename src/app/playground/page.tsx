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
  { name: 'bg-danger', className: 'bg-danger' },
  { name: 'bg-danger-dim', className: 'bg-danger-dim' },
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

      <Section title="Typography">
        <div className="bg-surface border-border space-y-1 rounded-md border p-4">
          <p className="text-foreground font-sans text-lg font-bold">Bandage · 밴드 매니저</p>
          <p className="text-foreground-sub font-sans">font-sans (Noto Sans KR · fallback chain)</p>
        </div>
      </Section>
    </main>
  );
}
