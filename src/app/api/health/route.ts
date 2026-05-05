/**
 * Liveness probe — Dockerfile HEALTHCHECK + nginx upstream + 배포 검증 스크립트가 사용.
 * 의도적으로 가볍게: BE 호출/DB 검사 없음.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
