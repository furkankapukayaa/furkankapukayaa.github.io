(function() {
  'use strict';
  var root = document.querySelector('[data-tablet]');
  if (!root) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-motion');
  var qs = function(s, r) {
    return (r || root).querySelector(s);
  };
  var qsa = function(s, r) {
    return Array.prototype.slice.call((r || root).querySelectorAll(s));
  };
  var esc = function(v) {
    return String(v).replace(/[&<>"]/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
  var tl = function(n) {
    return '₺' + Math.round(n).toLocaleString('tr-TR');
  };
  var screen = qs('.tab__screen'), os = qs('[data-os]'), home = qs('[data-home]'), win = qs('[data-win]');
  var body = qs('[data-win-body]'), title = qs('[data-win-title]'), right = qs('[data-win-right]'), toast = qs('[data-toast]');
  var current = null, opener = null, cleanup = null;

  var pad = function(n) {
    return (n < 10 ? '0' : '') + n;
  };
  var tick = function() {
    var d = new Date(), t = pad(d.getHours()) + ':' + pad(d.getMinutes());
    qsa('[data-clock], [data-clock-big]').forEach(function(e) {
      e.textContent = t;
    });
    qs('[data-date]').textContent = d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  };
  tick();
  setInterval(tick, 15000);

  var appts = {
    bugun: [
      { t: '14:30', n: 'Saç kesimi', c: 'Ahmet Y.', s: 'ok', p: 450 },
      { t: '15:15', n: 'Sakal tasarımı', c: 'Murat K.', s: 'ok', p: 300 },
      { t: '16:00', n: 'Damat paketi', c: 'Emre D.', s: 'wait', p: 2500 },
      { t: '17:00', n: 'Saç ve sakal', c: 'Can T.', s: 'new', p: 650 }
    ],
    yarin: [
      { t: '10:00', n: 'Saç kesimi', c: 'Burak A.', s: 'ok', p: 450 },
      { t: '11:30', n: 'Cilt bakımı', c: 'Kerem S.', s: 'new', p: 800 }
    ]
  };
  var ST = { ok: ['Onaylandı', 'ok'], wait: ['Ertelendi', 'wait'], bad: ['İptal', 'bad'], new: ['Bekliyor', 'new'] };
  var stock = [
    { n: '205/55 R16 lastik', q: 48 },
    { n: 'Motor yağı 5W-30', q: 9 },
    { n: 'Silecek seti', q: 3 },
    { n: 'Akü 60 Ah', q: 21 },
    { n: 'Fren balatası', q: 12 },
    { n: 'Antifriz 3 L', q: 30 }
  ];
  var nextAppt = function() {
    var a = appts.bugun.filter(function(x) {
      return x.s !== 'bad';
    })[0];
    qs('[data-next]').textContent = a ? a.t + ' · ' + a.n : 'Bugün randevu yok';
    qs('[data-next-sub]').textContent = a ? a.c + ' · ' + ST[a.s][0] : 'Yeni randevular burada görünür';
  };
  nextAppt();

  var say = function(text, ms) {
    var n = document.createElement('div');
    n.className = 'os__snack';
    n.textContent = text;
    os.appendChild(n);
    setTimeout(function() {
      n.classList.add('is-out');
      setTimeout(function() {
        n.remove();
      }, 400);
    }, ms || 1800);
  };

  var APPS = {
    randevu: {
      t: 'Randevular',
      draw: function(b) {
        var day = 'bugun', open = -1;
        var render = function() {
          var list = appts[day];
          var count = function(s) {
            return list.filter(function(x) {
              return x.s === s;
            }).length;
          };
          var ciro = list.filter(function(x) {
            return x.s === 'ok';
          }).reduce(function(a, x) {
            return a + x.p;
          }, 0);
          b.innerHTML = '<div class="seg seg--os"><button type="button" data-day="bugun"' + (day === 'bugun' ? ' class="is-on"' : '') + '>Bugün</button><button type="button" data-day="yarin"' + (day === 'yarin' ? ' class="is-on"' : '') + '>Yarın</button></div>' +
            '<div class="ui-kpis"><div><small>Randevu</small><b>' + list.length + '</b></div><div><small>Onaylı</small><b>' + count('ok') + '</b></div><div><small>Onaylı ciro</small><b>' + tl(ciro) + '</b></div></div>' +
            '<ul class="os-list">' + list.map(function(x, i) {
              return '<li class="' + (i === open ? 'is-open' : '') + '"><button type="button" class="os-list__row" data-i="' + i + '" aria-expanded="' + (i === open) + '"><span class="os-list__t">' + x.t + '</span><span class="os-list__n"><b>' + esc(x.n) + '</b><small>' + esc(x.c) + ' · ' + tl(x.p) + '</small></span><em class="' + ST[x.s][1] + '">' + ST[x.s][0] + '</em></button>' +
                (i === open ? '<div class="os-list__acts"><button type="button" data-act="ok"><i class="fa-solid fa-check" aria-hidden="true"></i>Onayla</button><button type="button" data-act="wait"><i class="fa-regular fa-clock" aria-hidden="true"></i>Ertele</button><button type="button" data-act="bad"><i class="fa-solid fa-xmark" aria-hidden="true"></i>İptal</button></div>' : '') + '</li>';
            }).join('') + '</ul>';
        };
        b.addEventListener('click', function(e) {
          var d = e.target.closest('[data-day]'), r = e.target.closest('[data-i]'), a = e.target.closest('[data-act]');
          if (d) {
            day = d.dataset.day;
            open = -1;
          } else if (r) {
            open = open === +r.dataset.i ? -1 : +r.dataset.i;
          } else if (a) {
            var x = appts[day][open];
            x.s = a.dataset.act;
            if (x.s === 'wait') {
              var h = Math.min(20, +x.t.slice(0, 2) + 1);
              x.t = pad(h) + x.t.slice(2);
            }
            say(x.c + ': ' + ST[x.s][0].toLocaleLowerCase('tr') + (x.s === 'wait' ? ' (' + x.t + ')' : '') + '. Müşteriye e-posta gönderildi.', 2400);
            open = -1;
            nextAppt();
          } else return;
          render();
        });
        right.innerHTML = '<button type="button" class="os__plus" aria-label="Yeni randevu ekle"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>';
        right.firstChild.addEventListener('click', function() {
          var names = ['Deniz B.', 'Okan M.', 'Selim R.', 'Berk Ö.'], svc = [['Saç kesimi', 450], ['Sakal tasarımı', 300], ['Saç ve sakal', 650]];
          var sv = svc[Math.floor(Math.random() * svc.length)], list = appts[day], last = list.length ? +list[list.length - 1].t.slice(0, 2) : 9;
          list.push({ t: pad(Math.min(21, last + 1)) + ':00', n: sv[0], c: names[Math.floor(Math.random() * names.length)], s: 'new', p: sv[1] });
          open = list.length - 1;
          render();
          say('Yeni randevu eklendi. Onaylayınca müşteriye takvim daveti gider.', 2400);
        });
        render();
      }
    },
    web: {
      t: 'Tarayıcı',
      draw: function(b) {
        var hist = [], page = 'home';
        var homes = [
          { id: 'moda', n: '3+1 Daire', y: 'Moda', f: '₺14.500.000', m: '145 m²' },
          { id: 'goztepe', n: '2+1 Daire', y: 'Göztepe', f: '₺9.200.000', m: '95 m²' },
          { id: 'bostanci', n: 'Dükkân', y: 'Bostancı', f: '₺38.000 / ay', m: '80 m²' }
        ];
        var P = {
          home: function() {
            return '<div class="ui-site__hero"><b>Aradığınız ev, tek tıkla.</b><span>Kadıköy ve Ataşehir\'de 120\'den fazla güncel ilan.</span><button type="button" data-go="portfoy">İlanları görün</button></div>' + cards();
          },
          portfoy: function() {
            return '<div class="ws-h">Portföy <small>' + homes.length + ' ilan</small></div>' + cards();
          },
          iletisim: function() {
            return '<div class="ws-h">İletişim</div><form class="ws-form" data-ws-form><input type="text" placeholder="Adınız" required><input type="tel" placeholder="Telefonunuz" required><button type="submit">Beni arayın</button></form>';
          }
        };
        var cards = function() {
          return '<div class="ui-site__cards">' + homes.map(function(h, i) {
            return '<button type="button" data-go="ilan-' + h.id + '"><i style="--hue:' + (25 + i * 80) + '"></i>' + h.n + '<small>' + h.y + '</small></button>';
          }).join('') + '</div>';
        };
        var url = function() {
          return 'kentemlak.com' + (page === 'home' ? '' : '/' + page);
        };
        var render = function() {
          var html;
          if (page.indexOf('ilan-') === 0) {
            var h = homes.filter(function(x) {
              return 'ilan-' + x.id === page;
            })[0];
            html = '<div class="ws-ilan"><i style="--hue:' + (25 + homes.indexOf(h) * 80) + '"></i><div><b>' + h.n + ' · ' + h.y + '</b><span>' + h.m + ' · ' + h.f + '</span><button type="button" data-go="iletisim">Bu ilan için arayın</button></div></div>';
          } else html = P[page]();
          b.innerHTML = '<div class="ws-bar"><button type="button" data-back aria-label="Geri"' + (hist.length ? '' : ' disabled') + '><i class="fa-solid fa-arrow-left" aria-hidden="true"></i></button><span class="ws-url"><i class="fa-solid fa-lock" aria-hidden="true"></i>' + url() + '</span><button type="button" data-reload aria-label="Yenile"><i class="fa-solid fa-rotate" aria-hidden="true"></i></button></div>' +
            '<div class="ui-site ws-page"><div class="ui-site__nav"><button type="button" data-go="home"><b>Kent Emlak</b></button><button type="button" data-go="portfoy">Portföy</button><button type="button" data-go="iletisim">İletişim</button></div>' + html + '</div>';
        };
        b.addEventListener('click', function(e) {
          var g = e.target.closest('[data-go]');
          if (g && g.dataset.go !== page) {
            hist.push(page);
            page = g.dataset.go;
            render();
          } else if (e.target.closest('[data-back]') && hist.length) {
            page = hist.pop();
            render();
          } else if (e.target.closest('[data-reload]')) {
            var pg = qs('.ws-page', b);
            pg.classList.add('is-load');
            setTimeout(render, 350);
          }
        });
        b.addEventListener('submit', function(e) {
          e.preventDefault();
          e.target.outerHTML = '<p class="ws-ok"><i class="fa-solid fa-check" aria-hidden="true"></i>Talebiniz alındı. Danışmanımız sizi arayacak.</p>';
        });
        render();
      }
    },
    stok: {
      t: 'Stok',
      draw: function(b) {
        var filter = '';
        var st = function(q) {
          return q < 5 ? ['Kritik', 'bad'] : q < 15 ? ['Azalıyor', 'wait'] : ['Yeterli', 'ok'];
        };
        b.innerHTML = '<label class="os-search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input type="search" placeholder="Ürün ara" aria-label="Ürün ara"></label><div class="os-sum" data-sum></div><table class="ui-table"><thead><tr><th>Ürün</th><th>Adet</th><th>Durum</th></tr></thead><tbody data-rows></tbody></table>';
        var rows = qs('[data-rows]', b), sum = qs('[data-sum]', b);
        var render = function() {
          var low = filter.toLocaleLowerCase('tr');
          rows.innerHTML = stock.map(function(x, i) {
            if (low && x.n.toLocaleLowerCase('tr').indexOf(low) === -1) return '';
            var s = st(x.q);
            return '<tr><td>' + esc(x.n) + '</td><td><span class="qty"><button type="button" data-d="-1" data-i="' + i + '" aria-label="Azalt">−</button><b>' + x.q + '</b><button type="button" data-d="1" data-i="' + i + '" aria-label="Artır">+</button></span></td><td><em class="' + s[1] + '">' + s[0] + '</em></td></tr>';
          }).join('') || '<tr><td colspan="3" class="os-empty">Sonuç bulunamadı</td></tr>';
          var crit = stock.filter(function(x) {
            return x.q < 5;
          }).length;
          sum.innerHTML = '<span><b>' + stock.reduce(function(a, x) {
            return a + x.q;
          }, 0) + '</b> ürün stokta</span><span class="' + (crit ? 'bad' : 'ok') + '">' + (crit ? crit + ' kritik ürün' : 'Kritik ürün yok') + '</span>';
        };
        qs('input', b).addEventListener('input', function(e) {
          filter = e.target.value.trim();
          render();
        });
        rows.addEventListener('click', function(e) {
          var btn = e.target.closest('[data-d]');
          if (!btn) return;
          var x = stock[+btn.dataset.i], before = st(x.q)[1];
          x.q = Math.max(0, x.q + +btn.dataset.d);
          render();
          if (before !== 'bad' && st(x.q)[1] === 'bad') say(x.n + ' kritik seviyede. Satın almaya bildirim gönderildi.', 2400);
        });
        render();
      }
    },
    entegre: {
      t: 'Entegrasyon',
      draw: function(b) {
        var total = 1284, running = false, timers = [];
        b.innerHTML = '<div class="ui-flow" aria-hidden="true"><span>ERP</span><i></i><span class="is-core">Aktarım</span><i></i><span>Pazaryeri</span></div>' +
          '<div class="ui-sync"><span data-sync-l>Son eşitleme 14:00</span><b data-sync-n>' + total.toLocaleString('tr-TR') + '</b><i style="--w:100%"></i></div>' +
          '<button type="button" class="os-btn" data-sync><i class="fa-solid fa-rotate" aria-hidden="true"></i>Şimdi eşitle</button><ul class="ui-log" data-log><li><em class="ok">Tamam</em>142 ürünün stoğu güncellendi</li><li><em class="ok">Tamam</em>18 sipariş ERP\'ye aktarıldı</li></ul>';
        var bar = qs('.ui-sync i', b), log = qs('[data-log]', b), btn = qs('[data-sync]', b);
        var steps = [['Pazaryeri siparişleri okundu', 6], ['Siparişler ERP\'ye aktarıldı', 6], ['e-Arşiv faturalar oluşturuldu', 6], ['Stoklar pazaryerine gönderildi', 38]];
        btn.addEventListener('click', function() {
          if (running) return;
          running = true;
          btn.disabled = true;
          btn.classList.add('is-run');
          bar.style.setProperty('--w', '0%');
          qs('[data-sync-l]', b).textContent = 'Eşitleniyor…';
          steps.forEach(function(s, i) {
            timers.push(setTimeout(function() {
              bar.style.setProperty('--w', (i + 1) / steps.length * 100 + '%');
              var li = document.createElement('li');
              li.innerHTML = '<em class="ok">Tamam</em>' + s[0] + ' (' + s[1] + ')';
              log.insertBefore(li, log.firstChild);
              while (log.children.length > 4) log.lastChild.remove();
              total += s[1];
              qs('[data-sync-n]', b).textContent = total.toLocaleString('tr-TR');
              if (i === steps.length - 1) {
                var d = new Date();
                qs('[data-sync-l]', b).textContent = 'Son eşitleme ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
                btn.disabled = false;
                btn.classList.remove('is-run');
                running = false;
                say('Eşitleme tamamlandı, hata yok.');
              }
            }, reduce ? 0 : 650 * (i + 1)));
          });
        });
        return function() {
          timers.forEach(clearTimeout);
        };
      }
    },
    rapor: {
      t: 'Raporlar',
      draw: function(b) {
        var D = {
          hafta: { l: ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'], v: [42, 58, 51, 73, 64, 88, 70], k: 1000, c: '+%12' },
          ay: { l: ['1. hf', '2. hf', '3. hf', '4. hf'], v: [310, 355, 340, 410], k: 1000, c: '+%8' },
          yil: { l: ['O', 'Ş', 'M', 'N', 'M', 'H', 'T', 'A', 'E', 'E', 'K', 'A'], v: [9, 10, 12, 11, 13, 14, 15, 14, 16, 17, 18, 19], k: 100000, c: '+%31' }
        };
        var per = 'hafta';
        b.innerHTML = '<div class="seg seg--os" data-per><button type="button" data-p="hafta" class="is-on">Hafta</button><button type="button" data-p="ay">Ay</button><button type="button" data-p="yil">Yıl</button></div><div class="os-total"><small>Toplam ciro</small><b data-tot>₺0</b><em class="ok" data-chg></em></div><div class="os-chart" data-chart></div>';
        var chart = qs('[data-chart]', b);
        var render = function() {
          var d = D[per], max = Math.max.apply(null, d.v), sum = d.v.reduce(function(a, x) {
            return a + x;
          }, 0);
          qsa('[data-p]', b).forEach(function(x) {
            x.classList.toggle('is-on', x.dataset.p === per);
          });
          qs('[data-tot]', b).textContent = tl(sum * d.k);
          qs('[data-chg]', b).textContent = d.c + ' önceki döneme göre';
          chart.innerHTML = d.v.map(function(v, i) {
            return '<span title="' + d.l[i] + ': ' + tl(v * d.k) + '"><i style="--h:' + (v / max).toFixed(3) + ';--n:' + i + '"></i><small>' + d.l[i] + '</small></span>';
          }).join('');
        };
        qs('[data-per]', b).addEventListener('click', function(e) {
          var x = e.target.closest('[data-p]');
          if (!x) return;
          per = x.dataset.p;
          render();
        });
        render();
      }
    },
    mesaj: {
      t: 'Mesajlar',
      draw: function(b) {
        var QA = [
          ['Hangi işleri yapıyorsunuz?', 'Masaüstü programlar, web siteleri, yönetim panelleri, entegrasyonlar ve tarayıcı eklentileri. Hepsi işletmenizin iş akışına göre sıfırdan tasarlanır.'],
          ['Fiyat nasıl belirleniyor?', 'Kapsam, ekran sayısı ve entegrasyonlara göre. Kısa bir görüşmeden sonra kalem kalem, sabit fiyatlı bir teklif hazırlarım.'],
          ['Ne kadar sürer?', 'Kurumsal bir site genellikle 2-4 hafta, panel veya masaüstü uygulama 1-3 ay sürer. İlk çalışan sürümü erkenden görürsünüz.'],
          ['Teklif almak istiyorum', 'Harika! Aşağıdaki formu doldurmanız yeterli, en geç 1 iş günü içinde dönüş yaparım.']
        ];
        var used = {}, busy = false, timers = [];
        b.innerHTML = '<div class="chat" data-chat><div class="chat__m"><span class="chat__av">FK</span><p>Merhaba! Ben Furkan. Size nasıl yardımcı olabilirim?</p></div></div><div class="chat__q" data-q></div>';
        var chat = qs('[data-chat]', b), q = qs('[data-q]', b);
        var chips = function() {
          q.innerHTML = QA.map(function(x, i) {
            return used[i] ? '' : '<button type="button" data-qi="' + i + '">' + x[0] + '</button>';
          }).join('');
        };
        var add = function(html, me) {
          var m = document.createElement('div');
          m.className = 'chat__m' + (me ? ' chat__m--me' : '');
          m.innerHTML = (me ? '' : '<span class="chat__av">FK</span>') + html;
          chat.appendChild(m);
          chat.scrollTop = chat.scrollHeight;
          return m;
        };
        q.addEventListener('click', function(e) {
          var x = e.target.closest('[data-qi]');
          if (!x || busy) return;
          var i = +x.dataset.qi;
          used[i] = true;
          busy = true;
          chips();
          add('<p>' + esc(QA[i][0]) + '</p>', true);
          var typing = add('<p class="chat__dots"><i></i><i></i><i></i></p>');
          timers.push(setTimeout(function() {
            typing.innerHTML = '<span class="chat__av">FK</span><p>' + esc(QA[i][1]) + (i === 3 ? '<a href="#iletisim" class="chat__cta">Teklif formuna git</a>' : '') + '</p>';
            chat.scrollTop = chat.scrollHeight;
            busy = false;
          }, reduce ? 0 : 1100));
        });
        chips();
        return function() {
          timers.forEach(clearTimeout);
        };
      }
    },
    hesap: {
      t: 'Hesap makinesi',
      draw: function(b) {
        var cur = '0', prev = null, op = null, fresh = false;
        var keys = ['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', ',', '='];
        b.innerHTML = '<div class="calc2"><output class="calc2__d" data-d aria-live="polite">0</output><div class="calc2__k">' + keys.map(function(k) {
          return '<button type="button" data-k="' + k + '" class="' + ('÷×−+='.indexOf(k) > -1 ? 'is-op' : 'CS±%'.indexOf(k) > -1 ? 'is-fn' : '') + (k === '0' ? ' is-zero' : '') + '">' + k + '</button>';
        }).join('') + '</div></div>';
        var disp = qs('[data-d]', b);
        var show = function() {
          var n = parseFloat(cur.replace(',', '.'));
          disp.textContent = !isFinite(n) ? 'Hata' : cur.indexOf(',') > -1 && !fresh ? cur : n.toLocaleString('tr-TR', { maximumFractionDigits: 8 });
        };
        var calc = function(a, b2, o) {
          return o === '+' ? a + b2 : o === '−' ? a - b2 : o === '×' ? a * b2 : o === '÷' ? (b2 === 0 ? NaN : a / b2) : b2;
        };
        var val = function() {
          return parseFloat(cur.replace(',', '.'));
        };
        b.addEventListener('click', function(e) {
          var k = e.target.closest('[data-k]');
          if (!k) return;
          k = k.dataset.k;
          if (/\d/.test(k)) {
            cur = fresh || cur === '0' ? k : (cur.length < 12 ? cur + k : cur);
            fresh = false;
          } else if (k === ',') {
            if (fresh) {
              cur = '0';
              fresh = false;
            }
            if (cur.indexOf(',') === -1) cur += ',';
          } else if (k === 'C') {
            cur = '0';
            prev = op = null;
          } else if (k === '±') cur = String(-val()).replace('.', ',');
          else if (k === '%') cur = String(val() / 100).replace('.', ',');
          else if (k === '=') {
            if (op !== null) {
              cur = String(+calc(prev, val(), op).toPrecision(12)).replace('.', ',');
              op = prev = null;
              fresh = true;
            }
          } else {
            if (op !== null && !fresh) cur = String(+calc(prev, val(), op).toPrecision(12)).replace('.', ',');
            prev = val();
            op = k;
            fresh = true;
          }
          qsa('.is-op', b).forEach(function(x) {
            x.classList.toggle('is-on', x.dataset.k === op && fresh);
          });
          show();
        });
      }
    },
    ayar: {
      t: 'Ayarlar',
      draw: function(b) {
        var w = screen.dataset.wall;
        b.innerHTML = '<div class="set"><p class="set__k">Duvar kâğıdı</p><div class="set__walls">' + [1, 2, 3, 4].map(function(i) {
          return '<button type="button" data-w="' + i + '" class="wall-' + i + (String(i) === w ? ' is-on' : '') + '" aria-label="Duvar kâğıdı ' + i + '"></button>';
        }).join('') + '</div>' +
          '<p class="set__k">Parlaklık</p><label class="set__row"><i class="fa-solid fa-sun" aria-hidden="true"></i><input type="range" min="55" max="100" value="' + (screen.dataset.bright || 100) + '" data-br aria-label="Parlaklık"></label>' +
          '<p class="set__k">Bu tablet hakkında</p><ul class="set__info"><li><span>Sistem</span><b>Kapukaya OS 1.0</b></li><li><span>Geliştirici</span><b>Kapukaya Development</b></li><li><span>Uygulamalar</span><b>8 örnek uygulama</b></li></ul></div>';
        b.addEventListener('click', function(e) {
          var x = e.target.closest('[data-w]');
          if (!x) return;
          screen.dataset.wall = x.dataset.w;
          qsa('[data-w]', b).forEach(function(y) {
            y.classList.toggle('is-on', y === x);
          });
        });
        qs('[data-br]', b).addEventListener('input', function(e) {
          screen.dataset.bright = e.target.value;
          os.style.filter = e.target.value < 100 ? 'brightness(' + e.target.value / 100 + ')' : '';
        });
      }
    }
  };

  var openApp = function(id, from) {
    var A = APPS[id];
    if (!A) return;
    if (current) closeApp(true);
    current = id;
    opener = from || null;
    var r = os.getBoundingClientRect(), f = from ? from.getBoundingClientRect() : null;
    win.style.transformOrigin = f ? (f.left + f.width / 2 - r.left) + 'px ' + (f.top + f.height / 2 - r.top) + 'px' : '50% 50%';
    title.textContent = A.t;
    right.innerHTML = '';
    var nb = body.cloneNode(false);
    body.parentNode.replaceChild(nb, body);
    body = nb;
    body.className = 'os__body app-' + id;
    cleanup = A.draw(body) || null;
    win.hidden = false;
    root.classList.add('is-app');
    void win.offsetWidth;
    win.classList.add('is-open');
    hideToast();
    setTimeout(function() {
      var back = qs('.os__back', win);
      if (back && root.contains(document.activeElement)) back.focus({ preventScroll: true });
    }, 50);
  };
  var closeApp = function(instant) {
    if (!current) return;
    if (cleanup) cleanup();
    cleanup = null;
    current = null;
    root.classList.remove('is-app');
    win.classList.remove('is-open');
    var done = function() {
      if (!current) {
        win.hidden = true;
        body.innerHTML = '';
      }
    };
    if (instant || reduce) done(); else setTimeout(done, 380);
    if (opener && !instant && root.contains(document.activeElement)) opener.focus({ preventScroll: true });
  };

  qsa('[data-app]').forEach(function(b) {
    b.addEventListener('click', function() {
      openApp(b.dataset.app, b);
    });
  });
  qsa('[data-close]').forEach(function(b) {
    b.addEventListener('click', function() {
      closeApp();
    });
  });
  root.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && current) {
      e.stopPropagation();
      closeApp();
    }
  });
  root.addEventListener('click', function(e) {
    var a = e.target.closest('a[href="#iletisim"]');
    if (a) closeApp();
  });

  var hideToast = function() {
    toast.classList.remove('is-on');
    setTimeout(function() {
      if (!toast.classList.contains('is-on')) toast.hidden = true;
    }, 400);
  };
  var showToast = function() {
    if (current) return;
    toast.innerHTML = '<span class="os__ic os__ic--sm" style="--c1:#ffd66e;--c2:#e0a92c"><i class="fa-solid fa-calendar-check" aria-hidden="true"></i></span><span><b>Randevu · şimdi</b>Yeni talep: 18:00 Saç kesimi, Yusuf A.</span>';
    toast.hidden = false;
    void toast.offsetWidth;
    toast.classList.add('is-on');
    setTimeout(hideToast, 6000);
  };
  toast.addEventListener('click', function() {
    if (!appts.bugun.some(function(x) {
      return x.c === 'Yusuf A.';
    })) appts.bugun.push({ t: '18:00', n: 'Saç kesimi', c: 'Yusuf A.', s: 'new', p: 450 });
    openApp('randevu', toast);
  });
  var shown = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function(en) {
      if (en[0].isIntersecting && !shown) {
        shown = true;
        setTimeout(showToast, reduce ? 4000 : 4500);
      }
    }, { threshold: .6 }).observe(root);
  }
})();
