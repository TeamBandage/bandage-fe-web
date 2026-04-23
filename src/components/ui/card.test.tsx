import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card } from './card';

describe('Card', () => {
  it('header/footer 가 없을 때 기본 구성', () => {
    const { asFragment } = render(<Card>body</Card>);
    expect(asFragment()).toMatchSnapshot();
  });

  it('header/footer/padding 조합', () => {
    const { asFragment } = render(
      <Card header="타이틀" footer="푸터" padding="lg" interactive>
        본문 영역
      </Card>,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
