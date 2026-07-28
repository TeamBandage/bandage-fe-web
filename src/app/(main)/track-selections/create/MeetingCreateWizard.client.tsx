'use client';

import { Loader2, Search, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StepIndicator } from '@/components/ui/step-indicator';
import { WizardSummaryCard } from '@/components/ui/wizard-summary-card';
import { getBandMembers } from '@/domain/band/api/getBandMembers';
import { useBandSearch } from '@/domain/band/hooks/useBandSearch';
import { useMyBands } from '@/domain/band/hooks/useMyBands';
import type { BandInfoResponse, MyBandInfoResponse } from '@/domain/band/types';
import { getMe } from '@/domain/member/api/getMe';
import { useMe } from '@/domain/member/hooks/useMe';
import { useMemberSearch } from '@/domain/member/hooks/useMemberSearch';
import type { MemberSearchItemResponse } from '@/domain/member/types';
import { createTrackSelection } from '@/domain/track-selection/api/createTrackSelection';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

const STEPS = ['참여 인원', '회의 정보', '검토'] as const;
type Step = 0 | 1 | 2;
type BandTab = 'my-bands' | 'band-search' | 'member';

type Participant = {
  memberId: number;
  name: string;
  profileImg?: string | null;
};

export function MeetingCreateWizard() {
  const router = useRouter();
  const toast = useToast();
  const { data: me } = useMe();
  const myMemberId = me?.id;

  const [step, setStep] = useState<Step>(0);
  const [isPending, setIsPending] = useState(false);

  // Step 0 — 참여 인원
  const [bandTab, setBandTab] = useState<BandTab>('my-bands');
  const [selectedBandIds, setSelectedBandIds] = useState<string[]>([]);
  // 선택된 밴드 이름 조회용 (내 밴드 + 검색 결과 통합)
  const [selectedBandNames, setSelectedBandNames] = useState<Record<string, string>>({});
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [memberQuery, setMemberQuery] = useState('');
  const [bandQuery, setBandQuery] = useState('');
  const [importing, setImporting] = useState(false);

  // Step 1 — 회의 정보
  const [title, setTitle] = useState('');
  const [managerId, setManagerId] = useState<number | null>(null);

  // 본인은 항상 참여 인원에 기본 포함 (멤버 검색 API는 본인을 결과에서 제외).
  useEffect(() => {
    if (!me) return;
    setParticipants((prev) =>
      prev.some((p) => p.memberId === me.id)
        ? prev
        : [{ memberId: me.id, name: me.name, profileImg: me.profileImg }, ...prev],
    );
  }, [me]);

  // Real API data
  const { data: myBandsData } = useMyBands(50);
  const myBands = myBandsData?.pages.flatMap((p) => p.content) ?? [];
  const { data: memberSearchResults = [] } = useMemberSearch(memberQuery);
  const bandSearchResult = useBandSearch(bandQuery, 20);
  const bandSearchItems = bandSearchResult.data?.pages.flatMap((p) => p.content) ?? [];

  const canNext = (() => {
    // 밴드는 선택 사항 — 밴드 없이 멤버만으로도 회의를 만들 수 있음. 참여 멤버는 최소 1명 필요.
    if (step === 0) return participants.length > 0;
    if (step === 1) return title.trim().length > 0 && managerId !== null;
    return true;
  })();

  const next = () => {
    if (!canNext) {
      if (step === 0) {
        toast.error('최소 1명 이상의 참여 멤버를 추가하세요.');
      } else if (step === 1) {
        if (!title.trim()) toast.error('회의 제목을 입력하세요.');
        else toast.error('매니저를 지정하세요.');
      }
      return;
    }
    if (step < 2) setStep((step + 1) as Step);
  };

  const back = () => step > 0 && setStep((step - 1) as Step);

  const toggleBand = (band: Pick<BandInfoResponse, 'bandId' | 'bandName'>) => {
    const { bandId, bandName } = band;
    setSelectedBandIds((prev) =>
      prev.includes(bandId) ? prev.filter((id) => id !== bandId) : [...prev, bandId],
    );
    setSelectedBandNames((prev) => ({ ...prev, [bandId]: bandName }));
  };

  const importBandMembers = async () => {
    if (selectedBandIds.length === 0) return;
    setImporting(true);
    try {
      const results = await Promise.all(
        selectedBandIds.map((id) => getBandMembers(id, { pageSize: 100 })),
      );
      const raw: Participant[] = results.flatMap((r) =>
        r.content.map((m) => {
          // 본인 항목은 useMe() 데이터로 name/profileImg 보정 (백엔드 FE-API-012 미지원 대응)
          const isMe = me && m.memberId === me.id;
          return {
            memberId: m.memberId,
            name: isMe ? me.name : (m.name ?? `멤버 #${m.memberId}`),
            profileImg: isMe ? (me.profileImg ?? m.profileImg) : m.profileImg,
          };
        }),
      );
      // 여러 밴드 선택 시 incoming 내 중복 제거
      const incomingMap = new Map<number, Participant>();
      for (const m of raw) {
        if (!incomingMap.has(m.memberId)) incomingMap.set(m.memberId, m);
      }
      // 백엔드가 리더/생성자를 members 목록에서 제외하는 경우 자동 추가
      // me가 null/undefined이면 직접 API 호출로 보장
      const currentUser = me ?? (await getMe());
      if (currentUser && !incomingMap.has(currentUser.id)) {
        incomingMap.set(currentUser.id, {
          memberId: currentUser.id,
          name: currentUser.name,
          profileImg: currentUser.profileImg,
        });
      }
      setParticipants((prev) => {
        const existing = new Set(prev.map((p) => p.memberId));
        const toAdd = Array.from(incomingMap.values()).filter((m) => !existing.has(m.memberId));
        return [...prev, ...toAdd];
      });
      toast.success('멤버를 추가했습니다.');
    } catch {
      toast.error('멤버 불러오기에 실패했습니다.');
    } finally {
      setImporting(false);
    }
  };

  const addParticipant = (m: MemberSearchItemResponse) => {
    setParticipants((prev) =>
      prev.some((p) => p.memberId === m.memberId)
        ? prev
        : [...prev, { memberId: m.memberId, name: m.name, profileImg: m.profileImg }],
    );
  };

  const removeParticipant = (memberId: number) => {
    setParticipants((prev) => prev.filter((p) => p.memberId !== memberId));
    if (managerId === memberId) setManagerId(null);
  };

  const submit = async () => {
    if (managerId === null || isPending) return;
    setIsPending(true);
    try {
      const res = await createTrackSelection({
        title: title.trim(),
        bandIds: selectedBandIds,
        managerId,
        participantUserIds: participants.map((p) => p.memberId),
      });
      toast.success('선곡 회의가 만들어졌습니다.');
      router.replace(ROUTES.TRACK_SELECTION_DETAIL(res.selectionId));
    } catch (err) {
      const message = err instanceof Error ? err.message : '선곡 생성에 실패했습니다.';
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div data-slot="meeting-create-wizard" className="p-s-4 mx-auto w-full max-w-3xl lg:py-10">
      <header className="mb-s-6">
        <h1 className="text-title font-bold">선곡 회의 생성</h1>
      </header>

      <StepIndicator steps={STEPS} current={step} className="mb-s-6" colorScheme="white" />

      {step === 0 && (
        <StepParticipants
          myBands={myBands}
          bandTab={bandTab}
          setBandTab={setBandTab}
          selectedBandIds={selectedBandIds}
          onToggleBand={toggleBand}
          onImportBandMembers={importBandMembers}
          importing={importing}
          selectedBandNames={selectedBandNames}
          bandQuery={bandQuery}
          setBandQuery={setBandQuery}
          bandSearchItems={bandSearchItems}
          bandSearchLoading={bandSearchResult.isFetching}
          memberQuery={memberQuery}
          setMemberQuery={setMemberQuery}
          memberSearchResults={memberSearchResults}
          participants={participants}
          onAddParticipant={addParticipant}
          onRemoveParticipant={removeParticipant}
          myMemberId={myMemberId}
          myName={me?.name}
          myProfileImg={me?.profileImg}
        />
      )}
      {step === 1 && (
        <StepInfo
          title={title}
          setTitle={setTitle}
          managerId={managerId}
          setManagerId={setManagerId}
          participants={participants}
          myMemberId={myMemberId}
        />
      )}
      {step === 2 && (
        <StepReview
          selectedBandNames={selectedBandNames}
          selectedBandIds={selectedBandIds}
          participants={participants}
          title={title}
          managerId={managerId}
          setStep={setStep}
        />
      )}

      <footer className="mt-s-8 gap-s-3 flex items-center justify-between">
        {step > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={back} className="rounded-[5px]">
            이전
          </Button>
        ) : (
          <span />
        )}
        {step < 2 ? (
          <Button
            type="button"
            size="sm"
            onClick={next}
            disabled={!canNext}
            className="rounded-[5px] bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30"
          >
            다음
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={submit}
            disabled={isPending}
            className="rounded-[5px] bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30"
          >
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" />
                생성 중…
              </span>
            ) : (
              '회의 만들기'
            )}
          </Button>
        )}
      </footer>
    </div>
  );
}

// ── Step 0 — 참여 인원 ────────────────────────────────────────────────
function StepParticipants({
  myBands,
  bandTab,
  setBandTab,
  selectedBandIds,
  onToggleBand,
  onImportBandMembers,
  importing,
  selectedBandNames,
  bandQuery,
  setBandQuery,
  bandSearchItems,
  bandSearchLoading,
  memberQuery,
  setMemberQuery,
  memberSearchResults,
  participants,
  onAddParticipant,
  onRemoveParticipant,
  myMemberId,
  myName,
  myProfileImg,
}: {
  myBands: MyBandInfoResponse[];
  bandTab: BandTab;
  setBandTab: (t: BandTab) => void;
  selectedBandIds: string[];
  selectedBandNames: Record<string, string>;
  onToggleBand: (band: Pick<BandInfoResponse, 'bandId' | 'bandName'>) => void;
  onImportBandMembers: () => Promise<void>;
  importing: boolean;
  bandQuery: string;
  setBandQuery: (q: string) => void;
  bandSearchItems: BandInfoResponse[];
  bandSearchLoading: boolean;
  memberQuery: string;
  setMemberQuery: (q: string) => void;
  memberSearchResults: MemberSearchItemResponse[];
  participants: Participant[];
  onAddParticipant: (m: MemberSearchItemResponse) => void;
  onRemoveParticipant: (memberId: number) => void;
  myMemberId?: number;
  myName?: string;
  myProfileImg?: string | null;
}) {
  const participantSet = new Set(participants.map((p) => p.memberId));

  const BandCheckList = ({
    bands,
  }: {
    bands: Array<Pick<BandInfoResponse, 'bandId' | 'bandName'>>;
  }) => (
    <ul className="gap-s-1 flex flex-col">
      {bands.map((b) => {
        const active = selectedBandIds.includes(b.bandId);
        return (
          <li key={b.bandId}>
            <label
              className={cn(
                'gap-s-3 px-s-3 py-s-2 hover:bg-card flex w-full cursor-pointer items-center rounded-md text-left transition-colors',
                active && 'border border-white/30 bg-white/10',
              )}
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-white"
                checked={active}
                onChange={() => onToggleBand(b)}
              />
              <Users className="text-foreground-muted h-4 w-4 shrink-0" />
              <span className="text-caption font-bold">{b.bandName}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );

  return (
    <section className="gap-s-3 flex flex-col">
      <UnderlineTabs
        value={bandTab}
        onChange={(v) => setBandTab(v as BandTab)}
        items={[
          { id: 'my-bands', label: '내 밴드' },
          { id: 'band-search', label: '밴드 검색' },
          { id: 'member', label: '멤버 검색' },
        ]}
      />

      {/* ── 내 밴드 ── */}
      {bandTab === 'my-bands' && (
        <>
          <p className="text-foreground-muted text-caption">
            여러 밴드를 다중 선택 후 &lsquo;선택 밴드 멤버 추가&rsquo;로 일괄 추가하세요.
          </p>
          {myBands.length === 0 ? (
            <p className="text-foreground-muted text-caption py-s-6 text-center">
              소속된 밴드가 없습니다.
            </p>
          ) : (
            <BandCheckList bands={myBands} />
          )}
        </>
      )}

      {/* ── 밴드 검색 ── */}
      {bandTab === 'band-search' && (
        <>
          <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 flex items-center rounded-md border">
            <Search className="text-foreground-muted h-4 w-4 shrink-0" />
            <input
              type="search"
              value={bandQuery}
              onChange={(e) => setBandQuery(e.target.value)}
              placeholder="밴드명으로 검색"
              aria-label="밴드 검색"
              className="text-body placeholder:text-foreground-muted w-full bg-transparent outline-none"
            />
            {bandSearchLoading && (
              <Loader2 className="text-foreground-muted h-4 w-4 animate-spin" />
            )}
          </div>
          {!bandQuery.trim() ? (
            <p className="text-foreground-muted text-caption py-s-4 text-center">
              밴드명을 입력하면 검색 결과가 나타납니다.
            </p>
          ) : bandSearchItems.length === 0 && !bandSearchLoading ? (
            <p className="text-foreground-muted text-caption py-s-4 text-center">
              일치하는 밴드가 없습니다.
            </p>
          ) : (
            <BandCheckList bands={bandSearchItems} />
          )}
        </>
      )}

      {/* 밴드 탭 공통 — 선택된 밴드 칩 + 멤버 추가 버튼 */}
      {(bandTab === 'my-bands' || bandTab === 'band-search') && selectedBandIds.length > 0 && (
        <div className="border-border px-s-3 py-s-2 gap-s-2 flex flex-wrap items-center rounded-md border border-dashed">
          <span className="text-foreground-muted text-micro font-bold">선택된 밴드</span>
          {selectedBandIds.map((id) => (
            <span
              key={id}
              className="gap-s-1 px-s-2 inline-flex items-center rounded-full border border-white/30 bg-white/10 py-0.5 text-xs font-semibold text-white"
            >
              {selectedBandNames[id] ?? id}
              <button
                type="button"
                onClick={() => onToggleBand({ bandId: id, bandName: selectedBandNames[id] ?? id })}
                aria-label={`${selectedBandNames[id] ?? id} 선택 해제`}
                className="hover:text-danger ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {(bandTab === 'my-bands' || bandTab === 'band-search') && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onImportBandMembers}
          disabled={selectedBandIds.length === 0 || importing}
        >
          {importing ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              불러오는 중…
            </span>
          ) : (
            `선택 밴드 멤버 추가 (${selectedBandIds.length}개 밴드)`
          )}
        </Button>
      )}

      {/* ── 멤버 검색 ── */}
      {bandTab === 'member' && (
        <>
          {/* 본인은 API에서 제외되므로 별도 버튼으로 추가 */}
          {myMemberId !== undefined && !participantSet.has(myMemberId) && (
            <button
              type="button"
              onClick={() =>
                onAddParticipant({
                  memberId: myMemberId,
                  name: myName ?? '나',
                  email: '',
                  profileImg: myProfileImg ?? null,
                })
              }
              className="gap-s-2 px-s-3 py-s-2 flex w-full items-center rounded-md border border-white/30 bg-white/10 text-sm transition-colors hover:bg-white/20"
            >
              <span className="font-bold text-white">+ 나 추가</span>
              <span className="text-foreground-muted text-micro font-normal">
                {myName ? `(${myName})` : ''} 본인은 검색 결과에 포함되지 않아요
              </span>
            </button>
          )}
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
          <div className="border-border h-50 overflow-y-auto rounded-md border">
            {!memberQuery.trim() ? (
              <div className="text-foreground-muted text-caption px-s-4 py-s-8 text-center">
                이름 또는 이메일로 검색하세요.
              </div>
            ) : memberSearchResults.length === 0 ? (
              <div className="text-foreground-muted text-caption px-s-4 py-s-8 text-center">
                일치하는 멤버가 없습니다.
              </div>
            ) : (
              <ul>
                {memberSearchResults.map((m) => {
                  const added = participantSet.has(m.memberId);
                  return (
                    <li key={m.memberId}>
                      <button
                        type="button"
                        onClick={() => onAddParticipant(m)}
                        disabled={added}
                        className="hover:bg-card border-border px-s-3 py-s-2 gap-s-3 flex w-full items-center border-b text-left last:border-b-0 disabled:cursor-default"
                      >
                        <Avatar src={m.profileImg ?? undefined} fallback={m.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="text-caption truncate font-semibold">{m.name}</div>
                          <div className="text-foreground-muted text-micro truncate">{m.email}</div>
                        </div>
                        <span
                          className={cn(
                            'text-micro px-s-2 shrink-0 rounded-full py-0.5 font-bold',
                            added ? 'bg-success-dim text-success' : 'bg-white/10 text-white',
                          )}
                        >
                          {added ? '추가됨' : '+ 추가'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {/* 참여 확정 풀 */}
      <div className="border-border mt-s-2 px-s-3 py-s-3 rounded-md border">
        <div className="text-foreground-muted text-micro mb-s-2 font-bold uppercase">
          참여 확정 ({participants.length})
        </div>
        {participants.length === 0 ? (
          <p className="text-foreground-muted text-caption">
            밴드 선택 후 &lsquo;멤버 추가&rsquo; 버튼을 누르거나 멤버 검색으로 직접 추가하세요.
          </p>
        ) : (
          <ul className="gap-s-2 flex flex-wrap">
            {participants.map((p) => (
              <li
                key={p.memberId}
                className={cn(
                  'bg-card border-border gap-s-1 px-s-2 inline-flex items-center rounded-full border py-0.5',
                  p.memberId === myMemberId && 'border-white/40 bg-white/10',
                )}
              >
                <Avatar src={p.profileImg ?? undefined} fallback={p.name} size="sm" />
                <span className="text-micro font-semibold">{p.name}</span>
                {p.memberId === myMemberId && (
                  <span className="text-micro font-bold text-white">나</span>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveParticipant(p.memberId)}
                  aria-label={`${p.name} 제거`}
                  className="text-foreground-muted hover:text-danger ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ── Step 1 — 회의 정보 ────────────────────────────────────────────────
function StepInfo({
  title,
  setTitle,
  managerId,
  setManagerId,
  participants,
  myMemberId,
}: {
  title: string;
  setTitle: (t: string) => void;
  managerId: number | null;
  setManagerId: (id: number) => void;
  participants: Participant[];
  myMemberId?: number;
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
          매니저는 선곡 확정·해제 등 회의 권한 액션을 수행합니다.
        </div>
        <ul className="border-border gap-s-1 flex max-h-70 flex-col overflow-y-auto rounded-md border p-1">
          {participants.map((p) => {
            const active = managerId === p.memberId;
            return (
              <li key={p.memberId}>
                <label
                  className={cn(
                    'gap-s-3 px-s-3 py-s-2 flex cursor-pointer items-center rounded-md transition-colors',
                    active ? 'border border-white/30 bg-white/10' : 'hover:bg-card',
                  )}
                >
                  <input
                    type="radio"
                    name="manager"
                    className="h-4 w-4 accent-white"
                    checked={active}
                    onChange={() => setManagerId(p.memberId)}
                  />
                  <Avatar src={p.profileImg ?? undefined} fallback={p.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-caption gap-s-2 flex items-center font-semibold">
                      <span className="truncate">{p.name}</span>
                      {p.memberId === myMemberId && (
                        <span className="text-micro font-bold text-white">나</span>
                      )}
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

// ── Step 2 — 검토 ────────────────────────────────────────────────────
function StepReview({
  selectedBandNames,
  selectedBandIds,
  participants,
  title,
  managerId,
  setStep,
}: {
  selectedBandNames: Record<string, string>;
  selectedBandIds: string[];
  participants: Participant[];
  title: string;
  managerId: number | null;
  setStep: (step: Step) => void;
}) {
  const manager = participants.find((p) => p.memberId === managerId);
  const bandNames = selectedBandIds.map((id) => selectedBandNames[id] ?? id);

  return (
    <section className="space-y-s-4">
      <h2 className="text-foreground-sub text-base font-semibold">아래 내용을 확인해주세요</h2>
      <WizardSummaryCard
        sections={[
          ...(bandNames.length > 0
            ? [{ label: '선택 밴드', value: bandNames.join(' · '), onEdit: () => setStep(0) }]
            : []),
          {
            label: `참여 인원 (${participants.length}명)`,
            value: (
              <div className="gap-s-2 flex flex-wrap">
                {participants.map((p) => (
                  <span
                    key={p.memberId}
                    className="bg-card border-border gap-s-1 px-s-2 inline-flex items-center rounded-full border py-0.5"
                  >
                    <Avatar src={p.profileImg ?? undefined} fallback={p.name} size="sm" />
                    <span className="text-micro font-semibold">{p.name}</span>
                  </span>
                ))}
              </div>
            ),
            onEdit: () => setStep(0),
          },
          { label: '제목', value: title || '(미입력)', onEdit: () => setStep(1) },
          {
            label: '매니저',
            value: manager ? (
              <span className="gap-s-2 inline-flex items-center">
                <Avatar src={manager.profileImg ?? undefined} fallback={manager.name} size="sm" />
                <span className="text-caption font-semibold">{manager.name}</span>
              </span>
            ) : (
              <span className="text-foreground-muted">미지정</span>
            ),
            onEdit: () => setStep(1),
          },
        ]}
      />
      <p className="text-foreground-muted text-caption">
        확정 버튼을 눌러야 실제로 회의가 생성됩니다.
      </p>
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
                ? 'border-white text-white'
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
