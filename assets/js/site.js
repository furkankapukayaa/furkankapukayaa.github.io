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

  /* Blog kategori filtresi */
  document.querySelectorAll('[data-filter-group]').forEach(function (g) {
    var chips = g.querySelectorAll('.chip');
    var items = g.querySelectorAll('[data-cat]');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.dataset.filter;
        chips.forEach(function (c) { var on = c === chip; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        items.forEach(function (it) { it.hidden = !(f === '*' || it.dataset.cat === f); });
      });
    });
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
