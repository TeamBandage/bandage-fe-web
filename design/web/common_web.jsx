
// ============================================================
// WEB COMMON COMPONENTS
// ============================================================
const WC = {
  bg: '#08080E',
  sidebar: '#0F0F18',
  surface: '#13131E',
  card: '#1A1A28',
  cardHover: '#1F1F30',
  border: '#25253A',
  text: '#F0EFF8',
  textSub: '#8A8AA8',
  textMuted: '#4A4A62',
  accent: 'oklch(0.62 0.22 250)',
  accentDim: 'oklch(0.62 0.22 250 / 0.12)',
  accentHover: 'oklch(0.68 0.22 250)',
  amber: 'oklch(0.72 0.18 48)',
  amberDim: 'oklch(0.72 0.18 48 / 0.12)',
  danger: 'oklch(0.62 0.22 25)',
  dangerDim: 'oklch(0.62 0.22 25 / 0.12)',
  success: 'oklch(0.68 0.18 145)',
  successDim: 'oklch(0.68 0.18 145 / 0.12)',
  warn: 'oklch(0.75 0.18 80)',
};

// ── Icons ────────────────────────────────────────────────────
function WIcon({ name, size = 18, color = WC.textSub, style = {} }) {
  const s = { width: size, height: size, flexShrink: 0, display: 'block', ...style };
  const paths = {
    home: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
    band: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    practice: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
    performance: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="11,5 2,12 11,19 11,5"/><polygon points="22,5 13,12 22,19 22,5"/></svg>,
    mypage: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    back: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>,
    close: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    plus: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    edit: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    check: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
    music: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
    location: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    calendar: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    link: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    eye: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    eyeOff: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
    bell: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    settings: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    chevronRight: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>,
    logout: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    user: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    shield: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    mic: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
    drum: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="5"/><line x1="2" y1="12" x2="2" y2="19"/><line x1="22" y1="12" x2="22" y2="19"/><ellipse cx="12" cy="19" rx="10" ry="5"/></svg>,
    star: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/></svg>,
    camera: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
    info: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    guitar: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="2" x2="15" y2="2"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><path d="M11 4 L13 4 L13 11 L11 11 Z" fill={color} fillOpacity="0.15"/><rect x="6" y="11" width="12" height="10" rx="3" fill={color} fillOpacity="0.15"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="18" x2="15" y2="18"/></svg>,
    search: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    grid: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    list: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    x: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    externalLink: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  };
  return paths[name] || <svg style={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill={color} opacity="0.2"/></svg>;
}

// ── Toast ─────────────────────────────────────────────────────
function WToast({ message, type = 'default', visible }) {
  if (!visible || !message) return null;
  const bgMap = { default: WC.card, success: WC.successDim, error: WC.dangerDim, info: WC.accentDim };
  const bMap = { default: WC.border, success: WC.success, error: WC.danger, info: WC.accent };
  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
      background: bgMap[type], border: `1px solid ${bMap[type]}`,
      borderRadius: 12, padding: '12px 20px',
      color: WC.text, fontSize: 14, fontWeight: 500,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'wFadeIn 0.2s ease',
    }}>{message}</div>
  );
}

// ── Modal ─────────────────────────────────────────────────────
function WModal({ visible, onClose, title, children, width = 480 }) {
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', background: WC.surface, borderRadius: 20, width, maxWidth: 'calc(100vw - 40px)', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: `1px solid ${WC.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${WC.border}` }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: WC.text }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: WC.textSub }}>
            <WIcon name="x" size={18} color={WC.textSub} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Dialog ─────────────────────────────────────────────────────
function WDialog({ visible, title, message, subText, confirmLabel = '확인', cancelLabel = '취소', confirmDanger, onConfirm, onCancel }) {
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', background: WC.surface, borderRadius: 20, padding: '32px 28px 24px', width: 380, border: `1px solid ${WC.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: WC.text, marginBottom: 10 }}>{title}</div>
        {message && <div style={{ fontSize: 14, color: WC.textSub, marginBottom: 6 }}>{message}</div>}
        {subText && <div style={{ fontSize: 13, color: WC.textMuted, marginBottom: 24 }}>{subText}</div>}
        {!subText && <div style={{ height: 16 }} />}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '12px', background: WC.card, border: `1px solid ${WC.border}`, borderRadius: 12, color: WC.textSub, fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>{cancelLabel}</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '12px', background: confirmDanger ? WC.danger : WC.accent, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────
function WSidebar({ active, onNavigate, user, onLogout }) {
  const navItems = [
    { id: 'home', label: '홈', icon: 'home' },
    { id: 'band', label: '밴드', icon: 'band' },
    { id: 'practice', label: '합주', icon: 'practice' },
    { id: 'performance', label: '공연', icon: 'performance' },
  ];
  return (
    <div style={{ width: 240, height: '100%', background: WC.sidebar, borderRight: `1px solid ${WC.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '28px 20px 24px', borderBottom: `1px solid ${WC.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: WC.accentDim, border: `1px solid ${WC.accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WIcon name="guitar" size={22} color={WC.accent} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 900, color: WC.accent, letterSpacing: '-0.5px' }}>Bandage</span>
        </div>
        <div style={{ fontSize: 11, color: WC.textMuted, marginTop: 6, marginLeft: 46 }}>밴드 합주 & 공연 관리</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        {navItems.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: isActive ? WC.accentDim : 'transparent',
              marginBottom: 2, fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}>
              <WIcon name={item.icon} size={18} color={isActive ? WC.accent : WC.textSub} />
              <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? WC.accent : WC.textSub }}>{item.label}</span>
              {isActive && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: WC.accent }} />}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '16px 12px', borderTop: `1px solid ${WC.border}` }}>
        <button onClick={() => onNavigate('mypage')} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
          borderRadius: 10, border: 'none', cursor: 'pointer', background: active === 'mypage' ? WC.accentDim : 'transparent',
          fontFamily: 'inherit',
        }}>
          <WAvatar name={user?.name || '김밴드'} size={32} />
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: WC.text }}>{user?.name || '김밴드'}</div>
            <div style={{ fontSize: 11, color: WC.textMuted }}>내 프로필</div>
          </div>
          <WIcon name="chevronRight" size={14} color={WC.textMuted} />
        </button>
        <button onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', fontFamily: 'inherit', marginTop: 2 }}>
          <WIcon name="logout" size={18} color={WC.textMuted} />
          <span style={{ fontSize: 13, color: WC.textMuted }}>로그아웃</span>
        </button>
      </div>
    </div>
  );
}

// ── Top Bar ───────────────────────────────────────────────────
function WTopBar({ title, breadcrumb, actions, onBack }) {
  return (
    <div style={{ height: 60, display: 'flex', alignItems: 'center', padding: '0 28px', borderBottom: `1px solid ${WC.border}`, background: WC.surface, flexShrink: 0, gap: 12 }}>
      {onBack && (
        <button onClick={onBack} style={{ background: WC.card, border: `1px solid ${WC.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <WIcon name="back" size={16} color={WC.textSub} />
        </button>
      )}
      <div style={{ flex: 1 }}>
        {breadcrumb && <div style={{ fontSize: 11, color: WC.textMuted, marginBottom: 1 }}>{breadcrumb}</div>}
        <div style={{ fontSize: 17, fontWeight: 700, color: WC.text }}>{title}</div>
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────
function WInput({ label, value, onChange, type = 'text', placeholder, error, rightEl, maxLength, disabled, multiline, hint }) {
  const [focused, setFocused] = React.useState(false);
  const Tag = multiline ? 'textarea' : 'input';
  const border = error ? WC.danger : focused ? WC.accent : WC.border;
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <div style={{ fontSize: 12, color: WC.textSub, marginBottom: 6, fontWeight: 600, letterSpacing: '0.02em' }}>{label}</div>}
      <div style={{ position: 'relative' }}>
        <Tag type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          disabled={disabled} maxLength={maxLength} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          rows={multiline ? 4 : undefined}
          style={{ width: '100%', background: WC.card, border: `1.5px solid ${border}`, borderRadius: 10, padding: '11px 14px', color: WC.text, fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: multiline ? 'vertical' : undefined, transition: 'border-color 0.15s', paddingRight: rightEl ? 44 : 14 }} />
        {rightEl && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>{rightEl}</div>}
      </div>
      {maxLength && value !== undefined && <div style={{ textAlign: 'right', fontSize: 11, color: WC.textMuted, marginTop: 4 }}>{value.length}/{maxLength}</div>}
      {hint && !error && <div style={{ fontSize: 11, color: WC.textMuted, marginTop: 4 }}>{hint}</div>}
      {error && <div style={{ fontSize: 12, color: WC.danger, marginTop: 5 }}>{error}</div>}
    </div>
  );
}

// ── Button ─────────────────────────────────────────────────────
function WBtn({ label, onClick, variant = 'primary', disabled, loading, icon, small, fullWidth }) {
  const bg = { primary: WC.accent, secondary: WC.card, danger: WC.danger, ghost: 'transparent', amber: WC.amber }[variant];
  const fg = variant === 'secondary' || variant === 'ghost' ? WC.textSub : '#fff';
  const border = variant === 'secondary' ? `1.5px solid ${WC.border}` : variant === 'ghost' ? `1.5px solid ${WC.border}` : 'none';
  return (
    <button onClick={disabled || loading ? undefined : onClick} style={{
      width: fullWidth ? '100%' : undefined, padding: small ? '8px 16px' : '11px 22px',
      background: disabled ? WC.card : bg, border, borderRadius: 10,
      color: disabled ? WC.textMuted : fg, fontWeight: 600, fontSize: small ? 13 : 14,
      cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center',
      justifyContent: 'center', gap: 6, opacity: disabled ? 0.6 : 1,
      transition: 'opacity 0.15s', fontFamily: 'inherit', whiteSpace: 'nowrap',
    }}>
      {loading ? <WSpinner size={14} /> : icon ? <WIcon name={icon} size={15} color={disabled ? WC.textMuted : fg} /> : null}
      {label}
    </button>
  );
}

// ── Spinner ───────────────────────────────────────────────────
function WSpinner({ size = 18, color = WC.accent }) {
  return <div style={{ width: size, height: size, border: `2px solid ${WC.border}`, borderTopColor: color, borderRadius: '50%', animation: 'wSpin 0.7s linear infinite', flexShrink: 0 }} />;
}

// ── Avatar ─────────────────────────────────────────────────────
function WAvatar({ name, size = 36, bg }) {
  const colors = [WC.accent, WC.amber, WC.success, WC.warn];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `${colors[idx]}22`, border: `1.5px solid ${colors[idx]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: colors[idx], flexShrink: 0 }}>
      {name ? name.slice(0, 1) : '?'}
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────
function WBadge({ label, color = WC.accent, bg }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: bg || `${color}22`, color }}>{label}</span>;
}

// ── Role Badge ─────────────────────────────────────────────────
function WRoleBadge({ role }) {
  const map = { LEADER: { label: '리더', color: WC.amber }, ADMIN: { label: '관리자', color: WC.accent }, MEMBER: { label: '멤버', color: WC.textSub } };
  const { label, color } = map[role] || { label: role, color: WC.textSub };
  return <WBadge label={label} color={color} />;
}

// ── Chip ───────────────────────────────────────────────────────
function WChip({ label, selected, onClick, icon }) {
  return (
    <button onClick={onClick} style={{ padding: '6px 14px', borderRadius: 20, background: selected ? WC.accentDim : WC.card, border: `1.5px solid ${selected ? WC.accent : WC.border}`, color: selected ? WC.accent : WC.textSub, fontSize: 13, fontWeight: selected ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
      {icon && <WIcon name={icon} size={13} color={selected ? WC.accent : WC.textSub} />}
      {label}
    </button>
  );
}

// ── Step Indicator ─────────────────────────────────────────────
function WStepIndicator({ steps, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: i <= current ? WC.accent : WC.card, border: `2px solid ${i <= current ? WC.accent : WC.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: i <= current ? '#fff' : WC.textMuted, fontSize: 12, fontWeight: 700 }}>
              {i < current ? <WIcon name="check" size={13} color="#fff" /> : i + 1}
            </div>
            <span style={{ fontSize: 13, color: i === current ? WC.accent : WC.textMuted, fontWeight: i === current ? 700 : 400, whiteSpace: 'nowrap' }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < current ? WC.accent : WC.border, margin: '0 12px' }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────
function WCard({ children, onClick, style = {}, hover = true }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov && hover && onClick ? WC.cardHover : WC.card, borderRadius: 14, border: `1px solid ${hov && onClick ? WC.border : WC.border}`, padding: '16px 20px', cursor: onClick ? 'pointer' : undefined, transition: 'background 0.15s, transform 0.15s', transform: hov && onClick ? 'translateY(-1px)' : undefined, ...style }}>
      {children}
    </div>
  );
}

// ── Divider ────────────────────────────────────────────────────
function WDivider() { return <div style={{ height: 1, background: WC.border, margin: '4px 0' }} />; }

// ── Section Title ──────────────────────────────────────────────
function WSectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: WC.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{children}</span>
      {action}
    </div>
  );
}

// ── Empty State ─────────────────────────────────────────────────
function WEmptyState({ icon = 'info', title, sub, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 14 }}>
      <div style={{ background: WC.card, borderRadius: '50%', padding: 24, border: `1px solid ${WC.border}` }}>
        <WIcon name={icon} size={36} color={WC.textMuted} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: WC.textSub }}>{title}</div>
      {sub && <div style={{ fontSize: 14, color: WC.textMuted, textAlign: 'center', maxWidth: 320 }}>{sub}</div>}
      {action}
    </div>
  );
}

// ── Img Placeholder ─────────────────────────────────────────────
function WImgPlaceholder({ width = '100%', height = 180, label = '', borderRadius = 12 }) {
  return (
    <div style={{ width, height, borderRadius, background: WC.card, border: `1px dashed ${WC.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 0 }}>
      <WIcon name="camera" size={28} color={WC.textMuted} />
      {label && <span style={{ fontSize: 11, color: WC.textMuted, fontFamily: 'monospace' }}>{label}</span>}
    </div>
  );
}

// ── Password Strength ──────────────────────────────────────────
function WPasswordStrength({ password }) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [{ label: '약함', color: WC.danger }, { label: '보통', color: WC.warn }, { label: '강함', color: WC.success }, { label: '매우 강함', color: WC.success }];
  const level = levels[Math.max(0, score - 1)] || { label: '', color: WC.border };
  if (!password) return null;
  return (
    <div style={{ marginTop: -10, marginBottom: 14 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[0,1,2,3].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? level.color : WC.border }} />)}
      </div>
      <span style={{ fontSize: 11, color: level.color, fontWeight: 600 }}>{level.label}</span>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
function WStatCard({ label, value, icon, color = WC.accent }) {
  return (
    <div style={{ background: WC.card, borderRadius: 14, border: `1px solid ${WC.border}`, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <WIcon name={icon} size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: WC.text }}>{value}</div>
        <div style={{ fontSize: 12, color: WC.textMuted, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Tag ───────────────────────────────────────────────────────
function WTag({ label, color = WC.textSub }) {
  return <span style={{ fontSize: 11, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>{label}</span>;
}

Object.assign(window, {
  WC, WIcon, WToast, WModal, WDialog, WSidebar, WTopBar,
  WInput, WBtn, WSpinner, WAvatar, WBadge, WRoleBadge, WChip,
  WStepIndicator, WCard, WDivider, WSectionTitle, WEmptyState,
  WImgPlaceholder, WPasswordStrength, WStatCard, WTag,
});
