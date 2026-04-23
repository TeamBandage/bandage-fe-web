/**
 * Practice list (master-detail) + create.
 */
import { h, cx } from '../core.js';
import { Icon } from '../icons.js';
import { Button, Field, IconTile, Avatar, Badge, SectionTitle, EmptyState, showToast, openDialog, openModal, closeModal } from '../components.js';
import { practices, songs, bands, findPractice, sessionTypes } from '../data.js';

export function PracticeScreen({ navigate }) {
  const state = { selectedId: practices[0]?.practiceId || null, filter: 'all' };
  const root = h('div', { class: 'pane-split' });

  function render() {
    root.innerHTML = '';
    const list = state.filter === 'all' ? practices : practices;

    const listPane = h('div', { class: 'pane-list' },
      h('div', { class: 'pane-list__header' },
        h('div', { class: 'pane-list__title-row' },
          h('div', { class: 'pane-list__title' }, '합주'),
          Button({ label: '생성', icon: 'plus', small: true, onClick: () => navigate('practiceCreate') })
        ),
        h('div', { style: { display: 'flex', gap: '6px' } },
          ...[['all', '전체'], ['upcoming', '예정'], ['past', '지난']].map(([id, l]) =>
            h('button', { class: cx('chip', state.filter === id && 'is-selected'),
              onClick: () => { state.filter = id; render(); } }, l)
          )
        )
      ),
      h('div', { class: 'pane-list__body' },
        ...list.map(p => h('div', { class: cx('list-item', state.selectedId === p.practiceId && 'is-selected'),
          onClick: () => { state.selectedId = p.practiceId; render(); } },
          IconTile('practice', { size: 'md', tone: 'success' }),
          h('div', { class: 'list-item__body' },
            h('div', { class: 'list-item__title-row' },
              h('div', { class: 'list-item__title' }, p.title)),
            h('div', { class: 'list-item__sub' }, `${p.song.artist} — ${p.song.title}`),
            h('div', { class: 'list-item__meta' },
              h('span', {}, Icon('calendar', { size: 11, color: '#6B6B80' }), p.startAt.slice(5)),
              p.venue && h('span', {}, Icon('location', { size: 11, color: '#6B6B80' }), p.venue))
          )
        ))
      )
    );

    const practice = state.selectedId && findPractice(state.selectedId);
    const detailPane = h('div', { class: 'pane-detail' });

    if (!practice) {
      detailPane.appendChild(EmptyState({ icon: 'practice', title: '합주를 선택해주세요' }));
    } else {
      detailPane.appendChild(h('div', { class: 'topbar' },
        h('div', {},
          h('div', { class: 'topbar__breadcrumb' }, '합주'),
          h('h1', { class: 'topbar__title' }, practice.title)),
        h('div', { class: 'topbar__actions' },
          Button({ label: '편집', icon: 'edit', variant: 'secondary', small: true }),
          Button({ label: '삭제', icon: 'trash', variant: 'secondary', small: true,
            onClick: () => openDialog({ title: '합주 삭제', message: '이 합주를 삭제하시겠습니까?',
              danger: true, onConfirm: () => showToast('삭제되었습니다.') }) })
        )
      ));

      const body = h('div', { class: 'pane-detail__body' });
      body.append(
        h('div', { class: 'grid grid--2' },
          h('div', { class: 'card' },
            h('div', { class: 'card__title' }, '곡'),
            h('div', { style: { fontSize: '15px', fontWeight: 700 } }, practice.song.title),
            h('div', { style: { fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' } }, practice.song.artist)),
          h('div', { class: 'card' },
            h('div', { class: 'card__title' }, '일정'),
            h('div', { style: { fontSize: '15px', fontWeight: 700 } }, practice.startAt),
            h('div', { style: { fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' } }, `${practice.durationMinutes}분`)),
          practice.venue && h('div', { class: 'card' },
            h('div', { class: 'card__title' }, '장소'),
            h('div', { style: { fontSize: '15px', fontWeight: 700 } }, practice.venue)),
          practice.refLink && h('div', { class: 'card' },
            h('div', { class: 'card__title' }, '참고 링크'),
            h('a', { href: practice.refLink, target: '_blank',
              style: { fontSize: '13px', color: 'var(--accent)', wordBreak: 'break-all' } },
              Icon('link', { size: 12 }), ' ', practice.refLink))
        ),
        h('div', { style: { marginTop: '24px' } }, SectionTitle(`세션 ${practice.sessions.length}개`)),
        h('div', { class: 'grid grid--2' },
          ...practice.sessions.map(s => h('div', { class: 'session-row' },
            IconTile('music', { size: 'sm', tone: 'accent' }),
            h('div', { class: 'session-row__body' },
              h('div', { class: 'session-row__label' }, s.label),
              h('div', { class: cx('session-row__participant', !s.participant && 'session-row__participant--empty') },
                s.participant ? `참여: ${s.participant}` : '미배정'))
          ))
        ),
        h('div', { style: { marginTop: '24px' } }, SectionTitle(`참여자 ${practice.participants.length}명`)),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } },
          ...practice.participants.map(p => h('div', { class: 'band-pill' },
            Avatar(p.memberId, 24),
            h('span', { class: 'band-pill__name' }, p.memberId))))
      );
      detailPane.appendChild(body);
    }

    root.append(listPane, detailPane);
  }
  render();
  return root;
}

export function PracticeCreateScreen({ navigate }) {
  const state = {
    step: 0, title: '', songId: songs[0].songId, bandId: bands.filter(b => b.myRole)[0]?.bandId,
    startAt: '', durationMinutes: 120, venue: '', refLink: '',
    sessionList: [{ label: 'Vocal', type: 'Vocal' }, { label: 'Guitar', type: 'Guitar' }, { label: 'Bass', type: 'Bass' }, { label: 'Drum', type: 'Drum' }],
    loading: false,
  };
  const root = h('div', { class: 'pane-detail__body' });

  function render() {
    root.innerHTML = '';
    const inner = h('div', { style: { maxWidth: '680px' } },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' } },
        h('button', { class: 'btn btn--secondary btn--sm', onClick: () => navigate('practice') },
          Icon('back', { size: 14 })),
        h('div', {},
          h('div', { style: { fontSize: '22px', fontWeight: 800 } }, '합주 생성'),
          h('div', { style: { fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' } }, '세션 구성까지 순차적으로 작성합니다.'))
      ),
    );
    inner.appendChild(h('div', { style: { marginBottom: '24px' } }));

    if (state.step === 0) {
      inner.appendChild(h('div', { class: 'card' },
        h('div', { style: { fontSize: '15px', fontWeight: 700, marginBottom: '16px' } }, '1. 기본 정보'),
        h('div', { class: 'field' },
          h('label', { class: 'field__label' }, '밴드'),
          h('div', { class: 'grid grid--3' },
            ...bands.filter(b => b.myRole).map(b => h('div', {
              class: cx('select-card', state.bandId === b.bandId && 'is-selected'),
              onClick: () => { state.bandId = b.bandId; render(); }
            },
              IconTile('guitar', { size: 'sm', tone: 'accent' }),
              h('div', { class: 'select-card__body' },
                h('div', { class: 'select-card__title' }, b.bandName))
            )))
        ),
        Field({ label: '합주 제목 *', value: state.title, placeholder: '예: 정기 합주 #12',
          onChange: v => state.title = v }),
        h('div', { class: 'field' },
          h('label', { class: 'field__label' }, '곡 선택 *'),
          ...songs.map(s => h('div', {
            class: cx('select-card', state.songId === s.songId && 'is-selected'),
            onClick: () => { state.songId = s.songId; render(); }
          },
            IconTile('music', { size: 'sm', tone: 'accent' }),
            h('div', { class: 'select-card__body' },
              h('div', { class: 'select-card__title' }, s.title),
              h('div', { class: 'select-card__sub' }, s.artist))
          ))
        ),
        h('div', { style: { display: 'flex', gap: '10px', marginTop: '16px' } },
          Button({ label: '취소', variant: 'secondary', fullWidth: true, onClick: () => navigate('practice') }),
          Button({ label: '다음', fullWidth: true, onClick: () => {
            if (!state.title.trim()) return showToast('제목을 입력해주세요.', 'danger');
            state.step = 1; render();
          }})
        )
      ));
    } else if (state.step === 1) {
      inner.appendChild(h('div', { class: 'card' },
        h('div', { style: { fontSize: '15px', fontWeight: 700, marginBottom: '16px' } }, '2. 일정 & 장소'),
        Field({ label: '일시 *', type: 'datetime-local', value: state.startAt,
          onChange: v => state.startAt = v }),
        Field({ label: '소요 시간 (분)', type: 'number', value: String(state.durationMinutes),
          onChange: v => state.durationMinutes = Number(v) || 0 }),
        Field({ label: '장소', value: state.venue, placeholder: '예: 홍대 연습실 A', onChange: v => state.venue = v }),
        Field({ label: '참고 링크', value: state.refLink, placeholder: 'https://...', onChange: v => state.refLink = v }),
        h('div', { style: { display: 'flex', gap: '10px', marginTop: '16px' } },
          Button({ label: '이전', variant: 'secondary', fullWidth: true, onClick: () => { state.step = 0; render(); } }),
          Button({ label: '다음', fullWidth: true, onClick: () => { state.step = 2; render(); }})
        )
      ));
    } else {
      inner.appendChild(h('div', { class: 'card' },
        h('div', { style: { fontSize: '15px', fontWeight: 700, marginBottom: '16px' } }, '3. 세션 구성'),
        ...state.sessionList.map((s, i) => h('div', { class: 'session-row' },
          IconTile('music', { size: 'sm', tone: 'accent' }),
          h('div', { class: 'session-row__body' },
            h('div', { class: 'session-row__label' }, s.label),
            h('div', { class: 'session-row__participant' }, s.type)),
          h('button', { class: 'session-row__delete',
            onClick: () => { state.sessionList.splice(i, 1); render(); } },
            Icon('trash', { size: 14 }))
        )),
        h('button', { class: 'add-dashed', onClick: () => {
          openModal({
            title: '세션 추가', width: 360,
            body: h('div', {},
              h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' } },
                ...sessionTypes.map(t => h('button', { class: 'chip', style: { justifyContent: 'flex-start' },
                  onClick: () => {
                    state.sessionList.push({ label: t.type, type: t.type });
                    closeModal(); render();
                  } },
                  Icon(t.icon, { size: 13 }), t.type))),
            )
          });
        }},
          Icon('plus', { size: 13 }), ' 세션 추가'),
        h('div', { style: { display: 'flex', gap: '10px', marginTop: '16px' } },
          Button({ label: '이전', variant: 'secondary', fullWidth: true, onClick: () => { state.step = 1; render(); } }),
          Button({ label: '합주 생성', loading: state.loading, fullWidth: true, onClick: () => {
            state.loading = true; render();
            setTimeout(() => { showToast('합주가 생성되었습니다.'); navigate('practice'); }, 700);
          }})
        )
      ));
    }
    root.appendChild(inner);
  }
  render();
  return root;
}
