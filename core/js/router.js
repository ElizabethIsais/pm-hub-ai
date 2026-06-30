/**
 * Router — hash-based SPA router.
 * Routes: /today /learning /practice /skills
 * Emits: 'route:changed' via EventBus with { path, prev }
 */
const Router = (() => {
  const _routes  = {};
  let _current   = null;
  let _container = null;
  let _active    = null;   // current module instance { destroy }

  function define(path, handler) {
    _routes[path] = handler;
  }

  function navigate(path, pushState = false) {
    const prev = _current;
    _current = path;

    // Destroy previous module
    if (_active && typeof _active.destroy === 'function') {
      try { _active.destroy(); } catch(e) { console.error('[Router] destroy', e); }
      _active = null;
    }

    // Render next
    if (_container) _container.innerHTML = '';
    const handler = _routes[path] || _routes['/dashboard'];
    if (handler) {
      _active = handler(_container) || null;
    }

    // Sync sidebar / mobile nav active state
    _syncNav(path);

    // Emit
    EventBus.emit('route:changed', { path, prev });
    StateManager.set('currentRoute', path);
  }

  function _syncNav(path) {
    document.querySelectorAll('[data-route]').forEach(el => {
      const active = el.dataset.route === path;
      el.classList.toggle('active', active);
      if (el.getAttribute('aria-current') !== undefined) {
        el.setAttribute('aria-current', active ? 'page' : 'false');
      }
    });
  }

  function init(containerEl) {
    _container = containerEl;

    window.addEventListener('hashchange', () => {
      const path = _hashToPath();
      navigate(path);
    });

    // Initial route
    navigate(_hashToPath());
  }

  function _hashToPath() {
    const hash = window.location.hash;
    return hash ? hash.replace('#', '') : '/dashboard';
  }

  function current() { return _current; }

  function go(path) {
    window.location.hash = '#' + path;
  }

  return { define, navigate, init, current, go };
})();
