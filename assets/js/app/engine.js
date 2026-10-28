/* RAXUSATPrep — learning engine: answers, Leitner revision, stats, mock generator, daily challenge, achievements. Pure logic where possible. */
(function () {
  'use strict';
  var RAX = window.RAX, U = RAX.util, S = RAX.store, B = RAX.bank;
  var E = RAX.engine = {};

  // ───────── per-question state ─────────
  E.qs = function (id) { return S.get('qstate', id) || { id: id, att: 0, cor: 0, last: null, lastMode: null, lastTs: 0, box: 0, due: null, inL: false, mastered: false, bm: false, note: '', ms: 0 }; };
  E.saveQs = function (st) { return S.put('qstate', st); };

  /** Leitner update — pure. days: [box1..box5] intervals; returns new {box,due,inL,mastered}. */
  E.leitner = function (st, correct, today, days) {
    days = days || RAX.config.leitnerDays;
    var r = { box: st.box || 0, due: st.due, inL: !!st.inL, mastered: !!st.mastered };
    if (!correct) { r.box = 1; r.due = today; r.inL = true; r.mastered = false; return r; }
    if (!r.inL) return r;                       // correct answer on a question that is not in revision: nothing to move
    if (r.due && r.due > today) return r;       // not due yet: box stays
    if (r.box >= 5) { r.mastered = true; r.inL = false; r.due = null; return r; }
    r.box = r.box + 1; r.due = U.addDays(today, days[r.box - 1]); return r;
  };

  /** Record one answer. ctx: {mode: practice|revision|daily|mock, sid, ms} */
  E.answer = function (q, chosen, ctx) {
    ctx = ctx || {};
    var correct = !!(q.answer && chosen && chosen === q.answer);
    var today = U.today(), st = E.qs(q.id);
    if (chosen) {
      st.att++; if (correct) st.cor++; st.last = correct ? 'ok' : 'bad'; st.lastMode = ctx.mode || 'practice'; st.lastTs = Date.now(); st.ms = (st.ms || 0) + (ctx.ms || 0);
      Object.assign(st, E.leitner(st, correct, today));
      E.saveQs(st);
    }
    if (ctx.mode !== 'mock' && chosen) {
      S.put('attempts', { id: U.uid('a'), qid: q.id, mode: ctx.mode || 'practice', sid: ctx.sid || null, chosen: chosen, ok: correct, ms: Math.round(ctx.ms || 0),
        ts: Date.now(), day: today, section: q.section, subject: q.subject, topic: q.topic });
    }
    RAX.emit('answered', { q: q, correct: correct, mode: ctx.mode });
    return correct;
  };
  E.toggleBookmark = function (id) { var st = E.qs(id); st.bm = !st.bm; E.saveQs(st); return st.bm; };
  E.setNote = function (id, text) { var st = E.qs(id); st.note = String(text || '').slice(0, 4000); E.saveQs(st); };

  // ───────── stats (practice attempts only; mocks are stored separately) ─────────
  E.attempts = function () { return S.all('attempts'); };
  E.totals = function (list) {
    list = list || E.attempts(); var c = 0, ms = 0;
    list.forEach(function (a) { if (a.ok) c++; ms += a.ms || 0; });
    return { answered: list.length, correct: c, wrong: list.length - c, accuracy: list.length ? Math.round(c / list.length * 100) : null, ms: ms };
  };
  E.byDay = function () { var m = {}; E.attempts().forEach(function (a) { m[a.day] = (m[a.day] || 0) + 1; }); return m; };
  /** streak — pure: consecutive active days ending today (or yesterday if nothing yet today). */
  E.streak = function (days, today) {
    today = today || U.today(); var d = days[today] ? today : U.addDays(today, -1), n = 0;
    while (days[d]) { n++; d = U.addDays(d, -1); }
    return n;
  };
  E.activeDays = function () { var days = E.byDay(); E.mockDays().forEach(function (d) { days[d] = (days[d] || 0) + 1; }); return days; };
  E.mockDays = function () { return S.all('mocks').filter(function (m) { return m.status === 'done'; }).map(function (m) { return U.dayKey(m.submitted); }); };
  E.groupAcc = function (key, list) {
    var g = {}; (list || E.attempts()).forEach(function (a) { var k = a[key]; if (!k) return; g[k] = g[k] || { key: k, answered: 0, correct: 0, ms: 0 }; g[k].answered++; if (a.ok) g[k].correct++; g[k].ms += a.ms || 0; });
    return Object.keys(g).map(function (k) { var x = g[k]; x.accuracy = Math.round(x.correct / x.answered * 100); x.avgMs = Math.round(x.ms / x.answered); return x; });
  };
  E.weakTopics = function (n, catId) {
    var allowed = catId ? E.subjectsInScope(catId) : null;
    return E.groupAcc('topic').filter(function (t) {
      if (t.answered < 5) return false;
      if (!allowed) return true;
      var any = E.attempts().filter(function (a) { return a.topic === t.key; })[0];
      return any && allowed.indexOf(any.subject) >= 0;
    }).sort(function (a, b) { return a.accuracy - b.accuracy; }).slice(0, n || 5);
  };
  E.subjectsInScope = function (catId) {
    var list = ['Verbal Reasoning', 'Quantitative Reasoning']; var c = B.cat(catId);
    if (c) c.subjects.forEach(function (s) { list.push(s.subject); });
    return list;
  };
  E.mistakes = function () { return S.all('qstate').filter(function (s) { return s.last === 'bad'; }); };
  E.due = function () { var t = U.today(); return S.all('qstate').filter(function (s) { return s.inL && !s.mastered && s.due && s.due <= t; }); };
  E.inRevision = function () { return S.all('qstate').filter(function (s) { return s.inL && !s.mastered; }); };
  E.mastered = function () { return S.all('qstate').filter(function (s) { return s.mastered; }); };
  E.bookmarks = function () { return S.all('qstate').filter(function (s) { return s.bm; }); };
  E.notes = function () { return S.all('qstate').filter(function (s) { return s.note; }); };
  E.seenIds = function () { var set = new Set(); S.all('qstate').forEach(function (s) { if (s.att) set.add(s.id); }); return set; };

  // coverage: share of the category's verified pool already answered at least once (needs files loaded)
  E.coverage = function (catId) {
    var seen = E.seenIds(), res = {};
    RAX.config.partI.sections.forEach(function (sec) {
      var subjects = sec.id === 'subject' ? B.subjectsFor(catId).filter(function (s) { return s.available; }).map(function (s) { return s.subject; }) : [null];
      subjects.forEach(function (sub) {
        var pool = B.pool({ section: sec.id === 'subject' ? 'subject' : sec.id, subject: sub || undefined, verifiedOnly: true, category: catId });
        var key = sub || sec.name, n = pool.filter(function (q) { return seen.has(q.id); }).length;
        res[key] = { done: n, total: pool.length };
      });
    });
    return res;
  };

  // ───────── option order (shuffle except "All of the above"-type questions) ─────────
  E.optionOrder = function (q, rnd) {
    var ids = q.options.map(function (o) { return o.id; });
    if (B.isAllOfAbove(q)) return ids;
    return U.shuffle(ids, rnd);
  };

  // ───────── mock generator ─────────
  /**
   * Build a test. spec: {category, type: 'full'|'section'|'subject'|'topic', section, subject, topic, count, seed, allowPartial}
   * Returns {ok, items:[{qid, section, label}], parts:[{name, need, have}], shortages:[...], minutes, title}
   */
  E.buildTest = function (spec) {
    var cfg = RAX.config, rnd = U.rng(spec.seed || (Date.now() + ':' + Math.random()));
    var used = new Set(), parts = [], items = [];
    var recent = E.recentMockQids(3);
    function take(pool, n, label, section, subject, topic) {
      pool = pool.filter(function (q) { return !used.has(q.id) && q.answer; });
      var fresh = pool.filter(function (q) { return !recent.has(q.id); }), stale = pool.filter(function (q) { return recent.has(q.id); });
      var pick = U.shuffle(fresh, rnd).concat(U.shuffle(stale, rnd)).slice(0, n);
      pick.forEach(function (q) { used.add(q.id); items.push({ qid: q.id, section: section, label: label }); });
      parts.push({ name: label, section: section, subject: subject || null, topic: topic || null, need: n, have: pick.length });
      return pick.length;
    }
    function takePassages(pool, n, label) {
      // keep comprehension questions grouped by passage; pick whole groups that add up exactly to n
      var groups = {}; pool.forEach(function (q) { if (q.passageId && q.answer && !used.has(q.id)) (groups[q.passageId] = groups[q.passageId] || []).push(q); });
      var gl = U.shuffle(Object.keys(groups), rnd).map(function (k) { return groups[k]; });
      var chosen = [], left = n;
      gl.sort(function (a, b) { return (recent.has(a[0].id) ? 1 : 0) - (recent.has(b[0].id) ? 1 : 0); });
      gl.forEach(function (g) { if (left > 0 && g.length <= left) { chosen.push(g); left -= g.length; } });
      chosen.forEach(function (g) { g.forEach(function (q) { used.add(q.id); items.push({ qid: q.id, section: 'verbal', label: label, passageId: q.passageId }); }); });
      parts.push({ name: label, section: 'verbal', topic: 'Comprehension', need: n, have: n - left });
      return n - left;
    }
    function sectionBlock(sec) {
      if (sec.id === 'subject') {
        B.subjectsFor(spec.category).forEach(function (s) {
          var pool = s.available ? B.pool({ section: 'subject', subject: s.subject, mock: true, category: spec.category }) : [];
          take(pool, s.count, s.subject, 'subject', s.subject);
        });
      } else {
        sec.topics.forEach(function (t) {
          var pool = B.pool({ section: sec.id, topic: t.topic, mock: true });
          if (t.topic === 'Comprehension') takePassages(pool, t.count, sec.short + ' · ' + t.topic);
          else take(pool, t.count, sec.short + ' · ' + t.topic, sec.id, null, t.topic);
        });
      }
    }
    var title, minutes;
    if (spec.type === 'full') {
      cfg.partI.sections.forEach(sectionBlock); title = 'Full mock — ' + spec.category;
    } else if (spec.type === 'section') {
      var sec = cfg.partI.sections.filter(function (s) { return s.id === spec.section; })[0];
      sectionBlock(sec); title = sec.name + ' test';
    } else if (spec.type === 'subject') {
      var n = spec.count || 20;
      var pool = B.pool({ subject: spec.subject, mock: true });
      take(pool, n, spec.subject, pool[0] ? pool[0].section : 'subject', spec.subject); title = spec.subject + ' test';
    } else if (spec.type === 'topic') {
      var n2 = spec.count || 10;
      var pool2 = B.pool({ subject: spec.subject, topic: spec.topic, mock: true });
      if (spec.topic === 'Comprehension') takePassages(pool2, Math.min(n2, pool2.length), 'Comprehension');
      else take(pool2, n2, spec.topic, pool2[0] ? pool2[0].section : 'subject', spec.subject, spec.topic);
      title = spec.topic + ' test';
    }
    var shortages = parts.filter(function (p) { return p.have < p.need; });
    // order: VR → QR → subjects; shuffle inside each section but keep passage groups together
    var order = ['verbal', 'quantitative', 'subject'], final = [];
    order.forEach(function (secId) {
      var inSec = items.filter(function (i) { return i.section === secId; });
      var units = [], seenP = {};
      inSec.forEach(function (i) {
        if (i.passageId) { if (!seenP[i.passageId]) { seenP[i.passageId] = []; units.push(seenP[i.passageId]); } seenP[i.passageId].push(i); }
        else units.push([i]);
      });
      U.shuffle(units, rnd).forEach(function (u) { u.forEach(function (i) { final.push(i); }); });
    });
    var total = final.length;
    minutes = spec.minutes || E.defaultMinutes(total);
    var need = parts.reduce(function (a, p) { return a + p.need; }, 0);
    return { ok: shortages.length === 0, items: final, parts: parts, shortages: shortages, minutes: minutes, title: title, need: need, have: total };
  };
  E.defaultMinutes = function (n) { var c = RAX.config.partI; return Math.max(1, Math.round(c.minutes * n / c.totalQuestions)); };
  E.recentMockQids = function (n) {
    var set = new Set();
    S.all('mocks').sort(function (a, b) { return b.created - a.created; }).slice(0, n).forEach(function (m) { (m.items || []).forEach(function (i) { set.add(i.qid); }); });
    return set;
  };

  /** Create and store a mock attempt from a built test. */
  E.startMock = function (built, spec) {
    var rnd = U.rng(U.uid('o')), now = Date.now();
    var m = { id: U.uid('mock'), kind: spec.type, category: spec.category || null, spec: spec, title: (spec.partial ? 'Partial practice test — ' + (spec.category || '') : built.title),
      partial: !!spec.partial, items: built.items, parts: built.parts, shortages: built.shortages, minutes: built.minutes, created: now, started: now, endTime: now + built.minutes * 60000,
      answers: {}, flags: {}, times: {}, order: {}, idx: 0, status: 'active', negative: E.negativeSetting(), combined: !!spec.combined };
    built.items.forEach(function (i) { var q = B.get(i.qid); m.order[i.qid] = E.optionOrder(q, rnd); });
    S.put('mocks', m);
    return m;
  };
  E.negativeSetting = function () {
    var s = RAX.state.settings, c = RAX.config.negativeMarking;
    var on = s.negativeMarking == null ? c.enabled : s.negativeMarking;
    return on ? c.perWrong : 0;
  };

  /** Score a mock — pure given questions. */
  E.scoreMock = function (m) {
    var res = { correct: 0, wrong: 0, skipped: 0, total: m.items.length, bySection: {}, bySubject: {}, byTopic: {}, score: 0, neg: m.negative || 0 };
    m.items.forEach(function (it) {
      var q = B.get(it.qid); if (!q) return;
      var a = m.answers[it.qid], st = a ? (a === q.answer ? 'ok' : 'bad') : 'skip';
      if (st === 'ok') res.correct++; else if (st === 'bad') res.wrong++; else res.skipped++;
      [['bySection', q.section === 'subject' ? 'Subject Knowledge' : q.subject], ['bySubject', q.subject], ['byTopic', q.subject + ' › ' + q.topic]].forEach(function (p) {
        var g = res[p[0]][p[1]] = res[p[0]][p[1]] || { name: p[1], total: 0, correct: 0, wrong: 0, skipped: 0, ms: 0 };
        g.total++; g[st === 'ok' ? 'correct' : st === 'bad' ? 'wrong' : 'skipped']++; g.ms += (m.times[it.qid] || 0);
      });
    });
    res.score = Math.round((res.correct - res.wrong * res.neg) * 100) / 100;
    res.percent = res.total ? Math.round(res.correct / res.total * 100) : 0;
    res.accuracy = (res.correct + res.wrong) ? Math.round(res.correct / (res.correct + res.wrong) * 100) : null;
    return res;
  };
  /** Submit once (guarded). Updates per-question state so wrong answers enter revision. */
  E.submitMock = function (m, auto) {
    if (m.status !== 'active') return m;
    m.status = 'done'; m.submitted = Math.min(Date.now(), m.endTime + 1000); m.auto = !!auto;
    m.result = E.scoreMock(m);
    m.items.forEach(function (it) { var q = B.get(it.qid); var a = m.answers[it.qid]; if (q && a) E.answer(q, a, { mode: 'mock', ms: m.times[it.qid] || 0 }); });
    S.put('mocks', m);
    RAX.emit('mock-done', m);
    return m;
  };
  E.doneMocks = function (filter) { return S.all('mocks').filter(function (m) { return m.status === 'done' && (!filter || filter(m)); }).sort(function (a, b) { return a.submitted - b.submitted; }); };
  E.activeMock = function () { return S.all('mocks').filter(function (m) { return m.status === 'active'; }).sort(function (a, b) { return b.created - a.created; })[0] || null; };

  // ───────── practice sets ─────────
  E.smartMix = function (catId, n) {
    var pool = B.pool({ category: catId }).filter(function (q) { return q.answer; });
    var byId = {}; pool.forEach(function (q) { byId[q.id] = q; });
    var due = E.due().map(function (s) { return byId[s.id]; }).filter(Boolean);
    var weak = E.weakTopics(4, catId).map(function (t) { return t.key; });
    var seen = E.seenIds();
    var weakQ = pool.filter(function (q) { return weak.indexOf(q.topic) >= 0 && !seen.has(q.id); });
    var unseen = pool.filter(function (q) { return !seen.has(q.id); });
    var picked = [], have = new Set();
    function add(list, k) { U.shuffle(list).forEach(function (q) { if (k > 0 && !have.has(q.id) && !q.passageId) { picked.push(q); have.add(q.id); k--; } }); }
    add(due, Math.round(n * .4)); add(weakQ, Math.round(n * .3));
    E.balanced(catId, n - picked.length + 4, function (q) { return !q.passageId && !have.has(q.id) && !seen.has(q.id); }).forEach(function (q) { if (picked.length < n && !have.has(q.id)) { picked.push(q); have.add(q.id); } });
    add(pool, n - picked.length);
    return U.shuffle(picked).slice(0, n);
  };
  /** Buckets that follow the test pattern: VR topics, QR topics and the category's available subjects, weighted by MCQ count. */
  E.buckets = function (catId) {
    var out = [];
    RAX.config.partI.sections.forEach(function (sec) {
      if (sec.id === 'subject') { B.subjectsFor(catId).forEach(function (s) { if (s.available) out.push({ w: s.count, f: { subject: s.subject } }); }); }
      else sec.topics.forEach(function (t) { out.push({ w: t.count, f: { section: sec.id, topic: t.topic } }); });
    });
    return out;
  };
  /** Pick n questions spread across the pattern (largest-remainder allocation), unseen first, passage groups kept whole. */
  E.balanced = function (catId, n, accept) {
    var bks = E.buckets(catId), tw = bks.reduce(function (a, b) { return a + b.w; }, 0), seen = E.seenIds(), rnd = Math.random;
    var alloc = bks.map(function (b) { var x = n * b.w / tw; return { b: b, k: Math.floor(x), r: x - Math.floor(x) + rnd() * 0.5 }; });
    var left = n - alloc.reduce(function (a, x) { return a + x.k; }, 0);
    alloc.slice().sort(function (a, b) { return b.r - a.r; }).slice(0, left).forEach(function (x) { x.k++; });
    var out = [], have = new Set();
    alloc.forEach(function (x) {
      if (!x.k) return;
      var pool = B.pool(Object.assign({ category: catId }, x.b.f)).filter(function (q) { return (q.answer || RAX.state.settings.showUnverified) && (!accept || accept(q)); });
      var list = U.shuffle(pool.filter(function (q) { return !seen.has(q.id); })).concat(U.shuffle(pool.filter(function (q) { return seen.has(q.id); })));
      var k = x.k;
      for (var i = 0; i < list.length && k > 0; i++) {
        var q = list[i]; if (have.has(q.id)) continue;
        if (q.passageId) { var grp = pool.filter(function (y) { return y.passageId === q.passageId && !have.has(y.id); }); if (grp.length > k && k < 2) continue; grp.forEach(function (y) { out.push(y); have.add(y.id); k--; }); }
        else { out.push(q); have.add(q.id); k--; }
      }
    });
    return out;
  };
  E.quickSet = function (catId, n, filter) {
    if (!filter || !Object.keys(filter).length) return U.shuffle(E.balanced(catId, n)).sort(function (a, b) { return a.passageId && b.passageId ? (a.passageId < b.passageId ? -1 : 1) : 0; });
    var pool = B.pool(Object.assign({ category: catId }, filter || {})).filter(function (q) { return q.answer || RAX.state.settings.showUnverified; });
    var seen = E.seenIds();
    var unseen = pool.filter(function (q) { return !seen.has(q.id); });
    var rest = pool.filter(function (q) { return seen.has(q.id); });
    var list = U.shuffle(unseen).concat(U.shuffle(rest));
    // keep passage questions together with their siblings
    var out = [], have = new Set();
    for (var i = 0; i < list.length && out.length < n; i++) {
      var q = list[i]; if (have.has(q.id)) continue;
      if (q.passageId) { pool.filter(function (x) { return x.passageId === q.passageId; }).forEach(function (x) { if (!have.has(x.id)) { out.push(x); have.add(x.id); } }); }
      else { out.push(q); have.add(q.id); }
    }
    return out;
  };

  // ───────── daily challenge (same set for everyone on a date and category) ─────────
  E.dailySet = function (catId, day) {
    day = day || U.today(); var rnd = U.rng('daily|' + day + '|' + (catId || 'common'));
    function from(filter, k) {
      var pool = B.pool(Object.assign({ mock: true }, filter)).filter(function (q) { return q.answer && !q.passageId; }).sort(function (a, b) { return a.id < b.id ? -1 : 1; });
      return U.shuffle(pool, rnd).slice(0, k);
    }
    var list = [].concat(from({ section: 'verbal', topic: 'Analogy' }, 1), from({ section: 'verbal', topic: 'Sentence Completion' }, 1), from({ section: 'verbal', topic: 'Synonyms / Antonyms' }, 1),
      from({ section: 'quantitative' }, 3));
    var subs = catId ? B.subjectsFor(catId).filter(function (s) { return s.available; }) : [];
    if (subs.length) { var per = Math.ceil(4 / subs.length); subs.forEach(function (s) { list = list.concat(from({ subject: s.subject }, per)); }); list = list.slice(0, 10); }
    else list = list.concat(from({ section: 'quantitative', topic: 'Scenario-based / Mental Maths' }, 2), from({ section: 'verbal', topic: 'Analogy' }, 2)).slice(0, 10);
    var seen = new Set(); return list.filter(function (q) { if (seen.has(q.id)) return false; seen.add(q.id); return true; });
  };

  // ───────── achievements & XP (computed from real activity) ─────────
  E.progress = function () {
    var t = E.totals(), days = E.activeDays(), streak = E.streak(days), mocks = E.doneMocks().length;
    var essays = S.all('essays').filter(function (e) { return e.status === 'submitted'; }).length;
    var daily = S.all('kv').filter(function (k) { return k.id.indexOf('daily:') === 0 && k.done; }).length;
    var revOk = E.attempts().filter(function (a) { return a.mode === 'revision' && a.ok; }).length;
    var xp = t.correct * 10 + t.wrong * 2 + mocks * 60 + essays * 40 + daily * 25;
    var level = Math.floor(Math.sqrt(xp / 120)) + 1, base = Math.pow(level - 1, 2) * 120, next = Math.pow(level, 2) * 120;
    var badges = [
      { id: 'first', name: 'First step', desc: 'Answer your first question', icon: 'seedling', got: t.answered >= 1 },
      { id: 'fifty', name: 'Warm-up', desc: 'Answer 50 questions', icon: 'bolt', got: t.answered >= 50, prog: [t.answered, 50] },
      { id: 'hundred', name: 'Century', desc: 'Answer 100 questions', icon: 'medal', got: t.answered >= 100, prog: [t.answered, 100] },
      { id: 'k', name: 'Marathon', desc: 'Answer 1,000 questions', icon: 'route', got: t.answered >= 1000, prog: [t.answered, 1000] },
      { id: 'sharp', name: 'Sharp shooter', desc: '80% accuracy over 50+ answers', icon: 'bullseye', got: t.answered >= 50 && t.accuracy >= 80 },
      { id: 'fire3', name: 'On fire', desc: 'A 3-day study streak', icon: 'fire', got: streak >= 3, prog: [streak, 3] },
      { id: 'fire7', name: 'Week warrior', desc: 'A 7-day study streak', icon: 'crown', got: streak >= 7, prog: [streak, 7] },
      { id: 'mock1', name: 'Mock debut', desc: 'Finish your first test', icon: 'stopwatch', got: mocks >= 1 },
      { id: 'mock5', name: 'Test-ready', desc: 'Finish 5 tests', icon: 'trophy', got: mocks >= 5, prog: [mocks, 5] },
      { id: 'essay', name: 'Essayist', desc: 'Submit an essay', icon: 'feather-pointed', got: essays >= 1 },
      { id: 'rev', name: 'Comeback', desc: 'Get 10 revision questions right', icon: 'rotate', got: revOk >= 10, prog: [revOk, 10] },
      { id: 'daily5', name: 'Daily habit', desc: 'Finish 5 daily challenges', icon: 'calendar-check', got: daily >= 5, prog: [daily, 5] }
    ];
    return { xp: xp, level: level, levelBase: base, levelNext: next, streak: streak, totals: t, mocks: mocks, essays: essays, daily: daily, badges: badges };
  };

  // ───────── readiness overview (study indicator — not an HEC prediction) ─────────
  E.readiness = function (catId) {
    var cov = E.coverage(catId), done = 0, total = 0;
    Object.keys(cov).forEach(function (k) { done += cov[k].done; total += cov[k].total; });
    var recent = E.attempts().sort(function (a, b) { return b.ts - a.ts; }).slice(0, 200), acc = E.totals(recent).accuracy;
    var mocks = E.doneMocks(function (m) { return m.category === catId; }).slice(-3);
    var mockAvg = mocks.length ? Math.round(mocks.reduce(function (a, m) { return a + m.result.percent; }, 0) / mocks.length) : null;
    var days = E.activeDays(), active = 0; for (var i = 0; i < 14; i++) if (days[U.addDays(U.today(), -i)]) active++;
    var parts = [
      { name: 'Coverage', value: total ? Math.min(100, Math.round(done / Math.min(total, 600) * 100)) : 0, weight: .25, note: done + ' of ' + total + ' verified questions in your category answered at least once (full marks at 600).' },
      { name: 'Accuracy', value: acc == null ? 0 : acc, weight: .35, note: acc == null ? 'No practice answers yet.' : 'Your accuracy over the last ' + recent.length + ' practice answers.' },
      { name: 'Mock results', value: mockAvg == null ? 0 : mockAvg, weight: .25, note: mockAvg == null ? 'No finished tests in this category yet.' : 'Average of your last ' + mocks.length + ' test(s) in this category.' },
      { name: 'Consistency', value: Math.round(active / 14 * 100), weight: .15, note: U.plural(active, 'active day') + ' in the last 14.' }
    ];
    var score = Math.round(parts.reduce(function (a, p) { return a + p.value * p.weight; }, 0));
    return { score: score, parts: parts, enough: E.attempts().length >= 20 };
  };
})();
