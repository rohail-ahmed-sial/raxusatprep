/* RAXUSATPrep — local storage layer: IndexedDB with schema versions + in-memory fallback. Everything stays on this device. */
(function () {
  'use strict';
  var RAX = window.RAX, U = RAX.util;
  var DB_NAME = 'raxusatprep', DB_VERSION = 1, SCHEMA = 1;
  var STORES = ['kv', 'qstate', 'attempts', 'sessions', 'mocks', 'essays', 'reports', 'journal', 'flash'];
  var cache = {}; STORES.forEach(function (s) { cache[s] = new Map(); });
  var db = null;

  // Data migrations between schema versions (record-level). Add entries as the format evolves.
  var MIGRATIONS = {
    // 2: function (data) { /* transform cache maps in place */ }
  };

  var S = RAX.store = { mode: 'memory', schemaVersion: SCHEMA, stores: STORES, error: null };

  function openDB() {
    return new Promise(function (res, rej) {
      if (!window.indexedDB) return rej(new Error('IndexedDB is not available in this browser.'));
      var req;
      try { req = indexedDB.open(DB_NAME, DB_VERSION); } catch (e) { return rej(e); }
      req.onupgradeneeded = function () {
        var d = req.result;
        STORES.forEach(function (s) { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' }); });
      };
      req.onsuccess = function () { res(req.result); };
      req.onerror = function () { rej(req.error || new Error('Could not open the database.')); };
      req.onblocked = function () { rej(new Error('The database is blocked by another tab.')); };
      setTimeout(function () { rej(new Error('Opening the database timed out.')); }, 6000);
    });
  }
  function readAll(store) {
    return new Promise(function (res, rej) {
      var tx = db.transaction(store, 'readonly'), req = tx.objectStore(store).getAll();
      req.onsuccess = function () { res(req.result || []); }; req.onerror = function () { rej(req.error); };
    });
  }
  var pending = 0;
  function write(store, fn) {
    if (!db) { RAX.emit('saved', { mode: 'memory' }); return Promise.resolve(); }
    pending++; RAX.emit('saving');
    return new Promise(function (res) {
      try {
        var tx = db.transaction(store, 'readwrite'); fn(tx.objectStore(store));
        tx.oncomplete = function () { pending--; if (!pending) RAX.emit('saved', { mode: 'indexeddb' }); res(true); };
        tx.onerror = tx.onabort = function () { pending--; console.error(tx.error); RAX.emit('save-error', tx.error); res(false); };
      } catch (e) { pending--; console.error(e); RAX.emit('save-error', e); res(false); }
    });
  }

  S.init = function () {
    return openDB().then(function (d) {
      db = d; S.mode = 'indexeddb';
      return Promise.all(STORES.map(function (s) { return readAll(s).then(function (rows) { rows.forEach(function (r) { cache[s].set(r.id, r); }); }); }));
    }).catch(function (e) {
      console.warn('Storage fallback:', e); db = null; S.mode = 'memory'; S.error = e && e.message;
    }).then(function () {
      var meta = cache.kv.get('meta');
      if (!meta) { meta = { id: 'meta', schemaVersion: SCHEMA, created: Date.now() }; S.put('kv', meta); }
      for (var v = (meta.schemaVersion || 1) + 1; v <= SCHEMA; v++) { if (MIGRATIONS[v]) MIGRATIONS[v](cache); }
      if (meta.schemaVersion !== SCHEMA) { meta.schemaVersion = SCHEMA; S.put('kv', meta); }
      // settings revision 2: every question from the study documents is shown in practice by default
      var st = cache.kv.get('settings');
      if (st && (st.settingsRev || 1) < 2) { st.settingsRev = 2; st.showUnverified = true; S.put('kv', st); }
      return S.mode;
    });
  };

  S.get = function (store, id) { return cache[store].get(id); };
  S.all = function (store) { return Array.from(cache[store].values()); };
  S.count = function (store) { return cache[store].size; };
  S.put = function (store, obj) {
    if (!obj || obj.id == null) throw new Error('Record needs an id');
    obj.updated = Date.now();
    cache[store].set(obj.id, obj);
    var copy = JSON.parse(JSON.stringify(obj));
    return write(store, function (os) { os.put(copy); });
  };
  S.putMany = function (store, list) {
    list.forEach(function (o) { o.updated = o.updated || Date.now(); cache[store].set(o.id, o); });
    var copies = JSON.parse(JSON.stringify(list));
    return write(store, function (os) { copies.forEach(function (o) { os.put(o); }); });
  };
  S.del = function (store, id) { cache[store].delete(id); return write(store, function (os) { os.delete(id); }); };
  S.clearStore = function (store) { cache[store].clear(); return write(store, function (os) { os.clear(); }); };
  S.clearAll = function () { return Promise.all(STORES.map(S.clearStore)); };

  // ── export / import ──
  S.exportAll = function () {
    var out = { app: 'RAXUSATPrep', schemaVersion: SCHEMA, exported: new Date().toISOString(), stores: {} };
    STORES.forEach(function (s) { out.stores[s] = S.all(s); });
    return out;
  };
  S.validate = function (data) {
    var errs = [];
    if (!data || typeof data !== 'object') return ['The file is not a RAXUSATPrep backup.'];
    if (data.app !== 'RAXUSATPrep') errs.push('This file was not exported from RAXUSATPrep.');
    if (typeof data.schemaVersion !== 'number') errs.push('The backup has no schema version.');
    else if (data.schemaVersion > SCHEMA) errs.push('The backup comes from a newer version of RAXUSATPrep (schema ' + data.schemaVersion + ').');
    if (!data.stores || typeof data.stores !== 'object') errs.push('The backup has no data.');
    else Object.keys(data.stores).forEach(function (k) {
      if (STORES.indexOf(k) < 0) errs.push('Unknown section "' + k + '" in the backup.');
      else if (!Array.isArray(data.stores[k])) errs.push('Section "' + k + '" is not a list.');
      else if (data.stores[k].some(function (r) { return !r || typeof r !== 'object' || r.id == null || typeof r.id === 'object'; })) errs.push('Section "' + k + '" has records without a valid id.');
    });
    return errs;
  };
  S.importData = function (data, mode) {
    var errs = S.validate(data); if (errs.length) return Promise.reject(new Error(errs.join(' ')));
    var p = mode === 'replace' ? S.clearAll() : Promise.resolve();
    return p.then(function () {
      var jobs = [], counts = {};
      Object.keys(data.stores).forEach(function (k) {
        var rows = data.stores[k].filter(function (r) {
          if (k === 'kv' && r.id === 'meta') return false;
          if (mode === 'merge') { var cur = cache[k].get(r.id); if (cur && (cur.updated || 0) > (r.updated || 0)) return false; }
          return true;
        }).map(function (r) { return JSON.parse(JSON.stringify(r)); });
        counts[k] = rows.length;
        if (rows.length) jobs.push(S.putMany(k, rows));
      });
      for (var v = data.schemaVersion + 1; v <= SCHEMA; v++) { if (MIGRATIONS[v]) MIGRATIONS[v](cache); }
      return Promise.all(jobs).then(function () { return counts; });
    });
  };

  // settings helpers
  S.settings = function () {
    var s = cache.kv.get('settings');
    if (!s) s = { id: 'settings', settingsRev: 2, theme: 'system', showUnverified: true, effects: true, reduceMotion: false, negativeMarking: null, category: null, chosenAt: null, dailyGoal: 20, examDate: null };
    return s;
  };
  S.saveSettings = function (patch) { var s = Object.assign({}, S.settings(), patch); return S.put('kv', s).then(function () { RAX.emit('settings', s); return s; }); };
})();
