/**
 * DashboardModule — PM Hub AI Home Screen
 * Philosophy: "What do you want to accomplish today?"
 * Mode-based decision screen with smart Continue Learning and mini skills.
 */
const DashboardModule = (() => {

  // ── Onboarding ──────────────────────────────────────────────────────────
  async function _showOnboarding() {
    const overlay = document.getElementById('onboarding-overlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.innerHTML = '';

    const outer = document.createElement('div');
    outer.style.cssText = 'min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--bg-base);';

    const card = document.createElement('div');
    card.style.cssText = 'width:100%;max-width:400px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:32px;';

    const steps = [
      { emoji: '👋', title: 'Welcome!',
        body: 'Your personal PM learning companion. What\'s your name?',
        input: { placeholder: 'Your name…', key: 'userName' } },
      { emoji: '🎯', title: 'What\'s your goal?',
        body: 'Choose the one most relevant to you right now.',
        options: ['Get PMP certified', 'Master Agile / Scrum', 'Grow as a Technical PM', 'Prepare for interviews'],
        key: 'learningGoal' },
      { emoji: '🚀', title: 'You\'re all set!',
        body: 'Start whenever you\'re ready. Your streak begins today.',
        final: true }
    ];

    let step = 0;
    const data = {};

    function renderStep() {
      card.innerHTML = '';
      const s = steps[step];

      const dots = document.createElement('div');
      dots.style.cssText = 'display:flex;gap:5px;justify-content:center;margin-bottom:24px;';
      steps.forEach((_, i) => {
        const d = document.createElement('div');
        d.style.cssText = 'width:6px;height:6px;border-radius:50%;background:' + (i === step ? 'var(--primary)' : 'var(--border)') + ';transition:background 0.2s;';
        dots.appendChild(d);
      });
      card.appendChild(dots);

      const em = document.createElement('div');
      em.textContent = s.emoji;
      em.style.cssText = 'font-size:2.2rem;text-align:center;margin-bottom:10px;';
      card.appendChild(em);

      const h = document.createElement('h2');
      h.textContent = s.title;
      h.style.cssText = 'margin:0 0 6px;font-size:1.2rem;font-weight:800;text-align:center;letter-spacing:-0.02em;';
      card.appendChild(h);

      const p = document.createElement('p');
      p.textContent = s.body;
      p.style.cssText = 'margin:0 0 20px;color:var(--text-muted);text-align:center;font-size:0.875rem;line-height:1.5;';
      card.appendChild(p);

      let getValue = () => null;

      if (s.input) {
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.placeholder = s.input.placeholder;
        inp.style.cssText = 'width:100%;padding:12px 14px;border-radius:10px;border:2px solid var(--border);background:var(--bg-el);color:var(--text);font-size:0.95rem;outline:none;transition:border-color 0.15s;box-sizing:border-box;font-family:inherit;';
        inp.onfocus = () => { inp.style.borderColor = 'var(--primary)'; };
        inp.onblur  = () => { inp.style.borderColor = 'var(--border)'; };
        if (data[s.input.key]) inp.value = data[s.input.key];
        card.appendChild(inp);
        getValue = () => inp.value.trim();
        setTimeout(() => inp.focus(), 60);
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') cta.click(); });
      } else if (s.options) {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;flex-direction:column;gap:7px;';
        let selected = data[s.key] || null;
        s.options.forEach(opt => {
          const btn = document.createElement('button');
          btn.textContent = opt;
          btn.style.cssText = 'padding:11px 14px;border-radius:10px;text-align:left;font-size:0.875rem;cursor:pointer;border:2px solid ' + (selected === opt ? 'var(--primary)' : 'var(--border)') + ';background:' + (selected === opt ? 'var(--primary-bg)' : 'var(--bg-el)') + ';color:var(--text);transition:all 0.15s;font-family:inherit;';
          btn.onclick = () => {
            selected = opt;
            wrap.querySelectorAll('button').forEach(b => {
              b.style.borderColor = b.textContent === opt ? 'var(--primary)' : 'var(--border)';
              b.style.background  = b.textContent === opt ? 'var(--primary-bg)' : 'var(--bg-el)';
            });
          };
          wrap.appendChild(btn);
        });
        card.appendChild(wrap);
        getValue = () => selected;
      }

      const cta = document.createElement('button');
      cta.textContent = s.final ? 'Start learning 🎉' : 'Next →';
      cta.style.cssText = 'width:100%;margin-top:18px;padding:13px;border-radius:10px;background:var(--primary);color:#fff;border:none;font-size:0.95rem;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity 0.15s;';
      cta.onmouseenter = () => { cta.style.opacity = '0.88'; };
      cta.onmouseleave = () => { cta.style.opacity = '1'; };
      cta.onclick = async () => {
        const val = getValue();
        if (s.input) data[s.input.key] = val || '';
        if (s.key)   data[s.key]       = val || '';
        if (s.final) { await _finishOnboarding(data); return; }
        step++;
        renderStep();
      };
      card.appendChild(cta);

      if (step === 0) {
        const skip = document.createElement('button');
        skip.textContent = 'Skip';
        skip.style.cssText = 'display:block;width:100%;margin-top:8px;padding:8px;background:none;border:none;color:var(--text-faint);font-size:0.8rem;cursor:pointer;font-family:inherit;';
        skip.onclick = () => _finishOnboarding({});
        card.appendChild(skip);
      }
    }

    async function _finishOnboarding(d) {
      overlay.classList.add('hidden');
      if (d.userName) {
        StateManager.set('userName', d.userName);
        const profile = (await StorageManager.get('user_profile', 'main')) || { id: 'main' };
        profile.name = d.userName;
        profile.goal = d.learningGoal || '';
        profile.onboardingDone = true;
        await StorageManager.put('user_profile', profile);
        const el = document.getElementById('today-heading');
        if (el) el.textContent = 'Welcome back, ' + d.userName + ' 🌸';
      }
      await StorageManager.setSetting('onboardingDone', true);
      await XPSystem.award(50, 'onboarding_complete');
    }

    renderStep();
    outer.appendChild(card);
    overlay.appendChild(outer);
  }

  // ── Smart Continue Learning context ─────────────────────────────────────
  async function _getLastActiveContext() {
    try {
      const la = await StorageManager.getSetting('last_active_exp');
      if (!la || !la.trackId || !la.expId) return null;
      const pkg   = COMPETENCY_PACKAGES && COMPETENCY_PACKAGES.find(p => p.learn.id === la.trackId);
      const track = pkg && pkg.learn;
      const exp   = track && track.experiences && track.experiences.find(e => e.id === la.expId);
      if (!track || !exp) return null;
      if (la.completed) {
        return { type: 'completed', track, exp, trackId: la.trackId };
      }
      const phaseIdx = la.phaseIdx || 0;
      const phase    = exp.phases && exp.phases[phaseIdx];
      return { type: 'in_progress', track, exp, trackId: la.trackId, expId: la.expId, phaseIdx, phase };
    } catch(e) { return null; }
  }

  // ── Mini skills block ────────────────────────────────────────────────────
  function _buildMiniSkills() {
    if (!CompetencySystem.hasData()) return null;

    const top3 = CompetencySystem.getStrongest(3).slice(0, 3);
    const rec  = CompetencySystem.getRecommendation();

    const barsEl = document.createElement('div');
    barsEl.className = 'mini-skills-block';

    const header = document.createElement('div');
    header.className = 'mini-skills-header';
    header.innerHTML = '<span class="mini-skills-title">Your Skills</span>';
    const seeAll = document.createElement('button');
    seeAll.className = 'mini-skills-link';
    seeAll.textContent = 'See all →';
    seeAll.addEventListener('click', () => Router.go('/skills'));
    header.appendChild(seeAll);
    barsEl.appendChild(header);

    top3.forEach(c => {
      const pct = CompetencySystem.getPct(c);
      const row = document.createElement('div');
      row.className = 'mini-comp-bar';
      row.innerHTML = '<span class="mini-comp-name">' + c + '</span>'
        + '<div class="mini-comp-track"><div class="mini-comp-fill" style="width:' + pct + '%"></div></div>'
        + '<span class="mini-comp-pct">' + pct + '%</span>';
      barsEl.appendChild(row);
    });

    const card = document.createElement('div');
    card.className = 'today-skills-card';
    card.appendChild(barsEl);

    if (rec) {
      const recBtn = document.createElement('button');
      recBtn.className = 'today-rec-card';
      recBtn.innerHTML = '<div class="today-rec-label">Recommended next</div>'
        + '<div class="today-rec-title">' + rec.label + '</div>'
        + '<div class="today-rec-reason">Strengthen your ' + rec.competency + ' skills (' + rec.pct + '%)</div>';
      recBtn.addEventListener('click', () => {
        if (rec.intent)      StateManager.set('practice_intent', rec.intent);
        if (rec.learnIntent) StateManager.set('learn_intent', rec.learnIntent);
        Router.go(rec.route);
      });
      card.appendChild(recBtn);
    }

    return card;
  }

  // ── Render ───────────────────────────────────────────────────────────────
  async function render(container) {
    container.innerHTML = '';

    const [ctx, streak] = await Promise.all([
      _getLastActiveContext(),
      Promise.resolve(StreakSystem.getStreak())
    ]);

    const name     = StateManager.get('userName', '');
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    let tipIdx     = dayOfYear % PM_TIPS.length;

    // ── Build continue card content ──
    let continueIcon, continueTag, continueTitle, continueSub, continueHandler;
    if (!ctx) {
      continueIcon    = '📚';
      continueTag     = 'Get started';
      continueTitle   = 'Begin Learning';
      continueSub     = 'Start your PM journey with Project Fundamentals';
      continueHandler = () => Router.go('/learning');
    } else if (ctx.type === 'in_progress') {
      continueIcon    = '▶️';
      continueTag     = 'In progress · ' + (ctx.phase && ctx.phase.label ? ctx.phase.label : 'Phase ' + (ctx.phaseIdx + 1));
      continueTitle   = ctx.exp.title;
      continueSub     = ctx.track.title;
      continueHandler = () => {
        StateManager.set('learn_intent', { action: 'resume', trackId: ctx.trackId, expId: ctx.expId, phaseIdx: ctx.phaseIdx });
        Router.go('/learning');
      };
    } else {
      continueIcon    = '✅';
      continueTag     = 'Completed';
      continueTitle   = ctx.exp.title;
      continueSub     = ctx.track.title + ' · Choose what\'s next';
      continueHandler = () => {
        StateManager.set('learn_intent', { action: 'track', trackId: ctx.trackId });
        Router.go('/learning');
      };
    }

    // ── Mode cards ──
    const modes = [
      { icon: '📚', label: 'Learning Library',         route: '/learning',  intent: () => StateManager.set('learn_intent', { action: 'library' }) },
      { icon: '⚡', label: 'Practice Challenges',       route: '/practice',  intent: () => StateManager.set('practice_intent', 'challenges') },
      { icon: '🎤', label: 'Interview Preparation',     route: '/practice',  intent: () => StateManager.set('practice_intent', 'interview') },
      { icon: '📋', label: 'Certification Preparation', route: '/practice',  intent: () => StateManager.set('practice_intent', 'certification') },
    ];

    const heading = name ? 'Welcome back, ' + name + ' 🌸' : 'Welcome back 🌸';
    const streakText = streak > 0 ? '🔥 ' + streak + ' day' + (streak === 1 ? '' : 's') : '🌱 Start today';
    const tipText = PM_TIPS[tipIdx].en;

    container.innerHTML = '<div class="today-screen">'
      + '<div class="today-topbar">'
      +   '<span class="today-topbar-title">Today</span>'
      +   '<div class="today-streak-chip" id="today-streak-chip">' + streakText + '</div>'
      + '</div>'
      + '<div class="today-welcome">'
      +   '<h1 id="today-heading">' + heading + '</h1>'
      +   '<p class="today-intent-heading">What do you want to accomplish today?</p>'
      + '</div>'
      + '<button class="today-continue-card" id="today-continue">'
      +   '<div class="today-continue-icon">' + continueIcon + '</div>'
      +   '<div class="today-continue-body">'
      +     '<div class="today-continue-label">' + continueTag + '</div>'
      +     '<div class="today-continue-title">' + continueTitle + '</div>'
      +     '<div class="today-continue-sub">' + continueSub + '</div>'
      +   '</div>'
      +   '<div class="today-continue-arrow"><svg class="icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><use href="#icon-chevron-right"/></svg></div>'
      + '</button>'
      + '<div class="today-mode-grid" id="today-mode-grid"></div>'
      + '<div id="today-skills-mini"></div>'
      + '<div class="today-tip-card">'
      +   '<div class="today-tip-header">'
      +     '<span class="today-tip-label">💡 PM Tip</span>'
      +     '<button class="today-tip-refresh" id="tip-refresh" aria-label="Next tip"><svg class="icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><use href="#icon-refresh"/></svg></button>'
      +   '</div>'
      +   '<p class="today-tip-text" id="today-tip-text">' + tipText + '</p>'
      + '</div>'
      + '</div>';

    // Wire continue button
    container.querySelector('#today-continue').addEventListener('click', continueHandler);

    // Wire mode cards
    const grid = container.querySelector('#today-mode-grid');
    modes.forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'today-mode-card';
      btn.innerHTML = '<span class="today-mode-icon">' + m.icon + '</span><span class="today-mode-label">' + m.label + '</span>';
      btn.addEventListener('click', () => { m.intent(); Router.go(m.route); });
      grid.appendChild(btn);
    });

    // Mini skills section
    const miniSkillsEl = _buildMiniSkills();
    if (miniSkillsEl) {
      container.querySelector('#today-skills-mini').appendChild(miniSkillsEl);
    }

    // Wire tip refresh
    container.querySelector('#tip-refresh').addEventListener('click', () => {
      tipIdx = (tipIdx + 1) % PM_TIPS.length;
      container.querySelector('#today-tip-text').textContent = PM_TIPS[tipIdx].en;
    });

    // Streak update
    EventBus.on('streak:updated', ({ streak: s }) => {
      const c = document.getElementById('today-streak-chip');
      if (c) c.textContent = '🔥 ' + s + ' day' + (s === 1 ? '' : 's');
    });

    await StreakSystem.recordActivity();

    const done = await StorageManager.getSetting('onboardingDone');
    if (!done) await _showOnboarding();
  }

  return { render };
})();
