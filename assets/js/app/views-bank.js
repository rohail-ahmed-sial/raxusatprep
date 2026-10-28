/* RAXUSATPrep — Question bank: every question as question → checked answer → explanation, like the study PDFs. */
(function () {
  'use strict';
  var RAX = window.RAX, U = RAX.util, S = RAX.store, B = RAX.bank, E = RAX.engine, UI = RAX.ui, I = RAX.icon, esc = U.esc, V = RAX.views = RAX.views || {};
  var TABS = [['biology', 'Biology'], ['chemistry', 'Chemistry'], ['physics', 'Physics'], ['quantitative', 'Quantitative'], ['verbal', 'Verbal'], ['words', 'Word list']];
  var PER = 40;
  var state = { q: '', topic: '', hide: false, page: 0 };

  RAX.bankAnswer = function (q) {
    if (q.answerText) return q.answerText;
    var o = q.options.filter(function (x) { return x.id === q.answer; })[0];
    return o ? o.text : 'None of the printed options is correct';
  };
  var SECT = { S: 'Sample MCQs', A: 'Arithmetic', G: 'Algebra and Functions', T: 'Statistics', E: 'Equations', M: 'Geometry', L: 'Logic, Reasoning and Mental Mathematics',
    AS: 'Analogies — Solved Questions', AE: 'Analogies — Practice Exercise', SC: 'Sentence Completion', RC: 'Reading Comprehension — Short Passages', RP: 'Comprehension — Practice Passages', PR: 'Prepositions' };
  function heading(q) {
    var t = (q.tags || []).filter(function (x) { return x.indexOf('book-') === 0; })[0];
    if (t) { var m = t.slice(5).match(/^[A-Z]+/); if (m && SECT[m[0]]) return SECT[m[0]]; }
    return q.topic;
  }
  function letter(q) { var i = q.options.map(function (o) { return o.id; }).indexOf(q.answer); return i >= 0 ? '(' + 'abcde'[i] + ') ' : ''; }
  function flags(q) {
    var f = '';
    if ((q.tags || []).indexOf('corrected-key') >= 0) f += '<span class="chip chip-amber" title="The book’s printed key was wrong; this is the corrected answer">' + I('pencil') + ' Corrected key</span>';
    else if (q.answerSource === 'solved') f += '<span class="chip chip-teal" title="The book marks no answer; worked out for RAXUSATPrep">Answer added</span>';
    if (!q.answer) f += '<span class="chip chip-bad">No printed option is correct</span>';
    else if (q.status !== 'verified') f += '<span class="chip chip-warn" title="' + esc(q.reviewNote || '') + '">Practice only</span>';
    return f;
  }

  V.bank = function (root, params) {
    var tab = params[0] || 'biology';
    if (!TABS.some(function (t) { return t[0] === tab; })) tab = 'biology';
    var file = tab === 'words' ? 'verbal' : tab;
    return B.load([file]).then(function () {
      var head = UI.head('Question bank', 'Every question from the RAXUSATPrep study documents, written as question and answer — the same way as the PDFs. Use it to read and revise; use Practice to test yourself.') +
        '<div class="tabs bank-tabs" role="tablist">' + TABS.map(function (t) {
          var n = t[0] === 'words' ? (RAX.vocab || []).length : list(t[0]).length;
          return '<a role="tab" class="tab ' + (t[0] === tab ? 'is-on' : '') + '" aria-selected="' + (t[0] === tab) + '" href="#/bank/' + t[0] + '">' + t[1] + (B.files[t[0] === 'words' ? 'verbal' : t[0]] ? ' <span class="num">' + U.fmtNum(n) + '</span>' : '') + '</a>';
        }).join('') + '</div>';
      root.innerHTML = head + '<div id="bankBody"></div>';
      if (state.tab !== tab) { state = { q: '', topic: '', hide: state.hide, page: 0, tab: tab }; }
      if (tab === 'words') return words(U.$('#bankBody'));
      reader(U.$('#bankBody'), tab);
    });
  };
  function list(file) {
    return (B.files[file] || []).filter(function (q) { return (q.tags || []).indexOf('word-list') < 0; });
  }

  function reader(box, file) {
    var all = list(file), topics = [];
    all.forEach(function (q) { if (topics.indexOf(q.topic) < 0) topics.push(q.topic); });
    box.innerHTML = '<div class="bank-tools sheet"><div class="field"><label for="bkSearch">Search</label><input id="bkSearch" class="input" type="search" placeholder="Words from a question or answer" value="' + esc(state.q) + '"></div>' +
      '<div class="field"><label for="bkTopic">' + (file === 'verbal' || file === 'quantitative' ? 'Topic' : 'Chapter') + '</label><select id="bkTopic" class="select"><option value="">All (' + U.fmtNum(all.length) + ')</option>' +
      topics.map(function (t) { var n = all.filter(function (q) { return q.topic === t; }).length; return '<option value="' + esc(t) + '" ' + (state.topic === t ? 'selected' : '') + '>' + esc(t) + ' (' + n + ')</option>'; }).join('') + '</select></div>' +
      '<label class="switch"><input type="checkbox" id="bkHide" ' + (state.hide ? 'checked' : '') + '><span class="track"></span><span><b>Hide answers</b><br><small class="muted">Tap to reveal — test yourself</small></span></label></div>' +
      '<div id="bkList"></div>';
    var listEl = U.$('#bkList', box);
    function filtered() {
      var t = state.q.trim().toLowerCase();
      return all.filter(function (q) {
        if (state.topic && q.topic !== state.topic) return false;
        if (!t) return true;
        return (q.question + ' ' + RAX.bankAnswer(q) + ' ' + (q.explanation || '')).toLowerCase().indexOf(t) >= 0;
      });
    }
    function render() {
      var rows = filtered(), pages = Math.max(1, Math.ceil(rows.length / PER));
      state.page = U.clamp(state.page, 0, pages - 1);
      var slice = rows.slice(state.page * PER, state.page * PER + PER), lastTopic = null, lastPid = null;
      var h = '<div class="row-between bank-meta"><span class="muted small num">' + U.fmtNum(rows.length) + ' questions' + (rows.length > PER ? ' · showing ' + (state.page * PER + 1) + '–' + (state.page * PER + slice.length) : '') + '</span>' +
        (state.topic ? '<button class="btn btn-sm btn-primary" data-bk-practise>' + I('play') + ' Practise this ' + (file === 'verbal' || file === 'quantitative' ? 'topic' : 'chapter') + '</button>' : '') + '</div>';
      if (!slice.length) h += UI.empty('magnifying-glass', 'Nothing found', 'Try another word or chapter.');
      h += slice.map(function (q) {
        var num = all.indexOf(q) + 1, out = '';
        var hd = heading(q);
        if (hd !== lastTopic) { out += '<h2 class="bank-ch">' + esc(hd) + '</h2>'; lastTopic = hd; }
        if (q.passageId && q.passageId !== lastPid) { var p = B.passage(q.passageId); if (p) out += '<div class="passage bank-passage"><b>' + I('book-open') + ' ' + esc(p.title) + '</b><p>' + esc(p.text) + '</p></div>'; }
        lastPid = q.passageId;
        var st = E.qs(q.id);
        out += '<article class="qa ' + (state.hide ? 'hidden-ans' : '') + '" data-qa="' + q.id + '"><div class="qa-n num">' + num + '</div><div class="qa-body">' +
          '<p class="qa-q">' + esc(q.question) + '</p>' +
          '<button class="qa-ans" data-reveal aria-expanded="' + !state.hide + '"><span class="qa-label">Answer</span><span class="qa-text">' + esc(letter(q) + RAX.bankAnswer(q)) + '</span><span class="qa-tap">' + I('eye') + ' Show answer</span></button>' +
          (q.explanation ? '<div class="qa-expl"><span class="qa-label">' + (/\d\s*[=×÷+−]\s*\d|=/.test(q.explanation) ? 'Solution' : 'Note') + '</span><p>' + esc(q.explanation) + '</p></div>' : '') +
          '<div class="qa-foot">' + flags(q) + '<span class="muted small">Page ' + esc(q.source.page || '—') + '</span>' +
          '<button class="btn btn-sm btn-ghost" data-action="bookmark" data-q="' + q.id + '" aria-pressed="' + !!st.bm + '">' + I(st.bm ? 'bookmark' : 'bookmark-o') + '<span>' + (st.bm ? 'Bookmarked' : 'Bookmark') + '</span></button></div></div></article>';
        return out;
      }).join('');
      if (pages > 1) h += '<nav class="pager" aria-label="Pages"><button class="btn" data-pg="-1" ' + (state.page ? '' : 'disabled') + '>' + I('chevron-left') + ' Previous</button><span class="num small">Page ' + (state.page + 1) + ' of ' + pages + '</span><button class="btn" data-pg="1" ' + (state.page < pages - 1 ? '' : 'disabled') + '>Next ' + I('chevron-right') + '</button></nav>';
      listEl.innerHTML = h;
    }
    var onSearch = U.debounce(function () { state.q = U.$('#bkSearch', box).value; state.page = 0; render(); }, 250);
    U.$('#bkSearch', box).addEventListener('input', onSearch);
    U.$('#bkTopic', box).addEventListener('change', function () { state.topic = this.value; state.page = 0; render(); });
    U.$('#bkHide', box).addEventListener('change', function () { state.hide = this.checked; render(); });
    box.addEventListener('click', function (e) {
      var r = e.target.closest('[data-reveal]');
      if (r) { var a = r.closest('.qa'); var open = a.classList.toggle('hidden-ans'); r.setAttribute('aria-expanded', !open); return; }
      var pg = e.target.closest('[data-pg]'); if (pg) { state.page += +pg.getAttribute('data-pg'); render(); U.$('#bkList', box).scrollIntoView({ block: 'start' }); return; }
      if (e.target.closest('[data-bk-practise]')) {
        var qs = filtered().filter(function (q) { return B.usable(q) && q.answer; });
        RAX.practice.create('topic', state.topic, U.shuffle(qs).slice(0, 15));
      }
    });
    render();
  }

  function words(box) {
    var V = RAX.vocab || [];
    box.innerHTML = '<div class="bank-tools sheet"><div class="field"><label for="wSearch">Search the word list</label><input id="wSearch" class="input" type="search" placeholder="e.g. abandon" value="' + esc(state.q) + '"></div>' +
      '<a class="btn" href="#/flashcards/words">' + I('clone') + ' Study as flashcards</a></div><div id="wList"></div>';
    function render() {
      var t = state.q.trim().toLowerCase(), rows = V.filter(function (v) { return !t || (v.w + ' ' + v.s + ' ' + v.a).toLowerCase().indexOf(t) >= 0; });
      U.$('#wList', box).innerHTML = '<p class="muted small num">' + U.fmtNum(rows.length) + ' words from the Verbal Reasoning book</p><div class="table-wrap"><table class="t words-t"><thead><tr><th>Word</th><th>Synonyms</th><th>Antonyms</th></tr></thead><tbody>' +
        rows.map(function (v) { return '<tr><td><b>' + esc(v.w) + '</b></td><td>' + esc(v.s || '—') + '</td><td>' + esc(v.a || '—') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    U.$('#wSearch', box).addEventListener('input', U.debounce(function () { state.q = this.value; render(); }.bind(U.$('#wSearch', box)), 200));
    render();
  }
})();
