/**
 * Performance list (master-detail) + create.
 */
import { h, cx } from '../core.js';
import { Icon } from '../icons.js';
import { Button, Field, IconTile, Avatar, Badge, SectionTitle, EmptyState, showToast, openDialog } from '../components.js';
import { performances, bands, practices, findPerformance, findBand, findPractice } from '../data.js';

export function PerformanceScreen({ navigate }) {
  const state = { selectedId: performances[0]?.performanceId || null, filter: 'all' };
  const root = h('div', { class: 'pane-split' });

  function render() {
    root.innerHTML = '';

    const listPane = h('div', { class: 'pane-list' },
      h('div', { class: 'pane-list__header' },
        h('div', { class: 'pane-list__title-row' },
          h('div', { class: 'pane-list__title' }, '공연'),
          Button({ label: '생성', icon: 'plus', small: true, onClick: () => navigate('performanceCreate') })
        ),
        h('div', { style: { display: 'flex', gap: '6px' } },
          ...[['all', '전체'], ['upcoming', '예정']].map(([id, l]) =>
            h('button', { class: cx('chip', state.filter === id && 'is-selected'),
              onClick: () => { state.filter = id; render(); } }, l)
          )
        )
      ),
      h('div', { class: 'pane-list__body' },
        ...performances.map(pf => h('div', {
          class: cx('list-item', state.selectedId === pf.performanceId && 'is-selected list-item.is-selected--amber'),
          onClick: () => { state.selectedId = pf.performanceId; render(); }
        },
          IconTile('performance', { size: 'md', tone: 'amber' }),
          h('div', { class: 'list-item__body' },
            h('div', { class: 'list-item__title-row' },
              h('div', { class: 'list-item__title' }, pf.title),
              pf.daysLeft <= 7 && Badge(`D-${pf.daysLeft}`, 'danger')
            ),
            h('div', { class: 'list-item__meta' },
              h('span', {}, Icon('calendar', { size: 11, color: '#6B6B80' }), pf.startAt.slice(5)),
              h('span', {}, Icon('location', { size: 11, color: '#6B6B80' }), pf.venue))
          )
        ))
      )
    );

    const pf = state.selectedId && findPerformance(state.selectedId);
    const detailPane = h('div', { class: 'pane-detail' });

    if (!pf) {
      detailPane.appendChild(EmptyState({ icon: 'performance', title: '공연을 선택해주세요' }));
    } else {
      const linkedBands = pf.bandIds.map(findBand).filter(Boolean);
      const linkedPractices = pf.practiceIds.map(findPractice).filter(Boolean);

      detailPane.appendChild(h('div', { class: 'topbar' },
        h('div', {},
          h('div', { class: 'topbar__breadcrumb' }, '공연'),
          h('h1', { class: 'topbar__title' }, pf.title)),
        h('div', { class: 'topbar__actions' },
          Button({ label: '편집', icon: 'edit', variant: 'secondary', small: true }),
          Button({ label: '삭제', icon: 'trash', variant: 'secondary', small: true,
            onClick: () => openDialog({ title: '공연 삭제', message: '삭제하시겠습니까?',
              danger: true, onConfirm: () => showToast('삭제되었습니다.') }) })
        )
      ));

      const body = h('div', { class: 'pane-detail__body' });
      body.append(
        h('div', { class: 'perf-hero' },
          IconTile('performance', { size: 'lg', tone: 'amber', iconSize: 28 }),
          h('div', { class: 'perf-hero__body' },
            h('div', { class: 'perf-hero__title' }, pf.title),
            h('div', { class: 'perf-hero__meta' },
              h('div', { class: 'perf-hero__meta-item' }, Icon('calendar', { size: 15, color: '#B4B4C4' }), pf.startAt),
              h('div', { class: 'perf-hero__meta-item' }, Icon('location', { size: 15, color: '#B4B4C4' }), pf.venue),
              h('div', { class: 'perf-hero__meta-item' }, Icon('practice', { size: 15, color: '#B4B4C4' }), `${pf.durationMinutes}분`))),
          pf.daysLeft <= 14 && Badge(`D-${pf.daysLeft}`, pf.daysLeft <= 7 ? 'danger' : 'amber')
        ),
        SectionTitle(`참여 밴드 ${linkedBands.length}개`),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' } },
          ...linkedBands.map(b => h('div', { class: 'band-pill' },
            IconTile('guitar', { size: 'sm', tone: 'accent' }),
            h('span', { class: 'band-pill__name' }, b.bandName)))),
        SectionTitle(`담당자 ${pf.managerIds.length}명`),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' } },
          ...pf.managerIds.map(m => h('div', { class: 'band-pill' },
            Avatar(m, 24),
            h('span', { class: 'band-pill__name' }, m)))),
        SectionTitle(`연결된 합주 ${linkedPractices.length}개`),
        h('div', { class: 'grid grid--2' },
          ...linkedPractices.map(p => h('div', { class: 'card card--clickable',
            onClick: () => navigate('practice') },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
              IconTile('practice', { size: 'md', tone: 'success' }),
              h('div', { style: { flex: 1 } },
                h('div', { style: { fontSize: '14px', fontWeight: 700 } }, p.title),
                h('div', { style: { fontSize: '12px', color: 'var(--text-muted)' } },
                  `${p.song.artist} — ${p.song.title}`)))
          ))
        )
      );
      detailPane.appendChild(body);
    }

    root.append(listPane, detailPane);
  }
  render();
  return root;
}

export function PerformanceCreateScreen({ navigate }) {
  const state = { title: '', startAt: '', durationMinutes: 180, venue: '',
    selectedBands: new Set(), selectedPractices: new Set(), loading: false, errors: {} };
  const root = h('div', { class: 'pane-detail__body' });

  function render() {
    root.innerHTML = '';
    root.appendChild(h('div', { style: { maxWidth: '680px' } },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' } },
        h('button', { class: 'btn btn--secondary btn--sm', onClick: () => navigate('performance') },
          Icon('back', { size: 14 })),
        h('div', {},
          h('div', { style: { fontSize: '22px', fontWeight: 800 } }, '공연 생성'),
          h('div', { style: { fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' } },
            '공연 정보와 연결 밴드/합주를 지정합니다.'))
      ),
      h('div', { class: 'card' },
        h('div', { style: { fontSize: '15px', fontWeight: 700, marginBottom: '16px' } }, '기본 정보'),
        Field({ label: '공연 제목 *', value: state.title, placeholder: '예: 봄 정기공연 2026',
          error: state.errors.title, onChange: v => state.title = v }),
        Field({ label: '일시 *', type: 'datetime-local', value: state.startAt, onChange: v => state.startAt = v }),
        Field({ label: '소요 시간 (분)', type: 'number', value: String(state.durationMinutes),
          onChange: v => state.durationMinutes = Number(v) || 0 }),
        Field({ label: '장소', value: state.venue, placeholder: '예: 홍익대학교 대강당',
          onChange: v => state.venue = v }),
      ),
      h('div', { class: 'card', style: { marginTop: '16px' } },
        h('div', { style: { fontSize: '15px', fontWeight: 700, marginBottom: '16px' } },
          `참여 밴드 (${state.selectedBands.size}/${bands.filter(b => b.myRole).length})`),
        ...bands.filter(b => b.myRole).map(b => h('div', {
          class: cx('select-card', state.selectedBands.has(b.bandId) && 'is-selected'),
          onClick: () => {
            if (state.selectedBands.has(b.bandId)) state.selectedBands.delete(b.bandId);
            else state.selectedBands.add(b.bandId);
            render();
          }
        },
          IconTile('guitar', { size: 'sm', tone: 'accent' }),
          h('div', { class: 'select-card__body' },
            h('div', { class: 'select-card__title' }, b.bandName)),
          h('div', { class: cx('checkbox', state.selectedBands.has(b.bandId) && 'is-checked') },
            state.selectedBands.has(b.bandId) && Icon('check', { size: 14, color: '#fff' }))
        )),
      ),
      h('div', { class: 'card', style: { marginTop: '16px' } },
        h('div', { style: { fontSize: '15px', fontWeight: 700, marginBottom: '16px' } },
          `연결 합주 (${state.selectedPractices.size}/${practices.length})`),
        ...practices.map(p => h('div', {
          class: cx('select-card', state.selectedPractices.has(p.practiceId) && 'is-selected'),
          onClick: () => {
            if (state.selectedPractices.has(p.practiceId)) state.selectedPractices.delete(p.practiceId);
            else state.selectedPractices.add(p.practiceId);
            render();
          }
        },
          IconTile('practice', { size: 'sm', tone: 'success' }),
          h('div', { class: 'select-card__body' },
            h('div', { class: 'select-card__title' }, p.title),
            h('div', { class: 'select-card__sub' }, `${p.song.artist} — ${p.song.title}`)),
          h('div', { class: cx('checkbox', state.selectedPractices.has(p.practiceId) && 'is-checked') },
            state.selectedPractices.has(p.practiceId) && Icon('check', { size: 14, color: '#fff' }))
        )),
      ),
      h('div', { style: { display: 'flex', gap: '10px', marginTop: '16px' } },
        Button({ label: '취소', variant: 'secondary', fullWidth: true, onClick: () => navigate('performance') }),
        Button({ label: '공연 생성', loading: state.loading, fullWidth: true, onClick: () => {
          if (!state.title.trim()) { state.errors = { title: '제목을 입력해주세요.' }; return render(); }
          state.loading = true; render();
          setTimeout(() => { showToast('공연이 생성되었습니다.'); navigate('performance'); }, 700);
        }})
      )
    ));
  }
  render();
  return root;
}
