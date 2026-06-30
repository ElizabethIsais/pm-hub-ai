/**
 * UIComponents — 15 shared UI factory functions.
 * All return DOM nodes; no innerHTML on user data (XSS safe).
 */
const UI = (() => {

  // 1. Icon helper
  function icon(id, extra = '') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', `icon${extra ? ' ' + extra : ''}`);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#icon-${id}`);
    svg.appendChild(use);
    return svg;
  }

  // 2. Button
  function btn(label, variant = 'primary', opts = {}) {
    const b = document.createElement('button');
    b.className = `btn btn-${variant}${opts.size ? ' btn-' + opts.size : ''}`;
    if (opts.icon) b.appendChild(icon(opts.icon));
    const span = document.createElement('span');
    span.textContent = label;
    b.appendChild(span);
    if (opts.onClick) b.addEventListener('click', opts.onClick);
    if (opts.id) b.id = opts.id;
    if (opts.disabled) b.disabled = true;
    if (opts.ariaLabel) b.setAttribute('aria-label', opts.ariaLabel);
    return b;
  }

  // 3. Card
  function card(opts = {}) {
    const d = document.createElement('div');
    d.className = `card${opts.className ? ' ' + opts.className : ''}`;
    if (opts.title) {
      const h = document.createElement('div');
      h.className = 'card-header';
      const t = document.createElement('h3');
      t.className = 'card-title';
      t.textContent = opts.title;
      h.appendChild(t);
      if (opts.headerAction) h.appendChild(opts.headerAction);
      d.appendChild(h);
    }
    if (opts.content) d.appendChild(opts.content);
    return d;
  }

  // 4. StatCard
  function statCard(opts = {}) {
    const d = document.createElement('div');
    d.className = 'stat-card';
    const iconWrap = document.createElement('div');
    iconWrap.className = 'stat-icon-wrap';
    if (opts.icon) iconWrap.appendChild(icon(opts.icon));
    d.appendChild(iconWrap);
    const body = document.createElement('div');
    body.className = 'stat-body';
    const val = document.createElement('div');
    val.className = 'stat-value';
    val.textContent = opts.value ?? '—';
    body.appendChild(val);
    const sub = document.createElement('div');
    sub.className = 'stat-sub';
    sub.textContent = opts.label ?? '';
    body.appendChild(sub);
    d.appendChild(body);
    if (opts.id) d.id = opts.id;
    return d;
  }

  // 5. ProgressBar
  function progressBar(pct, opts = {}) {
    const wrap = document.createElement('div');
    wrap.className = `progress-wrap${opts.className ? ' ' + opts.className : ''}`;
    if (opts.label) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;color:var(--text-muted)';
      const l = document.createElement('span'); l.textContent = opts.label;
      const r = document.createElement('span'); r.textContent = `${Math.round(pct)}%`;
      row.appendChild(l); row.appendChild(r);
      wrap.appendChild(row);
    }
    const track = document.createElement('div'); track.className = 'progress-track';
    const fill  = document.createElement('div'); fill.className  = 'progress-fill';
    fill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    if (opts.color) fill.style.background = `var(--${opts.color})`;
    track.appendChild(fill);
    wrap.appendChild(track);
    wrap.setAttribute('role', 'progressbar');
    wrap.setAttribute('aria-valuenow', String(Math.round(pct)));
    wrap.setAttribute('aria-valuemin', '0');
    wrap.setAttribute('aria-valuemax', '100');
    return wrap;
  }

  // 6. Badge
  function badge(label, variant = 'primary') {
    const b = document.createElement('span');
    b.className = `badge badge-${variant}`;
    b.textContent = label;
    return b;
  }

  // 7. Toast
  function toast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.setAttribute('role', 'alert');
    const icons = { success: 'check', error: 'x', warning: 'info', info: 'info' };
    t.appendChild(icon(icons[type] || 'info'));
    const msg = document.createElement('span'); msg.textContent = message;
    t.appendChild(msg);
    container.appendChild(t);
    setTimeout(() => {
      t.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => t.remove(), 300);
    }, duration);
  }

  // 8. Modal
  function modal(opts = {}) {
    const container = document.getElementById('modal-container');
    if (!container) return null;
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    if (opts.title) backdrop.setAttribute('aria-label', opts.title);
    const box = document.createElement('div');
    box.className = `modal-box${opts.size ? ' modal-' + opts.size : ''}`;
    if (opts.title) {
      const h = document.createElement('h2');
      h.style.cssText = 'margin:0 0 16px;font-size:1.1rem;';
      h.textContent = opts.title;
      box.appendChild(h);
    }
    if (opts.content) box.appendChild(opts.content);
    if (opts.actions) { box.appendChild(document.createElement('hr')); box.appendChild(opts.actions); }
    backdrop.appendChild(box);
    container.appendChild(backdrop);
    const close = () => { backdrop.style.animation = 'none'; backdrop.remove(); };
    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
    return { el: backdrop, close };
  }

  // 9. Empty State
  function emptyState(opts = {}) {
    const d = document.createElement('div');
    d.className = 'empty-state';
    if (opts.icon) { const w = document.createElement('div'); w.appendChild(icon(opts.icon)); d.appendChild(w); }
    if (opts.title) { const h = document.createElement('h3'); h.textContent = opts.title; d.appendChild(h); }
    if (opts.body)  { const p = document.createElement('p');  p.textContent = opts.body;  d.appendChild(p); }
    if (opts.action) d.appendChild(opts.action);
    return d;
  }

  // 10. Nav Item (sidebar)
  function navItem(opts = {}) {
    const a = document.createElement('a');
    a.className = 'nav-item';
    a.href = '#' + opts.route;
    a.dataset.route = opts.route;
    a.setAttribute('aria-label', opts.label);
    a.setAttribute('title', opts.label);
    if (opts.icon) a.appendChild(icon(opts.icon));
    const lbl = document.createElement('span');
    lbl.className = 'nav-label';
    lbl.textContent = opts.label;
    a.appendChild(lbl);
    if (opts.locked) {
      a.appendChild(icon('lock', 'icon-sm'));
      a.classList.add('locked');
    }
    return a;
  }

  // 11. XP Bar (sidebar / topbar variant)
  function xpBar() {
    const wrap = document.createElement('div');
    wrap.className = 'xp-bar-wrap';
    wrap.id = 'xp-bar-wrap';
    const lv = document.createElement('span');
    lv.className = 'xp-level-label';
    lv.id = 'xp-level-label';
    lv.textContent = `Nv. ${XPSystem.getLevel()}`;
    wrap.appendChild(lv);
    const prog = progressBar(XPSystem.getProgress().pct, { className: 'xp-bar' });
    prog.id = 'xp-progress-bar';
    wrap.appendChild(prog);
    // Auto-update on XP events
    EventBus.on('xp:earned', () => {
      const fill = prog.querySelector('.progress-fill');
      if (fill) fill.style.width = `${XPSystem.getProgress().pct}%`;
      lv.textContent = `Nv. ${XPSystem.getLevel()}`;
    });
    return wrap;
  }

  // 12. Streak chip
  function streakChip() {
    const d = document.createElement('div');
    d.className = 'streak-chip';
    d.id = 'streak-chip';
    d.appendChild(icon('flame'));
    const lbl = document.createElement('span');
    lbl.id = 'streak-value';
    lbl.textContent = StreakSystem.getStreak();
    d.appendChild(lbl);
    EventBus.on('streak:updated', ({ streak }) => { lbl.textContent = streak; });
    return d;
  }

  // 13. Achievement Toast (rich)
  function achievementToast(def) {
    const container = document.getElementById('toast-container');
    if (!container || !def) return;
    const t = document.createElement('div');
    t.className = 'toast toast-success achievement-toast';
    t.setAttribute('role', 'alert');
    t.appendChild(icon('trophy'));
    const body = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = 'Achievement unlocked!';
    const sub   = document.createElement('div');    sub.textContent   = def.title;
    body.appendChild(title); body.appendChild(sub);
    t.appendChild(body);
    container.appendChild(t);
    setTimeout(() => { t.style.animation = 'toastOut 0.3s ease forwards'; setTimeout(() => t.remove(), 300); }, 5000);
  }

  // 15. Level Badge (onboarding / profile)
  function levelBadge(level) {
    const def = LEVELS_DEF[level - 1] || LEVELS_DEF[0];
    const d = document.createElement('div');
    d.className = 'level-badge';
    const num = document.createElement('div'); num.className = 'level-num'; num.textContent = level;
    const name = document.createElement('div'); name.className = 'level-name'; name.textContent = def.title;
    d.appendChild(num); d.appendChild(name);
    return d;
  }

  return {
    icon, btn, card, statCard, progressBar, badge,
    toast, modal, emptyState, navItem, xpBar, streakChip,
    achievementToast, levelBadge
  };
})();
