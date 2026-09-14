#!/usr/bin/env node
/**
 * Phase C(개발) — C1 구현 → C2 자가 검증 → C3 PR 생성.
 *
 * Claude Code Pro 구독의 `claude -p` 헤드리스 모드로 실행한다(API 종량 과금 아님).
 * 이 인증은 로컬 로그인 세션에 귀속되므로 로컬에서만 돈다 — Phase D는 GitHub Actions.
 *
 * 자가 검증이 실패하면 실패 로그를 붙여 같은 프로세스 안에서 곧바로 다시 구현시킨다.
 * 재시도 카운터는 게이트·사람 반려(watch-review.mjs)와 공유하며, 상한을 넘기면 사람에게 넘긴다.
 *
 * 사용:
 *   pnpm aidev:dev <BD-번호> [--dry-run]
 *   pnpm aidev:dev <BD-번호> --retry "<실패 사유>"   # watch-review.mjs 가 호출
 *
 * 종료코드: 성공 0 / 재시도 상한 초과로 사람 인계 3 / 그 외 실패 1.
 */
import { execFileSync, execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAX_RETRY } from './config.mjs';
import { escalate, saveState } from './escalate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const git = (args) => execFileSync('git', args, { cwd: ROOT, stdio: 'pipe', encoding: 'utf-8' });

function parseArgs(argv) {
  const [id, ...rest] = argv;
  if (!id) {
    console.error('사용: pnpm aidev:dev <BD-번호> [--dry-run] [--retry "사유"]');
    process.exit(1);
  }
  const retryIdx = rest.indexOf('--retry');
  return {
    id,
    dryRun: rest.includes('--dry-run'),
    retryReason: retryIdx >= 0 ? rest[retryIdx + 1] : null,
  };
}

function loadTask(id) {
  const dir = join(ROOT, '.aidev', 'inbox', id);
  const taskPath = join(dir, 'task.json');
  if (!existsSync(taskPath)) {
    throw new Error(`${taskPath} 가 없습니다 — Phase A/B 산출물이 먼저 있어야 합니다.`);
  }
  return {
    dir,
    task: JSON.parse(readFileSync(taskPath, 'utf-8')),
    spec: readFileSync(join(dir, 'spec.md'), 'utf-8'),
    plan: readFileSync(join(dir, 'plan.md'), 'utf-8'),
  };
}

function loadState(dir) {
  const statePath = join(dir, 'state.json');
  if (existsSync(statePath)) return JSON.parse(readFileSync(statePath, 'utf-8'));
  return { retryCount: 0, tokenUsedUsd: 0, lastFailure: null, prUrl: null };
}

function branchName(task) {
  const slug = task.title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${task.type}/${task.issueKey}-${slug}`;
}

/** 워크스페이스 공통 규칙과 리포 CLAUDE.md를 프롬프트에 그대로 인용한다. */
function loadConventions() {
  return [join(ROOT, '..', 'CLAUDE.md'), join(ROOT, 'CLAUDE.md')]
    .filter((p) => existsSync(p))
    .map((p) => readFileSync(p, 'utf-8'))
    .join('\n\n---\n\n');
}

function buildPrompt({ task, spec, plan }, retryReason) {
  const sections = [
    '아래 컨벤션을 반드시 따라 이 저장소에 구현하라. 구현이 끝나면 커밋까지 완료하라' +
      '(push/PR 생성은 하지 마라 — 그건 이 스크립트가 처리한다).',
    '이미 커밋돼 있는 테스트 파일은 수정하지 마라. 새 테스트 파일 추가는 괜찮다.',
    '## 워크스페이스/리포 컨벤션',
    loadConventions(),
    '## 스펙 (Phase A 산출물)',
    spec,
    '## 구현 계획 (Phase B 산출물)',
    plan,
    `## Jira 이슈: ${task.issueKey} — ${task.title} (type: ${task.type})`,
  ];
  if (retryReason) {
    sections.push(
      '## 이전 시도 실패 사유 — 반드시 이 문제를 해결하도록 이어서 수정하라',
      retryReason,
    );
  }
  return sections.join('\n\n');
}

const ALLOWED_TOOLS = [
  'Edit',
  'Write',
  'Bash(pnpm lint*)',
  'Bash(pnpm typecheck*)',
  'Bash(pnpm test*)',
  'Bash(pnpm format*)',
  'Bash(git add*)',
  'Bash(git commit*)',
].join(',');

/** claude -p 헤드리스 실행. --output-format json 으로 사용량(cost)까지 캡처한다. */
function runClaudeHeadless(prompt) {
  const raw = execFileSync(
    'claude',
    ['-p', prompt, '--output-format', 'json', '--allowedTools', ALLOWED_TOOLS],
    { cwd: ROOT, maxBuffer: 1024 * 1024 * 64, encoding: 'utf-8' },
  );
  const parsed = JSON.parse(raw);
  return { costUsd: parsed.total_cost_usd ?? parsed.cost_usd ?? 0 };
}

/** 에이전트의 "다 됐다"는 보고를 믿지 않고, 스크립트가 직접 돌려 확인한다. */
function runSelfCheck() {
  for (const step of ['pnpm lint', 'pnpm typecheck', 'pnpm test']) {
    try {
      execSync(step, { cwd: ROOT, stdio: 'pipe', encoding: 'utf-8' });
    } catch (err) {
      return { pass: false, failedStep: step, log: `${err.stdout ?? ''}${err.stderr ?? ''}` };
    }
  }
  return { pass: true };
}

/**
 * 이미 커밋돼 있는 테스트 파일의 내용을 떠 둔다.
 *
 * 에이전트가 구현 대신 테스트를 고쳐서 통과시키면 자가 검증 자체가 무의미해진다. 실패를 없애는
 * 가장 쉬운 길이 테스트 수정이라 재시도 루프에서 특히 위험하다. 새로 쓰는 테스트는 아직
 * 추적되지 않으므로 감시 대상이 아니다. (git 기본 pathspec의 `*`는 `/`까지 매칭 → 모든 깊이)
 */
function snapshotTrackedTests() {
  const files = git(['ls-files', '*.test.ts', '*.test.tsx', '*.test.mjs', '*.spec.ts'])
    .split('\n')
    .filter(Boolean);
  return new Map(files.map((f) => [f, readFileSync(join(ROOT, f), 'utf-8')]));
}

/** 변조된 테스트를 원본으로 되돌리고, 되돌린 파일 목록을 반환한다. */
function restoreTamperedTests(snapshot) {
  const tampered = [];
  for (const [file, original] of snapshot) {
    const full = join(ROOT, file);
    const current = existsSync(full) ? readFileSync(full, 'utf-8') : null;
    if (current !== original) {
      writeFileSync(full, original);
      tampered.push(file);
    }
  }
  return tampered;
}

/**
 * 사용자가 작업 중인 변경(예: src/middleware.ts)이 에이전트 커밋에 섞여 들어가지 않도록,
 * .aidev/ 밖에 커밋 안 된 변경(추적 안 되는 파일 포함)이 있으면 시작하지 않는다.
 */
function assertCleanTree() {
  const dirty = git(['status', '--porcelain'])
    .split('\n')
    .filter((line) => line.trim() && !line.slice(3).startsWith('.aidev/'));
  if (dirty.length > 0) {
    console.error(
      `커밋 안 된 변경이 있어 시작하지 않습니다. 먼저 커밋하거나 stash 하세요:\n${dirty.join('\n')}`,
    );
    process.exit(1);
  }
}

function ensureBranch(task) {
  const branch = branchName(task);
  git(['fetch', 'origin']);
  const exists =
    spawnSync('git', ['rev-parse', '--verify', '--quiet', branch], { cwd: ROOT }).status === 0;
  if (exists) {
    git(['checkout', branch]);
    // 원격 브랜치가 아직 없을 수 있다(첫 push 전 중단) — 실패해도 로컬 브랜치로 계속한다
    spawnSync('git', ['pull', '--ff-only', 'origin', branch], { cwd: ROOT, stdio: 'pipe' });
  } else {
    git(['checkout', task.branchBase]);
    git(['pull', '--ff-only', 'origin', task.branchBase]);
    git(['checkout', '-b', branch]);
  }
  return branch;
}

function commitAndPush(task, branch) {
  // 에이전트가 이미 커밋했을 수도 있으니 남은 변경만 담는다. .aidev/ 는 로컬 상태라 제외.
  git(['add', '-A', '--', '.', ':(exclude).aidev']);
  if (git(['diff', '--cached', '--name-only']).trim()) {
    git(['commit', '-m', `[${task.issueKey}] ${task.type}: ${task.title}`]);
  }
  git(['push', '-u', 'origin', branch]);
}

/**
 * `.github/PULL_REQUEST_TEMPLATE.md` 에서 Jira 브라우즈 URL 베이스를 뽑아온다 —
 * 하드코딩하면 Jira 워크스페이스가 바뀌었을 때 이 스크립트만 낡은 링크를 계속 만든다.
 */
function jiraIssueUrl(issueKey) {
  const templatePath = join(ROOT, '.github', 'PULL_REQUEST_TEMPLATE.md');
  const template = existsSync(templatePath) ? readFileSync(templatePath, 'utf-8') : '';
  const match = template.match(/\(https:\/\/([^)]+?)\/browse\/BD-\)/);
  const base = match ? `https://${match[1]}/browse/` : 'https://sunwoo1137.atlassian.net/browse/';
  return `${base}${issueKey}`;
}

/**
 * PR 본문은 PULL_REQUEST_TEMPLATE 형식을 따르고, 끝에 메트릭 마커를 숨겨 둔다.
 * state.json은 로컬 전용이라, 머지 후 CI(E2 collect-metrics)는 이 마커로만 재시도·비용을 읽는다.
 */
function buildPrBody(task, state) {
  const metrics = {
    retryCount: state.retryCount,
    tokenUsedUsd: Number(state.tokenUsedUsd.toFixed(4)),
  };
  return [
    '## 🛠️ Issue Number',
    `### closes [${task.issueKey}](${jiraIssueUrl(task.issueKey)})`,
    '',
    '📌 **작업 내용 및 특이사항**',
    '',
    '- Phase C 자동화(dev-agent.mjs)로 생성됨',
    '- 자가 검증(lint · typecheck · test) 통과',
    `- 재시도 ${metrics.retryCount}회 · Claude 사용량 $${metrics.tokenUsedUsd}`,
    '',
    '📚 **참고사항**',
    '',
    '- gate-d1(자동 검사) · gate-d2(Gemini 리뷰) 결과를 확인한 뒤 머지해 주세요.',
    '',
    `<!-- aidev-metrics ${JSON.stringify(metrics)} -->`,
  ].join('\n');
}

/** 재시도라면 기존 PR에 push만 하고 본문 메트릭을 갱신한다 — PR을 새로 만들지 않는다. */
function upsertPr(task, branch, state) {
  const body = buildPrBody(task, state);
  if (state.prUrl) {
    execFileSync('gh', ['pr', 'edit', state.prUrl, '--body', body], { cwd: ROOT, stdio: 'pipe' });
    return state.prUrl;
  }
  const out = execFileSync(
    'gh',
    [
      'pr',
      'create',
      '--title',
      `[${task.issueKey}] ${task.type}: ${task.title}`,
      '--body',
      body,
      '--base',
      task.branchBase,
      '--head',
      branch,
      '--label',
      'aidev',
    ],
    { cwd: ROOT, encoding: 'utf-8' },
  );
  return out.trim().split('\n').pop();
}

/** 재시도 카운터를 올려 저장한다. 상한을 넘겼으면 false. */
function bumpRetry(dir, state, reason) {
  state.retryCount += 1;
  state.lastFailure = reason;
  saveState(dir, state);
  if (state.retryCount > MAX_RETRY) return false;
  console.error(`[dev-agent] 재시도 ${state.retryCount}/${MAX_RETRY}`);
  return true;
}

async function main() {
  const { id, dryRun, retryReason } = parseArgs(process.argv.slice(2));
  const { task, spec, plan, dir } = loadTask(id);
  const state = loadState(dir);

  if (dryRun) {
    console.log(buildPrompt({ task, spec, plan }, retryReason));
    return;
  }

  if (state.escalated) {
    console.error(`${id}: 이미 사람에게 인계된 태스크입니다. 다시 돌리려면 state.json을 지우세요.`);
    process.exit(3);
  }
  if (state.retryCount > MAX_RETRY) {
    await escalate({
      issueKey: task.issueKey,
      dir,
      state,
      reason: `재시도 상한(${MAX_RETRY}회) 초과`,
    });
    process.exit(3);
  }

  assertCleanTree();
  const branch = ensureBranch(task);

  const giveUp = async (why) => {
    await escalate({
      issueKey: task.issueKey,
      dir,
      state,
      reason: `${why} — 재시도 상한(${MAX_RETRY}회) 초과 · 브랜치 ${branch}`,
    });
    process.exit(3);
  };

  // C1 → C2 루프. 자가 검증 실패도 게이트·사람 반려와 같은 카운터를 올린다.
  let reason = retryReason;
  for (;;) {
    const testsBefore = snapshotTrackedTests();
    state.tokenUsedUsd += runClaudeHeadless(buildPrompt({ task, spec, plan }, reason)).costUsd;

    const tampered = restoreTamperedTests(testsBefore);
    if (tampered.length > 0) {
      console.error(`[dev-agent] 기존 테스트 수정 감지 → 원복: ${tampered.join(', ')}`);
      reason =
        `기존 테스트 파일을 수정했다(금지, 원복함): ${tampered.join(', ')}\n` +
        '테스트는 통과의 증거다. 테스트가 아니라 구현을 고쳐라.';
      if (!bumpRetry(dir, state, reason)) await giveUp('기존 테스트 수정 반복');
      continue;
    }

    const selfCheck = runSelfCheck();
    if (selfCheck.pass) break;

    console.error(`[dev-agent] 자가 검증 실패(${selfCheck.failedStep})`);
    reason = `${selfCheck.failedStep} 실패:\n${selfCheck.log.slice(0, 4000)}`;
    if (!bumpRetry(dir, state, reason)) await giveUp(`자가 검증(${selfCheck.failedStep}) 실패`);
  }

  state.lastFailure = null;
  saveState(dir, state);
  commitAndPush(task, branch);
  state.prUrl = upsertPr(task, branch, state);
  saveState(dir, state);
  console.log(`[dev-agent] PR: ${state.prUrl}`);
}

main().catch((err) => {
  console.error('[dev-agent] 실패:', err.message);
  process.exit(1);
});
