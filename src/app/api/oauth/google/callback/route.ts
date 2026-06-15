import { NextResponse } from 'next/server';

import { env } from '@/global/config/env';

/**
 * GIS ux_mode:'redirect' 의 login_uri 엔드포인트.
 *
 * Google 이 인증 완료 후 브라우저를 통해 credential(idToken) 을 form-POST 로 전달한다.
 * credential 을 단명(60초) 쿠키에 저장하고 GoogleCallback 클라이언트 페이지로 리다이렉트.
 * 클라이언트 페이지에서 쿠키를 읽어 Spring 백엔드를 직접 호출하므로
 * refreshToken 쿠키가 브라우저에 직접 설정된다.
 *
 * request.url 은 EC2 내부 주소(0.0.0.0:3000)를 반환하므로 NEXT_PUBLIC_APP_URL 로 고정.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const credential = formData.get('credential');

  const appUrl = env.NEXT_PUBLIC_APP_URL;

  if (!credential || typeof credential !== 'string') {
    return NextResponse.redirect(new URL('/?error=google_auth_failed', appUrl));
  }

  // 303 See Other: POST → GET 전환 (307 유지 시 브라우저가 POST로 페이지를 요청해 라우터 혼선)
  const response = NextResponse.redirect(new URL('/oauth/callback/google', appUrl), {
    status: 303,
  });
  response.cookies.set('_g_credential', credential, {
    httpOnly: false,
    maxAge: 60,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
