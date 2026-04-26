import type { Meeting, Member, SessionDef, Song } from '../types';

/** 현재 사용자 (mock). design/web/setlist_web.jsx 와 동일하게 u1=정선우(매니저). */
export const SEED_CURRENT_USER_ID = 'u1';

export const SEED_MEMBERS: Member[] = [
  { id: 'u1', name: '정선우', role: '기타', avatar: '#F59E0B', email: 'sunwoo@bandage.dev' },
  { id: 'u2', name: '신선경', role: '베이스', avatar: '#EF4444', email: 'sunkyung@bandage.dev' },
  { id: 'u3', name: '지범준', role: '기타', avatar: '#3B82F6', email: 'beomjun@bandage.dev' },
  { id: 'u4', name: '안성진', role: '보컬', avatar: '#8B5CF6', email: 'sungjin@bandage.dev' },
  { id: 'u5', name: '이동후', role: '드럼', avatar: '#10B981', email: 'dongwhu@bandage.dev' },
  { id: 'u6', name: '임지수', role: '키보드', avatar: '#EC4899', email: 'jisoo@bandage.dev' },
  { id: 'u7', name: '최홍석', role: '드럼', avatar: '#06B6D4', email: 'hongseok@bandage.dev' },
];

export const SEED_MEETINGS: Meeting[] = [
  {
    id: 'mt1',
    bandId: 'b1',
    bandName: 'TOOL TRIBUTE',
    title: '10,000 Days 전곡 합주 프로젝트',
    managerId: 'u1',
    createdAt: '2026-04-20',
    updatedAt: '2026-04-25',
  },
  {
    id: 'mt2',
    bandId: 'b3',
    bandName: '마그마',
    title: '여름 공연 셋리스트',
    managerId: 'u1',
    createdAt: '2026-04-18',
    updatedAt: '2026-04-22',
  },
];

const TOOL_SESSIONS: SessionDef[] = [
  { id: 'V', label: '보컬', short: 'V', need: 1 },
  { id: 'G', label: '기타', short: 'G', need: 1 },
  { id: 'B', label: '베이스', short: 'B', need: 1 },
  { id: 'D', label: '드럼', short: 'D', need: 1 },
];

export const SEED_SONGS: Song[] = [
  {
    id: 's1',
    meetingId: 'mt1',
    title: 'Vicarious',
    artist: 'Tool',
    album: '10,000 Days',
    duration: '7:06',
    proposerId: 'u3',
    note: '폴리리듬 도입부, 7/8 변박. 기타 오프닝 어렵지만 임팩트 큼.',
    sessions: TOOL_SESSIONS,
    applicants: { V: ['u4'], G: ['u1', 'u3'], B: ['u2'], D: [] },
    confirmed: { V: ['u4'], G: ['u1'], B: ['u2'], D: [] },
    chat: [
      {
        userId: 'u3',
        at: '04-22 10:14',
        msg: 'Vicarious 인트로부터 너무 강력해서 1번 트랙으로 어떤가요?',
      },
      { userId: 'u4', at: '04-22 11:02', msg: '보컬 음역 빡셈. 키 반음 내릴지 고민됨.' },
      { userId: 'u1', at: '04-22 14:30', msg: '기타 솔로 부분 따로 합주 잡고 싶음.' },
    ],
  },
  {
    id: 's2',
    meetingId: 'mt1',
    title: 'Jambi',
    artist: 'Tool',
    album: '10,000 Days',
    duration: '7:28',
    proposerId: 'u1',
    note: 'Talk box 솔로 인상적. 모든 세션 단단하게 매칭됨.',
    sessions: TOOL_SESSIONS,
    applicants: { V: ['u4'], G: ['u3', 'u1'], B: ['u2'], D: ['u5', 'u7'] },
    confirmed: { V: ['u4'], G: ['u3'], B: ['u2'], D: ['u5'] },
    chat: [
      { userId: 'u1', at: '04-20 09:00', msg: 'Jambi는 라이브에서 진짜 좋을 듯.' },
      { userId: 'u5', at: '04-20 10:15', msg: '드럼 그루브 좋아요.' },
    ],
  },
  {
    id: 's3',
    meetingId: 'mt1',
    title: 'Wings for Marie (Pt 1)',
    artist: 'Tool',
    album: '10,000 Days',
    duration: '6:11',
    proposerId: 'u4',
    note: '잔잔하게 시작 → 10,000 Days로 이어지는 구성. 보컬 표현이 핵심.',
    sessions: TOOL_SESSIONS,
    applicants: { V: ['u4'], G: [], B: ['u2'], D: [] },
    confirmed: { V: [], G: [], B: [], D: [] },
    chat: [
      {
        userId: 'u4',
        at: '04-21 16:00',
        msg: '아버지에 대한 곡. 10,000 Days와 묶어서 가야 의미가 살아요.',
      },
    ],
  },
  {
    id: 's4',
    meetingId: 'mt1',
    title: '10,000 Days (Wings Pt 2)',
    artist: 'Tool',
    album: '10,000 Days',
    duration: '11:13',
    proposerId: 'u4',
    note: '11분 대곡. 신스 패드 + 퍼커션이 분위기를 만듦.',
    sessions: [
      ...TOOL_SESSIONS,
      { id: 'K', label: '키보드', short: 'K', need: 1, custom: true },
      { id: 'PERC', label: '퍼커션', short: 'Pc', need: 1, custom: true },
    ],
    applicants: { V: ['u4'], G: ['u3'], B: ['u2'], D: ['u5'], K: ['u6'], PERC: [] },
    confirmed: { V: ['u4'], G: ['u3'], B: ['u2'], D: ['u5'], K: ['u6'], PERC: [] },
    chat: [
      { userId: 'u4', at: '04-23 13:20', msg: '키보드 패드는 임지수님 맡아주시면 좋겠어요.' },
      { userId: 'u6', at: '04-23 14:00', msg: 'OK! 사운드 미리 준비할게요.' },
    ],
  },
  {
    id: 's5',
    meetingId: 'mt1',
    title: 'The Pot',
    artist: 'Tool',
    album: '10,000 Days',
    duration: '6:21',
    proposerId: 'u2',
    note: '베이스 라인이 메인. 9/8 변박 파트 주의.',
    sessions: TOOL_SESSIONS,
    applicants: { V: ['u4'], G: ['u1', 'u3'], B: ['u2'], D: ['u5'] },
    confirmed: { V: ['u4'], G: ['u1'], B: ['u2'], D: ['u5'] },
    chat: [
      { userId: 'u2', at: '04-24 11:00', msg: 'The Pot 베이스 라인 진짜 멋있음. 꼭 하고 싶어요.' },
    ],
  },
  {
    id: 's6',
    meetingId: 'mt1',
    title: 'Right in Two',
    artist: 'Tool',
    album: '10,000 Days',
    duration: '8:55',
    proposerId: 'u5',
    note: '타블라 리듬에서 확장. 드럼 듀얼 트윈 가능.',
    sessions: [...TOOL_SESSIONS, { id: 'D2', label: '드럼2', short: 'D2', need: 1, custom: true }],
    applicants: { V: ['u4'], G: ['u3'], B: ['u2'], D: ['u5'], D2: ['u7'] },
    confirmed: { V: ['u4'], G: ['u3'], B: ['u2'], D: ['u5'], D2: ['u7'] },
    chat: [
      { userId: 'u5', at: '04-24 19:00', msg: '후반부 트윈 드럼 어떨까요? 최홍석님이랑 같이.' },
      { userId: 'u7', at: '04-24 19:20', msg: '좋아요! 패턴 분담 정해봅시다.' },
    ],
  },
  {
    id: 's7',
    meetingId: 'mt1',
    title: 'Rosetta Stoned',
    artist: 'Tool',
    album: '10,000 Days',
    duration: '11:11',
    proposerId: 'u3',
    note: '11분, 가사 광기 가득. 도전적인 트랙.',
    sessions: TOOL_SESSIONS,
    applicants: { V: [], G: ['u3', 'u1'], B: [], D: [] },
    confirmed: { V: [], G: [], B: [], D: [] },
    chat: [{ userId: 'u3', at: '04-25 09:15', msg: '난이도 최상. 시간 많이 필요할 것 같아요.' }],
  },
];

export const DEFAULT_SESSIONS: SessionDef[] = TOOL_SESSIONS;
