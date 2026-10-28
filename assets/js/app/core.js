/* RAXUSATPrep — core utilities (namespace, escaping, dates, randomness, toasts, modals, confetti). */
(function () {
  'use strict';
  var RAX = window.RAX = window.RAX || {};
  var U = RAX.util = {};

  U.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  U.$ = function (sel, root) { return (root || document).querySelector(sel); };
  U.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  U.uid = function (p) { return (p || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); };
  U.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  U.pct = function (a, b) { return b ? Math.round((a / b) * 100) : 0; };
  U.plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); };
  U.fmtNum = function (n) { return Number(n || 0).toLocaleString('en-US'); };
  U.debounce = function (fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; };

  // ── dates (local) ──
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  U.dayKey = function (d) { d = d ? new Date(d) : new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  U.today = function () { return U.dayKey(new Date()); };
  U.addDays = function (key, n) { var p = key.split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]); d.setDate(d.getDate() + n); return U.dayKey(d); };
  U.daysBetween = function (a, b) {
    var pa = a.split('-'), pb = b.split('-');
    return Math.round((new Date(+pb[0], +pb[1] - 1, +pb[2]) - new Date(+pa[0], +pa[1] - 1, +pa[2])) / 864e5);
  };
  U.fmtDate = function (ts) { try { return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } };
  U.fmtDateTime = function (ts) { try { return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
  U.fmtClock = function (ms) {
    ms = Math.max(0, ms); var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    return (h ? h + ':' + pad(m) : m) + ':' + pad(r);
  };
  U.fmtDur = function (ms) {
    var s = Math.round(ms / 1000); if (s < 60) return s + 's';
    var m = Math.floor(s / 60); if (m < 60) return m + 'm ' + (s % 60) + 's';
    return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
  };

  // ── seeded randomness ──
  U.hash = function (str) { var h = 1779033703 ^ str.length; for (var i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return h >>> 0; };
  U.rng = function (seed) {
    var a = typeof seed === 'string' ? U.hash(seed) : (seed >>> 0) || 1;
    return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  U.shuffle = function (arr, rnd) { rnd = rnd || Math.random; var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  U.sample = function (arr, n, rnd) { return U.shuffle(arr, rnd).slice(0, n); };

  // ── script loader (classic scripts work from file:// too) ──
  var loaded = {};
  U.loadScript = function (src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = src; s.async = true;
      s.onload = function () { res(); }; s.onerror = function () { delete loaded[src]; rej(new Error('Could not load ' + src)); };
      document.head.appendChild(s);
    });
    return loaded[src];
  };

  // ── download helper ──
  U.download = function (name, text, type) {
    var blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  };

  // ── events ──
  var bus = {};
  RAX.on = function (ev, fn) { (bus[ev] = bus[ev] || []).push(fn); };
  RAX.emit = function (ev, data) { (bus[ev] || []).slice().forEach(function (fn) { try { fn(data); } catch (e) { console.error(e); } }); };

  // ── toasts ──
  U.toast = function (msg, icon, ms) {
    var box = U.$('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    var t = document.createElement('div'); t.className = 'toast';
    t.innerHTML = (icon ? RAX.icon(icon) : '') + '<span>' + U.esc(msg) + '</span>';
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 320); }, ms || 2600);
  };

  // ── modal ──
  U.modal = function (html, opts) {
    opts = opts || {};
    var prev = document.activeElement;
    var back = document.createElement('div'); back.className = 'modal-back';
    back.innerHTML = '<div class="modal ' + (opts.wide ? 'wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + U.esc(opts.label || 'Dialog') + '" tabindex="-1">' + html + '</div>';
    document.body.appendChild(back);
    var m = back.firstChild;
    function close(v) { back.remove(); document.removeEventListener('keydown', onKey, true); if (prev && prev.focus) prev.focus(); if (opts.onClose) opts.onClose(v); }
    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      if (e.key === 'Tab') {
        var f = U.$$('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', m).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
        if (!f.length) return; var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey, true);
    back.addEventListener('click', function (e) { if (e.target === back && !opts.sticky) close(); var c = e.target.closest('[data-close]'); if (c) close(c.getAttribute('data-close')); });
    setTimeout(function () { var a = U.$('[autofocus]', m) || U.$('input,select,textarea,button', m) || m; a.focus(); }, 30);
    return { el: m, close: close };
  };
  U.confirm = function (title, body, okLabel, danger) {
    return new Promise(function (res) {
      var md = U.modal('<h2>' + U.esc(title) + '</h2><p class="ink2">' + body + '</p><div class="btn-row" style="justify-content:flex-end;margin-top:18px">' +
        '<button class="btn" data-close="no">Cancel</button><button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" data-close="yes" autofocus>' + U.esc(okLabel || 'OK') + '</button></div>',
        { label: title, onClose: function (v) { res(v === 'yes'); } });
    });
  };

  // ── motion preference ──
  U.reducedMotion = function () {
    return (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || document.documentElement.classList.contains('reduce-motion');
  };

  // ── confetti (canvas, no library) ──
  U.confetti = function (opts) {
    opts = opts || {};
    if (U.reducedMotion() || (RAX.state && RAX.state.settings && RAX.state.settings.effects === false)) return;
    var c = document.createElement('canvas'); c.className = 'confetti'; c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:95';
    document.body.appendChild(c);
    var ctx = c.getContext('2d'), W = c.width = innerWidth * devicePixelRatio, H = c.height = innerHeight * devicePixelRatio;
    var colors = ['#F6A609', '#4B3FD8', '#8F87FF', '#0D7F73', '#E2557A', '#FFC24A'];
    var n = opts.count || 140, parts = [];
    for (var i = 0; i < n; i++) parts.push({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .35, vx: (Math.random() - .5) * 26 * devicePixelRatio, vy: (-Math.random() * 22 - 6) * devicePixelRatio,
      s: (6 + Math.random() * 8) * devicePixelRatio, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: colors[i % colors.length], round: Math.random() < .35 });
    var t0 = performance.now();
    (function frame(t) {
      var el = t - t0; ctx.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        p.vy += .55 * devicePixelRatio; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - el / 2600); ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 6.283); ctx.fill(); } else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      });
      if (el < 2600) requestAnimationFrame(frame); else c.remove();
    })(t0);
  };

  // ── count-up animation for real numbers ──
  U.countUp = function (el, to, ms) {
    to = Number(to) || 0;
    if (U.reducedMotion() || to === 0) { el.textContent = U.fmtNum(to) + (el.dataset.suffix || ''); return; }
    var t0 = performance.now(); ms = ms || 900;
    (function f(t) { var k = Math.min(1, (t - t0) / ms); var e = 1 - Math.pow(1 - k, 3); el.textContent = U.fmtNum(Math.round(to * e)) + (el.dataset.suffix || ''); if (k < 1) requestAnimationFrame(f); })(t0);
  };
})();
