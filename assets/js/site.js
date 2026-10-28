/* RAXUSATPrep — public site interactions: theme, menu, rotating quotes, answer-sheet animation, reveals, sample questions. */
(function () {
  'use strict';
  var RAX = window.RAX = window.RAX || {};
  document.documentElement.classList.add('js');
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // theme (shared key with the app)
  function applyTheme(t) { if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
  $$('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      var dark = cur ? cur === 'dark' : (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
      var next = dark ? 'light' : 'dark'; applyTheme(next);
      try { localStorage.setItem('rax-theme', next); } catch (e) { /* blocked */ }
    });
  });

  // menu
  var tg = $('.nav-toggle'), links = $('.nav-links');
  if (tg && links) {
    tg.addEventListener('click', function () { var o = links.classList.toggle('open'); tg.setAttribute('aria-expanded', o); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && links.classList.contains('open')) { links.classList.remove('open'); tg.setAttribute('aria-expanded', 'false'); tg.focus(); } });
  }
  var hdr = $('.site-header');
  if (hdr) { var onS = function () { hdr.classList.toggle('scrolled', scrollY > 8); }; addEventListener('scroll', onS, { passive: true }); onS(); }

  // rotating quotes
  var Q = RAX.quotes || [];
  $$('.quote-card').forEach(function (card) {
    if (!Q.length) return;
    var i = Math.floor(Math.random() * Q.length), bq = $('blockquote', card), by = $('figcaption', card);
    function show(k) {
      i = (k + Q.length) % Q.length;
      bq.classList.add('is-out'); by.classList.add('is-out');
      setTimeout(function () { bq.textContent = Q[i].text; by.innerHTML = '— ' + esc(Q[i].by) + (Q[i].ref ? ', <span>' + esc(Q[i].ref) + '</span>' : ''); bq.classList.remove('is-out'); by.classList.remove('is-out'); }, reduce ? 0 : 420);
    }
    show(i);
    $$('[data-quote]', card).forEach(function (b) { b.addEventListener('click', function () { show(i + (+b.getAttribute('data-quote'))); }); });
    if (!reduce) setInterval(function () { if (!card.matches(':hover') && !card.contains(document.activeElement)) show(i + 1); }, 8000);
  });

  // answer-sheet hero: a pencil fills bubbles row by row
  var omr = $('.omr');
  if (omr) {
    var rows = $$('.omr-row', omr), pencil = $('.pencil', omr), timeEl = $('[data-omr-time]', omr), doneEl = $('[data-omr-done]', omr);
    var answers = [1, 3, 0, 2, 1, 2, 3, 0], r = 0, left = 100 * 60 - 83;
    function place(row, col) {
      var b = $$('i', rows[row])[col], box = omr.getBoundingClientRect(), bb = b.getBoundingClientRect();
      pencil.style.transform = 'translate(' + (bb.left - box.left + 6) + 'px,' + (bb.top - box.top - 46) + 'px)';
    }
    function step() {
      rows.forEach(function (x) { x.classList.remove('cur'); });
      if (r >= rows.length) { setTimeout(function () { $$('i', omr).forEach(function (x) { x.classList.remove('on'); }); r = 0; if (doneEl) doneEl.textContent = '0'; setTimeout(step, 600); }, 2400); return; }
      rows[r].classList.add('cur'); place(r, answers[r]);
      setTimeout(function () { $$('i', rows[r])[answers[r]].classList.add('on'); if (doneEl) doneEl.textContent = String(r + 1); r++; setTimeout(step, 520); }, 620);
    }
    if (reduce) { rows.forEach(function (x, k) { $$('i', x)[answers[k]].classList.add('on'); }); if (doneEl) doneEl.textContent = String(rows.length); if (pencil) pencil.style.display = 'none'; }
    else { setTimeout(step, 700); setInterval(function () { left--; if (timeEl) { var m = Math.floor(left / 60), s = left % 60; timeEl.textContent = Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2) + ':' + ('0' + s).slice(-2); } }, 1000); }
  }

  // reveal on scroll + counters + bars
  function countUp(el) {
    var to = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = to.toLocaleString('en-US') + suf; return; }
    var t0 = performance.now();
    (function f(t) { var k = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e).toLocaleString('en-US') + suf; if (k < 1) requestAnimationFrame(f); })(t0);
  }
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; var el = e.target; io.unobserve(el);
      el.classList.add('is-in');
      $$('[data-count]', el).concat(el.hasAttribute('data-count') ? [el] : []).forEach(countUp);
      $$('[data-w]', el).forEach(function (b) { b.style.width = b.getAttribute('data-w'); });
    });
  }, { threshold: .15 }) : null;
  $$('.reveal,[data-count],.bank-bars').forEach(function (el) {
    if (io) io.observe(el); else { el.classList.add('is-in'); if (el.hasAttribute('data-count')) countUp(el); $$('[data-w]', el).forEach(function (b) { b.style.width = b.getAttribute('data-w'); }); }
  });

  // tilt on category tiles (pointer only)
  if (!reduce && window.matchMedia && matchMedia('(hover: hover)').matches) {
    $$('.cat-tile').forEach(function (t) {
      t.addEventListener('mousemove', function (e) { var b = t.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5; t.style.transform = 'perspective(700px) rotateX(' + (-y * 5) + 'deg) rotateY(' + (x * 6) + 'deg) translateY(-3px)'; });
      t.addEventListener('mouseleave', function () { t.style.transform = ''; });
    });
  }

  // sample questions (real, verified questions embedded by the build)
  $$('[data-tryq]').forEach(function (box) {
    var list; try { list = JSON.parse($('script[type="application/json"]', box).textContent); } catch (e) { return; }
    var i = 0, L = 'ABCDE';
    function render() {
      var q = list[i];
      $('.tryq-body', box).innerHTML = '<div class="q-meta"><span class="chip chip-indigo">' + esc(q.subject) + '</span><span class="chip">' + esc(q.topic) + '</span></div>' +
        (q.passage ? '<details class="passage" open><summary>Read the passage</summary><p>' + esc(q.passage) + '</p></details>' : '') +
        '<p class="q-text">' + esc(q.question) + '</p><div class="opts">' + q.options.map(function (o, k) {
          return '<button type="button" class="opt" data-o="' + o.id + '"><span class="bubble"><span>' + L[k] + '</span></span><span>' + esc(o.text) + '</span></button>';
        }).join('') + '</div><div class="fb" role="status"></div>';
      $('[data-tq-count]', box).textContent = (i + 1) + ' of ' + list.length;
    }
    box.addEventListener('click', function (e) {
      var o = e.target.closest('[data-o]');
      if (o && !o.disabled) {
        var q = list[i], ok = o.getAttribute('data-o') === q.answer;
        $$('[data-o]', box).forEach(function (b) { b.disabled = true; if (b.getAttribute('data-o') === q.answer) { b.classList.add('is-ok'); $('.bubble', b).classList.add('is-ok'); } });
        if (!ok) { o.classList.add('is-bad'); $('.bubble', o).classList.add('is-bad'); }
        var fb = $('.fb', box); fb.className = 'fb show ' + (ok ? '' : 'bad');
        fb.innerHTML = '<b>' + (ok ? 'Correct!' : 'Not quite — the right answer is marked.') + '</b>' + (q.explanation ? '<p class="small" style="margin:6px 0 0">' + esc(q.explanation) + '</p>' : '');
      }
      if (e.target.closest('[data-tq-next]')) { i = (i + 1) % list.length; render(); }
    });
    render();
  });

  // pattern tables re-rendered from data/exam-config.js so edits there show up everywhere
  if (RAX.config) {
    $$('[data-pattern-date]').forEach(function (el) { try { el.textContent = new Date(RAX.config.patternLastChecked).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { } });
    $$('[data-cat-pattern]').forEach(function (el) {
      var c = RAX.config.categories.filter(function (x) { return x.id === el.getAttribute('data-cat-pattern'); })[0]; if (!c) return;
      var p = RAX.config.partI;
      el.innerHTML = '<thead><tr><th>Section</th><th>What it covers</th><th class="n">MCQs</th></tr></thead><tbody>' +
        p.sections.map(function (s) {
          if (s.id !== 'subject') return '<tr><td>' + esc(s.name) + '</td><td>' + esc(s.topics.map(function (t) { return t.topic + ' (' + t.count + ')'; }).join(', ')) + '</td><td class="n">' + s.count + '</td></tr>';
          return c.subjects.map(function (x) { return '<tr><td>' + esc(x.subject) + '</td><td>Subject knowledge</td><td class="n">' + x.count + '</td></tr>'; }).join('');
        }).join('') + '<tr><td><b>Total</b></td><td>' + p.minutes + ' minutes</td><td class="n"><b>' + p.totalQuestions + '</b></td></tr></tbody>';
    });
  }
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
