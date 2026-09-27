/* Google Analytics yalnızca ziyaretçi onay verdikten sonra yüklenir (KVKK). */
(function () {
  'use strict';
  var KEY = 'fk-consent', GA = 'G-N2JTL8F60Q';
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function load() {
    if (window.__fkGa || location.protocol === 'file:') return;
    window.__fkGa = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA, { anonymize_ip: true });
  }
  function init() {
    var box = document.getElementById('consent');
    var state = get();
    if (state === 'yes') load();
    if (box && state !== 'yes' && state !== 'no') box.hidden = false;
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (btn) {
        var v = btn.getAttribute('data-consent');
        set(v);
        if (v === 'yes') load();
        if (box) box.hidden = true;
        return;
      }
      if (e.target.closest('[data-consent-reset]')) {
        try { localStorage.removeItem(KEY); } catch (err) {}
        if (box) box.hidden = false;
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
