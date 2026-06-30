/**
 * SkillsModule — M4
 * Full competency dashboard: 12 PM competencies, strengths,
 * growth opportunities, and personalized next-action recommendation.
 * Route: /skills (accessible via Today screen "See all skills" link)
 */
const SkillsModule = (() => {
  let _container = null;

  const ICO_BACK  = 'M15 18l-6-6 6-6';
  const ICO_ARROW = 'M5 12h14M12 5l7 7-7 7';

  function icon(path, cls = 'icon') {
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
  }
  function _render(html) { if (_container) _container.innerHTML = html; }
  function _q(sel)  { return _container ? _container.querySelector(sel) : null; }

  // ── Competency category groupings ─────────────────────────────────────────
  const COMP_GROUPS = [
    {
      label: 'Project Management Core',
      icon: '🏗️',
      items: ['Decision Making', 'Scope Management', 'Risk Management', 'Product Thinking']
    },
    {
      label: 'Agile & Delivery',
      icon: '⚡',
      items: ['Agile & Scrum', 'Sprint Planning', 'Release Management']
    },
    {
      label: 'People & Communication',
      icon: '🤝',
      items: ['Stakeholder Communication', 'Leadership', 'Negotiation', 'Technical Communication']
    },
    {
      label: 'Emerging Skills',
      icon: '🤖',
      items: ['AI for Project Managers']
    }
  ];

  function _pctColor(pct) {
    if (pct >= 70) return 'var(--success)';
    if (pct >= 40) return 'var(--primary)';
    return 'var(--text-muted)';
  }

  function _pctLabel(pct) {
    if (pct === 0)  return 'Not started';
    if (pct < 25)   return 'Beginner';
    if (pct < 50)   return 'Developing';
    if (pct < 75)   return 'Proficient';
    if (pct < 95)   return 'Advanced';
    return 'Expert';
  }

  function _barBlock(name, pct) {
    const color = _pctColor(pct);
    const label = _pctLabel(pct);
    const fill  = `background:${color};width:${pct}%`;
    return `<div class="skill-bar-row">
      <div class="skill-bar-meta">
        <span class="skill-bar-name">${name}</span>
        <span class="skill-bar-label" style="color:${color}">${label}</span>
      </div>
      <div class="skill-bar-track">
        <div class="skill-bar-fill" style="${fill}"></div>
      </div>
      <span class="skill-bar-pct">${pct}%</span>
    </div>`;
  }

  async function render(container) {
    _container = container;
    const hasData = CompetencySystem.hasData();

    if (!hasData) {
      _renderEmptyState();
      return;
    }

    const all   = CompetencySystem.getAll();
    const rec   = CompetencySystem.getRecommendation();
    const top3  = CompetencySystem.getStrongest(3);
    const weak3 = CompetencySystem.getWeakest(3).filter(c => CompetencySystem.getPct(c) < 60);

    // Build group sections
    const groupSections = COMP_GROUPS.map(g => {
      const bars = g.items.map(name => {
        const pct = CompetencySystem.getPct(name);
        return _barBlock(name, pct);
      }).join('');
      return `<div class="skill-group">
        <div class="skill-group-header">
          <span class="skill-group-icon">${g.icon}</span>
          <span class="skill-group-label">${g.label}</span>
        </div>
        <div class="skill-group-bars">${bars}</div>
      </div>`;
    }).join('');

    // Strengths
    const strengthChips = top3.map(c => {
      const pct = CompetencySystem.getPct(c);
      return `<div class="strength-chip">
        <div class="strength-chip-name">${c}</div>
        <div class="strength-chip-pct">${pct}%</div>
      </div>`;
    }).join('');

    // Growth areas
    const growthRows = weak3.length
      ? weak3.map(c => {
          const pct = CompetencySystem.getPct(c);
          return `<div class="growth-row">
            <div class="growth-bar-wrap">
              <div class="growth-bar-name">${c}</div>
              <div class="growth-bar-track"><div class="growth-bar-fill" style="width:${pct}%"></div></div>
            </div>
            <span class="growth-pct">${pct}%</span>
          </div>`;
        }).join('')
      : `<div class="skills-no-gap">You're performing well across your tracked competencies.</div>`;

    // Recommendation card
    const recCard = rec ? `<div class="skills-rec-card">
      <div class="skills-rec-header">
        <div class="skills-rec-eyebrow">Recommended next</div>
        <div class="skills-rec-title">${rec.label}</div>
        <div class="skills-rec-reason">Your ${rec.competency} skills are at ${rec.pct}% — this will strengthen that area directly.</div>
      </div>
      <button class="skills-rec-btn" id="skills-rec-btn">Go there ${icon(ICO_ARROW)}</button>
    </div>` : '';

    // Overall score
    const allPcts = CompetencySystem.ALL.map(c => CompetencySystem.getPct(c));
    const avgPct  = Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length);

    _render(`<div class="skills-screen">
      <button class="learn-back" id="skills-back">${icon(ICO_BACK)} Today</button>
      <div class="skills-header">
        <div class="learn-eyebrow">PM Hub AI · Skills</div>
        <h1>Your PM Skills</h1>
        <p>Competencies are updated every time you complete a learning experience, practice challenge, or interview session.</p>
      </div>

      <div class="skills-overview-bar">
        <div class="skills-ov-label">Overall competency</div>
        <div class="skills-ov-track">
          <div class="skills-ov-fill" style="width:${avgPct}%"></div>
        </div>
        <div class="skills-ov-pct">${avgPct}%</div>
      </div>

      ${rec ? recCard : ''}

      <div class="skills-section-title">Strengths</div>
      <div class="strength-chips">${strengthChips || '<div class="skills-muted">Complete more activities to identify your strengths.</div>'}</div>

      <div class="skills-section-title">Growth opportunities</div>
      <div class="growth-list">${growthRows}</div>

      <div class="skills-section-title">All competencies</div>
      <div class="skill-groups">${groupSections}</div>
    </div>`);

    _q('#skills-back').addEventListener('click', () => Router.navigate('/today'));
    if (rec) {
      _q('#skills-rec-btn')?.addEventListener('click', () => {
        if (rec.intent)      StateManager.set('practice_intent', rec.intent);
        if (rec.learnIntent) StateManager.set('learn_intent', rec.learnIntent);
        Router.navigate(rec.route);
      });
    }
  }

  function _renderEmptyState() {
    _render(`<div class="skills-screen">
      <button class="learn-back" id="skills-back">${icon(ICO_BACK)} Today</button>
      <div class="skills-header">
        <div class="learn-eyebrow">PM Hub AI · Skills</div>
        <h1>Your PM Skills</h1>
      </div>
      <div class="skills-empty">
        <div class="skills-empty-icon">📊</div>
        <div class="skills-empty-title">No skills tracked yet</div>
        <div class="skills-empty-sub">Complete a learning experience or practice challenge to start building your competency profile.</div>
        <div class="skills-empty-actions">
          <button class="skills-empty-btn primary" id="se-learn">Go to Learning ${icon(ICO_ARROW)}</button>
          <button class="skills-empty-btn" id="se-practice">Go to Practice ${icon(ICO_ARROW)}</button>
        </div>
      </div>
    </div>`);
    _q('#skills-back').addEventListener('click', () => Router.navigate('/today'));
    _q('#se-learn').addEventListener('click', () => Router.navigate('/learning'));
    _q('#se-practice').addEventListener('click', () => Router.navigate('/practice'));
  }

  function destroy() { _container = null; }
  return { render, destroy };
})();
