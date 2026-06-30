/**
 * StreakSystem — daily activity tracker.
 * Uses YYYY-MM-DD local date strings to avoid timezone bugs.
 * Emits: 'streak:updated'
 */
const StreakSystem = (() => {
  let _streak    = 0;
  let _lastDate  = null;
  let _longest   = 0;

  function _today() {
    return new Date().toLocaleDateString('en-CA');  // YYYY-MM-DD local
  }

  function _yesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-CA');
  }

  async function init() {
    const profile = await StorageManager.get('user_profile', 'main');
    if (profile) {
      _streak   = profile.streak  || 0;
      _lastDate = profile.lastDate || null;
      _longest  = profile.longestStreak || 0;
    }
    // Check if streak should be reset (gap > 1 day)
    if (_lastDate && _lastDate !== _today() && _lastDate !== _yesterday()) {
      _streak = 0;
    }
    StateManager.set('streak', _streak);
  }

  async function recordActivity() {
    const today = _today();
    if (_lastDate === today) return;  // already recorded today

    if (_lastDate === _yesterday()) {
      _streak++;
    } else {
      _streak = 1;  // reset or first day
    }
    _lastDate = today;
    _longest  = Math.max(_longest, _streak);

    await _persist();
    StateManager.set('streak', _streak);
    EventBus.emit('streak:updated', { streak: _streak, date: today });
  }

  async function _persist() {
    const profile = (await StorageManager.get('user_profile', 'main')) || { id: 'main' };
    profile.streak        = _streak;
    profile.lastDate      = _lastDate;
    profile.longestStreak = _longest;
    await StorageManager.put('user_profile', profile);
  }

  function getStreak()  { return _streak; }
  function getLongest() { return _longest; }

  return { init, recordActivity, getStreak, getLongest };
})();
