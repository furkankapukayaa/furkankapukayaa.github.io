/* Çerez tercihleri ve Google Analytics (KVKK Çerez Rehberi'ne uygun).
   Analitik çerezler yalnızca açık onaydan sonra yüklenir; onay dilediğiniz zaman geri alınabilir.
   Bant ve tercih penceresi bu dosya tarafından her sayfaya eklenir. */
(function () {
  'use strict';
  var KEY = 'fk-consent', GA = 'G-N2JTL8F60Q', VERSION = 2;
  var src = (document.currentScript && document.currentScript.src) || '';
  var BASE = src ? src.replace(/assets\/js\/analytics\.js.*$/, '') : '/';

  function read() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { return null; }
    if (!raw) return null;
    if (raw === 'yes') return { analytics: true };
    if (raw === 'no') return { analytics: false };
    try { var o = JSON.parse(raw); return (o && o.v === VERSION) ? o : null; } catch (e) { return null; }
  }
  function save(analytics) {
    var o = { v: VERSION, analytics: !!analytics, date: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
    return o;
  }

  function loadGa() {
    if (window.__fkGa || location.protocol === 'file:') return;
    window.__fkGa = true;
    window['ga-disable-' + GA] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', functionality_storage: 'granted', security_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', GA, { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA;
    document.head.appendChild(s);
  }
  function stopGa() {
    window['ga-disable-' + GA] = true;
    if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
    var host = location.hostname, parts = host.split('.'), domains = ['', host, '.' + host];
    if (parts.length > 1) domains.push('.' + parts.slice(-2).join('.'));
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (!/^_ga|^_gid|^_gat/.test(name)) return;
      domains.forEach(function (d) {
        document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '') + '; SameSite=Lax';
      });
    });
  }

  var banner, dlg, toggle;
  function build() {
    banner = document.getElementById('consent');
    if (banner) banner.parentNode.removeChild(banner);
    banner = document.createElement('div');
    banner.className = 'consent';
    banner.id = 'consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Çerez tercihi');
    banner.hidden = true;
    banner.innerHTML =
      '<p>Site, çalışması için gereken yerel depolamayı kullanır. Ziyaret istatistiklerini ölçen analitik çerezler ise yalnızca onay verirseniz çalışır. Ayrıntılar: <a href="' + BASE + 'cerez-politikasi.html">Çerez Politikası</a>.</p>' +
      '<div class="consent__actions">' +
      '<button class="btn btn--ghost" type="button" data-ck="prefs">Tercihler</button>' +
      '<button class="btn btn--soft" type="button" data-ck="no">Tümünü reddet</button>' +
      '<button class="btn btn--soft" type="button" data-ck="yes">Tümünü kabul et</button>' +
      '</div>';
    document.body.appendChild(banner);

    dlg = document.createElement('dialog');
    dlg.className = 'k-modal';
    dlg.id = 'cookie-prefs';
    dlg.setAttribute('aria-labelledby', 'cookie-prefs-t');
    dlg.innerHTML =
      '<div class="k-modal__head"><h2 id="cookie-prefs-t">Çerez tercihleri</h2><button type="button" class="k-modal__x" data-ck="close" aria-label="Kapat"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>' +
      '<div class="k-modal__body">' +
      '<p>Hangi çerezlerin kullanılacağını aşağıdan seçebilirsiniz. Tercihinizi sayfanın altındaki “Çerez tercihleri” bağlantısından dilediğiniz zaman değiştirebilirsiniz. <a href="' + BASE + 'cerez-politikasi.html">Çerez Politikası</a></p>' +
      '<div class="k-switch-row"><div><b>Zorunlu</b><small>Çerez tercihinizin ve açılış animasyonunun hatırlanması, form kötüye kullanım koruması. Kişisel veri içermez ve cihazınızdan dışarı gönderilmez. Kapatılamaz.</small></div><span class="k-switch"><input type="checkbox" checked disabled aria-label="Zorunlu çerezler, her zaman açık"><span></span></span></div>' +
      '<div class="k-switch-row"><div><b>Analitik</b><small>Google Analytics 4 ile hangi sayfaların ne kadar ziyaret edildiğini ölçer (_ga, _ga_*). IP adresi kısaltılır; reklam ve kişiselleştirme için kullanılmaz. Veriler Google tarafından yurt dışında işlenir.</small></div><span class="k-switch"><input type="checkbox" data-ck-analytics aria-label="Analitik çerezler"><span></span></span></div>' +
      '</div>' +
      '<div class="k-modal__foot"><button type="button" class="btn btn--ghost" data-ck="save">Seçimi kaydet</button><button type="button" class="btn btn--primary" data-ck="yes">Tümünü kabul et</button></div>';
    document.body.appendChild(dlg);
    toggle = dlg.querySelector('[data-ck-analytics]');
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closePrefs(); });
    dlg.addEventListener('close', function () {
      document.documentElement.classList.remove('has-modal');
      if (dlg._opener && dlg._opener.focus && document.contains(dlg._opener)) dlg._opener.focus({ preventScroll: true });
    });
  }
  function openPrefs(opener) {
    var st = read();
    toggle.checked = !!(st && st.analytics);
    dlg._opener = opener || document.activeElement;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    document.documentElement.classList.add('has-modal');
  }
  function closePrefs() { if (dlg.open) { if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); } }
  function apply(analytics) {
    var before = read();
    save(analytics);
    banner.hidden = true;
    if (analytics) loadGa();
    else if (before && before.analytics) stopGa();
    closePrefs();
  }

  function init() {
    build();
    var st = read();
    if (st && st.analytics) loadGa();
    if (!st) banner.hidden = false;
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ck]');
      if (b) {
        var a = b.getAttribute('data-ck');
        if (a === 'yes') apply(true);
        else if (a === 'no') apply(false);
        else if (a === 'save') apply(toggle.checked);
        else if (a === 'prefs') openPrefs(b);
        else if (a === 'close') closePrefs();
        return;
      }
      var o = e.target.closest('[data-consent-open], [data-consent-reset]');
      if (o) { e.preventDefault(); openPrefs(o); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
