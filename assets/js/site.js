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
      term:  [30, 14, 56, 68], ext: [33, 5, 56, 88], note: [21, 11, 46, 76],
      bin:   [26, 16, 50, 62]
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
      if (w._animEnd) w.removeEventListener('animationend', w._animEnd);
      var finished = false;
      var fin = function () { if (finished) return; finished = true; w.classList.remove(cls); w.removeEventListener('animationend', onEnd); if (w._animEnd === onEnd) w._animEnd = null; if (done) done(); };
      var onEnd = function (e) { if (e.target === w) fin(); };
      w._animEnd = onEnd;
      w.addEventListener('animationend', onEnd);
      setTimeout(function () { if (w._animEnd === onEnd || w.classList.contains(cls)) fin(); }, 400);
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

    /* Diğer betiklerin (pc-apps.js) kullanabilmesi için küçük bir arayüz */
    window.FKPC = {
      root: pc, screen: screen, desktop: desktop, wins: wins,
      open: open, close: close, minimize: minimize, focus: focusWin, isOpen: isOpen,
      narrow: narrow, closeStart: closeStart, sync: sync,
      top: function () { var t = null, tz = -1; Object.keys(wins).forEach(function (k) { var w = wins[k]; if (!w.hidden && !w.classList.contains('is-min') && +w.style.zIndex > tz) { tz = +w.style.zIndex; t = k; } }); return t; }
    };

    /* Açılışta iki pencere: web sitesi arkada, masaüstü uygulaması önde.
       Açılış ekranı sürerken bekler; ekran monitöre küçüldükten sonra pencereler açılır. */
    var firstOpen = function () {
      if (!narrow()) open('web', false);
      open('desk', false);
      window.__fkpcReady = true;
      document.dispatchEvent(new Event('fkpc:ready'));
    };
    if (document.documentElement.classList.contains('is-booting') && !window.__fkBooted) {
      document.addEventListener('fk:booted', function () { setTimeout(firstOpen, 120); }, { once: true });
    } else firstOpen();
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
      if (!form.checkValidity()) {
        var bad = form.querySelector('input:invalid, select:invalid, textarea:invalid');
        if (bad && form._goStepOf) form._goStepOf(bad);
        form.reportValidity();
        return;
      }
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
            if (form._goStep) form._goStep(0);
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

  /* İletişim formu: adım adım ilerleme (JavaScript yoksa tüm alanlar tek sayfada görünür) */
  (function () {
    var f = document.querySelector('[data-contact-form]');
    if (!f) return;
    var steps = Array.prototype.slice.call(f.querySelectorAll('[data-fstep]'));
    if (steps.length < 2) return;
    var bar = f.querySelector('[data-fsteps]');
    var dots = bar ? Array.prototype.slice.call(bar.querySelectorAll('li')) : [];
    var prev = f.querySelector('[data-fprev]'), next = f.querySelector('[data-fnext]'), sub = f.querySelector('[data-fsubmit]');
    var cur = 0;
    f.classList.add('is-steps');
    var go = function (n, focus) {
      cur = Math.max(0, Math.min(steps.length - 1, n));
      steps.forEach(function (st, i) { st.hidden = i !== cur; });
      dots.forEach(function (d, i) { d.classList.toggle('is-on', i === cur); d.classList.toggle('is-done', i < cur); });
      prev.hidden = cur === 0;
      next.hidden = cur === steps.length - 1;
      sub.hidden = cur !== steps.length - 1;
      if (focus) {
        var el = steps[cur].querySelector('input:checked') || steps[cur].querySelector('input:not([type="hidden"]), select, textarea');
        if (el) el.focus({ preventScroll: true });
      }
    };
    var valid = function (i) {
      var els = steps[i].querySelectorAll('input, select, textarea');
      for (var k = 0; k < els.length; k++) {
        if (els[k].type !== 'hidden' && !els[k].checkValidity()) { els[k].reportValidity(); return false; }
      }
      return true;
    };
    next.addEventListener('click', function () { if (valid(cur)) go(cur + 1, true); });
    prev.addEventListener('click', function () { go(cur - 1, true); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { if (i < cur) go(i, true); }); });
    f.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && cur < steps.length - 1 && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'button') {
        e.preventDefault();
        if (valid(cur)) go(cur + 1, true);
      }
    });
    f.querySelectorAll('input[name="project_type"]').forEach(function (r) {
      r.addEventListener('change', function () { if (cur === 0) setTimeout(function () { go(1, true); }, 260); });
    });
    f._goStep = function (n) { go(n, false); };
    f._goStepOf = function (el) { steps.forEach(function (st, i) { if (st.contains(el)) go(i, false); }); };
    go(0, false);
  })();

  /* Süreç: kurulum sihirbazı */
  document.querySelectorAll('[data-wiz]').forEach(function (wz) {
    var panes = Array.prototype.slice.call(wz.querySelectorAll('[data-wiz-pane]'));
    var nav = Array.prototype.slice.call(wz.querySelectorAll('[data-wiz-go]'));
    var prev = wz.querySelector('[data-wiz-prev]'), next = wz.querySelector('[data-wiz-next]'), done = wz.querySelector('[data-wiz-done]');
    var label = wz.querySelector('[data-wiz-label]'), fill = wz.querySelector('[data-wiz-bar]');
    var cur = 0, seen = 0;
    wz.classList.add('is-ready');
    var go = function (n, focus) {
      cur = Math.max(0, Math.min(panes.length - 1, n));
      seen = Math.max(seen, cur);
      panes.forEach(function (p, i) { p.hidden = i !== cur; p.classList.toggle('is-in', i === cur); });
      nav.forEach(function (b, i) {
        var li = b.parentNode;
        li.classList.toggle('is-on', i === cur);
        li.classList.toggle('is-done', i < cur || (i <= seen && i !== cur));
        if (i === cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      var last = cur === panes.length - 1;
      label.textContent = last ? 'Kurulum tamamlanmak üzere' : 'Kurulum ilerlemesi %' + Math.round((cur + 1) / panes.length * 100);
      fill.style.width = ((cur + 1) / panes.length * 100) + '%';
      prev.disabled = cur === 0;
      next.hidden = last;
      done.hidden = !last;
      if (focus) (last ? done : next).focus({ preventScroll: true });
    };
    next.addEventListener('click', function () { go(cur + 1, true); });
    prev.addEventListener('click', function () { go(cur - 1, true); });
    nav.forEach(function (b, i) { b.addEventListener('click', function () { go(i, false); }); });
    go(0, false);
  });

  /* Öncesi / sonrası karşılaştırma sürgüsü: <figure class="compare" data-compare> ... (README'ye bakın) */
  document.querySelectorAll('[data-compare]').forEach(function (c) {
    var r = c.querySelector('input[type="range"]');
    if (!r) return;
    var set = function () { c.style.setProperty('--pos', r.value + '%'); };
    r.addEventListener('input', set);
    set();
  });

  /* Komut paleti: Ctrl+K / ⌘K ile sitede hızlı arama */
  (function () {
    var me = document.currentScript && document.currentScript.src;
    var base = me ? me.replace(/assets\/js\/site\.js.*$/, '') : '/';
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    var inner = document.querySelector('.k-header__inner');
    if (inner) {
      var sb = document.createElement('button');
      sb.type = 'button';
      sb.className = 'k-search-btn';
      sb.setAttribute('aria-label', 'Sitede ara (' + (isMac ? '⌘K' : 'Ctrl+K') + ')');
      sb.innerHTML = '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><span>Ara</span><kbd aria-hidden="true">' + (isMac ? '⌘K' : 'Ctrl K') + '</kbd>';
      var mb = inner.querySelector('.k-menu-btn');
      inner.insertBefore(sb, mb || null);
      sb.addEventListener('click', function () { openK(); });
    }
    var dlg = null, input, list, items = null, sel = 0, shown = [];
    var quick = [
      { t: 'Teklif isteyin', u: 'index.html#iletisim', k: 'Eylem', i: 'fa-regular fa-envelope' },
      { t: 'Hizmetler', u: 'index.html#hizmetler', k: 'Bölüm', i: 'fa-solid fa-layer-group' },
      { t: 'Referans projeler', u: 'index.html#isler', k: 'Bölüm', i: 'fa-solid fa-briefcase' },
      { t: 'Süreç nasıl ilerliyor?', u: 'index.html#surec', k: 'Bölüm', i: 'fa-solid fa-list-check' },
      { t: 'Sık sorulan sorular', u: 'index.html#sss', k: 'Bölüm', i: 'fa-regular fa-circle-question' },
      { t: 'Blog yazıları', u: 'blog/index.html', k: 'Sayfa', i: 'fa-regular fa-newspaper' },
      { t: 'Hakkımda', u: 'hakkimda.html', k: 'Sayfa', i: 'fa-regular fa-user' }
    ];
    var icon = { 'Blog': 'fa-regular fa-file-lines', 'Proje': 'fa-solid fa-briefcase', 'Eklenti': 'fa-solid fa-puzzle-piece', 'Sayfa': 'fa-regular fa-file', 'Kategori': 'fa-regular fa-folder' };
    var escH = function (v) { return String(v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var build = function () {
      dlg = document.createElement('dialog');
      dlg.className = 'cmdk';
      dlg.setAttribute('aria-label', 'Sitede ara');
      dlg.innerHTML = '<div class="cmdk__box"><div class="cmdk__in"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input type="search" placeholder="Yazı, proje veya sayfa arayın" aria-label="Arama" aria-controls="cmdk-list" aria-autocomplete="list" autocomplete="off" spellcheck="false"><kbd>Esc</kbd></div><ul class="cmdk__list" id="cmdk-list" role="listbox"></ul><div class="cmdk__foot"><span><kbd>↑</kbd><kbd>↓</kbd> gezin</span><span><kbd>Enter</kbd> aç</span><span><kbd>Esc</kbd> kapat</span></div></div>';
      document.body.appendChild(dlg);
      input = dlg.querySelector('input');
      list = dlg.querySelector('.cmdk__list');
      input.addEventListener('input', render);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
        else if (e.key === 'Enter') { e.preventDefault(); go(shown[sel]); }
      });
      list.addEventListener('click', function (e) { var li = e.target.closest('[data-i]'); if (li) go(shown[+li.dataset.i]); });
      list.addEventListener('mousemove', function (e) { var li = e.target.closest('[data-i]'); if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; mark(); } });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener('close', function () { document.documentElement.classList.remove('has-modal'); });
    };
    var load = function () {
      if (items || !window.fetch) return;
      items = [];
      fetch(base + 'assets/data/search.json').then(function (r) { return r.json(); }).then(function (j) {
        items = j.map(function (x) { x.h = norm(x.t + ' ' + (x.d || '') + ' ' + x.k); x.nt = norm(x.t); return x; });
        if (dlg && dlg.open) render();
      }).catch(function () { items = []; });
    };
    var row = function (x, i) {
      return '<li role="option" data-i="' + i + '" id="cmdk-o' + i + '"><i class="' + (x.i || icon[x.k] || 'fa-regular fa-file') + '" aria-hidden="true"></i><span class="cmdk__t"><b>' + escH(x.t) + '</b>' + (x.d ? '<small>' + escH(x.d) + '</small>' : '') + '</span><em>' + escH(x.k) + '</em></li>';
    };
    var render = function () {
      var q = input.value.trim(), terms = norm(q).split(' ').filter(Boolean), html = '';
      sel = 0;
      if (!terms.length) {
        shown = quick.slice();
        html = '<li class="cmdk__group" aria-hidden="true">Hızlı erişim</li>' + shown.map(row).join('');
      } else {
        var pool = quick.concat(items || []);
        var seenU = {};
        shown = pool.filter(function (x) {
          var h = x.h || norm(x.t + ' ' + x.k);
          if (seenU[x.u]) return false;
          var ok = terms.every(function (t) { return h.indexOf(t) !== -1; });
          if (ok) seenU[x.u] = 1;
          return ok;
        }).map(function (x) {
          var nt = x.nt || norm(x.t), sc = 0;
          terms.forEach(function (t) { if (nt.indexOf(t) === 0) sc += 3; else if (nt.indexOf(t) !== -1) sc += 2; });
          return { x: x, s: sc };
        }).sort(function (a, b) { return b.s - a.s; }).slice(0, 9).map(function (o) { return o.x; });
        if (/(^| )(surpriz|gizli|sir|sirlar|rozet|furkan)/.test(norm(q))) shown.unshift({ t: 'Gizli sürprizler ve rozetler', u: '#rozetler', k: 'Sürpriz', i: 'fa-solid fa-wand-magic-sparkles', d: 'Bu sitede saklı sürprizleri keşfedin' });
        shown.push({ t: '“' + q + '” için blogda ara', u: 'blog/index.html?q=' + encodeURIComponent(q), k: 'Arama', i: 'fa-solid fa-magnifying-glass' });
        html = shown.map(row).join('');
        if (shown.length === 1) html = '<li class="cmdk__empty" aria-hidden="true">Başlıklarda eşleşme bulunamadı. Blog yazılarının içinde aramak için Enter’a basın.</li>' + html;
      }
      list.innerHTML = html;
      mark();
    };
    var mark = function () {
      list.querySelectorAll('[data-i]').forEach(function (li) {
        var on = +li.dataset.i === sel;
        li.classList.toggle('is-sel', on);
        li.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) { input.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' }); }
      });
    };
    var move = function (d) { if (!shown.length) return; sel = (sel + d + shown.length) % shown.length; mark(); };
    var go = function (x) {
      if (!x) return;
      if (x.u === '#rozetler') { dlg.close(); document.dispatchEvent(new CustomEvent('fk:secret', { detail: 'palet' })); if (window.FKFun) setTimeout(window.FKFun.open, 250); return; }
      var url = base + x.u;
      var here = location.pathname.replace(/index\.html$/, '');
      var target = new URL(url, location.href);
      dlg.close();
      if (target.pathname.replace(/index\.html$/, '') === here && target.hash) {
        var el = document.querySelector(target.hash);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', target.hash); return; }
      }
      if (window.FKNav) window.FKNav(url); else location.href = url;
    };
    var openK = function () {
      if (!dlg) build();
      load();
      if (dlg.open) return;
      input.value = '';
      render();
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      document.documentElement.classList.add('has-modal');
      input.focus();
    };
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); openK(); }
      else if (e.key === '/' && !e.ctrlKey && !e.metaKey && !/INPUT|TEXTAREA|SELECT/.test((e.target.tagName || '')) && !e.target.isContentEditable) { e.preventDefault(); openK(); }
    });
    window.FKSearch = { open: openK };
  })();

  /* Sayfa geçişi (gidiş): site içi bağlantıya tıklanınca konsol tarzı geçiş ekranı açılır,
     ardından yeni sayfaya gidilir. Varış tarafı boot-head.js içindedir. */
  (function () {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cmdFor = function (u) {
      var path = decodeURIComponent(u.pathname).replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/^\/+|\/+$/g, '');
      return 'PS C:\\kapukaya.dev> cd ' + (path ? '.\\' + path.replace(/\//g, '\\') : '~');
    };
    var layer = null;
    var go = function (url) {
      var u = new URL(url, location.href);
      if (reduceMotion) { location.href = u.href; return; }
      var cmd = cmdFor(u);
      try { sessionStorage.setItem('fk-pt', JSON.stringify({ t: Date.now(), c: cmd + '  ✓' })); } catch (e) {}
      if (!layer) {
        layer = document.createElement('div');
        layer.className = 'pt';
        layer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(layer);
      }
      var pre = cmd.split('> ');
      layer.innerHTML = '<div class="pt__box"><p class="pt__cmd">' + pre[0].replace(/&/g, '&amp;').replace(/</g, '&lt;') + '&gt; <b>' + pre[1].replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</b><i></i></p><div class="pt__bar"><i></i></div></div>';
      void layer.offsetWidth;
      layer.classList.add('is-on');
      setTimeout(function () { location.href = u.href; }, 300);
    };
    window.FKNav = go;
    var internal = function (a, e) {
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
      if ((a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-no-pt')) return null;
      var u;
      try { u = new URL(a.href, location.href); } catch (err) { return null; }
      if (u.origin !== location.origin || !/^https?:$/.test(u.protocol)) return null;
      if (/\.(pdf|zip|png|jpe?g|webp|svg|xml|txt|json|mp4|webm)$/i.test(u.pathname)) return null;
      var norm = function (p) { return p.replace(/index\.html$/, ''); };
      if (norm(u.pathname) === norm(location.pathname) && u.search === location.search) return null;
      return u;
    };
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      var u = internal(a, e);
      if (!u) return;
      e.preventDefault();
      go(u.href);
    });
    /* Fareyle üzerine gelindiğinde sayfayı önceden indir: geçiş daha kısa sürer */
    var done = {};
    var prefetch = function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var u = internal(a, { button: 0 });
      if (!u || done[u.pathname]) return;
      done[u.pathname] = 1;
      var l = document.createElement('link');
      l.rel = 'prefetch'; l.href = u.pathname;
      document.head.appendChild(l);
    };
    document.addEventListener('pointerover', prefetch, { passive: true });
    document.addEventListener('touchstart', prefetch, { passive: true });
    /* Geri tuşuyla dönülünce (sayfa önbellekten gelirse) geçiş ekranını kaldır */
    window.addEventListener('pageshow', function (e) {
      if (e.persisted && layer) { layer.classList.remove('is-on'); layer.innerHTML = ''; }
      try { sessionStorage.removeItem('fk-pt'); } catch (err) {}
    });
  })();

  var y = document.querySelectorAll('[data-year]');
  y.forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
