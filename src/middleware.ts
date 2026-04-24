import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/home', '/bands', '/practices', '/performances', '/me'];
const REFRESH_COOKIE = 'refreshToken';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasRefreshToken = request.cookies.has(REFRESH_COOKIE);

  // 루트(/) 는 보호 대상이 아니지만 비인증 방문자에게는 온보딩(랜딩) 을 보여주고
  // 인증된 방문자는 RootPage 에서 /home 으로 전달된다.
  if (pathname === '/') {
    if (!hasRefreshToken) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    return NextResponse.next();
  }

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
