#!/usr/bin/env node
/**
 * Phase D 결과를 감지해 재시도 루프를 닫는 로컬 상시 프로세스. (상한: config.mjs의 MAX_RETRY)
 *
 * dev-agent.mjs 는 로컬 Claude Pro 세션에 귀속되어 CI에서 못 돌기 때문에, 게이트 실패·반려를
 * 감지해 다시 dev-agent.mjs 를 호출하는 역할은 이 스크립트가 로컬에서 맡는다.
 *
 * GitHub Actions(클라우드)는 임의의 로컬 기기에 직접 신호를 보낼 수 없으므로, 워크플로우가
 * 자동 검사 실패 · Gemini 반려 · 사람 반려 시점에 무료 push 서비스 ntfy.sh로 신호를 던지고,
 * 이 스크립트는 거기 연결을 열어둔 채(long-poll) 신호가 오면 즉시 반응한다.
 *
 * 주기적 폴링은 하지 않는다. 시작할 때 한 번만 전체를 훑어 꺼져 있던 동안의 신호를 따라잡는다.
 *
 * 사용:
 *   pnpm aidev:watch            # 시작 시 1회 점검 후 ntfy 신호 대기
 *   pnpm aidev:watch --once     # 1회만 전체 점검하고 종료
 *
 * 환경변수:
 *   NTFY_TOPIC        — GitHub 시크릿과 같은 값. 없으면 신호를 못 받는다.
 *   SLACK_WEBHOOK_URL — 선택. 자동화 중단 시 알림.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GATE_ERROR_MARKER, MAX_RETRY } from './config.mjs';
import { escalate, saveState } from './escalate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const INBOX = join(ROOT, '.aidev', 'inbox');
const NTFY_TOPIC = process.env.NTFY_TOPIC;
const ISSUE_KEY = /^BD-\d+$/;
const SETTLE_POLL_MS = 15_000;
const SETTLE_MAX_TRIES = 40;
const FAILED_CONCLUSIONS = new Set(['FAILURE', 'TIMED_OUT', 'ACTION_REQUIRED', 'STARTUP_FAILURE']);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const inFlight = new Set();

function ghJson(args) {
  return JSON.parse(execFileSync('gh', args, { cwd: ROOT, encoding: 'utf-8' }));
}

function loadState(dir) {
  return JSON.parse(readFileSync(join(dir, 'state.json'), 'utf-8'));
}

/**
 * dev-agent 재실행. 디스패치 **전에** 카운터를 올려 저장하는 게 핵심이다 — dev-agent는 자기
 * 자가 검증이 실패했을 때만 카운터를 올리므로, 여기서 세지 않으면 같은 반려로 영원히 되돌아온다.
 */
function dispatchRetry(issueKey, dir, state, reason) {
  state.retryCount += 1;
  saveState(dir, state);
  console.log(`[watch-review] ${issueKey} 재시도(${state.retryCount}/${MAX_RETRY}) 트리거`);
  const result = spawnSync(
    'node',
    [join(ROOT, 'scripts/aidev/dev-agent.mjs'), issueKey, '--retry', reason],
    { cwd: ROOT, stdio: 'inherit' },
  );
  if (result.status === 3) {
    console.error(`[watch-review] ${issueKey} dev-agent가 상한 초과로 사람에게 넘겼습니다.`);
  } else if (result.status !== 0) {
    console.error(
      `[watch-review] ${issueKey} dev-agent 비정상 종료(${result.status}) — 로그 확인 필요`,
    );
  }
}

/** gate-d2만 실패했고 가장 최근 gate-d2 코멘트가 실행 오류 마커면, Claude가 고칠 문제가 아니다. */
function isGateError(comments, failing) {
  if (failing.some((c) => c.name !== 'gate-d2')) return false;
  const last = (comments ?? [])
    .filter((c) => c.body.includes(GATE_ERROR_MARKER) || c.body.startsWith('## 🤖 Gemini 리뷰'))
    .pop();
  return Boolean(last?.body.includes(GATE_ERROR_MARKER));
}

/** 반환값: 체크가 아직 도는 중이면 'pending', 판단을 끝냈으면 'done'. */
async function checkOne(issueKey) {
  const dir = join(INBOX, issueKey);
  if (!existsSync(join(dir, 'state.json'))) return 'done';
  const state = loadState(dir);
  if (!state.prUrl || state.escalated) return 'done';

  const pr = ghJson([
    'pr',
    'view',
    state.prUrl,
    '--json',
    'state,statusCheckRollup,reviews,comments',
  ]);
  if (pr.state === 'MERGED' || pr.state === 'CLOSED') return 'done';

  // Gate 3에서 사람이 반려해도 게이트 실패와 같은 재시도 풀을 쓴다 (config.mjs 참고).
  const changesRequested = (pr.reviews ?? []).filter((r) => r.state === 'CHANGES_REQUESTED').pop();
  if (changesRequested && changesRequested.id !== state.lastHandledReviewId) {
    if (state.retryCount >= MAX_RETRY) {
      await escalate({
        issueKey,
        dir,
        state,
        reason: `사람 반려 후 재시도 상한(${MAX_RETRY}회) 초과`,
      });
      return 'done';
    }
    state.lastHandledReviewId = changesRequested.id;
    dispatchRetry(
      issueKey,
      dir,
      state,
      `사람 리뷰 반려(Gate 3):\n${changesRequested.body || '(코멘트 없음)'}`,
    );
    return 'done';
  }

  const rollup = pr.statusCheckRollup ?? [];
  if (rollup.some((c) => c.status && c.status !== 'COMPLETED')) return 'pending';

  // 라벨 없이 열린 첫 이벤트는 SKIPPED, 중복 실행은 CANCELLED로 남는다 — 실패로 세면 안 된다.
  const failing = rollup.filter((c) => FAILED_CONCLUSIONS.has(c.conclusion));
  if (failing.length === 0) return 'done'; // 모두 통과 — Gate 3(사람 머지 승인) 대기

  if (isGateError(pr.comments, failing)) {
    console.warn(
      `[watch-review] ${issueKey} Gemini 리뷰 실행 오류 — 코드 문제가 아니라 재시도하지 않습니다. 원인 해결 후 Actions에서 gate-d2를 재실행하세요.`,
    );
    return 'done';
  }

  const names = failing.map((f) => f.name).join(', ');
  if (state.retryCount >= MAX_RETRY) {
    await escalate({
      issueKey,
      dir,
      state,
      reason: `재시도 상한(${MAX_RETRY}회) 초과 — 실패 체크: ${names}`,
    });
    return 'done';
  }
  dispatchRetry(
    issueKey,
    dir,
    state,
    `실패한 체크: ${names}\nPR의 체크 로그와 Gemini 리뷰 코멘트를 확인해 고쳐라.`,
  );
  return 'done';
}

/**
 * 신호는 체크 잡이 끝나기 직전(예: gate-d2 스크립트 안)에 날아오므로, 받는 순간엔 체크가 아직
 * "진행 중"일 수 있다. 주기 폴링이 없어서 여기서 놓치면 다시 볼 기회가 없으니, 결론이 날 때까지
 * 짧게 기다렸다 다시 본다(최대 10분).
 */
async function checkWhenSettled(issueKey) {
  if (inFlight.has(issueKey)) return;
  inFlight.add(issueKey);
  try {
    for (let i = 0; i < SETTLE_MAX_TRIES; i++) {
      if ((await checkOne(issueKey)) === 'done') return;
      await sleep(SETTLE_POLL_MS);
    }
    console.warn(
      `[watch-review] ${issueKey} 체크가 10분 넘게 안 끝나 대기를 멈춥니다. 재시작 시 다시 봅니다.`,
    );
  } catch (err) {
    console.error(`[watch-review] ${issueKey} 점검 실패:`, err.message);
  } finally {
    inFlight.delete(issueKey);
  }
}

async function tick() {
  if (!existsSync(INBOX)) return;
  for (const issueKey of readdirSync(INBOX).filter((name) => ISSUE_KEY.test(name))) {
    try {
      await checkOne(issueKey);
    } catch (err) {
      console.error(`[watch-review] ${issueKey} 점검 실패:`, err.message);
    }
  }
}

/** ntfy.sh 스트림 한 줄(JSON) 처리. keepalive는 무시하고, 형식에 맞는 이슈 키만 받는다. */
function handleNtfyLine(line) {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return null;
  }
  if (msg.event !== 'message' || !msg.message) return null;
  const [issueKey] = msg.message.split(' ');
  if (ISSUE_KEY.test(issueKey)) {
    console.log(`[watch-review] 신호 수신: ${msg.message}`);
    checkWhenSettled(issueKey);
  }
  return msg.id;
}

/** ntfy.sh에 연결을 열어두고 신호를 받는다. 끊기면 마지막으로 받은 메시지 이후부터 이어 받는다. */
async function listenNtfy() {
  if (!NTFY_TOPIC) {
    console.warn(
      '[watch-review] NTFY_TOPIC 미설정 — 신호를 받을 수 없어 시작 시 1회 점검만 했습니다.',
    );
    return;
  }
  let since = String(Math.floor(Date.now() / 1000));
  for (;;) {
    try {
      const res = await fetch(`https://ntfy.sh/${NTFY_TOPIC}/json?since=${since}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
          const id = handleNtfyLine(buffer.slice(0, newlineIndex));
          if (id) since = id;
          buffer = buffer.slice(newlineIndex + 1);
        }
      }
    } catch (err) {
      console.error('[watch-review] ntfy 연결 끊김, 5초 후 재연결:', err.message);
    }
    await sleep(5000);
  }
}

async function main() {
  await tick();
  if (process.argv.includes('--once')) return;
  listenNtfy();
}

main();
