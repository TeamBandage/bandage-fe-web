/**
 * 합주 일정 조율 mock 시드 — TOOL TRIBUTE '10,000 Days 전곡 합주 프로젝트' (mt1) 의
 * 7명 멤버에 대한 가상의 가용 일정. 개발자 직접 검토용.
 *
 * 실제 API 도입 시 이 시드는 사용되지 않음. 잠금 없는 fresh localStorage 에서만 적용.
 */
import { enumerateDays } from '../utils';
import type { MemberSchedule, SlotMask } from '../types';

const MEETING_ID = 'mt1';
const PRACTICE_FROM = '2026-04-26';
const PRACTICE_TO = '2026-05-17';
const ALL_DAYS = enumerateDays(PRACTICE_FROM, PRACTICE_TO);
const UPDATED_AT = '2026-04-25T18:00:00Z';

/** 시간 범위(시 단위, end 비포함) → 30분 슬롯 boolean[48]. 예: makeMask([19, 22]) = 19:00~22:00. */
function makeMask(...ranges: ReadonlyArray<readonly [number, number]>): SlotMask {
  const m: SlotMask = Array.from({ length: 48 }, () => false);
  for (const [s, e] of ranges) {
    for (let i = s * 2; i < e * 2; i++) m[i] = true;
  }
  return m;
}

const isWeekend = (d: string) => {
  const day = new Date(`${d}T00:00:00`).getDay();
  return day === 0 || day === 6;
};

interface BuildOpts {
  weekday?: SlotMask;
  weekend?: SlotMask;
  /** true 면 평일 일자만 선택. */
  weekdayOnly?: boolean;
  /** true 면 주말 일자만 선택. */
  weekendOnly?: boolean;
  /** 특정 일자 강제 제외 (예: 'YYYY-MM-DD'). */
  exclude?: ReadonlyArray<string>;
  note?: string;
  completed?: boolean;
}

function build(userId: string, opts: BuildOpts): MemberSchedule {
  const dates: string[] = [];
  const blocks: Record<string, SlotMask> = {};
  for (const d of ALL_DAYS) {
    if (opts.exclude?.includes(d)) continue;
    const we = isWeekend(d);
    if (opts.weekdayOnly && we) continue;
    if (opts.weekendOnly && !we) continue;
    dates.push(d);
    const mask = we
      ? (opts.weekend ?? opts.weekday ?? makeMask([19, 22]))
      : (opts.weekday ?? opts.weekend ?? makeMask([19, 22]));
    blocks[d] = mask;
  }
  return {
    meetingId: MEETING_ID,
    userId,
    availableDates: dates,
    unavailableDates: [],
    blocks,
    note: opts.note ?? '',
    completed: opts.completed ?? false,
    updatedAt: UPDATED_AT,
  };
}

/** mt1 회의의 7명 멤버 mock 일정 — 다양한 패턴으로 종합 매트릭스가 의미 있게 보이도록. */
export const SEED_SCHEDULES: MemberSchedule[] = [
  // u1 정선우 (매니저, 기타) — 평일 저녁 + 주말 종일. 입력 완료.
  build('u1', {
    weekday: makeMask([19, 22]),
    weekend: makeMask([13, 22]),
    note: '평일 저녁만, 토/일은 오후 1시부터 가능합니다.',
    completed: true,
  }),
  // u2 신선경 (베이스) — 화/목 + 주말 위주.
  build('u2', {
    weekday: makeMask([19, 22]),
    weekend: makeMask([10, 22]),
    exclude: ['2026-04-27', '2026-04-29', '2026-05-01', '2026-05-04', '2026-05-06', '2026-05-08'],
    note: '월수금 출장. 화/목 가능, 주말은 종일 비교적 자유.',
    completed: true,
  }),
  // u3 지범준 (기타) — 매일 저녁. 입력 중.
  build('u3', {
    weekday: makeMask([18, 22]),
    weekend: makeMask([15, 22]),
    note: '저녁 시간만 가능합니다.',
    completed: false,
  }),
  // u4 안성진 (보컬) — 주말만.
  build('u4', {
    weekendOnly: true,
    weekend: makeMask([13, 21]),
    note: '평일은 본업 일정으로 어렵습니다. 주말 오후~저녁만 가능.',
    completed: true,
  }),
  // u5 이동후 (드럼) — 평일 저녁만.
  build('u5', {
    weekdayOnly: true,
    weekday: makeMask([19, 22]),
    note: '주말은 가족 일정. 평일 19시 이후 가능.',
    completed: true,
  }),
  // u6 임지수 (키보드) — 월/수/금 + 토.
  build('u6', {
    weekday: makeMask([20, 22]),
    weekend: makeMask([10, 18]),
    exclude: ['2026-04-28', '2026-04-30', '2026-05-05', '2026-05-07', '2026-05-12', '2026-05-14'],
    note: '월/수/금 저녁 + 토요일 낮 가능. 일요일은 가족 일정.',
    completed: true,
  }),
  // u7 최홍석 (드럼) — 매일 가능. 입력 미완.
  build('u7', {
    weekday: makeMask([17, 22]),
    weekend: makeMask([12, 22]),
    note: '',
    completed: false,
  }),
];
