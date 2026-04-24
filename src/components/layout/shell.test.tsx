import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PaneDetail } from './pane-detail';
import { PaneList } from './pane-list';
import { PaneSplit } from './pane-split';
import { Shell } from './shell';
import { Topbar } from './topbar';

describe('Shell layout primitives', () => {
  it('Shell 기본 렌더', () => {
    const { asFragment } = render(<Shell>child</Shell>);
    expect(asFragment()).toMatchSnapshot();
  });

  it('PaneSplit + PaneList(list) + PaneDetail 조합', () => {
    const { asFragment } = render(
      <PaneSplit>
        <PaneList header="목록">item</PaneList>
        <PaneDetail>상세</PaneDetail>
      </PaneSplit>,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('PaneList width="band-list"', () => {
    const { asFragment } = render(<PaneList width="band-list">band</PaneList>);
    expect(asFragment()).toMatchSnapshot();
  });

  it('Topbar — title + breadcrumb + actions', () => {
    const { asFragment } = render(
      <Topbar title="합주 상세" breadcrumb="합주 / 2024-04-01" actions={<button>편집</button>} />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('Topbar — title only', () => {
    const { asFragment } = render(<Topbar title="홈" />);
    expect(asFragment()).toMatchSnapshot();
  });
});
