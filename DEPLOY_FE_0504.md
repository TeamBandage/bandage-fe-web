# DEPLOY_FE_0504.md

작성일: 2026-05-04
작성자: FE
대상: Bandage FE (Next.js 15 / React 19 / pnpm 10) — ECR 이미지 + 단일 EC2 인스턴스 + GitHub Actions 파이프라인

---

## 0. 컨텍스트

### 0-1. 환경 제약

- **컨테이너 레지스트리**: AWS ECR (region `ap-northeast-2`, account `595028889928`)
- **호스팅**: 단일 EC2 인스턴스 (Rocky Linux, BE 와 공유)
- **파이프라인**: GitHub Actions
- **BE 측 기존 자산**:
  - `v1/Dockerfile` — Amazon Corretto 21 + Spring Boot bootJar
  - `v1/docker-compose.yml` — `bandage-postgres`(15) + `bandage-redis`(7-alpine) + `bandage-band-manager`(8080) 서비스
  - `v1/.github/workflows/develop_deploy.yml` — ECR 푸시 + `appleboy/ssh-action` 으로 EC2 SSH → `docker compose pull && up -d`

### 0-2. FE 측 현재 자산

- `package.json` — `next dev/build/start`, pnpm 10 (`packageManager` SHA pin)
- `.github/workflows/develop_ci_test.yml` — PR + push to develop 시 lint/typecheck/format/unit 검증 (배포 미포함)
- `next.config.ts` — 빈 설정 (standalone 모드 미적용)
- middleware.ts — 보호 라우트 redirect, refreshToken 쿠키 검사
- 환경변수 — `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_KAKAO_JS_KEY?`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID?` (모두 NEXT*PUBLIC* prefix → 빌드 타임 inlining)

### 0-3. 본 문서가 정의하는 것

1. FE 컨테이너 이미지 빌드 전략 (Dockerfile)
2. 단일 EC2 에서 BE compose 와 공존하는 런타임 구성
3. GitHub Actions 빌드/배포 워크플로우
4. ECR / IAM / 환경변수 / 헬스체크 / 롤백 정책
5. Reverse proxy (Nginx) 구성 권고 — 단일 진입점

---

## 1. 이미지 빌드 전략

### 1-1. Next.js Standalone 모드 채택

`next.config.ts` 에 다음 추가:

```ts
const nextConfig: NextConfig = {
  output: 'standalone',
};
```

효과:

- `.next/standalone/` 에 server.js + 필요한 node_modules 만 자동 복사 → runtime 이미지 크기 ~150MB (vs 일반 `next start` 시 ~400MB)
- entry: `node server.js` (PORT 환경변수 인식)
- public/ 과 `.next/static/` 은 별도로 복사해야 함 (standalone 자동 복사 대상 아님)

### 1-2. Multi-stage Dockerfile (제안)

저장 위치: `bandage-fe/Dockerfile` (BE 의 `v1/Dockerfile` 과 패턴 일치)

```dockerfile
# syntax=docker/dockerfile:1.7

# ============================================================
# 1) Dependencies stage — pnpm 설치 + 의존성 캐싱
# ============================================================
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat \
 && corepack enable

# pnpm-lock.yaml + package.json 만 먼저 복사해서 deps 캐시 적중률 최대화
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
# (값은 GitHub Actions build-args 로 전달)
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
 && addgroup -S nodejs && adduser -S nextjs -G nodejs -h /app -s /sbin/nologin

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
```

### 1-3. Health check route

`src/app/api/health/route.ts` 신규 (5줄):

```ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

Dockerfile HEALTHCHECK + Nginx upstream check 양쪽이 사용.

### 1-4. .dockerignore

```
node_modules
.next
.git
.github
.taskmaster
tests
**/*.test.ts
**/*.test.tsx
**/__snapshots__
*.md
.env.local
.env.*.local
.vscode
.idea
playwright-report
test-results
coverage
```

### 1-5. NEXT*PUBLIC*\* 환경변수 주입 정책

**문제**: `NEXT_PUBLIC_*` 는 `next build` 시점에 코드에 inline 됨. runtime 주입 불가 → **환경별 이미지 분리 필수**.

**정책**:

- 한 이미지 = 한 환경 (dev / staging / prod 별도 빌드)
- ECR 레포지토리는 동일 (`bandage-fe`), 태그로 환경 구분 (`dev-${sha}`, `dev-latest`, `prod-${sha}`, `prod-latest`)
- GitHub Actions 가 환경별 build-arg 를 secret 에서 읽어 주입

대안 (향후 검토): runtime 주입을 위해 build 시 placeholder 두고 entrypoint 가 sed 로 치환하는 패턴. 보편적이나 복잡도 ↑. 현 단계 미적용.

---

## 2. 단일 EC2 런타임 구성

### 2-1. 디렉토리 레이아웃 (EC2)

```
~/bandage/
├── docker-compose.yml          # BE 가 이미 운영 중인 파일
├── docker-compose.fe.yml       # FE 전용 추가 (신규)
├── nginx/
│   ├── nginx.conf
│   └── conf.d/bandage.conf
├── .env                        # BE 환경변수 (기존)
├── .env.fe                     # FE 환경변수 (신규, 런타임 주입용 — 현재는 미사용 placeholder)
├── db/                         # postgres data volume
└── redis/                      # redis data volume
```

### 2-2. FE compose override (`docker-compose.fe.yml`)

BE compose 와 분리해 독립 배포 가능하도록 별도 파일. `docker compose -f docker-compose.yml -f docker-compose.fe.yml ...` 로 합쳐서 실행.

```yaml
services:
  fe-web:
    image: 595028889928.dkr.ecr.ap-northeast-2.amazonaws.com/bandage-fe:dev-latest
    container_name: bandage-fe
    expose:
      - '3000'
    # localhost 외부 노출은 nginx 로 일원화 — 직접 publish 안 함.
    # 만약 임시로 직접 접근하려면: ports: ["3000:3000"]
    restart: always
    healthcheck:
      test: ['CMD', 'curl', '-fsS', 'http://localhost:3000/api/health']
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
    depends_on:
      api-server-a:
        condition: service_started

  nginx:
    image: nginx:1.27-alpine
    container_name: bandage-nginx
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro # certbot 사용 시
    depends_on:
      fe-web:
        condition: service_started
      api-server-a:
        condition: service_started
    restart: always
```

> BE `docker-compose.yml` 의 `api-server-a` 가 8080 을 외부로 publish 하고 있는데, nginx 도입 시 BE 도 `expose: ["8080"]` 로 바꾸고 nginx 가 `/api/v1/*` 를 프록시하도록 정리 권고. 본 PR 범위 외 (BE 결정 사항).

### 2-3. Nginx 구성 (예시)

`nginx/conf.d/bandage.conf`:

```nginx
upstream fe_upstream {
    server fe-web:3000;
    keepalive 32;
}

upstream be_upstream {
    server api-server-a:8080;
    keepalive 32;
}

server {
    listen 80;
    server_name <도메인>;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name <도메인>;

    ssl_certificate     /etc/letsencrypt/live/<도메인>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<도메인>/privkey.pem;

    # Next.js 정적 자원 — immutable 이므로 강한 캐시
    location /_next/static/ {
        proxy_pass http://fe_upstream;
        proxy_set_header Host $host;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # BE API 프록시
    location /api/v1/ {
        proxy_pass http://be_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # FE 모든 라우트 (SSR)
    location / {
        proxy_pass http://fe_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
```

#### Nginx 도입의 효과

- 단일 진입점 (80/443) — 보안 그룹 규칙 단순화 (3000/8080 직노출 제거)
- HTTPS 종단 — Let's Encrypt 갱신 자동화 (certbot 컨테이너 별도)
- FE/BE 라우팅 분리 — 동일 도메인에서 /api/v1/\* 는 BE, 그 외는 FE
- 정적 자원 강한 캐시 — `_next/static/*` 은 hash 기반이라 안전
- CORS 단순화 — 같은 origin 이면 사실상 불필요

#### 도입 미루기 옵션 (간이)

nginx 부담스러우면 초기에는 FE 가 `:3000`, BE 가 `:8080` 직노출 + 보안 그룹으로 8080 차단 + 도메인은 FE 만 (BE 는 IP 직접 호출). 단 HTTPS 안 되고 CORS 설정 명시적으로 필요. **Production 가기 전에 nginx 권고**.

---

## 3. GitHub Actions 워크플로우

### 3-1. 기존 `develop_ci_test.yml` 유지 (PR 검증)

변경 없음. lint/typecheck/format/unit 만 수행, 배포 안 함.

### 3-2. 신규 `develop_deploy.yml` (제안)

저장 위치: `.github/workflows/develop_deploy.yml`

```yaml
name: Deploy FE to EC2 (Develop)

on:
  push:
    branches: [develop]
  workflow_dispatch:
    inputs:
      image_tag:
        description: '배포할 이미지 태그 (예: dev-abcd123). 비우면 새로 빌드'
        required: false
        type: string

env:
  AWS_REGION: ap-northeast-2
  ECR_REPOSITORY: bandage-fe
  ENV_NAME: dev

permissions:
  contents: read
  id-token: write # OIDC 사용 시 필요. AccessKey 방식 유지하면 제거 가능

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Compute image tags
        id: tags
        run: |
          SHA=$(echo "${{ github.sha }}" | cut -c1-7)
          if [ -n "${{ inputs.image_tag }}" ]; then
            echo "use_existing=true" >> $GITHUB_OUTPUT
            echo "primary_tag=${{ inputs.image_tag }}" >> $GITHUB_OUTPUT
          else
            echo "use_existing=false" >> $GITHUB_OUTPUT
            echo "primary_tag=${ENV_NAME}-${SHA}" >> $GITHUB_OUTPUT
            echo "moving_tag=${ENV_NAME}-latest" >> $GITHUB_OUTPUT
          fi

      - name: Set up Docker Buildx
        if: steps.tags.outputs.use_existing == 'false'
        uses: docker/setup-buildx-action@v3

      - name: Build & push image
        if: steps.tags.outputs.use_existing == 'false'
        uses: docker/build-push-action@v5
        env:
          REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.ECR_REPOSITORY }}:${{ steps.tags.outputs.primary_tag }}
            ${{ env.REGISTRY }}/${{ env.ECR_REPOSITORY }}:${{ steps.tags.outputs.moving_tag }}
          build-args: |
            NEXT_PUBLIC_API_BASE_URL=${{ secrets.DEV_API_BASE_URL }}
            NEXT_PUBLIC_APP_ENV=dev
            NEXT_PUBLIC_KAKAO_JS_KEY=${{ secrets.DEV_KAKAO_JS_KEY }}
            NEXT_PUBLIC_GOOGLE_CLIENT_ID=${{ secrets.DEV_GOOGLE_CLIENT_ID }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: false

      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1.0.3
        env:
          REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ steps.tags.outputs.primary_tag }}
        with:
          host: ${{ secrets.EC2_HOST }}
          username: rocky
          key: ${{ secrets.EC2_SSH_KEY }}
          envs: REGISTRY,IMAGE_TAG
          script: |
            set -euo pipefail
            cd ~/bandage

            aws ecr get-login-password --region ap-northeast-2 \
              | docker login --username AWS --password-stdin "$REGISTRY"

            # docker-compose.fe.yml 의 image 태그를 갱신.
            # (image: ...:dev-latest 의 dev-latest 부분만 sed 로 치환)
            sed -i.bak -E "s|(bandage-fe:)[^ ]+|\1${IMAGE_TAG}|" docker-compose.fe.yml

            docker compose -f docker-compose.yml -f docker-compose.fe.yml pull fe-web
            docker compose -f docker-compose.yml -f docker-compose.fe.yml up -d --no-deps fe-web

            # 헬스체크 통과 대기 (최대 60초)
            for i in $(seq 1 30); do
              if docker inspect --format='{{.State.Health.Status}}' bandage-fe 2>/dev/null | grep -q healthy; then
                echo "fe-web healthy"; exit 0
              fi
              sleep 2
            done
            echo "fe-web 헬스체크 실패 — 로그 출력 후 종료" >&2
            docker logs --tail=200 bandage-fe
            exit 1
```

#### 핵심 포인트

- **이미지 태그 두 개**: `dev-${sha}` (불변, 롤백용) + `dev-latest` (최신 가리키는 mutable). compose 는 `dev-${sha}` 로 고정해 배포의 결정성 확보.
- **배포 트리거**: `develop` push 시 자동 + `workflow_dispatch` 로 임의 태그 재배포 (롤백/리플레이).
- **`--no-deps fe-web`**: BE 컨테이너 건드리지 않고 FE 만 swap.
- **헬스체크 기반 검증**: 컨테이너 healthy 가 될 때까지 대기 후 실패 시 로그 덤프.
- **BE 와의 일관성**: `appleboy/ssh-action` + `docker compose pull/up` 패턴 동일.

### 3-3. 향후 prod 워크플로우 (참고)

`main` 브랜치 push 시 동작. 차이점:

- 환경변수 secret 키 prefix 가 `PROD_*`
- 이미지 태그 `prod-${sha}` / `prod-latest`
- ECR `bandage-fe` 같은 레포에 prod 태그 함께 보관
- **수동 승인 단계** (`environment: production` GitHub Actions Environments 의 protection rules) 권고

---

## 4. AWS 인프라 셋업 체크리스트

### 4-1. ECR

- [ ] ECR 레포지토리 `bandage-fe` 생성 (region `ap-northeast-2`)
- [ ] **Lifecycle policy** 설정 — `dev-*` 태그 중 최신 10개만 보존, 그 외 30일 후 자동 삭제 (롤백 충분 + 비용 ↓)
- [ ] Image scanning on push 활성화 권고

### 4-2. IAM

#### 옵션 A — 기존 BE 패턴과 동일 (Access Key) — 권장 (BE 와 일관성)

- [ ] IAM 사용자 (`github-actions-deploy` 같은 이름) 또는 BE 와 동일 사용자 재사용
- [ ] 정책: `AmazonEC2ContainerRegistryPowerUser` (또는 더 좁게 `bandage-fe` 레포만 ECR push 권한)
- [ ] 키쌍 발급 → GitHub Secrets `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

#### 옵션 B — OIDC (장기 권고)

- [ ] AWS IAM OIDC provider 추가 (`token.actions.githubusercontent.com`)
- [ ] IAM Role 생성 + trust policy 에 GitHub repo 한정 (`repo:willjsw/Bandage-FE-Web:ref:refs/heads/develop`)
- [ ] 정책: ECR push + (필요 시) SSM SendCommand
- 효과: 장기 secret 제거, GitHub repo + branch + environment 단위로 권한 격리

### 4-3. EC2

- [ ] AWS CLI 설치 (`aws ecr get-login-password` 사용 위해)
- [ ] EC2 IAM 인스턴스 프로파일 — `AmazonEC2ContainerRegistryReadOnly` (ECR pull 권한)
- [ ] 보안 그룹: 80/443 만 외부 개방, 22 는 GitHub Actions IP 또는 SSM 으로 제한 (현재 BE 가 SSH 사용 중이라 22 는 그대로)
- [ ] `~/bandage/` 디렉토리 + `docker-compose.fe.yml` + `nginx/` 사전 배치
- [ ] 도메인 DNS A 레코드 → EC2 EIP

### 4-4. GitHub Secrets (FE repo)

| 키                      | 값 출처                            | 용도                              |
| ----------------------- | ---------------------------------- | --------------------------------- |
| `AWS_ACCESS_KEY_ID`     | IAM 사용자 키                      | ECR push (또는 OIDC 도입 시 제거) |
| `AWS_SECRET_ACCESS_KEY` | IAM 사용자 시크릿                  | 동일                              |
| `EC2_HOST`              | EC2 EIP 또는 도메인                | SSH host                          |
| `EC2_SSH_KEY`           | SSH private key (PEM)              | SSH 인증                          |
| `DEV_API_BASE_URL`      | `https://<도메인>` (또는 EC2 IP)   | FE 빌드 inlining                  |
| `DEV_KAKAO_JS_KEY`      | 카카오 콘솔 JS 키                  | FE 빌드 inlining (현재 보류)      |
| `DEV_GOOGLE_CLIENT_ID`  | Google Cloud Console 클라이언트 ID | FE 빌드 inlining                  |

> Kakao 가 일시 보류 상태이므로 빈 값으로 두면 `optionalNonEmpty` 가 normalize 함 — 빌드 실패 안 함.

---

## 5. 환경변수 정책 정리

### 5-1. 빌드 타임 vs 런타임

| 변수                                 | 시점   | 위치                            | 변경 시           |
| ------------------------------------ | ------ | ------------------------------- | ----------------- |
| `NEXT_PUBLIC_API_BASE_URL`           | 빌드   | GitHub Secrets → Dockerfile ARG | 재빌드 + 재배포   |
| `NEXT_PUBLIC_APP_ENV`                | 빌드   | 워크플로우 ENV                  | 재빌드 + 재배포   |
| `NEXT_PUBLIC_KAKAO_JS_KEY`           | 빌드   | GitHub Secrets                  | 재빌드 + 재배포   |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`       | 빌드   | GitHub Secrets                  | 재빌드 + 재배포   |
| `NODE_ENV`, `PORT`, `HOSTNAME`, `TZ` | 런타임 | Dockerfile ENV / compose        | 컨테이너 재시작만 |

### 5-2. 환경별 분리

- **dev**: 본 문서가 다루는 우선 대상. ECR 태그 `dev-*`, 도메인 `<dev-host>`.
- **prod**: 별도 워크플로우 (`main_deploy.yml`) 도입 시 ECR 태그 `prod-*`, 다른 EC2 또는 다른 EIP. **본 문서 범위 외**.

### 5-3. 보안

- `NEXT_PUBLIC_*` 는 모두 클라이언트에 노출되는 값 → secret 으로 다루지만 코드 검색에서 발견되어도 위험 ↓ (provider client_id 등은 본래 공개되도록 설계됨)
- 진짜 secret (DB password, JWT secret) 은 BE compose 의 `.env` 에만, FE 에는 절대 inline 하지 않음

---

## 6. 헬스체크 / 모니터링 / 롤백

### 6-1. 헬스체크

- **컨테이너**: Dockerfile HEALTHCHECK + compose `healthcheck:`
- **앱**: `/api/health` 라우트 — `200 { status: "ok" }` 반환
- **Nginx**: `proxy_next_upstream error timeout http_502 http_503 http_504`

### 6-2. 로그

- 단기: `docker logs bandage-fe --tail 500 -f` (EC2 ssh 진입)
- 권고: docker compose `logging:` driver 를 `awslogs` 로 변경 → CloudWatch Logs (FE/BE 통합 검색 가능)
- 또는 호스트의 systemd journal + Promtail → Grafana Cloud

### 6-3. 롤백

- 자동 롤백 X (단일 인스턴스 한계). 수동 워크플로우로 처리.
- 절차:
  1. `Actions → Deploy FE to EC2 (Develop) → Run workflow → image_tag: dev-<old-sha>` 입력
  2. 워크플로우가 빌드 스킵하고 EC2 의 compose 만 해당 태그로 swap
- 전제: ECR lifecycle policy 가 최근 N개 보존하므로 빠른 롤백 가능

### 6-4. 다운타임

- 단일 인스턴스 + 단일 컨테이너 → swap 동안 5~10초 502 발생 가능
- 완화: Nginx 가 502 응답 시 재시도 + 사용자에게는 "잠시 후 다시 시도" 페이지 (Nginx `error_page` 또는 Next.js custom error)
- 진정한 zero-downtime 원하면: 같은 호스트에 FE 컨테이너 2개 (blue/green) + Nginx upstream 동적 갱신. 단일 인스턴스라도 가능하지만 복잡도 ↑. **본 문서 권고: 일단 5초 다운타임 수용**.

---

## 7. FE 측 코드 변경 (배포 전 선행 작업)

본 설계 채택 시 FE repo 에 추가/수정할 항목 (별도 PR 권고):

| 파일                                   | 변경                        |
| -------------------------------------- | --------------------------- |
| `next.config.ts`                       | `output: 'standalone'` 추가 |
| `Dockerfile`                           | 신규 (§1-2)                 |
| `.dockerignore`                        | 신규 (§1-4)                 |
| `src/app/api/health/route.ts`          | 신규 (§1-3)                 |
| `.github/workflows/develop_deploy.yml` | 신규 (§3-2)                 |

EC2 에 배치할 자산 (FE repo 외부 또는 별도 ops repo):

| 파일                                             | 위치                   | 용도                |
| ------------------------------------------------ | ---------------------- | ------------------- |
| `docker-compose.fe.yml`                          | EC2 `~/bandage/`       | FE compose override |
| `nginx/nginx.conf` + `nginx/conf.d/bandage.conf` | EC2 `~/bandage/nginx/` | Nginx 진입점        |

> EC2 ops 자산은 FE repo 에 두지 않고 별도 ops repo (또는 BE repo `v1/`) 에 두는 것을 권고 — FE 도 BE 도 그 자산을 참조만. 본 문서는 인용만 하고 실제 위치는 추후 합의.

---

## 8. 마이그레이션 순서

### 단계 1 — FE Dockerization

1. FE repo 에 Dockerfile / .dockerignore / next.config standalone / health route 추가 (PR)
2. 로컬에서 `docker build . -t bandage-fe:test --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 --build-arg NEXT_PUBLIC_APP_ENV=local` 빌드 검증
3. 로컬에서 `docker run -p 3000:3000 bandage-fe:test` 후 `/api/health` 200 확인

### 단계 2 — AWS 인프라

1. ECR 레포 `bandage-fe` 생성 + lifecycle policy
2. GitHub Secrets 7개 등록 (§4-4)
3. EC2 에 `~/bandage/docker-compose.fe.yml` 사전 배치 (image 필드 placeholder)

### 단계 3 — Nginx 도입 (선택, 권고)

1. EC2 에 nginx 컨테이너 추가 + Let's Encrypt cert 발급
2. BE compose 의 `api-server-a` 의 `ports` 를 `expose` 로 변경 (8080 외부 노출 차단)
3. 도메인 DNS → EC2 EIP

### 단계 4 — 배포 워크플로우 도입

1. `.github/workflows/develop_deploy.yml` 추가 (PR)
2. develop 머지 직후 워크플로우 자동 실행 → ECR 푸시 → EC2 배포 → 헬스체크
3. 도메인 `https://<dev-host>/login` 접속해 동작 확인

### 단계 5 — 롤백 시뮬레이션

1. `workflow_dispatch` 로 한 단계 이전 `dev-${old-sha}` 태그 재배포
2. 정상 복귀 확인 → 롤백 절차 검증 완료

---

## 9. 위험 / 미정 항목

- **BE compose 와의 image 플랫폼 일치** — BE 는 `amazoncorretto:21-alpine` (linux/amd64) 가정. FE 도 amd64 로 빌드해야 EC2 (보통 amd64) 에서 동작. M1/M2 맥에서 빌드 시 `--platform linux/amd64` 명시 필수. GitHub Actions ubuntu-latest 는 amd64 → 자동 OK.
- **HTTPS 종단 위치** — 현재 BE 가 8080 직노출 → SameSite=None; Secure 쿠키가 http 환경에서는 일부 브라우저에서 설정 안 됨. nginx + Let's Encrypt 도입 전까지는 CORS 설정으로 우회.
- **EC2 디스크 사용량** — 이미지 누적 → `docker image prune -af --filter "until=168h"` cron 권고.
- **Next.js standalone 의 한계** — `next.config.ts` 의 `experimental.serverComponentsExternalPackages` 등은 standalone 빌드 시 동작 검증 필요. 현재 설정 비어 있어 문제 없음.
- **prod 분리 시점** — 본 문서는 dev 만 다룸. prod 도입 시 별 EC2 / 별 도메인 / 별 ECR 태그 prefix / 별 secrets / 수동 승인 추가.
- **OIDC 전환** — BE 와 일관성 위해 일단 Access Key. 향후 BE/FE 동시에 OIDC 전환 (별도 ops 작업).
- **CDN (CloudFront)** — `_next/static/*` 캐시 효과 한계 시 도입. 단일 인스턴스 + 도메인 위에 CloudFront 추가 후 origin 을 EC2 로. 본 단계 미적용.

---

## 10. 부록 — 비교 의사결정표

| 항목          | 선택                                   | 대안                             | 결정 사유                                        |
| ------------- | -------------------------------------- | -------------------------------- | ------------------------------------------------ |
| 빌드 모드     | standalone                             | `next start` + 전체 node_modules | 이미지 크기 60% 감소                             |
| 베이스 이미지 | `node:20-alpine`                       | `node:20-slim`                   | Alpine 이 더 가볍고 BE Dockerfile 도 alpine 일관 |
| 이미지 태그   | `dev-${sha}` + `dev-latest`            | `latest` 단일 (BE 현행)          | 결정성 + 롤백                                    |
| 배포 도구     | `appleboy/ssh-action` + docker compose | AWS CodeDeploy, ECS, EKS         | BE 와 일관 + 단일 EC2 라 over-engineering 회피   |
| 인증          | AWS Access Key                         | OIDC                             | BE 패턴 일관성 (OIDC 는 후속)                    |
| 롤백          | manual workflow_dispatch               | 자동 health-fail rollback        | 단일 인스턴스 한계 + 수동이 충분                 |
| 진입점        | Nginx                                  | FE/BE 직노출                     | HTTPS + 보안 그룹 단순화 + 정적 캐시             |
| Zero-downtime | 미도입 (5초 다운타임 수용)             | blue/green                       | 단일 인스턴스에서 부담 vs 효과                   |

---

## 11. 후속 작업 권고

- [ ] 본 설계 합의 후 **단계 1 (FE Dockerization) PR** 생성
- [ ] **단계 4 (배포 워크플로우 도입) PR** 생성
- [ ] BE 측에 `api-server-a` 의 `expose` 전환 + nginx 도입 협의 (BE repo 작업)
- [ ] ops 자산 (`docker-compose.fe.yml`, `nginx/`) 의 위치 합의 (FE repo / BE repo / 별도 ops repo)
- [ ] CloudWatch Logs 통합 (모니터링 PR — BE 와 동시)
- [ ] 도메인 + Let's Encrypt 발급 (인프라)

---

끝.
