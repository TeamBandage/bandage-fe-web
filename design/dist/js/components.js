/**
 * Reusable UI components returning DOM nodes.
 */
import { h, cx } from './core.js';
import { Icon } from './icons.js';

// ---- Button ----
export function Button({ label, onClick, variant = 'primary', icon, loading, disabled, small, fullWidth, type = 'button' } = {}) {
  const cls = cx('btn',
    variant === 'secondary' && 'btn--secondary',
    variant === 'ghost' && 'btn--ghost',
    variant === 'danger' && 'btn--danger',
    small && 'btn--sm',
    fullWidth && 'btn--full',
  );
  return h('button', { class: cls, onClick, disabled: disabled || loading, type },
    loading ? h('span', { class: 'btn__spinner' }) : icon ? Icon(icon, { size: small ? 13 : 14 }) : null,
    h('span', {}, label)
  );
}

// ---- Input field ----
export function Field({ label, value = '', onChange, type = 'text', placeholder, error, multiline, maxLength, rightEl } = {}) {
  const input = h(multiline ? 'textarea' : 'input', {
    class: cx('input', multiline && 'input--multiline'),
    type, value, placeholder, maxLength,
    oninput: e => onChange && onChange(e.target.value),
  });
  return h('div', { class: 'field' },
    label && h('label', { class: 'field__label' }, label),
    h('div', { class: cx('input-wrap', error && 'input-wrap--error') },
      input,
      rightEl && h('div', { class: 'input-wrap__right-el' }, rightEl),
      maxLength && h('span', { class: 'field__count' }, `${value.length}/${maxLength}`)
    ),
    error && h('div', { class: 'field__error' }, error)
  );
}

// ---- Badge ----
export function Badge(label, variant = 'accent') {
  return h('span', { class: `badge badge--${variant}` }, label);
}

export function RoleBadge(role) {
  if (!role) return null;
  const map = { LEADER: ['leader', '👑 리더'], ADMIN: ['admin', '관리자'], MEMBER: ['member', '멤버'] };
  const [v, t] = map[role] || ['member', role];
  return h('span', { class: `role-badge role-badge--${v}` }, t);
}

// ---- Avatar ----
export function Avatar(name, size = 36) {
  const letter = (name || '?')[0];
  return h('div', { class: 'avatar', style: { width: size + 'px', height: size + 'px', fontSize: (size * 0.45) + 'px' } }, letter);
}

// ---- Card ----
export function Card({ onClick, padding, className }, ...children) {
  return h('div', {
    class: cx('card', onClick && 'card--clickable', className),
    onClick,
    style: padding !== undefined ? { padding } : null,
  }, ...children);
}

// ---- Section title ----
export function SectionTitle(text, action) {
  return h('div', { class: 'section-title' },
    h('span', { class: 'section-title__text' }, text),
    action
  );
}

// ---- Divider ----
export function Divider() { return h('div', { class: 'divider' }); }

// ---- Icon tile (colored square background) ----
export function IconTile(iconName, { size = 'md', tone = 'accent', iconSize } = {}) {
  const color = {
    accent: 'oklch(0.62 0.22 250)',
    success: 'oklch(0.70 0.18 155)',
    amber: 'oklch(0.72 0.18 48)',
    warn: 'oklch(0.76 0.17 85)',
    card: '#B4B4C4',
  }[tone];
  const s = iconSize || ({ sm: 14, md: 18, lg: 24 })[size];
  return h('div', { class: `icon-tile icon-tile--${size} icon-tile--${tone}` }, Icon(iconName, { size: s, color }));
}

// ---- Stat card ----
export function Stat({ label, value, icon, tone = 'accent' }) {
  return h('div', { class: 'stat' },
    IconTile(icon, { size: 'md', tone }),
    h('div', {},
      h('div', { class: 'stat__value' }, value),
      h('div', { class: 'stat__label' }, label)
    )
  );
}

// ---- Chip ----
export function Chip({ label, icon, selected, onClick }) {
  return h('button', { class: cx('chip', selected && 'is-selected'), onClick, type: 'button' },
    icon && Icon(icon, { size: 13 }),
    label
  );
}

// ---- Step indicator ----
export function Steps(labels, current) {
  return h('div', { class: 'steps' },
    ...labels.map((l, i) => [
      h('div', { class: cx('step', i === current && 'is-active', i < current && 'is-done') },
        h('div', { class: 'step__dot' }, i < current ? Icon('check', { size: 14, color: '#fff' }) : String(i + 1)),
        h('span', { class: 'step__label' }, l)
      ),
      i < labels.length - 1 && h('div', { class: cx('step__bar', i < current && 'is-filled') }),
    ]).flat()
  );
}

// ---- Password strength ----
export function PasswordStrength(pw) {
  let score = 0;
  if (!pw) return h('div', { class: 'pw-strength' });
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const level = score <= 1 ? 'weak' : score === 2 || score === 3 ? 'medium' : 'strong';
  const label = { weak: '약함', medium: '보통', strong: '강함' }[level];
  return h('div', { class: 'pw-strength' },
    h('div', { class: 'pw-strength__bar' },
      ...[0, 1, 2, 3].map(i => h('div', { class: cx('pw-strength__seg', i < score && `is-${level}`) }))
    ),
    h('div', { class: 'pw-strength__label' }, label + ' · 8자 이상, 대소문자, 숫자, 특수문자 권장')
  );
}

// ---- Modal ----
let activeModal = null;
export function openModal({ title, width, body, onClose }) {
  closeModal();
  const close = () => { onClose?.(); closeModal(); };
  const modal = h('div', {
    class: 'modal',
    style: width ? { width: width + 'px' } : null,
    onClick: e => e.stopPropagation(),
  },
    h('div', { class: 'modal__header' },
      h('h3', { class: 'modal__title' }, title),
      h('button', { class: 'modal__close', onClick: close }, Icon('x', { size: 16 }))
    ),
    body
  );
  const backdrop = h('div', { class: 'modal-backdrop', onClick: close }, modal);
  document.body.appendChild(backdrop);
  activeModal = backdrop;
  return { close };
}
export function closeModal() {
  if (activeModal) { activeModal.remove(); activeModal = null; }
}

// ---- Dialog (confirm) ----
export function openDialog({ title, message, subText, confirmLabel = '확인', cancelLabel = '취소', onConfirm, danger }) {
  openModal({
    title, width: 400,
    body: h('div', {},
      h('p', { style: { fontSize: '14px', color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: '8px' } }, message),
      subText && h('p', { style: { fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' } }, subText),
      h('div', { class: 'modal__actions' },
        Button({ label: cancelLabel, variant: 'secondary', onClick: closeModal, fullWidth: true }),
        Button({ label: confirmLabel, variant: danger ? 'danger' : 'primary', onClick: () => { closeModal(); onConfirm?.(); }, fullWidth: true }),
      )
    ),
  });
}

// ---- Toast ----
let toastEl = null;
export function showToast(message, type = 'success') {
  if (toastEl) toastEl.remove();
  toastEl = h('div', { class: `toast toast--${type}` },
    Icon(type === 'danger' ? 'x' : 'check', { size: 14, color: type === 'success' ? 'oklch(0.70 0.18 155)' : 'var(--text)' }),
    message
  );
  document.body.appendChild(toastEl);
  setTimeout(() => { toastEl?.remove(); toastEl = null; }, 2500);
}

// ---- Empty state ----
export function EmptyState({ icon, title, sub }) {
  return h('div', { class: 'empty' },
    h('div', { class: 'empty__icon' }, Icon(icon, { size: 30, color: 'var(--text-muted)' })),
    h('div', { class: 'empty__title' }, title),
    sub && h('div', { class: 'empty__sub' }, sub)
  );
}

// ---- Image placeholder ----
export function ImgPlaceholder({ height = 180, label = 'image' } = {}) {
  return h('div', { class: 'img-placeholder', style: { height: height + 'px' } }, label);
}
