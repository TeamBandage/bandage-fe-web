#!/usr/bin/env node
/**
 * fe-areas.json 정합성 검증 스크립트 (MCP 영향평가 Tool 연동).
 *
 * 두 방향을 함께 검증한다.
 *   (1) MAP↔SPEC : fe-areas.json 의 endpointPrefixes 가 BE 스펙(openapi/openapi.json)에
 *                  실제 존재하는지. 스펙에 없는 prefix → FAIL (맵이 스펙과 발산).
 *   (2) CODE↔MAP : src 코드가 호출하는 /api/v1/* endpoint 를 영역에 귀속.
 *                  - 영역 prefix 매칭 → covered
 *                  - knownGaps.deprecatedPrefixes 매칭 → known-gap (개발자 인계, FAIL 아님)
 *                  - 둘 다 아님 → uncovered → FAIL
 *
 * drift(영역에 선언됐으나 코드 사용 흔적 없는 prefix)는 경고. 단 해당 영역이 knownGap의
 * 대상이면(마이그레이션 대기) 경고 대신 안내로 낮춘다.
 *
 * 사용: pnpm verify:fe-areas
 * 종료코드: 정합하면 0, FAIL 있으면 1 (CI 친화). known-gap/drift 는 비치명적.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const ENDPOINT_RE = /\/api\/v1[a-zA-Z0-9/_-]*/g;

/** src 하위 .ts/.tsx 파일 재귀 수집 (테스트·생성 선언 파일 제외). */
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

/** 코드에서 endpoint 정적 prefix 추출 → Map<path, Set<relativeFile>> */
function extractEndpoints(files) {
  const found = new Map();
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const rel = file.slice(ROOT.length + 1);
    for (const match of text.matchAll(ENDPOINT_RE)) {
      const path = match[0].replace(/\/+$/, '');
      if (!found.has(path)) found.set(path, new Set());
      found.get(path).add(rel);
    }
  }
  return found;
}

/** path 가 prefix 에 귀속되는가 (정확 일치 또는 하위 경로). */
function underPrefix(path, prefix) {
  return path === prefix || path.startsWith(prefix + '/');
}

/** path 를 areas 의 endpointPrefixes 에 longest-prefix match. 없으면 null. */
function matchArea(path, areas) {
  let best = null;
  let bestLen = -1;
  for (const area of areas) {
    for (const prefix of area.endpointPrefixes) {
      if (underPrefix(path, prefix) && prefix.length > bestLen) {
        best = area;
        bestLen = prefix.length;
      }
    }
  }
  return best;
}

/** prefix 가 스펙 경로 중 하나라도 커버하는가. */
function prefixInSpec(prefix, specPaths) {
  return specPaths.some((p) => underPrefix(p, prefix));
}

function main() {
  const config = JSON.parse(readFileSync(join(ROOT, 'fe-areas.json'), 'utf8'));
  const areas = config.areas;
  const knownGaps = config.knownGaps ?? [];
  const spec = JSON.parse(readFileSync(join(ROOT, 'openapi/openapi.json'), 'utf8'));
  const specPaths = Object.keys(spec.paths ?? {});

  const endpoints = extractEndpoints(collectSourceFiles(SRC));
  const gapPrefixes = knownGaps.flatMap((g) => g.deprecatedPrefixes);

  let ok = true;

  // (1) MAP↔SPEC: 영역 prefix 가 스펙에 존재하는지 (specPending=true 영역은 스냅샷 미반영이므로 생략)
  const specMissing = [];
  for (const area of areas) {
    if (area.specPending) continue;
    for (const prefix of area.endpointPrefixes) {
      if (!prefixInSpec(prefix, specPaths)) specMissing.push({ area: area.id, prefix });
    }
  }
  // knownGap 의 폐기 prefix 가 스펙에 (다시) 존재하면 안 됨 → 존재 시 경고(해소 후보)
  const gapResurfaced = gapPrefixes.filter((p) => prefixInSpec(p, specPaths));

  // (2) CODE↔MAP
  const byArea = new Map(areas.map((a) => [a.id, new Set()]));
  const uncovered = [];
  const gapHits = new Map(); // path -> files
  for (const [path, files] of endpoints) {
    const area = matchArea(path, areas);
    if (area) {
      byArea.get(area.id).add(path);
      continue;
    }
    if (gapPrefixes.some((g) => underPrefix(path, g))) {
      gapHits.set(path, [...files]);
      continue;
    }
    uncovered.push({ path, files: [...files] });
  }

  // drift: 선언했으나 코드 미사용 prefix (마이그레이션 대기 영역은 안내로 낮춤)
  const migratingAreas = new Set(knownGaps.map((g) => g.area));
  const drift = [];
  const pending = [];
  for (const area of areas) {
    if (area.status === 'mock-only') continue;
    const used = byArea.get(area.id);
    for (const prefix of area.endpointPrefixes) {
      const seen = [...used].some((p) => underPrefix(p, prefix));
      if (!seen) (migratingAreas.has(area.id) ? pending : drift).push({ area: area.id, prefix });
    }
  }

  // 리포트
  console.log('# fe-areas 매핑 검증\n');
  console.log(
    `스캔: ${endpoints.size}개 endpoint prefix · ${areas.length}개 영역 · 스펙 경로 ${specPaths.length}개\n`,
  );
  console.log('## 영역별 매핑 (CODE↔MAP)');
  for (const area of areas) {
    const used = [...byArea.get(area.id)].sort();
    const tag = area.status === 'active' ? '' : ` [${area.status}]`;
    console.log(`- ${area.id}${tag}: ${used.length ? used.join(', ') : '(사용 없음)'}`);
  }

  if (specMissing.length) {
    ok = false;
    console.log('\n## ❌ 스펙 부재 prefix — fe-areas.json 의 prefix 가 BE 스펙에 없음');
    for (const m of specMissing) console.log(`- [${m.area}] ${m.prefix}`);
  }
  if (uncovered.length) {
    ok = false;
    console.log('\n## ❌ uncovered — 영역·knownGap 어디에도 매핑되지 않는 endpoint');
    for (const u of uncovered) console.log(`- ${u.path}  (${u.files.join(', ')})`);
  }
  if (gapHits.size) {
    console.log('\n## ⚠️  known-gap — 폐기 경로를 호출 중 (개발자 인계 · FAIL 아님)');
    for (const [path, files] of gapHits) console.log(`- ${path}  (${files.length}개 파일)`);
    console.log('  → 상세: docs/mcp-impact/known-contract-gaps.md');
  }
  if (pending.length) {
    console.log('\n## ⏳ 마이그레이션 대기 — 선언했으나 코드 미사용 (knownGap 대상)');
    for (const p of pending) console.log(`- [${p.area}] ${p.prefix}`);
  }
  if (gapResurfaced.length) {
    console.log('\n## ⚠️  knownGap prefix 가 스펙에 재등장 — gap 해소 여부 확인');
    for (const p of gapResurfaced) console.log(`- ${p}`);
  }
  if (drift.length) {
    console.log('\n## ⚠️  drift — 선언했으나 코드 미사용 prefix (확인 권장)');
    for (const d of drift) console.log(`- [${d.area}] ${d.prefix}`);
  }

  console.log(
    `\n${ok ? '✅ PASS — 맵이 스펙과 정합, 미해결 uncovered 없음' : '❌ FAIL — 위 ❌ 항목을 해소하세요'}`,
  );
  process.exit(ok ? 0 : 1);
}

main();
