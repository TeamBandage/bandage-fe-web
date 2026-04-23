/**
 * App shell: sidebar + top bar, rendered around the routed screen.
 */
import { h, cx } from './core.js';
import { Icon } from './icons.js';
import { Avatar } from './components.js';
import { currentUser } from './data.js';

export function Sidebar({ activeTab, onNavigate, onLogout }) {
  const items = [
    { id: 'home', label: '홈', icon: 'home' },
    { id: 'band', label: '밴드', icon: 'band' },
    { id: 'practice', label: '합주', icon: 'practice' },
    { id: 'performance', label: '공연', icon: 'performance' },
    { id: 'mypage', label: '마이페이지', icon: 'user' },
  ];
  return h('aside', { class: 'sidebar' },
    h('div', { class: 'sidebar__brand' },
      h('div', { class: 'sidebar__logo' }, Icon('guitar', { size: 22, color: 'oklch(0.62 0.22 250)' })),
      h('span', { class: 'sidebar__title' }, 'Bandage')
    ),
    h('div', { class: 'sidebar__section-label' }, 'Navigation'),
    h('nav', { class: 'sidebar__nav' },
      ...items.map(it => h('button', {
          class: cx('nav-item', activeTab === it.id && 'is-active'),
          onClick: () => onNavigate(it.id),
        },
        h('span', { class: 'nav-item__icon' }, Icon(it.icon, { size: 18, color: activeTab === it.id ? 'oklch(0.62 0.22 250)' : '#B4B4C4' })),
        h('span', {}, it.label)
      ))
    ),
    h('div', { class: 'sidebar__footer' },
      h('div', { class: 'sidebar__user' },
        Avatar(currentUser.name, 34),
        h('div', {},
          h('div', { class: 'sidebar__user-name' }, currentUser.name),
          h('div', { class: 'sidebar__user-sub' }, currentUser.email)
        )
      )
    )
  );
}

export function TopBar({ title, breadcrumb, actions = [] }) {
  return h('header', { class: 'topbar' },
    h('div', {},
      breadcrumb && h('div', { class: 'topbar__breadcrumb' }, breadcrumb),
      h('h1', { class: 'topbar__title' }, title)
    ),
    h('div', { class: 'topbar__actions' }, ...actions.filter(Boolean))
  );
}
