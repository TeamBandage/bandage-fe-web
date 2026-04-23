/**
 * App entry: router + shell + screen mounting.
 */
import { h, Router } from './core.js';
import { Sidebar } from './shell.js';
import { LoginScreen, JoinScreen, PasswordChangeScreen } from './screens/auth.js';
import { HomeScreen, MyPageScreen } from './screens/home.js';
import { BandScreen, BandCreateScreen } from './screens/band.js';
import { PracticeScreen, PracticeCreateScreen } from './screens/practice.js';
import { PerformanceScreen, PerformanceCreateScreen } from './screens/performance.js';

const STORAGE_KEY = 'bandage.web.nav';

const screens = {
  login: LoginScreen,
  join: JoinScreen,
  passwordChange: PasswordChangeScreen,
  home: HomeScreen,
  band: BandScreen,
  bandCreate: BandCreateScreen,
  practice: PracticeScreen,
  practiceCreate: PracticeCreateScreen,
  performance: PerformanceScreen,
  performanceCreate: PerformanceCreateScreen,
  mypage: MyPageScreen,
};

const authScreens = new Set(['login', 'join']);

function boot() {
  const persisted = Router.load(STORAGE_KEY);
  const router = new Router({
    stack: persisted.stack?.length ? persisted.stack : [{ screen: 'login', params: {} }],
    tab: persisted.tab || 'home',
  });
  router.persist(STORAGE_KEY);

  const app = document.getElementById('app');
  const navigate = (screen, params) => router.navigate(screen, params);

  function mount() {
    const { screen } = router.current();
    const { tab } = router.store.get();
    const ScreenFn = screens[screen] || HomeScreen;

    app.innerHTML = '';

    if (authScreens.has(screen)) {
      app.appendChild(ScreenFn({ navigate }));
      return;
    }

    const shell = h('div', { class: 'shell' });
    shell.appendChild(Sidebar({
      activeTab: tab,
      onNavigate: (id) => navigate(id),
    }));
    const main = h('main', { class: 'shell__main' });
    main.appendChild(ScreenFn({ navigate }));
    shell.appendChild(main);
    app.appendChild(shell);
  }

  router.subscribe(mount);
  mount();
}

boot();
