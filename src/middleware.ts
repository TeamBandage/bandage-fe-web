import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/home', '/bands', '/practices', '/performances', '/me'];
const REFRESH_COOKIE = 'refreshToken';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasRefreshToken = request.cookies.has(REFRESH_COOKIE);

  // 루트(/) 는 RootPage 가 /home 으로 redirect 한다 — 비인증이면 home 의 보호 규칙이
  // 자연스럽게 /login 으로 이어준다. 별도 onboarding 분기는 더 이상 두지 않는다.
  if (pathname === '/') return NextResponse.next();

  const requiresAuth = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!requiresAuth) return NextResponse.next();

  if (hasRefreshToken) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/',
    '/home/:path*',
    '/bands/:path*',
    '/practices/:path*',
    '/performances/:path*',
    '/me/:path*',
  ],
};
