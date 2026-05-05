import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/home', '/bands', '/practices', '/performances', '/me'];
const REFRESH_COOKIE = 'refreshToken';

/**
 * 모든 페이지 응답에 적용할 캐시/Vary 헤더.
 *
 * Next.js App Router 는 동일 URL 에 두 가지 응답을 내보낸다:
 *  - 일반 진입       → Content-Type: text/html
 *  - <Link> prefetch → Content-Type: text/x-component (RSC flight payload)
 *
 * CloudFront 등 CDN 의 cache key 에 RSC 관련 요청 헤더가 포함되지 않으면 두 응답이
 * 같은 키로 저장되어 사용자가 RSC payload 를 raw text 로 보게 되는 사고가 발생한다.
 * Origin 응답에 명시적으로 `private, no-store` 를 박아 CDN 캐시를 우회시키고, `Vary`
 * 로는 다른 프록시/브라우저 캐시에 RSC 분기를 알려둔다.
 */
function applyNoStoreHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set(
    'Vary',
    'RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Url, Accept-Encoding',
  );
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasRefreshToken = request.cookies.has(REFRESH_COOKIE);

  // 루트(/) 는 RootPage 가 /home 으로 redirect 한다 — 비인증이면 home 의 보호 규칙이
  // 자연스럽게 /login 으로 이어준다. 별도 onboarding 분기는 더 이상 두지 않는다.
  if (pathname === '/') return applyNoStoreHeaders(NextResponse.next());

  const requiresAuth = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (requiresAuth && !hasRefreshToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname + search);
    return applyNoStoreHeaders(NextResponse.redirect(loginUrl));
  }

  return applyNoStoreHeaders(NextResponse.next());
}

export const config = {
  /**
   * 페이지 라우트 전체에 매칭. 정적 자원/이미지/API 는 제외해 long cache 와 BE 프록시
   * 응답에 영향을 주지 않는다. 패턴 출처: Next.js 공식 미들웨어 예시.
   */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|brand|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf)$).*)',
  ],
};
