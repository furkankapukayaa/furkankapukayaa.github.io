/* Açılış ekranının oturumda yalnızca bir kez gösterilmesini sağlar. Sayfa çizilmeden önce çalışır. */
(function () {
  var d = document.documentElement;
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
