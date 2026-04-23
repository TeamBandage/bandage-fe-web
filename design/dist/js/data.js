/**
 * Mock data layer — replace with real API calls in production.
 */

export const currentUser = {
  memberId: 'kim1',
  name: '김밴드',
  email: 'kim@bandage.io',
  contact: '010-1234-5678',
};

export const bands = [
  { bandId: 'b1', bandName: '루나틱', description: '홍대 기반 인디 록 밴드. 매주 수요일 합주합니다. 보컬, 기타, 드럼, 베이스 4인조.', myRole: 'LEADER' },
  { bandId: 'b2', bandName: '코드 크래셔', description: '헤비메탈을 주로 연주합니다. 열정 넘치는 멤버를 모집 중!', myRole: 'MEMBER' },
  { bandId: 'b3', bandName: '마그마', description: '감성 발라드부터 팝까지. 연세 있는 분들 환영합니다.', myRole: 'ADMIN' },
  { bandId: 'b4', bandName: '서울 재즈 클럽', description: '재즈 즉흥 연주를 즐기는 밴드. 매월 공연을 진행합니다.', myRole: null },
  { bandId: 'b5', bandName: '포크 라이더스', description: '통기타와 하모니카 중심의 포크 밴드입니다.', myRole: null },
];

export const bandMembers = {
  b1: [
    { bandMemberId: 'm1', memberId: '김밴드', role: 'LEADER' },
    { bandMemberId: 'm2', memberId: '이기타', role: 'ADMIN' },
    { bandMemberId: 'm3', memberId: '박드럼', role: 'MEMBER' },
    { bandMemberId: 'm4', memberId: '최베이스', role: 'MEMBER' },
    { bandMemberId: 'm5', memberId: '정보컬', role: 'MEMBER' },
  ],
};

export const applications = {
  b1: [
    { appId: 'a1', memberId: '강신입', appliedAt: '2026-04-20 14:30', status: 'PENDING' },
    { appId: 'a2', memberId: '오연습', appliedAt: '2026-04-19 09:00', status: 'PENDING' },
    { appId: 'a3', memberId: '윤지원', appliedAt: '2026-04-18 17:20', status: 'APPROVED' },
    { appId: 'a4', memberId: '한승민', appliedAt: '2026-04-17 11:00', status: 'REJECTED' },
  ],
};

export const songs = [
  { songId: 'sg1', title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera' },
  { songId: 'sg2', title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV' },
  { songId: 'sg3', title: 'Hotel California', artist: 'Eagles', album: 'Hotel California' },
  { songId: 'sg4', title: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind' },
];

export const practices = [
  {
    practiceId: 'p1', title: '정기 합주 #12',
    song: songs[0],
    startAt: '2026-04-25 19:00', durationMinutes: 120, venue: '홍대 연습실 A',
    sessions: [
      { sessionId: 's1', label: 'Guitar 1', type: 'Guitar', participant: '이기타' },
      { sessionId: 's2', label: 'Guitar 2', type: 'Guitar', participant: null },
      { sessionId: 's3', label: 'Vocal', type: 'Vocal', participant: '정보컬' },
      { sessionId: 's4', label: 'Bass', type: 'Bass', participant: '최베이스' },
      { sessionId: 's5', label: 'Drum', type: 'Drum', participant: null },
    ],
    participants: [
      { participantId: 'pp1', memberId: '이기타' },
      { participantId: 'pp2', memberId: '정보컬' },
      { participantId: 'pp3', memberId: '최베이스' },
    ],
    refLink: 'https://youtu.be/fJ9rUzIMcZQ', status: '예정',
  },
  {
    practiceId: 'p2', title: '합주',
    song: songs[1],
    startAt: '2026-04-27 18:00', durationMinutes: 90, venue: null,
    sessions: [
      { sessionId: 's6', label: 'Guitar', type: 'Guitar', participant: '이기타' },
      { sessionId: 's7', label: 'Vocal', type: 'Vocal', participant: null },
    ],
    participants: [{ participantId: 'pp4', memberId: '이기타' }],
    refLink: null, status: '예정',
  },
];

export const performances = [
  {
    performanceId: 'pf1', title: '봄 정기공연 2026',
    startAt: '2026-04-30 18:00', durationMinutes: 180, venue: '홍익대학교 대강당',
    bandIds: ['b1', 'b2'], managerIds: ['김밴드'], practiceIds: ['p1', 'p2'], daysLeft: 8,
  },
  {
    performanceId: 'pf2', title: '인디 페스티벌',
    startAt: '2026-05-15 15:00', durationMinutes: 240, venue: '올림픽공원 야외광장',
    bandIds: ['b1'], managerIds: ['이기타'], practiceIds: ['p2'], daysLeft: 23,
  },
  {
    performanceId: 'pf3', title: '여름 버스킹',
    startAt: '2026-06-01 17:00', durationMinutes: 120, venue: '신촌 연세로',
    bandIds: ['b3'], managerIds: ['최베이스'], practiceIds: [], daysLeft: 40,
  },
];

export const sessionTypes = [
  { type: 'Vocal', icon: 'mic' }, { type: 'Chorus', icon: 'mic' },
  { type: 'Guitar', icon: 'guitar' }, { type: 'Bass', icon: 'guitar' },
  { type: 'Drum', icon: 'drum' }, { type: 'Percussion', icon: 'drum' },
  { type: 'Synth', icon: 'music' }, { type: 'Session', icon: 'star' },
];

export function findBand(id) { return bands.find(b => b.bandId === id); }
export function findPractice(id) { return practices.find(p => p.practiceId === id); }
export function findPerformance(id) { return performances.find(p => p.performanceId === id); }
