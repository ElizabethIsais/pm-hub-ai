/**
 * PracticeModule — M3
 * Data source: COMPETENCY_PACKAGES (competency-first single source of truth)
 *
 *   Practice Challenges → develops judgment (scenario → decision → coaching)
 *   Interview Prep      → develops communication (STAR format coaching)
 *   Certification Prep  → tests knowledge (PMP-style MCQ with competency breakdown)
 */
const PracticeModule = (() => {
  let _container = null;
  let _challengeResults = {};

  // Derived flat arrays from COMPETENCY_PACKAGES
  const _allChallenges = () => COMPETENCY_PACKAGES.flatMap(p => p.practice);
  const _allInterviews = () => COMPETENCY_PACKAGES.flatMap(p => p.interview);

  const LETTERS = ['A', 'B', 'C', 'D'];

  // ── DOM helpers ───────────────────────────────────────────────────────────
  function icon(path, cls = 'icon') {
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
  }
  const ICO_BACK  = 'M15 18l-6-6 6-6';
  const ICO_ARROW = 'M5 12h14M12 5l7 7-7 7';
  const ICO_CHECK = 'M20 6L9 17l-5-5';

  function _render(html) { if (_container) _container.innerHTML = html; }
  function _q(sel)  { return _container ? _container.querySelector(sel) : null; }
  function _qa(sel) { return _container ? Array.from(_container.querySelectorAll(sel)) : []; }

  // ── Project context block ─────────────────────────────────────────────────
  function _contextBlock(ctx) {
    if (!ctx) return '';
    return `<div class="project-ctx-block">
      <div class="ctx-row"><span class="ctx-label">Project</span><span class="ctx-value">${ctx.project}</span></div>
      <div class="ctx-row"><span class="ctx-label">Status</span><span class="ctx-value">${ctx.status}</span></div>
      <div class="ctx-row"><span class="ctx-label">Priority</span><span class="ctx-value ctx-priority">${ctx.priority}</span></div>
      <div class="ctx-row"><span class="ctx-label">Team</span><span class="ctx-value">${ctx.team}</span></div>
    </div>`;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PRACTICE HOME
  // ════════════════════════════════════════════════════════════════════════════
  function _renderPracticeHome() {
    const challenges = _allChallenges();
    const interviews = _allInterviews();
    const doneCount = Object.keys(_challengeResults).length;
    const total = challenges.length;
    const pct = Math.round((doneCount / total) * 100);

    _render(`<div class="practice-screen">
      <div class="practice-header">
        <div class="practice-eyebrow">PM Hub AI</div>
        <h1>Practice</h1>
        <p>Develop your judgment through realistic Technical PM scenarios.</p>
      </div>
      <div class="practice-home-grid">
        <button class="practice-home-card primary" id="ph-challenges">
          <div class="ph-card-left">
            <div class="ph-card-icon">⚡</div>
            <div class="ph-card-body">
              <div class="ph-card-title">Practice Challenges</div>
              <div class="ph-card-sub">${total} IT/TPM decision scenarios</div>
              <div class="ph-progress-row">
                <div class="ph-progress-bar"><div class="ph-progress-fill" style="width:${pct}%"></div></div>
                <span class="ph-progress-text">${doneCount}/${total} done</span>
              </div>
            </div>
          </div>
          <div class="ph-card-arrow">→</div>
        </button>
        <button class="practice-home-card interview-card" id="ph-interview">
          <div class="ph-card-left">
            <div class="ph-card-icon">🎤</div>
            <div class="ph-card-body">
              <div class="ph-card-title">Interview Preparation</div>
              <div class="ph-card-sub">${interviews.length} questions · organized by competency</div>
            </div>
          </div>
          <div class="ph-card-arrow">→</div>
        </button>
        <button class="practice-home-card cert-card" id="ph-cert">
          <div class="ph-card-left">
            <div class="ph-card-icon">📋</div>
            <div class="ph-card-body">
              <div class="ph-card-title">Certification Prep</div>
              <div class="ph-card-sub">${CERT_QUESTIONS.length} PMP-style practice questions · Pass threshold: 70%</div>
            </div>
          </div>
          <div class="ph-card-arrow">→</div>
        </button>
      </div>
    </div>`);

    _q('#ph-challenges').addEventListener('click', _renderChallenges);
    _q('#ph-interview').addEventListener('click', () => _renderInterviewHome());
    _q('#ph-cert').addEventListener('click', _renderCertificationHome);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PRACTICE CHALLENGES
  // ════════════════════════════════════════════════════════════════════════════
  function _renderChallenges() {
    const items = _allChallenges().map((ch, i) => {
      const done = _challengeResults[ch.id];
      const statusEl = done
        ? `<div class="ch-status done">${icon(ICO_CHECK)}</div>`
        : `<div class="ch-status"><span>${i + 1}</span></div>`;
      const doneBadge = done ? `<span class="ch-badge done-badge">Done</span>` : '';
      const diffCls = ch.difficulty === 'Advanced' ? 'diff-advanced' : 'diff-intermediate';
      const tags = ch.tags.map(t => `<span class="ch-tag">${t}</span>`).join('');
      return `<button class="ch-item" data-idx="${i}">
        ${statusEl}
        <div class="ch-item-meta">
          <div class="ch-item-title">${ch.title} ${doneBadge}</div>
          <div class="ch-item-tags"><span class="ch-difficulty ${diffCls}">${ch.difficulty}</span>${tags}</div>
        </div>
        <div class="ch-item-arrow">${icon('M9 18l6-6-6-6')}</div>
      </button>`;
    }).join('');

    _render(`<div class="practice-screen">
      <button class="practice-back" id="back-to-practice">${icon(ICO_BACK)} Practice</button>
      <div class="practice-header">
        <div class="practice-eyebrow">Practice · Challenges</div>
        <h1>PM Scenarios</h1>
        <p>Read the situation. Choose the best TPM response. Reflect on the coaching.</p>
      </div>
      <div class="ch-list">${items}</div>
    </div>`);

    _q('#back-to-practice').addEventListener('click', _renderPracticeHome);
    _qa('.ch-item').forEach(btn => {
      btn.addEventListener('click', () => _renderChallenge(parseInt(btn.dataset.idx)));
    });
  }

  function _renderChallenge(idx) {
    const challenges = _allChallenges();
    const ch = challenges[idx];
    const total = challenges.length;
    const pct = Math.round(((idx + 1) / total) * 100);
    const opts = ch.options.map((o, i) =>
      `<button class="ch-option" data-idx="${i}">
        <span class="ch-opt-letter">${LETTERS[i]}</span>
        <span class="ch-opt-text">${o.text}</span>
      </button>`).join('');

    _render(`<div class="practice-screen">
      <button class="practice-back" id="back-to-list">${icon(ICO_BACK)} All challenges</button>
      <div class="ch-mini-progress-row">
        <div class="ch-mini-bar"><div class="ch-mini-fill" style="width:${pct}%"></div></div>
        <span class="ch-mini-text">${idx + 1} of ${total}</span>
      </div>
      ${_contextBlock(ch.projectContext)}
      <div class="ch-scenario-card">
        <div class="ch-scenario-label">Situation</div>
        <div class="ch-scenario-title">${ch.title}</div>
        <p class="ch-scenario-context">${ch.context}</p>
        <div class="ch-scenario-question">${ch.question}</div>
      </div>
      <div class="ch-options" id="ch-options">${opts}</div>
      <div id="ch-feedback"></div>
      <div id="ch-next"></div>
    </div>`);

    _q('#back-to-list').addEventListener('click', _renderChallenges);

    let answered = false;
    _qa('.ch-option').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (answered) return;
        answered = true;
        const chosen = parseInt(btn.dataset.idx);
        const opt = ch.options[chosen];
        const isOk = opt.correct;

        _challengeResults[ch.id] = { correct: isOk };

        // Award competencies on any engagement with the challenge
        if (ch.competencies) {
          try { await CompetencySystem.award(ch.competencies); } catch(e) {}
        }

        _qa('.ch-option').forEach((b, i) => {
          b.disabled = true;
          if (ch.options[i].correct)      b.classList.add('ch-opt-correct');
          else if (i === chosen && !isOk) b.classList.add('ch-opt-wrong');
          else                            b.classList.add('ch-opt-neutral');
        });

        const fb = _q('#ch-feedback');
        if (fb) fb.innerHTML = `
          <div class="ch-feedback ${isOk ? 'ch-feedback-ok' : 'ch-feedback-fail'}">
            <div class="ch-feedback-verdict">${isOk ? '✓ Good call.' : '✗ Not the best move.'}</div>
            <p class="ch-feedback-text">${opt.feedback}</p>
            <div class="ch-mentor-comment">
              <span class="ch-mentor-avatar">🎓</span>
              <span class="ch-mentor-text">${opt.mentorComment}</span>
            </div>
          </div>`;

        const nx = _q('#ch-next');
        if (nx) {
          const hasNext = idx + 1 < challenges.length;
          if (hasNext) {
            nx.innerHTML = `<button class="ch-next-btn" id="ch-next-btn">Next scenario ${icon(ICO_ARROW)}</button>`;
            _q('#ch-next-btn').addEventListener('click', () => _renderChallenge(idx + 1));
          } else {
            nx.innerHTML = `<button class="ch-next-btn" id="ch-done-btn">${icon(ICO_CHECK)} See results</button>`;
            _q('#ch-done-btn').addEventListener('click', _renderChallengeResults);
          }
        }
      });
    });
  }

  function _renderChallengeResults() {
    const challenges = _allChallenges();
    const total = challenges.length;
    const done  = Object.keys(_challengeResults).length;
    const correct = Object.values(_challengeResults).filter(r => r.correct).length;
    const pct = done ? Math.round((correct / done) * 100) : 0;
    const msg = pct < 50  ? 'Keep practicing — judgment develops over time.'
              : pct < 75  ? 'Good instincts. Review the coaching on the ones you missed.'
              : pct < 100 ? 'Strong PM thinking. Nearly there.'
              :              'Outstanding — every scenario handled correctly.';

    const allSkills = {};
    challenges.forEach(ch => {
      if (_challengeResults[ch.id]) {
        (ch.skills || []).forEach(s => { allSkills[s] = (allSkills[s] || 0) + 1; });
      }
    });
    const skillChips = Object.keys(allSkills).map(s =>
      `<span class="skill-chip">${icon(ICO_CHECK, 'icon skill-chip-icon')} ${s}</span>`).join('');

    _render(`<div class="practice-screen">
      <div class="ch-results-screen">
        <div class="ch-results-burst">🎯</div>
        <h2 class="ch-results-title">Session complete</h2>
        <div class="ch-results-score">${correct}/${done}</div>
        <p class="ch-results-msg">${msg}</p>
        <div class="skills-block results-skills">
          <div class="skills-heading">Skills strengthened today</div>
          <div class="skills-chips">${skillChips}</div>
        </div>
        <div class="ch-results-actions">
          <button class="ch-retry-btn" id="ch-retry">Practice again</button>
          <button class="ch-home-btn" id="ch-home">Back to Practice ${icon(ICO_ARROW)}</button>
        </div>
      </div>
    </div>`);

    _q('#ch-retry').addEventListener('click', () => { _challengeResults = {}; _renderChallenges(); });

    _q('#ch-home').addEventListener('click', _renderPracticeHome);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // INTERVIEW PREPARATION  (competency-package organized, STAR format)
  // ════════════════════════════════════════════════════════════════════════════
  function _renderInterviewHome() {
    const pkgCards = COMPETENCY_PACKAGES.map(pkg => {
      const count = pkg.interview.length;
      return `<button class="int-cat-card" data-pkg="${pkg.id}">
        <div class="int-cat-icon">${pkg.icon}</div>
        <div class="int-cat-body">
          <div class="int-cat-title">${pkg.name}</div>
          <div class="int-cat-sub">${pkg.description}</div>
          <div class="int-cat-count">${count} question${count !== 1 ? 's' : ''}</div>
        </div>
        <div class="int-cat-arrow">→</div>
      </button>`;
    }).join('');

    _render(`<div class="practice-screen">
      <button class="practice-back" id="back-to-practice">${icon(ICO_BACK)} Practice</button>
      <div class="practice-header">
        <div class="practice-eyebrow">Practice · Interview</div>
        <h1>Interview Prep</h1>
        <p>Practice like it's real. Formulate your answer, then see what strong responses look like.</p>
      </div>
      <div class="int-coaching-note">
        <span class="int-note-icon">💡</span>
        <span>Think through your answer first — then reveal the STAR coaching. The reflection is where the learning happens.</span>
      </div>
      <div class="int-cat-grid">${pkgCards}</div>
    </div>`);

    _q('#back-to-practice').addEventListener('click', _renderPracticeHome);
    _qa('.int-cat-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const pkg = COMPETENCY_PACKAGES.find(p => p.id === btn.dataset.pkg);
        if (pkg) _renderInterviewSession(pkg, 0);
      });
    });
  }

  function _renderInterviewSession(pkg, idx) {
    const questions = pkg.interview;
    if (idx >= questions.length) {
      _renderInterviewComplete(pkg);
      return;
    }
    const q = questions[idx];
    const pct = Math.round(((idx + 1) / questions.length) * 100);

    _render(`<div class="practice-screen">
      <button class="practice-back" id="int-back">${icon(ICO_BACK)} ${pkg.name}</button>
      <div class="int-progress-row">
        <div class="int-progress-bar"><div class="int-progress-fill" style="width:${pct}%"></div></div>
        <span class="int-progress-text">Question ${idx + 1} of ${questions.length}</span>
      </div>
      <div class="int-question-card">
        <div class="int-question-label">Interview Question · ${pkg.name}</div>
        <div class="int-question-text">${q.question}</div>
        <div class="int-question-meta">
          <span class="ch-difficulty diff-${q.difficulty === 'Advanced' ? 'advanced' : 'intermediate'}">${q.difficulty}</span>
        </div>
      </div>
      <div class="int-think-block">
        <div class="int-think-label"><span class="int-think-icon">💭</span> Your answer</div>
        <textarea class="int-answer-area" id="int-answer" placeholder="${q.context}" rows="5"></textarea>
        <div class="int-think-hint">Write or think through your answer — then reveal the STAR coaching below.</div>
      </div>
      <button class="int-reveal-btn" id="int-reveal">See coaching ${icon(ICO_ARROW)}</button>
      <div id="int-coaching" class="int-coaching-panel hidden"></div>
      <div id="int-next"></div>
    </div>`);

    _q('#int-back').addEventListener('click', () => _renderInterviewHome());

    _q('#int-reveal').addEventListener('click', () => {
      _q('#int-reveal').style.display = 'none';
      const panel = _q('#int-coaching');
      panel.classList.remove('hidden');
      const s = q.star;

      panel.innerHTML = `
        <div class="int-star-panel">
          <div class="int-star-heading">⭐ STAR Response Framework</div>
          <div class="int-star-block">
            <div class="int-star-label">S — Situation</div>
            <div class="int-star-text">${s.situation}</div>
          </div>
          <div class="int-star-block">
            <div class="int-star-label">T — Task</div>
            <div class="int-star-text">${s.task}</div>
          </div>
          <div class="int-star-block">
            <div class="int-star-label">A — Action</div>
            <div class="int-star-text">${s.action}</div>
          </div>
          <div class="int-star-block">
            <div class="int-star-label">R — Result</div>
            <div class="int-star-text">${s.result}</div>
          </div>
          <div class="int-key-message">
            <div class="int-star-label">💡 Key Message</div>
            <div class="int-star-text">${s.keyMessage}</div>
          </div>
        </div>
        <div class="int-evaluator">
          <div class="int-section-label">🔍 What the interviewer is evaluating</div>
          <p class="int-section-body">${q.evaluatorFocus}</p>
        </div>`;

      const nx = _q('#int-next');
      if (nx) {
        const isLast = idx === questions.length - 1;
        nx.innerHTML = isLast
          ? `<button class="ch-next-btn" id="int-next-btn">${icon(ICO_CHECK)} Finish session</button>`
          : `<button class="ch-next-btn" id="int-next-btn">Next question ${icon(ICO_ARROW)}</button>`;
        _q('#int-next-btn').addEventListener('click', () => _renderInterviewSession(pkg, idx + 1));
      }

      setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    });
  }

  async function _renderInterviewComplete(pkg) {
    if (pkg.competencies) { try { await CompetencySystem.award(pkg.competencies); } catch(e) {} }

    const compChips = Object.keys(pkg.competencies || {}).map(c =>
      `<span class="skill-chip">${icon(ICO_CHECK, 'icon skill-chip-icon')} ${c}</span>`).join('');

    _render(`<div class="practice-screen">
      <div class="ch-results-screen">
        <div class="ch-results-burst">🎤</div>
        <h2 class="ch-results-title">You reinforced your ${pkg.name} skills!</h2>
        <p class="ch-results-msg">You've worked through every question in this package. Revisit in a few days — the goal is to internalize the thinking patterns, not memorize the answers.</p>
        <div class="skills-block results-skills">
          <div class="skills-heading">Competencies reinforced</div>
          <div class="skills-chips">${compChips}</div>
        </div>
        <div class="ch-results-actions">
          <button class="ch-retry-btn" id="int-retry">Practice again</button>
          <button class="ch-home-btn" id="int-home">Back to Interview Prep ${icon(ICO_ARROW)}</button>
        </div>
      </div>
    </div>`);

    _q('#int-retry').addEventListener('click', () => _renderInterviewSession(pkg, 0));
    _q('#int-home').addEventListener('click', _renderInterviewHome);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CERTIFICATION PREP
  // ════════════════════════════════════════════════════════════════════════════
  const PASS_THRESHOLD = 0.7; // 70%

  function _renderCertificationHome() {
    const total = (typeof CERT_QUESTIONS !== 'undefined') ? CERT_QUESTIONS.length : 0;
    const domains = [...new Set((CERT_QUESTIONS || []).map(q => q.domain))];
    const domainList = domains.map(d => `<span class="cert-domain-tag">${d}</span>`).join('');

    _render(`<div class="practice-screen">
      <button class="practice-back" id="back-to-practice">${icon(ICO_BACK)} Practice</button>
      <div class="practice-header">
        <div class="practice-eyebrow">Practice · Certification</div>
        <h1>Certification Prep</h1>
        <p>PMP-style multiple choice questions. Aim for 70% or above to pass.</p>
      </div>
      <div class="cert-info-card">
        <div class="cert-info-row">
          <div class="cert-info-stat"><div class="cert-info-val">${total}</div><div class="cert-info-label">Questions</div></div>
          <div class="cert-info-stat"><div class="cert-info-val">70%</div><div class="cert-info-label">Pass threshold</div></div>
          <div class="cert-info-stat"><div class="cert-info-val">~12 min</div><div class="cert-info-label">Estimated time</div></div>
        </div>
        <div class="cert-domains">
          <div class="cert-domains-label">Knowledge areas covered</div>
          <div class="cert-domains-list">${domainList}</div>
        </div>
      </div>
      <div class="int-coaching-note">
        <span class="int-note-icon">💡</span>
        <span>Each question includes a full explanation — understanding the reasoning matters more than memorizing answers.</span>
      </div>
      <button class="cert-start-btn" id="cert-start">Start practice exam ${icon(ICO_ARROW)}</button>
    </div>`);

    _q('#back-to-practice').addEventListener('click', _renderPracticeHome);
    _q('#cert-start').addEventListener('click', () => _renderCertQuestion(0, []));
  }

  function _renderCertQuestion(idx, results) {
    const questions = CERT_QUESTIONS || [];
    if (idx >= questions.length) {
      _renderCertResults(results);
      return;
    }

    const q = questions[idx];
    const pct = Math.round(((idx + 1) / questions.length) * 100);
    const opts = q.options.map((o, i) =>
      `<button class="cert-option" data-idx="${i}">
        <span class="ch-opt-letter">${LETTERS[i]}</span>
        <span class="ch-opt-text">${o.text}</span>
      </button>`).join('');

    _render(`<div class="practice-screen">
      <button class="practice-back" id="cert-back">${icon(ICO_BACK)} Certification Prep</button>
      <div class="cert-header-row">
        <div class="cert-domain-pill">${q.domain}</div>
        <span class="int-progress-text">Question ${idx + 1} of ${questions.length}</span>
      </div>
      <div class="int-progress-row">
        <div class="int-progress-bar"><div class="int-progress-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="int-question-card">
        <div class="int-question-text">${q.question}</div>
      </div>
      <div class="ch-options" id="cert-options">${opts}</div>
      <div id="cert-feedback"></div>
      <div id="cert-next"></div>
    </div>`);

    _q('#cert-back').addEventListener('click', _renderCertificationHome);

    let answered = false;
    _qa('.cert-option').forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const chosen = parseInt(btn.dataset.idx);
        const opt = q.options[chosen];
        const isOk = opt.correct;

        _qa('.cert-option').forEach((b, i) => {
          b.disabled = true;
          if (q.options[i].correct)      b.classList.add('ch-opt-correct');
          else if (i === chosen && !isOk) b.classList.add('ch-opt-wrong');
          else                            b.classList.add('ch-opt-neutral');
        });

        const fb = _q('#cert-feedback');
        if (fb) fb.innerHTML = `
          <div class="ch-feedback ${isOk ? 'ch-feedback-ok' : 'ch-feedback-fail'}">
            <div class="ch-feedback-verdict">${isOk ? '✓ Correct.' : '✗ Incorrect.'}</div>
            <p class="ch-feedback-text">${opt.explanation}</p>
          </div>`;

        const newResults = [...results, { correct: isOk, domain: q.domain, packageId: q.packageId }];
        const nx = _q('#cert-next');
        if (nx) {
          const isLast = idx === questions.length - 1;
          nx.innerHTML = isLast
            ? `<button class="ch-next-btn" id="cert-next-btn">${icon(ICO_CHECK)} See results</button>`
            : `<button class="ch-next-btn" id="cert-next-btn">Next question ${icon(ICO_ARROW)}</button>`;
          _q('#cert-next-btn').addEventListener('click', () => _renderCertQuestion(idx + 1, newResults));
        }
      });
    });
  }

  async function _renderCertResults(results) {
    const total   = results.length;
    const correct = results.filter(r => r.correct).length;
    const pct     = total ? correct / total : 0;
    const passed  = pct >= PASS_THRESHOLD;
    const pctDisplay = Math.round(pct * 100);

    // Award competencies from each package based on correct answers
    if (passed) {
      const compMap = {};
      COMPETENCY_PACKAGES.forEach(pkg => {
        Object.entries(pkg.competencies).forEach(([comp, pts]) => {
          compMap[comp] = (compMap[comp] || 0) + Math.round(pts * 0.6);
        });
      });
      try { await CompetencySystem.award(compMap); } catch(e) {}
    } else {
      try { await CompetencySystem.award({ 'Decision Making': 4, 'Product Thinking': 4 }); } catch(e) {}
    }

    // Competency package breakdown using packageId
    const byPkg = {};
    results.forEach(r => {
      const pkgId = r.packageId || 'PKG-FUNDAMENTALS';
      if (!byPkg[pkgId]) byPkg[pkgId] = { total: 0, correct: 0 };
      byPkg[pkgId].total++;
      if (r.correct) byPkg[pkgId].correct++;
    });
    const pkgNames = {};
    const pkgIcons = {};
    COMPETENCY_PACKAGES.forEach(p => { pkgNames[p.id] = p.name; pkgIcons[p.id] = p.icon; });
    const domainRows = Object.entries(byPkg).map(([pkgId, s]) =>
      `<div class="cert-domain-row">
        <span class="cert-domain-name">${pkgIcons[pkgId] || ''} ${pkgNames[pkgId] || pkgId}</span>
        <span class="cert-domain-score ${s.correct === s.total ? 'perfect' : s.correct === 0 ? 'zero' : ''}">${s.correct}/${s.total}</span>
      </div>`).join('');

    _render(`<div class="practice-screen">
      <div class="ch-results-screen">
        <div class="ch-results-burst">${passed ? '🏆' : '📚'}</div>
        <h2 class="ch-results-title">${passed ? 'Passed!' : 'Keep studying'}</h2>
        <div class="cert-score-ring ${passed ? 'pass' : 'fail'}">
          <div class="cert-score-pct">${pctDisplay}%</div>
          <div class="cert-score-sub">${correct} of ${total} correct</div>
        </div>
        <p class="ch-results-msg">${passed
          ? 'Strong result. You\'ve demonstrated solid PM knowledge across multiple domains.'
          : `You need 70% to pass — you scored ${pctDisplay}%. Review the domains where you missed questions and try again.`
        }</p>
        <div class="cert-domain-breakdown">
          <div class="cert-breakdown-title">Score by competency</div>
          ${domainRows}
        </div>
        <div class="ch-results-actions">
          <button class="ch-retry-btn" id="cert-retry">Try again</button>
          <button class="ch-home-btn" id="cert-home">Back to Practice ${icon(ICO_ARROW)}</button>
        </div>
      </div>
    </div>`);

    _q('#cert-retry').addEventListener('click', () => _renderCertQuestion(0, []));
    _q('#cert-home').addEventListener('click', _renderPracticeHome);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ════════════════════════════════════════════════════════════════════════════
  function render(container) {
    _container = container;
    const intent = StateManager.get('practice_intent', null);
    StateManager.set('practice_intent', null);

    if (intent === 'challenges')    { _renderChallenges();       return; }
    if (intent === 'interview')     { _renderInterviewHome();    return; }
    if (intent === 'certification') { _renderCertificationHome(); return; }
    _renderPracticeHome();
  }

  function destroy() { _container = null; }
  return { render, destroy };
})();
