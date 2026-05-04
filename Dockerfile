# syntax=docker/dockerfile:1.7

# ============================================================
# 1) Dependencies stage — pnpm 의존성만 캐싱
# ============================================================
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat \
 && corepack enable

# package.json + lockfile 만 먼저 복사해서 deps 캐시 적중률 최대화
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod=false

# ============================================================
# 2) Build stage — next build (standalone 산출물 생성)
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat \
 && corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 빌드 타임 inlining 이 필요한 NEXT_PUBLIC_* 는 ARG 로 받아서 ENV 로 노출.
# 값은 GitHub Actions build-args 로 주입.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_KAKAO_JS_KEY
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV \
    NEXT_PUBLIC_KAKAO_JS_KEY=$NEXT_PUBLIC_KAKAO_JS_KEY \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    NEXT_TELEMETRY_DISABLED=1

RUN --mount=type=cache,id=next,target=/app/.next/cache \
    pnpm build

# ============================================================
# 3) Runtime stage — node:20-alpine 위에 standalone 산출물만 적재
# ============================================================
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache curl tzdata \
 && cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime \
 && echo "Asia/Seoul" > /etc/timezone \
 && addgroup -S nodejs \
 && adduser -S nextjs -G nodejs -h /app -s /sbin/nologin

# 정적 자산 + standalone 산출물
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TZ=Asia/Seoul \
    NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://localhost:${PORT}/api/health" || exit 1

CMD ["node", "server.js"]
