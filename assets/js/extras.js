/* Tüm sayfalarda: mobil eylem çubuğu, gizli sürprizler ve rozetler, geliştirici konsolu mesajı.
   Sürpriz bulunduğunda diğer betikler şu olayı gönderir:
   document.dispatchEvent(new CustomEvent('fk:secret', { detail: 'kimlik' })) */
(function () {
  'use strict';
  var me = document.currentScript && document.currentScript.src;
  var base = me ? me.replace(/assets\/js\/extras\.js.*$/, '') : '/';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (v) { return String(v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ===================================================================
     1) Mobil eylem çubuğu
     =================================================================== */
  (function () {
    var bar = document.createElement('nav');
    bar.className = 'mbar';
    bar.setAttribute('aria-label', 'Hızlı işlemler');
    bar.innerHTML =
      '<a class="mbar__main" href="' + base + 'index.html#iletisim"><i class="fa-regular fa-paper-plane" aria-hidden="true"></i>Teklif isteyin</a>' +
      '<a class="mbar__ic" href="mailto:info@kapukaya.dev" aria-label="E-posta gönderin"><i class="fa-regular fa-envelope" aria-hidden="true"></i></a>' +
      '<button class="mbar__ic" type="button" data-mbar-search aria-label="Sitede ara"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></button>' +
      '<button class="mbar__ic" type="button" data-mbar-top aria-label="Sayfanın başına dön"><i class="fa-solid fa-arrow-up" aria-hidden="true"></i></button>';
    document.body.appendChild(bar);
    document.documentElement.classList.add('has-mbar');
    bar.querySelector('[data-mbar-search]').addEventListener('click', function () { if (window.FKSearch) window.FKSearch.open(); });
    bar.querySelector('[data-mbar-top]').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
    var main = bar.querySelector('.mbar__main');
    main.addEventListener('click', function (e) {
      var c = document.getElementById('iletisim');
      if (c) { e.preventDefault(); c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
    });
    var contact = document.getElementById('iletisim'), footer = document.querySelector('.k-footer'), postEnd = document.querySelector('.post-end');
    var hideFor = { contact: false, footer: false };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (x) { hideFor[x.target === contact ? 'contact' : x.target === postEnd ? 'share' : 'footer'] = x.isIntersecting; });
        decide();
      }, { threshold: 0.05 });
      if (contact) io.observe(contact);
      if (footer) io.observe(footer);
      if (postEnd) io.observe(postEnd);
    }
    var typing = false;
    document.addEventListener('focusin', function (e) { typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName); decide(); });
    document.addEventListener('focusout', function () { typing = false; setTimeout(decide, 50); });
    var decide = function () {
      var consent = document.querySelector('.consent:not([hidden])');
      var show = window.scrollY > 380 && !hideFor.contact && !hideFor.footer && !hideFor.share && !typing && !(consent && consent.offsetParent);
      bar.classList.toggle('is-on', show);
    };
    window.addEventListener('scroll', function () { requestAnimationFrame(decide); }, { passive: true });
    decide();
  })();

  /* ===================================================================
     2) Gizli sürprizler ve rozetler
     =================================================================== */
  var SECRETS = [
    { id: 'furkan', name: 'Beni tanıdın', hint: 'Sayfada bir yerdeyken klavyeden adımı yaz.' },
    { id: 'logo', name: 'Logo döndüren', hint: 'Menüdeki sarı FK logosuna hızlıca 5 kez tıkla.' },
    { id: 'konsol', name: 'Komut satırı ustası', hint: 'Ana sayfadaki sanal bilgisayarın konsoluna adımı komut olarak yaz.' },
    { id: 'bin', name: 'Excel\'e veda', hint: 'Sanal bilgisayardaki Geri Dönüşüm Kutusu\'nu boşalt.' },
    { id: 'restart', name: 'Kapat-aç uzmanı', hint: 'Sanal bilgisayarı Başlat menüsünden kapatıp yeniden başlat.' },
    { id: 'okur', name: 'Kitap kurdu', hint: 'Bir blog yazısını sonuna kadar oku.' },
    { id: 'palet', name: 'Kaşif', hint: 'Ctrl+K ile arama paletini aç ve "sürpriz" yaz.' },
    { id: 'kayip', name: 'Kaybolmayı bilen', hint: 'Sitede olmayan bir sayfaya gitmeyi dene.' }
  ];
  var found = store.get('fk-secrets', []);
  var has = function (id) { return found.indexOf(id) !== -1; };

  var toastEl = null, toastT = null;
  var toast = function (html, icon) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'fx-toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = '<span class="fx-toast__ic" aria-hidden="true">' + (icon || '<i class="fa-solid fa-trophy"></i>') + '</span><span>' + html + '</span>';
    toastEl.classList.remove('is-on'); void toastEl.offsetWidth; toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 4200);
  };

  var trophy = null;
  var paintTrophy = function () {
    if (!found.length) return;
    if (!trophy) {
      trophy = document.createElement('button');
      trophy.type = 'button';
      trophy.className = 'fx-trophy';
      trophy.addEventListener('click', openPanel);
      document.body.appendChild(trophy);
    }
    trophy.innerHTML = '<i class="fa-solid fa-trophy" aria-hidden="true"></i><span>' + found.length + '/' + SECRETS.length + '</span>';
    trophy.setAttribute('aria-label', 'Gizli rozetler: ' + found.length + ' / ' + SECRETS.length);
    trophy.classList.toggle('is-gold', found.length === SECRETS.length);
    paintHint();
  };

  var unlock = function (id) {
    var s = SECRETS.filter(function (x) { return x.id === id; })[0];
    if (!s || has(id)) return false;
    found.push(id);
    store.set('fk-secrets', found);
    paintTrophy();
    if (found.length === SECRETS.length) {
      toast('<b>Hepsini buldun!</b> 8/8 rozet. Rozet panelinde gökkuşağı modu açıldı.', '<i class="fa-solid fa-crown"></i>');
      confetti(70);
    } else {
      toast('<b>Gizli rozet: ' + esc(s.name) + '</b> ' + found.length + '/' + SECRETS.length + ' bulundu');
    }
    return true;
  };
  document.addEventListener('fk:secret', function (e) { unlock(e.detail); });

  /* Rozet paneli */
  var dlg = null;
  var openPanel = function () {
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.className = 'fx-panel';
      dlg.setAttribute('aria-label', 'Gizli rozetler');
      document.body.appendChild(dlg);
      dlg.addEventListener('click', function (e) {
        if (e.target === dlg || e.target.closest('[data-fx-close]')) dlg.close();
        if (e.target.closest('[data-fx-rainbow]')) {
          var on = !document.documentElement.classList.contains('is-rainbow');
          document.documentElement.classList.toggle('is-rainbow', on);
          store.set('fk-rainbow', on);
          paintPanel();
        }
        if (e.target.closest('[data-fx-reset]')) {
          found = []; store.set('fk-secrets', found); store.set('fk-rainbow', false);
          document.documentElement.classList.remove('is-rainbow');
          if (trophy) { trophy.remove(); trophy = null; }
          paintHint(); paintPanel();
        }
      });
    }
    paintPanel();
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  };
  var paintPanel = function () {
    if (!dlg) return;
    var all = found.length === SECRETS.length, rb = document.documentElement.classList.contains('is-rainbow');
    dlg.innerHTML = '<div class="fx-panel__box"><div class="fx-panel__bar"><span><i class="fa-solid fa-trophy" aria-hidden="true"></i> gizli-rozetler.exe</span><button type="button" data-fx-close aria-label="Kapat">&#10005;</button></div>' +
      '<div class="fx-panel__body"><p class="fx-panel__lead">Bu sitede <b>' + SECRETS.length + '</b> gizli sürpriz var. Şu ana kadar <b>' + found.length + '</b> tanesini buldun.</p>' +
      '<div class="fx-meter"><i style="width:' + Math.round(found.length / SECRETS.length * 100) + '%"></i></div><ul class="fx-list">' +
      SECRETS.map(function (s) {
        var ok = has(s.id);
        return '<li class="' + (ok ? 'is-ok' : '') + '"><i class="fa-solid ' + (ok ? 'fa-circle-check' : 'fa-lock') + '" aria-hidden="true"></i><span><b>' + (ok ? esc(s.name) : '???') + '</b><small>' + esc(s.hint) + '</small></span></li>';
      }).join('') + '</ul>' +
      (all ? '<button type="button" class="btn btn--primary fx-rb" data-fx-rainbow>' + (rb ? 'Gökkuşağı modunu kapat' : 'Gökkuşağı modunu aç') + '</button>' : '<p class="fx-panel__tip">Hepsini bulunca küçük bir ödül açılıyor.</p>') +
      (found.length ? '<button type="button" class="fx-reset" data-fx-reset>Rozetleri sıfırla</button>' : '') +
      '</div></div>';
  };
  if (store.get('fk-rainbow', false) && found.length === SECRETS.length) document.documentElement.classList.add('is-rainbow');

  /* Konfeti: kod sembolleri yağar */
  var confetti = function (n) {
    if (reduce) return;
    var box = document.createElement('div');
    box.className = 'fx-confetti';
    box.setAttribute('aria-hidden', 'true');
    var bits = ['{ }', '</>', ';', 'C#', 'FK', '=>', '[]', '#', '&&', '01', '.NET', '()'];
    var html = '';
    for (var i = 0; i < n; i++) {
      html += '<span style="left:' + (Math.random() * 100).toFixed(1) + '%;animation-delay:' + (Math.random() * .9).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg;--h:' + Math.round(Math.random() * 360) + '">' + bits[i % bits.length] + '</span>';
    }
    box.innerHTML = html;
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 4300);
  };

  /* --- Sürpriz 1: klavyeden "furkan" yazmak --- */
  var buf = '';
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1) return;
    var t = e.target;
    if (t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable)) return;
    buf = (buf + e.key.toLocaleLowerCase('tr')).slice(-6);
    if (buf === 'furkan') { buf = ''; devMode(); }
  });
  var devOpen = false;
  var devMode = function () {
    if (devOpen) return;
    devOpen = true;
    var first = unlock('furkan');
    confetti(46);
    var ov = document.createElement('div');
    ov.className = 'fx-dev';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-label', 'Geliştirici modu');
    ov.innerHTML = '<div class="fx-dev__win"><div class="fx-dev__bar"><span>furkan@kapukaya: ~</span><button type="button" data-dev-close aria-label="Kapat">&#10005;</button></div><div class="fx-dev__body" data-dev-body></div></div>';
    document.body.appendChild(ov);
    var body = ov.querySelector('[data-dev-body]');
    var lines = [
      ['$ whoami', 'p'],
      ['Furkan Kapukaya. C# ve .NET ile işletmelere masaüstü, web ve konsol yazılımları geliştiriyorum.', ''],
      ['$ ls ./gizli', 'p'],
      ['rozetler.txt   kahve.exe   hata-yok.dll   ipuclari.md', 'y'],
      ['$ cat rozetler.txt', 'p'],
      [(first ? 'Tebrikler, ilk gizli modu buldun! ' : 'Gizli moda tekrar hoş geldin. ') + found.length + '/' + SECRETS.length + ' rozet toplandı.', 'g'],
      ['$ ./kahve.exe', 'p'],
      ['Kahve hazırlanıyor... ████████████ %100. Bir projeyi konuşmak için en iyi zaman şimdi.', ''],
      ['$ _', 'p']
    ];
    var i = 0;
    var step = function () {
      if (i >= lines.length || !document.body.contains(ov)) {
        var act = document.createElement('div');
        act.className = 'fx-dev__act';
        act.innerHTML = '<button type="button" class="btn btn--primary" data-dev-badges><i class="fa-solid fa-trophy" aria-hidden="true"></i>Rozetlerim</button><a class="btn btn--ghost" href="' + base + 'index.html#iletisim">Proje konuşalım</a>';
        body.appendChild(act);
        return;
      }
      var p = document.createElement('p');
      p.className = 'fx-dev__ln ' + lines[i][1];
      p.textContent = lines[i][0];
      body.appendChild(p);
      i++;
      setTimeout(step, reduce ? 0 : 260);
    };
    step();
    var close = function () { devOpen = false; ov.classList.add('is-out'); setTimeout(function () { ov.remove(); }, reduce ? 0 : 220); document.removeEventListener('keydown', onKey); };
    var onKey = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-dev-close]')) close();
      if (e.target.closest('[data-dev-badges]')) { close(); openPanel(); }
    });
    var cb = ov.querySelector('[data-dev-close]');
    if (cb) cb.focus({ preventScroll: true });
  };

  /* --- Sürpriz 2: FK logosuna hızlıca 5 tıklama --- */
  var clicks = 0, clickT = null;
  document.addEventListener('click', function (e) {
    var mark = e.target.closest && e.target.closest('.k-header .k-brand__mark');
    if (!mark || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var link = mark.closest('a');
    e.preventDefault();
    clicks++;
    clearTimeout(clickT);
    if (clicks >= 5) {
      clicks = 0;
      mark.classList.remove('is-spin'); void mark.offsetWidth; mark.classList.add('is-spin');
      if (!unlock('logo')) toast('FK logosu yine döndü. Başı dönmeye başladı.', '<i class="fa-solid fa-rotate"></i>');
      return;
    }
    clickT = setTimeout(function () {
      var n = clicks; clicks = 0;
      if (n === 1 && link) { if (window.FKNav) window.FKNav(link.href); else location.href = link.href; }
    }, 450);
  }, true);

  /* --- Sürpriz: 404 sayfası --- */
  if (document.querySelector('[data-bsod]')) setTimeout(function () { unlock('kayip'); }, 1600);

  /* Alt bilgide ipucu: sürprizlerin varlığını belli eder */
  var hintEl = null;
  var paintHint = function () {
    var fb = document.querySelector('.k-footer__bottom');
    if (!fb) return;
    if (!hintEl) {
      hintEl = document.createElement('button');
      hintEl.type = 'button';
      hintEl.className = 'k-footer__secret';
      hintEl.addEventListener('click', openPanel);
      fb.appendChild(hintEl);
    }
    var next = SECRETS.filter(function (s) { return !has(s.id); })[0];
    hintEl.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>' + (next
      ? 'Bu sitede ' + SECRETS.length + ' gizli sürpriz var (' + found.length + ' bulundu). İpucu: ' + esc(next.hint.charAt(0).toLocaleLowerCase('tr') + next.hint.slice(1))
      : 'Tüm gizli sürprizleri buldun. Gökkuşağı modu seni bekliyor.');
  };
  paintHint();
  paintTrophy();

  window.FKFun = { open: openPanel, unlock: unlock, toast: toast, count: function () { return found.length; }, total: SECRETS.length };

  /* Geliştirici konsolu mesajı */
  try {
    console.log('%c FK %c kapukaya.dev ', 'background:#FFD970;color:#121212;font:700 22px/1.6 Poppins,sans-serif;padding:4px 10px;border-radius:6px 0 0 6px', 'background:#1F1F1F;color:#FFD970;font:500 22px/1.6 Poppins,sans-serif;padding:4px 10px;border-radius:0 6px 6px 0');
    console.log('%cKodu incelemeyi seven birini arıyorsanız doğru yerdesiniz: info@kapukaya.dev\nİpucu: Bu sitede ' + SECRETS.length + ' gizli sürpriz var. Konsola FK.ipucu() yazın.', 'color:#b5b5b5;font:14px/1.6 monospace');
    window.FK = window.FK || {};
    window.FK.ipucu = function () {
      var next = SECRETS.filter(function (s) { return !has(s.id); });
      return next.length ? next.map(function (s, i) { return (i + 1) + '. ' + s.hint; }).join('\n') : 'Hepsini buldun!';
    };
  } catch (e) {}
})();

/* ===================================================================
   Denetim Masası (erişilebilirlik ayarları) ve klavye kısayolları
   Tercihler bu tarayıcıda saklanır; boot-head.js sayfa çizilmeden uygular.
   =================================================================== */
(function () {
  'use strict';
  var d = document.documentElement;
  var load = function () { try { return JSON.parse(localStorage.getItem('fk-a11y') || '{}') || {}; } catch (e) { return {}; } };
  var save = function (v) { try { localStorage.setItem('fk-a11y', JSON.stringify(v)); } catch (e) {} };
  var apply = function (v) {
    if (v.size) d.setAttribute('data-a11y-size', v.size); else d.removeAttribute('data-a11y-size');
    d.classList.toggle('a11y-contrast', !!v.contrast);
    d.classList.toggle('a11y-links', !!v.links);
    d.classList.toggle('a11y-motion', !!v.motion);
    window.__fkKeysOff = v.keys === false;
  };
  var mkDialog = function (cls, label) {
    var dl = document.createElement('dialog');
    dl.className = 'fx-panel ' + cls;
    dl.setAttribute('aria-label', label);
    document.body.appendChild(dl);
    dl.addEventListener('click', function (e) { if (e.target === dl || e.target.closest('[data-x]')) dl.close(); });
    return dl;
  };
  var show = function (dl) { if (typeof dl.showModal === 'function') dl.showModal(); else dl.setAttribute('open', ''); };

  /* --- Denetim Masası --- */
  var cp = null;
  var paintCp = function () {
    var v = load();
    var sw = function (k, label, desc) {
      return '<label class="cp-row"><span><b>' + label + '</b><small>' + desc + '</small></span><input type="checkbox" class="cp-sw" data-k="' + k + '"' + ((k === 'keys' ? v.keys !== false : !!v[k]) ? ' checked' : '') + '></label>';
    };
    cp.innerHTML = '<div class="fx-panel__box"><div class="fx-panel__bar"><span><i class="fa-solid fa-sliders" aria-hidden="true"></i> Denetim Masası › Erişilebilirlik</span><button type="button" data-x aria-label="Kapat">&#10005;</button></div><div class="fx-panel__body">' +
      '<div class="cp-row cp-row--stack"><span><b>Yazı boyutu</b><small>Tüm sayfayı büyütür.</small></span><div class="cp-seg" role="group" aria-label="Yazı boyutu">' +
      [['', 'Normal'], ['1', 'Büyük'], ['2', 'Çok büyük']].map(function (o) { var on = String(v.size || '') === o[0]; return '<button type="button" data-size="' + o[0] + '" aria-pressed="' + on + '"' + (on ? ' class="is-on"' : '') + '>' + o[1] + '</button>'; }).join('') + '</div></div>' +
      sw('contrast', 'Yüksek kontrast', 'Soluk yazıları ve çizgileri belirginleştirir.') +
      sw('links', 'Bağlantıların altını çiz', 'Metin içindeki bağlantıları ayırt etmeyi kolaylaştırır.') +
      sw('motion', 'Hareketleri azalt', 'Animasyonları, açılış ekranını ve sayfa geçişlerini kapatır.') +
      sw('keys', 'Tek tuşlu kısayollar', '"/" ve "?" kısayollarını açar veya kapatır.') +
      '<div class="cp-foot"><button type="button" class="cp-link" data-cp-keys><i class="fa-regular fa-keyboard" aria-hidden="true"></i>Klavye kısayolları</button><button type="button" class="cp-link" data-cp-reset>Varsayılanlara dön</button></div>' +
      '<p class="cp-note">Ayarlar yalnızca bu tarayıcıda saklanır. İşletim sisteminizdeki "hareketi azalt" tercihi de otomatik olarak dikkate alınır.</p></div></div>';
  };
  var openCp = function () {
    if (!cp) {
      cp = mkDialog('cp', 'Erişilebilirlik ayarları');
      cp.addEventListener('click', function (e) {
        var b = e.target.closest('[data-size]');
        if (b) { var v = load(); v.size = b.dataset.size || undefined; save(v); apply(v); paintCp(); cp.querySelector('[data-size="' + b.dataset.size + '"]').focus(); }
        if (e.target.closest('[data-cp-reset]')) { save({}); apply({}); paintCp(); }
        if (e.target.closest('[data-cp-keys]')) { cp.close(); openKeys(); }
      });
      cp.addEventListener('change', function (e) {
        var c = e.target.closest('[data-k]'); if (!c) return;
        var v = load(); v[c.dataset.k] = c.checked; if (c.dataset.k === 'keys' && c.checked) delete v.keys;
        save(v); apply(v);
      });
    }
    paintCp(); show(cp);
  };

  /* --- Klavye kısayolları --- */
  var kp = null;
  var openKeys = function () {
    var home = !!document.querySelector('[data-pc]');
    var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    var rows = [
      [mac ? '⌘ K' : 'Ctrl K', 'Sitede ara (yazı, proje, sayfa)'],
      ['/', 'Sitede ara' + (window.__fkKeysOff ? ' (kapalı)' : '')],
      ['?', 'Bu listeyi aç' + (window.__fkKeysOff ? ' (kapalı)' : '')],
      ['Esc', 'Açık pencereyi veya menüyü kapat']
    ];
    if (home) rows.push(['Alt Tab', 'Sanal bilgisayarda pencereler arasında geç'], [mac ? '⌘ S' : 'Ctrl S', 'Proje notunu teklif formuna aktar']);
    if (!kp) {
      kp = mkDialog('kp', 'Klavye kısayolları');
      kp.addEventListener('click', function (e) { if (e.target.closest('[data-kp-cp]')) { kp.close(); openCp(); } });
    }
    kp.innerHTML = '<div class="fx-panel__box"><div class="fx-panel__bar"><span>PS C:\\kapukaya.dev&gt; kisayollar --listele</span><button type="button" data-x aria-label="Kapat">&#10005;</button></div><div class="fx-panel__body"><table class="kp-table"><tbody>' +
      rows.map(function (r) { return '<tr><td>' + r[0].split(' ').map(function (k) { return '<kbd>' + k + '</kbd>'; }).join(' ') + '</td><td>' + r[1] + '</td></tr>'; }).join('') +
      '</tbody></table><p class="cp-note">Tek tuşlu kısayolları <button type="button" class="cp-link" data-kp-cp>Denetim Masası</button>\'ndan kapatabilirsiniz. Bu sitede klavyeyle bulunabilecek bir sürpriz de var.</p></div></div>';
    show(kp);
  };

  document.addEventListener('keydown', function (e) {
    if (e.key !== '?' || window.__fkKeysOff || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable)) return;
    if (document.querySelector('dialog[open]')) return;
    e.preventDefault(); openKeys();
  });

  /* Alt bilgide erişilebilirlik bağlantısı (çerez tercihlerinin yanında) */
  var legal = document.querySelector('.k-footer__legal');
  if (legal) {
    var b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = 'Erişilebilirlik';
    b.addEventListener('click', openCp);
    legal.appendChild(b);
  }
  window.FKUI = { a11y: openCp, keys: openKeys };
})();
