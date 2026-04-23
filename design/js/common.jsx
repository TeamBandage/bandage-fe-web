
// ============================================================
// COMMON COMPONENTS
// ============================================================
const C = {
  bg: '#0D0D12',
  surface: '#161620',
  card: '#1E1E2A',
  border: '#2A2A3A',
  text: '#F0EFF8',
  textSub: '#8A8AA0',
  textMuted: '#55556A',
  accent: 'oklch(0.62 0.22 250)',
  accentDim: 'oklch(0.62 0.22 250 / 0.15)',
  amber: 'oklch(0.72 0.18 48)',
  amberDim: 'oklch(0.72 0.18 48 / 0.15)',
  danger: 'oklch(0.62 0.22 25)',
  dangerDim: 'oklch(0.62 0.22 25 / 0.15)',
  success: 'oklch(0.68 0.18 145)',
  successDim: 'oklch(0.68 0.18 145 / 0.15)',
  warn: 'oklch(0.75 0.18 80)',
};

// ── Icons (SVG inline) ──────────────────────────────────────
function Icon({ name, size = 20, color = C.textSub, style = {} }) {
  const s = { width: size, height: size, flexShrink: 0, ...style };
  const paths = {
    home: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
    band: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    practice: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
    performance: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11,5 2,12 11,19 11,5"/><polygon points="22,5 13,12 22,19 22,5"/></svg>,
    mypage: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    back: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>,
    close: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    plus: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    edit: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    check: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
    music: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
    location: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    calendar: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    link: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    eye: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    eyeOff: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
    more: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
    bell: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    settings: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    chevronRight: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>,
    drum: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="5"/><line x1="2" y1="12" x2="2" y2="19"/><line x1="22" y1="12" x2="22" y2="19"/><ellipse cx="12" cy="19" rx="10" ry="5"/></svg>,
    mic: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
    star: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/></svg>,
    camera: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
    logout: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    user: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    shield: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    guitar: <svg style={s} viewBox="0 0 24 24"><rect x="9.5" y="1" width="5" height="2.5" rx="1" fill={color}/><rect x="11" y="2" width="2" height="8" fill={color}/><path fill={color} d="M12 9.5C9 9.5 7 11 7 13c0 1.5 1.5 2.5 1.5 2.5C7 16.5 6 17.5 6 19c0 2.5 2.5 4 6 4s6-1.5 6-4c0-1.5-1-2.5-2.5-3.5 0 0 1.5-1 1.5-2.5 0-2-2-3.5-5-3.5z"/><rect x="9.5" y="17" width="5" height="1.2" rx="0.3" fill="rgba(0,0,0,0.3)"/></svg>,
    info: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  };
  return paths[name] || <svg style={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill={color} opacity="0.3"/></svg>;
}

// ── Toast ───────────────────────────────────────────────────
function Toast({ message, type = 'default', visible }) {
  const bgMap = { default: C.card, success: C.successDim, error: C.dangerDim, info: C.accentDim };
  const borderMap = { default: C.border, success: C.success, error: C.danger, info: C.accent };
  if (!visible || !message) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      background: bgMap[type], border: `1px solid ${borderMap[type]}`,
      borderRadius: 12, padding: '10px 18px', zIndex: 9999,
      color: C.text, fontSize: 13, fontWeight: 500,
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      whiteSpace: 'nowrap', maxWidth: 280,
      animation: 'fadeInUp 0.2s ease',
    }}>{message}</div>
  );
}

// ── BottomSheet ─────────────────────────────────────────────
function BottomSheet({ visible, onClose, title, children, height = 'auto' }) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
    }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{
        position: 'relative', background: C.surface, borderRadius: '20px 20px 0 0',
        padding: '0 0 env(safe-area-inset-bottom)', zIndex: 1,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: '12px auto 0' }} />
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0' }}>
            <span style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>{title}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <Icon name="close" color={C.textSub} size={20} />
            </button>
          </div>
        )}
        <div style={{ overflowY: 'auto', padding: '16px 20px 24px', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Dialog / Confirm Modal ──────────────────────────────────
function Dialog({ visible, title, message, subText, confirmLabel = '확인', cancelLabel = '취소', confirmDanger, onConfirm, onCancel }) {
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} />
      <div style={{ position: 'relative', background: C.surface, borderRadius: 20, padding: '24px 20px 20px', width: '100%', maxWidth: 320, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8, textAlign: 'center' }}>{title}</div>
        {message && <div style={{ fontSize: 14, color: C.textSub, textAlign: 'center', marginBottom: 6 }}>{message}</div>}
        {subText && <div style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', marginBottom: 20 }}>{subText}</div>}
        {!subText && message && <div style={{ height: 16 }} />}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, color: C.textSub, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>{cancelLabel}</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '12px', background: confirmDanger ? C.danger : C.accent, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Header ──────────────────────────────────────────────────
function Header({ title, onBack, rightActions, transparent }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '12px 16px',
      background: transparent ? 'transparent' : C.surface,
      borderBottom: transparent ? 'none' : `1px solid ${C.border}`,
      minHeight: 52, gap: 8, flexShrink: 0,
    }}>
      {onBack && (
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
          <Icon name="back" color={C.text} size={22} />
        </button>
      )}
      <span style={{ flex: 1, fontWeight: 700, fontSize: 17, color: C.text }}>{title}</span>
      {rightActions && <div style={{ display: 'flex', gap: 4 }}>{rightActions}</div>}
    </div>
  );
}

// ── BottomNav ───────────────────────────────────────────────
function BottomNav({ active, onNavigate }) {
  const tabs = [
    { id: 'home', label: '홈', icon: 'home' },
    { id: 'band', label: '밴드', icon: 'band' },
    { id: 'practice', label: '합주', icon: 'practice' },
    { id: 'performance', label: '공연', icon: 'performance' },
    { id: 'mypage', label: '마이', icon: 'mypage' },
  ];
  return (
    <div style={{
      display: 'flex', background: C.surface, borderTop: `1px solid ${C.border}`,
      paddingBottom: 8, flexShrink: 0,
    }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onNavigate(t.id)} style={{
            flex: 1, background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '8px 0 2px', gap: 2,
          }}>
            <Icon name={t.icon} size={22} color={isActive ? C.accent : C.textMuted} />
            <span style={{ fontSize: 10, color: isActive ? C.accent : C.textMuted, fontWeight: isActive ? 700 : 500 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Input Field ─────────────────────────────────────────────
function Input({ label, value, onChange, type = 'text', placeholder, error, rightEl, maxLength, disabled, multiline }) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error ? C.danger : focused ? C.accent : C.border;
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={{ fontSize: 12, color: C.textSub, marginBottom: 6, fontWeight: 600 }}>{label}</div>}
      <div style={{ position: 'relative', display: 'flex', alignItems: multiline ? 'flex-start' : 'center' }}>
        <Tag
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={multiline ? 4 : undefined}
          style={{
            flex: 1, background: C.card, border: `1.5px solid ${borderColor}`,
            borderRadius: 12, padding: multiline ? '12px 14px' : '12px 14px',
            color: C.text, fontSize: 15, outline: 'none',
            fontFamily: 'inherit', resize: multiline ? 'none' : undefined,
            transition: 'border-color 0.15s',
          }}
        />
        {rightEl && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>{rightEl}</div>}
      </div>
      {maxLength && value !== undefined && (
        <div style={{ textAlign: 'right', fontSize: 11, color: C.textMuted, marginTop: 4 }}>{value.length}/{maxLength}</div>
      )}
      {error && <div style={{ fontSize: 12, color: C.danger, marginTop: 5 }}>{error}</div>}
    </div>
  );
}

// ── Button ──────────────────────────────────────────────────
function Btn({ label, onClick, variant = 'primary', disabled, loading, icon, small, fullWidth = true }) {
  const bg = {
    primary: C.accent,
    secondary: C.card,
    danger: C.danger,
    ghost: 'transparent',
    amber: C.amber,
  }[variant];
  const fg = variant === 'secondary' || variant === 'ghost' ? C.textSub : '#fff';
  const border = variant === 'secondary' ? `1.5px solid ${C.border}` : variant === 'ghost' ? `1.5px solid ${C.border}` : 'none';
  return (
    <button onClick={disabled || loading ? undefined : onClick} style={{
      width: fullWidth ? '100%' : undefined,
      padding: small ? '9px 16px' : '14px 20px',
      background: disabled ? C.card : bg,
      border, borderRadius: 12,
      color: disabled ? C.textMuted : fg,
      fontWeight: 700, fontSize: small ? 13 : 15, cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      transition: 'opacity 0.15s', opacity: disabled ? 0.6 : 1,
      fontFamily: 'inherit',
    }}>
      {loading ? <Spinner size={16} /> : icon ? <Icon name={icon} size={16} color={disabled ? C.textMuted : fg} /> : null}
      {label}
    </button>
  );
}

// ── Spinner ─────────────────────────────────────────────────
function Spinner({ size = 20, color = C.accent }) {
  return (
    <div style={{
      width: size, height: size, border: `2px solid ${C.border}`,
      borderTopColor: color, borderRadius: '50%',
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  );
}

// ── Badge ───────────────────────────────────────────────────
function Badge({ label, color = C.accent, bg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
      background: bg || `${color}22`, color,
    }}>{label}</span>
  );
}

// ── Role Badge ──────────────────────────────────────────────
function RoleBadge({ role }) {
  const map = {
    LEADER: { label: '리더', color: C.amber },
    ADMIN: { label: '관리자', color: C.accent },
    MEMBER: { label: '멤버', color: C.textSub },
  };
  const { label, color } = map[role] || { label: role, color: C.textSub };
  return <Badge label={label} color={color} />;
}

// ── Avatar ──────────────────────────────────────────────────
function Avatar({ name, size = 36, bg }) {
  const initials = name ? name.slice(0, 1) : '?';
  const colors = [C.accent, C.amber, C.success, C.warn];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg || colors[idx] + '33',
      border: `1.5px solid ${bg || colors[idx]}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: bg || colors[idx],
      flexShrink: 0,
    }}>{initials}</div>
  );
}

// ── FAB ─────────────────────────────────────────────────────
function FAB({ onClick, icon = 'plus', label }) {
  return (
    <button onClick={onClick} style={{
      position: 'absolute', bottom: 80, right: 20,
      background: C.accent, border: 'none', borderRadius: label ? 24 : '50%',
      padding: label ? '12px 20px' : 16,
      display: 'flex', alignItems: 'center', gap: 6,
      color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
      boxShadow: `0 4px 20px ${C.accent}66`, zIndex: 100,
    }}>
      <Icon name={icon} color="#fff" size={20} />
      {label && <span>{label}</span>}
    </button>
  );
}

// ── Skeleton Card ───────────────────────────────────────────
function SkeletonCard({ height = 80 }) {
  return (
    <div style={{ background: C.card, borderRadius: 14, height, marginBottom: 10, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)', animation: 'shimmer 1.4s infinite' }} />
    </div>
  );
}

// ── Empty State ─────────────────────────────────────────────
function EmptyState({ icon = 'info', title, sub, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 12 }}>
      <div style={{ background: C.card, borderRadius: '50%', padding: 20 }}>
        <Icon name={icon} size={32} color={C.textMuted} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.textSub }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: C.textMuted, textAlign: 'center' }}>{sub}</div>}
      {action}
    </div>
  );
}

// ── Image Placeholder ────────────────────────────────────────
function ImgPlaceholder({ width = '100%', height = 120, label = '', borderRadius = 12 }) {
  return (
    <div style={{
      width, height, borderRadius, background: C.card,
      border: `1px dashed ${C.border}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 6, overflow: 'hidden', flexShrink: 0,
    }}>
      <Icon name="camera" size={22} color={C.textMuted} />
      {label && <span style={{ fontSize: 10, color: C.textMuted, fontFamily: 'monospace' }}>{label}</span>}
    </div>
  );
}

// ── Section Title ────────────────────────────────────────────
function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</span>
      {action}
    </div>
  );
}

// ── Chip ────────────────────────────────────────────────────
function Chip({ label, selected, onClick, icon }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', borderRadius: 20,
      background: selected ? C.accentDim : C.card,
      border: `1.5px solid ${selected ? C.accent : C.border}`,
      color: selected ? C.accent : C.textSub,
      fontSize: 13, fontWeight: selected ? 700 : 500,
      cursor: 'pointer', whiteSpace: 'nowrap',
      display: 'flex', alignItems: 'center', gap: 4,
      fontFamily: 'inherit',
    }}>
      {icon && <Icon name={icon} size={14} color={selected ? C.accent : C.textSub} />}
      {label}
    </button>
  );
}

// ── Progress Steps ───────────────────────────────────────────
function StepIndicator({ steps, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '4px 0' }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: i <= current ? C.accent : C.card,
              border: `2px solid ${i <= current ? C.accent : C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: i <= current ? '#fff' : C.textMuted, fontSize: 13, fontWeight: 700,
            }}>
              {i < current ? <Icon name="check" size={14} color="#fff" /> : i + 1}
            </div>
            <span style={{ fontSize: 11, color: i === current ? C.accent : C.textMuted, fontWeight: i === current ? 700 : 400 }}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ height: 2, flex: 1, background: i < current ? C.accent : C.border, marginBottom: 16, maxWidth: 40 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Divider ──────────────────────────────────────────────────
function Divider({ style = {} }) {
  return <div style={{ height: 1, background: C.border, margin: '4px 0', ...style }} />;
}

// ── Card ─────────────────────────────────────────────────────
function Card({ children, onClick, style = {} }) {
  return (
    <div onClick={onClick} style={{
      background: C.card, borderRadius: 14, padding: '14px 16px',
      border: `1px solid ${C.border}`, marginBottom: 10,
      cursor: onClick ? 'pointer' : undefined, ...style,
    }}>{children}</div>
  );
}

// ── Password Strength ─────────────────────────────────────────
function PasswordStrength({ password }) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [
    { label: '약함', color: C.danger },
    { label: '보통', color: C.warn },
    { label: '강함', color: C.success },
    { label: '매우 강함', color: C.success },
  ];
  const level = levels[Math.max(0, score - 1)] || { label: '', color: C.border };
  if (!password) return null;
  return (
    <div style={{ marginTop: -8, marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? level.color : C.border }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: level.color, fontWeight: 600 }}>{level.label}</span>
    </div>
  );
}

// ── Scroll Container ──────────────────────────────────────────
function ScrollView({ children, style = {} }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', ...style }}>{children}</div>
  );
}

// Export all to window
Object.assign(window, {
  C, Icon, Toast, BottomSheet, Dialog, Header, BottomNav,
  Input, Btn, Spinner, Badge, RoleBadge, Avatar, FAB,
  SkeletonCard, EmptyState, ImgPlaceholder, SectionTitle,
  Chip, StepIndicator, Divider, Card, PasswordStrength, ScrollView,
});
