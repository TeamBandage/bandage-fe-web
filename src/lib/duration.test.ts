import { describe, expect, it } from 'vitest';

import { formatDuration } from './duration';

describe('formatDuration', () => {
  it('90초는 "1분 30초"로 표기한다', () => {
    expect(formatDuration(90)).toBe('1분 30초');
  });

  it('60초 미만은 초 단위만 표기한다', () => {
    expect(formatDuration(30)).toBe('30초');
    expect(formatDuration(0)).toBe('0초');
  });

  it('60의 배수는 분 단위만 표기한다', () => {
    expect(formatDuration(60)).toBe('1분');
    expect(formatDuration(120)).toBe('2분');
  });

  it('소수점 초는 내림 처리한다', () => {
    expect(formatDuration(90.9)).toBe('1분 30초');
  });

  it('음수 입력은 0초로 취급한다', () => {
    expect(formatDuration(-5)).toBe('0초');
  });
});
