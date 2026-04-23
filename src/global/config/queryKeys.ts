export const queryKeys = {
  auth: {
    refresh: ['auth', 'refresh'] as const,
  },
  member: {
    me: ['member', 'me'] as const,
  },
  band: {
    all: ['band'] as const,
    list: () => [...queryKeys.band.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.band.all, id] as const,
    members: (id: string) => [...queryKeys.band.all, id, 'members'] as const,
    applications: (id: string, status?: string) =>
      [...queryKeys.band.all, id, 'applications', status ?? null] as const,
  },
  practice: {
    all: ['practice'] as const,
    list: (bandId?: string) => [...queryKeys.practice.all, 'list', bandId ?? null] as const,
    detail: (id: string) => [...queryKeys.practice.all, id] as const,
    songs: (id: string) => [...queryKeys.practice.all, id, 'songs'] as const,
  },
  performance: {
    all: ['performance'] as const,
    list: (bandId?: string) => [...queryKeys.performance.all, 'list', bandId ?? null] as const,
    detail: (id: string) => [...queryKeys.performance.all, id] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
