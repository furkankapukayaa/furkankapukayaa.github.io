/* Bilgisayar açılışı tarzında yükleme ekranı.
   Aşamalar: 1) BIOS / POST ekranı  2) FK logosu  3) Kilit ekranı  4) Ana sayfadaki monitöre küçülerek geçiş.
   Herhangi bir tuş veya tıklama ile atlanır. Oturumda bir kez ve yalnızca hareket azaltma tercihi yoksa gösterilir. */
(function () {
  var html = document.documentElement;
  var b = document.getElementById('boot');
  var finished = function () {
    html.classList.remove('is-booting');
    window.__fkBooted = true;
    try { document.dispatchEvent(new Event('fk:booted')); } catch (e) {}
  };
  if (!b) { finished(); return; }
  if (html.classList.contains('no-boot') || !html.classList.contains('is-booting')) {
    if (b.parentNode) b.parentNode.removeChild(b);
    window.__fkBooted = true;
    return;
  }

  var esc = function (s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  var lines = [
    ['İşlemci', 'C# 13 / .NET 10', 'OK'],
    ['Bellek testi', '', 'OK', 'mem'],
    ['Veri katmanı', 'SQL Server, Entity Framework Core', 'OK'],
    ['Arayüz', 'WinForms, WPF, ASP.NET Core', 'OK'],
    ['Modüller', 'Masaüstü, web, panel, konsol, eklenti', '5 bulundu'],
    ['Referanslar', '7 işletme, 4 Chrome eklentisi', 'OK']
  ];
  var now = new Date();
  var hm = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  var day = now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  day = day.charAt(0).toLocaleUpperCase('tr-TR') + day.slice(1);

  var post = '<div class="boot__post"><div class="boot__head"><div><b>FK-BIOS</b> sürüm 26.10<br><span>kapukaya.dev yazılım sistemleri</span></div><span class="boot__badge">FK</span></div><ul class="boot__list">';
  lines.forEach(function (l) {
    post += '<li class="boot__ln"><span class="boot__k">' + esc(l[0]) + '</span><span class="boot__lead"></span><span class="boot__v"' + (l[3] ? ' data-' + l[3] : '') + '>' + esc(l[1]) + '</span><b class="boot__ok">[' + esc(l[2]) + ']</b></li>';
  });
  post += '</ul><p class="boot__start">Sistem başlatılıyor<span class="boot__cur"></span></p><p class="boot__skip">Atlamak için herhangi bir tuşa basın veya ekrana dokunun</p></div>';
  var logo = '<div class="boot__logo"><span class="boot__fk">FK</span><span class="boot__spin" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></div>';
  var lock = '<div class="boot__lock"><div class="boot__clock"><b>' + hm + '</b><span>' + esc(day) + '</span></div><div class="boot__user"><span class="boot__avatar">FK</span><b>Furkan Kapukaya</b><small>Hoş geldiniz</small></div></div>';
  b.innerHTML = post + logo + lock;

  var timers = [], done = false;
  var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };
  var stage = function (s) { b.setAttribute('data-stage', s); };

  var target = function () {
    var s = document.querySelector('[data-pc-screen]');
    if (!s) return null;
    var r = s.getBoundingClientRect();
    if (!r.width || r.bottom < 120 || r.top > window.innerHeight - 140) return null;
    return r;
  };

  var end = function (fast) {
    if (done) return; done = true;
    timers.forEach(clearTimeout);
    b.removeEventListener('click', skip);
    document.removeEventListener('keydown', skip);
    var r = fast ? null : target();
    var remove = function () { if (b.parentNode) b.parentNode.removeChild(b); };
    if (r) {
      stage('lock');
      var vw = window.innerWidth, vh = window.innerHeight;
      var sc = Math.min(r.width / vw, r.height / vh);
      var cx = r.left + r.width / 2 - vw / 2, cy = r.top + r.height / 2 - vh / 2;
      b.style.setProperty('--zx', cx + 'px');
      b.style.setProperty('--zy', cy + 'px');
      b.style.setProperty('--zs', sc);
      b.style.setProperty('--clip', 'inset(' + Math.max(r.top, 0) + 'px ' + Math.max(vw - r.right, 0) + 'px ' + Math.max(vh - r.bottom, 0) + 'px ' + Math.max(r.left, 0) + 'px round 9px)');
      void b.offsetWidth;
      b.classList.add('is-zoom');
      later(function () { finished(); b.classList.add('is-done'); }, 720);
      later(remove, 1100);
    } else {
      b.classList.add('is-done');
      finished();
      setTimeout(remove, 450);
    }
  };
  var skip = function () { end(true); };
  b.addEventListener('click', skip);
  document.addEventListener('keydown', skip);

  /* 1) POST satırları */
  var items = b.querySelectorAll('.boot__ln');
  var mem = b.querySelector('[data-mem]');
  stage('post');
  var t = 160;
  Array.prototype.forEach.call(items, function (li) {
    later(function () {
      li.classList.add('is-on');
      if (li.contains(mem)) {
        var k = 0, steps = 10;
        var run = function () { k++; mem.textContent = Math.round(65536 * k / steps) + 'K'; if (k < steps) later(run, 26); else li.classList.add('is-ok'); };
        run();
      } else later(function () { li.classList.add('is-ok'); }, 70);
    }, t);
    t += li.contains(mem) ? 340 : 125;
  });
  later(function () { b.classList.add('is-starting'); }, t + 60);
  /* 2) Logo */
  later(function () { stage('logo'); }, t + 420);
  /* 3) Kilit ekranı */
  later(function () { stage('lock'); }, t + 1400);
  /* 4) Monitöre geçiş */
  later(function () { end(false); }, t + 2250);
  /* Güvenlik: her durumda 7 saniyede kapanır */
  later(function () { end(true); }, 7000);
})();
