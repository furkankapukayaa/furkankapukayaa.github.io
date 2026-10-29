/* Google AdSense: yalnızca blog yazılarında çalışır.
   Bu dosya sadece blog yazısı sayfalarında çağrılır; ana sayfa, proje sayfaları, kategori listeleri
   ve yasal metinlerde reklam kodu hiç yüklenmez.

   Kurulum
   - AdSense > Reklamlar > Genel bakış > Otomatik reklamlar açıksa hiçbir şey yapmanız gerekmez:
     Google, bu betiğin yüklendiği blog yazılarında reklam yerlerini kendisi seçer.
   - Reklamların yerini kendiniz belirlemek isterseniz AdSense > Reklamlar > Reklam birimine göre
     menüsünden birim oluşturun ve verdiği data-ad-slot numarasını aşağıdaki SLOTS alanına yazın.
     Dolu olan her alan, yazının ilgili yerine bir reklam birimi ekler; boş alanlar atlanır.

   Gizlilik
   - Ziyaretçi çerez tercihlerinden "Kişiselleştirilmiş reklam" onayı vermediyse reklamlar
     kişiselleştirilmeden istenir (requestNonPersonalizedAds). Tercih analytics.js içinde saklanır.

   Performans
   - Reklam betiği sayfa yüklendikten sonra, tarayıcı boşta kaldığında ya da ziyaretçi sayfayı
     kaydırdığında yüklenir; yazının ilk çizimini ve LCP değerini geciktirmez. */
(function () {
  'use strict';
  var CLIENT = 'ca-pub-1772204959473379';
  var SLOTS = {
    top: '',    /* İçindekiler kutusunun hemen altı (Görüntülü reklam, duyarlı) */
    middle: '', /* Yazının ortasındaki başlıktan önce (Makale içi reklam) */
    bottom: ''  /* Yazının sonu, dipnottan önce (Görüntülü reklam, duyarlı) */
  };

  var article = document.querySelector('article.prose');
  if (!article || location.protocol === 'file:' || window.__fkAds) return;
  window.__fkAds = true;

  var st = window.FKConsent && window.FKConsent.get ? window.FKConsent.get() : null;
  var q = window.adsbygoogle = window.adsbygoogle || [];
  if (!(st && st.ads)) q.requestNonPersonalizedAds = 1;

  var slot = function (id, inArticle) {
    var box = document.createElement('div');
    box.className = 'ad-slot' + (inArticle ? ' ad-slot--fluid' : '');
    box.setAttribute('role', 'complementary');
    box.setAttribute('aria-label', 'Reklam');
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', CLIENT);
    ins.setAttribute('data-ad-slot', id);
    if (inArticle) {
      ins.style.textAlign = 'center';
      ins.setAttribute('data-ad-layout', 'in-article');
      ins.setAttribute('data-ad-format', 'fluid');
    } else {
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
    }
    box.appendChild(ins);
    return box;
  };
  var place = function () {
    var units = [];
    var h2 = article.querySelectorAll(':scope > h2');
    if (SLOTS.top) {
      var toc = article.querySelector(':scope > .toc');
      var anchor = toc || h2[0];
      if (anchor) { var a = slot(SLOTS.top, false); anchor.insertAdjacentElement(toc ? 'afterend' : 'beforebegin', a); units.push(a); }
    }
    if (SLOTS.middle && h2.length >= 4) {
      var m = slot(SLOTS.middle, true);
      article.insertBefore(m, h2[Math.floor(h2.length / 2)]);
      units.push(m);
    }
    if (SLOTS.bottom) {
      var note = article.querySelector(':scope > .ai-note');
      var b = slot(SLOTS.bottom, false);
      if (note) article.insertBefore(b, note); else article.appendChild(b);
      units.push(b);
    }
    units.forEach(function () { try { q.push({}); } catch (e) {} });
  };

  var loaded = false;
  var load = function () {
    if (loaded) return;
    loaded = true;
    ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(function (t) { window.removeEventListener(t, load, { passive: true }); });
    place();
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + CLIENT;
    document.head.appendChild(s);
  };
  ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(function (t) { window.addEventListener(t, load, { passive: true }); });
  var idle = function () {
    if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 2500 });
    else setTimeout(load, 1200);
  };
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
})();
