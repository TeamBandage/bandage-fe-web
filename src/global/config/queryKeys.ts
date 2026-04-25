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
    my: () => [...queryKeys.band.all, 'my'] as const,
    search: (keyword: string) => [...queryKeys.band.all, 'search', keyword] as const,
    detail: (id: string) => [...queryKeys.band.all, id] as const,
    members: (id: string) => [...queryKeys.band.all, id, 'members'] as const,
    applications: (id: string, status?: string) =>
      [...queryKeys.band.all, id, 'applications', status ?? null] as const,
  },
  practice: {
    all: ['practice'] as const,
    list: (bandId?: string) => [...queryKeys.practice.all, 'list', bandId ?? null] as const,
    my: () => [...queryKeys.practice.all, 'my'] as const,
    mySearch: (keyword: string) => [...queryKeys.practice.all, 'my', 'search', keyword] as const,
    upcoming: (limit: number) => [...queryKeys.practice.all, 'upcoming', limit] as const,
    detail: (id: string) => [...queryKeys.practice.all, id] as const,
    songs: (id: string) => [...queryKeys.practice.all, id, 'songs'] as const,
  },
  performance: {
    all: ['performance'] as const,
    list: (bandId?: string) => [...queryKeys.performance.all, 'list', bandId ?? null] as const,
    my: () => [...queryKeys.performance.all, 'my'] as const,
    search: (keyword: string) => [...queryKeys.performance.all, 'search', keyword] as const,
    upcoming: (limit: number) => [...queryKeys.performance.all, 'upcoming', limit] as const,
    detail: (id: string) => [...queryKeys.performance.all, id] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
