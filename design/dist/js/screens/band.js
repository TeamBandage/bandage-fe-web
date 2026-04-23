/**
 * Band list (master-detail) + create.
 */
import { h, cx } from '../core.js';
import { Icon } from '../icons.js';
import { Button, Field, IconTile, Avatar, RoleBadge, Badge, SectionTitle, EmptyState, showToast, openDialog, openModal, closeModal, Divider } from '../components.js';
import { bands, bandMembers, applications, findBand } from '../data.js';

export function BandScreen({ navigate }) {
  const state = { selectedId: bands.find(b => b.myRole)?.bandId || null, tab: 'my', detailTab: 'info' };
  const root = h('div', { class: 'pane-split' });

  function render() {
    root.innerHTML = '';

    const filteredBands = state.tab === 'my' ? bands.filter(b => b.myRole) : bands.filter(b => !b.myRole);

    const listPane = h('div', { class: 'pane-list pane-list--wide' },
      h('div', { class: 'pane-list__header' },
        h('div', { class: 'pane-list__title-row' },
          h('div', { class: 'pane-list__title' }, '밴드'),
          Button({ label: '생성', icon: 'plus', small: true, onClick: () => navigate('bandCreate') })
        ),
        h('div', { class: 'search-bar', style: { marginBottom: '10px' } },
          Icon('search', { size: 15, color: '#6B6B80' }),
          h('input', { placeholder: '밴드 검색' })
        ),
        h('div', { style: { display: 'flex', gap: '6px' } },
          ...[['my', '내 밴드'], ['all', '전체']].map(([id, l]) =>
            h('button', { class: cx('chip', state.tab === id && 'is-selected'),
              onClick: () => { state.tab = id; state.selectedId = filteredBands[0]?.bandId; render(); } }, l)
          )
        )
      ),
      h('div', { class: 'pane-list__body' },
        filteredBands.length === 0
          ? EmptyState({ icon: 'band', title: state.tab === 'my' ? '소속 밴드가 없습니다' : '밴드가 없습니다' })
          : h('div', {}, ...filteredBands.map(b =>
              h('div', { class: cx('list-item', state.selectedId === b.bandId && 'is-selected'),
                onClick: () => { state.selectedId = b.bandId; state.detailTab = 'info'; render(); } },
                IconTile('guitar', { size: 'md', tone: 'accent' }),
                h('div', { class: 'list-item__body' },
                  h('div', { class: 'list-item__title-row' },
                    h('div', { class: 'list-item__title' }, b.bandName),
                    RoleBadge(b.myRole)
                  ),
                  h('div', { class: 'list-item__sub', style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, b.description)
                )
              )
            ))
      )
    );

    const band = state.selectedId && findBand(state.selectedId);
    const detailPane = h('div', { class: 'pane-detail' });

    if (!band) {
      detailPane.appendChild(EmptyState({ icon: 'band', title: '밴드를 선택해주세요', sub: '왼쪽 목록에서 밴드를 선택하면 상세 정보가 표시됩니다.' }));
    } else {
      const isLeader = band.myRole === 'LEADER';
      const isAdmin = band.myRole === 'LEADER' || band.myRole === 'ADMIN';
      const tabs = isAdmin
        ? [['info', '기본 정보'], ['members', '멤버'], ['applications', '가입 신청']]
        : [['info', '기본 정보'], ['members', '멤버']];

      detailPane.appendChild(h('div', { class: 'topbar', style: { borderBottomColor: 'var(--border)' } },
        h('div', {},
          h('div', { class: 'topbar__breadcrumb' }, '밴드'),
          h('h1', { class: 'topbar__title', style: { display: 'flex', alignItems: 'center', gap: '10px' } },
            band.bandName, RoleBadge(band.myRole))
        ),
        h('div', { class: 'topbar__actions' },
          band.myRole
            ? (isLeader
                ? Button({ label: '편집', icon: 'edit', variant: 'secondary', small: true })
                : Button({ label: '탈퇴', variant: 'secondary', small: true,
                    onClick: () => openDialog({ title: '밴드 탈퇴', message: `'${band.bandName}'을(를) 탈퇴하시겠습니까?`,
                      danger: true, onConfirm: () => { showToast('탈퇴되었습니다.'); } }) }))
            : Button({ label: '가입 신청', icon: 'plus', onClick: () => showToast('가입 신청이 접수되었습니다.') })
        )
      ));

      detailPane.appendChild(h('div', { class: 'tabs' },
        ...tabs.map(([id, l]) => h('button', { class: cx('tab', state.detailTab === id && 'is-active'),
          onClick: () => { state.detailTab = id; render(); } }, l))
      ));

      const body = h('div', { class: 'pane-detail__body' });
      if (state.detailTab === 'info') {
        body.append(
          h('div', { class: 'card' },
            h('div', { style: { fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' } }, '소개'),
            h('div', { style: { fontSize: '14px', lineHeight: 1.7 } }, band.description)
          ),
          h('div', { class: 'grid grid--3', style: { marginTop: '16px' } },
            h('div', { class: 'card', style: { textAlign: 'center' } },
              h('div', { style: { fontSize: '24px', fontWeight: 800 } }, '5'),
              h('div', { style: { fontSize: '12px', color: 'var(--text-muted)' } }, '멤버')),
            h('div', { class: 'card', style: { textAlign: 'center' } },
              h('div', { style: { fontSize: '24px', fontWeight: 800 } }, '2'),
              h('div', { style: { fontSize: '12px', color: 'var(--text-muted)' } }, '예정 합주')),
            h('div', { class: 'card', style: { textAlign: 'center' } },
              h('div', { style: { fontSize: '24px', fontWeight: 800 } }, '1'),
              h('div', { style: { fontSize: '12px', color: 'var(--text-muted)' } }, '예정 공연')),
          ),
        );
      } else if (state.detailTab === 'members') {
        const members = bandMembers[band.bandId] || [];
        body.append(SectionTitle(`멤버 ${members.length}명`),
          h('div', { class: 'grid grid--2' }, ...members.map(m => h('div', { class: 'member-row' },
            Avatar(m.memberId, 40),
            h('div', { class: 'member-row__info' },
              h('div', { class: 'member-row__name' }, m.memberId),
              h('div', { class: 'member-row__sub' }, m.role)),
            RoleBadge(m.role),
            isLeader && m.role !== 'LEADER' && h('button', { class: 'btn btn--ghost btn--sm' }, Icon('settings', { size: 14 })),
          )))
        );
      } else {
        const apps = applications[band.bandId] || [];
        body.append(SectionTitle(`가입 신청 ${apps.filter(a => a.status === 'PENDING').length}건 대기 중`),
          ...apps.map(a => h('div', { class: 'member-row' },
            Avatar(a.memberId, 40),
            h('div', { class: 'member-row__info' },
              h('div', { class: 'member-row__name' }, a.memberId),
              h('div', { class: 'member-row__sub' }, `신청: ${a.appliedAt}`)),
            a.status === 'PENDING'
              ? h('div', { style: { display: 'flex', gap: '6px' } },
                  Button({ label: '승인', small: true, onClick: () => showToast(`${a.memberId} 승인됨`) }),
                  Button({ label: '거절', variant: 'secondary', small: true, onClick: () => showToast(`${a.memberId} 거절됨`) }))
              : Badge(a.status === 'APPROVED' ? '승인됨' : '거절됨', a.status === 'APPROVED' ? 'success' : 'muted')
          ))
        );
      }
      detailPane.appendChild(body);
    }

    root.append(listPane, detailPane);
  }
  render();
  return root;
}

export function BandCreateScreen({ navigate }) {
  const state = { name: '', description: '', loading: false, errors: {} };
  const root = h('div', { class: 'pane-detail__body' });

  function render() {
    root.innerHTML = '';
    root.appendChild(h('div', { style: { maxWidth: '560px' } },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' } },
        h('button', { class: 'btn btn--secondary btn--sm', onClick: () => navigate('band') },
          Icon('back', { size: 14 })),
        h('div', {},
          h('div', { style: { fontSize: '22px', fontWeight: 800 } }, '밴드 생성'),
          h('div', { style: { fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' } },
            '새 밴드를 만들고 멤버를 초대하세요.'))
      ),
      h('div', { class: 'card' },
        Field({ label: '밴드 이름 *', value: state.name, placeholder: '예: 루나틱', maxLength: 30,
          error: state.errors.name, onChange: v => { state.name = v; render(); } }),
        Field({ label: '소개', value: state.description, multiline: true, maxLength: 200,
          placeholder: '밴드의 장르, 활동 지역, 분위기 등을 소개해주세요.',
          onChange: v => { state.description = v; render(); } }),
        h('div', { class: 'hint-box' },
          h('div', { class: 'hint-box__label' }, '생성자 권한'),
          h('div', { class: 'hint-box__body' }, '밴드를 생성하면 자동으로 리더가 됩니다. 생성 후 멤버를 초대하고 관리자를 지정할 수 있습니다.')),
        h('div', { style: { display: 'flex', gap: '10px' } },
          Button({ label: '취소', variant: 'secondary', fullWidth: true, onClick: () => navigate('band') }),
          Button({ label: '밴드 생성', loading: state.loading, fullWidth: true, onClick: () => {
            if (!state.name.trim()) { state.errors = { name: '밴드 이름을 입력해주세요.' }; return render(); }
            state.loading = true; render();
            setTimeout(() => { showToast('밴드가 생성되었습니다.'); navigate('band'); }, 700);
          }})
        )
      )
    ));
  }
  render();
  return root;
}
