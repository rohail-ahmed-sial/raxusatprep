/* RAXUSATPrep — library, planner, flashcards, mistake journal, analytics, reported questions, settings. */
(function () {
  'use strict';
  var RAX = window.RAX, U = RAX.util, S = RAX.store, B = RAX.bank, E = RAX.engine, UI = RAX.ui, I = RAX.icon, esc = U.esc, V = RAX.views = RAX.views || {};
  function ansText(q) { var o = q.options.filter(function (x) { return x.id === q.answer; })[0]; return o ? o.text : 'None of the printed options'; }
  function qItem(q, extra) {
    return '<li class="lib-q"><div><p>' + esc(q.question) + '</p><span class="small muted">' + esc(q.subject + ' › ' + q.topic) + '</span>' +
      '<details><summary class="small">Show answer</summary><p class="small"><b>' + esc(ansText(q)) + '</b></p>' + (q.explanation ? '<p class="small muted">' + esc(q.explanation) + '</p>' : '') + '</details>' + (extra || '') + '</div></li>';
  }

  // ───────── library ─────────
  V.library = function (root, params) {
    var tab = params[0] || 'bookmarks', bm = E.bookmarks(), notes = E.notes();
    return B.ensureIds(bm.concat(notes).map(function (s) { return s.id; })).then(function () {
      var h = UI.head('Library', 'Bookmarks, notes and everything you have done.') + '<div class="tabs" role="tablist">' + [['bookmarks', 'Bookmarks', bm.length], ['notes', 'Notes', notes.length], ['history', 'History', '']].map(function (t) {
        return '<a role="tab" class="tab ' + (tab === t[0] ? 'is-on' : '') + '" aria-selected="' + (tab === t[0]) + '" href="#/library/' + t[0] + '">' + t[1] + (t[2] !== '' ? ' <span class="num">' + t[2] + '</span>' : '') + '</a>';
      }).join('') + '</div>';
      if (tab === 'bookmarks') {
        h += bm.length ? '<div class="btn-row" style="margin:12px 0"><button class="btn btn-primary" data-pr="bm">' + I('play') + ' Practise bookmarks</button></div><ul class="lib-list">' + bm.map(function (s) { var q = B.get(s.id); return q ? qItem(q, '<button class="btn btn-sm btn-ghost" data-action="bookmark" data-q="' + q.id + '" aria-pressed="true">' + I('bookmark') + '<span>Bookmarked</span></button>') : ''; }).join('') + '</ul>'
          : UI.empty('bookmark', 'No bookmarks yet', 'Tap “Bookmark” under any question to save it here.');
      } else if (tab === 'notes') {
        h += notes.length ? '<ul class="lib-list">' + notes.map(function (s) { var q = B.get(s.id); return q ? qItem(q, '<blockquote class="note-text">' + esc(s.note) + '</blockquote><button class="btn btn-sm btn-ghost" data-action="note" data-q="' + q.id + '">' + I('note-sticky') + '<span>Edit note</span></button>') : ''; }).join('') + '</ul>'
          : UI.empty('note-sticky', 'No notes yet', 'Add a note under any question after you answer it.');
      } else {
        var items = S.all('sessions').map(function (x) { var ok = x.qids.filter(function (id) { return x.ans[id] && x.ans[id].ok; }).length; return { ts: x.updated, title: x.title, kind: x.kind === 'daily' ? 'Daily challenge' : 'Practice', score: ok + '/' + x.qids.length, href: '#/session/' + x.id, status: x.status }; })
          .concat(E.doneMocks().map(function (m) { return { ts: m.submitted, title: m.title, kind: 'Test', score: m.result.correct + '/' + m.result.total, href: '#/result/' + m.id, status: 'done' }; }))
          .concat(S.all('essays').map(function (e) { return { ts: e.updated, title: e.title || 'Untitled essay', kind: 'Essay', score: (e.words || 0) + ' words', href: '#/essays/write/' + e.id, status: e.status }; }))
          .sort(function (a, b) { return b.ts - a.ts; });
        h += items.length ? '<div class="table-wrap"><table class="t"><thead><tr><th>When</th><th>What</th><th>Type</th><th class="n">Result</th></tr></thead><tbody>' + items.slice(0, 200).map(function (i) {
          return '<tr><td>' + esc(U.fmtDateTime(i.ts)) + '</td><td><a href="' + i.href + '">' + esc(i.title) + '</a>' + (i.status === 'active' ? ' <span class="chip chip-amber">In progress</span>' : i.status === 'draft' ? ' <span class="chip">Draft</span>' : '') + '</td><td>' + i.kind + '</td><td class="n">' + esc(i.score) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : UI.empty('clock', 'Nothing here yet', 'Your practice sets, tests and essays will be listed here.');
      }
      root.innerHTML = h;
      root.onclick = function (e) {
        if (e.target.closest('.tab')) RAX.app._noFocus = true;
        if (e.target.closest('[data-pr]')) RAX.practice.create('bookmarks', 'Bookmarks', U.shuffle(bm.map(function (s) { return B.get(s.id); }).filter(Boolean)).slice(0, 30));
      };
    });
  };

  // ───────── planner ─────────
  function heatmap(weeks) {
    var days = E.activeDays(), today = U.today(), start = U.addDays(today, -(weeks * 7 - 1)), max = 1, cells = [];
    Object.keys(days).forEach(function (k) { if (days[k] > max) max = days[k]; });
    var dow = (new Date().getDay() + 6) % 7; start = U.addDays(start, -((new Date(start.replace(/-/g, '/')).getDay() + 6) % 7));
    for (var d = start; d <= today; d = U.addDays(d, 1)) cells.push(d);
    return '<div class="heat" role="img" aria-label="Activity over the last ' + weeks + ' weeks">' + cells.map(function (d) {
      var n = days[d] || 0, lvl = n ? Math.min(4, Math.ceil(n / max * 4)) : 0; return '<i class="h' + lvl + '" title="' + esc(U.fmtDate(d.replace(/-/g, '/')) + ': ' + n + ' answers') + '"></i>';
    }).join('') + '</div><div class="heat-legend small muted"><span>Less</span><i class="h0"></i><i class="h1"></i><i class="h2"></i><i class="h3"></i><i class="h4"></i><span>More</span></div>';
  }
  V.planner = function (root) {
    var s = RAX.state.settings, plan = S.get('kv', 'planner') || { id: 'planner', tasks: [] }, today = U.today();
    var todayN = (E.byDay()[today] || 0), goal = s.dailyGoal || 20, exam = s.examDate ? U.daysBetween(today, s.examDate) : null;
    var due = E.due().length, weak = E.weakTopics(2, s.category), essaysWeek = S.all('essays').filter(function (e) { return e.updated > Date.now() - 7 * 864e5; }).length;
    var mocksWeek = E.doneMocks(function (m) { return m.submitted > Date.now() - 7 * 864e5; }).length;
    var sugg = [];
    if (due) sugg.push(['rotate', 'Review ' + U.plural(due, 'question') + ' due today', '#/revision']);
    weak.forEach(function (w) { sugg.push(['brain', 'Practise ' + w.key + ' (' + w.accuracy + '% so far)', '#/practice?topic=' + encodeURIComponent(w.key)]); });
    if (!mocksWeek) sugg.push(['stopwatch', 'Take one test this week', '#/mocks']);
    if (!essaysWeek) sugg.push(['feather-pointed', 'Write one essay this week', '#/essays/write']);
    if (todayN < goal) sugg.push(['bolt', 'Answer ' + (goal - todayN) + ' more questions to reach today’s goal', '#/practice?quick=' + Math.min(15, Math.max(5, goal - todayN))]);
    var h = UI.head('Planner', 'Set your test date and a daily goal. Suggestions come from your own progress.');
    h += '<div class="grid cols-2"><section class="sheet"><h2>' + I('hourglass-half') + ' Test date</h2><div class="field"><label for="exDate">Your USAT date</label><input type="date" id="exDate" class="input" value="' + esc(s.examDate || '') + '" min="' + today + '"></div>' +
      (exam != null ? (exam >= 0 ? '<p class="countdown-big"><b class="num">' + exam + '</b> ' + (exam === 1 ? 'day' : 'days') + ' to go</p>' : '<p class="muted">That date has passed — set your next one.</p>') : '<p class="muted small">Check the official HEC/ETC notice for test dates.</p>') + '</section>' +
      '<section class="sheet"><h2>' + I('bullseye') + ' Daily goal</h2><div class="field"><label for="goal">Questions per day</label><select id="goal" class="select">' + [10, 20, 30, 50, 75, 100].map(function (n) { return '<option ' + (n === goal ? 'selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div>' +
      '<p class="num"><b>' + todayN + '</b> / ' + goal + ' today</p>' + UI.bar(U.pct(todayN, goal), 'amber') + '</section></div>';
    h += '<section class="sheet"><h2>' + I('wand-magic-sparkles') + ' Suggested next steps</h2>' + (sugg.length ? '<ul class="sugg">' + sugg.map(function (x) { return '<li>' + I(x[0]) + '<a href="' + x[2] + '">' + esc(x[1]) + '</a></li>'; }).join('') + '</ul>' : '<p class="muted">You are on track today.</p>') + '</section>';
    h += '<section class="sheet"><h2>' + I('list-check') + ' My tasks</h2><form id="taskForm" class="task-form"><label class="sr-only" for="taskTxt">New task</label><input id="taskTxt" class="input" maxlength="140" placeholder="e.g. Revise Physics chapter 3"><button class="btn btn-primary" type="submit">' + I('plus') + ' Add</button></form>' +
      (plan.tasks.length ? '<ul class="tasks">' + plan.tasks.map(function (t) { return '<li class="' + (t.done ? 'done' : '') + '"><label class="check"><input type="checkbox" data-task="' + t.id + '" ' + (t.done ? 'checked' : '') + '> <span>' + esc(t.text) + '</span></label><button class="btn btn-sm btn-ghost btn-icon" data-deltask="' + t.id + '" aria-label="Delete task">' + I('trash-can') + '</button></li>'; }).join('') + '</ul>' : '<p class="muted small">No tasks yet.</p>') + '</section>';
    h += '<section class="sheet"><h2>' + I('calendar-check') + ' Activity — last 12 weeks</h2>' + heatmap(12) + '</section>';
    root.innerHTML = h;
    U.$('#exDate').onchange = function () { RAX.app.saveSettings({ examDate: this.value || null }).then(function () { RAX.app._noFocus = true; RAX.app.route(); }); };
    U.$('#goal').onchange = function () { RAX.app.saveSettings({ dailyGoal: +this.value }).then(function () { RAX.app._noFocus = true; RAX.app.route(); }); };
    U.$('#taskForm').onsubmit = function (e) { e.preventDefault(); var v = U.$('#taskTxt').value.trim(); if (!v) return; plan.tasks.push({ id: U.uid('t'), text: v, done: false, created: Date.now() }); S.put('kv', plan); RAX.app._noFocus = true; RAX.app.route(); };
    root.onclick = function (e) {
      var d = e.target.closest('[data-deltask]'); if (d) { plan.tasks = plan.tasks.filter(function (t) { return t.id !== d.getAttribute('data-deltask'); }); S.put('kv', plan); RAX.app._noFocus = true; RAX.app.route(); }
    };
    root.onchange = function (e) { var c = e.target.closest('[data-task]'); if (c) { plan.tasks.forEach(function (t) { if (t.id === c.getAttribute('data-task')) t.done = c.checked; }); S.put('kv', plan); c.closest('li').classList.toggle('done', c.checked); } };
  };

  // ───────── flashcards ─────────
  V.flashcards = function (root, params) {
    var deck = params[0] || '';
    if (!deck) {
      var vocab = RAX.vocab || [], known = S.all('flash').filter(function (f) { return f.known && f.id.indexOf('w:') === 0; }).length, bm = E.bookmarks().length;
      root.innerHTML = UI.head('Flashcards', 'Flip, then mark what you know. Cards you miss come back first.') + '<div class="grid cols-2">' +
        '<section class="sheet mode-card"><span class="mode-icon teal">' + I('language') + '</span><h2>Word list</h2><p class="muted">' + vocab.length + ' words with synonyms and antonyms from the Verbal Reasoning book. You know ' + known + '.</p>' + UI.bar(U.pct(known, vocab.length), 'teal') + '<div class="btn-row" style="margin-top:12px"><a class="btn btn-primary" href="#/flashcards/words">Study words</a></div></section>' +
        '<section class="sheet mode-card"><span class="mode-icon">' + I('bookmark') + '</span><h2>My bookmarks</h2><p class="muted">' + U.plural(bm, 'bookmarked question') + ' as question → answer cards.</p><a class="btn ' + (bm ? 'btn-primary' : '') + '" href="#/flashcards/bookmarks" ' + (bm ? '' : 'aria-disabled="true"') + '>Study bookmarks</a></section></div>';
      return;
    }
    var cards;
    var prep = deck === 'bookmarks' ? B.ensureIds(E.bookmarks().map(function (s) { return s.id; })) : Promise.resolve();
    return prep.then(function () {
      if (deck === 'words') cards = (RAX.vocab || []).map(function (v) { return { id: 'w:' + v.w.toLowerCase(), front: v.w, back: (v.s ? '<p><b>Synonyms:</b> ' + esc(v.s) + '</p>' : '') + (v.a ? '<p><b>Antonyms:</b> ' + esc(v.a) + '</p>' : '') }; });
      else cards = E.bookmarks().map(function (s) { var q = B.get(s.id); return q && { id: 'q:' + q.id, front: q.question, back: '<p><b>' + esc(ansText(q)) + '</b></p>' + (q.explanation ? '<p class="small">' + esc(q.explanation) + '</p>' : '') }; }).filter(Boolean);
      var st = function (c) { return S.get('flash', c.id) || { id: c.id, known: false, seen: 0, ts: 0 }; };
      var queue = U.shuffle(cards).sort(function (a, b) { return (st(a).known ? 1 : 0) - (st(b).known ? 1 : 0) || st(a).ts - st(b).ts; }).slice(0, 40), i = 0, flipped = false, got = 0;
      function render() {
        if (i >= queue.length) { root.innerHTML = UI.head('Round complete', 'You marked ' + got + ' of ' + queue.length + ' as known.') + '<div class="btn-row"><a class="btn btn-primary" href="#/flashcards/' + deck + '" onclick="setTimeout(function(){RAX.app.route()},0)">Another round</a><a class="btn" href="#/flashcards">All decks</a></div>'; if (got === queue.length && queue.length >= 5) U.confetti(); return; }
        var c = queue[i];
        root.innerHTML = '<div class="flash-wrap"><div class="row-between"><a class="btn btn-ghost btn-sm" href="#/flashcards">' + I('chevron-left') + ' Decks</a><span class="muted small num">' + (i + 1) + ' / ' + queue.length + '</span></div>' +
          '<button class="flash ' + (flipped ? 'is-flipped' : '') + '" data-flip aria-label="Flip card"><span class="flash-in"><span class="flash-face front"><span class="' + (deck === 'words' ? 'flash-word' : 'flash-q') + '">' + esc(c.front) + '</span><small class="muted">Tap or press Space to flip</small></span><span class="flash-face back">' + c.back + '</span></span></button>' +
          '<div class="btn-row flash-btns"><button class="btn btn-lg" data-mark="0">' + I('rotate-left') + ' Again</button><button class="btn btn-lg btn-primary" data-mark="1">' + I('check') + ' Got it</button></div></div>';
      }
      function mark(k) { var x = st(queue[i]); x.known = !!k; x.seen++; x.ts = Date.now(); S.put('flash', x); if (k) got++; i++; flipped = false; render(); }
      root.onclick = function (e) {
        if (e.target.closest('[data-flip]')) { flipped = !flipped; U.$('.flash', root).classList.toggle('is-flipped', flipped); }
        var m = e.target.closest('[data-mark]'); if (m) mark(+m.getAttribute('data-mark'));
      };
      RAX.state.keys = function (e) {
        if (e.key === ' ') { e.preventDefault(); var f = U.$('.flash', root); if (f) { flipped = !flipped; f.classList.toggle('is-flipped', flipped); } }
        else if (e.key === 'ArrowRight' || e.key === '2') mark(1); else if (e.key === 'ArrowLeft' || e.key === '1') mark(0);
      };
      if (!queue.length) { root.innerHTML = UI.empty('clone', 'No cards', 'This deck is empty.', '<a class="btn" href="#/flashcards">All decks</a>'); return; }
      render();
    });
  };

  // ───────── mistake journal ─────────
  var REASONS = ['Concept gap', 'Careless slip', 'Misread the question', 'Ran out of time', 'Guessed'];
  V.journal = function (root) {
    var mk = E.mistakes().sort(function (a, b) { return b.lastTs - a.lastTs; });
    return B.ensureIds(mk.map(function (s) { return s.id; })).then(function () {
      var j = {}; S.all('journal').forEach(function (r) { j[r.id] = r; });
      var counts = {}; REASONS.forEach(function (r) { counts[r] = 0; }); Object.keys(j).forEach(function (k) { if (j[k].reason) counts[j[k].reason] = (counts[j[k].reason] || 0) + 1; });
      var tagged = Object.keys(j).filter(function (k) { return j[k].reason; }).length;
      var h = UI.head('Mistake journal', 'Tag why you got each question wrong. Patterns show you what to fix — concepts, care or time.');
      if (tagged) h += '<section class="sheet"><h2>Why you miss questions</h2>' + UI.bars(REASONS.map(function (r) { return { label: r, v: counts[r] }; })) + '</section>';
      h += mk.length ? '<ul class="journal">' + mk.slice(0, 80).map(function (s) {
        var q = B.get(s.id); if (!q) return ''; var r = j[s.id] || {};
        return '<li class="sheet"><p>' + esc(q.question) + '</p><p class="small"><b>Answer:</b> ' + esc(ansText(q)) + ' <span class="muted">· ' + esc(q.subject + ' › ' + q.topic) + '</span></p>' +
          '<div class="j-tags" role="group" aria-label="Reason">' + REASONS.map(function (x) { return '<button class="chip-btn ' + (r.reason === x ? 'is-on' : '') + '" data-j="' + q.id + '" data-r="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div>' +
          '<label class="sr-only" for="jn-' + q.id + '">What will you do differently?</label><input class="input j-note" id="jn-' + q.id + '" data-jn="' + q.id + '" maxlength="300" placeholder="What will you do differently next time?" value="' + esc(r.note || '') + '"></li>';
      }).join('') + '</ul>' : UI.empty('book-open', 'No mistakes to journal', 'Questions you get wrong will appear here so you can tag the reason.');
      root.innerHTML = h;
      function save(id, patch) { var r = Object.assign({ id: id }, S.get('journal', id) || {}, patch, { ts: Date.now() }); S.put('journal', r); }
      root.onclick = function (e) {
        var b = e.target.closest('[data-j]'); if (!b) return;
        save(b.getAttribute('data-j'), { reason: b.getAttribute('data-r') });
        U.$$('[data-j="' + b.getAttribute('data-j') + '"]', root).forEach(function (x) { x.classList.toggle('is-on', x === b); });
      };
      root.oninput = U.debounce(function (e) { var n = e.target.closest('[data-jn]'); if (n) save(n.getAttribute('data-jn'), { note: n.value.trim() }); }, 500);
    });
  };

  // ───────── analytics + readiness ─────────
  V.analytics = function (root) {
    var cat = RAX.state.settings.category, t = E.totals(), byDay = E.byDay(), days = [];
    for (var i = 13; i >= 0; i--) { var d = U.addDays(U.today(), -i); days.push({ label: U.fmtDate(d.replace(/-/g, '/')), short: d.slice(8), v: byDay[d] || 0 }); }
    var subj = E.groupAcc('subject').sort(function (a, b) { return b.answered - a.answered; }), topics = E.groupAcc('topic').filter(function (x) { return x.answered >= 3; }).sort(function (a, b) { return a.accuracy - b.accuracy; });
    var rd = cat ? E.readiness(cat) : null;
    var h = UI.head('Analytics', 'Built only from your own answers on this device.');
    if (!t.answered) { root.innerHTML = h + UI.empty('chart-line', 'No data yet', 'Answer some questions and your charts will appear here.', '<a class="btn btn-primary" href="#/practice?quick=10">Quick 10</a>'); return; }
    h += '<div class="stat-row">' + ['Answered|' + U.fmtNum(t.answered), 'Accuracy|' + t.accuracy + '%', 'Time practising|' + U.fmtDur(t.ms), 'Average per question|' + U.fmtDur(t.ms / t.answered)].map(function (x) { var p = x.split('|'); return '<div class="stat"><span class="st-label">' + p[0] + '</span><b class="st-val num">' + p[1] + '</b></div>'; }).join('') + '</div>';
    if (rd) {
      h += '<section class="sheet readiness"><div class="row-between"><h2>' + I('bullseye') + ' Readiness overview</h2><span class="chip chip-warn">Study indicator — not an HEC prediction</span></div><div class="rd">' + UI.ring(rd.score, 'indicator', 150) + '<div class="rd-parts">' +
        rd.parts.map(function (p) { return '<div><div class="row-between"><b>' + esc(p.name) + '</b><span class="num small">' + p.value + ' · weight ' + Math.round(p.weight * 100) + '%</span></div>' + UI.bar(p.value) + '<p class="small muted">' + esc(p.note) + '</p></div>'; }).join('') + '</div></div>' +
        (rd.enough ? '' : '<p class="small muted">Answer at least 20 questions for this indicator to mean much.</p>') + '<p class="small muted">It only combines your coverage, accuracy, test results and consistency in RAXUSATPrep. It does not predict your USAT score.</p></section>';
    }
    h += '<section class="sheet"><h2>' + I('chart-simple') + ' Answers per day — last 14 days</h2>' + UI.cols(days, { label: 'Answers per day' }) + '</section>';
    h += '<section class="sheet"><h2>' + I('clock') + ' Accuracy and time by subject</h2><div class="table-wrap"><table class="t"><thead><tr><th>Subject</th><th class="n">Answered</th><th class="n">Accuracy</th><th class="n">Avg time</th></tr></thead><tbody>' +
      subj.map(function (g) { return '<tr><td>' + esc(g.key) + '</td><td class="n">' + g.answered + '</td><td class="n">' + g.accuracy + '%</td><td class="n">' + U.fmtDur(g.avgMs) + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
    if (topics.length) h += '<section class="sheet"><h2>' + I('brain') + ' Topics (3+ answers), weakest first</h2>' + UI.bars(topics.slice(0, 15).map(function (g) { return { label: g.key, v: g.accuracy, text: g.accuracy + '% · ' + U.fmtDur(g.avgMs), color: g.accuracy < 50 ? 'var(--bad)' : g.accuracy < 70 ? 'var(--amber)' : 'var(--ok)' }; }), { max: 100 }) + '</section>';
    h += '<section class="sheet"><h2>' + I('calendar-check') + ' Activity — last 12 weeks</h2>' + heatmap(12) + '</section>';
    root.innerHTML = h;
  };

  // ───────── reported questions ─────────
  V.reports = function (root) {
    var list = S.all('reports').sort(function (a, b) { return b.ts - a.ts; }), mail = RAX.config.contact.email;
    var h = UI.head('Reported questions', 'Reports stay on this device. Export them, or email them to the RAXUSATPrep team.');
    if (!list.length) { root.innerHTML = h + UI.empty('flag', 'No reports', 'Use “Report” under any question if something looks wrong.'); return; }
    var body = list.slice(0, 15).map(function (r) { return r.qid + ' (' + r.subject + ', p.' + (r.page || '?') + '): ' + r.reason + (r.details ? ' — ' + r.details : ''); }).join('\n');
    h += '<div class="btn-row" style="margin-bottom:14px"><button class="btn" data-exp="json">' + I('download') + ' Export JSON</button><button class="btn" data-exp="csv">' + I('download') + ' Export CSV</button>' +
      '<a class="btn btn-primary" href="mailto:' + esc(mail) + '?subject=' + encodeURIComponent('RAXUSATPrep question reports (' + list.length + ')') + '&body=' + encodeURIComponent(body.slice(0, 1800)) + '">' + I('envelope') + ' Email reports</a></div>';
    h += '<ul class="lib-list">' + list.map(function (r) { return '<li class="lib-q"><div><p><b>' + esc(r.reason) + '</b> <span class="muted small">' + esc(r.qid) + ' · ' + esc(U.fmtDateTime(r.ts)) + '</span></p><p class="small">' + esc(r.question) + '</p>' + (r.details ? '<p class="small muted">' + esc(r.details) + '</p>' : '') + '<button class="btn btn-sm btn-ghost" data-delrep="' + r.id + '">' + I('trash-can') + ' Delete</button></div></li>'; }).join('') + '</ul>';
    root.innerHTML = h;
    root.onclick = function (e) {
      var x = e.target.closest('[data-exp]');
      if (x) {
        if (x.getAttribute('data-exp') === 'json') U.download('raxusatprep-reports.json', JSON.stringify(list, null, 2), 'application/json');
        else { var csv = 'id,question_id,subject,page,reason,details,date\n' + list.map(function (r) { return [r.id, r.qid, r.subject, r.page, r.reason, r.details, new Date(r.ts).toISOString()].map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'); U.download('raxusatprep-reports.csv', csv, 'text/csv'); }
      }
      var d = e.target.closest('[data-delrep]'); if (d) { S.del('reports', d.getAttribute('data-delrep')); RAX.app._noFocus = true; RAX.app.route(); }
    };
  };

  // ───────── settings ─────────
  V.settings = function (root) {
    var s = RAX.state.settings, c = RAX.config, unv = 0, cat = s.category ? B.cat(s.category) : null;
    Object.keys(RAX.bankManifest.sets).forEach(function (k) { unv += RAX.bankManifest.sets[k].needsReview; });
    var neg = s.negativeMarking == null ? c.negativeMarking.enabled : s.negativeMarking;
    function sw(id, label, on, hint) { return '<label class="switch"><input type="checkbox" id="' + id + '" ' + (on ? 'checked' : '') + '><span class="track"></span><span><b>' + label + '</b>' + (hint ? '<br><small class="muted">' + hint + '</small>' : '') + '</span></label>'; }
    var h = UI.head('Settings', 'Everything is stored only in this browser on this device.');
    h += '<section class="sheet"><h2>Appearance</h2><div class="seg" role="radiogroup" aria-label="Theme">' + [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(function (t) {
      return '<label><input type="radio" name="theme" value="' + t[0] + '" ' + (s.theme === t[0] ? 'checked' : '') + '><span>' + t[1] + '</span></label>'; }).join('') + '</div>' +
      sw('setMotion', 'Reduce motion', s.reduceMotion, 'Turns off animations. Your system setting is respected either way.') + sw('setFx', 'Celebration effects', s.effects !== false, 'Confetti after strong results.') + '</section>';
    h += '<section class="sheet"><h2>Practice and tests</h2>' + sw('setUnv', 'Show practice-only questions', s.showUnverified, U.fmtNum(unv) + ' questions have options the scan garbled or no correct printed option. They are labelled, show the checked answer, and are never used in tests. All questions are always in the Question bank.') +
      sw('setNeg', 'Negative marking in tests', neg, 'Deducts ' + c.negativeMarking.perWrong + ' per wrong answer. Default: ' + (c.negativeMarking.enabled ? 'on' : 'off') + ' (set in exam-config.js).') +
      '<p><b>Category:</b> ' + (cat ? esc(cat.id + ' — ' + cat.label) : 'not chosen') + ' <button class="btn btn-sm" data-action="switch-category">Change</button></p></section>';
    h += '<section class="sheet"><h2>Your data</h2><p>' + (RAX.store.mode === 'indexeddb' ? '<span class="chip chip-ok">' + I('circle-check') + ' Saving to this browser (IndexedDB)</span>' : '<span class="chip chip-bad">' + I('triangle-exclamation') + ' Not saving — storage blocked</span>') + '</p>' +
      '<p class="small muted">' + U.fmtNum(RAX.store.count('attempts')) + ' practice answers · ' + U.fmtNum(RAX.store.count('mocks')) + ' tests · ' + U.fmtNum(RAX.store.count('essays')) + ' essays · ' + U.fmtNum(RAX.store.count('qstate')) + ' questions tracked</p>' +
      '<div class="btn-row"><button class="btn btn-primary" id="doExport">' + I('download') + ' Export backup</button><label class="btn" for="impFile">' + I('upload') + ' Import backup</label><input type="file" id="impFile" accept="application/json,.json" class="sr-only"></div>' +
      '<p class="small muted">Use a backup to move your progress to another browser or device.</p><hr class="hr"><h3>Danger zone</h3><button class="btn btn-danger" id="doClear">' + I('trash-can') + ' Clear all my data</button></section>';
    h += '<section class="sheet"><h2>Keyboard shortcuts</h2><dl class="pairs"><dt><kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd></dt><dd>Choose an option</dd><dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Previous / next question</dd><dt><kbd>F</kbd></dt><dd>Flag a question in a test</dd><dt><kbd>Enter</kbd></dt><dd>Next question after answering (practice)</dd><dt><kbd>Space</kbd></dt><dd>Flip a flashcard</dd></dl></section>';
    h += '<section class="sheet"><h2>About</h2><p class="small">' + esc(RAX.disclaimer) + '</p><p class="small muted">Question bank built ' + esc(RAX.bankManifest.built) + ' · pattern last checked ' + esc(U.fmtDate(c.patternLastChecked)) + ' · <a href="../privacy/">Privacy</a> · <a href="../about/">About</a></p>' +
      '<div class="contact-list contact-inline">' + RAX.ui.contacts() + '</div>' + RAX.ui.maker('light') + '</section>';
    root.innerHTML = h;
    U.$$('input[name=theme]').forEach(function (r) { r.onchange = function () { RAX.app.saveSettings({ theme: r.value }).then(RAX.app.applyTheme); }; });
    U.$('#setMotion').onchange = function () { RAX.app.saveSettings({ reduceMotion: this.checked }).then(RAX.app.applyTheme); };
    U.$('#setFx').onchange = function () { RAX.app.saveSettings({ effects: this.checked }); };
    U.$('#setUnv').onchange = function () { RAX.app.saveSettings({ showUnverified: this.checked }); U.toast(this.checked ? 'Unverified questions will appear in practice, labelled.' : 'Only verified questions in practice.', 'circle-info'); };
    U.$('#setNeg').onchange = function () { RAX.app.saveSettings({ negativeMarking: this.checked }); };
    U.$('#doExport').onclick = function () { U.download('raxusatprep-backup-' + U.today() + '.json', JSON.stringify(RAX.store.exportAll()), 'application/json'); U.toast('Backup downloaded', 'download'); };
    U.$('#impFile').onchange = function () {
      var f = this.files[0]; if (!f) return; var input = this;
      if (f.size > 50 * 1024 * 1024) { U.toast('That file is too large to be a backup.', 'triangle-exclamation'); return; }
      var rd = new FileReader();
      rd.onload = function () {
        var data; try { data = JSON.parse(rd.result); } catch (e) { U.modal('<h2>Cannot import</h2><p>The file is not valid JSON.</p><div class="btn-row" style="justify-content:flex-end"><button class="btn" data-close>Close</button></div>'); input.value = ''; return; }
        var errs = RAX.store.validate(data);
        if (errs.length) { U.modal('<h2>Cannot import</h2><ul>' + errs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><div class="btn-row" style="justify-content:flex-end"><button class="btn" data-close>Close</button></div>'); input.value = ''; return; }
        var counts = Object.keys(data.stores).map(function (k) { return esc(k) + ': ' + data.stores[k].length; }).join(' · ');
        var md = U.modal('<h2>Import backup</h2><p class="small muted">From ' + esc(data.exported || 'unknown date') + '<br>' + counts + '</p><p><b>Merge</b> keeps your current data and adds the backup (newer records win). <b>Replace</b> deletes what is here first.</p>' +
          '<div class="btn-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Cancel</button><button class="btn" id="impMerge">Merge</button><button class="btn btn-danger" id="impRepl">Replace</button></div>', { label: 'Import' });
        function run(mode) { md.close(); RAX.store.importData(data, mode).then(function (c) { var n = Object.keys(c).reduce(function (a, k) { return a + c[k]; }, 0); RAX.state.settings = RAX.store.settings(); RAX.app.applyTheme(); RAX.ui.renderTop(); U.toast('Imported ' + n + ' records', 'upload'); RAX.app.route(); }).catch(function (e) { U.toast(e.message, 'triangle-exclamation', 5000); }); input.value = ''; }
        U.$('#impMerge', md.el).onclick = function () { run('merge'); }; U.$('#impRepl', md.el).onclick = function () { run('replace'); };
      };
      rd.readAsText(f);
    };
    U.$('#doClear').onclick = function () {
      U.confirm('Clear all your data?', 'This deletes your answers, tests, essays, notes, bookmarks and settings from this browser. Export a backup first if you might want them back.', 'Continue', true).then(function (ok) {
        if (!ok) return;
        var md = U.modal('<h2>Are you sure?</h2><p>Type <b>DELETE</b> to confirm.</p><label class="sr-only" for="delTxt">Type DELETE</label><input id="delTxt" class="input" autocomplete="off"><div class="btn-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Cancel</button><button class="btn btn-danger" id="delGo" disabled>Delete everything</button></div>', { label: 'Confirm delete' });
        var inp = U.$('#delTxt', md.el), go = U.$('#delGo', md.el);
        inp.oninput = function () { go.disabled = inp.value.trim() !== 'DELETE'; };
        go.onclick = function () { RAX.store.clearAll().then(function () { md.close(); try { localStorage.removeItem('rax-theme'); } catch (e) { } location.hash = '#/start'; location.reload(); }); };
      });
    };
  };
})();
