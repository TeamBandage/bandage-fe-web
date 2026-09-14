#!/usr/bin/env node
/**
 * Phase D2 — Gemini 리뷰 게이트. GitHub Actions(gate-d2)에서 실행된다.
 *
 * 마켓플레이스 액션 대신 Gemini REST API를 직접 호출한다. 액션의 출력 파일 이름·형식이
 * 문서화돼 있지 않아 조용히 깨질 수 있는 반면, REST 엔드포인트는 계약이 안정적이고
 * 실패 시 원인이 그대로 드러난다.
 *
 * 판정 결과는 PR 코멘트로 남기고, REQUEST_CHANGES면 종료코드 1로 체크를 실패시킨다
 * (그래야 브랜치 보호가 머지를 막는다). 동시에 ntfy로 로컬 재시도 루프를 깨운다.
 *
 * 필요 환경변수: GEMINI_API_KEY, GH_TOKEN, PR_URL, BRANCH. NTFY_TOPIC은 선택.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GATE_ERROR_MARKER } from './config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// 제공 모델이 수시로 바뀐다(2.5-flash는 신규 키에 404) — 코드 수정 없이 리포 변수로 교체할 수 있게 둔다.
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const MAX_DIFF_CHARS = 180_000;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`환경변수 ${name} 가 필요합니다.`);
    process.exit(1);
  }
  return value;
}

/** 브랜치명(`feat/BD-11-...`)에서 이슈 키를 역산해 인박스 산출물을 찾는다. */
function loadInbox(branch) {
  const issueKey = branch.match(/BD-\d+/)?.[0];
  if (!issueKey) return { issueKey: null, spec: '', plan: '' };
  const dir = join(ROOT, '.aidev', 'inbox', issueKey);
  const read = (f) => (existsSync(join(dir, f)) ? readFileSync(join(dir, f), 'utf-8') : '');
  return { issueKey, spec: read('spec.md'), plan: read('plan.md') };
}

function loadChecklist() {
  const claudeMd = join(ROOT, 'CLAUDE.md');
  if (!existsSync(claudeMd)) return '';
  // CLAUDE.md의 "코드 리뷰 체크리스트" 절을 단일 소스로 인용한다 — 프롬프트에 복붙해두면
  // 체크리스트를 고쳤을 때 리뷰 기준만 낡은 채로 남는다.
  const section = readFileSync(claudeMd, 'utf-8').match(
    /### 코드 리뷰 체크리스트\n+((?:- .*\n?)+)/,
  );
  return section ? section[1].trim() : '';
}

function buildPrompt({ spec, plan, diff, checklist }) {
  return [
    '너는 이 저장소의 코드 리뷰 게이트다. 아래 PR diff를 심사하라.',
    '',
    '## 심사 기준',
    '1. 스펙 적합성 — 아래 스펙과 구현 계획의 요구사항을 실제로 충족하는가.',
    '2. 안티패턴 — 아래 체크리스트 위반이 있는가.',
    checklist ? `\n### 체크리스트\n${checklist}` : '',
    spec ? `\n## 스펙\n${spec}` : '',
    plan ? `\n## 구현 계획\n${plan}` : '',
    `\n## PR diff\n\`\`\`diff\n${diff}\n\`\`\``,
    '',
    '## 출력 형식',
    '아래 형식만 출력하라. 마지막 줄은 반드시 `VERDICT: APPROVE` 또는',
    '`VERDICT: REQUEST_CHANGES` 여야 한다 (자동화가 이 줄을 파싱한다).',
    '지적은 최대 5건까지만, 사소한 스타일 문제로 반려하지 마라.',
    '',
    '## 판정 근거',
    '- ...',
    '',
    'VERDICT: APPROVE',
  ]
    .filter(Boolean)
    .join('\n');
}

async function callGemini(apiKey, prompt) {
  // 무료 티어는 분당 요청 제한(429)에 자주 걸린다. 일시 실패로 게이트가 떨어지면 코드는 멀쩡한데
  // Claude 재시도만 한 번 날아가므로, 여기서 먼저 기다렸다가 다시 친다.
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );
    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
      if (!text)
        throw new Error(`Gemini 응답이 비어 있습니다: ${JSON.stringify(data).slice(0, 500)}`);
      return text;
    }
    const retriable = res.status === 429 || res.status >= 500;
    if (!retriable || attempt >= 3) {
      throw new Error(`Gemini API ${res.status}: ${(await res.text()).slice(0, 500)}`);
    }
    console.warn(`Gemini API ${res.status} — ${attempt * 20}초 후 재시도 (${attempt}/3)`);
    await new Promise((resolve) => setTimeout(resolve, attempt * 20_000));
  }
}

async function notifyNtfy(message) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;
  await fetch(`https://ntfy.sh/${topic}`, { method: 'POST', body: message }).catch((err) =>
    console.warn('ntfy 전송 실패(무시하고 진행):', err.message),
  );
}

/**
 * API 오류·판정 줄 누락은 코드 문제가 아니다. 체크는 실패시켜 머지를 막되 마커를 남겨,
 * watch-review.mjs가 Claude 재시도(카운터 소모) 대신 "gate-d2 재실행 필요"로 처리하게 한다.
 */
async function reportGateError(prUrl, signalKey, err) {
  console.error('gate-d2 실행 실패:', err.message);
  const body = [
    GATE_ERROR_MARKER,
    '## ⚠️ Gemini 리뷰 실행 오류 (gate-d2)',
    '',
    '코드 판정이 아니라 리뷰 실행 자체가 실패했습니다. 원인을 해결한 뒤 Actions에서 gate-d2를 재실행하세요.',
    '',
    '```',
    err.message.slice(0, 1500),
    '```',
  ].join('\n');
  try {
    execFileSync('gh', ['pr', 'comment', prUrl, '--body', body], { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.error('실행 오류 코멘트 게시에도 실패했습니다.');
  }
  await notifyNtfy(`${signalKey} GATE_ERROR`);
}

async function main() {
  const apiKey = requireEnv('GEMINI_API_KEY');
  const prUrl = requireEnv('PR_URL');
  const branch = requireEnv('BRANCH');
  const { issueKey, spec, plan } = loadInbox(branch);
  const signalKey = issueKey ?? branch;

  let rejected;
  try {
    const diff = execFileSync('gh', ['pr', 'diff', prUrl], {
      cwd: ROOT,
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024 * 64,
    }).slice(0, MAX_DIFF_CHARS);

    const review = await callGemini(
      apiKey,
      buildPrompt({ spec, plan, diff, checklist: loadChecklist() }),
    );

    rejected = /VERDICT:\s*REQUEST_CHANGES/.test(review);
    if (!rejected && !/VERDICT:\s*APPROVE/.test(review)) {
      throw new Error(`판정 줄(VERDICT)이 없는 응답:\n${review.slice(-500)}`);
    }
    const body = [`## 🤖 Gemini 리뷰 (gate-d2)`, '', review].join('\n');
    execFileSync('gh', ['pr', 'comment', prUrl, '--body', body], { cwd: ROOT, stdio: 'inherit' });
  } catch (err) {
    await reportGateError(prUrl, signalKey, err);
    process.exit(1);
  }

  if (rejected) {
    console.error('Gemini 리뷰: 반려');
    await notifyNtfy(`${signalKey} REQUEST_CHANGES`);
    process.exit(1);
  }
  console.log('Gemini 리뷰: 승인');
}

main();
