/**
 * CompetencySystem — tracks learner competency scores across all activities.
 * Scores accumulate as learners complete experiences, challenges, and interviews.
 * MAX_PTS per competency: 100 (soft cap — displayed as % progress).
 */
const CompetencySystem = (() => {
  const MAX_PTS = 100;

  const ALL = [
    'Decision Making',
    'Stakeholder Communication',
    'Agile & Scrum',
    'Risk Management',
    'Scope Management',
    'Leadership',
    'Technical Communication',
    'Sprint Planning',
    'Release Management',
    'Negotiation',
    'Product Thinking',
    'AI for Project Managers'
  ];

  let _scores = {}; // { 'Decision Making': 42, ... }

  // ── Init ──────────────────────────────────────────────────────────────────
  async function init() {
    try {
      const stored = await StorageManager.getSetting('competency_scores');
      _scores = stored || {};
    } catch(e) { _scores = {}; }
  }

  // ── Award ─────────────────────────────────────────────────────────────────
  /**
   * @param {Object} competencyMap  e.g. { 'Decision Making': 10, 'Risk Management': 5 }
   */
  async function award(competencyMap) {
    if (!competencyMap) return;
    let changed = false;
    Object.entries(competencyMap).forEach(([name, pts]) => {
      if (!ALL.includes(name)) return;
      const prev = _scores[name] || 0;
      _scores[name] = Math.min(MAX_PTS, prev + pts);
      if (_scores[name] !== prev) changed = true;
    });
    if (changed) {
      try { await StorageManager.setSetting('competency_scores', _scores); } catch(e) {}
      EventBus.emit('competency:updated', { scores: { ..._scores } });
    }
  }

  // ── Queries ───────────────────────────────────────────────────────────────
  function getAll()        { return { ..._scores }; }
  function getScore(name)  { return _scores[name] || 0; }
  function getPct(name)    { return Math.min(100, Math.round(((_scores[name] || 0) / MAX_PTS) * 100)); }
  function hasData()       { return Object.keys(_scores).length > 0; }
  function getCompetencies() { return ALL; }

  /** Returns competencies that have been touched, sorted strongest first */
  function getSorted() {
    return ALL.filter(c => _scores[c] !== undefined)
              .sort((a, b) => (_scores[b] || 0) - (_scores[a] || 0));
  }

  /** Returns n weakest competencies that have been touched */
  function getWeakest(n) {
    const active = ALL.filter(c => _scores[c] !== undefined);
    return active.sort((a, b) => (_scores[a] || 0) - (_scores[b] || 0)).slice(0, n);
  }

  /** Returns n strongest competencies */
  function getStrongest(n) {
    const active = ALL.filter(c => _scores[c] !== undefined);
    return active.sort((a, b) => (_scores[b] || 0) - (_scores[a] || 0)).slice(0, n);
  }

  /**
   * Returns a recommendation based on weakest competency.
   * { label, action: fn }
   */
  function getRecommendation() {
    if (!hasData()) return null;
    const weak = getWeakest(1)[0];
    if (!weak) return null;
    const map = {
      'Decision Making':          { label: 'Practice PM Challenges',         route: '/practice',  intent: 'challenges' },
      'Stakeholder Communication':{ label: 'Study Stakeholder Management',    route: '/learning',  learnIntent: { action: 'track', trackId: 'T3' } },
      'Agile & Scrum':            { label: 'Explore Agile & Scrum track',     route: '/learning',  learnIntent: { action: 'track', trackId: 'T2' } },
      'Risk Management':          { label: 'Study Risk Management track',     route: '/learning',  learnIntent: { action: 'track', trackId: 'T4' } },
      'Scope Management':         { label: 'Review Triple Constraint',        route: '/learning',  learnIntent: { action: 'track', trackId: 'T1' } },
      'Leadership':               { label: 'Behavioral Interview Practice',   route: '/practice',  intent: 'interview' },
      'Technical Communication':  { label: 'TPM Interview Practice',          route: '/practice',  intent: 'interview' },
      'Sprint Planning':          { label: 'Agile Interview Practice',        route: '/practice',  intent: 'interview' },
      'Release Management':       { label: 'Situational Interview Practice',  route: '/practice',  intent: 'interview' },
      'Negotiation':              { label: 'Practice PM Challenges',          route: '/practice',  intent: 'challenges' },
      'Product Thinking':         { label: 'Continue Learning Fundamentals',  route: '/learning',  learnIntent: { action: 'library' } },
      'AI for Project Managers':  { label: 'Study AI for PMs track',         route: '/learning',  learnIntent: { action: 'track', trackId: 'T5' } }
    };
    const rec = map[weak] || { label: 'Continue Learning', route: '/learning', learnIntent: { action: 'library' } };
    return { competency: weak, pct: getPct(weak), ...rec };
  }

  return {
    init, award,
    getAll, getScore, getPct, hasData,
    getSorted, getWeakest, getStrongest,
    getRecommendation, getCompetencies,
    MAX_PTS, ALL
  };
})();
