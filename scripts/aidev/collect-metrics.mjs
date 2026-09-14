#!/usr/bin/env node
/**
 * Phase E2 — 머지 시점 메트릭 한 줄을 .aidev/metrics/history.jsonl 에 append.
 *
 * 재시도 횟수·Claude 사용량은 로컬 state.json에만 있고 CI에는 없으므로, dev-agent.mjs가
 * PR 본문 끝에 숨겨 둔 `<!-- aidev-metrics {...} -->` 마커에서 읽는다.
 * Datadog 같은 대시보드는 아직 없어(YAGNI) JSONL로만 남긴다.
 *
 * 사용: node scripts/aidev/collect-metrics.mjs <issueKey> <prUrl>   (GH_TOKEN 필요)
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const METRICS_DIR = join(ROOT, '.aidev', 'metrics');
const HISTORY_PATH = join(METRICS_DIR, 'history.jsonl');

export function parseMetricsFromBody(body) {
  const match = body?.match(/<!-- aidev-metrics (\{.*?\}) -->/);
  if (!match) return {};
  try {
    return JSON.parse(match[1]);
  } catch {
    return {};
  }
}

export function buildRecord(issueKey, prUrl, metrics) {
  return {
    issueKey,
    prUrl,
    mergedAt: new Date().toISOString(),
    retryCount: metrics.retryCount ?? 0,
    tokenUsedUsd: metrics.tokenUsedUsd ?? 0,
  };
}

function main() {
  const [issueKey, prUrl] = process.argv.slice(2);
  if (!issueKey || !prUrl) {
    console.error('사용: node scripts/aidev/collect-metrics.mjs <issueKey> <prUrl>');
    process.exit(1);
  }

  let body = '';
  try {
    body = execFileSync('gh', ['pr', 'view', prUrl, '--json', 'body', '-q', '.body'], {
      cwd: ROOT,
      encoding: 'utf-8',
    });
  } catch (err) {
    console.warn('PR 본문을 읽지 못해 메트릭 없이 기록합니다:', err.message);
  }

  const record = buildRecord(issueKey, prUrl, parseMetricsFromBody(body));
  mkdirSync(METRICS_DIR, { recursive: true });
  appendFileSync(HISTORY_PATH, JSON.stringify(record) + '\n');
  console.log(`메트릭 기록 완료: ${JSON.stringify(record)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
