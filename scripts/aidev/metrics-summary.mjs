#!/usr/bin/env node
/**
 * .aidev/metrics/history.jsonl 을 콘솔 표로 요약한다. 대시보드 대신 최소 확인 수단.
 *
 * 사용: pnpm aidev:metrics
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const HISTORY_PATH = join(ROOT, '.aidev', 'metrics', 'history.jsonl');

function main() {
  if (!existsSync(HISTORY_PATH)) {
    console.log('아직 기록된 메트릭이 없습니다.');
    return;
  }
  const lines = readFileSync(HISTORY_PATH, 'utf-8').trim().split('\n').filter(Boolean);
  const records = lines.map((line) => JSON.parse(line));

  console.table(
    records.map((r) => ({
      issue: r.issueKey,
      retries: r.retryCount,
      costUsd: r.tokenUsedUsd?.toFixed(4),
      mergedAt: r.mergedAt,
    })),
  );

  const totalCost = records.reduce((sum, r) => sum + (r.tokenUsedUsd ?? 0), 0);
  const totalRetries = records.reduce((sum, r) => sum + (r.retryCount ?? 0), 0);
  console.log(
    `총 ${records.length}건 · 누적 비용 $${totalCost.toFixed(2)} · 총 재시도 ${totalRetries}회`,
  );
}

main();
