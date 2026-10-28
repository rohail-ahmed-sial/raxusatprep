/* RAXUSATPrep — mock centre, exam screen, results and review. */
(function () {
  'use strict';
  var RAX = window.RAX, U = RAX.util, S = RAX.store, B = RAX.bank, E = RAX.engine, UI = RAX.ui, I = RAX.icon, esc = U.esc, V = RAX.views = RAX.views || {};
  var M = RAX.mocks = {};

  function shortageTable(built) {
    return '<div class="table-wrap"><table class="t"><thead><tr><th>Part</th><th class="n">Needed</th><th class="n">In the bank</th><th class="n">Short by</th></tr></thead><tbody>' +
      built.shortages.map(function (p) { return '<tr><td>' + esc(p.name) + '</td><td class="n">' + p.need + '</td><td class="n">' + p.have + '</td><td class="n"><b>' + (p.need - p.have) + '</b></td></tr>'; }).join('') + '</tbody></table></div>';
  }
  /** Build and start a test; asks before starting a partial test. */
  M.begin = function (spec) {
    var files = spec.category ? B.filesForCategory(spec.category) : B.allFiles();
    return B.load(files).then(function () {
      var am = E.activeMock();
      if (am) { U.toast('Finish or submit your current test first.', 'stopwatch'); location.hash = '#/exam/' + am.id; return; }
      var built = E.buildTest(spec);
      if (!built.items.length) { U.modal('<h2>Not enough questions</h2><p class="muted">The bank has no verified questions for this test yet.</p><div class="btn-row" style="justify-content:flex-end"><button class="btn" data-close>Close</button></div>'); return; }
      var go = function (partial) {
        var m = E.startMock(built, Object.assign({}, spec, { partial: partial }));
        location.hash = '#/exam/' + m.id;
      };
      if (built.ok) return confirmStart(built, spec, function () { go(false); });
      var md = U.modal('<h2>Some questions are missing</h2><p class="ink2">A complete test needs <b>' + built.need + '</b> questions; the verified bank has <b>' + built.have + '</b> for this pattern. Here is exactly what is short:</p>' + shortageTable(built) +
        '<p class="muted small" style="margin-top:12px">You can take a <b>partial practice test</b> with the ' + built.have + ' available questions in ' + built.minutes + ' minutes (time scaled to 100 minutes per 75 questions). Partial tests are marked as such in your history.</p>' +
        '<div class="btn-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="goPartial">Start partial practice test</button></div>', { wide: true, label: 'Shortage' });
      U.$('#goPartial', md.el).onclick = function () { md.close(); go(true); };
    });
  };
  function confirmStart(built, spec, go) {
    var md = U.modal('<h2>' + esc(built.title) + '</h2><ul class="facts"><li>' + I('list-check') + '<span><b class="num">' + built.items.length + '</b> questions</span></li><li>' + I('clock') + '<span><b class="num">' + built.minutes + '</b> minutes — the timer keeps running if you close the tab</span></li>' +
      '<li>' + I('eye-slash') + '<span>No answers or hints until you submit</span></li><li>' + I('floppy-disk') + '<span>Answers are saved as you go</span></li>' +
      (E.negativeSetting() ? '<li>' + I('triangle-exclamation') + '<span>Negative marking: −' + E.negativeSetting() + ' per wrong answer</span></li>' : '<li>' + I('circle-info') + '<span>No negative marking (change in Settings)</span></li>') + '</ul>' +
      '<p class="small muted">Keys: <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> to answer, <kbd>←</kbd> <kbd>→</kbd> to move, <kbd>F</kbd> to flag.</p>' +
      '<div class="btn-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Not now</button><button class="btn btn-amber" id="goStart">' + I('play') + ' Start test</button></div>', { label: 'Start test' });
    U.$('#goStart', md.el).onclick = function () { md.close(); go(); };
  }

  // ───────── mock centre ─────────
  V.mocks = function (root) {
    var cat = RAX.state.settings.category, am = E.activeMock(), cfg = RAX.config.partI;
    var full = cat ? E.buildTest({ category: cat, type: 'full', seed: 'probe' }) : null;
    var done = E.doneMocks().reverse();
    var h = UI.head('Mock centre', 'Timed tests built from verified questions only, following the USAT pattern for ' + esc(cat || 'your category') + '.');
    if (am) h += '<div class="active-test sheet">' + I('stopwatch') + '<div><b>' + esc(am.title) + '</b><span class="muted small num">' + Object.keys(am.answers).length + ' of ' + am.items.length + ' answered · ' + U.fmtClock(am.endTime - Date.now()) + ' left</span></div><a class="btn btn-amber" href="#/exam/' + am.id + '">Continue test</a></div>';
    if (!cat) h += '<div class="sheet nocat">' + I('circle-info') + '<p><a href="#/start">Choose your category</a> to take full mocks. Section and subject tests work without one.</p></div>';
    else {
      h += '<section class="sheet full-mock"><div class="fm-main"><span class="mode-icon amber big">' + I('trophy') + '</span><div><h2>Full mock — ' + esc(cat) + '</h2><p class="muted">Part I pattern: ' + cfg.sections.map(function (s) { return s.count + ' ' + s.short; }).join(' + ') + ' = ' + cfg.totalQuestions + ' MCQs in ' + cfg.minutes + ' minutes.</p>';
      if (full.ok) h += '<div class="btn-row"><button class="btn btn-amber btn-lg" data-begin="full">' + I('play') + ' Start full mock</button><button class="btn" data-begin="combined">' + I('layer-group') + ' Full simulation with essays (140 min)</button></div>';
      else h += '<p><span class="chip chip-warn">' + I('triangle-exclamation') + ' ' + (full.need - full.have) + ' questions short</span> The bank does not yet have every subject for ' + esc(cat) + '.</p>' + shortageTable(full) +
        '<div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" data-begin="full">Start partial practice test (' + full.have + ' questions · ' + full.minutes + ' min)</button></div>';
      h += '</div></div></section>';
    }
    h += '<h2 class="sec-h">Section tests</h2><div class="grid cols-3">' + cfg.sections.map(function (s) {
      var probe = (s.id !== 'subject' || cat) ? E.buildTest({ category: cat, type: 'section', section: s.id, seed: 'probe' }) : null;
      return '<section class="sheet mode-card"><span class="mode-icon">' + I(s.id === 'verbal' ? 'spell-check' : s.id === 'quantitative' ? 'calculator' : 'flask') + '</span><h3>' + esc(s.name) + '</h3><p class="muted small num">' + s.count + ' questions · ' + s.minutes + ' minutes</p>' +
        (probe ? (probe.ok ? '<button class="btn btn-primary" data-begin="section" data-sec="' + s.id + '">Start</button>' : '<p class="small"><span class="chip chip-warn">Short by ' + (probe.need - probe.have) + '</span></p><button class="btn" data-begin="section" data-sec="' + s.id + '">Partial test (' + probe.have + ')</button>') : '<p class="small muted">Choose a category first.</p>') + '</section>';
    }).join('') + '</div>';
    var subs = ['Verbal Reasoning', 'Quantitative Reasoning'].concat(Object.keys(RAX.config.subjectFiles).filter(function (s) { return ['Verbal Reasoning', 'Quantitative Reasoning'].indexOf(s) < 0; }));
    h += '<h2 class="sec-h">Subject tests</h2><section class="sheet"><form class="subj-test" id="subjForm"><div class="field"><label for="stSub">Subject</label><select id="stSub" class="select">' + subs.map(function (s) {
      var m = RAX.bankManifest.sets[RAX.config.subjectFiles[s]]; return '<option value="' + esc(s) + '">' + esc(s) + ' (' + U.fmtNum(m.verified) + ' verified)</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="stN">Questions</label><select id="stN" class="select"><option>10</option><option selected>20</option><option>30</option><option>50</option></select></div><button class="btn btn-primary" type="submit">' + I('play') + ' Start</button></form>' +
      '<p class="small muted">Time is scaled from the real paper: 100 minutes per 75 questions. For a single topic, use <a href="#/explore">Topic explorer</a> → Test.</p></section>';
    h += '<h2 class="sec-h">History</h2>';
    if (done.length) {
      var chartPts = done.slice(0, 10).reverse().map(function (m) { return { label: U.fmtDate(m.submitted) + ' · ' + m.title, v: m.result.percent }; });
      h += '<section class="sheet">' + UI.line(chartPts, { max: 100, unit: '%', label: 'Test scores over time' }) + '<div class="table-wrap"><table class="t"><thead><tr><th>Date</th><th>Test</th><th class="n">Score</th><th class="n">%</th><th class="n">Time</th></tr></thead><tbody>' +
        done.map(function (m) { return '<tr><td>' + esc(U.fmtDate(m.submitted)) + '</td><td><a href="#/result/' + m.id + '">' + esc(m.title) + '</a>' + (m.partial ? ' <span class="chip chip-warn">Partial</span>' : '') + '</td><td class="n">' + m.result.correct + '/' + m.result.total + '</td><td class="n">' + m.result.percent + '%</td><td class="n">' + U.fmtDur(m.submitted - m.started) + '</td></tr>'; }).join('') +
        '</tbody></table></div></section>';
    } else h += UI.empty('stopwatch', 'No tests yet', 'Your finished tests, scores and reviews will be listed here.');
    root.innerHTML = h;
    root.onclick = function (e) {
      var b = e.target.closest('[data-begin]'); if (!b) return;
      var t = b.getAttribute('data-begin');
      if (t === 'full') M.begin({ category: cat, type: 'full' });
      else if (t === 'combined') M.begin({ category: cat, type: 'full', combined: true });
      else if (t === 'section') M.begin({ category: cat, type: 'section', section: b.getAttribute('data-sec') });
    };
    U.$('#subjForm').onsubmit = function (e) { e.preventDefault(); var n = +U.$('#stN').value; M.begin({ category: cat, type: 'subject', subject: U.$('#stSub').value, count: n }); };
  };

  // ───────── exam screen ─────────
  V.exam = function (root, params) {
    var m = S.get('mocks', params[0]);
    if (!m) { root.innerHTML = UI.empty('circle-question', 'Test not found', 'This test no longer exists.', '<a class="btn btn-primary" href="#/mocks">Mock centre</a>'); return; }
    if (m.status === 'done') { location.replace('#/result/' + m.id); return; }
    return B.ensureIds(m.items.map(function (i) { return i.qid; })).then(function () {
      if (Date.now() >= m.endTime) { E.submitMock(m, true); location.replace('#/result/' + m.id); return; }
      var shownAt = Date.now(), timer = null, submitting = false, palOpen = false;
      var save = U.debounce(function () { S.put('mocks', m); }, 250);
      function track() { var it = m.items[m.idx]; if (!it) return; m.times[it.qid] = (m.times[it.qid] || 0) + Math.min(Date.now() - shownAt, 600000); shownAt = Date.now(); }
      function sectionName(it) { return it.section === 'verbal' ? 'Verbal Reasoning' : it.section === 'quantitative' ? 'Quantitative Reasoning' : 'Subject Knowledge'; }
      function render() {
        var it = m.items[m.idx], q = B.get(it.qid), chosen = m.answers[it.qid], answered = Object.keys(m.answers).length, flagged = Object.keys(m.flags).filter(function (k) { return m.flags[k]; }).length;
        root.innerHTML = '<div class="exam ' + (palOpen ? 'pal-open' : '') + '">' +
          '<div class="exam-top"><div class="et-title"><b>' + esc(m.title) + '</b><span class="muted small">' + esc(sectionName(it)) + ' · Question ' + (m.idx + 1) + ' of ' + m.items.length + '</span></div>' +
          '<div class="timer" id="timer" role="timer" aria-label="Time left">' + I('clock') + '<b class="num" id="tLeft">' + U.fmtClock(m.endTime - Date.now()) + '</b></div>' +
          '<button class="btn btn-sm hide-lg" data-x="pal" aria-expanded="' + palOpen + '">' + I('grip') + '<span class="num">' + answered + '/' + m.items.length + '</span></button>' +
          '<button class="btn btn-primary btn-sm" data-x="submit">Submit</button></div>' +
          '<div class="exam-body"><article class="qcard exam-card">' + UI.questionMeta(q, m.flags[it.qid] ? '<span class="chip chip-amber">' + I('flag') + ' Flagged</span>' : '') + UI.passage(q) +
          '<h2 class="q-text">' + esc(q.question) + '</h2>' + UI.options(q, m.order[it.qid], { chosen: chosen, reveal: false }) +
          (chosen ? '<button class="btn btn-ghost btn-sm clear-choice" data-x="clear">' + I('xmark') + ' Clear my choice</button>' : '') + '</article>' +
          '<aside class="palette" aria-label="Question palette"><div class="row-between"><b>Questions</b><span class="small muted num">' + answered + ' answered · ' + flagged + ' flagged</span></div>' +
          ['verbal', 'quantitative', 'subject'].map(function (sec) {
            var idxs = []; m.items.forEach(function (x, i) { if (x.section === sec) idxs.push(i); }); if (!idxs.length) return '';
            return '<div class="pal-sec"><span class="small muted">' + esc(sectionName({ section: sec })) + '</span><div class="pal-grid">' + idxs.map(function (i) {
              var x = m.items[i]; return '<button class="pal-b ' + (m.answers[x.qid] ? 'ans ' : '') + (m.flags[x.qid] ? 'flag ' : '') + (i === m.idx ? 'cur' : '') + '" data-go="' + i + '" aria-label="Question ' + (i + 1) + (m.answers[x.qid] ? ', answered' : '') + (m.flags[x.qid] ? ', flagged' : '') + '">' + (i + 1) + '</button>';
            }).join('') + '</div></div>';
          }).join('') + '<div class="pal-legend small muted"><span><i class="pl ans"></i>Answered</span><span><i class="pl flag"></i>Flagged</span><span><i class="pl"></i>Not answered</span></div></aside></div>' +
          '<div class="exam-nav"><button class="btn" data-x="prev" ' + (m.idx ? '' : 'disabled') + '>' + I('chevron-left') + '<span>Previous</span></button>' +
          '<button class="btn ' + (m.flags[it.qid] ? 'btn-amber' : '') + '" data-x="flag" aria-pressed="' + !!m.flags[it.qid] + '">' + I('flag') + '<span>' + (m.flags[it.qid] ? 'Flagged' : 'Flag') + '</span></button>' +
          '<button class="btn btn-primary" data-x="next">' + (m.idx === m.items.length - 1 ? 'Review & submit' : 'Next') + I('chevron-right') + '</button></div></div>';
        tick();
      }
      function tick() {
        var left = m.endTime - Date.now(), el = U.$('#tLeft'), box = U.$('#timer');
        if (el) el.textContent = U.fmtClock(left);
        if (box) { box.classList.toggle('warn', left < 5 * 60000); box.classList.toggle('danger', left < 60000); }
        if (left <= 0) finish(true);
      }
      function goTo(i) { track(); m.idx = U.clamp(i, 0, m.items.length - 1); save(); palOpen = false; render(); window.scrollTo(0, 0); }
      function choose(id) { var it = m.items[m.idx]; m.answers[it.qid] = id; save(); var b = U.$('[data-opt="' + id + '"] .bubble', root); U.$$('.bubble.is-filled', root).forEach(function (x) { x.classList.remove('is-filled'); }); if (b) b.classList.add('is-filled'); setTimeout(render, U.reducedMotion() ? 0 : 200); }
      function finish(auto) {
        if (submitting || m.status !== 'active') return; submitting = true; clearInterval(timer); track();
        E.submitMock(m, auto);
        if (auto) U.toast('Time is up — your test was submitted.', 'stopwatch', 4000);
        location.replace('#/result/' + m.id);
      }
      function askSubmit() {
        var un = m.items.filter(function (i) { return !m.answers[i.qid]; }).length, fl = Object.keys(m.flags).filter(function (k) { return m.flags[k]; }).length;
        var md = U.modal('<h2>Submit your test?</h2><p class="ink2">' + (un ? '<b class="num">' + un + '</b> unanswered' : 'Every question is answered') + (fl ? ' · <b class="num">' + fl + '</b> flagged for review' : '') + '. You cannot change answers after submitting.</p>' +
          '<div class="btn-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Keep working</button><button class="btn btn-primary" id="doSubmit">Submit test</button></div>', { label: 'Submit test' });
        U.$('#doSubmit', md.el).onclick = function () { this.disabled = true; md.close(); finish(false); };
      }
      root.onclick = function (e) {
        var o = e.target.closest('[data-opt]'); if (o) { choose(o.getAttribute('data-opt')); return; }
        var g = e.target.closest('[data-go]'); if (g) { goTo(+g.getAttribute('data-go')); return; }
        var x = e.target.closest('[data-x]'); if (!x) return;
        var a = x.getAttribute('data-x'), it = m.items[m.idx];
        if (a === 'prev') goTo(m.idx - 1);
        else if (a === 'next') { if (m.idx === m.items.length - 1) askSubmit(); else goTo(m.idx + 1); }
        else if (a === 'flag') { m.flags[it.qid] = !m.flags[it.qid]; save(); render(); }
        else if (a === 'clear') { delete m.answers[it.qid]; save(); render(); }
        else if (a === 'submit') askSubmit();
        else if (a === 'pal') { palOpen = !palOpen; render(); }
      };
      RAX.state.keys = function (e) {
        var k = e.key.toUpperCase(), opts = U.$$('[data-opt]', root), i = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'ABCD'.indexOf(k);
        if (k.length === 1 && i >= 0 && opts[i]) { e.preventDefault(); choose(opts[i].getAttribute('data-opt')); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); if (m.idx < m.items.length - 1) goTo(m.idx + 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(m.idx - 1); }
        else if (k === 'F') { e.preventDefault(); var it = m.items[m.idx]; m.flags[it.qid] = !m.flags[it.qid]; save(); render(); }
      };
      var onVis = function () { if (document.visibilityState === 'hidden') { track(); S.put('mocks', m); } else tick(); };
      document.addEventListener('visibilitychange', onVis);
      var onUnload = function () { track(); S.put('mocks', m); };
      window.addEventListener('pagehide', onUnload);
      timer = setInterval(tick, 1000);
      RAX.state.cleanup = function () { clearInterval(timer); track(); if (m.status === 'active') S.put('mocks', m); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pagehide', onUnload); };
      render();
    });
  };

  // ───────── results ─────────
  V.result = function (root, params, query) {
    var m = S.get('mocks', params[0]);
    if (!m || m.status !== 'done') { root.innerHTML = UI.empty('circle-question', 'Result not found', 'This test has not been submitted.', '<a class="btn btn-primary" href="#/mocks">Mock centre</a>'); return; }
    return B.ensureIds(m.items.map(function (i) { return i.qid; })).then(function () {
      var r = m.result = E.scoreMock(m), filter = query.f || 'all';
      var prev = E.doneMocks(function (x) { return x.id !== m.id && x.kind === m.kind && x.category === m.category && x.submitted < m.submitted && (x.spec.section || '') === (m.spec.section || '') && (x.spec.subject || '') === (m.spec.subject || ''); });
      var last = prev[prev.length - 1];
      function table(obj, label) {
        return '<div class="table-wrap"><table class="t"><thead><tr><th>' + label + '</th><th class="n">Correct</th><th class="n">Wrong</th><th class="n">Skipped</th><th>Score</th><th class="n">Avg time</th></tr></thead><tbody>' +
          Object.keys(obj).map(function (k) { var g = obj[k], p = U.pct(g.correct, g.total); return '<tr><td>' + esc(g.name) + '</td><td class="n">' + g.correct + '/' + g.total + '</td><td class="n">' + g.wrong + '</td><td class="n">' + g.skipped + '</td><td style="min-width:120px">' + UI.bar(p, p >= 70 ? 'teal' : p < 40 ? 'amber' : '') + '<span class="small muted num">' + p + '%</span></td><td class="n">' + U.fmtDur(g.ms / g.total) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      }
      var h = '<div class="result">' + UI.head(m.title, (m.partial ? '<span class="chip chip-warn">Partial practice test</span> ' : '') + 'Submitted ' + esc(U.fmtDateTime(m.submitted)) + (m.auto ? ' · submitted automatically when time ran out' : '') + ' · time used ' + U.fmtDur(m.submitted - m.started) + ' of ' + m.minutes + ' min',
        '<a class="btn" href="#/mocks">' + I('chevron-left') + ' Mock centre</a>');
      h += '<div class="res-top sheet">' + UI.ring(r.percent, 'correct', 160) + '<div class="res-nums"><div><b class="num big">' + r.correct + '<span>/' + r.total + '</span></b><span class="muted">correct</span></div>' +
        '<div><b class="num">' + r.wrong + '</b><span class="muted">wrong</span></div><div><b class="num">' + r.skipped + '</b><span class="muted">skipped</span></div>' +
        (r.neg ? '<div><b class="num">' + r.score + '</b><span class="muted">score after −' + r.neg + ' per wrong</span></div>' : '') +
        '<div><b class="num">' + (r.accuracy == null ? '—' : r.accuracy + '%') + '</b><span class="muted">accuracy (of answered)</span></div></div>' +
        (last ? '<p class="delta ' + (r.percent >= last.result.percent ? 'up' : 'down') + '">' + I(r.percent >= last.result.percent ? 'chevron-up' : 'chevron-down') + ' ' + Math.abs(r.percent - last.result.percent) + ' points ' + (r.percent >= last.result.percent ? 'higher' : 'lower') + ' than your previous ' + esc(m.kind) + ' test (' + last.result.percent + '%)</p>' : '<p class="muted small">Take another test of this kind to compare.</p>') +
        (r.wrong ? '<p class="small">' + I('rotate') + ' ' + U.plural(r.wrong, 'wrong answer') + ' added to <a href="#/revision">Revision</a>.</p>' : '') + '</div>';
      if (m.shortages && m.shortages.length) h += '<div class="sheet"><b>Missing from this partial test:</b> ' + m.shortages.map(function (p) { return esc(p.name) + ' (' + (p.need - p.have) + ')'; }).join(', ') + '.</div>';
      if (m.combined) h += '<div class="sheet combined">' + I('feather-pointed') + '<div><b>Part II — essays (40 minutes)</b><p class="muted small">Your full simulation continues with one argument essay and one narrative essay.</p></div><a class="btn btn-amber" href="#/essays/sim?from=' + m.id + '">Start Part II</a></div>';
      h += UI.quote('res-quote');
      if (prev.length) h += '<section class="sheet"><h2>Progress in this kind of test</h2>' + UI.line(prev.slice(-7).concat([m]).map(function (x) { return { label: U.fmtDate(x.submitted), v: x.result.percent }; }), { max: 100, unit: '%', label: 'Scores in this kind of test' }) + '</section>';
      h += '<section class="sheet"><h2>By section</h2>' + table(r.bySection, 'Section') + '</section>';
      h += '<section class="sheet"><h2>By subject</h2>' + table(r.bySubject, 'Subject') + '</section>';
      h += '<section class="sheet"><details><summary><h2 style="display:inline">By topic</h2></summary>' + table(r.byTopic, 'Topic') + '</details></section>';
      var list = m.items.map(function (it, i) { return { it: it, i: i, q: B.get(it.qid), a: m.answers[it.qid] }; }).filter(function (x) { return x.q; });
      var counts = { all: list.length, wrong: list.filter(function (x) { return x.a && x.a !== x.q.answer; }).length, skipped: list.filter(function (x) { return !x.a; }).length, flagged: list.filter(function (x) { return m.flags[x.it.qid]; }).length };
      var shown = list.filter(function (x) { return filter === 'wrong' ? x.a && x.a !== x.q.answer : filter === 'skipped' ? !x.a : filter === 'flagged' ? m.flags[x.it.qid] : true; });
      h += '<section class="sheet"><div class="row-between"><h2>Review answers</h2><div class="tabs" role="tablist">' + ['all', 'wrong', 'skipped', 'flagged'].map(function (f) {
        return '<a role="tab" aria-selected="' + (f === filter) + '" class="tab ' + (f === filter ? 'is-on' : '') + '" href="#/result/' + m.id + '?f=' + f + '">' + f[0].toUpperCase() + f.slice(1) + ' <span class="num">' + counts[f] + '</span></a>';
      }).join('') + '</div></div><div class="review-q">' + shown.map(function (x) {
        return '<article class="qcard rq"><div class="rq-n">' + (x.i + 1) + '</div>' + UI.questionMeta(x.q, m.flags[x.it.qid] ? '<span class="chip chip-amber">' + I('flag') + ' Flagged</span>' : '') + UI.passage(x.q, false) + '<h3 class="q-text">' + esc(x.q.question) + '</h3>' +
          UI.options(x.q, m.order[x.it.qid], { chosen: x.a, reveal: true }) + (x.a ? '' : '<p class="small muted">' + I('circle-question') + ' Not answered</p>') + UI.feedback(x.q, x.a) + UI.qTools(x.q) + '</article>';
      }).join('') + (shown.length ? '' : '<p class="muted">Nothing here.</p>') + '</div></section></div>';
      root.innerHTML = h;
      if (!m.celebrated && r.percent >= 70) { U.confetti({ count: 180 }); m.celebrated = true; S.put('mocks', m); }
    });
  };
})();
