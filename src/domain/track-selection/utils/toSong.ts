import type { SessionDef, Song } from '@/domain/setlist-meeting/types';

import type { TrackSelectionItemResponse } from '../types/res';

function secondsToMmSs(totalSeconds: number): string {
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export function mmSsToSeconds(mmss: string | undefined): number | undefined {
  if (!mmss) return undefined;
  const [mm = '0', ss = '0'] = mmss.split(':');
  const total = parseInt(mm, 10) * 60 + parseInt(ss, 10);
  return total === 0 ? undefined : total;
}

export function toSong(item: TrackSelectionItemResponse): Song {
  return {
    id: item.trackSelectionItemId,
    meetingId: item.selectionId,
    title: item.title,
    artist: item.artist,
    album: item.album,
    duration: item.duration != null ? secondsToMmSs(item.duration) : undefined,
    note: item.note,
    reference: item.reference,
    proposerId: String(item.proposer?.memberId ?? item.proposerId ?? ''),
    sessions: item.sessions.map<SessionDef>((s) => ({
      id: s.sessionId,
      label: s.label,
      short: s.short,
      need: s.need ?? 1,
      custom: s.custom,
    })),
    applicants: Object.fromEntries(
      item.sessions.map((s) => [s.sessionId, s.applicants.map((p) => String(p.memberId))]),
    ),
    confirmed: Object.fromEntries(
      item.sessions.map((s) => [s.sessionId, s.confirmed.map((p) => String(p.memberId))]),
    ),
    isSelected: item.selected,
    chatMessageCount: item.chatMessageCount,
  };
}
