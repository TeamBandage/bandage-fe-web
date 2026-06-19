export const ROUTES = {
  LOGIN: '/',
  JOIN: '/join',
  PASSWORD_CHANGE: '/password-change',
  OAUTH_CALLBACK_KAKAO: '/oauth/callback/kakao',
  OAUTH_CALLBACK_GOOGLE: '/oauth/callback/google',

  HOME: '/home',

  BANDS: '/bands',
  BAND_NEW: '/bands/new',
  BAND_DETAIL: (bandId: string) => `/bands/${bandId}`,

  JAMS: '/jams',
  JAM_NEW: '/jams/new',
  JAM_DETAIL: (id: string) => `/jams/${id}`,

  PERFORMANCES: '/performances',
  PERFORMANCE_NEW: '/performances/new',
  PERFORMANCE_DETAIL: (id: string) => `/performances/${id}`,

  ME: '/me',
  ME_EDIT: '/me/edit',

  SETLIST_MEETINGS: '/setlist-meetings',
  SETLIST_MEETING_NEW: '/setlist-meetings/new',
  SETLIST_MEETING_DETAIL: (id: string) => `/setlist-meetings/${id}`,
  SETLIST_SCHEDULING: '/setlist-meetings/scheduling',
  SETLIST_SCHEDULING_DETAIL: (id: string) => `/setlist-meetings/scheduling/${id}`,
} as const;

export type AppRoutes = typeof ROUTES;
