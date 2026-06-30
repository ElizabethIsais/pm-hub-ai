/**
 * init.js — Bootstrap + nav.
 * Routes: /today  /learning  /practice  /skills
 */
const NAV_ITEMS = [
  { route: '/today',    label: 'Today',    icon: 'today'  },
  { route: '/learning', label: 'Learn',    icon: 'books'  },
  { route: '/practice', label: 'Practice', icon: 'target' },
];

(async function bootstrap() {
  try {
    await StorageManager.init();
    await XPSystem.init();
    await StreakSystem.init();
    await CompetencySystem.init();
    await AIProvider.init();

    const theme = (await StorageManager.getSetting('theme')) || 'light';
    document.documentElement.dataset.theme = theme;
    StateManager.set('theme', theme);

    const profile = await StorageManager.get('user_profile', 'main');
    if (profile && profile.name) StateManager.set('userName', profile.name);

    _buildNav();
    _wireTheme();
    _registerRoutes();

    Router.init(document.getElementById('main-content'));

    const loading = document.getElementById('loading-screen');
    if (loading) {
      loading.style.transition = 'opacity 0.25s';
      loading.style.opacity = '0';
      setTimeout(() => loading.remove(), 260);
    }

  } catch (err) {
    console.error('[Bootstrap]', err);
    const txt = document.querySelector('.loading-text');
    if (txt) txt.textContent = 'Error loading. Please refresh.';
  }
})();

// ── Nav ──────────────────────────────────────────────────────────────────────
function _buildNav() {
  const topLinks = document.getElementById('topnav-links');
  if (topLinks) {
    NAV_ITEMS.forEach(item => {
      const a = document.createElement('a');
      a.className = 'topnav-link';
      a.href = '#' + item.route;
      a.dataset.route = item.route;
      a.setAttribute('aria-label', item.label);
      a.innerHTML = '<svg class="icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-' + item.icon + '"/></svg>' + item.label;
      topLinks.appendChild(a);
    });
  }
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileNav) {
    NAV_ITEMS.forEach(item => {
      const a = document.createElement('a');
      a.className = 'mob-link';
      a.href = '#' + item.route;
      a.dataset.route = item.route;
      a.setAttribute('aria-label', item.label);
      a.innerHTML = '<svg class="icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-' + item.icon + '"/></svg>'
        + '<span class="mob-link-label">' + item.label + '</span>';
      mobileNav.appendChild(a);
    });
  }
}

function _syncNav(path) {
  document.querySelectorAll('[data-route]').forEach(el => {
    const active = el.dataset.route === path;
    el.classList.toggle('active', active);
    el.setAttribute('aria-current', active ? 'page' : 'false');
  });
}

// ── Routes ───────────────────────────────────────────────────────────────────
function _registerRoutes() {
  Router.define('/today',     el => DashboardModule.render(el));
  Router.define('/dashboard', el => DashboardModule.render(el));
  Router.define('/learning',  el => LearningModule.render(el));
  Router.define('/practice',  el => PracticeModule.render(el));
  Router.define('/skills',    el => SkillsModule.render(el));
  EventBus.on('route:changed', ({ path }) => _syncNav(path));
}

// ── Theme ────────────────────────────────────────────────────────────────────
function _wireTheme() {
  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    StateManager.set('theme', theme);
    StorageManager.setSetting('theme', theme);
    const icon = theme === 'light' ? '#icon-moon' : '#icon-sun';
    document.querySelectorAll('#theme-toggle use, #theme-toggle-mobile use').forEach(u =>
      u.setAttributeNS('http://www.w3.org/1999/xlink', 'href', icon)
    );
    EventBus.emit('ui:theme-changed', { theme });
  }
  const toggle = () => apply(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  document.getElementById('theme-toggle')?.addEventListener('click', toggle);
  document.getElementById('theme-toggle-mobile')?.addEventListener('click', toggle);
}
