/**
 * EventBus — colon-namespaced pub/sub (e.g. 'xp:earned', 'route:changed')
 * Extension: pure addition only — never remove existing event contracts.
 */
const EventBus = (() => {
  const _subs = {};
  const _onceMap = new WeakMap();

  function on(event, handler) {
    if (typeof handler !== 'function') return;
    (_subs[event] = _subs[event] || []).push(handler);
  }

  function once(event, handler) {
    const wrapper = (...args) => { off(event, wrapper); handler(...args); };
    _onceMap.set(handler, wrapper);
    on(event, wrapper);
  }

  function off(event, handler) {
    if (!_subs[event]) return;
    const target = _onceMap.has(handler) ? _onceMap.get(handler) : handler;
    _subs[event] = _subs[event].filter(h => h !== target);
  }

  function emit(event, data) {
    (_subs[event] || []).slice().forEach(h => {
      try { h(data); } catch(e) { console.error(`[EventBus] ${event}`, e); }
    });
  }

  function clear(event) {
    if (event) delete _subs[event];
    else Object.keys(_subs).forEach(k => delete _subs[k]);
  }

  return { on, once, off, emit, clear };
})();
