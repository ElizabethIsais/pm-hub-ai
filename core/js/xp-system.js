/**
 * XPSystem — 10-level progression engine.
 * Emits: 'xp:earned', 'xp:level-up'
 * Persists to StorageManager store: 'user_profile'
 */
const XPSystem = (() => {
  let _xp    = 0;
  let _level = 1;

  // XP thresholds per level (cumulative)
  const THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 6000];

  async function init() {
    const profile = await StorageManager.get('user_profile', 'main');
    if (profile) { _xp = profile.xp || 0; _level = _levelFor(_xp); }
  }

  function _levelFor(xp) {
    let lv = 1;
    for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= THRESHOLDS[i]) { lv = i + 1; break; }
    }
    return Math.min(lv, 10);
  }

  function _progress() {
    const cur  = THRESHOLDS[_level - 1] || 0;
    const next = THRESHOLDS[_level]     || THRESHOLDS[THRESHOLDS.length - 1];
    const pct  = _level >= 10 ? 100 : Math.round((_xp - cur) / (next - cur) * 100);
    return { current: _xp - cur, total: next - cur, pct };
  }

  async function award(amount, reason = '') {
    const prev = _level;
    _xp  += amount;
    const next = _levelFor(_xp);

    await _persist();

    EventBus.emit('xp:earned', { amount, reason, total: _xp, level: next });
    StateManager.set('xp', _xp);
    StateManager.set('xpLevel', next);

    if (next > prev) {
      _level = next;
      EventBus.emit('xp:level-up', { prev, next, xp: _xp });
    } else {
      _level = next;
    }
  }

  async function _persist() {
    const profile = (await StorageManager.get('user_profile', 'main')) || { id: 'main' };
    profile.xp    = _xp;
    profile.level = _level;
    await StorageManager.put('user_profile', profile);
  }

  function getXP()       { return _xp; }
  function getLevel()    { return _level; }
  function getProgress() { return _progress(); }
  function getThresholds() { return [...THRESHOLDS]; }

  return { init, award, getXP, getLevel, getProgress, getThresholds };
})();
