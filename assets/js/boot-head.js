/* Sayfa çizilmeden önce çalışır.
   1) Tıklama korsanlığı (clickjacking) koruması: site başka bir sitenin çerçevesinde açılırsa gösterilmez.
   2) Açılış ekranının oturumda yalnızca bir kez gösterilmesi.
      <html data-noboot> olan sayfalarda (örneğin 404) açılış ekranı hiç gösterilmez ve oturum hakkı harcanmaz. */
(function () {
  var d = document.documentElement;
  if (window.top !== window.self) {
    var same = false;
    try { same = window.top.location.hostname === location.hostname; } catch (e) { same = false; }
    if (!same) {
      d.style.display = 'none';
      try { window.top.location = window.self.location.href; } catch (e) {}
      return;
    }
  }
  /* Erişilebilirlik tercihleri (Denetim Masası) sayfa çizilmeden uygulanır */
  var a11y = {};
  try { a11y = JSON.parse(localStorage.getItem('fk-a11y') || '{}') || {}; } catch (e) {}
  if (a11y.size) d.setAttribute('data-a11y-size', a11y.size);
  if (a11y.contrast) d.classList.add('a11y-contrast');
  if (a11y.links) d.classList.add('a11y-links');
  if (a11y.motion) d.classList.add('a11y-motion');
  if (a11y.keys === false) window.__fkKeysOff = true;
  if (d.hasAttribute('data-noboot') || a11y.motion) { d.classList.add('no-boot'); return; }
  try {
    if (sessionStorage.getItem('fk-boot') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      d.classList.add('no-boot');
    } else {
      sessionStorage.setItem('fk-boot', '1');
      d.classList.add('is-booting');
      /* Açılış ekranı olmayan sayfalarda (örneğin eklenti gizlilik sayfaları) kilitli kalmasın */
      document.addEventListener('DOMContentLoaded', function () {
        if (!document.getElementById('boot') && !window.__fkBooted) {
          d.classList.remove('is-booting');
          try { sessionStorage.removeItem('fk-boot'); } catch (e) {}
        }
      });
    }
  } catch (e) {
    d.classList.add('no-boot');
  }
})();

/* Sayfa geçişi (varış): önceki sayfa site.js içinde geçiş ekranını açtıysa,
   bu sayfa da aynı ekranla başlar ve içerik yumuşakça belirir. */
(function () {
  var d = document.documentElement;
  try {
    var raw = sessionStorage.getItem('fk-pt');
    if (!raw) return;
    sessionStorage.removeItem('fk-pt');
    var o = JSON.parse(raw);
    if (Date.now() - o.t > 6000 || d.classList.contains('is-booting')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || d.classList.contains('a11y-motion')) return;
    d.style.setProperty('--pt-cmd', JSON.stringify(o.c));
    d.classList.add('pt-in');
    setTimeout(function () { d.classList.remove('pt-in'); d.style.removeProperty('--pt-cmd'); }, 1100);
  } catch (e) {}
})();
