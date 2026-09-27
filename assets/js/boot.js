/* Konsol tarzı açılış ekranı */
(function () {
  var b = document.getElementById('boot');
  if (!b) return;
  if (document.documentElement.classList.contains('no-boot')) { b.parentNode.removeChild(b); return; }
  var cmd = b.querySelector('.boot__cmd'), txt = cmd.getAttribute('data-type'), i = 0,
      lines = b.querySelectorAll('.boot__out'), bar = b.querySelector('.boot__progress i'), done = false;
  function end() {
    if (done) return; done = true;
    b.classList.add('is-done');
    document.documentElement.classList.remove('is-booting');
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 450);
  }
  b.addEventListener('click', end);
  document.addEventListener('keydown', end, { once: true });
  function show(n) {
    bar.style.width = Math.round(n / lines.length * 100) + '%';
    if (n < lines.length) { lines[n].classList.add('is-on'); setTimeout(function () { show(n + 1); }, 190); }
    else setTimeout(end, 420);
  }
  function type() {
    if (i <= txt.length) { cmd.textContent = txt.slice(0, i); i++; setTimeout(type, 24); }
    else { b.classList.add('is-typed'); setTimeout(function () { show(0); }, 120); }
  }
  setTimeout(type, 180);
})();
