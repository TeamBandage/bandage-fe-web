import { describe, expect, it } from 'vitest';
import { appendMergeOutcome } from './update-adr.mjs';

const BASE = [
  '# ADR-0001: 예시',
  '',
  '<!-- status: proposed -->',
  '',
  '- **상태**: Proposed',
  '- **관련 이슈**: BD-1',
  '',
  '## 결과 (머지 후 갱신)',
  '',
  '<!-- aidev:merge-outcome -->',
  '',
  '설명 텍스트',
].join('\n');

describe('appendMergeOutcome', () => {
  it('머지 결과 섹션에 PR 정보를 append 하고 status를 accepted로 바꾼다', () => {
    const result = appendMergeOutcome(BASE, { issueKey: 'BD-1', prUrl: 'https://pr/1' });
    expect(result).toContain('- PR: https://pr/1');
    expect(result).toContain('- 이슈: BD-1');
    expect(result).toContain('<!-- status: accepted -->');
    expect(result).toContain('- **상태**: Accepted');
  });

  it('같은 PR로 이미 갱신된 경우 그대로 반환한다(중복 방지)', () => {
    const once = appendMergeOutcome(BASE, { issueKey: 'BD-1', prUrl: 'https://pr/1' });
    const twice = appendMergeOutcome(once, { issueKey: 'BD-1', prUrl: 'https://pr/1' });
    expect(twice).toBe(once);
  });

  it('머지 결과 섹션 마커가 없으면 null을 반환한다', () => {
    const result = appendMergeOutcome('# 마커 없는 문서', {
      issueKey: 'BD-1',
      prUrl: 'https://pr/1',
    });
    expect(result).toBeNull();
  });
});
