/* RAXUSATPrep service worker — offline cache. Version e19f27d075. */
var CACHE = 'raxusatprep-e19f27d075';
var PRECACHE = [
"./",
"about/index.html",
"app/index.html",
"assets/css/app.css",
"assets/css/rax.css",
"assets/css/site.css",
"assets/fonts/adventor-400.woff",
"assets/fonts/adventor-700.woff",
"assets/fonts/inter-400.woff",
"assets/fonts/inter-600.woff",
"assets/fonts/inter-700.woff",
"assets/fonts/lora-italic-500.woff",
"assets/img/apple-touch-icon.png",
"assets/img/favicon-32.png",
"assets/img/favicon.svg",
"assets/img/icon-192.png",
"assets/img/icon-512.png",
"assets/img/icon-maskable-512.png",
"assets/img/icon-maskable.svg",
"assets/img/logo-dark.svg",
"assets/img/logo-mark.svg",
"assets/img/logo.svg",
"assets/js/app/bank.js",
"assets/js/app/core.js",
"assets/js/app/engine.js",
"assets/js/app/main.js",
"assets/js/app/store.js",
"assets/js/app/ui.js",
"assets/js/app/views-bank.js",
"assets/js/app/views-essay.js",
"assets/js/app/views-home.js",
"assets/js/app/views-mock.js",
"assets/js/app/views-practice.js",
"assets/js/app/views-track.js",
"assets/js/icons.js",
"assets/js/site.js",
"data/essays.js",
"data/exam-config.js",
"data/questions/biology.js",
"data/questions/chemistry.js",
"data/questions/index.js",
"data/questions/physics.js",
"data/questions/quantitative.js",
"data/questions/verbal.js",
"data/quotes.js",
"faq/index.html",
"index.html",
"manifest.webmanifest",
"privacy/index.html",
"quantitative-reasoning-practice/index.html",
"resources/index.html",
"usat-a-preparation/index.html",
"usat-com-preparation/index.html",
"usat-cs-preparation/index.html",
"usat-e-preparation/index.html",
"usat-essay-preparation/index.html",
"usat-gs-preparation/index.html",
"usat-m-preparation/index.html",
"usat-mock-tests/index.html",
"usat-test-pattern-syllabus/index.html",
"verbal-reasoning-practice/index.html"
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(PRECACHE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    var net = fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return hit || (req.mode === 'navigate' ? caches.match('404.html') : undefined); });
    return hit || net;
  }));
});
