(function () {
  'use strict';

  /* Üst menü */
  var header = document.querySelector('.k-header');
  if (header) {
    var btn = header.querySelector('.k-menu-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        var open = header.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.innerHTML = open ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
      });
      header.querySelectorAll('.k-nav a').forEach(function (a) {
        a.addEventListener('click', function () {
          header.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
          btn.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
        });
      });
    }
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Ana sayfadaki sanal bilgisayar: simgeler, pencereler, görev çubuğu */
  var pc = document.querySelector('[data-pc]');
  if (pc) {
    var desktop = pc.querySelector('[data-pc-desktop]');
    var screen = pc.querySelector('[data-pc-screen]');
    var startBtn = pc.querySelector('[data-pc-start-btn]');
    var startMenu = pc.querySelector('[data-pc-start]');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var layout = {
      desk:  [11, 4, 60, 88], web: [37, 8, 59, 84], panel: [15, 5, 63, 88],
      term:  [30, 14, 56, 68], ext: [33, 5, 56, 88], note: [21, 11, 46, 76]
    };
    var wins = {}, z = 10;
    pc.querySelectorAll('[data-win]').forEach(function (w) {
      var k = w.dataset.win, l = layout[k] || [15, 6, 60, 84];
      w.style.setProperty('--x', l[0] + '%'); w.style.setProperty('--y', l[1] + '%');
      w.style.setProperty('--w', l[2] + '%'); w.style.setProperty('--h', l[3] + '%');
      w.tabIndex = -1;
      wins[k] = w;
    });
    var tasks = {};
    pc.querySelectorAll('[data-task]').forEach(function (t) { tasks[t.dataset.task] = t; });
    var icons = pc.querySelectorAll('.pc-ico');

    var isOpen = function (k) { return !wins[k].hidden; };
    var narrow = function () { return screen.clientWidth <= 640; };
    var sync = function () {
      var top = null, topZ = -1;
      Object.keys(wins).forEach(function (k) {
        var w = wins[k];
        if (!w.hidden && !w.classList.contains('is-min') && +w.style.zIndex > topZ) { topZ = +w.style.zIndex; top = k; }
      });
      Object.keys(wins).forEach(function (k) {
        var on = k === top, open = isOpen(k);
        wins[k].classList.toggle('is-active', on);
        if (tasks[k]) {
          tasks[k].classList.toggle('is-open', open);
          tasks[k].classList.toggle('is-active', on);
          tasks[k].setAttribute('aria-pressed', on ? 'true' : 'false');
        }
      });
      icons.forEach(function (ic) { ic.setAttribute('aria-pressed', ic.dataset.open === top ? 'true' : 'false'); });
    };
    var anim = function (w, cls, done) {
      if (reduce) { if (done) done(); return; }
      w.classList.remove('is-opening', 'is-closing', 'is-minimizing');
      void w.offsetWidth;
      w.classList.add(cls);
      var fin = function () { w.classList.remove(cls); w.removeEventListener('animationend', fin); if (done) done(); };
      w.addEventListener('animationend', function (e) { if (e.target === w) fin(); });
      setTimeout(function () { if (w.classList.contains(cls)) fin(); }, 400);
    };
    var focusWin = function (k, moveFocus) {
      var w = wins[k];
      w.style.zIndex = ++z;
      sync();
      if (moveFocus) w.focus({ preventScroll: true });
    };
    var open = function (k, moveFocus) {
      var w = wins[k];
      if (!w) return;
      closeStart();
      if (!w.hidden && !w.classList.contains('is-min')) { focusWin(k, moveFocus); return; }
      var wasMin = w.classList.contains('is-min');
      w.hidden = false;
      w.classList.remove('is-min');
      if (!wasMin) { w.classList.remove('is-fresh'); void w.offsetWidth; w.classList.add('is-fresh'); }
      anim(w, 'is-opening');
      focusWin(k, moveFocus);
    };
    var close = function (k) {
      var w = wins[k];
      anim(w, 'is-closing', function () { w.hidden = true; w.classList.remove('is-min', 'is-max', 'is-fresh'); sync(); });
    };
    var minimize = function (k) {
      var w = wins[k];
      anim(w, 'is-minimizing', function () { w.hidden = true; w.classList.add('is-min'); sync(); });
    };
    var toggleMax = function (k) {
      var w = wins[k], on = w.classList.toggle('is-max');
      var b = w.querySelector('[data-act="max"]');
      if (b) b.setAttribute('aria-label', b.getAttribute('aria-label').replace(on ? 'büyüt' : 'eski boyutuna getir', on ? 'eski boyutuna getir' : 'büyüt'));
    };

    pc.addEventListener('click', function (e) {
      var o = e.target.closest('[data-open]');
      if (o) { open(o.dataset.open, true); return; }
      var t = e.target.closest('[data-task]');
      if (t) {
        var k = t.dataset.task, w = wins[k];
        if (!isOpen(k)) open(k, true);
        else if (w.classList.contains('is-active')) minimize(k);
        else focusWin(k, true);
        return;
      }
      var a = e.target.closest('[data-act]');
      if (a) {
        var key = a.closest('[data-win]').dataset.win;
        if (a.dataset.act === 'close') close(key);
        else if (a.dataset.act === 'min') minimize(key);
        else toggleMax(key);
        return;
      }
      if (e.target.closest('.pc-startmenu a')) closeStart();
    });
    pc.addEventListener('pointerdown', function (e) {
      var w = e.target.closest('[data-win]');
      if (w && !w.classList.contains('is-active')) focusWin(w.dataset.win, false);
    });

    /* Başlık çubuğundan sürükleme (geniş ekranlarda) */
    var drag = null;
    pc.addEventListener('pointerdown', function (e) {
      var bar = e.target.closest('[data-drag]');
      if (!bar || e.target.closest('button, a') || e.button !== 0 || narrow()) return;
      var w = bar.closest('[data-win]');
      if (w.classList.contains('is-max')) return;
      var r = w.getBoundingClientRect(), d = desktop.getBoundingClientRect();
      drag = { w: w, dx: e.clientX - r.left, dy: e.clientY - r.top, d: d, ww: r.width };
      w.classList.add('is-dragging');
      bar.setPointerCapture(e.pointerId);
    });
    pc.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var d = drag.d;
      var x = Math.min(Math.max(e.clientX - d.left - drag.dx, 80 - drag.ww), d.width - 80);
      var y = Math.min(Math.max(e.clientY - d.top - drag.dy, 0), d.height - 36);
      drag.w.style.setProperty('--x', (x / d.width * 100) + '%');
      drag.w.style.setProperty('--y', (y / d.height * 100) + '%');
    });
    var endDrag = function () { if (drag) { drag.w.classList.remove('is-dragging'); drag = null; } };
    pc.addEventListener('pointerup', endDrag);
    pc.addEventListener('pointercancel', endDrag);
    pc.addEventListener('dblclick', function (e) {
      var bar = e.target.closest('[data-drag]');
      if (bar && !e.target.closest('button, a') && !narrow()) toggleMax(bar.closest('[data-win]').dataset.win);
    });

    /* Başlat menüsü */
    function closeStart() { if (!startMenu.hidden) { startMenu.hidden = true; startBtn.setAttribute('aria-expanded', 'false'); } }
    startBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var show = startMenu.hidden;
      startMenu.hidden = !show;
      startBtn.setAttribute('aria-expanded', show ? 'true' : 'false');
      if (show) { var f = startMenu.querySelector('button'); if (f) f.focus({ preventScroll: true }); }
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('[data-pc-start], [data-pc-start-btn]')) closeStart(); });
    pc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !startMenu.hidden) { closeStart(); startBtn.focus(); }
    });

    /* Saat ve tarih */
    var clock = pc.querySelector('[data-pc-clock]'), date = pc.querySelector('[data-pc-date]'), now = pc.querySelector('[data-pc-now]');
    var tick = function () {
      var d = new Date();
      var hm = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      if (clock) clock.textContent = hm;
      if (date) date.textContent = d.toLocaleDateString('tr-TR');
      if (now) { var g = d.toLocaleDateString('tr-TR', { weekday: 'long' }); now.textContent = g.charAt(0).toLocaleUpperCase('tr-TR') + g.slice(1) + ', ' + hm; }
    };
    tick(); setInterval(tick, 30000);

    /* Açılışta iki pencere: web sitesi arkada, masaüstü uygulaması önde */
    if (!narrow()) open('web', false);
    open('desk', false);
  }

  /* "Tümünü göster" düğmeleri */
  document.querySelectorAll('[data-expand]').forEach(function (btn) {
    var target = document.getElementById(btn.dataset.expand);
    if (!target) return;
    btn.addEventListener('click', function () {
      var open = target.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? btn.dataset.less : btn.dataset.more;
      if (!open) target.scrollIntoView({ block: 'start' });
    });
  });

  /* Kaydırmalı referanslar */
  document.querySelectorAll('[data-carousel]').forEach(function (c) {
    var track = c.querySelector('.carousel__track');
    var prev = c.querySelector('[data-prev]');
    var next = c.querySelector('[data-next]');
    var step = function () { var s = track.querySelector('.slide'); return s ? s.getBoundingClientRect().width + 20 : 300; };
    var update = function () {
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };
    c.querySelectorAll('.quote.slide').forEach(function (q) {
      var bq = q.querySelector('blockquote');
      if (bq.scrollHeight <= bq.clientHeight + 4) return;
      q.classList.add('is-long');
      var more = document.createElement('button');
      more.type = 'button';
      more.className = 'quote__more';
      more.textContent = 'Devamını oku';
      more.setAttribute('aria-expanded', 'false');
      bq.insertAdjacentElement('afterend', more);
      more.addEventListener('click', function () {
        var open = q.classList.toggle('is-open');
        more.textContent = open ? 'Daha az göster' : 'Devamını oku';
        more.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* Blog: arama, kategori filtresi ve sayfalama */
  var trMap = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' };
  var norm = function (v) {
    return (v || '').replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase()
      .replace(/[çğıöşüâîû]/g, function (ch) { return trMap[ch]; })
      .replace(/[^a-z0-9#.+ ]/g, ' ').replace(/\s+/g, ' ').trim();
  };
  document.querySelectorAll('[data-blog]').forEach(function (root) {
    var list = root.querySelector('[data-blog-list]');
    if (!list) return;
    var items = Array.prototype.slice.call(list.querySelectorAll('.post'));
    var input = root.querySelector('[data-blog-search]');
    var form = root.querySelector('[data-blog-form]');
    var clear = root.querySelector('[data-blog-clear]');
    var chips = Array.prototype.slice.call(root.querySelectorAll('[data-filter]'));
    var pager = root.querySelector('[data-blog-pager]');
    var status = root.querySelector('[data-blog-status]');
    var empty = root.querySelector('[data-blog-empty]');
    var perPage = parseInt(root.dataset.perPage, 10) || 12;
    var isIndex = root.dataset.mode === 'index';
    var params = new URLSearchParams(location.search);
    var state = { q: params.get('q') || '', cat: (isIndex && params.get('kategori')) || '*', page: parseInt(params.get('sayfa'), 10) || 1 };
    var timer;

    if (input) input.value = state.q;

    var syncUrl = function () {
      var p = new URLSearchParams();
      if (state.q) p.set('q', state.q);
      if (isIndex && state.cat !== '*') p.set('kategori', state.cat);
      if (state.page > 1) p.set('sayfa', state.page);
      var qs = p.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    };

    var pageList = function (cur, total) {
      if (total <= 7) return Array.from({ length: total }, function (_, i) { return i + 1; });
      var out = [1];
      var from = Math.max(2, cur - 1), to = Math.min(total - 1, cur + 1);
      if (from > 2) out.push('…');
      for (var i = from; i <= to; i++) out.push(i);
      if (to < total - 1) out.push('…');
      out.push(total);
      return out;
    };

    var apply = function (scroll) {
      var terms = norm(state.q).split(' ').filter(Boolean);
      var matched = items.filter(function (it) {
        if (state.cat !== '*' && it.dataset.cat !== state.cat) return false;
        var hay = it.dataset.search || norm(it.textContent);
        return terms.every(function (t) { return hay.indexOf(t) !== -1; });
      });
      var pages = Math.max(1, Math.ceil(matched.length / perPage));
      if (state.page > pages) state.page = pages;
      if (state.page < 1) state.page = 1;
      var start = (state.page - 1) * perPage, end = start + perPage;
      items.forEach(function (it) { it.hidden = true; });
      matched.forEach(function (it, i) { it.hidden = i < start || i >= end; });

      chips.forEach(function (c) {
        var on = c.dataset.filter === state.cat;
        c.classList.toggle('is-active', on);
        if (on) c.setAttribute('aria-current', 'page'); else c.removeAttribute('aria-current');
      });
      if (clear) clear.hidden = !state.q;
      if (empty) empty.hidden = matched.length !== 0;
      if (status) {
        var txt = matched.length + ' yazı';
        if (state.q) txt = '“' + state.q + '” için ' + matched.length + ' sonuç';
        if (pages > 1) txt += ' · Sayfa ' + state.page + '/' + pages;
        status.textContent = txt;
      }
      if (pager) {
        pager.hidden = pages < 2;
        pager.innerHTML = '';
        if (pages > 1) {
          var mk = function (label, page, opts) {
            var b = document.createElement('button');
            b.type = 'button';
            b.innerHTML = label;
            if (opts && opts.aria) b.setAttribute('aria-label', opts.aria);
            if (page === state.page && !(opts && opts.nav)) b.setAttribute('aria-current', 'page');
            if (opts && opts.disabled) b.disabled = true;
            b.addEventListener('click', function () { state.page = page; apply(true); });
            pager.appendChild(b);
          };
          mk('<i class="fa-solid fa-arrow-left" aria-hidden="true"></i>', state.page - 1, { nav: true, aria: 'Önceki sayfa', disabled: state.page === 1 });
          pageList(state.page, pages).forEach(function (n) {
            if (n === '…') { var s = document.createElement('span'); s.className = 'pager__gap'; s.textContent = '…'; pager.appendChild(s); }
            else mk(String(n), n, { aria: 'Sayfa ' + n });
          });
          mk('<i class="fa-solid fa-arrow-right" aria-hidden="true"></i>', state.page + 1, { nav: true, aria: 'Sonraki sayfa', disabled: state.page === pages });
        }
      }
      syncUrl();
      if (scroll) root.scrollIntoView({ block: 'start' });
    };

    if (input) {
      input.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () { state.q = input.value.trim(); state.page = 1; apply(false); }, 120);
      });
    }
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); state.q = input.value.trim(); state.page = 1; apply(false); });
    if (clear) clear.addEventListener('click', function () { input.value = ''; state.q = ''; state.page = 1; apply(false); input.focus(); });
    root.querySelectorAll('[data-blog-reset]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); if (input) input.value = ''; state.q = ''; state.cat = '*'; state.page = 1; apply(false); });
    });
    chips.forEach(function (chip) {
      chip.addEventListener('click', function (e) {
        e.preventDefault();
        state.cat = chip.dataset.filter; state.page = 1; apply(false);
      });
    });
    apply(false);
  });

  /* Açılır pencereler (aydınlatma metni, açık rıza, çerez tercihleri) */
  var openModal = function (dlg, opener) {
    if (!dlg) return;
    dlg._opener = opener || document.activeElement;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    document.documentElement.classList.add('has-modal');
  };
  var closeModal = function (dlg) {
    if (!dlg) return;
    if (typeof dlg.close === 'function' && dlg.open) dlg.close(); else dlg.removeAttribute('open');
  };
  document.querySelectorAll('dialog.k-modal').forEach(function (dlg) {
    dlg.addEventListener('close', function () {
      document.documentElement.classList.remove('has-modal');
      if (dlg._opener && dlg._opener.focus) dlg._opener.focus({ preventScroll: true });
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeModal(dlg); });
  });
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-legal-open]');
    if (o) { e.preventDefault(); openModal(document.getElementById('legal-' + o.dataset.legalOpen), o); return; }
    var c = e.target.closest('[data-modal-close]');
    if (c) { closeModal(c.closest('dialog')); return; }
    var a = e.target.closest('[data-modal-accept]');
    if (a) {
      var box = document.querySelector('[data-consent-box="' + a.dataset.modalAccept + '"]');
      if (box) { box.checked = true; box.dispatchEvent(new Event('change', { bubbles: true })); box._fromModal = true; }
      var d = a.closest('dialog');
      if (d) { d._opener = box || d._opener; closeModal(d); }
    }
  });

  /* İletişim formu (Web3Forms) ve basit kötüye kullanım korumaları */
  var form = document.querySelector('[data-contact-form]');
  if (form && window.fetch) {
    var status = form.querySelector('.form__status');
    var submit = form.querySelector('button[type="submit"]');
    var started = Date.now();
    var startedField = form.querySelector('[name="form_started"]');
    if (startedField) startedField.value = new Date(started).toISOString();
    var RL = 'fk-form-sent';
    var recent = function () {
      try { return (JSON.parse(localStorage.getItem(RL)) || []).filter(function (t) { return Date.now() - t < 10 * 60 * 1000; }); } catch (e) { return []; }
    };
    var mark = function () { try { var r = recent(); r.push(Date.now()); localStorage.setItem(RL, JSON.stringify(r)); } catch (e) {} };
    var fail = function (html) { status.className = 'form__status is-err'; status.innerHTML = html; };
    var MAIL = '<a href="mailto:info@kapukaya.dev">info@kapukaya.dev</a>';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea').forEach(function (el) { el.value = el.value.trim(); });
      if (!form.reportValidity()) return;
      var key = form.querySelector('[name="access_key"]').value;
      if (!key || key.indexOf('BURAYA') !== -1) { fail('Form şu anda kullanılamıyor. Lütfen ' + MAIL + ' adresine e-posta gönderin.'); return; }
      var hp = form.querySelector('[name="botcheck"]');
      if (hp && hp.checked) { form.reset(); status.className = 'form__status is-ok'; status.textContent = 'Talebiniz alındı.'; return; }
      if (Date.now() - started < 3000) { fail('Form çok hızlı gönderildi. Bilgilerinizi kontrol edip birkaç saniye sonra tekrar deneyin.'); return; }
      if (recent().length >= 3) { fail('Kısa sürede birden fazla talep gönderdiniz. Lütfen 10 dakika sonra tekrar deneyin veya ' + MAIL + ' adresine yazın.'); return; }
      var log = form.querySelector('[name="consent_log"]');
      if (log) log.value = 'Aydınlatma Metni: okundu (sürüm 2026-10-01) | Açık rıza (yurt dışı aktarım): verildi | Zaman: ' + new Date().toISOString() + ' | Sayfa: ' + location.href.split('#')[0];

      var data = new FormData(form);
      var label = submit.textContent;
      submit.disabled = true;
      submit.textContent = 'Gönderiliyor…';
      status.className = 'form__status';
      fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Accept': 'application/json' }, body: data })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok && res.j && res.j.success) {
            mark();
            form.reset();
            started = Date.now();
            status.className = 'form__status is-ok';
            status.textContent = 'Talebiniz alındı. En kısa sürede size dönüş yapılacaktır.';
          } else {
            throw new Error((res.j && res.j.message) || 'Gönderilemedi');
          }
        })
        .catch(function () {
          fail('Talebiniz iletilemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin veya ' + MAIL + ' adresine e-posta gönderin.');
        })
        .then(function () { submit.disabled = false; submit.textContent = label; });
    });
  }

  var y = document.querySelectorAll('[data-year]');
  y.forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
