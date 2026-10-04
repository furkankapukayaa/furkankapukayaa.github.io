/* Ana sayfadaki sanal bilgisayarın uygulama içi etkileşimleri ve masaüstü ekleri.
   site.js içindeki window.FKPC arayüzünü kullanır; yalnızca ana sayfada yüklenir.
   İçindekiler: Salon Yönetimi, Kent Emlak, Ajans Paneli, StokSenkron konsolu, Chrome eklenti denemeleri,
   Proje notu, Geri Dönüşüm Kutusu, sağ tık menüsü, bildirim, görev görünümü (Alt+Tab), kapatma ve seçim kutusu. */
(function () {
  'use strict';

  var P = window.FKPC;
  if (!P) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Yardımcılar ---------- */
  var qs = function (sel, root) { return (root || document).querySelector(sel); };
  var qsa = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var esc = function (v) { return String(v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var tl = function (n) { return '₺' + Math.round(n).toLocaleString('tr-TR'); };
  var trLower = function (v) {
    return (v || '').replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase()
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
  };
  var countTo = function (el, from, to, fmt, ms) {
    if (!el) return;
    fmt = fmt || function (n) { return Math.round(n).toLocaleString('tr-TR'); };
    if (reduce || from === to) { el.textContent = fmt(to); return; }
    var t0 = null, dur = ms || 520;
    var step = function (t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  var flash = function (el, cls) {
    if (!el) return;
    cls = cls || 'is-flash';
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    setTimeout(function () { el.classList.remove(cls); }, 900);
  };
  /* Pencerenin durum çubuğunda kısa süreli mesaj */
  var statusMsg = function (el, text, ms) {
    if (!el) return;
    if (!el._orig) el._orig = el.textContent;
    el.textContent = text;
    el.classList.add('is-note');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.textContent = el._orig; el.classList.remove('is-note'); }, ms || 2800);
  };
  /* Bir pencere içinde sekmeli görünümler */
  var tabs = function (root, btnAttr, panelAttr, onShow) {
    var btns = qsa('[' + btnAttr + ']', root);
    var panels = {};
    qsa('[' + panelAttr + ']', root).forEach(function (p) { panels[p.getAttribute(panelAttr)] = p; });
    var show = function (key) {
      btns.forEach(function (b) {
        var on = b.getAttribute(btnAttr) === key;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
      });
      Object.keys(panels).forEach(function (k) { panels[k].hidden = k !== key; });
      if (onShow) onShow(key, panels[key]);
      if (panels[key]) { panels[key].scrollTop = 0; panels[key].classList.remove('is-in'); void panels[key].offsetWidth; panels[key].classList.add('is-in'); }
    };
    btns.forEach(function (b, i) {
      b.tabIndex = b.classList.contains('is-active') ? 0 : -1;
      b.addEventListener('click', function () { show(b.getAttribute(btnAttr)); });
      b.addEventListener('keydown', function (e) {
        var d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = btns[(i + d + btns.length) % btns.length];
        n.focus(); show(n.getAttribute(btnAttr));
      });
    });
    return show;
  };
  var goContact = function (delay) {
    setTimeout(function () {
      var c = document.getElementById('iletisim');
      if (c) c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }, delay || 0);
  };

  /* =====================================================================
     1) Salon Yönetimi (masaüstü uygulaması)
     ===================================================================== */
  (function () {
    var win = P.wins.desk, root = win && qs('[data-salon]', win);
    if (!root) return;
    var rowsEl = qs('[data-salon-rows]', root);
    var K = { count: qs('[data-k="count"]', root), free: qs('[data-k="free"]', root), cash: qs('[data-k="cash"]', root) };
    var status = qs('[data-salon-status]', win);
    var form = qs('[data-salon-form]', root), newBtn = qs('[data-salon-new]', root);
    var timeSel = qs('[data-f="time"]', form), nameSel = qs('[data-f="name"]', form), svcSel = qs('[data-f="svc"]', form);
    var ST = { wait: ['pill--wait', 'Bekleniyor'], ok: ['pill--ok', 'Geldi'], go: ['pill--go', 'SMS gönderildi'] };
    /* Ekranda görünmeyen sabah işlemleri: 4 randevu ve 1 ürün satışı (toplam ₺6.200) */
    var morning = [
      ['08:30', 'Hande Su', 'Saç kesimi', 'Seda', 450],
      ['08:45', 'Pınar Ece', 'Boya', 'Gül', 1800],
      ['09:00', 'Gizem Ay', 'Keratin bakım', 'Gül', 2400],
      ['09:30', 'Tuğba Er', 'Manikür', 'İpek', 550],
      ['09:40', 'Ürün satışı', 'Saç bakım seti', 'Seda', 1000]
    ];
    var morningSum = morning.reduce(function (a, m) { return a + m[4]; }, 0);
    var state = { count: 9, free: ['12:30', '16:30', '18:00'] };

    var rows = function () {
      return qsa('.win__row', rowsEl).map(function (r) {
        var d = qs('.d', r).textContent.split(', ');
        return { el: r, time: qs('.c', r).textContent, name: qs('.t', r).textContent, svc: d[0], staff: d[1] || '', price: +r.dataset.price, st: qs('[data-st]', r).dataset.st };
      });
    };
    var cash = function () { return morningSum + rows().filter(function (r) { return r.st === 'ok'; }).reduce(function (a, r) { return a + r.price; }, 0); };
    var lastCash = cash();
    var updateCash = function () { var c = cash(); countTo(K.cash, lastCash, c, tl); flash(K.cash.parentNode); lastCash = c; };

    rowsEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-st]');
      if (!b) return;
      var row = b.closest('.win__row'), name = qs('.t', row).textContent, price = +row.dataset.price;
      var next = b.dataset.st === 'ok' ? 'wait' : 'ok';
      b.dataset.st = next;
      b.className = 'pill ' + ST[next][0];
      b.textContent = ST[next][1];
      flash(row);
      updateCash();
      statusMsg(status, next === 'ok' ? name + ' geldi, kasaya ' + tl(price) + ' eklendi' : name + ' bekleniyor olarak işaretlendi');
    });

    var fillTimes = function () {
      timeSel.innerHTML = state.free.map(function (t) { return '<option>' + t + '</option>'; }).join('');
      newBtn.disabled = !state.free.length;
      newBtn.innerHTML = state.free.length ? '<i class="fa-solid fa-plus" aria-hidden="true"></i>Yeni randevu' : 'Boş saat kalmadı';
    };
    fillTimes();
    newBtn.addEventListener('click', function () {
      form.hidden = !form.hidden;
      newBtn.setAttribute('aria-expanded', form.hidden ? 'false' : 'true');
      if (!form.hidden) nameSel.focus();
    });
    qs('[data-salon-cancel]', form).addEventListener('click', function () { form.hidden = true; newBtn.setAttribute('aria-expanded', 'false'); newBtn.focus(); });
    qs('[data-salon-save]', form).addEventListener('click', function () {
      var t = timeSel.value, n = nameSel.value, sv = svcSel.value.split('|');
      if (!t) return;
      var row = document.createElement('div');
      row.className = 'win__row is-new';
      row.dataset.price = sv[1];
      row.innerHTML = '<span class="c">' + esc(t) + '</span><span class="t">' + esc(n) + '</span><span class="d">' + esc(sv[0]) + ', ' + esc(sv[2]) + '</span><button type="button" class="pill pill--wait" data-st="wait">Bekleniyor</button>';
      var after = qsa('.win__row', rowsEl).filter(function (r) { return qs('.c', r).textContent > t; })[0];
      rowsEl.insertBefore(row, after || null);
      state.free = state.free.filter(function (x) { return x !== t; });
      countTo(K.count, state.count, state.count + 1); state.count++;
      countTo(K.free, state.free.length + 1, state.free.length);
      flash(K.count.parentNode); flash(K.free.parentNode);
      fillTimes();
      form.hidden = true;
      newBtn.setAttribute('aria-expanded', 'false');
      statusMsg(status, 'Randevu eklendi: ' + t + ', ' + n + '. Hatırlatma SMS’i planlandı');
      row.scrollIntoView({ block: 'nearest' });
    });

    var customers = [
      ['Elif Yıldız', '0532 *** ** 14', 12, 'Bugün'], ['Merve Aydın', '0533 *** ** 08', 7, 'Bugün'],
      ['Zeynep Kaya', '0542 *** ** 61', 15, '2 hafta önce'], ['Ayşe Tunç', '0505 *** ** 33', 4, '1 ay önce'],
      ['Derya Er', '0535 *** ** 90', 9, '3 hafta önce'], ['Buse Demir', '0544 *** ** 27', 2, '2 ay önce'],
      ['Ceren Ak', '0530 *** ** 45', 21, 'Geçen hafta'], ['Nihan Öztürk', '0538 *** ** 72', 6, '1 ay önce'],
      ['Sibel Koç', '0507 *** ** 19', 11, 'Geçen hafta'], ['Esra Yalın', '0541 *** ** 56', 3, '3 ay önce']
    ];
    var views = {
      musteri: function (p) {
        if (!p._built) {
          p.innerHTML = '<div class="win__head"><strong>Müşteriler</strong><small>' + customers.length + ' kayıt</small></div><label class="w-search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input type="search" placeholder="İsim veya telefon ile arayın" aria-label="Müşteri ara"></label><div class="w-table" role="table" aria-label="Müşteri listesi"><div class="w-tr w-th" role="row"><span role="columnheader">Ad soyad</span><span role="columnheader">Telefon</span><span role="columnheader">Ziyaret</span><span role="columnheader">Son gelişi</span></div><div data-list></div></div><p class="w-empty" hidden>Bu aramayla eşleşen müşteri yok.</p>';
          var list = qs('[data-list]', p), inp = qs('input', p), empty = qs('.w-empty', p);
          var draw = function () {
            var q = trLower(inp.value.trim());
            var f = customers.filter(function (c) { return !q || trLower(c[0] + ' ' + c[1]).indexOf(q) !== -1; });
            list.innerHTML = f.map(function (c) { return '<div class="w-tr" role="row"><span role="cell" class="t">' + esc(c[0]) + '</span><span role="cell">' + c[1] + '</span><span role="cell">' + c[2] + '</span><span role="cell">' + c[3] + '</span></div>'; }).join('');
            empty.hidden = f.length > 0;
          };
          inp.addEventListener('input', draw);
          draw();
          p._built = true;
        }
      },
      personel: function (p) {
        var staff = { 'Seda': { r: 0, next: null, svc: 'Kesim, fön' }, 'Gül': { r: 0, next: null, svc: 'Boya, bakım' }, 'İpek': { r: 0, next: null, svc: 'Manikür, pedikür' } };
        morning.forEach(function (m) { if (m[1] !== 'Ürün satışı' && staff[m[3]]) staff[m[3]].r++; });
        rows().forEach(function (r) { var s = staff[r.staff]; if (!s) return; s.r++; if (r.st !== 'ok' && !s.next) s.next = r.time + ', ' + r.name; });
        p.innerHTML = '<div class="win__head"><strong>Personel</strong><small>Bugün 3 kişi çalışıyor</small></div><div class="w-cards">' + Object.keys(staff).map(function (n) {
          var s = staff[n], pct = Math.min(100, Math.round(s.r / 5 * 100));
          return '<div class="w-card"><span class="w-av">' + n.charAt(0) + '</span><div><b>' + n + '</b><small>' + s.svc + '</small><div class="w-meter"><i style="width:' + pct + '%"></i></div><small>' + s.r + ' randevu, doluluk %' + pct + '</small><small class="w-next">' + (s.next ? 'Sıradaki: ' + esc(s.next) : 'Bugün için sırada müşteri yok') + '</small></div></div>';
        }).join('') + '</div>';
      },
      kasa: function (p) {
        var list = morning.map(function (m) { return { time: m[0], name: m[1], svc: m[2], price: m[4] }; })
          .concat(rows().filter(function (r) { return r.st === 'ok'; }));
        p.innerHTML = '<div class="win__head"><strong>Kasa</strong><small>Bugün ' + list.length + ' işlem</small></div><div class="w-table" role="table" aria-label="Kasa hareketleri"><div class="w-tr w-tr--3 w-th" role="row"><span role="columnheader">Saat</span><span role="columnheader">İşlem</span><span role="columnheader">Tutar</span></div>' +
          list.map(function (r) { return '<div class="w-tr w-tr--3" role="row"><span role="cell">' + r.time + '</span><span role="cell"><b class="t">' + esc(r.name) + '</b> ' + esc(r.svc) + '</span><span role="cell" class="w-amt">+' + tl(r.price) + '</span></div>'; }).join('') +
          '</div><div class="w-total"><span>Gün içi toplam</span><b>' + tl(cash()) + '</b></div><div class="w-actions"><button type="button" class="w-btn" data-close-day><i class="fa-solid fa-file-invoice" aria-hidden="true"></i>Günü kapat</button><span class="w-done" role="status"></span></div>';
        qs('[data-close-day]', p).addEventListener('click', function () {
          qs('.w-done', p).textContent = 'Gün sonu raporu hazırlandı: kasa-' + new Date().toLocaleDateString('tr-TR').replace(/\./g, '-') + '.pdf';
          statusMsg(status, 'Gün sonu raporu oluşturuldu');
        });
      },
      rapor: function (p) {
        var tot = {};
        morning.forEach(function (m) { if (m[1] !== 'Ürün satışı') tot[m[2]] = (tot[m[2]] || 0) + 1; });
        rows().forEach(function (r) { tot[r.svc] = (tot[r.svc] || 0) + 1; });
        var base = { 'Saç kesimi': 38, 'Fön': 31, 'Boya': 24, 'Keratin bakım': 12, 'Manikür': 19 };
        Object.keys(tot).forEach(function (k) { base[k] = (base[k] || 0) + tot[k]; });
        var arr = Object.keys(base).map(function (k) { return [k, base[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
        var max = arr[0][1];
        p.innerHTML = '<div class="win__head"><strong>Raporlar</strong><small>Bu ay</small></div><div class="win__stats"><div class="win__stat"><small>Aylık ciro</small><b>₺142.300</b></div><div class="win__stat"><small>Yeni müşteri</small><b>23</b></div><div class="win__stat"><small>Tekrar gelme</small><b>%64</b></div></div><p class="w-sub">En çok tercih edilen hizmetler</p><div class="w-hbars">' +
          arr.map(function (a) { return '<div class="w-hbar"><span>' + esc(a[0]) + '</span><span class="w-hbar__t"><i style="width:' + Math.round(a[1] / max * 100) + '%"></i></span><b>' + a[1] + '</b></div>'; }).join('') + '</div>';
      }
    };
    tabs(root, 'data-sv', 'data-sv-panel', function (k, p) { if (views[k]) views[k](p); });
  })();

  /* =====================================================================
     2) Kent Emlak (web sitesi)
     ===================================================================== */
  (function () {
    var win = P.wins.web, root = win && qs('[data-emlak]', win);
    if (!root) return;
    var L = [
      { deal: 'Satılık', type: 'Daire', room: '3+1', loc: 'Kadıköy', m2: 145, price: 8950000, ph: 'ph1', title: '3+1 Daire', floor: '4. kat', age: '6 yıllık', note: 'Metroya 5 dakika yürüme mesafesinde, güney cepheli ve ebeveyn banyolu.' },
      { deal: 'Satılık', type: 'Müstakil', room: '2+1', loc: 'Beykoz', m2: 110, price: 6400000, ph: 'ph2', title: '2+1 Bahçeli', floor: 'Bahçe katı', age: '12 yıllık', note: 'Ağaçlı, sakin bir sokakta; 80 m² özel bahçe ve otopark.' },
      { deal: 'Kiralık', type: 'Dükkân', room: '', loc: 'Şişli', m2: 85, price: 42000, ph: 'ph3', title: 'Dükkân', floor: 'Zemin kat', age: '20 yıllık', note: 'Cadde üzerinde, geniş vitrinli ve depolu.' },
      { deal: 'Satılık', type: 'Daire', room: '2+1', loc: 'Ataşehir', m2: 95, price: 5750000, ph: 'ph4', title: '2+1 Site içi', floor: '9. kat', age: '4 yıllık', note: 'Havuzlu sitede, kapalı otoparklı ve 7/24 güvenlikli.' },
      { deal: 'Kiralık', type: 'Daire', room: '1+1', loc: 'Kadıköy', m2: 60, price: 28000, ph: 'ph5', title: '1+1 Eşyalı', floor: '2. kat', age: '15 yıllık', note: 'Moda’ya yürüme mesafesinde, eşyalı ve hemen taşınmaya hazır.' },
      { deal: 'Kiralık', type: 'Daire', room: '3+1', loc: 'Beşiktaş', m2: 130, price: 55000, ph: 'ph6', title: '3+1 Boğaz manzaralı', floor: '5. kat', age: '10 yıllık', note: 'Kısmi Boğaz manzaralı, asansörlü ve yeni tadilatlı.' },
      { deal: 'Satılık', type: 'Daire', room: '4+1', loc: 'Şişli', m2: 190, price: 14200000, ph: 'ph1', title: '4+1 Dubleks', floor: '7. ve 8. kat', age: '3 yıllık', note: 'Teraslı dubleks, iki otopark yeri ve akıllı ev sistemi.' }
    ];
    var favs = {}, f = { deal: '', loc: '', type: '', room: '', fav: false };
    var cards = qs('[data-emlak-cards]', root), result = qs('[data-emlak-result]', root), detail = qs('[data-emlak-detail]', root);
    var favCount = qs('[data-fav-count]', root), favBtn = qs('[data-fav-only]', root);
    var dealBtns = qsa('[data-deal]', root);
    var price = function (x) { return '₺' + x.price.toLocaleString('tr-TR') + (x.deal === 'Kiralık' ? ' / ay' : ''); };
    var draw = function () {
      var list = L.map(function (x, i) { x.i = i; return x; }).filter(function (x) {
        return (!f.deal || x.deal === f.deal) && (!f.loc || x.loc === f.loc) && (!f.type || x.type === f.type) && (!f.room || x.room === f.room) && (!f.fav || favs[x.i]);
      });
      cards.innerHTML = list.map(function (x) {
        return '<div class="s-card"><button type="button" class="s-open" data-id="' + x.i + '" aria-label="' + esc(x.title + ', ' + x.loc + ', ' + price(x)) + ' ilan detayı"><span class="s-ph ' + x.ph + '"><span class="s-deal">' + x.deal + '</span></span><span class="s-info"><b>' + esc(x.title) + '</b><small>' + esc(x.loc) + '</small><span class="s-row"><span>' + x.m2 + ' m²</span><strong>' + price(x) + '</strong></span></span></button><button type="button" class="s-heart' + (favs[x.i] ? ' is-on' : '') + '" data-heart="' + x.i + '" aria-pressed="' + (favs[x.i] ? 'true' : 'false') + '" aria-label="Favorilere ekle"><i class="fa-' + (favs[x.i] ? 'solid' : 'regular') + ' fa-heart" aria-hidden="true"></i></button></div>';
      }).join('') || '<div class="s-empty"><b>Bu kriterlere uygun ilan yok.</b><button type="button" data-emlak-reset>Filtreleri temizle</button></div>';
      result.textContent = list.length ? list.length + ' ilan listeleniyor' + (f.fav ? ' (favoriler)' : '') : 'Sonuç bulunamadı';
      dealBtns.forEach(function (b) { var on = b.dataset.deal === f.deal; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      favBtn.classList.toggle('is-on', f.fav); favBtn.setAttribute('aria-pressed', f.fav ? 'true' : 'false');
    };
    var readSelects = function () { qsa('[data-q]', root).forEach(function (s) { f[s.dataset.q] = s.value; }); };
    dealBtns.forEach(function (b) { b.addEventListener('click', function () { f.deal = f.deal === b.dataset.deal ? '' : b.dataset.deal; draw(); }); });
    qsa('[data-q]', root).forEach(function (s) { s.addEventListener('change', function () { readSelects(); draw(); }); });
    qs('[data-emlak-go]', root).addEventListener('click', function () { readSelects(); draw(); flash(result); cards.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); });
    favBtn.addEventListener('click', function () { f.fav = !f.fav; draw(); });
    cards.addEventListener('click', function (e) {
      var h = e.target.closest('[data-heart]');
      if (h) {
        var i = +h.dataset.heart;
        favs[i] = !favs[i];
        var n = Object.keys(favs).filter(function (k) { return favs[k]; }).length;
        favCount.textContent = n;
        favBtn.querySelector('i').className = (n ? 'fa-solid' : 'fa-regular') + ' fa-heart';
        flash(favBtn);
        draw();
        var again = qs('[data-heart="' + i + '"]', cards);
        if (again) again.focus();
        return;
      }
      if (e.target.closest('[data-emlak-reset]')) {
        f = { deal: '', loc: '', type: '', room: '', fav: false };
        qsa('[data-q]', root).forEach(function (s) { s.value = ''; });
        draw();
        return;
      }
      var o = e.target.closest('[data-id]');
      if (o) openDetail(L[+o.dataset.id], o);
    });
    var openDetail = function (x, opener) {
      detail.innerHTML = '<div class="s-d"><button type="button" class="s-d__back" data-d-close><i class="fa-solid fa-arrow-left" aria-hidden="true"></i>İlanlara dön</button><div class="s-ph s-d__ph ' + x.ph + '"><span class="s-deal">' + x.deal + '</span></div><div class="s-d__body"><div class="s-d__top"><div><h4>' + esc(x.title) + '</h4><small><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ' + esc(x.loc) + ', İstanbul</small></div><strong>' + price(x) + '</strong></div><ul class="s-d__facts"><li><b>' + x.m2 + ' m²</b><small>Brüt alan</small></li><li><b>' + (x.room || '-') + '</b><small>Oda</small></li><li><b>' + x.floor + '</b><small>Kat</small></li><li><b>' + x.age + '</b><small>Bina yaşı</small></li></ul><p>' + esc(x.note) + '</p><div class="s-d__act"><button type="button" class="s-d__cta" data-d-visit>Yerinde görmek istiyorum</button><span role="status" class="s-d__msg"></span></div></div></div>';
      root.scrollTop = 0;
      root.classList.add('has-detail');
      detail.hidden = false;
      detail._opener = opener;
      var back = qs('[data-d-close]', detail);
      back.focus();
      back.addEventListener('click', closeDetail);
      qs('[data-d-visit]', detail).addEventListener('click', function (e) {
        e.currentTarget.disabled = true;
        e.currentTarget.textContent = 'Talep alındı';
        qs('.s-d__msg', detail).textContent = 'Danışmanımız gün içinde sizi arayacak.';
      });
    };
    var closeDetail = function () {
      detail.hidden = true;
      root.classList.remove('has-detail');
      var o = detail._opener && qs('[data-id="' + detail._opener.dataset.id + '"]', cards);
      if (o) o.focus();
    };
    detail.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); closeDetail(); } });

    /* Telefon görünümü */
    var dev = qs('[data-web-dev]', win);
    dev.addEventListener('click', function () {
      var on = win.classList.toggle('is-phone');
      dev.setAttribute('aria-pressed', on ? 'true' : 'false');
      dev.title = on ? 'Masaüstü görünümü' : 'Telefon görünümü';
      dev.querySelector('i').className = on ? 'fa-solid fa-desktop' : 'fa-solid fa-mobile-screen';
      dev.querySelector('.sr-only').textContent = on ? 'Masaüstü görünümüne geç' : 'Telefon görünümüne geç';
    });
    draw();
  })();

  /* =====================================================================
     3) Ajans Paneli (yönetim paneli)
     ===================================================================== */
  (function () {
    var win = P.wins.panel, root = win && qs('[data-ajans]', win);
    if (!root) return;
    var M = {
      7: { name: 'Temmuz', inc: 151200, incP: '+%4', out: 58900, outP: '+%2', open: 11, late: 1, a: [70, 64, 66, 58, 50, 44], b: [76, 75, 74, 73, 72, 70], months: ['Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem'] },
      8: { name: 'Ağustos', inc: 164800, incP: '+%9', out: 59900, outP: '+%2', open: 12, late: 2, a: [64, 66, 58, 50, 44, 32], b: [75, 74, 73, 72, 70, 68], months: ['Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu'] },
      9: { name: 'Eylül', inc: 184500, incP: '+%12', out: 62300, outP: '+%4', open: 14, late: 3, a: [62, 54, 58, 40, 30, 14], b: [74, 72, 70, 71, 67, 64], months: ['Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl'] }
    };
    var cur = 9, shown = { a: M[9].a.slice(), b: M[9].b.slice() };
    var el = function (k) { return qs('[data-p="' + k + '"]', root); };
    var area = qs('.p-area', root), lineA = qs('.p-line:not(.p-line--b)', root), lineB = qs('.p-line--b', root);
    var path = function (arr) { return arr.map(function (y, i) { return (i ? 'L' : 'M') + (i * 60) + ' ' + y.toFixed(1); }).join(' '); };
    var paint = function () {
      var a = path(shown.a);
      lineA.setAttribute('d', a);
      area.setAttribute('d', a + ' L300 90 L0 90Z');
      lineB.setAttribute('d', path(shown.b));
    };
    paint();
    var tasksEl = qs('[data-p-tasks]', root);
    var TS = [['pill--go', 'Tasarımda'], ['pill--wait', 'Müşteri onayında'], ['pill--ok', 'Onaylandı'], ['pill--low', 'Gecikti']];
    var shownLate = function () { return qsa('[data-ts="3"]', tasksEl).length; };
    var baseLate = M[9].late - shownLate();
    var setLate = function () { el('late').textContent = Math.max(0, baseLate + (M[cur].late - M[9].late) + shownLate()) + ' gecikmede'; };
    var setMonth = function (m) {
      var from = M[cur], to = M[m];
      countTo(el('in'), from.inc, to.inc, tl);
      countTo(el('out'), from.out, to.out, tl);
      countTo(el('open'), from.open, to.open);
      el('inc').textContent = to.incP; el('outc').textContent = to.outP;
      cur = m;
      setLate();
      qs('[data-p-title]', root).textContent = to.name + ' özeti';
      qs('[data-p-months]', root).innerHTML = to.months.map(function (x) { return '<span>' + x + '</span>'; }).join('');
      qsa('[data-m]', root).forEach(function (b) { var on = +b.dataset.m === m; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      var sa = shown.a.slice(), sb = shown.b.slice();
      if (reduce) { shown.a = to.a.slice(); shown.b = to.b.slice(); paint(); return; }
      var t0 = null;
      var step = function (t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - k, 3);
        shown.a = sa.map(function (v, i) { return v + (to.a[i] - v) * e; });
        shown.b = sb.map(function (v, i) { return v + (to.b[i] - v) * e; });
        paint();
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    qsa('[data-m]', root).forEach(function (b) { b.addEventListener('click', function () { if (+b.dataset.m !== cur) setMonth(+b.dataset.m); }); });
    tasksEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ts]');
      if (!b) return;
      var n = (+b.dataset.ts + 1) % TS.length;
      b.dataset.ts = n;
      b.className = 'pill ' + TS[n][0];
      b.textContent = TS[n][1];
      flash(b.parentNode);
      setLate();
      flash(el('late').parentNode);
    });

    var projects = [
      ['Kurumsal kimlik', 'Ada Yapı', 72, '18 Ekim', 'Selin K.'], ['Sosyal medya yönetimi', 'Mavi Kafe', 90, '30 Eylül', 'Can D.'],
      ['Tanıtım filmi', 'Nova Spor', 45, '10 Ekim', 'Mert A.'], ['Web sitesi yenileme', 'Lale Pastanesi', 30, '5 Kasım', 'Deniz Y.'],
      ['Katalog tasarımı', 'Ege Mobilya', 15, '20 Kasım', 'Selin K.']
    ];
    var team = [['Selin K.', 'Yönetici', 80, 2], ['Can D.', 'Sosyal medya', 65, 3], ['Mert A.', 'Video', 95, 2], ['Deniz Y.', 'Web tasarım', 50, 1]];
    var invoices = [['#2024', 'Ada Yapı', 42000, false], ['#2023', 'Mavi Kafe', 18500, true], ['#2022', 'Nova Spor', 36000, false], ['#2021', 'Lale Pastanesi', 12400, true]];
    var views = {
      projeler: function (p) {
        p.innerHTML = '<div class="p-head"><strong>Projeler</strong><span class="p-user">' + projects.length + ' aktif proje</span></div><div class="p-list">' + projects.map(function (r) {
          return '<div class="p-li"><div class="p-li__t"><b>' + esc(r[0]) + '</b><small>' + esc(r[1]) + ', sorumlu ' + esc(r[4]) + '</small></div><div class="p-prog"><i style="width:' + r[2] + '%"></i></div><small class="p-li__d">%' + r[2] + ', teslim ' + r[3] + '</small></div>';
        }).join('') + '</div>';
      },
      finans: function (p) {
        var m = M[cur];
        var rows = [['Ada Yapı, kurumsal kimlik', 42000], ['Mavi Kafe, aylık sosyal medya', 18500], ['Ofis kirası', -24000], ['Yazılım abonelikleri', -6300], ['Nova Spor, tanıtım filmi (1. hakediş)', 36000], ['Personel avansları', -12000]];
        p.innerHTML = '<div class="p-head"><strong>Finans, ' + m.name + '</strong><span class="p-user">Net ' + tl(m.inc - m.out) + '</span></div><div class="p-kpis"><div><small>Gelir</small><b>' + tl(m.inc) + '</b><span class="up">' + m.incP + '</span></div><div><small>Gider</small><b>' + tl(m.out) + '</b><span class="dn">' + m.outP + '</span></div><div><small>Kâr marjı</small><b>%' + Math.round((m.inc - m.out) / m.inc * 100) + '</b><span>bu ay</span></div></div><p class="p-sub">Son hareketler</p><div class="p-list">' +
          rows.map(function (r) { return '<div class="p-li p-li--row"><span>' + esc(r[0]) + '</span><b class="' + (r[1] > 0 ? 'up' : 'dn') + '">' + (r[1] > 0 ? '+' : '−') + tl(Math.abs(r[1])) + '</b></div>'; }).join('') + '</div>';
      },
      ekip: function (p) {
        p.innerHTML = '<div class="p-head"><strong>Ekip</strong><span class="p-user">4 kişi</span></div><div class="p-team">' + team.map(function (t) {
          return '<div class="p-mem"><em>' + t[0].split(' ').map(function (w) { return w.charAt(0); }).join('') + '</em><div><b>' + esc(t[0]) + '</b><small>' + esc(t[1]) + ', ' + t[3] + ' proje</small><div class="p-prog' + (t[2] > 90 ? ' is-hot' : '') + '"><i style="width:' + t[2] + '%"></i></div><small>Doluluk %' + t[2] + (t[2] > 90 ? ', yeni iş verilmemeli' : '') + '</small></div></div>';
        }).join('') + '</div>';
      },
      faturalar: function (p) {
        var draw = function () {
          var open = invoices.filter(function (i) { return !i[3]; }).reduce(function (a, i) { return a + i[2]; }, 0);
          p.innerHTML = '<div class="p-head"><strong>Faturalar</strong><span class="p-user">Tahsil edilecek: <b class="p-due">' + tl(open) + '</b></span></div><div class="p-list">' + invoices.map(function (i, k) {
            return '<div class="p-li p-li--row"><span><b>' + i[0] + '</b> ' + esc(i[1]) + '</span><span class="p-inv"><b>' + tl(i[2]) + '</b><button type="button" class="pill ' + (i[3] ? 'pill--ok' : 'pill--wait') + '" data-inv="' + k + '" aria-pressed="' + i[3] + '">' + (i[3] ? 'Ödendi' : 'Bekliyor') + '</button></span></div>';
          }).join('') + '</div><p class="p-sub">Durum etiketine tıklayarak ödemeyi işaretleyin.</p>';
        };
        if (!p._bound) {
          p.addEventListener('click', function (e) {
            var b = e.target.closest('[data-inv]');
            if (!b) return;
            invoices[+b.dataset.inv][3] = !invoices[+b.dataset.inv][3];
            var k = b.dataset.inv;
            draw();
            var nb = qs('[data-inv="' + k + '"]', p);
            if (nb) { nb.focus(); flash(nb.closest('.p-li')); }
            flash(qs('.p-due', p));
          });
          p._bound = true;
        }
        draw();
      }
    };
    tabs(root, 'data-pv', 'data-pv-panel', function (k, p) { if (views[k]) views[k](p); });
  })();

  /* =====================================================================
     4) StokSenkron konsolu: gerçekten komut yazılabilir
     ===================================================================== */
  (function () {
    var win = P.wins.term, body = win && qs('[data-term]', win);
    if (!body) return;
    var input = qs('[data-term-in]', body), inLine = input.closest('.t-in');
    var hist = [], hi = 0, busy = false;
    var PROMPT = 'PS C:\\Projeler\\StokSenkron&gt; ';
    var print = function (html, cls) {
      var d = document.createElement('div');
      d.className = 't-line t-m' + (cls ? ' ' + cls : '');
      d.innerHTML = html;
      body.insertBefore(d, inLine);
      body.scrollTop = body.scrollHeight;
      return d;
    };
    var later = function (lines, gap, done) {
      busy = true; inLine.classList.add('is-busy');
      var i = 0;
      var next = function () {
        if (i >= lines.length) { busy = false; inLine.classList.remove('is-busy'); input.focus({ preventScroll: true }); if (done) done(); return; }
        var l = lines[i++];
        print(l[0], l[1]);
        setTimeout(next, reduce ? 0 : (l[2] || gap));
      };
      next();
    };
    var clock = function (add) { var d = new Date(Date.now() + (add || 0) * 1000); return '[' + d.toLocaleTimeString('tr-TR') + ']'; };
    var C = {
      yardim: function () {
        print('Kullanılabilir komutlar:');
        [['dotnet run', 'Stok senkronizasyonunu yeniden çalıştırır'], ['stok', 'Kritik seviyedeki ürünleri listeler'], ['rapor', 'Günlük özet raporu gösterir'], ['dir', 'Proje klasöründeki dosyaları listeler'], ['type Program.cs', 'Uygulamanın giriş noktasını gösterir'], ['hizmetler', 'Geliştirdiğim uygulama türleri'], ['iletisim', 'Teklif formuna geçer'], ['tarih', 'Tarih ve saati yazar'], ['sirlar', 'Sitedeki gizli sürprizler hakkında ipucu'], ['cls', 'Ekranı temizler'], ['exit', 'Konsolu kapatır']]
          .forEach(function (c) { print('  <y>' + (c[0] + '                 ').slice(0, 17) + '</y>' + c[1]); });
      },
      run: function () {
        var n = 240 + Math.floor(Math.random() * 20), ch = 4 + Math.floor(Math.random() * 12);
        later([
          [clock(0) + ' Veritabanına bağlanılıyor... <g>tamam</g>', '', 380],
          [clock(1) + ' ' + n + ' ürün okundu', '', 320],
          [clock(2) + ' Fiyatlar karşılaştırılıyor... <y>' + ch + ' değişiklik</y>', '', 420],
          [clock(3) + ' E-ticaret sitesine aktarılıyor <g>████████████</g> 100%', '', 360],
          [clock(4) + ' <y>Uyarı:</y> 3 üründe stok kritik seviyede (ayrıntı için: stok)', '', 300],
          [clock(5) + ' Rapor e-posta ile gönderildi. <g>İşlem tamamlandı.</g>', '', 0]
        ], 300);
      },
      stok: function () {
        print('Kod       Ürün                         Stok   En az', 't-head');
        print('LST-205   Kış lastiği 205/55 R16          <r>3</r>       8');
        print('AKU-072   Akü 72 Ah                       <r>2</r>       5');
        print('ZNC-001   Patinaj zinciri                 <r>1</r>       4');
        print('<g>Tedarikçiye sipariş taslağı hazırlandı:</g> siparis-taslak.xlsx');
      },
      rapor: function () {
        print('Günlük özet (' + new Date().toLocaleDateString('tr-TR') + ')', 't-head');
        print('  Satış adedi        : 37');
        print('  Ciro               : ₺48.920');
        print('  Güncellenen fiyat  : 12');
        print('  Kritik stok        : <y>3 ürün</y>');
        print('  Son senkronizasyon : ' + clock().slice(1, -1));
      },
      dir: function () {
        print('    Dizin: C:\\Projeler\\StokSenkron');
        print('Mode   LastWriteTime        Length Name', 't-head');
        print('-a---  ' + new Date().toLocaleDateString('tr-TR') + ' 09:00    2.418 Program.cs');
        print('-a---  ' + new Date().toLocaleDateString('tr-TR') + ' 09:00      612 appsettings.json');
        print('-a---  ' + new Date().toLocaleDateString('tr-TR') + ' 09:00   18.204 rapor-gunluk.xlsx');
      },
      type: function (arg) {
        if (trLower(arg) !== 'program.cs') { print('<r>Dosya bulunamadı: ' + esc(arg || '') + '</r>  Örnek: type Program.cs'); return; }
        ['<c>var</c> builder = Host.CreateApplicationBuilder(args);', 'builder.Services.AddDbContext&lt;StokDb&gt;();', 'builder.Services.AddHostedService&lt;SenkronServisi&gt;();', '', '<c>using var</c> app = builder.Build();', '<c>await</c> app.RunAsync(); <d>// her sabah 09:00\'da çalışır</d>']
          .forEach(function (l) { print(l || ' ', 't-code'); });
      },
      hizmetler: function () {
        ['Masaüstü uygulamaları (WinForms, WPF)', 'Kurumsal web siteleri', 'Web tabanlı yönetim panelleri', 'Konsol uygulamaları ve zamanlanmış işler', 'API ve sistem entegrasyonları', 'Chrome tarayıcı eklentileri']
          .forEach(function (s, i) { print('  ' + (i + 1) + '. ' + s); });
        print('Ayrıntı için <u>iletisim</u> yazın.');
      },
      iletisim: function () {
        print('E-posta: <u>info@kapukaya.dev</u>');
        print('<g>Teklif formuna yönlendiriliyorsunuz...</g>');
        goContact(700);
      },
      tarih: function () { var d = new Date(); print(d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' ' + d.toLocaleTimeString('tr-TR')); },
      whoami: function () { print('kapukaya\\furkan  (Yazılım geliştirici, İstanbul)'); },
      cls: function () { qsa('.t-line:not(.t-in)', body).forEach(function (l) { l.remove(); }); },
      exit: function () { P.close('term'); },
      sudo: function () { print('Bu bir Windows makinesi. Yine de yetkiniz tam: yeni bir proje için <u>iletisim</u> yazın.'); },
      furkan: function () {
        later([
          ['<y>Gizli komut bulundu.</y>', '', 260],
          ['  ███████╗██╗  ██╗', 't-code', 60],
          ['  ██╔════╝██║ ██╔╝', 't-code', 60],
          ['  █████╗  █████╔╝ ', 't-code', 60],
          ['  ██╔══╝  ██╔═██╗ ', 't-code', 60],
          ['  ██║     ██║  ██╗', 't-code', 60],
          ['Merhaba, ben Furkan. Bu konsolu siz bulasınız diye yazdım. <g>Rozet kazanıldı.</g>', '', 0]
        ], 120, function () { document.dispatchEvent(new CustomEvent('fk:secret', { detail: 'konsol' })); });
      },
      sirlar: function () {
        var n = window.FKFun ? window.FKFun.count() : 0, t = window.FKFun ? window.FKFun.total : 8;
        print('Bu sitede ' + t + ' gizli sürpriz var. Bulunan: <y>' + n + '</y>.');
        print('İpucu: Bu konsolda bile bir tanesi saklı. Komut, sitenin sahibinin adı.');
        if (window.FKFun) print('Tüm ipuçları için sayfanın en altındaki <u>sihirli değnek</u> satırına tıklayın.');
      }
    };
    var alias = { help: 'yardim', '?': 'yardim', yardim: 'yardim', run: 'run', 'dotnet': 'run', senkron: 'run', stok: 'stok', rapor: 'rapor', dir: 'dir', ls: 'dir', type: 'type', cat: 'type', hizmetler: 'hizmetler', iletisim: 'iletisim', teklif: 'iletisim', contact: 'iletisim', tarih: 'tarih', date: 'tarih', whoami: 'whoami', cls: 'cls', clear: 'cls', temizle: 'cls', exit: 'exit', cikis: 'exit', sudo: 'sudo', furkan: 'furkan', sirlar: 'sirlar', surpriz: 'sirlar', gizli: 'sirlar' };
    var exec = function (raw) {
      var cmd = raw.trim();
      print(PROMPT + '<u>' + esc(cmd) + '</u>', 't-p');
      win.classList.remove('is-fresh');
      if (!cmd) return;
      hist.push(cmd); hi = hist.length;
      var parts = cmd.split(/\s+/), head = trLower(parts[0]), arg = parts.slice(1).join(' ');
      if (head === 'dotnet' && trLower(arg) !== 'run') { print('Kullanım: dotnet run'); return; }
      var k = alias[head];
      if (k) C[k](arg);
      else print('<r>' + esc(parts[0]) + ' : \'' + esc(parts[0]) + '\' terimi bir komut olarak tanınmadı.</r> Komutları görmek için <u>yardim</u> yazın.');
    };
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); if (busy) return; var v = input.value; input.value = ''; exec(v); }
      else if (e.key === 'ArrowUp') { if (hist.length) { e.preventDefault(); hi = Math.max(0, hi - 1); input.value = hist[hi]; } }
      else if (e.key === 'ArrowDown') { if (hist.length) { e.preventDefault(); hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ''; } }
      else if (e.key === 'Tab') {
        var v2 = trLower(input.value.trim());
        if (!v2) return;
        var m = Object.keys(alias).concat(['dotnet run', 'type Program.cs']).filter(function (a) { return a.indexOf(v2) === 0; });
        if (m.length) { e.preventDefault(); input.value = m.sort(function (a, b) { return a.length - b.length; })[0]; }
      }
      else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); C.cls(); }
    });
    body.addEventListener('click', function () { if (!String(window.getSelection())) input.focus({ preventScroll: true }); });
  })();

  /* =====================================================================
     5) Chrome eklentileri: her eklentiye küçük bir deneme
     ===================================================================== */
  (function () {
    var win = P.wins.ext;
    if (!win) return;
    var demos = {
      vol: function (d) {
        var bands = ['60', '230', '910', '3,6k', '14k'];
        d.innerHTML = '<div class="xd-vol"><div class="xd-vol__top"><span>Ses seviyesi</span><b data-pct>250%</b></div><input type="range" min="0" max="600" step="10" value="250" data-vol aria-label="Ses seviyesi"><div class="xd-vis" aria-hidden="true">' + new Array(24).join('<i></i>') + '<i></i></div></div><div class="xd-eq" role="group" aria-label="Ekolayzır">' +
          bands.map(function (b, i) { return '<label><input type="range" min="-12" max="12" value="0" data-band="' + i + '" aria-label="' + b + ' Hz"><span>' + b + '</span></label>'; }).join('') +
          '</div><div class="xd-pre" role="group" aria-label="Hazır ayarlar"><button type="button" data-pre="0,0,0,0,0" class="is-on">Düz</button><button type="button" data-pre="9,6,0,-2,-3">Bas güçlendirme</button><button type="button" data-pre="-4,-1,5,7,3">Konuşma</button></div><p class="xd-note">Eklentide bu ayarlar o sekmede çalan sese anında uygulanır.</p>';
        var vol = qs('[data-vol]', d), pct = qs('[data-pct]', d), bars = qsa('.xd-vis i', d), eq = qsa('[data-band]', d);
        var level = function () { return +vol.value / 600; };
        var draw = function (t) {
          var g = eq.map(function (e) { return (+e.value + 12) / 24; });
          bars.forEach(function (b, i) {
            var band = g[Math.min(4, Math.floor(i / bars.length * 5))];
            var wave = reduce ? .6 : (.45 + .55 * Math.abs(Math.sin(t / 260 + i * .7) * Math.cos(t / 410 + i * .33)));
            b.style.transform = 'scaleY(' + Math.max(.06, Math.min(1, wave * (.25 + level() * 1.1) * (.4 + band * 1.2))).toFixed(3) + ')';
          });
        };
        var raf = null;
        var loop = function (t) { draw(t); if (!d.hidden && !win.hidden) raf = requestAnimationFrame(loop); else raf = null; };
        d._start = function () { if (!raf) raf = requestAnimationFrame(loop); };
        vol.addEventListener('input', function () { pct.textContent = vol.value + '%'; pct.classList.toggle('is-hot', +vol.value > 400); if (reduce) draw(0); });
        eq.forEach(function (e) { e.addEventListener('input', function () { qsa('[data-pre]', d).forEach(function (b) { b.classList.remove('is-on'); }); if (reduce) draw(0); }); });
        qsa('[data-pre]', d).forEach(function (b) {
          b.addEventListener('click', function () {
            var v = b.dataset.pre.split(',');
            eq.forEach(function (e, i) { e.value = v[i]; });
            qsa('[data-pre]', d).forEach(function (x) { x.classList.toggle('is-on', x === b); });
            if (reduce) draw(0);
          });
        });
        draw(0);
      },
      asset: function (d) {
        var cols = ['#FFD970', '#1F1F1F', '#2E8B74', '#F5F5F5'];
        d.innerHTML = '<p class="xd-sub">Bu sayfada bulunanlar: 4 renk, 3 görsel, 2 yazı tipi</p><div class="xd-sw" role="group" aria-label="Renkler">' +
          cols.map(function (c) { return '<button type="button" data-hex="' + c + '" title="Kopyala"><i style="background:' + c + '"></i><span>' + c + '</span></button>'; }).join('') +
          '</div><div class="xd-imgs"><span class="ph1"><small>hero.webp, 1600×900</small></span><span class="ph2"><small>logo.svg</small></span><span class="ph3"><small>kapak.jpg, 1200×630</small></span></div><div class="xd-fonts"><span style="font-family:var(--k-font)">Poppins <small>300, 500</small></span><span style="font-family:ui-monospace,Consolas,monospace">Cascadia Mono <small>400</small></span></div><div class="xd-row"><button type="button" class="xd-btn" data-zip>Tümünü ZIP olarak indir</button><span class="xd-msg" role="status"></span></div>';
        var msg = qs('.xd-msg', d);
        qsa('[data-hex]', d).forEach(function (b) {
          b.addEventListener('click', function () {
            var hex = b.dataset.hex;
            var ok = function () { msg.textContent = hex + ' panoya kopyalandı'; flash(b); };
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(hex).then(ok, function () { msg.textContent = 'Renk kodu: ' + hex; });
            else msg.textContent = 'Renk kodu: ' + hex;
          });
        });
        qs('[data-zip]', d).addEventListener('click', function () { msg.textContent = 'Eklentide 9 dosya tek ZIP olarak iner. Bu bir örnektir.'; });
      },
      copy: function (d) {
        d.innerHTML = '<div class="xd-row"><label class="xd-switch"><input type="checkbox" data-unlock><span aria-hidden="true"></span>Copy Unlocker</label><span class="xd-state" data-state role="status">Kapalı: bu sayfa kopyalamayı engelliyor</span></div><blockquote class="xd-lock" data-lock>Bu paragraf, kopyalamayı ve sağ tıklamayı engelleyen bir sayfadan alınmış örnek bir metindir. Seçmeyi veya kopyalamayı deneyin; ardından eklentiyi açıp tekrar deneyin.</blockquote>';
        var box = qs('[data-unlock]', d), lock = qs('[data-lock]', d), st = qs('[data-state]', d);
        var blocked = function (e) {
          if (box.checked) return;
          e.preventDefault();
          st.textContent = 'Engellendi: site kopyalamaya ve sağ tıklamaya izin vermiyor';
          flash(lock, 'is-deny');
        };
        ['copy', 'cut', 'contextmenu', 'selectstart', 'dragstart'].forEach(function (ev) { lock.addEventListener(ev, blocked); });
        lock.addEventListener('copy', function () { if (box.checked) st.textContent = 'Kopyalandı. Eklenti sayfanın engelini kaldırdı.'; });
        box.addEventListener('change', function () {
          lock.classList.toggle('is-free', box.checked);
          st.textContent = box.checked ? 'Açık: metni seçip kopyalayabilirsiniz' : 'Kapalı: bu sayfa kopyalamayı engelliyor';
        });
      },
      social: function (d) {
        d.innerHTML = '<div class="xd-plat" role="group" aria-label="Platform"><button type="button" class="is-on" data-plat="X">X</button><button type="button" data-plat="Instagram">Instagram</button><button type="button" data-plat="TikTok">TikTok</button><button type="button" data-plat="YouTube">YouTube</button></div><div class="xd-row xd-row--in"><label class="sr-only" for="xd-handle">Kullanıcı adı</label><input id="xd-handle" type="text" value="@kapukayadev" spellcheck="false" autocomplete="off"><button type="button" class="xd-btn" data-an>Analiz et</button></div><div class="xd-out" data-out aria-live="polite"></div>';
        var plat = 'X', out = qs('[data-out]', d), inp = qs('#xd-handle', d);
        var hash = function (s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
        var run = function () {
          var name = inp.value.trim() || '@kullanici';
          if (name.charAt(0) !== '@') name = '@' + name;
          var h = hash(plat + name.toLowerCase()), r = function (n) { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; return h % n; };
          var fol = 800 + r(48000), eng = (1.2 + r(70) / 10).toFixed(1), hour = 9 + r(13);
          var pts = []; for (var i = 0; i < 12; i++) pts.push(10 + r(30));
          var d2 = pts.map(function (y, i) { return (i ? 'L' : 'M') + (i * 20) + ' ' + (44 - y); }).join(' ');
          out.innerHTML = '<div class="xd-stats"><div><small>Takipçi</small><b>' + fol.toLocaleString('tr-TR') + '</b></div><div><small>Etkileşim</small><b>%' + eng.replace('.', ',') + '</b></div><div><small>En iyi saat</small><b>' + hour + ':00</b></div></div><svg viewBox="0 0 220 46" preserveAspectRatio="none" aria-hidden="true"><path d="' + d2 + '" fill="none" stroke="hsl(340,60%,52%)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><p class="xd-note">' + esc(name) + ', ' + plat + ' için son 12 gönderi. Değerler örnek amaçlı üretilmiştir.</p>';
        };
        qsa('[data-plat]', d).forEach(function (b) { b.addEventListener('click', function () { plat = b.dataset.plat; qsa('[data-plat]', d).forEach(function (x) { x.classList.toggle('is-on', x === b); }); run(); }); });
        qs('[data-an]', d).addEventListener('click', run);
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); run(); } });
        run();
      }
    };
    win.addEventListener('click', function (e) {
      var b = e.target.closest('[data-xtry]');
      if (!b) return;
      var k = b.dataset.xtry, d = qs('[data-xdemo="' + k + '"]', win);
      var open = d.hidden;
      qsa('[data-xdemo]', win).forEach(function (x) { x.hidden = true; });
      qsa('[data-xtry]', win).forEach(function (x) { x.setAttribute('aria-expanded', 'false'); x.textContent = 'Dene'; });
      if (open) {
        if (!d._built) { demos[k](d); d._built = true; }
        d.hidden = false;
        b.setAttribute('aria-expanded', 'true');
        b.textContent = 'Kapat';
        if (d._start) d._start();
        d.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      }
    });
  })();

  /* =====================================================================
     6) Proje notu: yazılabilir, Ctrl+S ile teklif formuna aktarılır
     ===================================================================== */
  (function () {
    var win = P.wins.note;
    if (!win) return;
    var ta = qs('[data-note-text]', win), title = qs('[data-note-title]', win);
    var pos = qs('[data-note-pos]', win), len = qs('[data-note-len]', win);
    var menuBtn = qs('[data-note-menu]', win), drop = qs('.n-drop', win);
    var TEMPLATE = ta.value, dirty = false;
    var update = function () {
      var v = ta.value, before = v.slice(0, ta.selectionStart), lines = before.split('\n');
      pos.textContent = 'Satır ' + lines.length + ', Sütun ' + (lines[lines.length - 1].length + 1);
      len.textContent = v.length + ' karakter';
    };
    var setDirty = function (on) { dirty = on; title.textContent = (on ? '*' : '') + 'Proje notu.txt'; };
    ta.addEventListener('input', function () { setDirty(true); update(); });
    ['keyup', 'click', 'focus', 'select'].forEach(function (ev) { ta.addEventListener(ev, update); });
    update();
    var closeMenu = function () { drop.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); };
    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var show = drop.hidden;
      drop.hidden = !show;
      menuBtn.setAttribute('aria-expanded', show ? 'true' : 'false');
      if (show) qs('button', drop).focus();
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.n-dd')) closeMenu(); });
    drop.addEventListener('keydown', function (e) {
      var items = qsa('button', drop), i = items.indexOf(document.activeElement);
      if (e.key === 'Escape') { closeMenu(); menuBtn.focus(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    });
    var firstBlank = function () {
      var i = ta.value.indexOf('- \n');
      if (i === -1 && /- $/.test(ta.value)) i = ta.value.length - 2;
      return i;
    };
    var save = function () {
      closeMenu();
      var v = ta.value.trim();
      var answered = v.split('\n').filter(function (l) { return /^-\s*\S/.test(l); }).length;
      if (!v || (v === TEMPLATE.trim()) || (/^- *$/m.test(ta.value) && !answered)) {
        statusMsg(pos, 'Önce soruların altındaki “-” satırlarına kısa cevaplar yazın', 3500);
        var i = firstBlank();
        ta.focus();
        if (i > -1) ta.setSelectionRange(i + 2, i + 2);
        return;
      }
      var form = document.querySelector('[data-contact-form]');
      var msg = form && form.querySelector('#f-mesaj');
      if (!msg) return;
      var text = v.replace(/^Aklınızdaki projeyi anlatmak için şu üç sorunun cevabı yeterli:\s*/, '');
      msg.value = msg.value.trim() ? msg.value.trim() + '\n\n' + text : text;
      msg.dispatchEvent(new Event('input', { bubbles: true }));
      setDirty(false);
      statusMsg(pos, 'Kaydedildi ve teklif formuna aktarıldı', 3500);
      if (form._goStep) form._goStep(form.querySelector('input[name="project_type"]:checked') ? 1 : 0);
      form.classList.remove('is-filled'); void form.offsetWidth; form.classList.add('is-filled');
      goContact(250);
    };
    qsa('[data-note-save]', win).forEach(function (b) { b.addEventListener('click', save); });
    qs('[data-note-reset]', win).addEventListener('click', function () { ta.value = TEMPLATE; setDirty(false); update(); closeMenu(); ta.focus(); });
    qs('[data-note-clear]', win).addEventListener('click', function () { ta.value = ''; setDirty(true); update(); closeMenu(); ta.focus(); });
    ta.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); save(); } });
    win.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S') && e.target !== ta) { e.preventDefault(); save(); } });
    P._note = { focus: function () { ta.focus(); var i = firstBlank(); if (i > -1) ta.setSelectionRange(i + 2, i + 2); }, dirty: function () { return dirty; } };
  })();

  /* =====================================================================
     7) Geri Dönüşüm Kutusu
     ===================================================================== */
  (function () {
    var win = P.wins.bin;
    if (!win) return;
    var list = qs('[data-bin-list]', win), note = qs('[data-bin-note]', win), count = qs('[data-bin-count]', win);
    var ORIG = list.innerHTML, NOTE = note.textContent;
    var refresh = function () {
      var n = qsa('li', list).length;
      count.textContent = n + ' öğe';
      win.classList.toggle('is-empty', !n);
      qsa('.pc-ico__img--bin', P.root).forEach(function (i) { i.classList.toggle('is-empty', !n); });
    };
    list.addEventListener('click', function (e) {
      var b = e.target.closest('[data-bin-item]');
      if (!b) return;
      var on = b.getAttribute('aria-pressed') !== 'true';
      qsa('[data-bin-item]', list).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    list.addEventListener('dblclick', function (e) { if (e.target.closest('[data-bin-item]')) qs('[data-bin-restore]', win).click(); });
    qs('[data-bin-restore]', win).addEventListener('click', function () {
      var sel = qs('[aria-pressed="true"]', list);
      if (!sel) { note.textContent = 'Geri yüklemek için önce bir dosya seçin.'; flash(note); return; }
      note.textContent = 'Geri yüklemeye gerek yok: “' + qs('span', sel).textContent + '” içindeki bilgiler yeni sistemde güvende ve her gece yedekleniyor.';
      flash(note);
    });
    qs('[data-bin-empty]', win).addEventListener('click', function () {
      var items = qsa('li', list);
      if (!items.length) return;
      items.forEach(function (li, i) { li.style.animationDelay = (i * 60) + 'ms'; li.classList.add('is-out'); });
      setTimeout(function () {
        list.innerHTML = '';
        note.textContent = 'Geri Dönüşüm Kutusu boş. Dağınık Excel dosyalarına veda ettiniz.';
        refresh();
        document.dispatchEvent(new CustomEvent('fk:secret', { detail: 'bin' }));
      }, reduce ? 0 : 420 + items.length * 60);
    });
    P._binReset = function () { list.innerHTML = ORIG; note.textContent = NOTE; refresh(); };
    refresh();
  })();

  /* =====================================================================
     8) Masaüstü ekleri
     ===================================================================== */
  var screen = P.screen, desktop = P.desktop, root = P.root;
  var NAMES = {};
  qsa('[data-task]', root).forEach(function (t) { NAMES[t.dataset.task] = { name: t.getAttribute('title'), full: t.getAttribute('aria-label'), icon: qs('.pc-ico__img', t).outerHTML }; });
  var openKeys = function () { return Object.keys(P.wins).filter(function (k) { return P.isOpen(k) || P.wins[k].classList.contains('is-min'); }); };
  var closeAll = function () { Object.keys(P.wins).forEach(function (k) { if (P.isOpen(k) || P.wins[k].classList.contains('is-min')) { P.wins[k].classList.remove('is-min'); P.close(k); } }); };

  /* Sağ tık menüsü */
  var ctx = qs('[data-pc-ctx]', root);
  var walls = 3, wall = 0;
  var hideCtx = function () { if (!ctx.hidden) ctx.hidden = true; };
  var showCtx = function (x, y) {
    var r = screen.getBoundingClientRect();
    ctx.hidden = false;
    ctx._y = window.scrollY;
    var w = ctx.offsetWidth, h = ctx.offsetHeight;
    ctx.style.left = Math.min(Math.max(4, x - r.left), r.width - w - 6) + 'px';
    ctx.style.top = Math.min(Math.max(4, y - r.top), r.height - h - 52) + 'px';
    qs('button', ctx).focus({ preventScroll: true });
  };
  desktop.addEventListener('contextmenu', function (e) {
    if (e.target.closest('[data-win], .pc-ctx')) return;
    e.preventDefault();
    P.closeStart();
    showCtx(e.clientX, e.clientY);
  });
  desktop.addEventListener('keydown', function (e) {
    if ((e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) && !e.target.closest('[data-win]')) {
      e.preventDefault();
      var r = (e.target.getBoundingClientRect ? e.target : desktop).getBoundingClientRect();
      showCtx(r.left + 20, r.top + 20);
    }
  });
  ctx.addEventListener('keydown', function (e) {
    var items = qsa('button', ctx), i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); hideCtx(); }
  });
  ctx.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ctx]');
    if (!b) return;
    var a = b.dataset.ctx;
    hideCtx();
    if (a === 'refresh') { flash(qs('.pc__icons', root), 'is-refresh'); }
    else if (a === 'wall') { wall = (wall + 1) % walls; desktop.setAttribute('data-wall', wall); }
    else if (a === 'note') { P.open('note', true); if (P._note) setTimeout(P._note.focus, 60); }
    else if (a === 'closeall') closeAll();
    else if (a === 'offer') goContact(0);
  });
  document.addEventListener('pointerdown', function (e) { if (!e.target.closest('.pc-ctx')) hideCtx(); });
  window.addEventListener('scroll', function () { if (!ctx.hidden && Math.abs(window.scrollY - (ctx._y || 0)) > 60) hideCtx(); }, { passive: true });
  window.addEventListener('resize', hideCtx);

  /* Seçim kutusu (fareyle masaüstünde sürükleme) */
  var selBox = qs('[data-pc-sel]', root), sel = null;
  var icons = qsa('.pc__icons .pc-ico', root);
  var clearSel = function () { icons.forEach(function (i) { i.classList.remove('is-selected'); }); };
  desktop.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || e.pointerType !== 'mouse' || P.narrow()) return;
    if (e.target.closest('[data-win], .pc-ico, .pc-ctx, .pc-toast, .pc-switch, .pc-off, .pc-startmenu')) return;
    var r = desktop.getBoundingClientRect();
    sel = { x: e.clientX - r.left, y: e.clientY - r.top, r: r, moved: false };
    clearSel();
    e.preventDefault();
    desktop.setPointerCapture(e.pointerId);
  });
  desktop.addEventListener('pointermove', function (e) {
    if (!sel) return;
    var x = Math.min(Math.max(e.clientX - sel.r.left, 0), sel.r.width), y = Math.min(Math.max(e.clientY - sel.r.top, 0), sel.r.height);
    var l = Math.min(x, sel.x), t = Math.min(y, sel.y), w = Math.abs(x - sel.x), h = Math.abs(y - sel.y);
    if (!sel.moved && w + h < 6) return;
    sel.moved = true;
    selBox.hidden = false;
    selBox.style.cssText = 'left:' + l + 'px;top:' + t + 'px;width:' + w + 'px;height:' + h + 'px';
    icons.forEach(function (ic) {
      var b = ic.getBoundingClientRect(), bl = b.left - sel.r.left, bt = b.top - sel.r.top;
      ic.classList.toggle('is-selected', bl < l + w && bl + b.width > l && bt < t + h && bt + b.height > t);
    });
  });
  var endSel = function () { if (sel) { sel = null; selBox.hidden = true; } };
  desktop.addEventListener('pointerup', endSel);
  desktop.addEventListener('pointercancel', endSel);
  icons.forEach(function (ic) { ic.addEventListener('click', function () { clearSel(); }); });

  /* Görev görünümü ve Alt+Tab */
  var sw = qs('[data-pc-switch]', root), swList = qs('[data-pc-switch-list]', root), tvBtn = qs('[data-pc-tv]', root);
  var swKeys = [], swSel = 0, altMode = false, hover = false;
  root.addEventListener('pointerenter', function () { hover = true; });
  root.addEventListener('pointerleave', function () { hover = false; });
  var swDraw = function () {
    qsa('.pc-sw', swList).forEach(function (b, i) { b.classList.toggle('is-sel', i === swSel); });
    var cur = qsa('.pc-sw', swList)[swSel];
    if (cur && !altMode) cur.focus({ preventScroll: true });
  };
  var swOpen = function (alt) {
    P.closeStart(); hideCtx();
    var open = openKeys();
    var topK = P.top();
    open.sort(function (a, b) { return (+P.wins[b].style.zIndex || 0) - (+P.wins[a].style.zIndex || 0); });
    if (topK) open = [topK].concat(open.filter(function (k) { return k !== topK; }));
    swKeys = open.length ? open : Object.keys(NAMES);
    qs('p', sw).textContent = open.length ? 'Açık pencereler' : 'Açık pencere yok. Bir uygulama seçin';
    swList.innerHTML = swKeys.map(function (k) {
      var n = NAMES[k] || { name: k, icon: '' };
      return '<button type="button" class="pc-sw" data-sw="' + k + '">' + n.icon + '<span>' + esc(n.name) + '</span>' + (P.wins[k] && P.wins[k].classList.contains('is-min') ? '<small>Simge durumunda</small>' : '') + '</button>';
    }).join('');
    swSel = alt && open.length > 1 ? 1 : 0;
    altMode = !!alt;
    sw.hidden = false;
    tvBtn.setAttribute('aria-expanded', 'true');
    swDraw();
  };
  var swClose = function (pick) {
    if (sw.hidden) return;
    sw.hidden = true;
    altMode = false;
    tvBtn.setAttribute('aria-expanded', 'false');
    if (pick && swKeys[swSel]) P.open(swKeys[swSel], true);
  };
  tvBtn.setAttribute('aria-expanded', 'false');
  tvBtn.addEventListener('click', function (e) { e.stopPropagation(); if (sw.hidden) swOpen(false); else swClose(false); });
  swList.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sw]');
    if (!b) return;
    swSel = swKeys.indexOf(b.dataset.sw);
    swClose(true);
  });
  sw.addEventListener('click', function (e) { if (e.target === sw) swClose(false); });
  sw.addEventListener('keydown', function (e) {
    if (altMode) return;
    var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
    if (d) { e.preventDefault(); swSel = (swSel + d + swKeys.length) % swKeys.length; swDraw(); }
    else if (e.key === 'Escape') { e.preventDefault(); swClose(false); tvBtn.focus(); }
  });
  document.addEventListener('keydown', function (e) {
    var inside = root.contains(document.activeElement) || hover;
    if (e.key === 'Tab' && e.altKey && inside) {
      e.preventDefault();
      if (sw.hidden) swOpen(true);
      else { swSel = (swSel + (e.shiftKey ? -1 : 1) + swKeys.length) % swKeys.length; swDraw(); }
    } else if (e.key === 'Escape' && !sw.hidden) { swClose(false); }
  });
  document.addEventListener('keyup', function (e) { if (e.key === 'Alt' && altMode) swClose(true); });
  document.addEventListener('pointerdown', function (e) { if (!sw.hidden && !e.target.closest('.pc-switch, [data-pc-tv]')) swClose(false); });

  /* Bildirim: sanal bilgisayar ekranda göründükten bir süre sonra, oturumda bir kez */
  var toast = qs('[data-pc-toast]', root), toastTimer = null, toastShown = false;
  try { toastShown = !!sessionStorage.getItem('fk-toast'); } catch (e) {}
  var hideToast = function () {
    if (toast.hidden) return;
    toast.classList.add('is-out');
    setTimeout(function () { toast.hidden = true; toast.classList.remove('is-out'); }, reduce ? 0 : 260);
  };
  var showToast = function () {
    if (toastShown) return;
    toastShown = true;
    try { sessionStorage.setItem('fk-toast', '1'); } catch (e) {}
    toast.hidden = false;
    setTimeout(hideToast, 14000);
  };
  qs('[data-toast-close]', toast).addEventListener('click', hideToast);
  qs('[data-toast-go]', toast).addEventListener('click', hideToast);
  var watch = function () {
    if (toastShown || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (x.isIntersecting && x.intersectionRatio >= .5) { if (!toastTimer) toastTimer = setTimeout(function () { io.disconnect(); showToast(); }, 9000); }
        else { clearTimeout(toastTimer); toastTimer = null; }
      });
    }, { threshold: [0, .5] });
    io.observe(screen);
  };
  if (window.__fkpcReady) watch(); else document.addEventListener('fkpc:ready', watch, { once: true });

  /* Kapat ve yeniden başlat */
  var off = qs('[data-pc-off]', root), powerBtn = qs('[data-pc-power]', root);
  powerBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    P.closeStart(); hideCtx(); swClose(false); hideToast();
    off.hidden = false;
    off.className = 'pc-off is-busy';
    closeAll();
    setTimeout(function () {
      off.className = 'pc-off is-done';
      var a = qs('[data-off-offer]', off);
      if (a) a.focus({ preventScroll: true });
    }, reduce ? 200 : 1500);
  });
  qs('[data-pc-restart]', off).addEventListener('click', function () {
    off.className = 'pc-off is-restart';
    setTimeout(function () {
      off.hidden = true;
      off.className = 'pc-off';
      if (P._binReset) P._binReset();
      document.dispatchEvent(new CustomEvent('fk:secret', { detail: 'restart' }));
      if (!P.narrow()) P.open('web', false);
      P.open('desk', true);
    }, reduce ? 200 : 1400);
  });
  qs('[data-off-offer]', off).addEventListener('click', function () { setTimeout(function () { off.hidden = true; off.className = 'pc-off'; }, 600); });
})();
