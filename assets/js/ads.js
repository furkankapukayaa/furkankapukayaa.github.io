(function() {
  'use strict';
  var CLIENT = 'ca-pub-1772204959473379';
  var SLOTS = {
    top: '',
    middle: '',
    bottom: ''
  };
  var article = document.querySelector('article.prose');
  if (!article || location.protocol === 'file:' || window.__fkAds) return;
  window.__fkAds = true;
  var st = window.FKConsent && window.FKConsent.get ? window.FKConsent.get() : null;
  var q = window.adsbygoogle = window.adsbygoogle || [];
  if (!(st && st.ads)) q.requestNonPersonalizedAds = 1;
  var slot = function(id, inArticle) {
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
  var place = function() {
    var units = [];
    var h2 = article.querySelectorAll(':scope > h2');
    if (SLOTS.top) {
      var toc = article.querySelector(':scope > .toc');
      var anchor = toc || h2[0];
      if (anchor) {
        var a = slot(SLOTS.top, false);
        anchor.insertAdjacentElement(toc ? 'afterend' : 'beforebegin', a);
        units.push(a);
      }
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
    units.forEach((function() {
      try {
        q.push({});
      } catch (e) {}
    }));
  };
  var loaded = false;
  var load = function() {
    if (loaded) return;
    loaded = true;
    [ 'scroll', 'pointerdown', 'keydown', 'touchstart' ].forEach((function(t) {
      window.removeEventListener(t, load, {
        passive: true
      });
    }));
    place();
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + CLIENT;
    document.head.appendChild(s);
  };
  [ 'scroll', 'pointerdown', 'keydown', 'touchstart' ].forEach((function(t) {
    window.addEventListener(t, load, {
      passive: true
    });
  }));
  var idle = function() {
    if ('requestIdleCallback' in window) window.requestIdleCallback(load, {
      timeout: 2500
    }); else setTimeout(load, 1200);
  };
  if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle, {
    once: true
  });
})();
