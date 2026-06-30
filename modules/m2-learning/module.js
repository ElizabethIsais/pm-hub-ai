/**
 * LearningModule — M2
 * Entry: Learn Home → Learning Library (packages) → Experience → Phases
 * Tracks last_active_exp for smart Continue Learning on Home.
 * Data source: COMPETENCY_PACKAGES[n].learn
 */
const LearningModule = (() => {
  let _container = null;
  let _currentTrackId  = null;
  let _currentExpId    = null;
  let _currentPhaseIdx = 0;
  let _phaseState = {};
  let _progress   = {};

  const LETTERS = ['A','B','C','D'];

  // ── Package/track helpers ─────────────────────────────────────────────────
  function _findTrack(trackId) { return COMPETENCY_PACKAGES.find(p => p.learn.id === trackId)?.learn || null; }
  function _findPackage(trackId) { return COMPETENCY_PACKAGES.find(p => p.learn.id === trackId) || null; }

  // ── Progress ─────────────────────────────────────────────────────────────
  async function _loadProgress() {
    try {
      const all = await StorageManager.getAll('learning_progress');
      _progress = {};
      (all || []).forEach(r => { if (r && r.id) _progress[r.id] = r; });
    } catch(e) { _progress = {}; }
  }

  async function _saveExpProgress(expId, data) {
    _progress[expId] = { id: expId, ...data };
    try { await StorageManager.set('learning_progress', { id: expId, ...data }); } catch(e) {}
  }

  function _getExpProgress(expId) { return _progress[expId] || null; }

  function _trackCompleted(trackId) {
    const track = _findTrack(trackId);
    if (!track) return 0;
    const available = track.experiences.filter(e => e.status === 'available');
    const done = available.filter(e => _getExpProgress(e.id)?.completed).length;
    return available.length ? done / available.length : 0;
  }

  async function _saveLastActive(data) {
    try { await StorageManager.setSetting('last_active_exp', data); } catch(e) {}
  }

  // ── DOM helpers ───────────────────────────────────────────────────────────
  function icon(path, cls = 'icon') {
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
  }
  const ICO_BACK  = 'M15 18l-6-6 6-6';
  const ICO_ARROW = 'M5 12h14M12 5l7 7-7 7';
  const ICO_CHECK = 'M20 6L9 17l-5-5';

  function _render(html) { if (_container) _container.innerHTML = html; }
  function _q(sel)  { return _container ? _container.querySelector(sel)  : null; }
  function _qa(sel) { return _container ? Array.from(_container.querySelectorAll(sel)) : []; }

  function _mentorVoice(text) {
    if (!text) return '';
    return `<div class="mentor-voice">
      <span class="mentor-avatar" aria-hidden="true">🎓</span>
      <p class="mentor-text">${text}</p>
    </div>`;
  }

  // ── Phase progress indicator ──────────────────────────────────────────────
  function _buildPhaseProgress(phases, currentIdx) {
    const steps = phases.map((p, i) => {
      const done = i < currentIdx, active = i === currentIdx;
      const cls  = done ? 'done' : active ? 'active' : '';
      const inner = done ? icon(ICO_CHECK, 'icon') : (i + 1);
      const line  = i < phases.length - 1 ? `<div class="phase-step-line${done ? ' done' : ''}"></div>` : '';
      return `<div class="phase-step"><div class="phase-step-circle ${cls}">${inner}</div>${line}</div>`;
    }).join('');
    const labels = phases.map((p, i) => {
      const cls = i < currentIdx ? 'done' : i === currentIdx ? 'active' : '';
      return `<span class="phase-label ${cls}">${p.label}</span>`;
    }).join('');
    return `<div class="phase-progress">${steps}</div><div class="phase-label-row">${labels}</div>`;
  }

  function _wrap(exp, phaseIdx, inner) {
    return `<div class="learn-screen exp-view">
      <button class="learn-back" id="exp-back">${icon(ICO_BACK)} Back to track</button>
      <div class="phase-progress-block">${_buildPhaseProgress(exp.phases, phaseIdx)}</div>
      ${inner}
    </div>`;
  }

  // ── LEARNING LIBRARY (competency packages) ────────────────────────────────
  function _renderLearningLibrary() {
    const cards = COMPETENCY_PACKAGES.map(pkg => {
      const trackId  = pkg.learn.id;
      const ratio    = _trackCompleted(trackId);
      const pct      = Math.round(ratio * 100);
      const totalExp = pkg.learn.experiences.filter(e => e.status === 'available').length;
      const doneExp  = pkg.learn.experiences.filter(e => e.status === 'available' && _getExpProgress(e.id)?.completed).length;
      const progressRow = `
        <div class="track-progress-row">
          <div class="track-progress-bar"><div class="track-progress-fill" style="width:${pct}%"></div></div>
          <span class="track-progress-text">${doneExp}/${totalExp}</span>
        </div>`;
      const badge = `<span class="track-level-badge">${pkg.level}</span>`;
      const ip = pct > 0 && pct < 100 ? ' in-progress' : '';
      return `<button class="track-card${ip}" data-track="${trackId}">
        <div class="track-card-top">
          <div class="track-icon">${pkg.icon}</div>
          <div class="track-meta">
            <div class="track-title">${pkg.name}</div>
            <div class="track-desc">${pkg.description}</div>
            ${badge}
          </div>
        </div>
        ${progressRow}
      </button>`;
    }).join('');

    _render(`<div class="learn-screen">
      <button class="learn-back" id="back-to-learn">${icon(ICO_BACK)} Learn</button>
      <div class="learn-header">
        <div class="learn-eyebrow">Learning Library</div>
        <h1>All Tracks</h1>
        <p>Choose a track to explore. Each one is built around real PM skills.</p>
      </div>
      <div class="track-grid">${cards}</div>
    </div>`);

    _q('#back-to-learn').addEventListener('click', _renderLearningLibrary);
    _qa('.track-card:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        _currentTrackId = btn.dataset.track;
        _renderExperienceList(_currentTrackId);
      });
    });
  }

  // ── EXPERIENCE LIST ───────────────────────────────────────────────────────
  function _renderExperienceList(trackId) {
    const pkg   = _findPackage(trackId);
    const track = pkg?.learn || null;
    if (!track) return _renderLearningLibrary();

    const totalAvail = track.experiences.filter(e => e.status === 'available').length;
    const doneCount  = track.experiences.filter(e => _getExpProgress(e.id)?.completed).length;
    const pct        = totalAvail ? Math.round((doneCount / totalAvail) * 100) : 0;

    const expItems = track.experiences.map((exp, idx) => {
      const prog = _getExpProgress(exp.id);
      const done = prog?.completed;
      const statusEl = done
        ? `<div class="exp-status-circle done">${icon(ICO_CHECK)}</div>`
        : `<div class="exp-status-circle"><span style="font-size:0.65rem;color:var(--text-faint);font-weight:700">${idx+1}</span></div>`;
      const doneLabel = done ? `<span class="exp-status-label review-label">Review</span>` : '';
      return `<button class="exp-item${done ? ' completed' : ''}" data-exp="${exp.id}">
        ${statusEl}
        <div class="exp-item-meta">
          <div class="exp-item-title">${exp.title}${doneLabel}</div>
          <div class="exp-item-objective">${exp.objective}</div>
          <div class="exp-item-duration">⏱ ${exp.duration}</div>
        </div>
        <div class="exp-item-arrow">${icon('M9 18l6-6-6-6')}</div>
      </button>`;
    }).join('');

    _render(`<div class="learn-screen">
      <button class="learn-back" id="back-to-library">${icon(ICO_BACK)} All Learning Tracks</button>
      <div class="track-view-header">
        <div class="track-view-icon">${track.icon}</div>
        <div class="track-view-meta">
          <div class="track-view-title">${pkg.name}</div>
          <div class="track-view-stats">${pkg.level} · ${track.experiences.length} experiences</div>
          <div class="track-view-progress">
            <div class="track-view-progress-fill" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
      <div class="exp-list">${expItems}</div>
    </div>`);

    _q('#back-to-library').addEventListener('click', _renderLearningLibrary);
    _qa('.exp-item').forEach(btn => {
      btn.addEventListener('click', () => _startExperience(trackId, btn.dataset.exp));
    });
  }

  // ── START EXPERIENCE ──────────────────────────────────────────────────────
  async function _startExperience(trackId, expId) {
    const track = _findTrack(trackId);
    const exp   = track?.experiences.find(e => e.id === expId);
    if (!exp || !exp.phases) return;

    _currentTrackId  = trackId;
    _currentExpId    = expId;
    _currentPhaseIdx = 0;
    _phaseState      = {};

    await _saveLastActive({ trackId, expId, phaseIdx: 0 });
    StreakSystem.recordActivity?.();
    _renderPhase(exp, 0);
  }

  // ── RENDER PHASE ─────────────────────────────────────────────────────────
  function _renderPhase(exp, phaseIdx) {
    _currentPhaseIdx = phaseIdx;
    const phase = exp.phases[phaseIdx];
    switch (phase.type) {
      case 'reading':     _renderReading(exp, phase, phaseIdx);     break;
      case 'classify':    _renderClassify(exp, phase, phaseIdx);    break;
      case 'quiz':        _renderQuiz(exp, phase, phaseIdx);        break;
      case 'keyTakeaway': _renderKeyTakeaway(exp, phase, phaseIdx); break;
      default: _advancePhase(exp, phaseIdx);
    }
  }

  async function _advancePhase(exp, fromIdx) {
    const next = fromIdx + 1;
    if (next < exp.phases.length) {
      await _saveLastActive({ trackId: _currentTrackId, expId: _currentExpId, phaseIdx: next });
      _phaseState = {};
      _renderPhase(exp, next);
    } else {
      _completeExperience(exp);
    }
  }

  function _bindBack(exp) {
    _q('#exp-back')?.addEventListener('click', () => _renderExperienceList(_currentTrackId));
  }

  // ── PHASE: READING ────────────────────────────────────────────────────────
  function _renderReading(exp, phase, phaseIdx) {
    if (!_phaseState.reading) _phaseState.reading = { cardIdx: 0 };
    const state = _phaseState.reading;
    const cards = phase.sections || [];
    const total = cards.length;

    function showCard() {
      const c = cards[state.cardIdx];
      const isFirst = state.cardIdx === 0;
      const isLast  = state.cardIdx === total - 1;
      const pct     = Math.round(((state.cardIdx + 1) / total) * 100);
      const mentorHtml = (isFirst && phase.mentorIntro) ? _mentorVoice(phase.mentorIntro) : '';

      _render(_wrap(exp, phaseIdx, `
        ${mentorHtml}
        <div class="reading-card-nav-top">
          <div class="reading-mini-progress"><div class="reading-mini-fill" style="width:${pct}%"></div></div>
          <span class="reading-card-counter">${state.cardIdx + 1} of ${total}</span>
        </div>
        <div class="reading-card">
          <div class="reading-card-heading">${c.heading}</div>
          <div class="reading-card-body">${c.body}</div>
          ${c.explainSimply ? '<button class="explain-simply-btn" id="explain-simply-btn">💡 Explain Simply</button><div class="explain-simply-panel" id="explain-simply-panel" hidden>' + c.explainSimply + '</div>' : ''}
        </div>
        <div class="reading-nav">
          ${!isFirst ? `<button class="reading-prev-btn" id="r-prev">← Back</button>` : '<div></div>'}
          <button class="${isLast ? 'reading-continue-btn' : 'reading-next-btn'}" id="r-next">
            ${isLast ? `Continue ${icon(ICO_ARROW)}` : 'Next →'}
          </button>
        </div>
      `));

      _bindBack(exp);
      _q('#explain-simply-btn')?.addEventListener('click', () => {
        const panel = _q('#explain-simply-panel');
        const btn   = _q('#explain-simply-btn');
        if (panel) {
          const hidden = panel.hasAttribute('hidden');
          hidden ? panel.removeAttribute('hidden') : panel.setAttribute('hidden', '');
          btn.textContent = hidden ? '✕ Close' : '💡 Explain Simply';
        }
      });
      _q('#r-prev')?.addEventListener('click', () => { state.cardIdx--; showCard(); });
      _q('#r-next').addEventListener('click', () => {
        if (isLast) _advancePhase(exp, phaseIdx);
        else { state.cardIdx++; showCard(); }
      });
    }
    showCard();
  }

  // ── PHASE: CLASSIFY ───────────────────────────────────────────────────────
  function _renderClassify(exp, phase, phaseIdx) {
    if (!_phaseState.classify) _phaseState.classify = { idx: 0, results: [], answered: false };
    const state = _phaseState.classify;

    function showCard() {
      if (state.idx >= phase.items.length) { showResults(); return; }
      const item = phase.items[state.idx];
      const pct  = Math.round((state.idx / phase.items.length) * 100);
      const cats = phase.categories.map(c =>
        `<button class="classify-option-btn" data-cat="${c.id}">
          <span class="opt-icon">${c.icon}</span>${c.label}
        </button>`).join('');
      const mentorHtml = (state.idx === 0 && phase.mentorIntro) ? _mentorVoice(phase.mentorIntro) : '';

      _render(_wrap(exp, phaseIdx, `
        ${mentorHtml}
        <div class="classify-header">
          <div class="classify-title">${phase.title}</div>
          <div class="classify-instruction">${phase.instruction}</div>
        </div>
        <div class="classify-progress-row">
          <div class="classify-progress-bar"><div class="classify-progress-fill" style="width:${pct}%"></div></div>
          <span class="classify-progress-text">${state.idx + 1} of ${phase.items.length}</span>
        </div>
        <div class="classify-card">
          <div class="classify-card-label">Scenario ${state.idx + 1}</div>
          <div class="classify-card-text">${item.text}</div>
        </div>
        <div class="classify-options">${cats}</div>
        <div id="classify-feedback"></div>
      `));
      _bindBack(exp);

      _qa('.classify-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (state.answered) return;
          state.answered = true;
          const chosen  = btn.dataset.cat;
          const correct = chosen === item.correct;
          state.results.push({ correct });
          _qa('.classify-option-btn').forEach(b => b.disabled = true);
          btn.classList.add(correct ? 'selected-correct' : 'selected-wrong');
          if (!correct) _qa('.classify-option-btn').forEach(b => { if (b.dataset.cat === item.correct) b.classList.add('other-correct'); });
          const fb = _q('#classify-feedback');
          if (fb) fb.innerHTML = `<div class="classify-feedback ${correct ? 'correct' : 'wrong'}">
            <div class="feedback-verdict">${correct ? '✓ Correct!' : '✗ Not quite.'}</div>
            ${correct ? item.feedbackCorrect : item.feedbackWrong}
          </div>`;
          setTimeout(() => { state.idx++; state.answered = false; showCard(); }, 2200);
        });
      });
    }

    function showResults() {
      const total   = phase.items.length;
      const correct = state.results.filter(r => r.correct).length;
      const ratio   = correct / total;
      const chips   = state.results.map((r, i) =>
        `<div class="classify-result-chip ${r.correct ? 'ok' : 'fail'}">${r.correct ? '✓' : '✗'} ${i+1}</div>`).join('');
      const msg = ratio <= 0.5  ? 'Keep going — this concept will click with practice.'
                : ratio <= 0.75 ? 'Good effort. The concepts section will fill in the gaps.'
                : ratio < 1     ? 'Great instincts. Just a couple to revisit.'
                :                 'Perfect — every scenario landed correctly.';

      _render(_wrap(exp, phaseIdx, `
        <div class="classify-results">
          <div class="classify-results-score">${correct}/${total}</div>
          <div class="classify-results-label">${msg}</div>
          <div class="classify-results-row">${chips}</div>
          ${_mentorVoice('Now let\'s look at the theory behind these scenarios. Everything will make sense.')}
          <button class="phase-continue-btn" id="classify-continue">Read the concepts ${icon(ICO_ARROW)}</button>
        </div>
      `));
      _bindBack(exp);
      _q('#classify-continue').addEventListener('click', () => _advancePhase(exp, phaseIdx));
    }
    showCard();
  }

  // ── PHASE: QUIZ ───────────────────────────────────────────────────────────
  function _renderQuiz(exp, phase, phaseIdx) {
    if (!_phaseState.quiz) _phaseState.quiz = { qIdx: 0, correct: 0, answered: false };
    const state = _phaseState.quiz;

    function showQuestion() {
      if (state.qIdx >= phase.questions.length) { showQuizResults(); return; }
      const q    = phase.questions[state.qIdx];
      const pct  = Math.round((state.qIdx / phase.questions.length) * 100);
      const opts = q.options.map((o, i) =>
        `<button class="quiz-option-btn" data-idx="${i}">
          <span class="opt-letter">${LETTERS[i]}</span><span class="opt-text">${o.text}</span>
        </button>`).join('');
      const mentorHtml = (state.qIdx === 0 && phase.mentorIntro) ? _mentorVoice(phase.mentorIntro) : '';

      _render(_wrap(exp, phaseIdx, `
        ${mentorHtml}
        <div class="quiz-header">
          <div class="quiz-title">${phase.title}</div>
          <div class="quiz-progress-row">
            <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
            <span class="quiz-progress-text">Question ${state.qIdx + 1} of ${phase.questions.length}</span>
          </div>
        </div>
        <div class="quiz-question-card"><div class="quiz-question-text">${q.question}</div></div>
        <div class="quiz-options">${opts}</div>
        <div id="quiz-feedback"></div>
        <div id="quiz-next"></div>
      `));
      _bindBack(exp);

      _qa('.quiz-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (state.answered) return;
          state.answered = true;
          const chosen = parseInt(btn.dataset.idx);
          const opt    = q.options[chosen];
          const isOk   = opt.correct;
          if (isOk) state.correct++;
          _qa('.quiz-option-btn').forEach((b, i) => {
            b.disabled = true;
            if (q.options[i].correct)           b.classList.add('revealed-correct');
            else if (i === chosen && !isOk)     b.classList.add('selected-wrong');
            else                                b.classList.add('neutral-after');
          });
          const fb = _q('#quiz-feedback');
          if (fb) fb.innerHTML = `<div class="quiz-feedback ${isOk ? 'correct-feedback' : 'wrong-feedback'}">${opt.feedback}</div>`;
          const nx = _q('#quiz-next');
          if (nx) {
            const isLast = state.qIdx === phase.questions.length - 1;
            nx.innerHTML = `<button class="quiz-next-btn" id="quiz-next-btn">${isLast ? 'See results' : 'Next question'} ${icon(ICO_ARROW)}</button>`;
            _q('#quiz-next-btn').addEventListener('click', () => { state.qIdx++; state.answered = false; showQuestion(); });
          }
        });
      });
    }

    function showQuizResults() {
      const total   = phase.questions.length;
      const correct = state.correct;
      const pct     = Math.round((correct / total) * 100);
      const msg = pct <= 33 ? 'Review the concepts and try again.' : pct <= 66 ? 'Good progress. A couple of tricky ones in there.' : pct < 100 ? 'Almost perfect. Strong understanding.' : 'Perfect score. Solid understanding.';
      const sub = pct < 100 ? 'The feedback above explains the reasoning — review it before moving on.' : 'You\'re ready for the key takeaway.';
      _render(_wrap(exp, phaseIdx, `
        <div class="quiz-results">
          <div class="quiz-results-score">${correct}/${total}</div>
          <div class="quiz-results-label">${msg}</div>
          <div class="quiz-results-sub">${sub}</div>
          <button class="phase-continue-btn" id="quiz-continue">Continue ${icon(ICO_ARROW)}</button>
        </div>
      `));
      _bindBack(exp);
      _q('#quiz-continue').addEventListener('click', () => _advancePhase(exp, phaseIdx));
    }
    showQuestion();
  }

  // ── PHASE: KEY TAKEAWAY ───────────────────────────────────────────────────
  function _renderKeyTakeaway(exp, phase, phaseIdx) {
    const mentorHtml = phase.mentorNote ? _mentorVoice(phase.mentorNote) : '';
    _render(_wrap(exp, phaseIdx, `
      <div class="keytakeaway-screen">
        <div class="keytakeaway-badge">✨ Key Takeaway</div>
        ${mentorHtml}
        <div class="keytakeaway-card">
          <div class="keytakeaway-label">Remember this</div>
          <div class="keytakeaway-text">${phase.text}</div>
        </div>
        <div class="xp-award">
          <div class="xp-award-number">+${phase.xp} XP</div>
          <div class="xp-award-label">Experience earned</div>
        </div>
        <button class="complete-exp-btn" id="complete-exp-btn">${icon(ICO_CHECK)} Complete experience</button>
      </div>
    `));
    _bindBack(exp);
    _q('#complete-exp-btn').addEventListener('click', () => _completeExperience(exp));
  }

  // ── COMPLETE ──────────────────────────────────────────────────────────────
  async function _completeExperience(exp) {
    await _saveExpProgress(exp.id, { completed: true, completedAt: Date.now() });
    await _saveLastActive({ trackId: _currentTrackId, expId: exp.id, completed: true });
    const xp     = exp.phases.find(p => p.type === 'keyTakeaway')?.xp || 25;
    const phases = exp.phases.length;
    try { XPSystem.award(xp, 'lesson_complete'); } catch(e) {}
    if (exp.competencies) { try { await CompetencySystem.award(exp.competencies); } catch(e) {} }

    const completedPkg = _findPackage(_currentTrackId);
    const pkgName = completedPkg?.name || 'PM';
    _render(`<div class="learn-screen">
      <div class="completion-screen">
        <div class="completion-burst" aria-hidden="true">🎉</div>
        <h2 class="completion-title">You reinforced your ${pkgName} skills!</h2>
        <p class="completion-exp-name">${exp.title}</p>
        <div class="completion-stats">
          <div class="completion-stat">
            <div class="completion-stat-val">+${xp}</div>
            <div class="completion-stat-label">XP earned</div>
          </div>
          <div class="completion-stat">
            <div class="completion-stat-val">${phases}</div>
            <div class="completion-stat-label">phases done</div>
          </div>
        </div>
        ${_mentorVoice('That\'s the foundation. Every PM needs this concept locked in. You\'ve got it.')}
        <button class="phase-continue-btn" id="back-to-track">Back to track ${icon(ICO_ARROW)}</button>
      </div>
    </div>`);
    _q('#back-to-track').addEventListener('click', () => _renderExperienceList(_currentTrackId));
  }

  // ── PUBLIC API ────────────────────────────────────────────────────────────
  async function render(container) {
    _container = container;
    await _loadProgress();

    const intent = StateManager.get('learn_intent', null);
    StateManager.set('learn_intent', null);

    if (intent?.action === 'resume' && intent.trackId && intent.expId) {
      const track = _findTrack(intent.trackId);
      const exp   = track?.experiences.find(e => e.id === intent.expId);
      if (exp?.phases) {
        _currentTrackId  = intent.trackId;
        _currentExpId    = intent.expId;
        _currentPhaseIdx = intent.phaseIdx || 0;
        _phaseState      = {};
        _renderPhase(exp, _currentPhaseIdx);
        return;
      }
    } else if (intent?.action === 'track' && intent.trackId) {
      _currentTrackId = intent.trackId;
      _renderExperienceList(intent.trackId);
      return;
    } else if (intent?.action === 'library') {
      _renderLearningLibrary();
      return;
    }

    _renderLearningLibrary();
  }

  function destroy() { _container = null; }
  return { render, destroy };
})();
