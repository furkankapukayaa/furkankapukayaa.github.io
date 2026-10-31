(function() {
  'use strict';
  var me = document.currentScript && document.currentScript.src;
  var base = me ? me.replace(/assets\/js\/ui\.js.*$/, '') : '/';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  (function() {
    var bar = document.createElement('nav');
    bar.className = 'mbar';
    bar.setAttribute('aria-label', 'Hızlı işlemler');
    bar.innerHTML = '<a class="mbar__main" href="' + base + '#iletisim"><i class="fa-regular fa-paper-plane" aria-hidden="true"></i>Teklif isteyin</a>' + '<a class="mbar__ic" href="mailto:info@kapukaya.dev" aria-label="E-posta gönderin"><i class="fa-regular fa-envelope" aria-hidden="true"></i></a>' + '<button class="mbar__ic" type="button" data-mbar-top aria-label="Sayfanın başına dön"><i class="fa-solid fa-arrow-up" aria-hidden="true"></i></button>';
    document.body.appendChild(bar);
    document.documentElement.classList.add('has-mbar');
    bar.querySelector('[data-mbar-top]').addEventListener('click', (function() {
      window.scrollTo({
        top: 0,
        behavior: reduce ? 'auto' : 'smooth'
      });
    }));
    bar.querySelector('.mbar__main').addEventListener('click', (function(e) {
      var c = document.getElementById('iletisim');
      if (c) {
        e.preventDefault();
        c.scrollIntoView({
          behavior: reduce ? 'auto' : 'smooth',
          block: 'start'
        });
      }
    }));
    var contact = document.getElementById('iletisim'), footer = document.querySelector('.k-footer'), postEnd = document.querySelector('.post-end');
    var hide = {};
    var typing = false;
    var decide = function() {
      var consent = document.querySelector('.consent:not([hidden])');
      var show = window.scrollY > 380 && !hide.c && !hide.f && !hide.p && !typing && !(consent && consent.offsetParent);
      bar.classList.toggle('is-on', show);
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver((function(en) {
        en.forEach((function(x) {
          hide[x.target === contact ? 'c' : x.target === postEnd ? 'p' : 'f'] = x.isIntersecting;
        }));
        decide();
      }), {
        threshold: .05
      });
      [ contact, footer, postEnd ].forEach((function(el) {
        if (el) io.observe(el);
      }));
    }
    document.addEventListener('focusin', (function(e) {
      typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
      decide();
    }));
    document.addEventListener('focusout', (function() {
      typing = false;
      setTimeout(decide, 50);
    }));
    window.addEventListener('scroll', (function() {
      requestAnimationFrame(decide);
    }), {
      passive: true
    });
    decide();
  })();
  (function() {
    var d = document.documentElement;
    var load = function() {
      try {
        return JSON.parse(localStorage.getItem('fk-a11y') || '{}') || {};
      } catch (e) {
        return {};
      }
    };
    var save = function(v) {
      try {
        localStorage.setItem('fk-a11y', JSON.stringify(v));
      } catch (e) {}
    };
    var apply = function(v) {
      if (v.size) d.setAttribute('data-a11y-size', v.size); else d.removeAttribute('data-a11y-size');
      d.classList.toggle('a11y-contrast', !!v.contrast);
      d.classList.toggle('a11y-links', !!v.links);
      d.classList.toggle('a11y-motion', !!v.motion);
    };
    var dlg = null;
    var paint = function() {
      var v = load();
      var sw = function(k, label, desc) {
        return '<label class="cp-row"><span><b>' + label + '</b><small>' + desc + '</small></span><input type="checkbox" class="cp-sw" data-k="' + k + '"' + (v[k] ? ' checked' : '') + '></label>';
      };
      dlg.innerHTML = '<div class="k-modal__head"><h2 id="a11y-t">Erişilebilirlik</h2><button type="button" class="k-modal__x" data-x aria-label="Kapat"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div><div class="k-modal__body">' + '<div class="cp-row cp-row--stack"><span><b>Yazı boyutu</b><small>Tüm sayfayı büyütür.</small></span><div class="cp-seg" role="group" aria-label="Yazı boyutu">' + [ [ '', 'Normal' ], [ '1', 'Büyük' ], [ '2', 'Çok büyük' ] ].map((function(o) {
        var on = String(v.size || '') === o[0];
        return '<button type="button" data-size="' + o[0] + '" aria-pressed="' + on + '"' + (on ? ' class="is-on"' : '') + '>' + o[1] + '</button>';
      })).join('') + '</div></div>' + sw('contrast', 'Yüksek kontrast', 'Soluk yazıları ve çizgileri belirginleştirir.') + sw('links', 'Bağlantıların altını çiz', 'Metindeki bağlantıları ayırt etmeyi kolaylaştırır.') + sw('motion', 'Hareketleri azalt', 'Animasyon ve geçişleri kapatır.') + '<p class="cp-note">Ayarlar yalnızca bu tarayıcıda saklanır. <button type="button" class="cp-link" data-reset>Varsayılanlara dön</button></p></div>';
    };
    var open = function() {
      if (!dlg) {
        dlg = document.createElement('dialog');
        dlg.className = 'k-modal';
        dlg.setAttribute('aria-labelledby', 'a11y-t');
        document.body.appendChild(dlg);
        dlg.addEventListener('click', (function(e) {
          if (e.target === dlg || e.target.closest('[data-x]')) {
            dlg.close();
            return;
          }
          var b = e.target.closest('[data-size]');
          if (b) {
            var v = load();
            v.size = b.dataset.size || undefined;
            save(v);
            apply(v);
            paint();
            dlg.querySelector('[data-size="' + b.dataset.size + '"]').focus();
          }
          if (e.target.closest('[data-reset]')) {
            save({});
            apply({});
            paint();
          }
        }));
        dlg.addEventListener('change', (function(e) {
          var c = e.target.closest('[data-k]');
          if (!c) return;
          var v = load();
          v[c.dataset.k] = c.checked;
          save(v);
          apply(v);
        }));
        dlg.addEventListener('close', (function() {
          d.classList.remove('has-modal');
        }));
      }
      paint();
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      d.classList.add('has-modal');
    };
    var legal = document.querySelector('.k-footer__legal');
    if (legal) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'Erişilebilirlik';
      b.addEventListener('click', open);
      legal.appendChild(b);
    }
    window.FKUI = {
      a11y: open
    };
  })();
})();
