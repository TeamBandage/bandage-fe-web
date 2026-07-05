import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_SESSIONS, SEED_CURRENT_USER_ID, SEED_MEETINGS } from '../mock/seed';
import type { Meeting, SessionDef, Song } from '../types';

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

type State = {
  meetings: Meeting[];
  songs: Song[];
  currentUserId: string;
  selectedMeetingId: string | null;
  selectedSongId: string | null;
  focusedSessionId: string | null;
};

type Actions = {
  setSelectedMeeting: (id: string | null) => void;
  setSelectedSong: (id: string | null) => void;
  setFocusedSession: (id: string | null) => void;
  setCurrentUser: (userId: string) => void;
  applySession: (songId: string, sessionId: string, userId: string) => void;
  withdrawSession: (songId: string, sessionId: string, userId: string) => void;
  confirmSession: (songId: string, sessionId: string, userId: string) => void;
  unconfirmSession: (songId: string, sessionId: string, userId: string) => void;
  addSong: (
    meetingId: string,
    song: Pick<Song, 'title' | 'artist' | 'album' | 'duration' | 'note' | 'proposerId'> & {
      sessions?: SessionDef[];
    },
  ) => string;
  deleteSong: (songId: string) => void;
  updateSong: (
    songId: string,
    patch: Partial<Pick<Song, 'title' | 'artist' | 'album' | 'duration' | 'note'>> & {
      sessions?: SessionDef[];
    },
  ) => void;
  addCustomSession: (songId: string, session: SessionDef) => void;
  /** 실 API 응답으로 특정 meetingId 의 곡 목록을 통째로 교체. */
  setSongs: (meetingId: string, songs: Song[]) => void;
  addMeeting: (
    meeting: Omit<
      Meeting,
      'id' | 'createdAt' | 'updatedAt' | 'practiceSongMap' | 'lockSnapshotSongIds'
    >,
  ) => string;
  /** 매니저가 선곡 확정 — 곡 추가/수정/삭제 잠금. */
  lockMeeting: (meetingId: string) => void;
  /** 매니저가 회의 재개 — 잠금 해제. */
  unlockMeeting: (meetingId: string) => void;
  /** 테스트/디버그용. seed 로 되돌림. */
  reset: () => void;
};

export type SetlistStore = State & Actions;

const initial: State = {
  meetings: SEED_MEETINGS,
  songs: [],
  currentUserId: SEED_CURRENT_USER_ID,
  selectedMeetingId: null,
  selectedSongId: null,
  focusedSessionId: null,
};

function updateSong(songs: Song[], songId: string, updater: (song: Song) => Song): Song[] {
  return songs.map((s) => (s.id === songId ? updater(s) : s));
}

function updateBucket(
  bucket: Record<string, string[]>,
  sessionId: string,
  updater: (list: string[]) => string[],
): Record<string, string[]> {
  const list = bucket[sessionId] ?? [];
  return { ...bucket, [sessionId]: updater(list) };
}

export const useSetlistStore = create<SetlistStore>()(
  persist(
    (set) => ({
      ...initial,
      setSelectedMeeting: (id) => set({ selectedMeetingId: id, selectedSongId: null }),
      setSelectedSong: (id) => set({ selectedSongId: id, focusedSessionId: null }),
      setFocusedSession: (id) => set({ focusedSessionId: id }),
      setCurrentUser: (userId) => set({ currentUserId: userId }),

      applySession: (songId, sessionId, userId) =>
        set((state) => ({
          songs: updateSong(state.songs, songId, (song) => ({
            ...song,
            applicants: updateBucket(song.applicants, sessionId, (list) =>
              list.includes(userId) ? list : [...list, userId],
            ),
          })),
        })),

      withdrawSession: (songId, sessionId, userId) =>
        set((state) => ({
          songs: updateSong(state.songs, songId, (song) => ({
            ...song,
            applicants: updateBucket(song.applicants, sessionId, (list) =>
              list.filter((u) => u !== userId),
            ),
            // 지원 철회 시 확정 상태도 함께 정리.
            confirmed: updateBucket(song.confirmed, sessionId, (list) =>
              list.filter((u) => u !== userId),
            ),
          })),
        })),

      confirmSession: (songId, sessionId, userId) =>
        set((state) => ({
          songs: updateSong(state.songs, songId, (song) => ({
            ...song,
            confirmed: updateBucket(song.confirmed, sessionId, (list) =>
              list.includes(userId) ? list : [...list, userId],
            ),
          })),
        })),

      unconfirmSession: (songId, sessionId, userId) =>
        set((state) => ({
          songs: updateSong(state.songs, songId, (song) => ({
            ...song,
            confirmed: updateBucket(song.confirmed, sessionId, (list) =>
              list.filter((u) => u !== userId),
            ),
          })),
        })),

      addSong: (meetingId, draft) => {
        const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const sessions = draft.sessions ?? DEFAULT_SESSIONS;
        const empty: Record<string, string[]> = Object.fromEntries(
          sessions.map((s) => [s.id, [] as string[]]),
        );
        const next: Song = {
          id,
          meetingId,
          title: draft.title,
          artist: draft.artist,
          album: draft.album,
          duration: draft.duration,
          proposerId: draft.proposerId,
          note: draft.note,
          sessions,
          applicants: empty,
          confirmed: { ...empty },
        };
        set((state) => ({ songs: [...state.songs, next] }));
        return id;
      },

      deleteSong: (songId) =>
        set((state) => ({
          songs: state.songs.filter((s) => s.id !== songId),
          // 삭제 곡이 현재 선택 상태였다면 선택 해제.
          selectedSongId: state.selectedSongId === songId ? null : state.selectedSongId,
          focusedSessionId: state.selectedSongId === songId ? null : state.focusedSessionId,
        })),

      updateSong: (songId, patch) =>
        set((state) => ({
          songs: state.songs.map((s) => {
            if (s.id !== songId) return s;
            const next: Song = { ...s, ...patch };
            // 세션 목록이 변경된 경우 applicants/confirmed 버킷을 새 세션 기준으로 재정렬:
            // - 새로 추가된 세션은 빈 배열로 초기화
            // - 제거된 세션은 데이터도 함께 정리 (확정자 데이터 유실 — 호출 측에서 사전 검증)
            if (patch.sessions) {
              const applicants: Record<string, string[]> = {};
              const confirmed: Record<string, string[]> = {};
              for (const sess of patch.sessions) {
                applicants[sess.id] = s.applicants[sess.id] ?? [];
                confirmed[sess.id] = s.confirmed[sess.id] ?? [];
              }
              next.applicants = applicants;
              next.confirmed = confirmed;
            }
            return next;
          }),
        })),

      addCustomSession: (songId, session) =>
        set((state) => ({
          songs: updateSong(state.songs, songId, (song) =>
            song.sessions.some((s) => s.id === session.id)
              ? song
              : {
                  ...song,
                  sessions: [...song.sessions, { ...session, custom: true }],
                  applicants: { ...song.applicants, [session.id]: [] },
                  confirmed: { ...song.confirmed, [session.id]: [] },
                },
          ),
        })),

      setSongs: (meetingId, incoming) =>
        set((state) => ({
          songs: [...state.songs.filter((s) => s.meetingId !== meetingId), ...incoming],
          // 현재 선택 곡이 삭제된 경우 선택 해제.
          selectedSongId: incoming.some((s) => s.id === state.selectedSongId)
            ? state.selectedSongId
            : null,
          focusedSessionId: incoming.some((s) => s.id === state.selectedSongId)
            ? state.focusedSessionId
            : null,
        })),

      addMeeting: (meeting) => {
        const id = `mt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const today = new Date().toISOString().slice(0, 10);
        const next: Meeting = { ...meeting, id, createdAt: today, updatedAt: today };
        set((state) => ({ meetings: [...state.meetings, next], selectedMeetingId: id }));
        return id;
      },

      lockMeeting: (meetingId) =>
        set((state) => {
          // 잠금 시점의 곡 목록을 lockSnapshot 으로 저장 → 재확정 시 변경분 diff 계산용.
          // BE 도입 시: 여기서 POST /lock 호출 후 응답 받은 practiceSongMap 으로 갱신.
          const meetingSongIds = state.songs
            .filter((s) => s.meetingId === meetingId)
            .map((s) => s.id);
          const prev = state.meetings.find((m) => m.id === meetingId);
          // mock practiceSongMap — 신규 추가된 곡에 대해 임시 practiceSongId 부여, 기존 매핑은 유지.
          const prevMap = prev?.practiceSongMap ?? {};
          const nextMap: Record<string, string> = { ...prevMap };
          for (const sid of meetingSongIds) {
            if (!nextMap[sid]) {
              nextMap[sid] = `ps_${sid}_${Date.now().toString(36)}`;
            }
          }
          return {
            meetings: state.meetings.map((m) =>
              m.id === meetingId
                ? {
                    ...m,
                    lockedAt: new Date().toISOString(),
                    lockSnapshotSongIds: meetingSongIds,
                    practiceSongMap: nextMap,
                  }
                : m,
            ),
          };
        }),

      unlockMeeting: (meetingId) =>
        set((state) => ({
          meetings: state.meetings.map((m) => (m.id === meetingId ? { ...m, lockedAt: null } : m)),
        })),

      reset: () => set({ ...initial }),
    }),
    {
      name: 'bandage-setlist',
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? noopStorage : window.sessionStorage,
      ),
    },
  ),
);

/** 회의 ID 로 곡 목록 필터. */
export const useSongsByMeeting = (meetingId: string | null) =>
  useSetlistStore((s) => (meetingId ? s.songs.filter((song) => song.meetingId === meetingId) : []));

export const useSelectedMeeting = () =>
  useSetlistStore((s) => s.meetings.find((m) => m.id === s.selectedMeetingId) ?? null);

export const useSelectedSong = () =>
  useSetlistStore((s) => s.songs.find((song) => song.id === s.selectedSongId) ?? null);

export const useIsManager = () =>
  useSetlistStore((s) => {
    const meeting = s.meetings.find((m) => m.id === s.selectedMeetingId);
    return meeting ? meeting.managerId === s.currentUserId : false;
  });
