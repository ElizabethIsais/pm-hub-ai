/**
 * StorageManager — async IndexedDB wrapper with in-memory fallback.
 * DB_VERSION=1. All 10 stores created upfront per ADR-005.
 * Stores: user_profile, xp_events, achievements, learning_progress,
 *         notes, chat_history, settings, cached_content,
 *         vectors*, relationships*   (* reserved for future modules)
 */
const StorageManager = (() => {
  const DB_NAME    = 'pm-hub-ai';
  const DB_VERSION = 1;
  const STORES = [
    'user_profile', 'xp_events', 'achievements', 'learning_progress',
    'notes', 'chat_history', 'settings', 'cached_content',
    'vectors', 'relationships'
  ];

  let _db  = null;
  let _mem = {};   // fallback when IndexedDB unavailable

  // ── Init ────────────────────────────────────────────────────────────────
  function init() {
    return new Promise((resolve) => {
      if (!window.indexedDB) { console.warn('[Storage] IndexedDB unavailable, using memory'); resolve(false); return; }
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = e => {
        const db = e.target.result;
        STORES.forEach(name => {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
          }
        });
      };

      req.onsuccess = e => { _db = e.target.result; resolve(true); };
      req.onerror   = e => { console.error('[Storage] Open failed', e); resolve(false); };
    });
  }

  // ── Core helpers ─────────────────────────────────────────────────────────
  function _tx(store, mode) {
    return _db.transaction(store, mode).objectStore(store);
  }

  function _wrap(req) {
    return new Promise((res, rej) => {
      req.onsuccess = e => res(e.target.result);
      req.onerror   = e => rej(e.target.error);
    });
  }

  // ── Public API ───────────────────────────────────────────────────────────
  async function get(store, key) {
    if (!_db) return _mem[store + '::' + key];
    return _wrap(_tx(store, 'readonly').get(key));
  }

  async function getAll(store) {
    if (!_db) {
      return Object.keys(_mem)
        .filter(k => k.startsWith(store + '::'))
        .map(k => _mem[k]);
    }
    return _wrap(_tx(store, 'readonly').getAll());
  }

  async function put(store, value) {
    if (!_db) {
      const key = value.id || Date.now();
      _mem[store + '::' + key] = { ...value, id: key };
      return key;
    }
    return _wrap(_tx(store, 'readwrite').put(value));
  }

  async function del(store, key) {
    if (!_db) { delete _mem[store + '::' + key]; return; }
    return _wrap(_tx(store, 'readwrite').delete(key));
  }

  async function clear(store) {
    if (!_db) {
      Object.keys(_mem).filter(k => k.startsWith(store + '::')).forEach(k => delete _mem[k]);
      return;
    }
    return _wrap(_tx(store, 'readwrite').clear());
  }

  async function getByKey(store, key, value) {
    const all = await getAll(store);
    return (all || []).find(r => r[key] === value) || null;
  }

  // ── Settings shortcut ────────────────────────────────────────────────────
  async function getSetting(key) {
    const row = await get('settings', key);
    return row ? row.value : null;
  }

  async function setSetting(key, value) {
    return put('settings', { id: key, value });
  }

  return { init, get, getAll, put, del, clear, getByKey, getSetting, setSetting };
})();
