import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/home', '/bands', '/practices', '/performances', '/me'];
const REFRESH_COOKIE = 'refreshToken';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requiresAuth = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!requiresAuth) return NextResponse.next();

  const hasRefreshToken = request.cookies.has(REFRESH_COOKIE);
  if (hasRefreshToken) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/home/:path*',
    '/bands/:path*',
    '/practices/:path*',
    '/performances/:path*',
    '/me/:path*',
  ],
};
