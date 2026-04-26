export const ROUTES = {
  ONBOARDING: '/onboarding',

  LOGIN: '/login',
  JOIN: '/join',
  PASSWORD_CHANGE: '/password-change',

  HOME: '/home',

  BANDS: '/bands',
  BAND_NEW: '/bands/new',
  BAND_DETAIL: (bandId: string) => `/bands/${bandId}`,

  PRACTICES: '/practices',
  PRACTICE_NEW: '/practices/new',
  PRACTICE_DETAIL: (id: string) => `/practices/${id}`,

  PERFORMANCES: '/performances',
  PERFORMANCE_NEW: '/performances/new',
  PERFORMANCE_DETAIL: (id: string) => `/performances/${id}`,

  ME: '/me',

  SETLIST_MEETINGS: '/setlist-meetings',
  SETLIST_MEETING_NEW: '/setlist-meetings/new',
  SETLIST_MEETING_DETAIL: (id: string) => `/setlist-meetings/${id}`,
} as const;

export type AppRoutes = typeof ROUTES;
