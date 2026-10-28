/* RAXUSATPrep — category chooser, dashboard, "more" menu. */
(function () {
  'use strict';
  var RAX = window.RAX, U = RAX.util, S = RAX.store, B = RAX.bank, E = RAX.engine, UI = RAX.ui, I = RAX.icon, esc = U.esc, V = RAX.views = RAX.views || {};
  var CAT_ICON = { 'USAT-M': 'heart-pulse', 'USAT-E': 'gears', 'USAT-CS': 'microchip', 'USAT-GS': 'atom', 'USAT-A': 'landmark', 'USAT-COM': 'scale-balanced' };
  var GROUPS = [['FSc Pre-Medical', 'USAT-M'], ['FSc Pre-Engineering', 'USAT-E'], ['ICS (Computer Science)', 'USAT-CS'], ['General Science (Maths, Stats, Economics)', 'USAT-GS'], ['FA / Humanities', 'USAT-A'], ['I.Com (Commerce)', 'USAT-COM']];

  function catCard(c, cur) {
    var subs = B.subjectsFor(c.id), ready = subs.filter(function (s) { return s.available; });
    var status = ready.length === subs.length ? '<span class="chip chip-ok">' + I('circle-check') + ' Full mocks ready</span>'
      : '<span class="chip chip-warn">' + I('triangle-exclamation') + ' ' + (ready.length ? ready.length + ' of 3 subjects in bank' : 'Subjects not in bank yet') + '</span>';
    return '<button class="cat-card ' + (cur === c.id ? 'is-on' : '') + '" data-pick="' + c.id + '" style="--c:' + c.color + '">' +
      '<span class="cc-icon">' + I(CAT_ICON[c.id] || 'book') + '</span><span class="cc-name">' + esc(c.id) + '</span><span class="cc-label">' + esc(c.label) + '</span>' +
      '<span class="cc-subs">' + subs.map(function (s) { return '<span class="' + (s.available ? '' : 'na') + '">' + esc(s.subject) + ' <b class="num">' + s.count + '</b></span>'; }).join('') + '</span>' +
      '<span class="cc-status">' + status + '</span></button>';
  }

  V.start = function (root, params, query) {
    var cur = RAX.state.settings.category;
    if (query && query.cat && B.cat(query.cat) && query.cat !== cur) { RAX.app.setCategory(query.cat).then(function () { location.replace('#/dashboard'); }); return; }
    if (query && query.cat && query.cat === cur) { location.replace('#/dashboard'); return; }
    root.innerHTML = '<section class="start">' +
      '<div class="start-head"><img src="../assets/img/logo-mark.svg" alt="" width="64" height="64" class="start-mark"><h1>Which USAT are you taking?</h1>' +
      '<p class="muted">Every category shares Verbal and Quantitative Reasoning (45 MCQs). The last 30 MCQs depend on your intermediate subjects. You can switch any time — progress is kept per question.</p></div>' +
      '<div class="cat-grid">' + RAX.config.categories.map(function (c) { return catCard(c, cur); }).join('') + '</div>' +
      '<div class="start-help sheet"><h2>' + I('circle-question') + ' Not sure?</h2><p class="muted">Pick your intermediate group and we will suggest a category.</p><div class="btn-row" id="grpRow">' +
      GROUPS.map(function (g) { return '<button class="btn btn-sm" data-group="' + g[1] + '">' + esc(g[0]) + '</button>'; }).join('') + '</div><div id="grpOut" aria-live="polite"></div></div>' +
      '<div class="btn-row start-foot"><button class="btn" data-act="compare">' + I('table-list') + ' Compare all categories</button><button class="btn btn-ghost" data-act="skip">Skip for now</button></div>' +
      '<p class="small muted">' + esc(RAX.config.patternNote) + '</p></section>';
    root.onclick = function (e) {
      var p = e.target.closest('[data-pick]'); if (p) { RAX.app.setCategory(p.getAttribute('data-pick')); return; }
      var g = e.target.closest('[data-group]');
      if (g) {
        var c = B.cat(g.getAttribute('data-group'));
        U.$('#grpOut').innerHTML = '<div class="suggest" style="--c:' + c.color + '"><p>We suggest <b>' + esc(c.id) + ' — ' + esc(c.label) + '</b>. ' + esc(c.blurb) + '</p>' +
          '<p class="small muted">This is a suggestion only. Universities set their own requirements — check the programme you are applying to and the official HEC/ETC notice.</p><button class="btn btn-primary btn-sm" data-pick="' + c.id + '">Use ' + esc(c.id) + '</button></div>';
        return;
      }
      var a = e.target.closest('[data-act]'); if (!a) return;
      if (a.getAttribute('data-act') === 'skip') { RAX.app.saveSettings({ skipped: true }).then(function () { location.hash = '#/dashboard'; }); }
      if (a.getAttribute('data-act') === 'compare') compareModal();
    };
  };
  function compareModal() {
    var cats = RAX.config.categories, subjects = [];
    cats.forEach(function (c) { c.subjects.forEach(function (s) { if (subjects.indexOf(s.subject) < 0) subjects.push(s.subject); }); });
    var rows = '<tr><td>Verbal Reasoning</td>' + cats.map(function () { return '<td class="n">20</td>'; }).join('') + '</tr><tr><td>Quantitative Reasoning</td>' + cats.map(function () { return '<td class="n">25</td>'; }).join('') + '</tr>' +
      subjects.map(function (s) { return '<tr><td>' + esc(s) + '</td>' + cats.map(function (c) { var x = c.subjects.filter(function (y) { return y.subject === s; })[0]; return '<td class="n">' + (x ? x.count : '—') + '</td>'; }).join('') + '</tr>'; }).join('') +
      '<tr><td><b>Total MCQs</b></td>' + cats.map(function () { return '<td class="n"><b>75</b></td>'; }).join('') + '</tr>';
    U.modal('<h2>Compare all categories</h2><p class="muted small">Part I: 75 MCQs in 100 minutes. Part II (essays, 40 minutes) is the same for everyone.</p><div class="table-wrap"><table class="t"><thead><tr><th>Section / subject</th>' +
      cats.map(function (c) { return '<th class="n">' + esc(c.id) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div><div class="btn-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Close</button></div>', { wide: true, label: 'Compare categories' });
  }

  function greet() { var h = new Date().getHours(); return h < 5 ? 'Late-night study' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }

  V.dashboard = function (root) {
    var s = RAX.state.settings, cat = s.category, c = cat ? B.cat(cat) : null, p = E.progress(), t = p.totals;
    var due = E.due().length, mistakes = E.mistakes().length;
    var activeSess = S.all('sessions').filter(function (x) { return x.status === 'active'; }).sort(function (a, b) { return b.updated - a.updated; })[0];
    var am = E.activeMock();
    var dk = 'daily:' + U.today() + ':' + (cat || 'common'), daily = S.get('kv', dk);
    var mocks = E.doneMocks().slice(-8);
    var weak = E.weakTopics(5, cat);
    var cov = cat ? E.coverage(cat) : null;
    var lvlPct = Math.round((p.xp - p.levelBase) / (p.levelNext - p.levelBase) * 100);
    var exam = s.examDate ? U.daysBetween(U.today(), s.examDate) : null;

    var h = '<div class="dash">';
    h += '<header class="dash-hero"><div class="dh-text"><p class="dh-date">' + esc(new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })) + '</p><h1>' + greet() + '.</h1>' +
      '<p class="ink2">' + (t.answered ? 'You have answered <b class="num">' + U.fmtNum(t.answered) + '</b> questions so far' + (p.streak ? ' and you are on a <b>' + U.plural(p.streak, 'day') + '</b> streak' : '') + '.' : 'Your dashboard fills in as you practise. Start with a quick set of 10 questions.') + '</p>' +
      '<div class="btn-row">' + (activeSess ? '<a class="btn btn-amber" href="#/session/' + activeSess.id + '">' + I('play') + ' Resume ' + esc(activeSess.title) + '</a>' : '<a class="btn btn-amber" href="#/practice?quick=10">' + I('bolt') + ' Quick 10</a>') +
      (am ? '<a class="btn btn-primary" href="#/exam/' + am.id + '">' + I('stopwatch') + ' Back to your test</a>' : '<a class="btn" href="#/mocks">' + I('stopwatch') + ' Take a test</a>') + '</div></div>' +
      '<div class="dh-level" title="Level and XP come from your real activity">' + UI.ring(lvlPct, 'to level ' + (p.level + 1), 128) + '<div><b class="lvl">Level ' + p.level + '</b><span class="muted small num">' + U.fmtNum(p.xp) + ' XP</span></div></div></header>';

    if (exam != null && exam >= 0) h += '<div class="countdown">' + I('hourglass-half') + '<span><b class="num">' + exam + '</b> ' + (exam === 1 ? 'day' : 'days') + ' to your test date (' + esc(U.fmtDate(s.examDate)) + ')</span><a href="#/planner">Planner</a></div>';

    h += '<div class="stat-row">' +
      stat('pen-to-square', 'Answered', t.answered, '', 'practice questions') +
      stat('bullseye', 'Accuracy', t.accuracy == null ? null : t.accuracy, '%', t.answered ? U.fmtNum(t.correct) + ' correct' : 'no answers yet') +
      stat('fire', 'Streak', p.streak, '', p.streak === 1 ? 'day' : 'days') +
      stat('rotate', 'Due today', due, '', mistakes + ' in mistakes', due ? '#/revision' : null) + '</div>';

    h += '<div class="dash-grid">';
    // daily challenge
    h += '<section class="sheet daily-card"><div class="row-between"><h2>' + I('calendar-day') + ' Daily challenge</h2><span class="chip ' + (daily && daily.done ? 'chip-ok' : 'chip-amber') + '">' + (daily && daily.done ? 'Done · ' + daily.score + '/' + daily.total : '10 questions') + '</span></div>' +
      '<p class="muted">The same 10 questions for everyone in ' + esc(cat || 'every category') + ' today. A new set appears at midnight.</p>' +
      '<a class="btn ' + (daily && daily.done ? '' : 'btn-primary') + '" href="#/daily">' + (daily && daily.done ? 'Review today’s set' : 'Start today’s challenge') + '</a></section>';
    // quote
    h += '<section class="sheet quote-sheet">' + UI.quote() + '</section>';
    // coverage
    if (cov) {
      h += '<section class="sheet"><h2>' + I('layer-group') + ' Coverage in ' + esc(cat) + '</h2><p class="muted small">Verified questions you have answered at least once.</p><div class="cov">' +
        Object.keys(cov).map(function (k) { var x = cov[k]; return '<div class="cov-row"><div class="row-between"><span>' + esc(k) + '</span><span class="num small muted">' + U.fmtNum(x.done) + ' / ' + U.fmtNum(x.total) + '</span></div>' + UI.bar(U.pct(x.done, x.total)) + '</div>'; }).join('') +
        B.subjectsFor(cat).filter(function (x) { return !x.available; }).map(function (x) { return '<div class="cov-row na"><div class="row-between"><span>' + esc(x.subject) + '</span><span class="small muted">not in the bank yet</span></div></div>'; }).join('') + '</div></section>';
    }
    // tests chart
    h += '<section class="sheet"><div class="row-between"><h2>' + I('chart-line') + ' Recent tests</h2><a href="#/mocks" class="small">Mock centre</a></div>' +
      (mocks.length ? UI.line(mocks.map(function (m) { return { label: U.fmtDate(m.submitted) + ' · ' + m.title, v: m.result.percent }; }), { max: 100, unit: '%', label: 'Scores of your recent tests' }) +
        '<p class="small muted">Last: ' + esc(mocks[mocks.length - 1].title) + ' — ' + mocks[mocks.length - 1].result.correct + '/' + mocks[mocks.length - 1].result.total + '</p>'
        : '<p class="muted">Finish a test to see your scores here.</p><a class="btn btn-sm" href="#/mocks">Open mock centre</a>') + '</section>';
    // weak topics
    h += '<section class="sheet"><h2>' + I('brain') + ' Topics to work on</h2>' + (weak.length ? '<ul class="weak">' + weak.map(function (w) {
      return '<li><span>' + esc(w.key) + '</span><span class="chip ' + (w.accuracy < 50 ? 'chip-bad' : 'chip-warn') + ' num">' + w.accuracy + '%</span><a class="btn btn-sm" href="#/practice?topic=' + encodeURIComponent(w.key) + '">Practise</a></li>';
    }).join('') + '</ul>' : '<p class="muted">After 5+ answers in a topic, your weakest topics show up here.</p>') + '</section>';
    // achievements
    h += '<section class="sheet ach-sheet"><div class="row-between"><h2>' + I('award') + ' Achievements</h2><span class="small muted">' + p.badges.filter(function (b) { return b.got; }).length + ' of ' + p.badges.length + '</span></div><div class="badges">' +
      p.badges.map(function (b) { return '<div class="badge ' + (b.got ? 'got' : '') + '" title="' + esc(b.desc) + '">' + I(b.icon) + '<b>' + esc(b.name) + '</b><span>' + esc(b.desc) + '</span>' + (!b.got && b.prog ? UI.bar(U.pct(Math.min(b.prog[0], b.prog[1]), b.prog[1]), 'amber') : '') + '</div>'; }).join('') + '</div></section>';
    h += '</div>';
    if (!cat) h += '<div class="sheet nocat">' + I('circle-info') + '<p>You have not chosen a category, so only Verbal and Quantitative Reasoning are shown. <a href="#/start">Choose your category</a> to add your subjects and full mocks.</p></div>';
    h += UI.maker('light') + '</div>';
    root.innerHTML = h;
  };
  function stat(icon, label, val, suffix, sub, href) {
    var inner = '<span class="st-icon">' + I(icon) + '</span><span class="st-label">' + label + '</span><b class="st-val num"' + (val != null ? ' data-count-to="' + val + '" data-suffix="' + suffix + '"' : '') + '>' + (val == null ? '—' : '0' + suffix) + '</b><span class="st-sub">' + esc(sub) + '</span>';
    return href ? '<a class="stat" href="' + href + '">' + inner + '</a>' : '<div class="stat">' + inner + '</div>';
  }

  V.more = function (root) {
    root.innerHTML = UI.head('Everything', 'All parts of RAXUSATPrep in one place.') + '<div class="more-grid">' +
      UI.NAV.map(function (g) { return g.items.map(function (it) { return '<a class="more-link" href="#/' + it[0] + '">' + I(it[2]) + '<span>' + esc(it[1]) + '</span></a>'; }).join(''); }).join('') +
      '<a class="more-link" href="#/start">' + I('graduation-cap') + '<span>Change category</span></a><a class="more-link" href="../index.html">' + I('house-chimney') + '<span>Website</span></a></div>' + UI.maker('light');
  };
  V.notfound = function (root) { root.innerHTML = UI.empty('compass', 'Page not found', 'That page does not exist in the app.', '<a class="btn btn-primary" href="#/dashboard">Go to dashboard</a>'); };
})();
