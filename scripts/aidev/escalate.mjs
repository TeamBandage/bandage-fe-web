/**
 * "자동화 중단 · 사람 인계" — 재시도 상한을 넘기면 dev-agent.mjs(자가 검증 실패)와
 * watch-review.mjs(게이트·사람 반려) 양쪽에서 부른다.
 *
 * state.escalated를 가장 먼저 저장한다. 뒤따르는 gh·Slack 호출이 실패하더라도 이 태스크가
 * 다시 자동으로 집히지 않는 것(무한 루프 방지)이 알림보다 우선이기 때문이다.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function saveState(dir, state) {
  writeFileSync(join(dir, 'state.json'), JSON.stringify(state, null, 2) + '\n');
}

async function notifySlack(text) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    console.warn('[aidev] SLACK_WEBHOOK_URL 미설정 — 콘솔에만 기록합니다.');
    return;
  }
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }).catch((err) => console.warn('[aidev] Slack 전송 실패:', err.message));
}

function tryGh(args) {
  try {
    execFileSync('gh', args, { cwd: ROOT, stdio: 'pipe' });
  } catch {
    // 이미 draft이거나 needs-human 라벨이 리포에 없을 수 있다 — Slack이 1차 신호라 무시한다
  }
}

export async function escalate({ issueKey, dir, state, reason }) {
  state.escalated = true;
  saveState(dir, state);

  if (state.prUrl) {
    tryGh(['pr', 'ready', state.prUrl, '--undo']);
    tryGh(['pr', 'edit', state.prUrl, '--add-label', 'needs-human']);
  }

  const where = state.prUrl ?? 'PR 생성 전 중단 — 로컬 브랜치를 확인하세요';
  await notifySlack(
    `:warning: [${issueKey}] AI 개발 루프 중단 — 사람 확인 필요\n사유: ${reason}\n${where}`,
  );
  console.error(`[aidev] ${issueKey} 자동화 중단 · 사람 인계 — ${reason}`);
}
