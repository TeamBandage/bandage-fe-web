import { z } from 'zod';

/**
 * 빈 문자열은 미설정으로 간주 — `.env.local` 에 키가 빈 값으로 남아 있어도 통과시킨다.
 * (OAuth 키 발급 전 placeholder 케이스)
 */
const optionalNonEmpty = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v === '' ? undefined : v));

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_ENV: z.enum(['local', 'dev', 'prod']),
  /** Kakao JavaScript SDK 키 (REST API/Admin 키 아님). 미설정 시 카카오 로그인 비활성화. */
  NEXT_PUBLIC_KAKAO_JS_KEY: optionalNonEmpty,
  /** Google OAuth Web Client ID. BE GOOGLE_OAUTH_CLIENT_ID 와 동일 값이어야 audience 검증 통과. */
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: optionalNonEmpty,
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_KAKAO_JS_KEY: process.env.NEXT_PUBLIC_KAKAO_JS_KEY,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
  );
}

export const env = parsed.data;

export type Env = typeof env;
