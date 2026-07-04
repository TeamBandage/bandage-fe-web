export const ROUTES = {
  LOGIN: '/',
  JOIN: '/join',
  PASSWORD_CHANGE: '/password-change',
  OAUTH_CALLBACK_KAKAO: '/oauth/callback/kakao',
  OAUTH_CALLBACK_GOOGLE: '/oauth/callback/google',

  HOME: '/home',

  BANDS: '/bands',
  BAND_CREATE: '/bands/create',
  BAND_DETAIL: (bandId: string) => `/bands/${bandId}`,

  JAMS: '/jams',
  JAM_CREATE: '/jams/create',
  JAM_DETAIL: (id: string) => `/jams/${id}`,

  PERFORMANCES: '/performances',
  PERFORMANCE_CREATE: '/performances/create',
  PERFORMANCE_DETAIL: (id: string) => `/performances/${id}`,

  ME: '/me',
  ME_EDIT: '/me/edit',

  SETLISTS: '/setlists',
  SETLIST_DETAIL: (id: string) => `/setlists/${id}`,

  TRACK_SELECTIONS: '/track-selections',
  TRACK_SELECTION_CREATE: '/track-selections/create',
  TRACK_SELECTION_DETAIL: (id: string) => `/track-selections/${id}`,
  TRACK_SELECTION_SCHEDULING: '/track-selections/scheduling',
  TRACK_SELECTION_SCHEDULING_DETAIL: (id: string) => `/track-selections/scheduling/${id}`,
} as const;

export type AppRoutes = typeof ROUTES;
