/* RAXUSATPrep — shared UI pieces: shell, question card, charts, quotes, category badge. */
(function () {
  'use strict';
  var RAX = window.RAX, U = RAX.util, esc = U.esc, I = RAX.icon, B = RAX.bank, E = RAX.engine;
  var UI = RAX.ui = {};

  UI.NAV = [
    { group: 'Learn', items: [['dashboard', 'Dashboard', 'house'], ['practice', 'Practice', 'pen-to-square'], ['bank', 'Question bank', 'book'], ['revision', 'Revision', 'rotate'], ['explore', 'Topic explorer', 'compass']] },
    { group: 'Test', items: [['mocks', 'Mock centre', 'stopwatch'], ['daily', 'Daily challenge', 'calendar-day'], ['essays', 'Essays', 'feather-pointed']] },
    { group: 'Track', items: [['library', 'Library', 'bookmark'], ['planner', 'Planner', 'calendar-check'], ['flashcards', 'Flashcards', 'clone'], ['journal', 'Mistake journal', 'book-open'], ['analytics', 'Analytics', 'chart-line'], ['reports', 'Reported questions', 'flag']] },
    { group: '', items: [['settings', 'Settings', 'gear']] }
  ];
  UI.BOTTOM = [['dashboard', 'Home', 'house'], ['practice', 'Practice', 'pen-to-square'], ['mocks', 'Mocks', 'stopwatch'], ['essays', 'Essays', 'feather-pointed'], ['more', 'More', 'grip']];

  UI.shell = function () {
    var side = '<a class="side-logo" href="#/dashboard" aria-label="RAXUSATPrep dashboard"><img src="../assets/img/logo-dark.svg" alt="RAXUSATPrep" width="190" height="40"></a><nav aria-label="App">' +
      UI.NAV.map(function (g) {
        return (g.group ? '<div class="side-group">' + esc(g.group) + '</div>' : '<div class="side-sep"></div>') + g.items.map(function (it) {
          return '<a class="side-link" href="#/' + it[0] + '" data-nav="' + it[0] + '">' + I(it[2]) + '<span>' + esc(it[1]) + '</span><b class="side-count" data-count="' + it[0] + '"></b></a>';
        }).join('');
      }).join('') + '</nav><a class="side-link side-site" href="../index.html">' + I('house-chimney') + '<span>Back to website</span></a>' +
      '<a class="side-maker" href="' + esc(RAX.config.contact.linkedin) + '" target="_blank" rel="noopener">Made with <span class="heart" aria-label="love">♥</span> by Rohail Ahmed Sial</a>';
    U.$('.app-side').innerHTML = side;
    U.$('.bottom-nav').innerHTML = UI.BOTTOM.map(function (it) { return '<a href="#/' + it[0] + '" data-nav="' + it[0] + '">' + I(it[2]) + '<span>' + it[1] + '</span></a>'; }).join('');
    UI.renderTop();
  };
  UI.renderTop = function () {
    var s = RAX.state.settings, c = s.category ? B.cat(s.category) : null, p = E.progress();
    U.$('.app-top').innerHTML =
      '<a class="top-logo" href="#/dashboard" aria-label="Dashboard"><img src="../assets/img/logo-mark.svg" alt="" width="34" height="34"></a>' +
      '<button class="cat-badge" data-action="switch-category" aria-label="Change category">' +
        (c ? '<i style="background:' + c.color + '"></i><b>' + esc(c.id) + '</b><span class="hide-sm">' + esc(c.label) + '</span>' : '<i></i><b>Choose category</b>') + I('chevron-down') + '</button>' +
      '<div class="top-right">' +
        '<span class="save-ind" id="saveInd" title="' + (RAX.store.mode === 'indexeddb' ? 'Progress is saved on this device' : 'Progress is kept only until you close this tab') + '">' + I(RAX.store.mode === 'indexeddb' ? 'circle-check' : 'triangle-exclamation') + '<span>' + (RAX.store.mode === 'indexeddb' ? 'Saved' : 'Not saved') + '</span></span>' +
        '<a class="streak" href="#/analytics" title="Study streak: ' + p.streak + ' day(s)">' + I('fire') + '<b class="num">' + p.streak + '</b></a>' +
        '<button class="btn btn-ghost btn-icon" data-action="toggle-theme" aria-label="Switch light or dark theme">' + I('circle-half-stroke') + '</button>' +
      '</div>';
  };
  UI.setActive = function (name) {
    U.$$('[data-nav]').forEach(function (a) { var on = a.getAttribute('data-nav') === name; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    var due = E.due().length, el = U.$('[data-count="revision"]'); if (el) el.textContent = due ? due : '';
  };
  UI.flashSaved = function () {
    var el = U.$('#saveInd'); if (!el) return;
    el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
  };

  // ── page head ──
  UI.head = function (title, sub, actions) {
    return '<header class="page-head"><div><h1>' + esc(title) + '</h1>' + (sub ? '<p class="muted">' + sub + '</p>' : '') + '</div>' + (actions ? '<div class="btn-row">' + actions + '</div>' : '') + '</header>';
  };
  UI.empty = function (icon, title, text, action) {
    return '<div class="empty">' + I(icon) + '<h3>' + esc(title) + '</h3><p class="muted">' + text + '</p>' + (action || '') + '</div>';
  };

  // ── question card ──
  UI.letters = ['A', 'B', 'C', 'D', 'E'];
  UI.questionMeta = function (q, extra) {
    var chips = '<span class="chip chip-indigo">' + esc(q.subject) + '</span><span class="chip">' + esc(q.topic) + '</span><span class="chip" title="Estimated difficulty">' + esc(q.difficulty) + '</span>';
    if (q.status !== 'verified') chips += '<span class="chip chip-warn" title="Options unclear in the scan or no correct option printed — kept out of tests">' + I('triangle-exclamation') + ' Unverified</span>';
    if (q.optionsSource === 'generated') chips += '<span class="chip chip-teal" title="Built from the book\'s word list; wrong options written by RAXUSATPrep">Word list</span>';
    return '<div class="q-meta">' + chips + (extra || '') + '</div>';
  };
  UI.passage = function (q, open) {
    if (!q.passageId) return '';
    var p = B.passage(q.passageId); if (!p) return '';
    return '<details class="passage" ' + (open !== false ? 'open' : '') + '><summary>' + I('book-open') + ' Read the passage <span class="muted">(' + esc(p.title) + ')</span></summary><p>' + esc(p.text) + '</p></details>';
  };
  /** options: order = array of option ids; state: {chosen, reveal} */
  UI.options = function (q, order, st) {
    order = order || q.options.map(function (o) { return o.id; });
    var byId = {}; q.options.forEach(function (o) { byId[o.id] = o; });
    return '<div class="opts" role="radiogroup" aria-label="Answer options">' + order.map(function (id, i) {
      var o = byId[id]; if (!o) return '';
      var cls = 'opt', bub = 'bubble', mark = '';
      var isChosen = st.chosen === id, isRight = q.answer === id;
      if (st.reveal) {
        if (isRight) { cls += ' is-ok'; bub += ' is-ok'; mark = '<span class="opt-mark ok">' + I('check') + ' Correct answer</span>'; }
        else if (isChosen) { cls += ' is-bad'; bub += ' is-bad'; mark = '<span class="opt-mark bad">' + I('xmark') + ' Your answer</span>'; }
        else cls += ' is-dim';
      } else if (isChosen) { cls += ' is-chosen'; bub += ' is-filled'; }
      return '<button type="button" class="' + cls + '" role="radio" aria-checked="' + isChosen + '" data-opt="' + id + '" data-pos="' + i + '"' + (st.reveal ? ' disabled' : '') + '>' +
        '<span class="' + bub + '"><span>' + UI.letters[i] + '</span></span><span class="opt-text">' + esc(o.text) + '</span>' + mark + '</button>';
    }).join('') + '</div>';
  };
  UI.feedback = function (q, chosen) {
    var ok = q.answer && chosen === q.answer;
    var h = '<div class="feedback ' + (ok ? 'ok' : 'bad') + '" role="status">' +
      '<div class="fb-head">' + I(ok ? 'circle-check' : 'circle-info') + '<b>' + (ok ? UI.praise() : (q.answer ? 'Not quite — the right answer is marked.' : 'None of the printed options is correct.')) + '</b></div>';
    if (q.explanation) h += '<div class="fb-expl"><span class="fb-label">' + (q.explanationSource === 'generated' ? 'RAXUSATPrep explanation' : 'Explanation') + '</span><p>' + esc(q.explanation) + '</p></div>';
    if ((q.tags || []).indexOf('corrected-key') >= 0) h += '<p class="small muted">' + I('pencil') + ' The book’s printed key is wrong here — this is the corrected answer from the checked edition.</p>';
    else if (q.answerSource === 'solved' && q.status === 'verified') h += '<p class="small muted">' + I('calculator') + ' The book marks no answer here; RAXUSATPrep worked it out.</p>';
    if (q.status !== 'verified' || !q.answer) h += '<p class="fb-checked"><b>Checked answer:</b> ' + esc(RAX.bankAnswer ? RAX.bankAnswer(q) : '') + '</p>';
    if (q.status !== 'verified' && q.reviewNote) h += '<div class="fb-review">' + I('triangle-exclamation') + '<p><b>Practice only:</b> ' + esc(q.reviewNote.replace(/\s*Checked answer:.*$/, '')) + ' It is kept out of tests.</p></div>';
    return h + '</div>';
  };
  var PRAISE = ['Correct!', 'Nailed it!', 'Spot on.', 'Right answer!', 'Well done.', 'Exactly right.'];
  UI.praise = function () { return PRAISE[Math.floor(Math.random() * PRAISE.length)]; };
  UI.qTools = function (q) {
    var st = E.qs(q.id);
    return '<div class="q-tools">' +
      '<button class="btn btn-sm btn-ghost" data-action="bookmark" data-q="' + q.id + '" aria-pressed="' + !!st.bm + '">' + I(st.bm ? 'bookmark' : 'bookmark-o') + '<span>' + (st.bm ? 'Bookmarked' : 'Bookmark') + '</span></button>' +
      '<button class="btn btn-sm btn-ghost" data-action="note" data-q="' + q.id + '">' + I('note-sticky') + '<span>' + (st.note ? 'Edit note' : 'Add note') + '</span></button>' +
      '<button class="btn btn-sm btn-ghost" data-action="report" data-q="' + q.id + '">' + I('flag') + '<span>Report</span></button>' +
      '<span class="q-src muted small">Source page ' + esc(q.source.page || '—') + ' · ' + esc(q.id) + '</span></div>';
  };

  // ── charts (SVG, real data only) ──
  UI.line = function (pts, o) {
    o = o || {}; var w = o.w || 560, h = o.h || 180, pad = 28, max = o.max || Math.max.apply(null, pts.map(function (p) { return p.v; }).concat([1]));
    if (!pts.length) return '';
    var step = pts.length > 1 ? (w - pad * 2) / (pts.length - 1) : 0;
    var xy = pts.map(function (p, i) { return [pad + i * step, h - pad - (p.v / max) * (h - pad * 2)]; });
    var d = xy.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = d + ' L' + xy[xy.length - 1][0].toFixed(1) + ' ' + (h - pad) + ' L' + pad + ' ' + (h - pad) + ' Z';
    var grid = [0, .5, 1].map(function (k) { var y = h - pad - k * (h - pad * 2); return '<line x1="' + pad + '" x2="' + (w - pad) + '" y1="' + y + '" y2="' + y + '" class="grid"/><text x="4" y="' + (y + 4) + '" class="axis">' + Math.round(max * k) + (o.unit || '') + '</text>'; }).join('');
    return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(o.label || 'Chart') + '">' + grid +
      '<path d="' + area + '" class="area"/><path d="' + d + '" class="stroke"/>' +
      xy.map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" class="dot"><title>' + esc(pts[i].label + ': ' + pts[i].v + (o.unit || '')) + '</title></circle>'; }).join('') + '</svg>';
  };
  UI.bars = function (items, o) {
    o = o || {}; var max = o.max || Math.max.apply(null, items.map(function (i) { return i.v; }).concat([1]));
    return '<div class="hbars">' + items.map(function (it) {
      return '<div class="hbar"><span class="hb-l">' + esc(it.label) + '</span><span class="hb-t"><i style="width:' + Math.max(2, it.v / max * 100) + '%;' + (it.color ? 'background:' + it.color : '') + '"></i></span><span class="hb-v num">' + esc(it.text != null ? it.text : it.v) + '</span></div>';
    }).join('') + '</div>';
  };
  UI.cols = function (items, o) {
    o = o || {}; var max = Math.max.apply(null, items.map(function (i) { return i.v; }).concat([1]));
    return '<div class="vbars" role="img" aria-label="' + esc(o.label || 'Chart') + '">' + items.map(function (it) {
      return '<div class="vbar" title="' + esc(it.label + ': ' + it.v) + '"><i style="height:' + (it.v / max * 100) + '%"></i><span>' + esc(it.short || it.label) + '</span></div>';
    }).join('') + '</div>';
  };
  UI.ring = function (pct, label, size) {
    size = size || 120; var r = size / 2 - 9, c = 2 * Math.PI * r, v = pct == null ? 0 : U.clamp(pct, 0, 100);
    return '<div class="ring" style="width:' + size + 'px;height:' + size + 'px"><svg viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="ring-bg"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="ring-fg" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + c.toFixed(1) + '" data-offset="' + (c * (1 - v / 100)).toFixed(1) + '"/></svg>' +
      '<div class="ring-txt"><b class="num">' + (pct == null ? '—' : v + '%') + '</b><span>' + esc(label || '') + '</span></div></div>';
  };
  UI.animateRings = function (root) {
    U.$$('.ring-fg', root).forEach(function (c) { requestAnimationFrame(function () { requestAnimationFrame(function () { c.style.strokeDashoffset = c.getAttribute('data-offset'); }); }); });
    U.$$('.bar>i[data-w]', root).forEach(function (b) { requestAnimationFrame(function () { requestAnimationFrame(function () { b.style.width = b.getAttribute('data-w'); }); }); });
    U.$$('[data-count-to]', root).forEach(function (el) { U.countUp(el, +el.getAttribute('data-count-to')); });
  };
  UI.bar = function (pct, cls) { return '<div class="bar ' + (cls || '') + '"><i data-w="' + U.clamp(pct || 0, 0, 100) + '%"></i></div>'; };

  // ── rotating quotes ──
  var qTimer = null;
  UI.quote = function (cls) {
    var Q = RAX.quotes || []; if (!Q.length) return '';
    var i = Math.floor(Math.random() * Q.length);
    return '<figure class="quote-card ' + (cls || '') + '" data-quote-idx="' + i + '" aria-live="off"><blockquote class="quote fade-swap">' + esc(Q[i].text) + '</blockquote>' +
      '<figcaption class="quote-by fade-swap">— ' + esc(Q[i].by) + (Q[i].ref ? ', <span>' + esc(Q[i].ref) + '</span>' : '') + '</figcaption>' +
      '<div class="quote-nav"><button class="btn btn-ghost btn-icon btn-sm" data-action="quote-prev" aria-label="Previous quote">' + I('chevron-left') + '</button><button class="btn btn-ghost btn-icon btn-sm" data-action="quote-next" aria-label="Next quote">' + I('chevron-right') + '</button></div></figure>';
  };
  UI.quoteStep = function (card, dir) {
    var Q = RAX.quotes, i = (+card.getAttribute('data-quote-idx') + dir + Q.length) % Q.length;
    var bq = U.$('blockquote', card), by = U.$('figcaption', card);
    bq.classList.add('is-out'); by.classList.add('is-out');
    setTimeout(function () {
      card.setAttribute('data-quote-idx', i); bq.textContent = Q[i].text; by.innerHTML = '— ' + esc(Q[i].by) + (Q[i].ref ? ', <span>' + esc(Q[i].ref) + '</span>' : '');
      bq.classList.remove('is-out'); by.classList.remove('is-out');
    }, U.reducedMotion() ? 0 : 420);
  };
  UI.startQuotes = function () {
    clearInterval(qTimer);
    qTimer = setInterval(function () { U.$$('.quote-card').forEach(function (c) { if (!c.matches(':hover') && !c.contains(document.activeElement)) UI.quoteStep(c, 1); }); }, 9000);
  };

  RAX.disclaimer = 'RAXUSATPrep is an independent practice platform. It is not affiliated with, endorsed by or operated by HEC or ETC. Always confirm the latest test pattern, dates and eligibility on official HEC/ETC sources.';
  UI.contacts = function () {
    var c = RAX.config.contact;
    return '<a class="contact-item" href="mailto:' + esc(c.email) + '"><span class="ci ci-mail">' + I('envelope') + '</span><span><b>Email</b><span>' + esc(c.email) + '</span></span></a>' +
      '<a class="contact-item" href="' + esc(c.github) + '" target="_blank" rel="noopener"><span class="ci ci-gh">' + I('github') + '</span><span><b>GitHub</b><span>' + esc(c.githubHandle) + '</span></span></a>' +
      '<a class="contact-item" href="' + esc(c.linkedin) + '" target="_blank" rel="noopener"><span class="ci ci-li">' + I('linkedin-in') + '</span><span><b>LinkedIn</b><span>' + esc(c.linkedinHandle) + '</span></span></a>';
  };

  UI.maker = function (cls) {
    var c = RAX.config.contact;
    return '<div class="maker ' + (cls || '') + '"><div class="maker-id"><span class="maker-av" aria-hidden="true">RS</span><div><p class="maker-love">Made with <span class="heart" aria-label="love">♥</span> by <b>Rohail Ahmed Sial</b></p>' +
      '<p class="maker-role">BS Artificial Intelligence student at UET Lahore · I build websites, web apps and study tools.</p></div></div><div class="maker-links">' +
      '<a class="maker-btn" href="' + esc(c.github) + '" target="_blank" rel="noopener">' + I('github') + '<span>GitHub</span></a>' +
      '<a class="maker-btn" href="' + esc(c.linkedin) + '" target="_blank" rel="noopener">' + I('linkedin-in') + '<span>LinkedIn</span></a>' +
      '<a class="maker-btn" href="mailto:' + esc(c.email) + '">' + I('envelope') + '<span>Email</span></a></div></div>';
  };

  // ── category picker modal ──
  UI.categoryModal = function () {
    var cur = RAX.state.settings.category;
    var md = U.modal('<h2>Choose your USAT category</h2><p class="muted">Your progress is saved per question, so switching never loses anything.</p><div class="cat-pick">' +
      RAX.config.categories.map(function (c) {
        var subs = B.subjectsFor(c.id), ready = subs.filter(function (s) { return s.available; }).length;
        return '<button class="cat-opt ' + (cur === c.id ? 'is-on' : '') + '" data-pick="' + c.id + '" style="--c:' + c.color + '"><b>' + esc(c.id) + '</b><span>' + esc(c.label) + '</span><small>' +
          esc(c.subjects.map(function (s) { return s.subject; }).join(', ')) + '</small><em>' + (ready === subs.length ? 'Full mocks available' : ready ? ready + ' of ' + subs.length + ' subjects in the bank' : 'VR + QR practice; subjects not in the bank yet') + '</em></button>';
      }).join('') + '</div><div class="btn-row" style="margin-top:14px;justify-content:space-between"><a class="btn btn-ghost" href="#/start" data-close>Help me choose</a><button class="btn" data-close>Close</button></div>', { label: 'Choose category', wide: true });
    md.el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pick]'); if (!b) return;
      RAX.app.setCategory(b.getAttribute('data-pick')).then(function () { md.close(); });
    });
  };
})();
