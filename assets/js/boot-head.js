/* Sayfa çizilmeden önce çalışır.
   1) Tıklama korsanlığı (clickjacking) koruması: site başka bir sitenin çerçevesinde açılırsa gösterilmez.
   2) Erişilebilirlik tercihleri (Denetim Masası) ilk çizimden önce uygulanır.
   3) Açılış ekranı yalnızca <html data-boot> olan sayfada (ana sayfa) ve oturumda bir kez gösterilir.
      Blog ve diğer sayfalar doğrudan açılır; aramadan gelen ziyaretçi içeriği beklemeden görür. */
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
  var a11y = {};
  try { a11y = JSON.parse(localStorage.getItem('fk-a11y') || '{}') || {}; } catch (e) {}
  if (a11y.size) d.setAttribute('data-a11y-size', a11y.size);
  if (a11y.contrast) d.classList.add('a11y-contrast');
  if (a11y.links) d.classList.add('a11y-links');
  if (a11y.motion) d.classList.add('a11y-motion');
  if (a11y.keys === false) window.__fkKeysOff = true;
  if (!d.hasAttribute('data-boot') || a11y.motion) { d.classList.add('no-boot'); return; }
  try {
    if (sessionStorage.getItem('fk-boot') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      d.classList.add('no-boot');
    } else {
      sessionStorage.setItem('fk-boot', '1');
      d.classList.add('is-booting');
    }
  } catch (e) {
    d.classList.add('no-boot');
  }
})();
