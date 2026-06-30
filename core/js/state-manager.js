/**
 * StateManager — reactive key-value store.
 * Subscribers called with (newValue, oldValue, key) on every set().
 * Extension: add new keys freely; never rename/remove existing keys.
 */
const StateManager = (() => {
  const _state = {};
  const _subs  = {};          // key → [fn, ...]
  const _global = [];         // subscribe to all changes

  function get(key, defaultVal) {
    return key in _state ? _state[key] : defaultVal;
  }

  function set(key, value) {
    const prev = _state[key];
    _state[key] = value;
    if (prev === value) return;
    (_subs[key] || []).slice().forEach(fn => {
      try { fn(value, prev, key); } catch(e) { console.error(`[State] ${key}`, e); }
    });
    _global.slice().forEach(fn => {
      try { fn(key, value, prev); } catch(e) { console.error('[State] global', e); }
    });
  }

  function subscribe(key, fn) {
    (_subs[key] = _subs[key] || []).push(fn);
    return () => { _subs[key] = (_subs[key] || []).filter(h => h !== fn); };
  }

  function subscribeAll(fn) {
    _global.push(fn);
    return () => { const i = _global.indexOf(fn); if (i > -1) _global.splice(i, 1); };
  }

  function getAll() { return { ..._state }; }

  return { get, set, subscribe, subscribeAll, getAll };
})();
