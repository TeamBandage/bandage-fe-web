'use client';

import { ArrowRight, CalendarDays, Music, Search, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StepIndicator } from '@/components/ui/step-indicator';
import { MemberAvatar } from '@/domain/setlist-meeting/components/MemberAvatar';
import {
  GLOBAL_MEMBER_POOL,
  searchMockMembers,
} from '@/domain/setlist-meeting/mock/memberSearchMock';
import {
  flattenPerformanceMembers,
  searchMockPerformances,
  type PerformanceMock,
} from '@/domain/setlist-meeting/mock/performanceSearchMock';
import { useSetlistStore } from '@/domain/setlist-meeting/store/setlistStore';
import type { Member, MeetingPurpose } from '@/domain/setlist-meeting/types';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

const STEPS = ['목적 선택', '참여 인원', '회의 정보', '확인'] as const;
type Step = 0 | 1 | 2 | 3;

type GeneralTab = 'band' | 'member';

/** 일반 모드의 mock 밴드 — 실제 도입 시 useMyBands + 검색 API 로 교체. */
const MOCK_BANDS: Array<{ bandId: string; bandName: string; memberIds: string[] }> = [
  { bandId: 'b1', bandName: 'TOOL TRIBUTE', memberIds: ['u1', 'u3', 'u4'] },
  { bandId: 'b3', bandName: '마그마', memberIds: ['u2', 'u5', 'u6'] },
  { bandId: 'b2', bandName: '체리블라썸', memberIds: ['u8', 'u9'] },
];

export function MeetingCreateWizard() {
  const router = useRouter();
  const toast = useToast();
  const addMeeting = useSetlistStore((s) => s.addMeeting);
  const currentUserId = useSetlistStore((s) => s.currentUserId);

  const [step, setStep] = useState<Step>(0);

  // Step 1
  const [purpose, setPurpose] = useState<MeetingPurpose>('performance');
  const [performance, setPerformance] = useState<PerformanceMock | null>(null);
  const [perfQuery, setPerfQuery] = useState('');

  // Step 2
  const [generalTab, setGeneralTab] = useState<GeneralTab>('band');
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null);
  const [memberQuery, setMemberQuery] = useState('');
  /** 선택된 참여 멤버 — uniq id 집합. */
  const [participantIds, setParticipantIds] = useState<string[]>([]);

  // Step 3
  const [title, setTitle] = useState('');
  const [managerId, setManagerId] = useState<string | null>(null);

  // 공연 풀 멤버 vs 일반 모드 풀 멤버.
  const performancePool = useMemo<Member[]>(
    () => (performance ? flattenPerformanceMembers(performance) : []),
    [performance],
  );
  // 공연 모드: 공연 선택 시 자동으로 풀 전체 활성화.
  const onPickPerformance = (p: PerformanceMock) => {
    setPerformance(p);
    setParticipantIds(flattenPerformanceMembers(p).map((m) => m.id));
  };

  // Step 2 일반 모드 멤버 후보 — 선택된 밴드 + 멤버 검색 결과.
  const generalCandidates = useMemo<Member[]>(() => {
    const out: Member[] = [];
    const seen = new Set<string>();
    if (selectedBandId) {
      const band = MOCK_BANDS.find((b) => b.bandId === selectedBandId);
      if (band) {
        for (const uid of band.memberIds) {
          const m = GLOBAL_MEMBER_POOL.find((x) => x.id === uid);
          if (m && !seen.has(m.id)) {
            seen.add(m.id);
            out.push(m);
          }
        }
      }
    }
    if (memberQuery.trim()) {
      for (const m of searchMockMembers(memberQuery)) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          out.push(m);
        }
      }
    }
    return out;
  }, [selectedBandId, memberQuery]);

  const toggleParticipant = (id: string) => {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Step 3 매니저 풀 — Step 2 에서 모은 참여 멤버.
  const participantMembers = useMemo<Member[]>(() => {
    return participantIds
      .map((id) => GLOBAL_MEMBER_POOL.find((m) => m.id === id))
      .filter((m): m is Member => Boolean(m));
  }, [participantIds]);

  const canNext = (() => {
    if (step === 0) return purpose === 'general' || !!performance;
    if (step === 1) return participantIds.length > 0;
    if (step === 2) return title.trim().length > 0 && !!managerId;
    return true;
  })();

  const next = () => {
    if (!canNext) {
      if (step === 0) toast.error('공연을 선택하거나 일반 회의로 진행하세요.');
      else if (step === 1) toast.error('최소 1명 이상의 참여 멤버를 선택하세요.');
      else if (step === 2) toast.error('회의 제목과 매니저를 지정하세요.');
      return;
    }
    if (step < 3) setStep((step + 1) as Step);
  };

  const back = () => step > 0 && setStep((step - 1) as Step);

  const submit = () => {
    if (!managerId) return;
    const bandLabel =
      purpose === 'performance' && performance
        ? performance.bands.map((b) => b.bandName).join(' · ')
        : selectedBandId
          ? (MOCK_BANDS.find((b) => b.bandId === selectedBandId)?.bandName ?? '회의')
          : '회의';
    const id = addMeeting({
      title: title.trim(),
      bandId: selectedBandId ?? performance?.bands[0]?.bandId ?? `local_${Date.now()}`,
      bandName: bandLabel,
      managerId,
      purpose,
      performanceId: performance?.performanceId ?? null,
      participantUserIds: participantIds,
    });
    toast.success('선곡 회의가 만들어졌습니다.');
    router.replace(ROUTES.SETLIST_MEETING_DETAIL(id));
  };

  return (
    <div
      data-slot="meeting-create-wizard"
      className="px-s-5 py-s-6 lg:px-s-8 lg:py-s-8 mx-auto max-w-3xl"
    >
      <header className="mb-s-6">
        <button
          type="button"
          onClick={() => router.push(ROUTES.SETLIST_MEETINGS)}
          className="text-foreground-muted hover:text-foreground text-caption mb-s-2"
        >
          ← 선곡 회의 목록
        </button>
        <h1 className="text-title-lg font-bold">선곡 회의 만들기</h1>
      </header>

      <StepIndicator steps={STEPS} current={step} className="mb-s-6" />

      {step === 0 && (
        <Step1Purpose
          purpose={purpose}
          setPurpose={setPurpose}
          performance={performance}
          onPickPerformance={onPickPerformance}
          perfQuery={perfQuery}
          setPerfQuery={setPerfQuery}
          onCreatePerformance={() => router.push(ROUTES.PERFORMANCE_NEW)}
        />
      )}
      {step === 1 && (
        <Step2Participants
          purpose={purpose}
          performancePool={performancePool}
          generalTab={generalTab}
          setGeneralTab={setGeneralTab}
          selectedBandId={selectedBandId}
          setSelectedBandId={setSelectedBandId}
          generalCandidates={generalCandidates}
          memberQuery={memberQuery}
          setMemberQuery={setMemberQuery}
          participantIds={participantIds}
          onToggle={toggleParticipant}
        />
      )}
      {step === 2 && (
        <Step3Info
          title={title}
          setTitle={setTitle}
          managerId={managerId}
          setManagerId={setManagerId}
          participantMembers={participantMembers}
          currentUserId={currentUserId}
        />
      )}
      {step === 3 && (
        <Step4Review
          purpose={purpose}
          performance={performance}
          selectedBandId={selectedBandId}
          participantMembers={participantMembers}
          title={title}
          managerId={managerId}
        />
      )}

      <footer className="mt-s-8 gap-s-3 flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={back} disabled={step === 0}>
          이전
        </Button>
        {step < 3 ? (
          <Button type="button" variant="primary" onClick={next} disabled={!canNext}>
            다음 <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" variant="primary" onClick={submit}>
            회의 만들기
          </Button>
        )}
      </footer>
    </div>
  );
}

// ── Step 1 ───────────────────────────────────────────────────────────
function Step1Purpose({
  purpose,
  setPurpose,
  performance,
  onPickPerformance,
  perfQuery,
  setPerfQuery,
  onCreatePerformance,
}: {
  purpose: MeetingPurpose;
  setPurpose: (p: MeetingPurpose) => void;
  performance: PerformanceMock | null;
  onPickPerformance: (p: PerformanceMock) => void;
  perfQuery: string;
  setPerfQuery: (q: string) => void;
  onCreatePerformance: () => void;
}) {
  const results = useMemo(() => searchMockPerformances(perfQuery), [perfQuery]);
  return (
    <section className="gap-s-4 flex flex-col">
      <UnderlineTabs
        value={purpose}
        onChange={(v) => setPurpose(v as MeetingPurpose)}
        items={[
          { id: 'performance', label: '공연 선곡 회의' },
          { id: 'general', label: '일반 합주 회의' },
        ]}
      />
      <p className="text-foreground-muted text-caption">
        {purpose === 'performance'
          ? '공연 셋리스트를 생성합니다. 확정 시 공연의 셋리스트 목록에 자동 등록됩니다.'
          : '합주곡 목록을 생성합니다. 확정 시 합주곡으로 벌크 생성됩니다.'}
      </p>

      {purpose === 'performance' && (
        <>
          <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 flex items-center rounded-md border">
            <Search className="text-foreground-muted h-4 w-4 shrink-0" />
            <input
              type="search"
              value={perfQuery}
              onChange={(e) => setPerfQuery(e.target.value)}
              placeholder="공연 제목 · 장소 검색"
              aria-label="공연 검색"
              className="text-body placeholder:text-foreground-muted w-full bg-transparent outline-none"
            />
          </div>
          <ul className="border-border gap-s-1 flex h-[260px] flex-col overflow-y-auto rounded-md border p-1">
            {results.length === 0 ? (
              <li className="text-foreground-muted text-caption py-s-8 text-center">
                일치하는 공연이 없습니다.
              </li>
            ) : (
              results.map((p) => {
                const active = performance?.performanceId === p.performanceId;
                return (
                  <li key={p.performanceId}>
                    <button
                      type="button"
                      onClick={() => onPickPerformance(p)}
                      className={cn(
                        'gap-s-3 px-s-3 py-s-2 hover:bg-card flex w-full items-center rounded-md text-left transition-colors',
                        active && 'bg-accent-dim border-accent/30 border',
                      )}
                    >
                      <CalendarDays className="text-foreground-muted h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-caption truncate font-bold">{p.title}</div>
                        <div className="text-foreground-muted text-micro mt-0.5 truncate">
                          {p.venue} · {p.startAt.slice(0, 16).replace('T', ' ')} ·{' '}
                          {p.bands.map((b) => b.bandName).join(', ')}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <div className="text-foreground-muted text-caption gap-s-2 flex items-center">
            등록되지 않은 공연인가요?
            <button
              type="button"
              onClick={onCreatePerformance}
              className="text-accent hover:underline"
            >
              공연 즉시 생성하기
            </button>
          </div>
        </>
      )}
    </section>
  );
}

// ── Step 2 ───────────────────────────────────────────────────────────
function Step2Participants({
  purpose,
  performancePool,
  generalTab,
  setGeneralTab,
  selectedBandId,
  setSelectedBandId,
  generalCandidates,
  memberQuery,
  setMemberQuery,
  participantIds,
  onToggle,
}: {
  purpose: MeetingPurpose;
  performancePool: Member[];
  generalTab: GeneralTab;
  setGeneralTab: (t: GeneralTab) => void;
  selectedBandId: string | null;
  setSelectedBandId: (id: string) => void;
  generalCandidates: Member[];
  memberQuery: string;
  setMemberQuery: (q: string) => void;
  participantIds: string[];
  onToggle: (id: string) => void;
}) {
  if (purpose === 'performance') {
    return (
      <section className="gap-s-3 flex flex-col">
        <p className="text-foreground-muted text-caption">
          공연 참여 밴드의 멤버 전체가 자동으로 추가됩니다. 제외할 멤버의 체크를 해제하세요.
        </p>
        <ul className="border-border gap-s-1 flex h-[360px] flex-col overflow-y-auto rounded-md border p-1">
          {performancePool.map((m) => {
            const checked = participantIds.includes(m.id);
            return (
              <li key={m.id}>
                <label className="gap-s-3 px-s-3 py-s-2 hover:bg-card flex cursor-pointer items-center rounded-md">
                  <input
                    type="checkbox"
                    className="accent-accent h-4 w-4"
                    checked={checked}
                    onChange={() => onToggle(m.id)}
                  />
                  <MemberAvatar member={m} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-caption truncate font-semibold">{m.name}</div>
                    <div className="text-foreground-muted text-micro truncate">
                      {m.email ?? m.role}
                    </div>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }
  return (
    <section className="gap-s-3 flex flex-col">
      <UnderlineTabs
        value={generalTab}
        onChange={(v) => setGeneralTab(v as GeneralTab)}
        items={[
          { id: 'band', label: '밴드 검색' },
          { id: 'member', label: '멤버 검색' },
        ]}
      />
      {generalTab === 'band' ? (
        <ul className="gap-s-1 flex flex-col">
          {MOCK_BANDS.map((b) => {
            const active = selectedBandId === b.bandId;
            return (
              <li key={b.bandId}>
                <button
                  type="button"
                  onClick={() => setSelectedBandId(b.bandId)}
                  className={cn(
                    'gap-s-3 px-s-3 py-s-2 hover:bg-card flex w-full items-center rounded-md text-left transition-colors',
                    active && 'bg-accent-dim border-accent/30 border',
                  )}
                >
                  <Users className="text-foreground-muted h-4 w-4 shrink-0" />
                  <span className="text-caption font-bold">{b.bandName}</span>
                  <span className="text-foreground-muted text-micro ml-auto">
                    멤버 {b.memberIds.length}명
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 flex items-center rounded-md border">
          <Search className="text-foreground-muted h-4 w-4 shrink-0" />
          <input
            type="search"
            value={memberQuery}
            onChange={(e) => setMemberQuery(e.target.value)}
            placeholder="이름 · 이메일로 검색"
            aria-label="멤버 검색"
            className="text-body placeholder:text-foreground-muted w-full bg-transparent outline-none"
          />
        </div>
      )}
      <div className="text-foreground-muted text-micro mt-s-2 font-semibold uppercase">
        후보 ({generalCandidates.length}) — 체크하여 참여 확정
      </div>
      <ul className="border-border gap-s-1 flex h-[260px] flex-col overflow-y-auto rounded-md border p-1">
        {generalCandidates.length === 0 ? (
          <li className="text-foreground-muted text-caption py-s-8 text-center">
            밴드 또는 멤버를 검색해 후보를 추가하세요.
          </li>
        ) : (
          generalCandidates.map((m) => {
            const checked = participantIds.includes(m.id);
            return (
              <li key={m.id}>
                <label className="gap-s-3 px-s-3 py-s-2 hover:bg-card flex cursor-pointer items-center rounded-md">
                  <input
                    type="checkbox"
                    className="accent-accent h-4 w-4"
                    checked={checked}
                    onChange={() => onToggle(m.id)}
                  />
                  <MemberAvatar member={m} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-caption truncate font-semibold">{m.name}</div>
                    <div className="text-foreground-muted text-micro truncate">
                      {m.email ?? m.role}
                    </div>
                  </div>
                </label>
              </li>
            );
          })
        )}
      </ul>
      <div className="text-foreground-sub text-caption">
        참여 확정 <strong className="text-foreground">{participantIds.length}</strong>명
      </div>
    </section>
  );
}

// ── Step 3 ───────────────────────────────────────────────────────────
function Step3Info({
  title,
  setTitle,
  managerId,
  setManagerId,
  participantMembers,
  currentUserId,
}: {
  title: string;
  setTitle: (t: string) => void;
  managerId: string | null;
  setManagerId: (id: string) => void;
  participantMembers: Member[];
  currentUserId: string;
}) {
  return (
    <section className="gap-s-4 flex flex-col">
      <Input
        label="회의 제목"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="예: 여름 페스티벌 셋리스트 회의"
      />
      <div>
        <div className="text-foreground mb-s-2 text-sm font-medium">
          매니저 지정 <span className="text-danger">*</span>
        </div>
        <div className="text-foreground-muted text-micro mb-s-2">
          매니저는 선곡 확정·해제 등 회의의 권한 액션을 수행할 수 있습니다.
        </div>
        <ul className="border-border gap-s-1 flex h-[280px] flex-col overflow-y-auto rounded-md border p-1">
          {participantMembers.map((m) => {
            const active = managerId === m.id;
            return (
              <li key={m.id}>
                <label
                  className={cn(
                    'gap-s-3 px-s-3 py-s-2 flex cursor-pointer items-center rounded-md transition-colors',
                    active ? 'bg-accent-dim border-accent/30 border' : 'hover:bg-card',
                  )}
                >
                  <input
                    type="radio"
                    name="manager"
                    className="accent-accent h-4 w-4"
                    checked={active}
                    onChange={() => setManagerId(m.id)}
                  />
                  <MemberAvatar member={m} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-caption gap-s-2 flex items-center font-semibold">
                      <span className="truncate">{m.name}</span>
                      {m.id === currentUserId && (
                        <span className="text-accent text-micro font-bold">나</span>
                      )}
                    </div>
                    <div className="text-foreground-muted text-micro truncate">
                      {m.email ?? m.role}
                    </div>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// ── Step 4 ───────────────────────────────────────────────────────────
function Step4Review({
  purpose,
  performance,
  selectedBandId,
  participantMembers,
  title,
  managerId,
}: {
  purpose: MeetingPurpose;
  performance: PerformanceMock | null;
  selectedBandId: string | null;
  participantMembers: Member[];
  title: string;
  managerId: string | null;
}) {
  const manager = participantMembers.find((m) => m.id === managerId);
  return (
    <section className="gap-s-4 flex flex-col">
      <SummaryRow icon={<Music className="h-4 w-4" />} label="목적">
        {purpose === 'performance' ? '공연 선곡 회의' : '일반 합주 회의'}
      </SummaryRow>
      {purpose === 'performance' && performance && (
        <SummaryRow icon={<CalendarDays className="h-4 w-4" />} label="공연">
          <div>
            <div className="text-caption font-bold">{performance.title}</div>
            <div className="text-foreground-muted text-micro">
              {performance.venue} · {performance.startAt.slice(0, 16).replace('T', ' ')}
            </div>
          </div>
        </SummaryRow>
      )}
      {purpose === 'general' && selectedBandId && (
        <SummaryRow icon={<Users className="h-4 w-4" />} label="기준 밴드">
          {MOCK_BANDS.find((b) => b.bandId === selectedBandId)?.bandName ?? '-'}
        </SummaryRow>
      )}
      <SummaryRow
        icon={<Users className="h-4 w-4" />}
        label={`참여 ${participantMembers.length}명`}
      >
        <div className="gap-s-2 flex flex-wrap">
          {participantMembers.map((m) => (
            <span
              key={m.id}
              className="bg-card border-border gap-s-1 px-s-2 inline-flex items-center rounded-full border py-0.5"
            >
              <MemberAvatar member={m} size="sm" />
              <span className="text-micro font-semibold">{m.name}</span>
            </span>
          ))}
        </div>
      </SummaryRow>
      <SummaryRow label="제목">
        <span className="text-caption font-bold">{title || '(미입력)'}</span>
      </SummaryRow>
      <SummaryRow label="매니저">
        {manager ? (
          <span className="gap-s-2 inline-flex items-center">
            <MemberAvatar member={manager} size="sm" />
            <span className="text-caption font-semibold">{manager.name}</span>
          </span>
        ) : (
          <span className="text-foreground-muted">미지정</span>
        )}
      </SummaryRow>
    </section>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────
function UnderlineTabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: ReadonlyArray<{ id: T; label: string }>;
}) {
  return (
    <div className="border-border gap-s-6 flex border-b">
      {items.map((it) => {
        const active = value === it.id;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            className={cn(
              'px-s-1 -mb-px h-10 border-b-2 text-sm font-semibold transition-colors',
              active
                ? 'border-accent text-accent'
                : 'text-foreground-sub hover:text-foreground border-transparent',
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border-border px-s-4 py-s-3 gap-s-3 flex items-start rounded-lg border">
      {icon && <div className="text-foreground-muted mt-0.5">{icon}</div>}
      <div className="min-w-0 flex-1">
        <div className="text-foreground-muted text-micro mb-s-1 font-bold uppercase">{label}</div>
        <div className="text-foreground">{children}</div>
      </div>
    </div>
  );
}
