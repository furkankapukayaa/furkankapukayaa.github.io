/* 404 sayfası: "mavi ekran" tarzı hata ekranı.
   Yüzde sayacı 0'dan 100'e ilerler, ardından seçenekler belirir. JavaScript yoksa her şey baştan görünür. */
(function () {
  'use strict';
  var root = document.querySelector('[data-bsod]');
  if (!root) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pct = root.querySelector('[data-bsod-pct]');
  var act = root.querySelector('[data-bsod-act]');
  var url = root.querySelector('[data-bsod-url]');
  if (url) url.textContent = decodeURIComponent(location.pathname + location.search).slice(0, 80);

  /* Süs amaçlı kare desen (karekod görünümünde, okunabilir bir bilgi taşımaz) */
  var qr = root.querySelector('[data-bsod-qr]');
  if (qr) {
    var n = 21, seed = 0, path = location.pathname, svg = '';
    for (var i = 0; i < path.length; i++) seed = (seed * 31 + path.charCodeAt(i)) >>> 0;
    var rnd = function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    var finder = function (x, y) {
      var fx = x < 7 ? x : x > n - 8 ? x - (n - 7) : -1, fy = y < 7 ? y : y > n - 8 ? y - (n - 7) : -1;
      if (fx < 0 || fy < 0 || (x > n - 8 && y > n - 8)) return null;
      return fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx > 1 && fx < 5 && fy > 1 && fy < 5);
    };
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var f = finder(x, y), on = f === null ? rnd() > .52 : f;
      if (on) svg += 'M' + x + ' ' + y + 'h1v1h-1z';
    }
    qr.innerHTML = '<svg viewBox="-1 -1 ' + (n + 2) + ' ' + (n + 2) + '" shape-rendering="crispEdges"><rect x="-1" y="-1" width="' + (n + 2) + '" height="' + (n + 2) + '" fill="#fff"/><path d="' + svg + '" fill="#0a4fa3"/></svg>';
  }

  var search = root.querySelector('[data-bsod-search]');
  if (search) search.addEventListener('click', function (e) {
    if (window.FKSearch) { e.preventDefault(); window.FKSearch.open(); }
  });

  if (reduce || !pct) return;
  root.classList.add('is-running');
  var v = 0;
  pct.textContent = '0';
  var step = function () {
    v = Math.min(100, v + 4 + Math.floor(Math.random() * 14));
    pct.textContent = v;
    if (v < 100) setTimeout(step, 120 + Math.random() * 220);
    else setTimeout(function () { root.classList.remove('is-running'); root.classList.add('is-ready'); var a = act && act.querySelector('a'); if (a) a.focus({ preventScroll: true }); }, 250);
  };
  setTimeout(step, 400);
})();
