import { describe, expect, it } from 'vitest';
import { buildRecord, parseMetricsFromBody } from './collect-metrics.mjs';

describe('parseMetricsFromBody', () => {
  it('PR 본문 끝의 aidev-metrics 마커를 읽는다', () => {
    const body = '## 본문\n\n<!-- aidev-metrics {"retryCount":3,"tokenUsedUsd":1.5} -->';
    expect(parseMetricsFromBody(body)).toEqual({ retryCount: 3, tokenUsedUsd: 1.5 });
  });

  it('마커가 없거나 깨졌으면 빈 객체를 반환한다', () => {
    expect(parseMetricsFromBody('마커 없음')).toEqual({});
    expect(parseMetricsFromBody('<!-- aidev-metrics {broken} -->')).toEqual({});
    expect(parseMetricsFromBody(undefined)).toEqual({});
  });
});

describe('buildRecord', () => {
  it('메트릭 값을 그대로 record에 반영한다', () => {
    const record = buildRecord('BD-1', 'https://pr/1', { retryCount: 2, tokenUsedUsd: 1.23 });
    expect(record.issueKey).toBe('BD-1');
    expect(record.prUrl).toBe('https://pr/1');
    expect(record.retryCount).toBe(2);
    expect(record.tokenUsedUsd).toBe(1.23);
  });

  it('메트릭이 비어 있으면 기본값으로 채운다', () => {
    const record = buildRecord('BD-2', 'https://pr/2', {});
    expect(record.retryCount).toBe(0);
    expect(record.tokenUsedUsd).toBe(0);
  });
});
