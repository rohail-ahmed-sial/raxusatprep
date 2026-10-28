/* RAXUSATPrep — app boot, hash router and global actions. */
(function () {
  'use strict';
  var RAX = window.RAX, U = RAX.util, S = RAX.store, B = RAX.bank, E = RAX.engine, UI = RAX.ui, I = RAX.icon, esc = U.esc;
  RAX.views = RAX.views || {};
  RAX.state = { settings: null, view: null, keys: null, cleanup: null };
  var app = RAX.app = {};

  // ── theme ──
  app.applyTheme = function () {
    var s = RAX.state.settings, root = document.documentElement;
    if (s.theme === 'light' || s.theme === 'dark') root.setAttribute('data-theme', s.theme); else root.removeAttribute('data-theme');
    root.classList.toggle('reduce-motion', !!s.reduceMotion);
    var dark = s.theme === 'dark' || (s.theme !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', dark ? '#0D0C26' : '#F5F6FB');
    try { localStorage.setItem('rax-theme', s.theme); } catch (e) { /* storage blocked */ }
  };
  app.toggleTheme = function () {
    var s = RAX.state.settings, dark = s.theme === 'dark' || (s.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
    return app.saveSettings({ theme: dark ? 'light' : 'dark' }).then(app.applyTheme);
  };
  app.saveSettings = function (patch) { return S.saveSettings(patch).then(function (s) { RAX.state.settings = s; return s; }); };
  app.setCategory = function (id) {
    return app.saveSettings({ category: id, chosenAt: Date.now(), skipped: false }).then(function () {
      UI.renderTop();
      return B.loadForCategory(id);
    }).then(function () { U.toast('Category set to ' + id, 'circle-check'); if (location.hash === '#/start' || location.hash === '') location.hash = '#/dashboard'; else app.route(); });
  };

  // ── router ──
  var DEFAULT = 'dashboard';
  app.go = function (h) { if (location.hash === h) app.route(); else location.hash = h; };
  app.route = function () {
    var raw = location.hash.replace(/^#\/?/, '') || DEFAULT, parts = raw.split('?')[0].split('/'), name = parts[0], params = parts.slice(1).map(decodeURIComponent);
    var query = {}; (raw.split('?')[1] || '').split('&').forEach(function (kv) { if (kv) { var p = kv.split('='); query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); } });
    var s = RAX.state.settings;
    if (!s.category && !s.skipped && name !== 'start' && name !== 'settings') { location.replace('#/start'); return; }
    var view = RAX.views[name];
    if (!view) { name = 'notfound'; view = RAX.views.notfound; }
    var expired = E.activeMock();
    if (expired && Date.now() >= expired.endTime && name !== 'exam') {
      B.load(B.filesForCategory(expired.category)).then(function () { E.submitMock(expired, true); U.toast('Time ran out on “' + expired.title + '” — it was submitted automatically.', 'stopwatch', 5000); });
    }
    if (RAX.state.cleanup) { try { RAX.state.cleanup(); } catch (e) { console.error(e); } }
    RAX.state.cleanup = null; RAX.state.keys = null; RAX.state.view = name;
    document.body.setAttribute('data-view', name);
    UI.setActive(name === 'session' ? 'practice' : name === 'exam' || name === 'result' ? 'mocks' : name);
    var root = U.$('#view');
    root.onclick = null; root.onsubmit = null; root.oninput = null; root.onchange = null;
    var need = s.category ? B.filesForCategory(s.category) : ['verbal', 'quantitative'];
    var ready = need.every(function (k) { return B.files[k]; });
    if (!ready) root.innerHTML = '<div class="loading">' + I('rotate', 'spin') + '<span>Loading questions…</span></div>';
    B.load(need).then(function () {
      return view(root, params, query);
    }).then(function () {
      root.classList.remove('view-in'); void root.offsetWidth; root.classList.add('view-in');
      UI.animateRings(root);
      if (!app._noFocus) { root.focus({ preventScroll: true }); window.scrollTo(0, 0); }
      app._noFocus = false;
    }).catch(function (e) {
      console.error(e);
      root.innerHTML = UI.empty('triangle-exclamation', 'Something went wrong', esc(e.message || String(e)) + '<br>Try reloading the page.', '<button class="btn btn-primary" onclick="location.reload()">Reload</button>');
    });
  };

  // ── global click actions ──
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-action]'); if (!a) return;
    var act = a.getAttribute('data-action'), qid = a.getAttribute('data-q');
    switch (act) {
      case 'toggle-theme': app.toggleTheme(); break;
      case 'switch-category': UI.categoryModal(); break;
      case 'quote-next': UI.quoteStep(a.closest('.quote-card'), 1); break;
      case 'quote-prev': UI.quoteStep(a.closest('.quote-card'), -1); break;
      case 'bookmark': {
        var on = E.toggleBookmark(qid);
        a.setAttribute('aria-pressed', on); a.innerHTML = I(on ? 'bookmark' : 'bookmark-o') + '<span>' + (on ? 'Bookmarked' : 'Bookmark') + '</span>';
        U.toast(on ? 'Added to bookmarks' : 'Removed from bookmarks', 'bookmark'); break;
      }
      case 'note': app.noteModal(qid, a); break;
      case 'report': app.reportModal(qid); break;
      default: return;
    }
  });

  app.noteModal = function (qid, btn) {
    var st = E.qs(qid), q = B.get(qid);
    var md = U.modal('<h2>Your note</h2><p class="muted small">' + esc((q && q.question || '').slice(0, 140)) + '</p><div class="field"><label for="noteTxt">Note (only saved on this device)</label><textarea id="noteTxt" class="textarea" maxlength="4000">' + esc(st.note || '') + '</textarea></div>' +
      '<div class="btn-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="noteSave">Save note</button></div>', { label: 'Note' });
    U.$('#noteSave', md.el).addEventListener('click', function () {
      E.setNote(qid, U.$('#noteTxt', md.el).value.trim()); md.close(); U.toast('Note saved', 'note-sticky');
      if (btn) btn.innerHTML = I('note-sticky') + '<span>' + (E.qs(qid).note ? 'Edit note' : 'Add note') + '</span>';
    });
  };
  app.reportModal = function (qid) {
    var q = B.get(qid);
    var md = U.modal('<h2>Report this question</h2><p class="muted small">Reports are saved on this device. You can export them or email them from <a href="#/reports" data-close>Reported questions</a>.</p>' +
      '<div class="stack"><div class="field"><label for="repReason">What is wrong?</label><select id="repReason" class="select"><option>The marked answer looks wrong</option><option>An option is unreadable or garbled</option><option>Typo or missing words</option><option>The question is unclear</option><option>Duplicate question</option><option>Something else</option></select></div>' +
      '<div class="field"><label for="repTxt">Details (optional)</label><textarea id="repTxt" class="textarea" maxlength="2000" placeholder="For example: the answer should be (C) because…"></textarea></div></div>' +
      '<div class="btn-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="repSave">Save report</button></div>', { label: 'Report question' });
    U.$('#repSave', md.el).addEventListener('click', function () {
      S.put('reports', { id: U.uid('rep'), qid: qid, reason: U.$('#repReason', md.el).value, details: U.$('#repTxt', md.el).value.trim(), ts: Date.now(),
        question: q ? q.question.slice(0, 300) : '', subject: q ? q.subject : '', page: q ? q.source.page : null });
      md.close(); U.toast('Report saved — thank you', 'flag');
    });
  };

  // ── keyboard shortcuts (delegated to the current view) ──
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (document.querySelector('.modal-back')) return;
    if (RAX.state.keys) RAX.state.keys(e);
  });

  // ── saved indicator ──
  RAX.on('saved', function () { UI.flashSaved(); });
  RAX.on('save-error', function () { U.toast('Could not save — your browser storage may be full or blocked.', 'triangle-exclamation', 4000); });

  // ── boot ──
  function boot() {
    S.init().then(function (mode) {
      RAX.state.settings = S.settings();
      app.applyTheme();
      UI.shell();
      if (mode !== 'indexeddb') {
        var n = document.createElement('div'); n.className = 'storage-notice'; n.setAttribute('role', 'alert');
        n.innerHTML = I('triangle-exclamation') + '<span>This browser is not letting RAXUSATPrep save to its storage' + (S.error ? ' (' + esc(S.error) + ')' : '') + '. Your progress will last only until you close this tab — export a backup from Settings, or open the site in a normal (not private) window.</span><button class="btn btn-sm" onclick="this.parentNode.remove()">Dismiss</button>';
        document.body.insertBefore(n, document.body.firstChild);
      }
      window.addEventListener('hashchange', app.route);
      if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', app.applyTheme);
      UI.startQuotes();
      var bootEl = U.$('#boot'); if (bootEl) { bootEl.classList.add('done'); setTimeout(function () { bootEl.remove(); }, 500); }
      app.route();
      // PWA: only over http(s)
      if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('../sw.js').catch(function () { });
    });
  }
  RAX.on('answered', function () { var p = E.progress(); var el = U.$('.streak b'); if (el) el.textContent = p.streak; });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
