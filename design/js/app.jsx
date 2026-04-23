
// ============================================================
// MAIN APP — Navigation Router
// ============================================================

const TAB_SCREENS = ['home', 'band', 'practice', 'performance', 'mypage'];

function App() {
  const stored = (() => { try { return JSON.parse(localStorage.getItem('bandage_nav')); } catch { return null; } })();
  const [stack, setStack] = React.useState(stored?.stack || [{ screen: 'login', params: {} }]);
  const [activeTab, setActiveTab] = React.useState(stored?.tab || 'home');

  const current = stack[stack.length - 1];

  function persistNav(s, t) {
    try { localStorage.setItem('bandage_nav', JSON.stringify({ stack: s.slice(-3), tab: t })); } catch {}
  }

  function navigate(screen, params = {}) {
    if (screen === 'login') {
      const next = [{ screen: 'login', params: {} }];
      setStack(next); persistNav(next, activeTab);
      return;
    }
    if (TAB_SCREENS.includes(screen)) {
      const tab = screen;
      const next = [{ screen, params }];
      setStack(next); setActiveTab(tab); persistNav(next, tab);
      return;
    }
    const next = [...stack, { screen, params }];
    setStack(next); persistNav(next, activeTab);
  }

  function goBack() {
    if (stack.length > 1) {
      const next = stack.slice(0, -1);
      setStack(next); persistNav(next, activeTab);
    }
  }

  function navigateTab(tab) {
    const next = [{ screen: tab, params: {} }];
    setStack(next); setActiveTab(tab); persistNav(next, tab);
  }

  const isAuthScreen = current.screen === 'login' || current.screen === 'join' || current.screen === 'passwordChange';
  const showNav = !isAuthScreen;

  const screenMap = {
    login: LoginScreen,
    join: JoinScreen,
    passwordChange: PasswordChangeScreen,
    home: HomeScreen,
    band: BandListScreen,
    bandDetail: BandDetailScreen,
    bandCreate: BandCreateScreen,
    practice: PracticeListScreen,
    practiceDetail: PracticeDetailScreen,
    practiceCreate: PracticeCreateScreen,
    performance: PerformanceListScreen,
    performanceDetail: PerformanceDetailScreen,
    performanceCreate: PerformanceCreateScreen,
    mypage: MyPageScreen,
  };

  const Screen = screenMap[current.screen] || (() => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted }}>
      화면을 찾을 수 없습니다: {current.screen}
    </div>
  ));

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: "'Noto Sans KR', sans-serif", overflow: 'hidden' }}>
      <Screen navigate={navigate} params={current.params} goBack={goBack} />
      {showNav && (
        <BottomNav active={activeTab} onNavigate={navigateTab} />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
