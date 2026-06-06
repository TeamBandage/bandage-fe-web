#!/usr/bin/env node
/**
 * fe-areas.json 정합성 검증 스크립트 (MCP 영향평가 Tool 연동).
 *
 * src 코드에서 실제로 사용하는 BE endpoint(/api/v1/*) 리터럴을 정적 추출하고,
 * fe-areas.json 의 endpointPrefixes(longest-prefix match)에 귀속시켜 다음을 검사한다.
 *   - uncovered : 어떤 영역에도 매핑되지 않는 endpoint (영역 정의 누락 → 실패)
 *   - drift     : active 영역인데 코드에서 사용 흔적이 없는 prefix (경고)
 *   - mock 위반 : mock-only 영역인데 endpoint 사용 흔적 발견 (실패)
 *
 * 사용: pnpm verify:fe-areas
 * 종료코드: 정합하면 0, 문제 있으면 1 (CI 친화).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const ENDPOINT_RE = /\/api\/v1[a-zA-Z0-9/_-]*/g;

/** src 하위 .ts/.tsx 파일을 재귀 수집 (테스트 파일 제외). */
function collectSourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules') continue;
      out.push(...collectSourceFiles(full));
    } else if (
      /\.tsx?$/.test(entry) &&
      !/\.(test|spec)\.tsx?$/.test(entry) &&
      !/\.d\.ts$/.test(entry) // 생성된 선언 파일(예: schema.d.ts)은 호출부가 아니므로 제외
    ) {
      out.push(full);
    }
  }
  return out;
}

/** 코드에서 endpoint 정적 prefix를 추출 → { path: Set<relativeFile> } */
function extractEndpoints(files) {
  const found = new Map();
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const rel = file.slice(ROOT.length + 1);
    for (const match of text.matchAll(ENDPOINT_RE)) {
      const path = match[0].replace(/\/+$/, ''); // 후행 슬래시 제거
      if (!found.has(path)) found.set(path, new Set());
      found.get(path).add(rel);
    }
  }
  return found;
}

/** path 를 areas 의 endpointPrefixes 에 longest-prefix match. 없으면 null. */
function matchArea(path, areas) {
  let best = null;
  let bestLen = -1;
  for (const area of areas) {
    for (const prefix of area.endpointPrefixes) {
      const isMatch = path === prefix || path.startsWith(prefix + '/');
      if (isMatch && prefix.length > bestLen) {
        best = area;
        bestLen = prefix.length;
      }
    }
  }
  return best;
}

function main() {
  const config = JSON.parse(readFileSync(join(ROOT, 'fe-areas.json'), 'utf8'));
  const areas = config.areas;
  const endpoints = extractEndpoints(collectSourceFiles(SRC));

  const byArea = new Map(areas.map((a) => [a.id, new Set()]));
  const uncovered = [];
  const mockViolations = [];

  for (const [path, files] of endpoints) {
    const area = matchArea(path, areas);
    if (!area) {
      uncovered.push({ path, files: [...files] });
      continue;
    }
    byArea.get(area.id).add(path);
    if (area.status === 'mock-only') {
      mockViolations.push({ path, area: area.id, files: [...files] });
    }
  }

  // active 영역인데 선언한 prefix 중 코드에서 한 번도 안 쓰인 것 (drift 경고)
  const drift = [];
  for (const area of areas) {
    if (area.status === 'mock-only') continue;
    const used = byArea.get(area.id);
    for (const prefix of area.endpointPrefixes) {
      const seen = [...used].some((p) => p === prefix || p.startsWith(prefix + '/'));
      if (!seen) drift.push({ area: area.id, prefix });
    }
  }

  // 리포트
  console.log('# fe-areas 매핑 검증\n');
  console.log(`스캔: ${endpoints.size}개 endpoint prefix, ${areas.length}개 영역\n`);
  console.log('## 영역별 매핑');
  for (const area of areas) {
    const used = [...byArea.get(area.id)].sort();
    const tag = area.status === 'active' ? '' : ` [${area.status}]`;
    console.log(`- ${area.id}${tag}: ${used.length ? used.join(', ') : '(사용 없음)'}`);
  }

  let ok = true;
  if (uncovered.length) {
    ok = false;
    console.log('\n## ❌ uncovered — 어떤 영역에도 매핑되지 않는 endpoint');
    for (const u of uncovered) console.log(`- ${u.path}  (${u.files.join(', ')})`);
  }
  if (mockViolations.length) {
    ok = false;
    console.log('\n## ❌ mock-only 위반 — 미연동 영역에서 endpoint 사용 발견');
    for (const m of mockViolations) console.log(`- [${m.area}] ${m.path}  (${m.files.join(', ')})`);
  }
  if (drift.length) {
    console.log('\n## ⚠️  drift — 선언했으나 코드에서 사용 흔적 없는 prefix (확인 권장)');
    for (const d of drift) console.log(`- [${d.area}] ${d.prefix}`);
  }

  console.log(`\n${ok ? '✅ PASS — 모든 endpoint가 영역에 정합' : '❌ FAIL — 위 문제를 fe-areas.json에 반영하세요'}`);
  process.exit(ok ? 0 : 1);
}

main();
