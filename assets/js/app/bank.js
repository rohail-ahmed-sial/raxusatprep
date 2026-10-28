/* RAXUSATPrep — question bank: lazy loading of subject files, indexing and pools. */
(function () {
  'use strict';
  var RAX = window.RAX, U = RAX.util;
  var B = RAX.bank = { byId: new Map(), loaded: {}, files: {} };
  var BASE = '../data/questions/';

  B.config = function () { return RAX.config; };
  B.cat = function (id) { return RAX.config.categories.filter(function (c) { return c.id === id; })[0] || null; };
  B.fileFor = function (subject) { return RAX.config.subjectFiles[subject] || null; };
  B.filesForCategory = function (catId) {
    var keys = ['verbal', 'quantitative'], c = B.cat(catId);
    if (c) c.subjects.forEach(function (s) { var f = B.fileFor(s.subject); if (f && keys.indexOf(f) < 0) keys.push(f); });
    return keys;
  };
  B.allFiles = function () { return Object.keys(RAX.bankManifest.sets); };

  B.load = function (keys) {
    keys = (keys || []).filter(function (k) { return RAX.bankManifest.sets[k]; });
    return Promise.all(keys.map(function (k) {
      if (B.loaded[k]) return B.loaded[k];
      B.loaded[k] = U.loadScript(BASE + RAX.bankManifest.sets[k].file).then(function () {
        var list = (RAX.questions && RAX.questions[k]) || [];
        list.forEach(function (q) {
          q.file = k;
          q.dup = (q.tags || []).some(function (t) { return t.indexOf('duplicate-of:') === 0; });
          B.byId.set(q.id, q);
        });
        B.files[k] = list;
        RAX.emit('bank-loaded', k);
        return list;
      });
      return B.loaded[k];
    }));
  };
  B.loadForCategory = function (catId) { return B.load(B.filesForCategory(catId)); };
  B.loadAll = function () { return B.load(B.allFiles()); };
  B.get = function (id) { return B.byId.get(id); };
  B.passage = function (pid) { return (RAX.passages || {})[pid] || null; };

  // A question is usable in practice if verified, or unverified while the setting allows it.
  B.usable = function (q, opts) {
    opts = opts || {};
    if (!q.options || q.options.length < 2) return false;   // options could not be read at all
    if (q.dup && opts.mock) return false;
    if (q.status === 'verified') return true;
    if (opts.mock || opts.verifiedOnly) return false;
    return !!(RAX.state.settings.showUnverified);
  };

  /** pool({files, section, subject, topic, mock, verifiedOnly, category}) → array of questions */
  B.pool = function (f) {
    f = f || {};
    var files = f.files || (f.category ? B.filesForCategory(f.category) : Object.keys(B.files));
    var out = [];
    files.forEach(function (k) {
      (B.files[k] || []).forEach(function (q) {
        if (f.section && q.section !== f.section) return;
        if (f.subject && q.subject !== f.subject) return;
        if (f.topic && q.topic !== f.topic) return;
        if (!B.usable(q, f)) return;
        if (f.category && q.categories.indexOf(f.category) < 0) return;
        out.push(q);
      });
    });
    return out;
  };

  // Subjects for a category, with what our bank actually holds (from the manifest — no loading needed).
  B.subjectsFor = function (catId) {
    var c = B.cat(catId); if (!c) return [];
    return c.subjects.map(function (s) {
      var f = B.fileFor(s.subject), m = f && RAX.bankManifest.sets[f];
      return { subject: s.subject, count: s.count, file: f, available: !!m, verified: m ? m.verified : 0, total: m ? m.total : 0 };
    });
  };
  B.manifestTopics = function (file) { var m = RAX.bankManifest.sets[file]; return m ? m.topics : {}; };

  // Topic tree for the explorer: sections → topics; subjects → chapters
  B.tree = function (catId) {
    var cfg = RAX.config, tree = [];
    cfg.partI.sections.forEach(function (sec) {
      if (sec.id === 'subject') {
        B.subjectsFor(catId).forEach(function (s) {
          var topics = s.available ? B.manifestTopics(s.file) : {};
          tree.push({ kind: 'subject', id: s.subject, name: s.subject, weight: s.count, available: s.available, file: s.file,
            topics: Object.keys(topics).map(function (t) { return { name: t, verified: topics[t].verified, total: topics[t].total }; }) });
        });
      } else {
        var file = sec.id, topics = B.manifestTopics(file);
        tree.push({ kind: 'section', id: sec.id, name: sec.name, weight: sec.count, available: true, file: file,
          topics: sec.topics.map(function (t) { var m = topics[t.topic] || { verified: 0, total: 0 }; return { name: t.topic, weight: t.count, verified: m.verified, total: m.total }; }) });
      }
    });
    return tree;
  };

  B.isAllOfAbove = function (q) {
    return q.options.some(function (o) { return /\b(all|none|both|neither)\b[^.]*\b(above|these|of them|options|choices|correct)\b|^\s*(both|neither|all of|none of)\b|\b[a-e] (and|&) [a-e]\b|\([a-e]\)/i.test(o.text); });
  };
})();
