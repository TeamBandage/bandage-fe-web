import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  DEFAULT_SESSIONS,
  SEED_CURRENT_USER_ID,
  SEED_MEETINGS,
  SEED_MEMBERS,
  SEED_SONGS,
} from '../mock/seed';
import type { ChatMessage, Meeting, Member, SessionDef, Song } from '../types';

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

type State = {
  meetings: Meeting[];
  songs: Song[];
  members: Member[];
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
  sendChat: (songId: string, userId: string, msg: string, at?: string) => void;
  addSong: (
    meetingId: string,
    song: Pick<Song, 'title' | 'artist' | 'album' | 'note' | 'proposerId'> & {
      sessions?: SessionDef[];
    },
  ) => string;
  addCustomSession: (songId: string, session: SessionDef) => void;
  addMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => string;
  /** 테스트/디버그용. seed 로 되돌림. */
  reset: () => void;
};

export type SetlistStore = State & Actions;

const initial: State = {
  meetings: SEED_MEETINGS,
  songs: SEED_SONGS,
  members: SEED_MEMBERS,
  currentUserId: SEED_CURRENT_USER_ID,
  selectedMeetingId: SEED_MEETINGS[0]?.id ?? null,
  selectedSongId: SEED_SONGS[0]?.id ?? null,
  focusedSessionId: null,
};

function nowMMDDHHmm(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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

      sendChat: (songId, userId, msg, at) =>
        set((state) => ({
          songs: updateSong(state.songs, songId, (song) => ({
            ...song,
            chat: [...song.chat, { userId, msg, at: at ?? nowMMDDHHmm() } satisfies ChatMessage],
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
          proposerId: draft.proposerId,
          note: draft.note,
          sessions,
          applicants: empty,
          confirmed: { ...empty },
          chat: [],
        };
        set((state) => ({ songs: [...state.songs, next] }));
        return id;
      },

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

      addMeeting: (meeting) => {
        const id = `mt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const today = new Date().toISOString().slice(0, 10);
        const next: Meeting = { ...meeting, id, createdAt: today, updatedAt: today };
        set((state) => ({ meetings: [...state.meetings, next], selectedMeetingId: id }));
        return id;
      },

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
