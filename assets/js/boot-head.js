/* Sayfa çizilmeden önce çalışır.
   1) Tıklama korsanlığı (clickjacking) koruması: site başka bir sitenin çerçevesinde açılırsa gösterilmez.
   2) Açılış ekranının oturumda yalnızca bir kez gösterilmesi. */
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
