/* RAXUSATPrep — essay module: topic library, templates, model essays, editor, 40-minute simulation, history. */
(function () {
  'use strict';
  var RAX = window.RAX, U = RAX.util, S = RAX.store, E = RAX.engine, UI = RAX.ui, I = RAX.icon, esc = U.esc, V = RAX.views = RAX.views || {};
  function data() { return U.loadScript('../data/essays.js').then(function () { return RAX.essays; }); }
  function md(s) {
    return esc(s).replace(/\[\[(.+?)\]\]/g, '<span class="slot">$1</span>').replace(/\{\{(.+?)\}\}/g, '<mark class="fill">$1</mark>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  }
  function plainTpl(s) { return String(s).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\{\{(.+?)\}\}/g, '$1'); }
  function words(t) { t = (t || '').trim(); return t ? t.split(/\s+/).filter(function (w) { return /[\w؀-ۿ]/.test(w); }).length : 0; }
  function tabs(cur) {
    return '<div class="tabs essay-tabs" role="tablist">' + [['write', 'Write'], ['topics', 'Topics'], ['templates', 'Templates'], ['models', 'Model essays'], ['mine', 'My essays']].map(function (t) {
      return '<a role="tab" class="tab ' + (cur === t[0] ? 'is-on' : '') + '" aria-selected="' + (cur === t[0]) + '" href="#/essays/' + t[0] + '">' + t[1] + '</a>';
    }).join('') + '</div>';
  }
  function quoteLine(D, code) { var q = D.quotes[code]; return q ? '<li><span class="quote">' + esc(q.text) + '</span> <span class="muted small">— ' + esc(q.group) + (q.ref ? ', ' + esc(q.ref) : '') + '</span></li>' : ''; }
  function newEssay(o) {
    var e = Object.assign({ id: U.uid('es'), type: 'argument', title: '', prompt: '', kitId: null, lang: 'en', text: '', status: 'draft', created: Date.now(), words: 0, rubric: null, checks: null }, o);
    S.put('essays', e); return e;
  }

  V.essays = function (root, params, query) {
    var tab = params[0] || 'write';
    return data().then(function (D) {
      if (tab === 'write' && params[1]) return editor(root, params[1], D);
      if (tab === 'sim') return sim(root, params[1], D, query);
      var h = UI.head('Essays', 'USAT Part II: 40 minutes, one argument essay (1 of 3, 15 marks) and one narrative essay (1 of 3, 10 marks), in English or Urdu.') + tabs(tab);
      if (tab === 'write') h += writeTab(D);
      else if (tab === 'topics') h += topicsTab(D, query);
      else if (tab === 'templates') h += templatesTab(D);
      else if (tab === 'models') h += modelsTab(D);
      else h += mineTab();
      root.innerHTML = h;
      root.onclick = function (e) {
        if (e.target.closest('.tab')) RAX.app._noFocus = true;
        var w = e.target.closest('[data-write]');
        if (w) {
          var type = w.getAttribute('data-write'), kit = w.getAttribute('data-kit'), title = w.getAttribute('data-title') || '';
          var es = newEssay({ type: type, kitId: kit || null, title: title, prompt: title });
          location.hash = '#/essays/write/' + es.id; return;
        }
        var del = e.target.closest('[data-del]');
        if (del) U.confirm('Delete this essay?', 'This removes it from this device.', 'Delete', true).then(function (ok) { if (ok) { S.del('essays', del.getAttribute('data-del')); RAX.app.route(); } });
      };
      var sb = U.$('#kitSearch');
      if (sb) {
        var f = function () {
          var t = sb.value.toLowerCase(), mode = U.$('#kitMode').value;
          U.$$('.kit').forEach(function (k) { var ok = (!t || k.getAttribute('data-s').indexOf(t) >= 0) && (!mode || k.getAttribute('data-mode') === mode); k.hidden = !ok; });
        };
        sb.oninput = f; U.$('#kitMode').onchange = f;
      }
    });
  };

  function writeTab(D) {
    return '<div class="grid cols-2"><section class="sheet mode-card"><span class="mode-icon amber">' + I('stopwatch') + '</span><h2>40-minute simulation</h2><p class="muted">Pick 1 of 3 argument prompts and 1 of 3 narrative prompts, then write both against one timer (about 24 + 16 minutes).</p><a class="btn btn-amber" href="#/essays/sim">Start simulation</a></section>' +
      '<section class="sheet mode-card"><span class="mode-icon">' + I('feather-pointed') + '</span><h2>Practise one essay</h2><p class="muted">No timer. The planning panel shows the template for the type you pick.</p><div class="btn-row"><button class="btn btn-primary" data-write="argument">Argument essay</button><button class="btn" data-write="narrative">Narrative essay</button></div></section></div>' +
      '<section class="sheet"><h2>' + I('clock') + ' How to use the 40 minutes</h2><ol class="time-plan">' + D.timePlan.map(function (r) { return '<li><b>' + esc(r[0]) + '</b><span>' + md(r[1]) + '</span></li>'; }).join('') + '</ol></section>' +
      '<section class="sheet"><h2>Argument or narrative?</h2><div class="table-wrap"><table class="t"><thead><tr><th></th><th>Argument-based</th><th>Narrative</th></tr></thead><tbody>' + D.compare.map(function (r) { return '<tr><th>' + esc(r[0]) + '</th><td>' + md(r[1]) + '</td><td>' + md(r[2]) + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
  }
  function topicsTab(D) {
    var modes = []; D.kits.forEach(function (k) { if (modes.indexOf(k.mode) < 0) modes.push(k.mode); });
    var h = '<div class="kit-tools"><div class="field"><label for="kitSearch">Search topics</label><input id="kitSearch" class="input" type="search" placeholder="e.g. climate, social media, Kashmir"></div>' +
      '<div class="field"><label for="kitMode">Type</label><select id="kitMode" class="select"><option value="">All argument types</option>' + modes.map(function (m) { return '<option>' + esc(m) + '</option>'; }).join('') + '</select></div></div>';
    h += '<p class="muted small">' + D.kits.length + ' argument topic kits from the essay guide — each with a thesis, three points, a fact, quotations and a counter-argument. Write any of them with the master template.</p><div class="kits">' + D.kits.map(function (k) {
      return '<details class="kit sheet" data-mode="' + esc(k.mode) + '" data-s="' + esc((k.title + ' ' + k.thesis + ' ' + k.mode).toLowerCase()) + '"><summary><span class="kit-no num">' + esc(k.no) + '</span><b>' + esc(k.title) + '</b><span class="chip">' + esc(k.mode) + '</span>' + (k.bonus ? '<span class="chip chip-teal">Bonus</span>' : '') + '</summary>' +
        '<div class="kit-body"><p><b>Thesis:</b> ' + md(k.thesis) + '</p><ul class="kit-pts"><li><b>A.</b> ' + md(k.a) + '</li><li><b>B.</b> ' + md(k.b) + '</li><li><b>C.</b> ' + md(k.c) + '</li></ul>' +
        (k.fact ? '<p><b>Fact to use:</b> ' + md(k.fact) + '</p>' : '') + (k.quotes.length ? '<p><b>Quotations:</b></p><ul class="kit-q">' + k.quotes.map(function (c) { return quoteLine(D, c); }).join('') + '</ul>' : '') +
        (k.counter ? '<p><b>Counter-argument:</b> ' + md(k.counter) + '</p>' : '') + (k.tip ? '<p class="tip">' + I('lightbulb') + ' ' + md(k.tip) + '</p>' : '') +
        '<button class="btn btn-primary btn-sm" data-write="argument" data-kit="' + esc(k.id) + '" data-title="' + esc(k.title) + '">' + I('pen-to-square') + ' Write this essay</button></div></details>';
    }).join('') + '</div>';
    h += '<h2 class="sec-h">Narrative prompts</h2><p class="muted small">One core story adapts to all of these. The change and the lesson for each are listed.</p><div class="kits">' + D.adapt.map(function (n) {
      return '<details class="kit sheet" data-mode="Narrative" data-s="' + esc(n.title.toLowerCase()) + '"><summary><b>' + esc(n.title) + '</b><span class="chip chip-amber">Narrative</span></summary><div class="kit-body"><p><b>What to change:</b> ' + md(n.change) + '</p><p><b>Lesson:</b> ' + md(n.lesson) + '</p>' +
        '<button class="btn btn-primary btn-sm" data-write="narrative" data-title="' + esc(n.title.split(' / ')[0]) + '">' + I('pen-to-square') + ' Write this essay</button></div></details>';
    }).join('') + '</div>';
    return h;
  }
  function paraTable(rows) {
    return '<div class="tpl">' + rows.map(function (r) { return '<div class="tpl-row"><div class="tpl-k"><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span><small class="muted">' + esc(r[2]) + '</small></div><p>' + md(r[3]) + '</p></div>'; }).join('') + '</div>';
  }
  function pairs(list) { return '<dl class="pairs">' + list.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + md(r[1]) + '</dd>'; }).join('') + '</dl>'; }
  function templatesTab(D) {
    return '<p class="muted small">Learn one template per essay type and adapt it to any prompt. <span class="slot">Slots</span> are what you fill in; <mark class="fill">highlighted</mark> words are topic-specific.</p>' +
      '<section class="sheet"><h2>Master argumentative essay (5 paragraphs)</h2>' + paraTable(D.masterArg) + '<ul class="notes">' + D.argNotes.map(function (n) { return '<li>' + md(Array.isArray(n) ? n.join(' — ') : n) + '</li>'; }).join('') + '</ul><p class="tip">' + I('lightbulb') + ' ' + md(D.shortTip) + '</p></section>' +
      '<section class="sheet"><h2>Modes for the thesis line</h2>' + (D.modes.rows ? '<div class="table-wrap"><table class="t"><thead><tr>' + D.modes.head.map(function (x) { return '<th>' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>' + D.modes.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + md(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' : '') + '</section>' +
      '<section class="sheet"><h2>Narrative arc</h2><ol class="arc">' + D.arc.map(function (a) { return '<li><b>' + esc(a[0]) + '</b><span>' + esc(a[1]) + '</span></li>'; }).join('') + '</ol><h3>Master narrative (4 paragraphs)</h3>' + paraTable(D.masterNar) +
      '<h3>Core story: ' + esc(D.coreStoryTitle) + '</h3>' + D.coreStory.map(function (p) { return '<p>' + md(Array.isArray(p) ? p[p.length - 1] : p) + '</p>'; }).join('') + '<ul class="notes">' + D.narDos.map(function (n) { return '<li>' + md(Array.isArray(n) ? n.join(' — ') : n) + '</li>'; }).join('') + '</ul></section>' +
      '<section class="sheet"><h2>Universal paragraphs</h2><p class="muted small">Add one between paragraphs 3 and 4 when you have time.</p>' + D.universal.map(function (u) { return '<details class="uni"><summary><b>' + esc(u[0]) + ' · ' + esc(u[1]) + '</b> <span class="muted small">' + esc(u[2]) + '</span></summary><p>' + md(u[3]) + '</p></details>'; }).join('') + '</section>' +
      '<section class="sheet"><h2>Phrase bank</h2><h3>Hooks</h3>' + pairs(D.hooks) + '<h3>Definition frames</h3><ul class="notes">' + D.defFrames.map(function (x) { return '<li>' + md(x) + '</li>'; }).join('') + '</ul><h3>Thesis frames</h3>' + (Array.isArray(D.thesisFrames[0]) ? pairs(D.thesisFrames) : '<ul class="notes">' + D.thesisFrames.map(function (x) { return '<li>' + md(x) + '</li>'; }).join('') + '</ul>') +
      '<h3>Transitions</h3>' + pairs(D.transitions) + '<h3>Power phrases</h3><p>' + D.powerPhrases.map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join(' ') + '</p><h3>Better words</h3>' + pairs(D.vocab) + '<h3>Narrative language</h3>' + pairs(D.narrLang) +
      '<h3>Avoid</h3><ul class="notes">' + D.avoid.map(function (x) { return '<li>' + md(x) + '</li>'; }).join('') + '</ul></section>' +
      '<section class="sheet"><h2>How essays are marked</h2>' + pairs(D.marks) + '<h3>Grammar checks</h3>' + pairs(D.grammar.map(function (g) { return Array.isArray(g) ? [g[0], g.slice(1).join(' → ')] : [g, '']; })) + '</section>';
  }
  function modelsTab(D) {
    return '<p class="muted small">These are RAXUSATPrep model essays written with the templates — not official HEC answers. <mark class="fill">Highlighted</mark> words are the topic-specific parts; everything else is the memorised template.</p>' + D.examples.map(function (e) {
      return '<details class="sheet model"><summary><b>' + esc(e.title) + '</b><span class="chip">' + esc(e.kind) + '</span><span class="chip chip-indigo">RAXUSATPrep model essay</span></summary><div class="model-body">' + e.paras.map(function (p) { return '<p>' + md(p) + '</p>'; }).join('') + '<p class="muted small">' + words(plainTpl(e.paras.join(' '))) + ' words</p></div></details>';
    }).join('');
  }
  function mineTab() {
    var list = S.all('essays').sort(function (a, b) { return b.updated - a.updated; });
    if (!list.length) return UI.empty('feather-pointed', 'No essays yet', 'Drafts save automatically while you write.', '<a class="btn btn-primary" href="#/essays/write">Write an essay</a>');
    return '<div class="table-wrap"><table class="t"><thead><tr><th>Essay</th><th>Type</th><th class="n">Words</th><th>Status</th><th>Updated</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>' + list.map(function (e) {
      var score = e.rubric ? Object.keys(e.rubric).reduce(function (a, k) { return a + e.rubric[k]; }, 0) : null, max = e.rubric ? Object.keys(e.rubric).length * 5 : 0;
      return '<tr><td><a href="#/essays/write/' + e.id + '">' + esc(e.title || 'Untitled') + '</a>' + (e.lang === 'ur' ? ' <span class="chip">اردو</span>' : '') + '</td><td>' + (e.type === 'argument' ? 'Argument' : 'Narrative') + '</td><td class="n">' + (e.words || 0) + '</td><td>' +
        (e.status === 'submitted' ? '<span class="chip chip-ok">Submitted' + (score != null ? ' · self-score ' + score + '/' + max : '') + '</span>' : '<span class="chip">Draft</span>') + '</td><td>' + esc(U.fmtDateTime(e.updated)) + '</td><td><button class="btn btn-sm btn-ghost" data-del="' + e.id + '" aria-label="Delete essay">' + I('trash-can') + '</button></td></tr>';
    }).join('') + '</tbody></table></div>';
  }

  // ───────── editor (single essay, or both essays of a simulation) ─────────
  function planPanel(e, D) {
    var kit = e.kitId ? D.kits.filter(function (k) { return k.id === e.kitId; })[0] : null;
    var rows = e.type === 'argument' ? D.masterArg : D.masterNar;
    var h = '<div class="plan"><h3>' + I('list-check') + ' Plan</h3>';
    if (kit) h += '<div class="plan-kit"><p><b>Thesis:</b> ' + md(kit.thesis) + '</p><p><b>A.</b> ' + md(kit.a) + '</p><p><b>B.</b> ' + md(kit.b) + '</p><p><b>C.</b> ' + md(kit.c) + '</p>' + (kit.fact ? '<p><b>Fact:</b> ' + md(kit.fact) + '</p>' : '') +
      (kit.quotes.length ? '<ul class="kit-q">' + kit.quotes.map(function (c) { return quoteLine(D, c); }).join('') + '</ul>' : '') + (kit.counter ? '<p><b>Counter:</b> ' + md(kit.counter) + '</p>' : '') + '</div>';
    if (e.type === 'narrative') h += '<ol class="arc small">' + D.arc.map(function (a) { return '<li><b>' + esc(a[0]) + '</b> — ' + esc(a[1]) + '</li>'; }).join('') + '</ol>';
    h += '<p class="small muted">Insert a paragraph template at the cursor, then replace the [[SLOTS]].</p><div class="tpl-ins">' + rows.map(function (r, i) {
      return '<button class="btn btn-sm" data-ins="' + i + '" title="' + esc(r[2]) + '">' + esc(r[0]) + ' ' + esc(r[1]) + '</button>';
    }).join('') + '</div></div>';
    return h;
  }
  function editorPane(e, D, locked) {
    var target = e.type === 'argument' ? '300–400' : '200–280';
    return '<div class="ed-pane" data-eid="' + e.id + '"><div class="ed-head"><div class="field"><label for="t-' + e.id + '">Title</label><input id="t-' + e.id + '" class="input ed-title" value="' + esc(e.title) + '" ' + (locked ? 'disabled' : '') + ' maxlength="160"></div>' +
      '<div class="ed-lang" role="group" aria-label="Language"><button class="btn btn-sm ' + (e.lang !== 'ur' ? 'btn-primary' : '') + '" data-lang="en">English</button><button class="btn btn-sm ' + (e.lang === 'ur' ? 'btn-primary' : '') + '" data-lang="ur">اردو</button></div></div>' +
      (e.prompt && e.prompt !== e.title ? '<p class="small muted">Prompt: ' + esc(e.prompt) + '</p>' : '') +
      '<label class="sr-only" for="x-' + e.id + '">Essay text</label><textarea id="x-' + e.id + '" class="textarea ed-text ' + (e.lang === 'ur' ? 'urdu' : '') + '" dir="' + (e.lang === 'ur' ? 'rtl' : 'ltr') + '" lang="' + (e.lang === 'ur' ? 'ur' : 'en') + '" spellcheck="true" ' + (locked ? 'readonly' : '') + ' placeholder="' + (e.lang === 'ur' ? 'یہاں لکھیں…' : 'Start writing here…') + '">' + esc(e.text) + '</textarea>' +
      '<div class="ed-foot"><span class="num"><b class="wc">' + words(e.text) + '</b> words <span class="muted">· aim for ' + target + '</span></span><span class="ed-saved muted small">' + (e.status === 'submitted' ? 'Submitted' : 'Draft saved') + '</span></div></div>';
  }
  function wireEditor(root, essays, D, onChange) {
    var saveOne = {};
    essays.forEach(function (e) {
      saveOne[e.id] = U.debounce(function () { e.words = words(e.text); S.put('essays', e); var p = U.$('[data-eid="' + e.id + '"] .ed-saved', root); if (p) p.textContent = 'Draft saved ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }, 700);
    });
    root.addEventListener('input', function (ev) {
      var pane = ev.target.closest('[data-eid]'); if (!pane) return;
      var e = essays.filter(function (x) { return x.id === pane.getAttribute('data-eid'); })[0]; if (!e || e.status === 'submitted') return;
      if (ev.target.classList.contains('ed-text')) { e.text = ev.target.value; U.$('.wc', pane).textContent = words(e.text); }
      if (ev.target.classList.contains('ed-title')) e.title = ev.target.value;
      U.$('.ed-saved', pane).textContent = 'Saving…'; saveOne[e.id](); if (onChange) onChange(e);
    });
    root.addEventListener('click', function (ev) {
      var l = ev.target.closest('[data-lang]'), ins = ev.target.closest('[data-ins]');
      var pane = (l || ins) && (ev.target.closest('[data-eid]') || U.$('.ed-pane:not([hidden])', root));
      if (!pane) return;
      var e = essays.filter(function (x) { return x.id === pane.getAttribute('data-eid'); })[0]; if (!e || e.status === 'submitted') return;
      var ta = U.$('.ed-text', pane);
      if (l) {
        e.lang = l.getAttribute('data-lang'); ta.dir = e.lang === 'ur' ? 'rtl' : 'ltr'; ta.lang = e.lang; ta.classList.toggle('urdu', e.lang === 'ur');
        U.$$('[data-lang]', pane).forEach(function (b) { b.classList.toggle('btn-primary', b === l); }); saveOne[e.id]();
      }
      if (ins) {
        var rows = e.type === 'argument' ? D.masterArg : D.masterNar, tpl = plainTpl(rows[+ins.getAttribute('data-ins')][3]);
        var s = ta.selectionStart || ta.value.length, before = ta.value.slice(0, s), after = ta.value.slice(s);
        var add = (before && !/\n\n$/.test(before) ? '\n\n' : '') + tpl + '\n\n';
        ta.value = before + add + after; e.text = ta.value; ta.focus(); ta.selectionStart = ta.selectionEnd = (before + add).length;
        U.$('.wc', pane).textContent = words(e.text); saveOne[e.id]();
      }
    });
  }
  var CHECKS = ['My title and thesis use the key words of the prompt', 'The reader knows my position (or the story) by the end of paragraph 1', 'One idea per paragraph, linked with transitions', 'At least one example from Pakistan or daily life', 'A quotation, fact or verse I am sure of', 'A conclusion with a way forward (argument) or a lesson (narrative)', 'I proofread spelling, capital “I”, full stops and tense'];
  function submitFlow(essayList, D, done) {
    var md2 = U.modal('<h2>Before you submit</h2><p class="muted small">Tick what is true. This is your own check — RAXUSATPrep does not give AI scores.</p>' + CHECKS.map(function (c, i) { return '<label class="check"><input type="checkbox" data-ck="' + i + '"> <span>' + esc(c) + '</span></label>'; }).join('') +
      '<div class="btn-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Keep writing</button><button class="btn btn-primary" id="ckNext">Next: rate yourself</button></div>', { label: 'Submission checklist' });
    U.$('#ckNext', md2.el).onclick = function () {
      var checks = {}; U.$$('[data-ck]', md2.el).forEach(function (c) { checks[CHECKS[+c.getAttribute('data-ck')]] = c.checked; });
      md2.close();
      var crit = D.marks.map(function (m) { return m[0]; });
      var md3 = U.modal('<h2>Rate your essay' + (essayList.length > 1 ? 's' : '') + '</h2><p class="muted small">1 = needs a lot of work · 5 = excellent. Be honest — this is for you.</p>' + essayList.map(function (e) {
        return '<h3>' + esc(e.title || (e.type === 'argument' ? 'Argument essay' : 'Narrative essay')) + '</h3>' + crit.map(function (c, i) {
          return '<div class="rub"><span>' + esc(c) + '</span><div class="rub-btns" role="radiogroup" aria-label="' + esc(c) + '">' + [1, 2, 3, 4, 5].map(function (n) { return '<label><input type="radio" name="r-' + e.id + '-' + i + '" value="' + n + '" ' + (n === 3 ? 'checked' : '') + '><span>' + n + '</span></label>'; }).join('') + '</div></div>';
        }).join('');
      }).join('') + '<div class="btn-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Back</button><button class="btn btn-amber" id="rbSave">Submit</button></div>', { label: 'Self-assessment', wide: true });
      U.$('#rbSave', md3.el).onclick = function () {
        essayList.forEach(function (e) {
          var r = {}; crit.forEach(function (c, i) { var x = U.$('input[name="r-' + e.id + '-' + i + '"]:checked', md3.el); r[c] = x ? +x.value : 3; });
          e.rubric = r; e.checks = checks; e.status = 'submitted'; e.submitted = Date.now(); e.words = words(e.text); S.put('essays', e);
        });
        md3.close(); U.toast('Submitted — saved in My essays', 'circle-check'); U.confetti({ count: 90 }); done();
      };
    };
  }
  function exportBar(e) {
    return '<div class="btn-row ed-actions"><button class="btn btn-sm" data-exp="print">' + I('print') + ' Print</button><button class="btn btn-sm" data-exp="txt">' + I('download') + ' Download .txt</button></div>';
  }
  function exportHandler(root, getEssays) {
    root.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-exp]'); if (!b) return;
      var list = getEssays();
      if (b.getAttribute('data-exp') === 'print') {
        var po = U.$('.print-only', root); if (po) po.innerHTML = list.map(function (x) { return '<h1>' + esc(x.title || '') + '</h1><div class="print-text">' + esc(x.text) + '</div>'; }).join('');
        window.print();
      }
      else U.download((list[0].title || 'essay').replace(/[^\w\- ]+/g, '').trim().slice(0, 60) + '.txt', list.map(function (e) { return (e.title || '') + '\n\n' + e.text; }).join('\n\n———\n\n'));
    });
  }

  function editor(root, id, D) {
    var e = S.get('essays', id);
    if (!e) { root.innerHTML = UI.empty('circle-question', 'Essay not found', 'It may have been deleted.', '<a class="btn btn-primary" href="#/essays/mine">My essays</a>'); return; }
    var locked = e.status === 'submitted';
    root.innerHTML = '<div class="editor">' + '<div class="row-between"><a class="btn btn-ghost btn-sm" href="#/essays/mine">' + I('chevron-left') + ' My essays</a><span class="chip">' + (e.type === 'argument' ? 'Argument essay · 15 marks' : 'Narrative essay · 10 marks') + '</span></div>' +
      '<div class="ed-layout"><div class="ed-main">' + editorPane(e, D, locked) + exportBar(e) +
      (locked ? rubricView(e) : '<div class="btn-row"><button class="btn btn-primary" id="edSubmit">' + I('square-check') + ' Submit essay</button></div>') + '</div>' +
      '<aside class="ed-side sheet">' + planPanel(e, D) + '</aside></div><div class="print-only"><h1>' + esc(e.title) + '</h1><div class="print-text">' + esc(e.text) + '</div></div></div>';
    var wrap = U.$('.editor', root);
    wireEditor(wrap, [e], D);
    exportHandler(wrap, function () { return [e]; });
    var sb = U.$('#edSubmit'); if (sb) sb.onclick = function () { if (words(e.text) < 30) { U.toast('Write at least 30 words before submitting.', 'circle-info'); return; } submitFlow([e], D, function () { RAX.app.route(); }); };
  }
  function rubricView(e) {
    if (!e.rubric) return '';
    var keys = Object.keys(e.rubric), sum = keys.reduce(function (a, k) { return a + e.rubric[k]; }, 0);
    return '<section class="sheet"><h3>Your self-assessment · ' + sum + '/' + keys.length * 5 + '</h3>' + UI.bars(keys.map(function (k) { return { label: k, v: e.rubric[k], text: e.rubric[k] + '/5' }; }), { max: 5 }) + '</section>';
  }

  // ───────── 40-minute simulation ─────────
  function sim(root, simId, D, query) {
    if (!simId) {
      var rnd = Math.random;
      var args = U.sample(D.kits, 3), nars = U.sample(D.adapt, 3);
      root.innerHTML = UI.head('Essay simulation', 'Part II: choose one prompt from each list. The 40-minute timer starts when you press Start.') +
        '<form id="simForm" class="sim-pick"><fieldset class="sheet"><legend><h2>Argument-based essay · 15 marks</h2></legend>' + args.map(function (k, i) {
          return '<label class="pick"><input type="radio" name="arg" value="' + esc(k.id) + '" ' + (i ? '' : 'checked') + '><span><b>' + esc(k.title) + '</b><small class="muted">' + esc(k.mode) + '</small></span></label>';
        }).join('') + '</fieldset><fieldset class="sheet"><legend><h2>Narrative essay · 10 marks</h2></legend>' + nars.map(function (n, i) {
          return '<label class="pick"><input type="radio" name="nar" value="' + esc(n.id) + '" ' + (i ? '' : 'checked') + '><span><b>' + esc(n.title) + '</b></span></label>';
        }).join('') + '</fieldset><div class="btn-row"><button class="btn btn-amber btn-lg" type="submit">' + I('play') + ' Start 40 minutes</button><a class="btn" href="#/essays/sim">New prompts</a></div></form>';
      U.$('#simForm').onsubmit = function (ev) {
        ev.preventDefault();
        var k = D.kits.filter(function (x) { return x.id === U.$('input[name=arg]:checked').value; })[0], n = D.adapt.filter(function (x) { return x.id === U.$('input[name=nar]:checked').value; })[0];
        var sid = U.uid('sim'), a = newEssay({ type: 'argument', kitId: k.id, title: k.title, prompt: k.title, sim: sid }), b = newEssay({ type: 'narrative', title: n.title.split(' / ')[0], prompt: n.title, sim: sid });
        S.put('kv', { id: 'essaysim:' + sid, a: a.id, b: b.id, start: Date.now(), endTime: Date.now() + RAX.config.partII.minutes * 60000, status: 'active', from: query.from || null });
        location.hash = '#/essays/sim/' + sid;
      };
      return;
    }
    var rec = S.get('kv', 'essaysim:' + simId);
    if (!rec) { root.innerHTML = UI.empty('circle-question', 'Simulation not found', '', '<a class="btn btn-primary" href="#/essays/sim">New simulation</a>'); return; }
    var ea = S.get('essays', rec.a), eb = S.get('essays', rec.b), cur = 'a', timer;
    var over = Date.now() >= rec.endTime || rec.status !== 'active';
    root.innerHTML = '<div class="editor sim">' +
      '<div class="sim-top"><div class="tabs" role="tablist"><button role="tab" class="tab is-on" data-tab="a" aria-selected="true">Argument <span class="small muted hide-sm">≈24 min</span></button><button role="tab" class="tab" data-tab="b" aria-selected="false">Narrative <span class="small muted hide-sm">≈16 min</span></button></div>' +
      '<div class="timer" id="simTimer" role="timer">' + I('clock') + '<b class="num" id="simLeft"></b></div><button class="btn btn-primary btn-sm" id="simSubmit">' + (over ? 'Rate & submit' : 'Finish') + '</button></div>' +
      '<div class="ed-layout"><div class="ed-main"><div data-pane="a">' + editorPane(ea, D, ea.status === 'submitted') + '</div><div data-pane="b" hidden>' + editorPane(eb, D, eb.status === 'submitted') + '</div>' + exportBar(ea) + '</div>' +
      '<aside class="ed-side sheet"><div data-plan="a">' + planPanel(ea, D) + '</div><div data-plan="b" hidden>' + planPanel(eb, D) + '</div></aside></div>' +
      '<div class="print-only">' + [ea, eb].map(function (x) { return '<h1>' + esc(x.title) + '</h1><div class="print-text">' + esc(x.text) + '</div>'; }).join('') + '</div></div>';
    var wrap = U.$('.editor', root);
    wireEditor(wrap, [ea, eb], D);
    exportHandler(wrap, function () { return [ea, eb]; });
    function tick() {
      var left = rec.endTime - Date.now(), el = U.$('#simLeft'); if (!el) return;
      el.textContent = left > 0 ? U.fmtClock(left) : 'Time up';
      U.$('#simTimer').classList.toggle('warn', left < 5 * 60000); U.$('#simTimer').classList.toggle('danger', left < 60000);
      if (left <= 0 && rec.status === 'active') { rec.status = 'timeup'; S.put('kv', rec); clearInterval(timer); U.$$('.ed-text', root).forEach(function (t) { t.readOnly = true; }); U.toast('Time is up. Rate and submit your essays.', 'stopwatch', 4000); U.$('#simSubmit').textContent = 'Rate & submit'; }
    }
    tick(); timer = setInterval(tick, 1000); RAX.state.cleanup = function () { clearInterval(timer); };
    if (over) U.$$('.ed-text', root).forEach(function (t) { t.readOnly = true; });
    wrap.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-tab]'); if (!t) return;
      cur = t.getAttribute('data-tab');
      U.$$('[data-tab]', root).forEach(function (b) { var on = b === t; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
      U.$$('[data-pane]', root).forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== cur; });
      U.$$('[data-plan]', root).forEach(function (p) { p.hidden = p.getAttribute('data-plan') !== cur; });
    });
    U.$('#simSubmit').onclick = function () {
      submitFlow([ea, eb], D, function () { rec.status = 'done'; S.put('kv', rec); clearInterval(timer); location.hash = '#/essays/mine'; });
    };
  }
})();
