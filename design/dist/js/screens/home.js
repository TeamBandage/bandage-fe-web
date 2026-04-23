/**
 * Home, MyPage screens.
 */
import { h } from '../core.js';
import { Icon } from '../icons.js';
import { Button, Card, IconTile, Stat, Avatar, RoleBadge, Badge, SectionTitle, Field, showToast, openDialog, openModal, closeModal, Divider } from '../components.js';
import { bands, practices, performances, currentUser } from '../data.js';

export function HomeScreen({ navigate }) {
  const statTone = { accent: 'accent', success: 'success', amber: 'amber', warn: 'warn' };
  return h('div', { class: 'pane-detail__body' },
    h('div', { class: 'home-header' },
      h('div', { class: 'home-header__greeting' }, `안녕하세요, ${currentUser.name} 님 👋`),
      h('div', { class: 'home-header__sub' }, '오늘도 좋은 합주 되세요.')
    ),
    h('div', { class: 'grid grid--4 home-stats' },
      Stat({ label: '소속 밴드', value: '3', icon: 'band', tone: 'accent' }),
      Stat({ label: '예정 합주', value: '2', icon: 'practice', tone: 'success' }),
      Stat({ label: '예정 공연', value: '2', icon: 'performance', tone: 'amber' }),
      Stat({ label: '참여 세션', value: '5', icon: 'music', tone: 'warn' }),
    ),
    h('div', { class: 'home-sections' },
      h('div', {},
        SectionTitle('내 밴드', h('button', {
          onClick: () => navigate('band'),
          style: { fontSize: '12px', color: 'var(--accent)' }
        }, '전체 보기 →')),
        ...bands.filter(b => b.myRole).map(b => h('div', { class: 'home-item', onClick: () => navigate('band') },
          IconTile('guitar', { size: 'md', tone: 'accent' }),
          h('div', { class: 'home-item__info' },
            h('div', { class: 'home-item__title' }, b.bandName)
          ),
          RoleBadge(b.myRole)
        ))
      ),
      h('div', {},
        SectionTitle('다가오는 합주', h('button', {
          onClick: () => navigate('practice'),
          style: { fontSize: '12px', color: 'var(--accent)' }
        }, '전체 보기 →')),
        ...practices.map(p => h('div', { class: 'home-item', onClick: () => navigate('practice') },
          IconTile('practice', { size: 'md', tone: 'success' }),
          h('div', { class: 'home-item__info' },
            h('div', { class: 'home-item__title' }, p.title),
            h('div', { class: 'home-item__sub' }, `${p.song.artist} — ${p.song.title}`),
            h('div', { class: 'home-item__meta' },
              h('span', {}, Icon('calendar', { size: 11, color: '#6B6B80' }), p.startAt),
              p.venue && h('span', {}, Icon('location', { size: 11, color: '#6B6B80' }), p.venue)
            )
          ),
          Badge('예정', 'accent')
        ))
      ),
      h('div', { style: { gridColumn: '1 / -1' } },
        SectionTitle('다가오는 공연', h('button', {
          onClick: () => navigate('performance'),
          style: { fontSize: '12px', color: 'var(--accent)' }
        }, '전체 보기 →')),
        h('div', { class: 'grid grid--3' },
          ...performances.slice(0, 3).map(pf => h('div', { class: 'home-item', onClick: () => navigate('performance'), style: { marginBottom: 0 } },
            IconTile('performance', { size: 'md', tone: 'amber' }),
            h('div', { class: 'home-item__info' },
              h('div', { class: 'home-item__title' }, pf.title),
              h('div', { class: 'home-item__meta' },
                h('span', {}, pf.startAt),
                h('span', {}, pf.venue)
              )
            ),
            pf.daysLeft <= 7 && Badge(`D-${pf.daysLeft}`, 'danger')
          ))
        )
      )
    )
  );
}

export function MyPageScreen({ navigate }) {
  const state = { name: currentUser.name, contact: currentUser.contact };
  const root = h('div', { class: 'pane-detail__body' });

  function openEdit() {
    const local = { name: state.name, contact: state.contact };
    openModal({
      title: '프로필 수정', width: 420,
      body: h('div', {},
        Field({ label: '이름', value: local.name, onChange: v => local.name = v }),
        Field({ label: '연락처', value: local.contact, onChange: v => local.contact = v }),
        h('div', { class: 'modal__actions' },
          Button({ label: '취소', variant: 'secondary', fullWidth: true, onClick: closeModal }),
          Button({ label: '저장', fullWidth: true, onClick: () => {
            state.name = local.name; state.contact = local.contact;
            closeModal(); showToast('프로필이 수정되었습니다.'); render();
          }}),
        )
      ),
    });
  }

  function render() {
    root.innerHTML = '';
    const body = h('div', { style: { maxWidth: '800px' } },
      h('div', { style: { fontSize: '22px', fontWeight: 800, marginBottom: '28px' } }, '마이페이지'),
      h('div', { class: 'grid grid--2' },
        h('div', { class: 'card profile-card', style: { gridColumn: '1 / -1' } },
          h('div', { class: 'profile-card__row' },
            h('div', { class: 'profile-card__avatar-wrap' },
              Avatar(state.name, 80),
              h('div', { class: 'profile-card__camera' }, Icon('camera', { size: 12, color: '#fff' }))
            ),
            h('div', { class: 'profile-card__info' },
              h('div', { class: 'profile-card__name' }, state.name),
              h('div', { class: 'profile-card__sub' }, currentUser.email),
              h('div', { class: 'profile-card__sub' }, state.contact)
            ),
            Button({ label: '프로필 편집', variant: 'secondary', icon: 'edit', onClick: openEdit })
          )
        ),
        h('div', {},
          SectionTitle('계정 설정'),
          h('div', { class: 'card settings-list', style: { padding: 0 } },
            h('button', { class: 'settings-row', onClick: () => navigate('passwordChange') },
              Icon('shield', { size: 18, color: '#B4B4C4' }),
              h('div', { class: 'settings-row__body' },
                h('div', { class: 'settings-row__label' }, '비밀번호 변경'),
                h('div', { class: 'settings-row__sub' }, '마지막 변경: 30일 전')
              ),
              Icon('chevronRight', { size: 16, color: '#6B6B80' })
            ),
            Divider(),
            h('button', { class: 'settings-row is-disabled' },
              Icon('bell', { size: 18, color: '#6B6B80' }),
              h('div', { class: 'settings-row__body' },
                h('div', { class: 'settings-row__label', style: { color: 'var(--text-muted)' } }, '알림 설정'),
                h('div', { class: 'settings-row__sub' }, '준비 중')
              )
            ),
            Divider(),
            h('button', { class: 'settings-row is-disabled' },
              Icon('info', { size: 18, color: '#6B6B80' }),
              h('div', { class: 'settings-row__body' },
                h('div', { class: 'settings-row__label', style: { color: 'var(--text-muted)' } }, '앱 정보'),
                h('div', { class: 'settings-row__sub' }, 'v1.0.0')
              )
            )
          )
        ),
        h('div', {},
          SectionTitle('기타'),
          h('div', { class: 'card settings-list', style: { padding: 0 } },
            h('button', { class: 'settings-row', onClick: () =>
              openDialog({ title: '로그아웃', message: '정말 로그아웃 하시겠습니까?',
                confirmLabel: '로그아웃', onConfirm: () => navigate('login') })
            },
              Icon('logout', { size: 18, color: '#B4B4C4' }),
              h('div', { class: 'settings-row__body' },
                h('div', { class: 'settings-row__label' }, '로그아웃')
              ),
              Icon('chevronRight', { size: 16, color: '#6B6B80' })
            ),
            Divider(),
            h('button', { class: 'settings-row settings-row--danger', onClick: () =>
              openDialog({ title: '회원 탈퇴', message: '정말 탈퇴하시겠습니까?',
                subText: '탈퇴 시 모든 데이터가 삭제됩니다.',
                confirmLabel: '탈퇴', danger: true, onConfirm: () => navigate('login') })
            },
              Icon('trash', { size: 18, color: 'var(--danger)' }),
              h('div', { class: 'settings-row__body' },
                h('div', { class: 'settings-row__label' }, '회원 탈퇴')
              ),
              Icon('chevronRight', { size: 16, color: 'var(--danger)' })
            )
          )
        )
      )
    );
    root.appendChild(body);
  }
  render();
  return root;
}
