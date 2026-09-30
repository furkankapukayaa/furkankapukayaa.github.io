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

  /* Ana sayfadaki temsili ekranlar */
  var demo = document.querySelector('[data-demo]');
  if (demo) {
    var tabs = Array.prototype.slice.call(demo.querySelectorAll('.demo__tab'));
    var panels = demo.querySelectorAll('.demo__panel');
    var show = function (key) {
      tabs.forEach(function (t) { var on = t.dataset.key === key; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; });
      panels.forEach(function (p) { p.classList.toggle('is-active', p.dataset.panel === key); });
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { show(tab.dataset.key); });
      tab.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        next.focus(); show(next.dataset.key);
      });
    });
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

  /* İletişim formu (Web3Forms) */
  var form = document.querySelector('[data-contact-form]');
  if (form && window.fetch) {
    var status = form.querySelector('.form__status');
    var submit = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var key = form.querySelector('[name="access_key"]').value;
      if (!key || key.indexOf('BURAYA') !== -1) {
        status.className = 'form__status is-err';
        status.innerHTML = 'Form şu anda kullanılamıyor. Lütfen <a href="mailto:info@kapukaya.dev">info@kapukaya.dev</a> adresine e-posta gönderin.';
        return;
      }
      var data = new FormData(form);
      var label = submit.textContent;
      submit.disabled = true;
      submit.textContent = 'Gönderiliyor…';
      status.className = 'form__status';
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: data
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok && res.j && res.j.success) {
            form.reset();
            status.className = 'form__status is-ok';
            status.textContent = 'Talebiniz alındı. En kısa sürede size dönüş yapılacaktır.';
          } else {
            throw new Error((res.j && res.j.message) || 'Gönderilemedi');
          }
        })
        .catch(function () {
          status.className = 'form__status is-err';
          status.innerHTML = 'Talebiniz iletilemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin veya <a href="mailto:info@kapukaya.dev">info@kapukaya.dev</a> adresine e-posta gönderin.';
        })
        .then(function () {
          submit.disabled = false;
          submit.textContent = label;
        });
    });
  }

  var y = document.querySelectorAll('[data-year]');
  y.forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
