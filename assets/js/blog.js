/* Blog yazısı sayfaları: okuma ilerleme çubuğu, sabit içindekiler, kod kopyalama,
   geri bildirim ve paylaşım. Yalnızca blog yazılarında yüklenir. */
(function () {
  'use strict';
  var article = document.querySelector('.prose');
  if (!article) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var slug = location.pathname.split('/').pop().replace(/\.html$/, '') || 'yazi';

  /* 1) Okuma ilerleme çubuğu */
  var bar = document.createElement('div');
  bar.className = 'read-progress';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<i></i>';
  document.body.appendChild(bar);
  var fill = bar.firstChild, ticking = false;
  var update = function () {
    ticking = false;
    var r = article.getBoundingClientRect(), vh = window.innerHeight;
    var total = r.height - vh * .6, done = Math.min(Math.max(-r.top + vh * .25, 0), Math.max(total, 1));
    fill.style.transform = 'scaleX(' + (total > 0 ? done / total : 1).toFixed(4) + ')';
  };
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();

  /* 2) Sabit içindekiler (geniş ekranda kenar sütunda) ve okunan bölümün vurgulanması */
  var toc = article.querySelector('.toc ol'), aside = document.querySelector('.article-aside');
  var heads = Array.prototype.slice.call(article.querySelectorAll('h2[id]'));
  if (toc && aside && heads.length > 2) {
    var card = document.createElement('nav');
    card.className = 'aside-card aside-toc';
    card.setAttribute('aria-label', 'Bu yazıda');
    card.innerHTML = '<b class="aside-title">Bu yazıda</b>';
    var list = toc.cloneNode(true);
    card.appendChild(list);
    aside.appendChild(card);
    aside.classList.add('has-toc');
    var links = {};
    [list, toc].forEach(function (l) {
      Array.prototype.forEach.call(l.querySelectorAll('a'), function (a) {
        var id = a.getAttribute('href').slice(1);
        (links[id] = links[id] || []).push(a);
      });
    });
    var current = null;
    var setActive = function (id) {
      if (id === current) return;
      current = id;
      Object.keys(links).forEach(function (k) {
        links[k].forEach(function (a) {
          a.classList.toggle('is-active', k === id);
          if (k === id) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
      });
    };
    var pick = function () {
      var y = window.innerHeight * .3, id = heads[0].id;
      for (var i = 0; i < heads.length; i++) { if (heads[i].getBoundingClientRect().top - y <= 0) id = heads[i].id; else break; }
      setActive(id);
    };
    window.addEventListener('scroll', function () { requestAnimationFrame(pick); }, { passive: true });
    pick();
  }

  /* 3) Kod bloklarına kopyalama düğmesi */
  Array.prototype.forEach.call(article.querySelectorAll('pre'), function (pre) {
    var wrap = document.createElement('div');
    wrap.className = 'code-wrap';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy';
    btn.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i><span>Kopyala</span>';
    btn.setAttribute('aria-label', 'Kodu kopyala');
    wrap.appendChild(btn);
    btn.addEventListener('click', function () {
      var text = pre.innerText;
      var ok = function () {
        btn.classList.add('is-done');
        btn.querySelector('span').textContent = 'Kopyalandı';
        btn.querySelector('i').className = 'fa-solid fa-check';
        setTimeout(function () { btn.classList.remove('is-done'); btn.querySelector('span').textContent = 'Kopyala'; btn.querySelector('i').className = 'fa-regular fa-copy'; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function () {});
    });
  });

  /* 4) Geri bildirim ve paylaşım */
  var note = article.querySelector('.ai-note');
  var title = (document.querySelector('h1') || {}).textContent || document.title;
  var url = (document.querySelector('link[rel="canonical"]') || {}).href || location.href;
  var enc = encodeURIComponent;
  var box = document.createElement('section');
  box.className = 'post-end';
  box.setAttribute('aria-label', 'Yazı sonu');
  box.innerHTML =
    '<div class="post-end__fb" data-fb><p class="post-end__q">Bu yazı işinize yaradı mı?</p>' +
      '<div class="post-end__btns"><button type="button" class="btn btn--ghost" data-fb-v="1"><i class="fa-regular fa-thumbs-up" aria-hidden="true"></i>Evet</button>' +
      '<button type="button" class="btn btn--ghost" data-fb-v="0"><i class="fa-regular fa-thumbs-down" aria-hidden="true"></i>Pek değil</button></div>' +
      '<p class="post-end__msg" role="status" aria-live="polite"></p></div>' +
    '<div class="post-end__share"><p class="post-end__q">Paylaşın</p><div class="post-end__btns">' +
      (navigator.share ? '<button type="button" class="btn btn--primary share-native" data-share-native><i class="fa-solid fa-share-nodes" aria-hidden="true"></i>Paylaş</button>' : '') +
      '<a class="share-btn" data-share="whatsapp" target="_blank" rel="noopener" href="https://api.whatsapp.com/send?text=' + enc(title + ' ' + url) + '" aria-label="WhatsApp ile gönder"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></a>' +
      '<a class="share-btn" data-share="linkedin" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=' + enc(url) + '" aria-label="LinkedIn\'de paylaş"><i class="fa-brands fa-linkedin-in" aria-hidden="true"></i></a>' +
      '<a class="share-btn" data-share="x" target="_blank" rel="noopener" href="https://x.com/intent/post?url=' + enc(url) + '&text=' + enc(title) + '" aria-label="X\'te paylaş"><i class="fa-brands fa-x-twitter" aria-hidden="true"></i></a>' +
      '<a class="share-btn" data-share="facebook" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + enc(url) + '" aria-label="Facebook\'ta paylaş"><i class="fa-brands fa-facebook-f" aria-hidden="true"></i></a>' +
      '<a class="share-btn" data-share="telegram" target="_blank" rel="noopener" href="https://t.me/share/url?url=' + enc(url) + '&text=' + enc(title) + '" aria-label="Telegram ile gönder"><i class="fa-brands fa-telegram" aria-hidden="true"></i></a>' +
      '<a class="share-btn" data-share="email" href="mailto:?subject=' + enc(title) + '&body=' + enc(title + '\n\n' + url) + '" aria-label="E-posta ile gönder"><i class="fa-regular fa-envelope" aria-hidden="true"></i></a>' +
      '<button type="button" class="share-btn" data-copy-link aria-label="Bağlantıyı kopyala"><i class="fa-solid fa-link" aria-hidden="true"></i></button>' +
    '</div><p class="post-end__msg" data-share-msg role="status" aria-live="polite"></p></div>';
  article.insertBefore(box, note || null);
  var msg = box.querySelector('.post-end__msg'), key = 'fk-fb:' + slug;
  var show = function (v) {
    box.querySelectorAll('[data-fb-v]').forEach(function (b) { b.disabled = true; b.classList.toggle('is-on', b.dataset.fbV === v); });
    msg.innerHTML = v === '1'
      ? 'Teşekkürler! Benzer konularda bir projeniz varsa <a href="../index.html#iletisim">konuşalım</a>.'
      : 'Teşekkürler. Neyin eksik olduğunu <a href="../index.html#iletisim">yazarsanız</a> yazıyı geliştiririm.';
  };
  try { var prev = localStorage.getItem(key); if (prev) show(prev); } catch (e) {}
  box.querySelectorAll('[data-fb-v]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.dataset.fbV;
      try { localStorage.setItem(key, v); } catch (e) {}
      show(v);
      if (typeof window.gtag === 'function') { try { window.gtag('event', 'yazi_geri_bildirim', { yazi: slug, faydali: v === '1' }); } catch (e) {} }
    });
  });
  /* Paylaşım: telefonda yerel paylaşım menüsü, masaüstünde küçük pencere, her durumda çalışan kopyalama */
  var shareMsg = box.querySelector('[data-share-msg]');
  var say = function (t) { shareMsg.textContent = t; clearTimeout(say._t); say._t = setTimeout(function () { shareMsg.textContent = ''; }, 3500); };
  var copyText = function (text) {
    var fallback = function () {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      ta.remove();
      return ok ? Promise.resolve() : Promise.reject();
    };
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(fallback);
    return fallback();
  };
  var track = function (kanal) { if (typeof window.gtag === 'function') { try { window.gtag('event', 'share', { method: kanal, item_id: slug }); } catch (e) {} } };
  var copyBtn = box.querySelector('[data-copy-link]');
  copyBtn.addEventListener('click', function () {
    copyText(url).then(function () {
      copyBtn.classList.add('is-done'); copyBtn.querySelector('i').className = 'fa-solid fa-check';
      say('Bağlantı kopyalandı.');
      setTimeout(function () { copyBtn.classList.remove('is-done'); copyBtn.querySelector('i').className = 'fa-solid fa-link'; }, 1800);
      track('kopyala');
    }, function () {
      window.prompt('Bağlantıyı kopyalayın:', url);
    });
  });
  var nat = box.querySelector('[data-share-native]');
  if (nat) nat.addEventListener('click', function () {
    navigator.share({ title: title, text: title, url: url }).then(function () { track('yerel'); }, function () {});
  });
  box.querySelectorAll('a[data-share]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var k = a.dataset.share;
      track(k);
      if (k === 'email') return;
      /* Geniş ekranda ortalanmış küçük bir pencere; engellenirse bağlantı normal şekilde yeni sekmede açılır */
      if (window.matchMedia('(min-width: 761px)').matches && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        var w = 600, h = 640, l = Math.max(0, (screen.width - w) / 2), t = Math.max(0, (screen.height - h) / 2);
        var win = window.open(a.href, 'fk-share', 'width=' + w + ',height=' + h + ',left=' + l + ',top=' + t);
        if (win) { try { win.opener = null; } catch (err) {} e.preventDefault(); }
      }
    });
  });
  /* Yazının sonuna kadar okuyan biri gizli bir rozet kazanır (extras.js) */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { io.disconnect(); document.dispatchEvent(new CustomEvent('fk:secret', { detail: 'okur' })); }
    });
    io.observe(box);
  }
  void reduce;
})();
