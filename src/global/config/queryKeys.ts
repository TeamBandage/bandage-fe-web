export const queryKeys = {
  auth: {
    refresh: ['auth', 'refresh'] as const,
  },
  member: {
    me: ['member', 'me'] as const,
    myMetrics: ['member', 'me', 'metrics'] as const,
    myAvailability: ['member', 'me', 'availability'] as const,
    search: (q: string) => ['member', 'search', q] as const,
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
  jam: {
    all: ['jam'] as const,
    list: (bandId?: string) => [...queryKeys.jam.all, 'list', bandId ?? null] as const,
    my: () => [...queryKeys.jam.all, 'my'] as const,
    mySearch: (keyword: string) => [...queryKeys.jam.all, 'my', 'search', keyword] as const,
    upcoming: (limit: number) => [...queryKeys.jam.all, 'upcoming', limit] as const,
    detail: (id: string) => [...queryKeys.jam.all, id] as const,
    songs: (id: string) => [...queryKeys.jam.all, id, 'songs'] as const,
  },
  notification: {
    all: ['notification'] as const,
    list: () => [...queryKeys.notification.all, 'list'] as const,
    unreadCount: () => [...queryKeys.notification.all, 'unread-count'] as const,
  },
  setlist: {
    all: ['setlist'] as const,
    my: () => ['setlist', 'my'] as const,
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
