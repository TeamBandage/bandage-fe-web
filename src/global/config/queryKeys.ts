export const queryKeys = {
  auth: {
    refresh: ['auth', 'refresh'] as const,
  },
  member: {
    me: ['member', 'me'] as const,
    myMetrics: ['member', 'me', 'metrics'] as const,
    myAvailability: ['member', 'me', 'availability'] as const,
    myAvailabilitySlots: (from: string, to: string) =>
      ['member', 'me', 'availability', 'slots', from, to] as const,
    search: (q: string) => ['member', 'search', q] as const,
    detail: (memberId: number) => ['member', memberId] as const,
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
    myApplication: (id: string) => [...queryKeys.band.all, id, 'my-application'] as const,
    myApplications: (status?: string) =>
      [...queryKeys.band.all, 'my-applications', status ?? null] as const,
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
    detail: (setlistId: string) => ['setlist', setlistId] as const,
    tracks: (setlistId: string) => ['setlist', setlistId, 'tracks'] as const,
  },
  performance: {
    all: ['performance'] as const,
    list: (bandId?: string) => [...queryKeys.performance.all, 'list', bandId ?? null] as const,
    my: () => [...queryKeys.performance.all, 'my'] as const,
    search: (keyword: string) => [...queryKeys.performance.all, 'search', keyword] as const,
    upcoming: (limit: number) => [...queryKeys.performance.all, 'upcoming', limit] as const,
    detail: (id: string) => [...queryKeys.performance.all, id] as const,
  },
  trackSelection: {
    all: ['track-selection'] as const,
    my: () => [...(['track-selection'] as const), 'my'] as const,
    detail: (id: string) => [...(['track-selection'] as const), id] as const,
    items: (selectionId: string) =>
      [...(['track-selection'] as const), selectionId, 'items'] as const,
    chat: (selectionId: string, itemId: string) =>
      [...(['track-selection'] as const), selectionId, 'items', itemId, 'chat'] as const,
  },
  performancePoster: {
    all: ['performance-poster'] as const,
    list: (performanceId: string) => [...queryKeys.performancePoster.all, performanceId] as const,
    listAll: () => [...queryKeys.performancePoster.all, 'all'] as const,
    detail: (posterId: string) => [...queryKeys.performancePoster.all, 'detail', posterId] as const,
  },
  performanceInvitation: {
    all: ['performance-invitation'] as const,
    sent: (performanceId: string) =>
      [...queryKeys.performanceInvitation.all, 'sent', performanceId] as const,
    my: () => [...queryKeys.performanceInvitation.all, 'my'] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
