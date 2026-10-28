/* RAXUSATPrep — practice (setup, session, summary), revision, topic explorer, daily challenge. */
(function () {
  'use strict';
  var RAX = window.RAX, U = RAX.util, S = RAX.store, B = RAX.bank, E = RAX.engine, UI = RAX.ui, I = RAX.icon, esc = U.esc, V = RAX.views = RAX.views || {};
  var PREFIX = { bio: 'biology', chem: 'chemistry', phy: 'physics', qr: 'quantitative', vr: 'verbal' };
  B.fileOfId = function (id) { return PREFIX[id.split('-')[0]]; };
  B.ensureIds = function (ids) { var f = {}; ids.forEach(function (id) { var k = B.fileOfId(id); if (k) f[k] = 1; }); return B.load(Object.keys(f)); };

  var P = RAX.practice = {};
  P.create = function (kind, title, qs, extra, replace) {
    if (!qs.length) { U.toast('No questions match — try another choice' + (RAX.state.settings.showUnverified ? '' : ' or turn on unverified questions in Settings') + '.', 'circle-info', 4000); return null; }
    var s = Object.assign({ id: U.uid('s'), kind: kind, title: title, qids: qs.map(function (q) { return q.id; }), idx: 0, ans: {}, status: 'active', created: Date.now(), cat: RAX.state.settings.category }, extra || {});
    S.put('sessions', s);
    if (replace) location.replace('#/session/' + s.id); else location.hash = '#/session/' + s.id;
    return s;
  };

  // ───────── practice setup ─────────
  V.practice = function (root, params, query) {
    var cat = RAX.state.settings.category;
    if (query.quick) { if (!P.create('quick', 'Quick ' + query.quick, E.quickSet(cat, +query.quick), null, true)) location.replace('#/practice'); return; }
    if (query.topic) {
      var tq = E.quickSet(cat, 10, { topic: query.topic, subject: query.subject || undefined });
      if (!P.create('topic', query.topic, tq, null, true)) location.replace('#/practice'); return;
    }
    var tree = B.tree(cat), sessions = S.all('sessions').sort(function (a, b) { return b.updated - a.updated; });
    var active = sessions.filter(function (x) { return x.status === 'active'; }).slice(0, 4);
    var subjOpts = tree.filter(function (n) { return n.available; }).map(function (n) { return '<option value="' + esc(n.kind === 'section' ? 'sec:' + n.id : 'sub:' + n.id) + '">' + esc(n.name) + '</option>'; }).join('');
    var h = UI.head('Practice', 'Instant feedback after every answer. Wrong answers go to Revision automatically.');
    if (active.length) h += '<section class="sheet resume"><h2>' + I('play') + ' Continue where you left off</h2><div class="resume-list">' + active.map(function (x) {
      var done = Object.keys(x.ans).length; return '<a class="resume-item" href="#/session/' + x.id + '"><b>' + esc(x.title) + '</b><span class="muted small">' + done + ' of ' + x.qids.length + ' answered · ' + esc(U.fmtDateTime(x.updated)) + '</span>' + UI.bar(U.pct(done, x.qids.length)) + '</a>';
    }).join('') + '</div></section>';
    h += '<div class="grid cols-2 practice-modes">' +
      '<section class="sheet mode-card"><span class="mode-icon amber">' + I('bolt') + '</span><h2>Quick practice</h2><p class="muted">A mix from your category, unseen questions first.</p><div class="btn-row">' +
        [5, 10, 15].map(function (n) { return '<a class="btn btn-primary" href="#/practice?quick=' + n + '">' + n + ' questions</a>'; }).join('') + '</div></section>' +
      '<section class="sheet mode-card"><span class="mode-icon">' + I('wand-magic-sparkles') + '</span><h2>Smart mix</h2><p class="muted">Due revision, your weakest topics and new questions in one set.</p><div class="btn-row">' +
        [10, 20].map(function (n) { return '<button class="btn" data-smart="' + n + '">' + n + ' questions</button>'; }).join('') + '</div></section></div>';
    h += '<section class="sheet custom"><h2>' + I('sliders') + ' Build your own set</h2><form id="customForm" class="custom-form">' +
      '<div class="field"><label for="cSub">Section or subject</label><select id="cSub" class="select">' + subjOpts + '</select></div>' +
      '<div class="field"><label for="cTopic">Topic or chapter</label><select id="cTopic" class="select"></select></div>' +
      '<div class="field"><label for="cCount">How many</label><select id="cCount" class="select"><option>5</option><option selected>10</option><option>15</option><option>20</option><option>30</option></select></div>' +
      '<div class="field"><label for="cDiff">Difficulty (estimated)</label><select id="cDiff" class="select"><option value="">Any</option><option>Easy</option><option>Medium</option><option>Hard</option></select></div>' +
      '<label class="check"><input type="checkbox" id="cUnseen"> <span>Only questions I have not answered yet</span></label>' +
      '<label class="check"><input type="checkbox" id="cUnv" ' + (RAX.state.settings.showUnverified ? 'checked' : '') + '> <span>Include practice-only questions <small class="muted">(options unclear in the scan; labelled, with the checked answer)</small></span></label>' +
      '<button class="btn btn-primary" type="submit">' + I('play') + ' Start</button></form></section>';
    h += '<a class="sheet bank-promo" href="#/bank">' + I('book') + '<div><b>Question bank</b><span class="muted small">Read every question with its checked answer and explanation, chapter by chapter — like the study PDFs.</span></div>' + I('chevron-right') + '</a>';
    var bm = E.bookmarks().length, mk = E.mistakes().length;
    h += '<div class="grid cols-2"><section class="sheet mode-card"><span class="mode-icon teal">' + I('bookmark') + '</span><h2>Bookmarks</h2><p class="muted">' + U.plural(bm, 'saved question') + '.</p><button class="btn" data-special="bm" ' + (bm ? '' : 'disabled') + '>Practise bookmarks</button></section>' +
      '<section class="sheet mode-card"><span class="mode-icon red">' + I('rotate-left') + '</span><h2>Mistakes</h2><p class="muted">' + U.plural(mk, 'question') + ' you last got wrong.</p><button class="btn" data-special="mk" ' + (mk ? '' : 'disabled') + '>Practise mistakes</button></section></div>';
    var recent = sessions.filter(function (x) { return x.status === 'done'; }).slice(0, 6);
    if (recent.length) h += '<section class="sheet"><h2>' + I('clock') + ' Recent sets</h2><ul class="plain-list">' + recent.map(function (x) {
      var ok = x.qids.filter(function (id) { return x.ans[id] && x.ans[id].ok; }).length;
      return '<li><a href="#/session/' + x.id + '">' + esc(x.title) + '</a><span class="muted small num">' + ok + '/' + x.qids.length + ' · ' + esc(U.fmtDateTime(x.updated)) + '</span></li>';
    }).join('') + '</ul></section>';
    root.innerHTML = h;

    var subSel = U.$('#cSub'), topSel = U.$('#cTopic');
    function fillTopics() {
      var v = subSel.value, node = tree.filter(function (n) { return (n.kind === 'section' ? 'sec:' : 'sub:') + n.id === v; })[0];
      topSel.innerHTML = '<option value="">All topics</option>' + (node ? node.topics.map(function (t) { return '<option>' + esc(t.name) + '</option>'; }).join('') : '');
    }
    subSel.onchange = fillTopics; fillTopics();
    U.$('#customForm').onsubmit = function (e) {
      e.preventDefault();
      var unv = U.$('#cUnv').checked;
      var go = function () {
        var v = subSel.value.split(':'), f = v[0] === 'sec' ? { section: v[1] } : { subject: v[1] };
        if (topSel.value) f.topic = topSel.value;
        var pool = B.pool(Object.assign({ category: cat }, f)).filter(function (q) { return (!U.$('#cDiff').value || q.difficulty === U.$('#cDiff').value); });
        if (U.$('#cUnseen').checked) { var seen = E.seenIds(); pool = pool.filter(function (q) { return !seen.has(q.id); }); }
        var n = +U.$('#cCount').value, ids = new Set(), qs = [];
        U.shuffle(pool).forEach(function (q) { if (qs.length >= n || ids.has(q.id)) return; if (q.passageId) pool.filter(function (x) { return x.passageId === q.passageId; }).forEach(function (x) { if (!ids.has(x.id)) { ids.add(x.id); qs.push(x); } }); else { ids.add(q.id); qs.push(q); } });
        P.create('custom', (topSel.value || subSel.options[subSel.selectedIndex].text) + ' practice', qs);
      };
      if (unv !== !!RAX.state.settings.showUnverified) RAX.app.saveSettings({ showUnverified: unv }).then(go); else go();
    };
    root.onclick = function (e) {
      var sm = e.target.closest('[data-smart]'); if (sm) { P.create('smart', 'Smart mix', E.smartMix(cat, +sm.getAttribute('data-smart'))); return; }
      var sp = e.target.closest('[data-special]');
      if (sp) {
        var ids = (sp.getAttribute('data-special') === 'bm' ? E.bookmarks() : E.mistakes()).map(function (x) { return x.id; });
        B.ensureIds(ids).then(function () { P.create(sp.getAttribute('data-special') === 'bm' ? 'bookmarks' : 'mistakes', sp.getAttribute('data-special') === 'bm' ? 'Bookmarks' : 'Mistakes', U.shuffle(ids.map(B.get).filter(Boolean)).slice(0, 30)); });
      }
    };
  };

  // ───────── session ─────────
  V.session = function (root, params) {
    var sess = S.get('sessions', params[0]);
    if (!sess) { root.innerHTML = UI.empty('circle-question', 'Set not found', 'This practice set no longer exists.', '<a class="btn btn-primary" href="#/practice">Go to practice</a>'); return; }
    return B.ensureIds(sess.qids).then(function () {
      var shownAt = Date.now();
      function q() { return B.get(sess.qids[sess.idx]); }
      function render() {
        if (sess.status === 'done' || sess.idx >= sess.qids.length) return summary();
        var cur = q(); if (!cur) { sess.idx++; return render(); }
        var a = sess.ans[cur.id], answered = Object.keys(sess.ans).length, ok = sess.qids.filter(function (id) { return sess.ans[id] && sess.ans[id].ok; }).length;
        root.innerHTML = '<div class="session">' +
          '<div class="sess-top"><a class="btn btn-ghost btn-sm" href="#/practice">' + I('chevron-left') + '<span>Exit</span></a><div class="sess-title"><b>' + esc(sess.title) + '</b><span class="muted small num">Question ' + (sess.idx + 1) + ' of ' + sess.qids.length + ' · ' + ok + ' correct</span></div>' +
          '<span class="sess-dots" aria-hidden="true">' + sess.qids.map(function (id, i) { var x = sess.ans[id]; return '<i class="' + (x ? (x.ok ? 'ok' : 'bad') : '') + (i === sess.idx ? ' cur' : '') + '"></i>'; }).join('') + '</span></div>' +
          UI.bar(U.pct(answered, sess.qids.length), 'thin') +
          '<article class="qcard" id="qcard">' + card(cur, a) + '</article>' +
          '<div class="sess-nav"><button class="btn" data-nav-q="-1" ' + (sess.idx ? '' : 'disabled') + '>' + I('chevron-left') + '<span>Previous</span></button>' +
          '<span class="kbd-hint muted small hide-sm"><kbd>1</kbd>–<kbd>4</kbd> answer · <kbd>→</kbd> next</span>' +
          '<button class="btn ' + (a ? 'btn-primary' : '') + '" data-nav-q="1">' + (sess.idx === sess.qids.length - 1 ? (a ? 'Finish' : 'Skip & finish') : (a ? 'Next' : 'Skip')) + I('chevron-right') + '</button></div></div>';
        shownAt = Date.now();
        UI.animateRings(root);
      }
      function card(cur, a) {
        return UI.questionMeta(cur) + UI.passage(cur) + '<h2 class="q-text">' + esc(cur.question) + '</h2>' + UI.options(cur, null, { chosen: a && a.c, reveal: !!a }) + (a ? UI.feedback(cur, a.c) + UI.qTools(cur) : '');
      }
      function choose(id) {
        var cur = q(); if (!cur || sess.ans[cur.id]) return;
        var ms = Math.min(Date.now() - shownAt, 10 * 60000);
        var ok = E.answer(cur, id, { mode: sess.kind === 'revision' ? 'revision' : sess.kind === 'daily' ? 'daily' : 'practice', sid: sess.id, ms: ms });
        sess.ans[cur.id] = { c: id, ok: ok, ms: ms }; S.put('sessions', sess);
        var btn = U.$('[data-opt="' + id + '"] .bubble', root); if (btn) btn.classList.add('is-filled');
        setTimeout(function () {
          render();
          var cardEl = U.$('#qcard'); if (cardEl) cardEl.classList.add(ok ? 'pop-ok' : 'shake');
          var fb = U.$('.feedback', root); if (fb && fb.scrollIntoView && innerWidth < 760) fb.scrollIntoView({ behavior: U.reducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
        }, U.reducedMotion() ? 0 : 260);
      }
      function nav(d) {
        if (d > 0 && sess.idx >= sess.qids.length - 1) { finish(); return; }
        sess.idx = U.clamp(sess.idx + d, 0, sess.qids.length - 1); S.put('sessions', sess); render(); window.scrollTo(0, 0);
      }
      function finish() {
        sess.status = 'done'; sess.idx = sess.qids.length; sess.finished = Date.now(); S.put('sessions', sess);
        if (sess.kind === 'daily') {
          var ok = sess.qids.filter(function (id) { return sess.ans[id] && sess.ans[id].ok; }).length;
          S.put('kv', { id: sess.dailyKey, done: true, score: ok, total: sess.qids.length, day: U.today() });
        }
        summary(true);
      }
      function summary(fresh) {
        var ok = 0, wrong = [], ms = 0;
        sess.qids.forEach(function (id) { var x = sess.ans[id]; if (x) { ms += x.ms || 0; if (x.ok) ok++; else wrong.push(id); } });
        var answered = Object.keys(sess.ans).length, pct = U.pct(ok, sess.qids.length);
        root.innerHTML = '<div class="summary">' + UI.head(sess.title + ' — done', U.plural(answered, 'answer') + ' in ' + U.fmtDur(ms) + '.') +
          '<div class="sum-top sheet">' + UI.ring(pct, 'score', 150) + '<div><h2 class="num">' + ok + ' / ' + sess.qids.length + ' correct</h2><p class="muted">' + (pct >= 80 ? 'Excellent work — keep this pace.' : pct >= 50 ? 'Good effort. Review the misses below, then try them again.' : 'Every mistake you review now is one you will not repeat. Go through the misses below.') + '</p>' +
          '<div class="btn-row">' + (wrong.length ? '<button class="btn btn-amber" data-retry>' + I('rotate-left') + ' Practise the ' + U.plural(wrong.length, 'miss', 'misses') + ' again</button>' : '') + '<a class="btn btn-primary" href="#/practice?quick=10">' + I('bolt') + ' New quick 10</a><a class="btn" href="#/dashboard">Dashboard</a></div></div></div>' +
          '<section class="sheet"><h2>Review</h2><ol class="review-list">' + sess.qids.map(function (id) {
            var qq = B.get(id), x = sess.ans[id]; if (!qq) return '';
            var right = qq.options.filter(function (o) { return o.id === qq.answer; })[0];
            return '<li class="' + (x ? (x.ok ? 'ok' : 'bad') : 'skip') + '"><span class="rv-mark">' + I(x ? (x.ok ? 'check' : 'xmark') : 'circle-question') + '<span class="sr-only">' + (x ? (x.ok ? 'Correct' : 'Wrong') : 'Skipped') + '</span></span><div><p>' + esc(qq.question) + '</p>' +
              '<p class="small"><b>Answer:</b> ' + (right ? esc(right.text) : 'None of the printed options') + (x && !x.ok ? ' · <span class="bad-t">You chose ' + esc((qq.options.filter(function (o) { return o.id === x.c; })[0] || {}).text || '') + '</span>' : '') + '</p>' +
              (qq.explanation ? '<details><summary class="small">Explanation</summary><p class="small">' + esc(qq.explanation) + '</p></details>' : '') + '</div></li>';
          }).join('') + '</ol></section></div>';
        UI.animateRings(root);
        if (fresh && pct >= 80 && sess.qids.length >= 5) U.confetti();
        var r = U.$('[data-retry]', root); if (r) r.onclick = function () { P.create('retry', sess.title + ' — retry', wrong.map(B.get).filter(Boolean)); };
      }
      root.onclick = function (e) {
        var o = e.target.closest('[data-opt]'); if (o && !o.disabled) { choose(o.getAttribute('data-opt')); return; }
        var n = e.target.closest('[data-nav-q]'); if (n && !n.disabled) nav(+n.getAttribute('data-nav-q'));
      };
      RAX.state.keys = function (e) {
        if (sess.status === 'done') return;
        var k = e.key.toUpperCase(), cur = q(); if (!cur) return;
        var opts = U.$$('[data-opt]', root), i = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'ABCD'.indexOf(k);
        if (i >= 0 && k.length === 1 && opts[i]) { e.preventDefault(); choose(opts[i].getAttribute('data-opt')); }
        else if (e.key === 'ArrowRight' || (e.key === 'Enter' && sess.ans[cur.id])) { e.preventDefault(); nav(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); nav(-1); }
      };
      render();
    });
  };

  // ───────── revision ─────────
  V.revision = function (root) {
    var due = E.due(), mk = E.mistakes(), inL = E.inRevision(), mastered = E.mastered().length, days = RAX.config.leitnerDays;
    var ids = mk.map(function (s) { return s.id; }).concat(due.map(function (s) { return s.id; }));
    return B.ensureIds(ids).then(function () {
      var boxes = [1, 2, 3, 4, 5].map(function (b) { return inL.filter(function (s) { return s.box === b; }).length; });
      var h = UI.head('Revision', 'Spaced repetition (Leitner boxes): a wrong answer goes to box 1; each correct review moves it up. A correct answer in box 5 means mastered.');
      h += '<div class="leitner sheet">' + boxes.map(function (n, i) {
        return '<div class="lbox"><span class="lb-n num">' + n + '</span><b>Box ' + (i + 1) + '</b><span class="muted small">' + (days[i] === 0 ? 'same day' : 'after ' + U.plural(days[i], 'day')) + '</span></div>';
      }).join('<span class="lb-arrow" aria-hidden="true">' + I('chevron-right') + '</span>') + '<span class="lb-arrow" aria-hidden="true">' + I('chevron-right') + '</span><div class="lbox mastered"><span class="lb-n num">' + mastered + '</span><b>Mastered</b><span class="muted small">' + I('trophy') + '</span></div></div>';
      h += '<div class="grid cols-2"><section class="sheet mode-card"><span class="mode-icon amber">' + I('rotate') + '</span><h2>' + U.plural(due.length, 'question') + ' due today</h2><p class="muted">Review them now to move them up a box.</p><button class="btn btn-primary" data-rev="due" ' + (due.length ? '' : 'disabled') + '>Start revision</button></section>' +
        '<section class="sheet mode-card"><span class="mode-icon red">' + I('rotate-left') + '</span><h2>' + U.plural(mk.length, 'mistake') + '</h2><p class="muted">Questions whose latest answer was wrong — in practice or in a test.</p><button class="btn" data-rev="mk" ' + (mk.length ? '' : 'disabled') + '>Practise mistakes</button></section></div>';
      if (mk.length) {
        h += '<section class="sheet"><div class="row-between"><h2>Your mistakes</h2><a href="#/journal" class="small">Open mistake journal</a></div><ul class="mistake-list">' + mk.sort(function (a, b) { return b.lastTs - a.lastTs; }).slice(0, 60).map(function (s) {
          var qq = B.get(s.id); if (!qq) return '';
          return '<li><div><p>' + esc(qq.question.slice(0, 160)) + (qq.question.length > 160 ? '…' : '') + '</p><span class="small muted">' + esc(qq.subject + ' › ' + qq.topic) + ' · ' + (s.lastMode === 'mock' ? 'in a test' : 'in practice') + ' · ' + esc(U.fmtDate(s.lastTs)) + (s.inL ? ' · box ' + s.box : '') + '</span></div></li>';
        }).join('') + '</ul></section>';
      } else h += UI.empty('circle-check', 'No mistakes to review', 'Wrong answers from practice and tests will appear here.');
      root.innerHTML = h;
      root.onclick = function (e) {
        var b = e.target.closest('[data-rev]'); if (!b) return;
        var list = (b.getAttribute('data-rev') === 'due' ? due : mk).map(function (s) { return B.get(s.id); }).filter(function (q) { return q && q.answer; });
        P.create(b.getAttribute('data-rev') === 'due' ? 'revision' : 'mistakes', b.getAttribute('data-rev') === 'due' ? 'Revision — ' + U.fmtDate(Date.now()) : 'Mistakes', U.shuffle(list).slice(0, 30));
      };
    });
  };

  // ───────── topic explorer ─────────
  V.explore = function (root) {
    var cat = RAX.state.settings.category, tree = B.tree(cat), acc = {}, seenBy = {};
    E.groupAcc('topic').forEach(function (g) { acc[g.key] = g; });
    S.all('qstate').forEach(function (s) { if (!s.att) return; var q = B.get(s.id); if (q) { var k = q.subject + '|' + q.topic; seenBy[k] = (seenBy[k] || 0) + 1; } });
    var h = UI.head('Topic explorer', 'The USAT syllabus for ' + esc(cat || 'all categories') + ', with what the bank holds and how you are doing. Pattern last checked: ' + esc(U.fmtDate(RAX.config.patternLastChecked)) + '.');
    h += tree.map(function (n) {
      var subj = n.kind === 'section' ? (n.id === 'verbal' ? 'Verbal Reasoning' : 'Quantitative Reasoning') : n.name;
      return '<section class="sheet explore-node"><div class="row-between"><h2>' + I(n.kind === 'section' ? (n.id === 'verbal' ? 'spell-check' : 'calculator') : 'book') + ' ' + esc(n.name) + '</h2><span class="chip chip-indigo num">' + n.weight + ' MCQs in the test</span></div>' +
        (!n.available ? '<p class="muted">' + esc(n.name) + ' questions are not in the bank yet — no source PDF had them. Use your textbook for now; the test still counts ' + n.weight + ' MCQs from it.</p>' :
        '<div class="table-wrap"><table class="t explore-t"><thead><tr><th>' + (n.kind === 'section' ? 'Topic' : 'Chapter') + '</th>' + (n.kind === 'section' ? '<th class="n">In test</th>' : '') + '<th class="n">Verified</th><th class="n">Answered</th><th class="n">Your accuracy</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
        n.topics.map(function (t) {
          var a = acc[t.name], seen = seenBy[subj + '|' + t.name] || 0;
          return '<tr><td>' + esc(t.name) + '</td>' + (n.kind === 'section' ? '<td class="n">' + (t.weight || '') + '</td>' : '') + '<td class="n">' + U.fmtNum(t.verified) + (t.total > t.verified ? ' <span class="muted small">(+' + (t.total - t.verified) + ')</span>' : '') + '</td><td class="n">' + seen + '</td>' +
            '<td class="n">' + (a ? '<span class="chip ' + (a.accuracy >= 70 ? 'chip-ok' : a.accuracy >= 50 ? 'chip-warn' : 'chip-bad') + '">' + a.accuracy + '%</span>' : '<span class="muted">—</span>') + '</td>' +
            '<td class="acts"><a class="btn btn-sm" href="#/practice?topic=' + encodeURIComponent(t.name) + '&subject=' + encodeURIComponent(subj) + '">Practise</a> <button class="btn btn-sm btn-ghost" data-ttest="' + esc(t.name) + '" data-subj="' + esc(subj) + '">Test</button></td></tr>';
        }).join('') + '</tbody></table></div>') + '</section>';
    }).join('');
    root.innerHTML = h;
    root.onclick = function (e) {
      var b = e.target.closest('[data-ttest]'); if (!b) return;
      RAX.mocks.begin({ type: 'topic', topic: b.getAttribute('data-ttest'), subject: b.getAttribute('data-subj'), count: 10, category: cat });
    };
  };

  // ───────── daily challenge ─────────
  V.daily = function (root) {
    var cat = RAX.state.settings.category, day = U.today(), key = 'daily:' + day + ':' + (cat || 'common'), sid = 'daily-' + day + '-' + (cat || 'common');
    var sess = S.get('sessions', sid);
    if (!sess) {
      var qs = E.dailySet(cat, day);
      if (!qs.length) { root.innerHTML = UI.empty('calendar-day', 'No daily challenge', 'There are not enough verified questions yet.'); return; }
      sess = { id: sid, kind: 'daily', title: 'Daily challenge · ' + U.fmtDate(Date.now()), qids: qs.map(function (q) { return q.id; }), idx: 0, ans: {}, status: 'active', created: Date.now(), cat: cat, dailyKey: key };
      S.put('sessions', sess);
    }
    location.replace('#/session/' + sid);
  };
})();
