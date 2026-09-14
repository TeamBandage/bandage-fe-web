#!/usr/bin/env node
/**
 * Phase E1 — 머지 후 ADR 갱신. ADR을 새로 만들지 않는다 — Phase B에서 이미 만들어진
 * ADR 문서에 검증(Phase D)을 통과해 실제 머지된 결과만 덧붙인다.
 *
 * ADR 위치 결정 순서: task.json.adrPath → docs/adr/*.md 중 "관련 이슈: <issueKey>" 포함 파일.
 * 어느 쪽도 없으면 이 태스크는 ADR 대상이 아닌 것으로 보고 조용히 종료한다(에러 아님).
 *
 * 사용: node scripts/aidev/update-adr.mjs <issueKey> <prUrl>
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ADR_DIR = join(ROOT, 'docs', 'adr');
const MERGE_MARKER = '<!-- aidev:merge-outcome -->';

function findAdrPath(issueKey) {
  const taskPath = join(ROOT, '.aidev', 'inbox', issueKey, 'task.json');
  if (existsSync(taskPath)) {
    const task = JSON.parse(readFileSync(taskPath, 'utf-8'));
    if (task.adrPath && existsSync(join(ROOT, task.adrPath))) {
      return join(ROOT, task.adrPath);
    }
  }
  if (!existsSync(ADR_DIR)) return null;
  for (const file of readdirSync(ADR_DIR)) {
    if (file === 'TEMPLATE.md' || !file.endsWith('.md')) continue;
    const full = join(ADR_DIR, file);
    const content = readFileSync(full, 'utf-8');
    if (
      content.includes(`관련 이슈**: ${issueKey}`) ||
      content.includes(`관련 이슈: ${issueKey}`)
    ) {
      return full;
    }
  }
  return null;
}

export function appendMergeOutcome(content, { issueKey, prUrl }) {
  const mergedAt = new Date().toISOString().slice(0, 10);
  const marker = `<!-- aidev:merged:${issueKey}:${prUrl} -->`;
  if (content.includes(marker)) {
    return content; // 이미 이 PR로 갱신됨 — 중복 append 방지
  }
  if (!content.includes(MERGE_MARKER)) {
    return null; // 갱신 대상 섹션 자체가 없는 ADR — 형식이 다른 문서일 수 있음
  }

  const entry = [
    '',
    marker,
    `- 머지일: ${mergedAt}`,
    `- PR: ${prUrl}`,
    `- 이슈: ${issueKey}`,
    '- Phase D(자동 게이트 + AI 리뷰) 통과 후 머지됨',
  ].join('\n');

  let next = content.replace(MERGE_MARKER, `${MERGE_MARKER}${entry}`);
  next = next.replace('<!-- status: proposed -->', '<!-- status: accepted -->');
  next = next.replace(/- \*\*상태\*\*: Proposed(.*)$/m, '- **상태**: Accepted$1');
  return next;
}

function main() {
  const [issueKey, prUrl] = process.argv.slice(2);
  if (!issueKey || !prUrl) {
    console.error('사용: node scripts/aidev/update-adr.mjs <issueKey> <prUrl>');
    process.exit(1);
  }

  const adrPath = findAdrPath(issueKey);
  if (!adrPath) {
    console.log(`${issueKey}: 연결된 ADR을 찾지 못했습니다 — 갱신 대상 아님, 정상 종료.`);
    return;
  }

  const content = readFileSync(adrPath, 'utf-8');
  const updated = appendMergeOutcome(content, { issueKey, prUrl });
  if (updated === null) {
    console.warn(`${adrPath}: 머지 결과 섹션 마커가 없어 건너뜁니다 — 수동 확인 필요.`);
    return;
  }
  if (updated === content) {
    console.log(`${adrPath}: 이미 이 PR(${prUrl})로 갱신되어 있습니다.`);
    return;
  }
  writeFileSync(adrPath, updated);
  console.log(`${adrPath} 갱신 완료.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
