
// ============================================================
// WEB — MAIN APP ROUTER
// ============================================================

const W_TAB_SCREENS = ['home', 'band', 'practice', 'performance', 'mypage'];

function WebApp() {
  const stored = (() => { try { return JSON.parse(localStorage.getItem('bandage_web_nav')); } catch { return null; } })();
  const [stack, setStack] = React.useState(stored?.stack || [{ screen: 'login', params: {} }]);
  const [activeTab, setActiveTab] = React.useState(stored?.tab || 'home');

  const current = stack[stack.length - 1];

  function persist(s, t) {
    try { localStorage.setItem('bandage_web_nav', JSON.stringify({ stack: s.slice(-3), tab: t })); } catch {}
  }

  function navigate(screen, params = {}) {
    if (screen === 'login') {
      const next = [{ screen: 'login', params: {} }];
      setStack(next); persist(next, activeTab); return;
    }
    if (W_TAB_SCREENS.includes(screen)) {
      const next = [{ screen, params }];
      setStack(next); setActiveTab(screen); persist(next, screen); return;
    }
    const next = [...stack, { screen, params }];
    setStack(next); persist(next, activeTab);
  }

  const isAuth = current.screen === 'login' || current.screen === 'join';
  const isNested = current.screen === 'passwordChange';

  const screenMap = {
    login: WLoginScreen,
    join: WJoinScreen,
    passwordChange: WPasswordChangeScreen,
    home: WHomeScreen,
    band: WBandListScreen,
    practice: WPracticeListScreen,
    performance: WPerformanceListScreen,
    mypage: WMyPageScreen,
  };

  const Screen = screenMap[current.screen] || (() => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: WC.textMuted }}>
      알 수 없는 화면: {current.screen}
    </div>
  ));

  if (isAuth) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', fontFamily: "'Noto Sans KR', sans-serif" }}>
        <Screen navigate={navigate} params={current.params} />
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: WC.bg, fontFamily: "'Noto Sans KR', sans-serif", overflow: 'hidden' }}>
      <WSidebar active={activeTab} onNavigate={screen => navigate(screen)}
        user={{ name: '김밴드' }}
        onLogout={() => navigate('login')} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Screen navigate={navigate} params={current.params} />
      </div>
    </div>
  );
}

const wRoot = ReactDOM.createRoot(document.getElementById('wroot'));
wRoot.render(<WebApp />);
