(function() {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var qs = function(s, r) {
    return (r || document).querySelector(s);
  };
  var qsa = function(s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };
  var esc = function(v) {
    return String(v).replace(/[&<>"]/g, (function(c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[c];
    }));
  };
  var num = function(n) {
    return Math.round(n).toLocaleString('tr-TR');
  };
  var tabs = function(root, tabSel, paneSel, key, initial) {
    var ts = qsa(tabSel, root);
    var show = function(k, focus) {
      ts.forEach((function(t) {
        var on = t.dataset[key] === k;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      }));
      qsa(paneSel, root).forEach((function(p) {
        p.hidden = p.getAttribute(paneSel.slice(1, -1)) !== k;
      }));
    };
    ts.forEach((function(t, i) {
      t.addEventListener('click', (function() {
        show(t.dataset[key]);
      }));
      t.addEventListener('keydown', (function(e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) {
          e.preventDefault();
          show(ts[(i + d + ts.length) % ts.length].dataset[key], true);
        }
      }));
    }));
    show(initial);
  };
  var showcase = qs('[data-show]');
  if (showcase) {
    var stabs = qsa('[data-show-tab]', showcase), panes = qsa('[data-show-pane]', showcase);
    var track = qs('.tab__track', showcase), ind = qs('.tab__ind', showcase), cur = 0, timer = null, stopped = reduce, hover = false;
    var place = function() {
      var b = stabs[cur];
      ind.style.transform = 'translate(' + b.offsetLeft + 'px,' + b.offsetTop + 'px)';
    };
    var go = function(i, focus) {
      cur = (i + stabs.length) % stabs.length;
      track.style.setProperty('--i', cur);
      stabs.forEach((function(t, k) {
        var on = k === cur;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      }));
      panes.forEach((function(p, k) {
        var on = k === cur;
        p.classList.toggle('is-on', on);
        p.setAttribute('aria-hidden', on ? 'false' : 'true');
        p.inert = !on;
      }));
      place();
    };
    var stop = function() {
      stopped = true;
      clearInterval(timer);
    };
    stabs.forEach((function(t, i) {
      t.addEventListener('click', (function() {
        stop();
        showcase.style.setProperty('--boot', '0s');
        go(i);
      }));
      t.addEventListener('keydown', (function(e) {
        var d = /Right|Down/.test(e.key) ? 1 : /Left|Up/.test(e.key) ? -1 : 0;
        if (d) {
          e.preventDefault();
          stop();
          showcase.style.setProperty('--boot', '0s');
          go(cur + d, true);
        }
      }));
    }));
    showcase.addEventListener('pointerenter', (function() {
      hover = true;
    }));
    showcase.addEventListener('pointerleave', (function() {
      hover = false;
    }));
    go(0);
    requestAnimationFrame((function() {
      showcase.classList.add('is-ready');
    }));
    window.addEventListener('resize', place, {
      passive: true
    });
    var visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver((function(en) {
      visible = en[0].isIntersecting;
    })).observe(showcase);
    if (!stopped) setTimeout((function() {
      timer = setInterval((function() {
        if (stopped || hover || !visible || document.hidden) return;
        showcase.style.setProperty('--boot', '0s');
        go(cur + 1);
      }), 5000);
    }), 1500);
  }
  var form = qs('[data-contact-form]');
  var toForm = function(text, tile) {
    var msg = form && qs('#f-mesaj', form);
    if (!msg) return;
    if (tile) {
      var r = qs('input[name="project_type"][value="' + tile + '"]', form);
      if (r) {
        r.checked = true;
        r.dispatchEvent(new Event('change', {
          bubbles: true
        }));
      }
    }
    msg.value = msg.value.trim() ? msg.value.trim() + '\n\n' + text : text;
    if (form._goStep) form._goStep(qs('input[name="project_type"]:checked', form) ? 1 : 0);
    var c = document.getElementById('iletisim');
    if (c) c.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'start'
    });
  };
  if (form) {
    var subject = qs('[data-subject]', form);
    var msgLabel = qs('[data-msg-label]', form);
    var msg = qs('[data-msg]', form);
    var setMode = function(feedback) {
      form.dataset.mode = feedback ? 'talep' : 'proje';
      qsa('[data-only]', form).forEach((function(el) {
        var on = el.dataset.only === (feedback ? 'talep' : 'proje');
        el.hidden = !on;
        qsa('input, select, textarea', el).forEach((function(i) {
          i.disabled = !on;
        }));
      }));
      var title = qs('#f-baslik', form);
      if (title) title.required = feedback;
      [ '#f-ad', '#f-mail' ].forEach((function(id) {
        var i = qs(id, form);
        if (i) i.required = !feedback;
      }));
      qsa('[data-opt]', form).forEach((function(e) {
        e.hidden = !feedback;
      }));
      subject.value = feedback ? 'kapukaya.dev: istek, öneri veya şikâyet' : 'kapukaya.dev: yeni proje talebi';
      msgLabel.textContent = feedback ? 'İçerik' : 'Mesajınız';
      msg.placeholder = feedback ? 'İsteğinizi, önerinizi veya şikâyetinizi yazın.' : 'İşletmeniz, mevcut durum ve ihtiyacınız hakkında kısa bir bilgi.';
    };
    qsa('input[name="project_type"]', form).forEach((function(r) {
      r.addEventListener('change', (function() {
        setMode(r.hasAttribute('data-feedback') && r.checked);
      }));
    }));
    form.addEventListener('reset', (function() {
      setTimeout((function() {
        setMode(false);
      }), 0);
    }));
    setMode(false);
  }
  var map = qs('[data-map]');
  if (map) {
    qs('[data-map-load]', map).addEventListener('click', (function() {
      var f = qs('[data-map-frame]', map);
      var ifr = document.createElement('iframe');
      ifr.src = 'https://www.google.com/maps?q=Kapukaya%20Development&ll=41.1079234,28.8745592&z=16&hl=tr&output=embed';
      ifr.title = 'Kapukaya Development konumu, Google Haritalar';
      ifr.loading = 'lazy';
      ifr.referrerPolicy = 'strict-origin-when-cross-origin';
      ifr.setAttribute('allowfullscreen', '');
      f.innerHTML = '';
      f.appendChild(ifr);
      f.classList.add('is-loaded');
    }));
  }
  var tools = qs('[data-tools]');
  if (!tools) return;
  tabs(tools, '[data-tool]', '[data-tool-panel]', 'tool', 'hesap');
  (function() {
    var p = qs('[data-tool-panel="hesap"]', tools);
    if (!p) return;
    var inputs = {}, outs = {}, res = {}, last = {};
    qsa('[data-c]', p).forEach((function(i) {
      inputs[i.dataset.c] = i;
    }));
    qsa('[data-o]', p).forEach((function(o) {
      outs[o.dataset.o] = o;
    }));
    qsa('[data-r]', p).forEach((function(o) {
      res[o.dataset.r] = o;
    }));
    var fmt = {
      kisi: function(v) {
        return v + ' kişi';
      },
      dk: function(v) {
        return v + ' dk';
      },
      gun: function(v) {
        return v + ' gün';
      },
      ucret: function(v) {
        return '₺' + num(v);
      }
    };
    var animate = function(el, to, f) {
      var from = last[el.dataset.r] || 0;
      last[el.dataset.r] = to;
      if (reduce) {
        el.textContent = f(to);
        return;
      }
      var t0 = null;
      var tick = function(t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / 380);
        el.textContent = f(from + (to - from) * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    var calc = function() {
      var v = {};
      Object.keys(inputs).forEach((function(k) {
        v[k] = +inputs[k].value;
        outs[k].textContent = fmt[k](v[k]);
        inputs[k].style.setProperty('--p', (v[k] - inputs[k].min) / (inputs[k].max - inputs[k].min) * 100 + '%');
      }));
      var hafta = v.kisi * v.dk * v.gun / 60, yil = hafta * 48;
      animate(res.yil, yil, num);
      animate(res.hafta, hafta, (function(n) {
        return n.toLocaleString('tr-TR', {
          maximumFractionDigits: 1
        });
      }));
      animate(res.gun, yil / 8, num);
      animate(res.tl, yil * v.ucret, (function(n) {
        return '₺' + num(n);
      }));
      animate(res.yarim, yil / 2, num);
      p._v = v;
      p._yil = yil;
    };
    Object.keys(inputs).forEach((function(k) {
      inputs[k].addEventListener('input', calc);
    }));
    calc();
    qs('[data-calc-send]', p).addEventListener('click', (function() {
      var v = p._v;
      toForm('Zaman kaybı hesabı: ' + v.kisi + ' kişi, kişi başı günde ' + v.dk + ' dk, haftada ' + v.gun + ' gün. Tahmini kayıp yılda yaklaşık ' + num(p._yil) + ' saat. Bu işi otomatikleştirmek istiyoruz.', 'Otomasyon');
    }));
  })();
  (function() {
    var p = qs('[data-tool-panel="quiz"]', tools);
    if (!p) return;
    var T = {
      masaustu: {
        t: 'Masaüstü uygulaması',
        tile: 'Masaüstü uygulaması',
        d: 'Ofiste çalışan ekipler için hızlı veri girişi, barkod ve yazıcı desteğiyle bir masaüstü program en verimli çözüm olabilir.',
        u: 'hizmetler/masaustu-uygulamalari.html'
      },
      panel: {
        t: 'Web tabanlı yönetim paneli',
        tile: 'Web paneli',
        d: 'Farklı şubelerden, sahadan veya telefondan erişim gerekiyorsa her cihazda çalışan bir yönetim paneli öne çıkıyor.',
        u: 'hizmetler/yonetim-panelleri.html'
      },
      site: {
        t: 'Kurumsal web sitesi',
        tile: 'Web sitesi',
        d: 'Önceliğiniz yeni müşteri bulmak ve güven vermekse hızlı, mobil uyumlu ve aramalarda görünen bir web sitesiyle başlamak en doğrusu.',
        u: 'hizmetler/kurumsal-web-siteleri.html'
      },
      otomasyon: {
        t: 'Otomasyon ve entegrasyon',
        tile: 'API ve entegrasyon',
        d: 'Tekrar eden işleri ve sistemler arası veri taşımayı arka planda çalışan otomasyonlar ve entegrasyonlar halledebilir.',
        u: 'hizmetler/api-entegrasyon.html'
      },
      eklenti: {
        t: 'Tarayıcı eklentisi',
        tile: 'Tarayıcı eklentisi',
        d: 'İşiniz büyük ölçüde tarayıcıda geçiyorsa belirli bir işi tek tıkla yapan küçük bir Chrome eklentisi çok zaman kazandırabilir.',
        u: 'hizmetler/tarayici-eklentileri.html'
      }
    };
    var Q = [ {
      q: 'Asıl amacınız ne?',
      a: [ [ 'Yeni müşteri bulmak ve tanınmak', {
        site: 3
      } ], [ 'İç işleri düzene sokmak', {
        masaustu: 2,
        panel: 2
      } ], [ 'Tekrar eden işleri otomatikleştirmek', {
        otomasyon: 3
      } ], [ 'Tarayıcıda yaptığım bir işi hızlandırmak', {
        eklenti: 3
      } ] ]
    }, {
      q: 'Yazılımı kimler kullanacak?',
      a: [ [ 'Müşterilerim', {
        site: 2,
        panel: 1
      } ], [ 'Aynı ofisteki ekibim', {
        masaustu: 2
      } ], [ 'Farklı şubeler veya sahadaki ekip', {
        panel: 3
      } ], [ 'Kimse; kendi kendine çalışmalı', {
        otomasyon: 3
      } ] ]
    }, {
      q: 'Hangi cihazlardan kullanılacak?',
      a: [ [ 'Ofisteki Windows bilgisayarlar', {
        masaustu: 2
      } ], [ 'Telefon ve bilgisayar', {
        panel: 2,
        site: 1
      } ], [ 'Yalnızca tarayıcı', {
        eklenti: 1,
        panel: 1
      } ], [ 'Fark etmez', {} ] ]
    }, {
      q: 'Verileriniz şu an nerede?',
      a: [ [ 'Excel veya kâğıt', {
        masaustu: 1,
        panel: 1
      } ], [ 'Başka bir programda', {
        otomasyon: 2
      } ], [ 'Henüz düzenli bir veri yok', {
        site: 1,
        panel: 1
      } ], [ 'Web sitemde ve e-postalarda', {
        site: 1,
        otomasyon: 1
      } ] ]
    } ];
    var step = 0, score = {};
    var focusHead = function() {
      var h = qs('h3', p);
      if (h) h.focus({
        preventScroll: true
      });
    };
    var result = function() {
      var ranked = Object.keys(T).sort((function(a, b) {
        return (score[b] || 0) - (score[a] || 0);
      }));
      var r = T[ranked[0]], second = (score[ranked[1]] || 0) > 0 ? T[ranked[1]] : null;
      p.innerHTML = '<div class="quiz-res"><p class="quiz-res__k">Sonuç</p><h3 tabindex="-1">' + esc(r.t) + '</h3><p>' + esc(r.d) + '</p>' + (second ? '<p class="quiz-res__alt">İkinci güçlü seçenek: <b>' + esc(second.t) + '</b>. Çoğu projede ikisi birlikte de kurgulanabilir.</p>' : '') + '<div class="quiz-res__act"><button type="button" class="btn btn--primary" data-q-offer>Bu konuda teklif isteyin</button><a class="link-more" href="' + r.u + '">Hizmeti inceleyin <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div>' + '<button type="button" class="quiz__back" data-q-again>Testi yeniden başlat</button></div>';
      qs('[data-q-offer]', p).addEventListener('click', (function() {
        toForm('"Hangi yazılım?" testinin sonucu: ' + r.t + '.', r.tile);
      }));
      qs('[data-q-again]', p).addEventListener('click', (function() {
        step = 0;
        score = {};
        Q.forEach((function(q) {
          q._pick = null;
        }));
        render();
        focusHead();
      }));
    };
    var render = function() {
      if (step >= Q.length) return result();
      var q = Q[step];
      p.innerHTML = '<div class="quiz"><div class="quiz__top"><span>Soru ' + (step + 1) + ' / ' + Q.length + '</span><div class="quiz__bar"><i style="width:' + step / Q.length * 100 + '%"></i></div></div>' + '<h3 class="quiz__q" tabindex="-1">' + esc(q.q) + '</h3><div class="quiz__opts">' + q.a.map((function(a, i) {
        return '<button type="button" class="quiz__opt" data-a="' + i + '"><span>' + String.fromCharCode(65 + i) + '</span>' + esc(a[0]) + '</button>';
      })).join('') + '</div>' + (step ? '<button type="button" class="quiz__back" data-back>Geri</button>' : '') + '</div>';
      qsa('[data-a]', p).forEach((function(b) {
        b.addEventListener('click', (function() {
          var w = q.a[+b.dataset.a][1];
          Object.keys(w).forEach((function(k) {
            score[k] = (score[k] || 0) + w[k];
          }));
          q._pick = w;
          step++;
          render();
          focusHead();
        }));
      }));
      var back = qs('[data-back]', p);
      if (back) back.addEventListener('click', (function() {
        step--;
        var w = Q[step]._pick || {};
        Object.keys(w).forEach((function(k) {
          score[k] -= w[k];
        }));
        render();
        focusHead();
      }));
    };
    render();
  })();
  (function() {
    var p = qs('[data-tool-panel="saglik"]', tools);
    if (!p) return;
    var C = [ [ 'Siteniz HTTPS ile (kilit simgesiyle) açılıyor mu?', 'ssl-sertifikasi-https-nedir', 'SSL ve HTTPS' ], [ 'Telefonda yazılar okunaklı, butonlar rahat basılıyor mu?', 'mobil-uyumlu-web-sitesi', 'Mobil uyumluluk' ], [ 'Mobilde sayfa birkaç saniyede açılıyor mu?', 'web-sitesi-hizlandirma', 'Site hızı' ], [ 'Google İşletme Profiliniz güncel mi?', 'yerel-seo-google-isletme-profili', 'Google İşletme Profili' ], [ 'KVKK aydınlatma metni ve çerez tercihleri var mı?', 'cerez-politikasi-hazirlama', 'Çerez ve KVKK metinleri' ], [ 'Son 6 ayda sitede bir içerik güncellendi mi?', 'web-sitesi-bakim-hizmeti', 'Düzenli bakım' ], [ 'İletişim formunu son bir ayda kendiniz test ettiniz mi?', 'iletisim-formu-spam-onleme', 'İletişim formu' ], [ 'Sitenizin düzenli ve sunucu dışında saklanan yedeği var mı?', 'veritabani-yedekleme-stratejisi', 'Yedekleme' ] ];
    var ans = {};
    var draw = function() {
      var done = Object.keys(ans).length, yes = Object.keys(ans).filter((function(k) {
        return ans[k];
      })).length;
      var html = '<div class="health"><ol class="health__list">' + C.map((function(c, i) {
        var v = ans[i];
        return '<li class="' + (v === true ? 'is-yes' : v === false ? 'is-no' : '') + '"><span class="health__q">' + esc(c[0]) + '</span><span class="health__btns" role="group" aria-label="' + esc(c[0]) + '">' + '<button type="button" data-h="' + i + '" data-v="1" aria-pressed="' + (v === true) + '">Evet</button><button type="button" data-h="' + i + '" data-v="0" aria-pressed="' + (v === false) + '">Hayır</button></span></li>';
      })).join('') + '</ol><div class="health__res" aria-live="polite">';
      if (done < C.length) {
        html += '<div class="health__ring" style="--p:' + done / C.length * 100 + '"><b>' + done + '/' + C.length + '</b><small>cevaplandı</small></div><p>Tüm soruları cevapladığınızda sitenizin puanı ve öncelikli öneriler burada görünür.</p>';
      } else {
        var pct = Math.round(yes / C.length * 100);
        var level = pct >= 88 ? [ 'Harika durumda', 'Temeller sağlam. Şimdi büyümeye ve dönüşüme odaklanabilirsiniz.' ] : pct >= 60 ? [ 'İyi ama gelişebilir', 'Birkaç eksik giderildiğinde site çok daha güven verici olur.' ] : [ 'Bakım zamanı gelmiş', 'Eksikler hem ziyaretçi güvenini hem de aramalardaki görünürlüğü etkiliyor.' ];
        var no = C.filter((function(c, i) {
          return ans[i] === false;
        }));
        html += '<div class="health__ring is-done" style="--p:' + pct + '"><b>' + yes + '/' + C.length + '</b><small>puan</small></div><h3>' + level[0] + '</h3><p>' + level[1] + '</p>' + (no.length ? '<p class="health__sub">Öncelikli konular:</p><ul class="health__todo">' + no.map((function(c) {
          return '<li><a href="blog/' + c[1] + '.html">' + esc(c[2]) + '</a></li>';
        })).join('') + '</ul>' : '') + '<div class="health__act"><button type="button" class="btn btn--primary" data-h-send>Sonucu teklif formuna ekle</button><button type="button" class="quiz__back" data-h-reset>Sıfırla</button></div>';
      }
      p.innerHTML = html + '</div></div>';
      qsa('[data-h]', p).forEach((function(b) {
        b.addEventListener('click', (function() {
          ans[+b.dataset.h] = b.dataset.v === '1';
          draw();
          var nb = qs('[data-h="' + b.dataset.h + '"][data-v="' + b.dataset.v + '"]', p);
          if (nb) nb.focus({
            preventScroll: true
          });
        }));
      }));
      var send = qs('[data-h-send]', p);
      if (send) send.addEventListener('click', (function() {
        var no = C.filter((function(c, i) {
          return ans[i] === false;
        })).map((function(c) {
          return c[2];
        }));
        toForm('Web sitesi sağlık testi: ' + yes + '/' + C.length + '.' + (no.length ? ' Eksikler: ' + no.join(', ') + '.' : '') + ' Sitemizi değerlendirmenizi istiyoruz.', 'Web sitesi');
      }));
      var rs = qs('[data-h-reset]', p);
      if (rs) rs.addEventListener('click', (function() {
        ans = {};
        draw();
      }));
    };
    draw();
  })();
  (function() {
    var p = qs('[data-tool-panel="ozet"]', tools);
    if (!p) return;
    var f = {};
    qsa('[data-b]', p).forEach((function(i) {
      f[i.dataset.b] = i;
    }));
    var out = qs('[data-b-out]', p);
    var text = function() {
      var isl = f.isletme.value.trim(), sor = f.sorun.value.trim();
      if (!isl && !sor) return '';
      return (isl ? 'İşletme: ' + isl + '.\n' : '') + (sor ? 'Çözülmesini istediğimiz konu: ' + sor + '.\n' : '') + 'Kullanacaklar: ' + f.kim.value + '.\nZamanlama: ' + f.zaman.value + '.';
    };
    var draw = function() {
      var t = text();
      out.textContent = t || 'Soruları doldurdukça özetiniz burada oluşacak.';
      out.classList.toggle('is-filled', !!t);
    };
    Object.keys(f).forEach((function(k) {
      f[k].addEventListener('input', draw);
      f[k].addEventListener('change', draw);
    }));
    qs('[data-b-send]', p).addEventListener('click', (function() {
      var t = text();
      if (!t) {
        f.isletme.focus();
        return;
      }
      toForm('Proje özeti:\n' + t, null);
    }));
    draw();
  })();
  var copyText = function(text, btn) {
    var done = function() {
      var o = btn.innerHTML;
      btn.classList.add('is-done');
      btn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>' + (btn.classList.contains('gen__btn') ? '' : 'Kopyalandı');
      setTimeout((function() {
        btn.classList.remove('is-done');
        btn.innerHTML = o;
      }), 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, (function() {})); else {
      var t = document.createElement('textarea');
      t.value = text;
      t.setAttribute('readonly', '');
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      try {
        document.execCommand('copy');
        done();
      } catch (e) {}
      t.remove();
    }
  };
  (function() {
    var p = qs('[data-tool-panel="sifre"]', tools);
    if (!p) return;
    var input = qs('[data-pw]', p), bar = qs('[data-pw-bar]', p), level = qs('[data-pw-level]', p), tips = qs('[data-pw-tips]', p);
    var common = [ '123456', '12345678', '123456789', 'password', 'qwerty', 'sifre', 'şifre', 'parola', 'admin', 'galatasaray', 'fenerbahce', 'fenerbahçe', 'besiktas', 'beşiktaş', 'trabzonspor', 'istanbul', 'ankara', 'turkiye', 'türkiye', '111111', '000000', 'abc123', 'iloveyou', 'asdasd' ];
    var check = function(pw) {
      var low = pw.toLocaleLowerCase('tr');
      var sets = 0, t = [];
      if (/[a-zçğıöşü]/.test(pw)) sets += 26; else t.push('Küçük harf ekleyin.');
      if (/[A-ZÇĞİÖŞÜ]/.test(pw)) sets += 26; else t.push('Büyük harf ekleyin.');
      if (/\d/.test(pw)) sets += 10; else t.push('Rakam ekleyin.');
      if (/[^A-Za-z0-9çğıöşüÇĞİÖŞÜ]/.test(pw)) sets += 32; else t.push('Sembol ekleyin (ör. ! ? . -).');
      var bits = pw.length * Math.log(Math.max(sets, 1)) / Math.LN2;
      if (common.some((function(c) {
        return low.indexOf(c) !== -1;
      }))) {
        bits = Math.min(bits, 20);
        t.unshift('Yaygın bir kelime veya dizi içeriyor; tahmin edilmesi kolay.');
      }
      if (/(.)\1\1/.test(pw)) {
        bits -= 10;
        t.push('Aynı karakteri arka arkaya tekrar etmeyin.');
      }
      if (/(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf)/i.test(pw)) {
        bits -= 12;
        t.push('Ardışık karakter dizilerinden kaçının.');
      }
      if (/(19|20)\d{2}/.test(pw)) {
        bits -= 6;
        t.push('Doğum yılı gibi tahmin edilebilir tarihler kullanmayın.');
      }
      if (pw.length < 12) t.push('En az 12 karakter kullanın; uzunluk en etkili korumadır.');
      return {
        bits: Math.max(0, bits),
        tips: t
      };
    };
    var draw = function() {
      var pw = input.value;
      if (!pw) {
        bar.style.width = '0';
        bar.className = '';
        level.textContent = 'Bir şifre yazın';
        tips.innerHTML = '';
        return;
      }
      var r = check(pw);
      var lv = r.bits < 36 ? [ 'Zayıf', 'is-bad', 25 ] : r.bits < 60 ? [ 'Orta', 'is-mid', 55 ] : r.bits < 80 ? [ 'Güçlü', 'is-good', 80 ] : [ 'Çok güçlü', 'is-great', 100 ];
      bar.style.width = lv[2] + '%';
      bar.className = lv[1];
      level.textContent = lv[0];
      tips.innerHTML = (r.tips.length ? r.tips : [ 'İyi görünüyor. Bu şifreyi başka hiçbir sitede kullanmayın ve iki adımlı doğrulamayı açın.' ]).slice(0, 3).map((function(x) {
        return '<li>' + esc(x) + '</li>';
      })).join('');
    };
    input.addEventListener('input', draw);
    qs('[data-pw-show]', p).addEventListener('change', (function(e) {
      input.type = e.target.checked ? 'text' : 'password';
    }));
    var out = qs('[data-gen-out]', p), len = qs('[data-gen-len]', p), lenO = qs('[data-gen-len-o]', p);
    var opt = function(k) {
      return qs('[data-gen-opt="' + k + '"]', p).checked;
    };
    var rand = function(n) {
      var a = new Uint32Array(1), lim = Math.floor(4294967296 / n) * n;
      do {
        crypto.getRandomValues(a);
      } while (a[0] >= lim);
      return a[0] % n;
    };
    var gen = function() {
      var easy = opt('easy');
      var lower = easy ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
      var upper = easy ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      var digit = easy ? '23456789' : '0123456789';
      var symbol = '!@#$%&*-_=+?.';
      var groups = [ lower ];
      if (opt('upper')) groups.push(upper);
      if (opt('digit')) groups.push(digit);
      if (opt('symbol')) groups.push(symbol);
      var n = +len.value, all = groups.join(''), chars = groups.map((function(g) {
        return g[rand(g.length)];
      }));
      while (chars.length < n) chars.push(all[rand(all.length)]);
      for (var i = chars.length - 1; i > 0; i--) {
        var j = rand(i + 1), t = chars[i];
        chars[i] = chars[j];
        chars[j] = t;
      }
      lenO.textContent = n + ' karakter';
      len.style.setProperty('--p', (n - len.min) / (len.max - len.min) * 100 + '%');
      out.textContent = chars.join('');
      out.classList.remove('is-new');
      void out.offsetWidth;
      out.classList.add('is-new');
    };
    len.addEventListener('input', gen);
    qsa('[data-gen-opt]', p).forEach((function(c) {
      c.addEventListener('change', gen);
    }));
    qs('[data-gen-new]', p).addEventListener('click', gen);
    qs('[data-gen-copy]', p).addEventListener('click', (function(e) {
      copyText(out.textContent, e.currentTarget);
    }));
    if (window.crypto && crypto.getRandomValues) gen();
  })();
  (function() {
    var p = qs('[data-tool-panel="qr"]', tools);
    if (!p) return;
    var canvas = qs('[data-qr-canvas]', p), empty = qs('[data-qr-empty]', p), dl = qs('[data-qr-dl]', p), lib = null, loading = false;
    var f = {};
    qsa('[data-qr]', p).forEach((function(i) {
      f[i.dataset.qr] = i;
    }));
    var type = function() {
      return qs('[data-qr-type]:checked', p).value;
    };
    var wesc = function(v) {
      return v.replace(/([\;,:"])/g, '\\$1');
    };
    var payload = function() {
      var t = type();
      if (t === 'url') {
        var u = f.url.value.trim();
        if (u && !/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
        return u;
      }
      if (t === 'wifi') {
        var ss = f.ssid.value.trim();
        if (!ss) return '';
        var sec = f.wsec.value;
        return 'WIFI:T:' + sec + ';S:' + wesc(ss) + ';' + (sec !== 'nopass' ? 'P:' + wesc(f.wpass.value) + ';' : '') + ';';
      }
      if (t === 'tel') {
        var n = f.tel.value.replace(/[^\d+]/g, '');
        return n ? 'tel:' + n : '';
      }
      return f.text.value.trim();
    };
    var render = function() {
      var data = payload();
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!data || !lib) {
        empty.hidden = !!data && !!lib;
        canvas.classList.remove('is-on');
        dl.setAttribute('aria-disabled', 'true');
        dl.removeAttribute('href');
        return;
      }
      lib.stringToBytes = lib.stringToBytesFuncs['UTF-8'];
      var q = lib(0, 'M');
      q.addData(data, 'Byte');
      try {
        q.make();
      } catch (e) {
        empty.hidden = false;
        empty.textContent = 'Metin QR kod için çok uzun.';
        return;
      }
      var count = q.getModuleCount(), quiet = 4, size = 720, cell = Math.floor(size / (count + quiet * 2)), px = cell * (count + quiet * 2);
      canvas.width = canvas.height = px;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, px, px);
      ctx.fillStyle = '#111';
      for (var r = 0; r < count; r++) for (var c = 0; c < count; c++) if (q.isDark(r, c)) ctx.fillRect((c + quiet) * cell, (r + quiet) * cell, cell, cell);
      empty.hidden = true;
      empty.textContent = 'Bilgileri girdiğinizde QR kodunuz burada görünecek.';
      canvas.classList.add('is-on');
      dl.href = canvas.toDataURL('image/png');
      dl.removeAttribute('aria-disabled');
    };
    var load = function() {
      if (lib || loading) return;
      loading = true;
      var sc = document.createElement('script');
      sc.src = 'assets/js/vendor/qrcode.min.js';
      sc.onload = function() {
        lib = window.qrcode;
        render();
      };
      document.head.appendChild(sc);
    };
    qs('[data-tool="qr"]', tools).addEventListener('click', load);
    p.addEventListener('focusin', load);
    qsa('[data-qr-type]', p).forEach((function(r) {
      r.addEventListener('change', (function() {
        qsa('[data-qr-f]', p).forEach((function(g) {
          g.hidden = g.dataset.qrF !== type();
        }));
        render();
      }));
    }));
    Object.keys(f).forEach((function(k) {
      f[k].addEventListener('input', render);
      f[k].addEventListener('change', render);
    }));
    dl.addEventListener('click', (function(e) {
      if (dl.getAttribute('aria-disabled') === 'true') e.preventDefault();
    }));
  })();
  (function() {
    var p = qs('[data-tool-panel="kdv"]', tools);
    if (!p) return;
    var tutar = qs('[data-kdv="tutar"]', p), r = {};
    qsa('[data-kdv-r]', p).forEach((function(e) {
      r[e.dataset.kdvR] = e;
    }));
    var tl = function(n) {
      return '₺' + n.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };
    var parse = function(v) {
      v = String(v).replace(/[^\d.,]/g, '');
      if (v.indexOf(',') !== -1) v = v.replace(/\./g, '').replace(',', '.'); else if (/\.\d{3}(\.|$)/.test(v)) v = v.replace(/\./g, '');
      return parseFloat(v) || 0;
    };
    var calc = function() {
      var a = parse(tutar.value), rate = +qs('[data-kdv-oran]:checked', p).value / 100, inc = qs('[data-kdv-yon]:checked', p).value === 'dahil';
      var net = inc ? a / (1 + rate) : a, k = net * rate;
      r.net.textContent = tl(net);
      r.kdv.textContent = tl(k);
      r.brut.textContent = tl(net + k);
      p._t = 'KDV hariç: ' + tl(net) + '\nKDV (%' + rate * 100 + '): ' + tl(k) + '\nKDV dahil: ' + tl(net + k);
    };
    tutar.addEventListener('input', calc);
    qsa('[data-kdv-oran], [data-kdv-yon]', p).forEach((function(i) {
      i.addEventListener('change', calc);
    }));
    qs('[data-kdv-copy]', p).addEventListener('click', (function(e) {
      copyText(p._t, e.currentTarget);
    }));
    calc();
  })();
  (function() {
    var p = qs('[data-tool-panel="serp"]', tools);
    if (!p) return;
    var f = {}, o = {}, c = {};
    qsa('[data-serp]', p).forEach((function(i) {
      f[i.dataset.serp] = i;
    }));
    qsa('[data-serp-o]', p).forEach((function(i) {
      o[i.dataset.serpO] = i;
    }));
    qsa('[data-serp-c]', p).forEach((function(i) {
      c[i.dataset.serpC] = i;
    }));
    var tips = qs('[data-serp-tips]', p), fav = qs('[data-serp-fav]', p);
    var ctx = document.createElement('canvas').getContext('2d');
    var width = function(t, font) {
      ctx.font = font;
      return ctx.measureText(t).width;
    };
    var cut = function(t, max, font) {
      if (width(t, font) <= max) return t;
      while (t.length && width(t + ' ...', font) > max) t = t.slice(0, -1);
      return t.replace(/\s+\S*$/, '') + ' ...';
    };
    var draw = function() {
      var title = f.title.value.trim() || 'Sayfa başlığı', desc = f.desc.value.trim(), url = f.url.value.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
      var host = url.split('/')[0] || 'isletmeniz.com', path = url.split('/').slice(1).filter(Boolean);
      var tw = width(title, '20px Arial');
      o.title.textContent = cut(title, 580, '20px Arial');
      o.desc.textContent = cut(desc || 'Açıklama yazmazsanız Google sayfadan kendisi bir bölüm seçer.', 920, '14px Arial');
      o.name.textContent = host.replace(/^www\./, '');
      o.url.textContent = 'https://' + host + (path.length ? ' › ' + path.join(' › ') : '');
      fav.textContent = (host.replace(/^www\./, '')[0] || 'i').toLocaleUpperCase('tr');
      c.title.textContent = '(' + f.title.value.length + ' karakter)';
      c.desc.textContent = '(' + f.desc.value.length + ' karakter)';
      var t = [];
      if (tw > 580) t.push('Başlık uzun; Google sonunu kesecek. Önemli kelimeleri başa alın.'); else if (title.length < 30) t.push('Başlık kısa; ne sunduğunuzu ve şehrinizi eklemeyi düşünün.');
      if (!desc) t.push('Bir açıklama yazın; sonuçlarda tıklanmayı artırır.'); else if (desc.length > 160) t.push('Açıklama 160 karakteri geçiyor; büyük ihtimalle kesilecek.'); else if (desc.length < 70) t.push('Açıklama kısa; hizmetinizi ve farkınızı bir cümleyle anlatın.');
      if (!t.length) t.push('Başlık ve açıklama uzunlukları iyi görünüyor.');
      tips.innerHTML = t.map((function(x) {
        return '<li>' + esc(x) + '</li>';
      })).join('');
    };
    Object.keys(f).forEach((function(k) {
      f[k].addEventListener('input', draw);
    }));
    draw();
  })();
})();
