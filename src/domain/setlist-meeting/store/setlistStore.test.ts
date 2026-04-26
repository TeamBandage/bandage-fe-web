import { beforeEach, describe, expect, it } from 'vitest';

import { useSetlistStore } from './setlistStore';

beforeEach(() => {
  useSetlistStore.getState().reset();
});

describe('setlistStore — application/withdraw', () => {
  it('applySession 은 중복을 허용하지 않는다', () => {
    const { applySession } = useSetlistStore.getState();
    applySession('s7', 'V', 'u1');
    applySession('s7', 'V', 'u1');
    const song = useSetlistStore.getState().songs.find((s) => s.id === 's7')!;
    expect(song.applicants.V).toEqual(['u1']);
  });

  it('withdrawSession 은 applicants 와 confirmed 모두에서 제거한다', () => {
    const { withdrawSession } = useSetlistStore.getState();
    // s2 G 에 u3 가 이미 confirmed.
    expect(useSetlistStore.getState().songs.find((s) => s.id === 's2')!.confirmed.G).toContain(
      'u3',
    );
    withdrawSession('s2', 'G', 'u3');
    const song = useSetlistStore.getState().songs.find((s) => s.id === 's2')!;
    expect(song.applicants.G).not.toContain('u3');
    expect(song.confirmed.G).not.toContain('u3');
  });

  it('confirmSession / unconfirmSession 토글', () => {
    const { confirmSession, unconfirmSession } = useSetlistStore.getState();
    confirmSession('s3', 'V', 'u4');
    expect(useSetlistStore.getState().songs.find((s) => s.id === 's3')!.confirmed.V).toEqual([
      'u4',
    ]);
    unconfirmSession('s3', 'V', 'u4');
    expect(useSetlistStore.getState().songs.find((s) => s.id === 's3')!.confirmed.V).toEqual([]);
  });
});

describe('setlistStore — chat / addSong / addCustomSession', () => {
  it('sendChat 은 채팅 배열에 메시지를 append', () => {
    const { sendChat } = useSetlistStore.getState();
    const before = useSetlistStore.getState().songs.find((s) => s.id === 's1')!.chat.length;
    sendChat('s1', 'u1', '테스트 메시지', '04-26 12:00');
    const after = useSetlistStore.getState().songs.find((s) => s.id === 's1')!.chat;
    expect(after.length).toBe(before + 1);
    expect(after.at(-1)).toMatchObject({ userId: 'u1', msg: '테스트 메시지' });
  });

  it('addSong 은 빈 applicants/confirmed 버킷을 초기화', () => {
    const { addSong } = useSetlistStore.getState();
    const id = addSong('mt1', {
      title: 'New Song',
      artist: 'Tool',
      proposerId: 'u1',
    });
    const song = useSetlistStore.getState().songs.find((s) => s.id === id)!;
    expect(song.meetingId).toBe('mt1');
    expect(song.sessions.length).toBeGreaterThan(0);
    for (const s of song.sessions) {
      expect(song.applicants[s.id]).toEqual([]);
      expect(song.confirmed[s.id]).toEqual([]);
    }
  });

  it('deleteSong 은 곡을 제거하고, 선택 상태였다면 selection/focus 를 정리한다', () => {
    const { addSong, setSelectedSong, setFocusedSession, deleteSong } = useSetlistStore.getState();
    const id = addSong('mt1', { title: 'X', artist: 'Y', proposerId: 'u1' });
    setSelectedSong(id);
    setFocusedSession('V');
    expect(useSetlistStore.getState().selectedSongId).toBe(id);
    deleteSong(id);
    const state = useSetlistStore.getState();
    expect(state.songs.find((s) => s.id === id)).toBeUndefined();
    expect(state.selectedSongId).toBeNull();
    expect(state.focusedSessionId).toBeNull();
  });

  it('addCustomSession 은 custom 플래그를 강제하고 동일 id 중복 추가를 막는다', () => {
    const { addCustomSession } = useSetlistStore.getState();
    addCustomSession('s1', { id: 'K', label: '키보드', short: 'K', need: 1 });
    addCustomSession('s1', { id: 'K', label: '키보드', short: 'K', need: 1 });
    const song = useSetlistStore.getState().songs.find((s) => s.id === 's1')!;
    const k = song.sessions.filter((s) => s.id === 'K');
    expect(k.length).toBe(1);
    expect(k[0]?.custom).toBe(true);
  });
});
