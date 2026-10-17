/* Ana sayfa: sektöre göre kişiselleştirme ve küçük etkileşimli araçlar
   (zaman kaybı hesaplayıcısı, "hangi yazılım?" testi, web sitesi sağlık testi). */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (v) { return String(v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var num = function (n) { return Math.round(n).toLocaleString('tr-TR'); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  };

  /* Teklif formuna metin ekleyip forma geçer */
  var toForm = function (text, tile) {
    var form = qs('[data-contact-form]'), msg = form && qs('#f-mesaj', form);
    if (!msg) return;
    msg.value = msg.value.trim() ? msg.value.trim() + '\n\n' + text : text;
    if (tile) {
      var r = qs('input[name="project_type"][value="' + tile + '"]', form);
      if (r) r.checked = true;
    }
    if (form._goStep) form._goStep(qs('input[name="project_type"]:checked', form) ? 1 : 0);
    form.classList.remove('is-filled'); void form.offsetWidth; form.classList.add('is-filled');
    var c = document.getElementById('iletisim');
    if (c) c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  /* =====================================================================
     1) Sektöre göre kişiselleşen ana sayfa
     ===================================================================== */
  var SECTORS = {
    salon: { label: 'Kuaför ve salon', win: ['desk'], work: 'olivia-hair-mansion', tile: 'Masaüstü uygulaması',
      lead: 'Randevu, müşteri, personel ve kasa takibini tek programda toplayan salon yazılımları geliştiriyorum. Online randevu ve hatırlatma mesajlarıyla boş kalan koltukları azaltın.',
      posts: [['kuafor-salon-yonetim-programi', 'Kuaför ve salon yönetim programı'], ['online-randevu-sistemi', 'Online randevu sistemi'], ['musteri-sadakat-programi', 'Müşteri sadakat programı']] },
    emlak: { label: 'Emlak ofisi', win: ['web'], work: 'metrekare-gayrimenkul', tile: 'Web sitesi',
      lead: 'Portföyünüzü telefonda da rahat incelenen bir siteyle sergileyin; müşteri taleplerini ve yer gösterme randevularını tek yerden yönetin.',
      posts: [['emlak-ofisi-portfoy-yazilimi', 'Emlak ofisi portföy yazılımı'], ['kurumsal-web-sitesi-nasil-yapilir', 'Kurumsal web sitesi nasıl yapılır?'], ['yerel-seo-google-isletme-profili', 'Yerel SEO ve Google İşletme Profili']] },
    servis: { label: 'Oto servis ve stok', win: ['term'], work: 'kiraz-oto', tile: 'Masaüstü uygulaması',
      lead: 'Stok, satış, servis geçmişi ve müşteri kayıtlarını tek programda toplayın; plakayı yazınca aracın tüm geçmişine saniyeler içinde ulaşın.',
      posts: [['arac-bakim-filo-takip', 'Araç bakım ve filo takip yazılımı'], ['stok-takip-programi-secimi', 'Stok takip programı nasıl seçilir?'], ['teknik-servis-takip-programi', 'Teknik servis takip programı']] },
    eticaret: { label: 'E-ticaret', win: ['term', 'web'], work: null, tile: 'API ve entegrasyon',
      lead: 'Siteniz, pazaryerleri ve mağazanız tek stokta buluşsun; sipariş, kargo ve fatura adımları kendiliğinden ilerlesin.',
      posts: [['e-ticaret-sitesi-kurmak', 'E-ticaret sitesi kurmak'], ['pazaryeri-entegrasyonu', 'Pazaryeri entegrasyonu'], ['cok-kanalli-stok-senkronizasyonu', 'Çok kanallı stok senkronizasyonu']] },
    ajans: { label: 'Ajans ve ofis', win: ['panel'], work: 'futs-medya', tile: 'Web paneli',
      lead: 'Projeler, ekip yükü, faturalar ve finans tek panelde; yöneticiler işlerin durumunu her cihazdan anında görsün.',
      posts: [['yonetim-paneli-dashboard', 'Yönetim paneli (dashboard) tasarımı'], ['crm-nedir', 'CRM nedir?'], ['personel-vardiya-takip-programi', 'Personel ve vardiya takibi']] }
  };
  (function () {
    var box = qs('[data-sector]'), pick = qs('[data-sector-pick]'), lead = qs('.hero__lead');
    if (!box || !lead) return;
    var origLead = lead.textContent;
    var btns = qsa('[data-sec]', box);
    var apply = function (key, fromUser) {
      var s = SECTORS[key];
      btns.forEach(function (b) { var on = b.dataset.sec === key; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      qsa('.work.is-match').forEach(function (w) { w.classList.remove('is-match'); });
      if (!s) {
        lead.textContent = origLead;
        pick.hidden = true;
        store.set('fk-sector', null);
        return;
      }
      lead.classList.remove('is-swap'); void lead.offsetWidth; lead.classList.add('is-swap');
      lead.textContent = s.lead;
      store.set('fk-sector', key);
      var openWins = function () { if (window.FKPC) s.win.forEach(function (w, i) { window.FKPC.open(w, i === s.win.length - 1 && fromUser); }); };
      if (window.__fkpcReady) openWins(); else document.addEventListener('fkpc:ready', openWins, { once: true });
      if (s.work) { var w = qs('.work[href$="' + s.work + '.html"]'); if (w) w.classList.add('is-match'); }
      pick.hidden = false;
      pick.innerHTML = '<p class="sector-pick__t"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>' + esc(s.label) + ' için öneriler</p><div class="sector-pick__list">' +
        (s.work ? '<a href="projeler/' + s.work + '.html" class="sector-pick__item sector-pick__item--work"><small>Referans proje</small>' + esc(qs('.work[href$="' + s.work + '.html"] h3') ? qs('.work[href$="' + s.work + '.html"] h3').textContent : 'Proje') + '</a>' : '') +
        s.posts.map(function (p) { return '<a href="blog/' + p[0] + '.html" class="sector-pick__item"><small>Rehber</small>' + esc(p[1]) + '</a>'; }).join('') +
        '</div><div class="sector-pick__act"><button type="button" class="btn btn--primary" data-sector-offer>' + esc(s.label) + ' için teklif isteyin</button><button type="button" class="sector-pick__reset" data-sector-reset>Seçimi kaldır</button></div>';
      qs('[data-sector-offer]', pick).addEventListener('click', function () { toForm('Sektör: ' + s.label + '.', s.tile); });
      qs('[data-sector-reset]', pick).addEventListener('click', function () { apply(null); });
    };
    btns.forEach(function (b) { b.addEventListener('click', function () { apply(b.classList.contains('is-on') ? null : b.dataset.sec, true); }); });
    var saved = store.get('fk-sector');
    if (saved && SECTORS[saved]) apply(saved, false);
  })();

  /* =====================================================================
     2) Araçlar: sekmeler
     ===================================================================== */
  var tools = qs('[data-tools]');
  if (!tools) return;
  (function () {
    var tabs = qsa('[data-tool]', tools);
    var show = function (k, focus) {
      tabs.forEach(function (t) { var on = t.dataset.tool === k; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
      qsa('[data-tool-panel]', tools).forEach(function (p) { p.hidden = p.dataset.toolPanel !== k; });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t.dataset.tool); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); show(tabs[(i + d + tabs.length) % tabs.length].dataset.tool, true); }
      });
    });
    show('hesap');
  })();

  /* ---------- 2a) Zaman kaybı hesaplayıcısı ---------- */
  (function () {
    var p = qs('[data-tool-panel="hesap"]', tools);
    if (!p) return;
    var inputs = {}, outs = {}, res = {};
    qsa('[data-c]', p).forEach(function (i) { inputs[i.dataset.c] = i; });
    qsa('[data-o]', p).forEach(function (o) { outs[o.dataset.o] = o; });
    qsa('[data-r]', p).forEach(function (o) { res[o.dataset.r] = o; });
    var fmt = { kisi: function (v) { return v + ' kişi'; }, dk: function (v) { return v + ' dk'; }, gun: function (v) { return v + ' gün'; }, ucret: function (v) { return '₺' + num(v); } };
    var last = {};
    var animate = function (el, to, f) {
      var from = last[el.dataset.r] || 0; last[el.dataset.r] = to;
      if (reduce) { el.textContent = f(to); return; }
      var t0 = null;
      var tick = function (t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 380); el.textContent = f(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    };
    var calc = function () {
      var v = {}; Object.keys(inputs).forEach(function (k) { v[k] = +inputs[k].value; outs[k].textContent = fmt[k](v[k]); inputs[k].style.setProperty('--p', ((v[k] - inputs[k].min) / (inputs[k].max - inputs[k].min) * 100) + '%'); });
      var hafta = v.kisi * v.dk * v.gun / 60, yil = hafta * 48;
      animate(res.yil, yil, num);
      animate(res.hafta, hafta, function (n) { return n.toLocaleString('tr-TR', { maximumFractionDigits: 1 }); });
      animate(res.gun, yil / 8, num);
      animate(res.tl, yil * v.ucret, function (n) { return '₺' + num(n); });
      animate(res.yarim, yil / 2, num);
      p._v = v; p._yil = yil;
    };
    Object.keys(inputs).forEach(function (k) { inputs[k].addEventListener('input', calc); });
    calc();
    qs('[data-calc-send]', p).addEventListener('click', function () {
      var v = p._v;
      toForm('Zaman kaybı hesabı: ' + v.kisi + ' kişi, kişi başı günde ' + v.dk + ' dk, haftada ' + v.gun + ' gün. Tahmini kayıp yılda yaklaşık ' + num(p._yil) + ' saat. Bu işi otomatikleştirmek istiyoruz.', null);
    });
  })();

  /* ---------- 2b) Size hangi yazılım uygun? ---------- */
  (function () {
    var p = qs('[data-tool-panel="quiz"]', tools);
    if (!p) return;
    var T = {
      masaustu: { t: 'Masaüstü uygulaması', tile: 'Masaüstü uygulaması', win: 'desk', d: 'Ofiste aynı yerde çalışan ekipler için hızlı veri girişi, barkod ve yazıcı desteğiyle güçlü bir masaüstü program en verimli çözüm olabilir.', post: ['masaustu-otomasyon-sistemleri', 'Masaüstü otomasyon sistemleri'] },
      panel: { t: 'Web tabanlı yönetim paneli', tile: 'Web paneli', win: 'panel', d: 'Farklı şubelerden, sahadan veya telefondan erişim gerekiyorsa her cihazda çalışan bir yönetim paneli öne çıkıyor.', post: ['yonetim-paneli-dashboard', 'Yönetim paneli nasıl tasarlanır?'] },
      site: { t: 'Kurumsal web sitesi', tile: 'Web sitesi', win: 'web', d: 'Önceliğiniz yeni müşteri bulmak ve güven vermekse hızlı, mobil uyumlu ve aramalarda görünen bir web sitesiyle başlamak en doğrusu.', post: ['kurumsal-web-sitesi-nasil-yapilir', 'Kurumsal web sitesi nasıl yapılır?'] },
      otomasyon: { t: 'Otomasyon ve entegrasyon', tile: 'API ve entegrasyon', win: 'term', d: 'Tekrar eden işleri ve sistemler arası veri taşımayı arka planda çalışan konsol uygulamaları ve entegrasyonlar halledebilir.', post: ['is-sureci-otomasyonu', 'İş süreci otomasyonu'] },
      eklenti: { t: 'Tarayıcı eklentisi', tile: 'Tarayıcı eklentisi', win: 'ext', d: 'İşiniz büyük ölçüde tarayıcıda geçiyorsa, belirli bir işi tek tıkla yapan küçük bir Chrome eklentisi şaşırtıcı derecede zaman kazandırabilir.', post: ['#urunler', 'Geliştirdiğim Chrome eklentileri'] }
    };
    var Q = [
      { q: 'Asıl amacınız ne?', a: [['Yeni müşteri bulmak ve tanınmak', { site: 3 }], ['İç işleri düzene sokmak', { masaustu: 2, panel: 2 }], ['Tekrar eden işleri otomatikleştirmek', { otomasyon: 3 }], ['Tarayıcıda yaptığım bir işi hızlandırmak', { eklenti: 3 }]] },
      { q: 'Yazılımı kimler kullanacak?', a: [['Müşterilerim', { site: 2, panel: 1 }], ['Aynı ofisteki ekibim', { masaustu: 2 }], ['Farklı şubeler veya sahadaki ekip', { panel: 3 }], ['Kimse; kendi kendine çalışmalı', { otomasyon: 3 }]] },
      { q: 'Hangi cihazlardan kullanılacak?', a: [['Ofisteki Windows bilgisayarlar', { masaustu: 2 }], ['Telefon ve bilgisayar', { panel: 2, site: 1 }], ['Yalnızca tarayıcı', { eklenti: 1, panel: 1 }], ['Fark etmez', {}]] },
      { q: 'Verileriniz şu an nerede?', a: [['Excel veya kâğıt', { masaustu: 1, panel: 1 }], ['Başka bir programda', { otomasyon: 2 }], ['Henüz düzenli bir veri yok', { site: 1, panel: 1 }], ['Web sitemde ve e-postalarda', { site: 1, otomasyon: 1 }]] }
    ];
    var step = 0, score = {};
    var render = function () {
      if (step >= Q.length) return result();
      var q = Q[step];
      p.innerHTML = '<div class="quiz"><div class="quiz__top"><span>Soru ' + (step + 1) + ' / ' + Q.length + '</span><div class="quiz__bar"><i style="width:' + (step / Q.length * 100) + '%"></i></div></div>' +
        '<h3 class="quiz__q" tabindex="-1">' + esc(q.q) + '</h3><div class="quiz__opts">' +
        q.a.map(function (a, i) { return '<button type="button" class="quiz__opt" data-a="' + i + '"><span>' + String.fromCharCode(65 + i) + '</span>' + esc(a[0]) + '</button>'; }).join('') +
        '</div>' + (step ? '<button type="button" class="quiz__back" data-back>Geri</button>' : '') + '</div>';
      qsa('[data-a]', p).forEach(function (b) {
        b.addEventListener('click', function () {
          var w = q.a[+b.dataset.a][1];
          Object.keys(w).forEach(function (k) { score[k] = (score[k] || 0) + w[k]; });
          q._pick = w; step++; render();
          var h = qs('.quiz__q', p) || qs('.quiz-res h3', p); if (h) h.focus({ preventScroll: true });
        });
      });
      var back = qs('[data-back]', p);
      if (back) back.addEventListener('click', function () {
        step--; var w = Q[step]._pick || {};
        Object.keys(w).forEach(function (k) { score[k] -= w[k]; });
        render();
      });
    };
    var result = function () {
      var ranked = Object.keys(T).sort(function (a, b) { return (score[b] || 0) - (score[a] || 0); });
      var r = T[ranked[0]], second = (score[ranked[1]] || 0) > 0 ? T[ranked[1]] : null;
      p.innerHTML = '<div class="quiz-res"><p class="quiz-res__k">Sonuç</p><h3 tabindex="-1">' + esc(r.t) + '</h3><p>' + esc(r.d) + '</p>' +
        (second ? '<p class="quiz-res__alt">İkinci güçlü seçenek: <b>' + esc(second.t) + '</b>. Çoğu projede ikisi birlikte de kurgulanabilir.</p>' : '') +
        '<div class="quiz-res__act"><button type="button" class="btn btn--primary" data-q-offer>Bu türde teklif isteyin</button><button type="button" class="btn btn--ghost" data-q-demo>Örneğini görün</button><a class="link-more" href="' + (r.post[0].charAt(0) === '#' ? r.post[0] : 'blog/' + r.post[0] + '.html') + '">' + esc(r.post[1]) + ' <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div>' +
        '<button type="button" class="quiz__back" data-q-again>Testi yeniden başlat</button></div>';
      qs('[data-q-offer]', p).addEventListener('click', function () { toForm('"Hangi yazılım?" testinin sonucu: ' + r.t + '.', r.tile); });
      qs('[data-q-demo]', p).addEventListener('click', function () {
        var pc = qs('[data-pc]');
        if (pc) pc.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        if (window.FKPC) setTimeout(function () { window.FKPC.open(r.win, true); }, reduce ? 0 : 450);
      });
      qs('[data-q-again]', p).addEventListener('click', function () { step = 0; score = {}; Q.forEach(function (q) { q._pick = null; }); render(); });
    };
    render();
  })();

  /* ---------- 2c) Web sitesi sağlık testi ---------- */
  (function () {
    var p = qs('[data-tool-panel="saglik"]', tools);
    if (!p) return;
    var C = [
      ['Siteniz HTTPS ile (kilit simgesiyle) açılıyor mu?', 'ssl-sertifikasi-https-nedir', 'SSL ve HTTPS'],
      ['Telefonda yazılar okunaklı, butonlar rahat basılıyor mu?', 'mobil-uyumlu-web-sitesi', 'Mobil uyumlu web sitesi'],
      ['Mobilde sayfa birkaç saniyede açılıyor mu?', 'web-sitesi-hizlandirma', 'Web sitesi hızlandırma'],
      ['Google İşletme Profiliniz güncel mi?', 'yerel-seo-google-isletme-profili', 'Yerel SEO'],
      ['KVKK aydınlatma metni ve çerez tercihleri var mı?', 'cerez-politikasi-hazirlama', 'Çerez politikası ve onayı'],
      ['Son 6 ayda sitede bir içerik güncellendi mi?', 'web-sitesi-bakim-hizmeti', 'Web sitesi bakımı'],
      ['İletişim formunu son bir ayda kendiniz test ettiniz mi?', 'iletisim-formu-spam-onleme', 'İletişim formu güvenliği'],
      ['Sitenizin düzenli ve sunucu dışında saklanan yedeği var mı?', 'veritabani-yedekleme-stratejisi', 'Yedekleme stratejisi']
    ];
    var ans = {};
    var draw = function () {
      var done = Object.keys(ans).length, yes = Object.keys(ans).filter(function (k) { return ans[k]; }).length;
      var html = '<div class="health"><ol class="health__list">' + C.map(function (c, i) {
        var v = ans[i];
        return '<li class="' + (v === true ? 'is-yes' : v === false ? 'is-no' : '') + '"><span class="health__q">' + esc(c[0]) + '</span><span class="health__btns" role="group" aria-label="' + esc(c[0]) + '">' +
          '<button type="button" data-h="' + i + '" data-v="1" aria-pressed="' + (v === true) + '">Evet</button><button type="button" data-h="' + i + '" data-v="0" aria-pressed="' + (v === false) + '">Hayır</button></span></li>';
      }).join('') + '</ol><div class="health__res" aria-live="polite">';
      if (done < C.length) {
        html += '<div class="health__ring" style="--p:' + (done / C.length * 100) + '"><b>' + done + '/' + C.length + '</b><small>cevaplandı</small></div><p>Soruların hepsini cevapladığınızda sitenizin puanı ve öncelikli öneriler burada görünecek.</p>';
      } else {
        var pct = Math.round(yes / C.length * 100);
        var level = pct >= 88 ? ['Harika durumda', 'Temeller sağlam. Şimdi büyümeye ve dönüşüme odaklanabilirsiniz.'] : pct >= 60 ? ['İyi ama gelişebilir', 'Birkaç eksik giderildiğinde site çok daha güven verici olur.'] : ['Bakım zamanı gelmiş', 'Eksikler hem ziyaretçi güvenini hem arama görünürlüğünü etkiliyor olabilir.'];
        var no = C.filter(function (c, i) { return ans[i] === false; });
        html += '<div class="health__ring is-done" style="--p:' + pct + '"><b>' + yes + '/' + C.length + '</b><small>puan</small></div><h3>' + level[0] + '</h3><p>' + level[1] + '</p>' +
          (no.length ? '<p class="health__sub">Öncelikli konular:</p><ul class="health__todo">' + no.map(function (c) { return '<li><a href="blog/' + c[1] + '.html">' + esc(c[2]) + '</a></li>'; }).join('') + '</ul>' : '') +
          '<div class="health__act"><button type="button" class="btn btn--primary" data-h-send>Sonucu teklif formuna ekle</button><button type="button" class="quiz__back" data-h-reset>Sıfırla</button></div>';
      }
      html += '</div></div>';
      p.innerHTML = html;
      qsa('[data-h]', p).forEach(function (b) {
        b.addEventListener('click', function () {
          ans[+b.dataset.h] = b.dataset.v === '1'; draw();
          var nb = qs('[data-h="' + b.dataset.h + '"][data-v="' + b.dataset.v + '"]', p); if (nb) nb.focus({ preventScroll: true });
        });
      });
      var send = qs('[data-h-send]', p);
      if (send) send.addEventListener('click', function () {
        var no = C.filter(function (c, i) { return ans[i] === false; }).map(function (c) { return c[2]; });
        toForm('Web sitesi sağlık testi: ' + yes + '/' + C.length + '.' + (no.length ? ' Eksikler: ' + no.join(', ') + '.' : '') + ' Sitemizi değerlendirmenizi istiyoruz.', 'Web sitesi');
      });
      var rs = qs('[data-h-reset]', p);
      if (rs) rs.addEventListener('click', function () { ans = {}; draw(); });
    };
    draw();
  })();
})();
