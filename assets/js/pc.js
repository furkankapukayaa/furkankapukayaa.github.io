(function() {
  'use strict';
  var root = document.querySelector('[data-pc]');
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
  var pad = function(n) {
    return (n < 10 ? '0' : '') + n;
  };
  var now = function() {
    var d = new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  };
  var ic = function(c) {
    return '<i class="' + c + '" aria-hidden="true"></i>';
  };
  var screen = qs('[data-screen]'), desk = qs('[data-desk]'), winsEl = qs('[data-wins]'), tasks = qs('[data-tasks]'), notes = qs('[data-notes]'), start = qs('[data-start]'), startBtn = qs('[data-start-btn]');
  var contact = function() {
    var c = document.getElementById('iletisim');
    if (c) c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  var clock = function() {
    var d = new Date(), c = qs('[data-clock]');
    c.innerHTML = '<b>' + now() + '</b><small>' + d.toLocaleDateString('tr-TR') + '</small>';
  };
  clock();
  setInterval(clock, 15000);

  var data = {
    stok: [
      { n: '205/55 R16 lastik', q: 48, p: 2850 },
      { n: 'Motor yağı 5W-30', q: 9, p: 1450 },
      { n: 'Silecek seti', q: 3, p: 420 },
      { n: 'Akü 60 Ah', q: 21, p: 3900 },
      { n: 'Fren balatası', q: 12, p: 1250 },
      { n: 'Jant 17"', q: 16, p: 5200 }
    ],
    satis: [],
    randevu: [
      { t: '14:30', n: 'Saç kesimi', c: 'Ahmet Y.', s: 'ok', p: 450 },
      { t: '15:15', n: 'Sakal tasarımı', c: 'Murat K.', s: 'ok', p: 300 },
      { t: '16:00', n: 'Damat paketi', c: 'Emre D.', s: 'wait', p: 2500 },
      { t: '17:00', n: 'Saç ve sakal', c: 'Can T.', s: 'new', p: 650 }
    ],
    salon: { 'Selin': { 11: 'Fön', 14: 'Boya' }, 'Merve': { 10: 'Kesim', 12: 'Manikür', 15: 'Kesim' }, 'Ayşe': { 13: 'Cilt bakımı', 16: 'Keratin' } },
    trash: ['eski_satis_raporu_SON_v3.xlsx', 'elle_girilen_siparisler.xlsx', 'stok_sayim_kagidi.pdf'],
    synced: 1284,
    svcOn: true,
    log: []
  };
  var ST = { ok: ['Onaylandı', 'ok'], wait: ['Ertelendi', 'wait'], bad: ['İptal', 'bad'], new: ['Bekliyor', 'new'] };
  var SERVICES = [['Saç kesimi', 450, 30], ['Sakal tasarımı', 300, 20], ['Saç ve sakal', 650, 45], ['Damat paketi', 2500, 120]];

  var notify = function(o) {
    var n = document.createElement('div');
    n.className = 'pc-note';
    n.setAttribute('role', 'status');
    n.innerHTML = '<span class="pc-note__ic" style="--c:' + (o.c || '#ffd66e') + '">' + ic(o.i || 'fa-solid fa-bell') + '</span><div><b>' + esc(o.t) + '</b><p>' + esc(o.m) + '</p>' + (o.a ? '<div class="pc-note__acts">' + o.a.map(function(a, k) {
      return '<button type="button" data-na="' + k + '">' + esc(a[0]) + '</button>';
    }).join('') + '</div>' : '') + '</div><button type="button" class="pc-note__x" aria-label="Bildirimi kapat">' + ic('fa-solid fa-xmark') + '</button>';
    notes.appendChild(n);
    while (notes.children.length > 1) notes.firstChild.remove();
    var kill = function() {
      n.classList.add('is-out');
      setTimeout(function() {
        n.remove();
      }, 350);
    };
    n.addEventListener('click', function(e) {
      var b = e.target.closest('[data-na]');
      if (b) {
        o.a[+b.dataset.na][1]();
        kill();
      } else if (e.target.closest('.pc-note__x')) kill();
    });
    setTimeout(kill, o.ms || (o.a ? 7000 : 4500));
  };

  var APPS = {};
  var app = function(id, def) {
    APPS[id] = def;
  };

  app('explorer', {
    t: 'Dosya Gezgini', i: 'fa-solid fa-folder', c: '#f4c04e', w: 560, h: 330,
    draw: function(b, w, arg) {
      var view = arg || 'pc';
      var files = [
        ['Teklif_Formu.pdf', 'fa-regular fa-file-pdf', '#ef5350', 'pdf', '86 KB'],
        ['Satis_Raporu_2026.xlsx', 'fa-regular fa-file-excel', '#2fa36b', 'sheet', '42 KB'],
        ['Proje_Notlari.txt', 'fa-regular fa-file-lines', '#9aa0a6', 'notepad', '2 KB'],
        ['Kiraz Oto Kurulum', 'fa-solid fa-folder', '#f4c04e', 'progs', 'Klasör']
      ];
      var progs = [['Kiraz Oto', 'kiraz', 'fa-solid fa-car', '#e5533d'], ['Olivia Salon', 'olivia', 'fa-solid fa-scissors', '#c58b4c'], ['Entegrasyon Servisi', 'servis', 'fa-solid fa-server', '#3aa676'], ['Google Chrome', 'chrome', 'fa-brands fa-chrome', '#4285f4']];
      var render = function() {
        var main;
        if (view === 'pc') {
          main = '<p class="ex-h">Aygıtlar ve sürücüler</p><div class="ex-drives">' +
            '<button type="button" data-v="progs" class="ex-drive">' + ic('fa-solid fa-hard-drive') + '<span><b>Yerel Disk (C:)</b><i style="--u:62%"></i><small>194 GB boş / 512 GB</small></span></button>' +
            '<button type="button" data-v="docs" class="ex-drive">' + ic('fa-solid fa-hard-drive') + '<span><b>Projeler (D:)</b><i style="--u:38%"></i><small>620 GB boş / 1 TB</small></span></button></div>';
        } else if (view === 'docs') {
          main = '<div class="ex-list">' + files.map(function(f) {
            return '<button type="button" data-f="' + f[3] + '"><span style="color:' + f[2] + '">' + ic(f[1]) + '</span><b>' + f[0] + '</b><small>' + f[4] + '</small></button>';
          }).join('') + '</div>';
        } else if (view === 'progs') {
          main = '<p class="ex-h">C:\\Program Files</p><div class="ex-grid">' + progs.map(function(p) {
            return '<button type="button" data-o="' + p[1] + '"><span style="--c:' + p[3] + '">' + ic(p[2]) + '</span>' + p[0] + '</button>';
          }).join('') + '</div>';
        } else {
          main = data.trash.length ? '<div class="ex-list">' + data.trash.map(function(f) {
            return '<button type="button" disabled><span style="color:#2fa36b">' + ic('fa-regular fa-file-excel') + '</span><b>' + f + '</b><small>Silindi</small></button>';
          }).join('') + '</div><p class="ex-tip">Otomasyon kurulduktan sonra bu dosyalara gerek kalmadı.</p><button type="button" class="pc-btn" data-empty>' + ic('fa-solid fa-trash-can') + 'Çöp kutusunu boşalt</button>' : '<p class="ex-empty">' + ic('fa-regular fa-trash-can') + 'Çöp kutusu boş</p>';
        }
        var names = { pc: 'Bu Bilgisayar', docs: 'Belgelerim', progs: 'Yerel Disk (C:)', trash: 'Çöp Kutusu' };
        w.setTitle(names[view]);
        b.innerHTML = '<div class="ex"><nav class="ex-side">' + [['pc', 'fa-solid fa-desktop', 'Bu Bilgisayar'], ['docs', 'fa-solid fa-folder', 'Belgelerim'], ['progs', 'fa-solid fa-hard-drive', 'Yerel Disk (C:)'], ['trash', 'fa-solid fa-trash-can', 'Çöp Kutusu']].map(function(x) {
          return '<button type="button" data-v="' + x[0] + '"' + (x[0] === view ? ' class="is-on"' : '') + '>' + ic(x[1]) + x[2] + '</button>';
        }).join('') + '</nav><div class="ex-main"><div class="ex-path">' + ic('fa-solid fa-chevron-right') + names[view] + '</div>' + main + '</div></div>';
      };
      b.addEventListener('click', function(e) {
        var v = e.target.closest('[data-v]'), f = e.target.closest('[data-f]'), o = e.target.closest('[data-o]');
        if (v) {
          view = v.dataset.v;
          render();
        } else if (f) {
          if (f.dataset.f === 'progs') {
            view = 'progs';
            render();
          } else open(f.dataset.f);
        } else if (o) open(o.dataset.o);
        else if (e.target.closest('[data-empty]')) {
          data.trash = [];
          render();
          qsa('[data-icon="trash"] .pc-ico__img').forEach(function(x) {
            x.innerHTML = ic('fa-regular fa-trash-can');
          });
        }
      });
      render();
    }
  });

  app('pdf', {
    t: 'Teklif_Formu.pdf', i: 'fa-regular fa-file-pdf', c: '#ef5350', w: 440, h: 330,
    draw: function(b) {
      b.innerHTML = '<div class="pdf"><div class="pdf__page"><span class="pdf__logo">FK</span><b>Proje Teklif Formu</b><small>Kapukaya Development</small><ol><li>İhtiyacınızı ve mevcut iş akışınızı dinliyorum.</li><li>Kapsamı ekran ekran çıkarıp sabit fiyatlı teklif hazırlıyorum.</li><li>Onayınızla geliştirmeye başlıyor, her hafta çalışan sürümü gösteriyorum.</li></ol><button type="button" class="pc-btn" data-go>' + ic('fa-solid fa-paper-plane') + 'Formu doldurun</button></div></div>';
      qs('[data-go]', b).addEventListener('click', contact);
    }
  });

  app('notepad', {
    t: 'Proje_Notlari.txt - Not Defteri', i: 'fa-regular fa-file-lines', c: '#9aa0a6', w: 420, h: 280,
    draw: function(b) {
      b.innerHTML = '<div class="np"><div class="np__menu"><span>Dosya</span><span>Düzen</span><span>Görünüm</span></div><textarea spellcheck="false" aria-label="Not defteri">Yapılacaklar\n- Kuaför sitesi: randevu hatırlatma SMS\'i\n- Kiraz Oto: barkodlu satış ekranı ✔\n- Entegrasyon servisi: gece raporu 23.00\n- Yeni müşteri görüşmesi: Cuma 11.00\n\nBu not defterine yazabilirsiniz; hiçbir şey kaydedilmez.</textarea></div>';
    }
  });

  app('sheet', {
    t: 'Satis_Raporu_2026.xlsx', i: 'fa-regular fa-file-excel', c: '#2fa36b', w: 520, h: 320,
    draw: function(b) {
      var D = { ay: [['Oca', 410], ['Şub', 452], ['Mar', 498], ['Nis', 470], ['May', 540], ['Haz', 610], ['Tem', 655], ['Ağu', 630], ['Eyl', 702], ['Eki', 760]], ceyrek: [['Ç1', 1360], ['Ç2', 1620], ['Ç3', 1987], ['Ç4', 760]] };
      var per = 'ay';
      var render = function() {
        var d = D[per], max = Math.max.apply(null, d.map(function(x) {
          return x[1];
        })), sum = d.reduce(function(a, x) {
          return a + x[1];
        }, 0);
        b.innerHTML = '<div class="sh"><div class="sh__bar"><span class="sh__fx">fx</span><span>=TOPLA(B2:B' + (d.length + 1) + ')</span><div class="seg seg--os">' + [['ay', 'Aylık'], ['ceyrek', 'Çeyreklik']].map(function(x) {
          return '<button type="button" data-p="' + x[0] + '"' + (x[0] === per ? ' class="is-on"' : '') + '>' + x[1] + '</button>';
        }).join('') + '</div></div><div class="sh__body"><table class="sh__t"><thead><tr><th></th><th>A</th><th>B</th></tr></thead><tbody>' +
          d.map(function(x, i) {
            return '<tr><th>' + (i + 2) + '</th><td>' + x[0] + '</td><td>' + tl(x[1] * 1000) + '</td></tr>';
          }).join('') + '<tr class="sh__sum"><th>' + (d.length + 2) + '</th><td>Toplam</td><td>' + tl(sum * 1000) + '</td></tr></tbody></table><div class="os-chart">' + d.map(function(x, i) {
            return '<span title="' + x[0] + ': ' + tl(x[1] * 1000) + '"><i style="--h:' + (x[1] / max).toFixed(3) + ';--n:' + i + '"></i><small>' + x[0] + '</small></span>';
          }).join('') + '</div></div></div>';
      };
      b.addEventListener('click', function(e) {
        var x = e.target.closest('[data-p]');
        if (x) {
          per = x.dataset.p;
          render();
        }
      });
      render();
    }
  });

  var SITES = {
    start: { t: 'Yeni sekme', u: '', i: 'fa-brands fa-chrome' },
    randevu: { t: 'Emre Gündüz Hair Design', u: 'emregunduzhairdesign.com', i: 'fa-solid fa-scissors' },
    admin: { t: 'Randevu Yönetim Paneli', u: 'emregunduzhairdesign.com/admin', i: 'fa-solid fa-table-columns' },
    emlak: { t: 'Metrekare Gayrimenkul', u: 'demo.kapukaya.dev/gayrimenkul', i: 'fa-solid fa-house' },
    kurumsal: { t: 'Prodent', u: 'demo.kapukaya.dev/kurumsal', i: 'fa-solid fa-tooth' }
  };
  var EXT = [
    { id: 'volumora', n: 'Volumora', i: 'fa-solid fa-volume-high', c: '#7c5cff' },
    { id: 'assetify', n: 'Assetify', i: 'fa-solid fa-images', c: '#00a3a3' },
    { id: 'copy', n: 'Copy Unlocker', i: 'fa-solid fa-copy', c: '#ff7a45' },
    { id: 'social', n: 'FK Social Hub', i: 'fa-solid fa-hashtag', c: '#e1306c' }
  ];
  var site = {
    start: function(p) {
      return '<div class="cs-start"><span class="cs-start__logo">' + ic('fa-brands fa-google') + '</span><div class="cs-search">' + ic('fa-solid fa-magnifying-glass') + '<span>Google\'da arayın veya bir URL yazın</span></div><div class="cs-tiles">' + ['randevu', 'admin', 'emlak', 'kurumsal'].map(function(k) {
        return '<button type="button" data-site="' + k + '"><span>' + ic(SITES[k].i) + '</span>' + SITES[k].t + '</button>';
      }).join('') + '</div></div>';
    },
    randevu: function(p, st) {
      st.step = st.step || 0;
      var head = '<div class="eg"><div class="eg__nav"><b>EMRE GÜNDÜZ</b><span>Hizmetler</span><span>Randevu sorgula</span></div>';
      if (st.step === 0) return head + '<div class="eg__hero"><small>Erkek kuaförü · Online randevu</small><b>Sıra beklemeden randevunuzu alın.</b><p>1. Hizmet seçin</p><div class="eg__chips">' + SERVICES.map(function(s, i) {
        return '<button type="button" data-svc="' + i + '">' + s[0] + '<small>' + tl(s[1]) + ' · ' + s[2] + ' dk</small></button>';
      }).join('') + '</div></div></div>';
      if (st.step === 1) return head + '<div class="eg__hero"><small>' + SERVICES[st.svc][0] + '</small><b>2. Saat seçin</b><div class="eg__slots">' + ['10:00', '11:30', '13:00', '15:30', '17:30', '18:30', '19:00', '20:00'].map(function(t, i) {
        var full = i === 2 || i === 5;
        return '<button type="button" data-slot="' + t + '"' + (full ? ' disabled' : '') + '>' + t + '</button>';
      }).join('') + '</div><button type="button" class="eg__link" data-step="0">‹ Hizmeti değiştir</button></div></div>';
      if (st.step === 2) return head + '<div class="eg__hero"><small>' + SERVICES[st.svc][0] + ' · Bugün ' + st.slot + '</small><b>3. Bilgileriniz</b><form class="eg__form" data-eg-form><input type="text" placeholder="Ad soyad" required value="Misafir"><input type="email" placeholder="E-posta" required value="misafir@ornek.com"><button type="submit">Randevuyu onayla</button></form></div></div>';
      return head + '<div class="eg__hero eg__done">' + ic('fa-solid fa-circle-check') + '<b>Randevunuz alındı!</b><p>Bugün ' + st.slot + ' · ' + SERVICES[st.svc][0] + '. Onay e-postası ve takvim daveti gönderildi.</p><button type="button" class="eg__link" data-site="admin">Admin panelinde görün ›</button></div></div>';
    },
    admin: function(p, st) {
      var list = data.randevu, ciro = list.filter(function(x) {
        return x.s === 'ok';
      }).reduce(function(a, x) {
        return a + x.p;
      }, 0);
      return '<div class="adm"><aside>' + ['fa-solid fa-calendar-check', 'fa-solid fa-scissors', 'fa-regular fa-clock', 'fa-solid fa-gear'].map(function(c, i) {
        return '<span' + (i ? '' : ' class="is-on"') + '>' + ic(c) + '</span>';
      }).join('') + '</aside><div><div class="ui-kpis"><div><small>Bugün</small><b>' + list.length + ' randevu</b></div><div><small>Onaylı</small><b>' + list.filter(function(x) {
        return x.s === 'ok';
      }).length + '</b></div><div><small>Onaylı ciro</small><b>' + tl(ciro) + '</b></div></div><ul class="os-list">' + list.map(function(x, i) {
        return '<li class="' + (i === st.open ? 'is-open' : '') + '"><button type="button" class="os-list__row" data-ri="' + i + '"><span class="os-list__t">' + x.t + '</span><span class="os-list__n"><b>' + esc(x.n) + '</b><small>' + esc(x.c) + ' · ' + tl(x.p) + '</small></span><em class="' + ST[x.s][1] + '">' + ST[x.s][0] + '</em></button>' + (i === st.open ? '<div class="os-list__acts"><button type="button" data-ra="ok">' + ic('fa-solid fa-check') + 'Onayla</button><button type="button" data-ra="wait">' + ic('fa-regular fa-clock') + 'Ertele</button><button type="button" data-ra="bad">' + ic('fa-solid fa-xmark') + 'İptal</button></div>' : '') + '</li>';
      }).join('') + '</ul></div></div>';
    },
    emlak: function(p, st) {
      var homes = [['3+1 Daire', 'Moda', '₺14.500.000', '145 m²'], ['2+1 Daire', 'Göztepe', '₺9.200.000', '95 m²'], ['Dükkân', 'Bostancı', '₺38.000 / ay', '80 m²']];
      var nav = '<div class="ui-site__nav"><button type="button" data-ep="home"><b>Metrekare</b></button><button type="button" data-ep="list">Portföy</button><button type="button" data-ep="contact">İletişim</button></div>';
      var cards = '<div class="ui-site__cards">' + homes.map(function(h, i) {
        return '<button type="button" data-ep="h' + i + '"><i style="--hue:' + (25 + i * 80) + '"></i>' + h[0] + '<small>' + h[1] + '</small></button>';
      }).join('') + '</div>';
      var pg = st.page || 'home', html;
      if (pg === 'home') html = '<div class="ui-site__hero"><b>Aradığınız ev, tek tıkla.</b><span>Kadıköy ve Ataşehir\'de güncel ilanlar.</span><button type="button" data-ep="list">İlanları görün</button></div>' + cards;
      else if (pg === 'list') html = '<div class="ws-h">Portföy <small>' + homes.length + ' ilan</small></div>' + cards;
      else if (pg === 'contact') html = st.sent ? '<p class="ws-ok">' + ic('fa-solid fa-check') + 'Talebiniz alındı. Danışmanımız sizi arayacak.</p>' : '<div class="ws-h">İletişim</div><form class="ws-form" data-ws-form><input type="text" placeholder="Adınız" required><input type="tel" placeholder="Telefonunuz" required><button type="submit">Beni arayın</button></form>';
      else {
        var h = homes[+pg.slice(1)];
        html = '<div class="ws-ilan"><i style="--hue:' + (25 + +pg.slice(1) * 80) + '"></i><div><b>' + h[0] + ' · ' + h[1] + '</b><span>' + h[3] + ' · ' + h[2] + '</span><button type="button" data-ep="contact">Bu ilan için arayın</button></div></div>';
      }
      return '<div class="ui-site ws-page">' + nav + html + '</div>';
    },
    kurumsal: function(p, st) {
      var pg = st.page || 'home';
      var nav = '<div class="pd__nav"><b>PRODENT</b>' + [['home', 'Ana sayfa'], ['urun', 'Ürünler'], ['nokta', 'Satış noktaları']].map(function(x) {
        return '<button type="button" data-kp="' + x[0] + '"' + (x[0] === pg ? ' class="is-on"' : '') + '>' + x[1] + '</button>';
      }).join('') + '</div>';
      var body = pg === 'home' ? '<div class="pd__hero"><b>Gülüşünüz için<br>uzman bakım.</b><span>Prodent, Prosoll ve Prosense ürün ailesi.</span><button type="button" data-kp="urun">Ürünleri keşfedin</button></div>' :
        pg === 'urun' ? '<div class="pd__grid">' + [['Prodent', 'Diş macunu'], ['Prosoll', 'Ağız gargarası'], ['Prosense', 'Hassas dişler']].map(function(x, i) {
          return '<span><i style="--hue:' + (340 + i * 30) + '"></i><b>' + x[0] + '</b><small>' + x[1] + '</small></span>';
        }).join('') + '</div>' : '<ul class="pd__list"><li><b>İstanbul</b><span>42 eczane</span></li><li><b>Ankara</b><span>18 eczane</span></li><li><b>İzmir</b><span>15 eczane</span></li></ul>';
      return '<div class="pd">' + nav + body + '</div>';
    }
  };
  app('chrome', {
    t: 'Google Chrome', i: 'fa-brands fa-chrome', c: '#4285f4', w: 600, h: 350,
    draw: function(b, w, arg) {
      var tabs = [{ s: arg || 'start', st: {}, h: [] }], cur = 0, pop = null;
      var render = function() {
        var T = tabs[cur], S = SITES[T.s];
        w.setTitle(S.t + ' - Google Chrome');
        b.innerHTML = '<div class="cr"><div class="cr__tabs">' + tabs.map(function(t, i) {
          return '<div class="cr__tab' + (i === cur ? ' is-on' : '') + '"><button type="button" data-tab="' + i + '">' + ic(SITES[t.s].i) + '<span>' + SITES[t.s].t + '</span></button><button type="button" class="cr__x" data-xt="' + i + '" aria-label="Sekmeyi kapat">' + ic('fa-solid fa-xmark') + '</button></div>';
        }).join('') + '<button type="button" class="cr__new" data-newtab aria-label="Yeni sekme">' + ic('fa-solid fa-plus') + '</button></div>' +
          '<div class="cr__bar"><button type="button" data-back aria-label="Geri"' + (T.h.length ? '' : ' disabled') + '>' + ic('fa-solid fa-arrow-left') + '</button><button type="button" data-reload aria-label="Yenile">' + ic('fa-solid fa-rotate') + '</button><span class="cr__url">' + (S.u ? ic('fa-solid fa-lock') + '<span>' + S.u + '</span>' : ic('fa-brands fa-google') + '<span class="is-dim">Google\'da arayın veya URL yazın</span>') + '</span><div class="cr__ext">' + EXT.map(function(x) {
            return '<button type="button" data-ext="' + x.id + '" title="' + x.n + '" style="--c:' + x.c + '"' + (pop === x.id ? ' class="is-on"' : '') + '>' + ic(x.i) + '</button>';
          }).join('') + '<button type="button" data-ext="menu" title="Uzantılar"' + (pop === 'menu' ? ' class="is-on"' : '') + '>' + ic('fa-solid fa-puzzle-piece') + '</button></div></div>' +
          '<div class="cr__view" data-view>' + site[T.s](T, T.st) + '</div>' + (pop ? '<div class="cr__pop" data-pop>' + popup(pop) + '</div>' : '') + '</div>';
      };
      var popup = function(id) {
        if (id === 'menu') return '<b class="cr__pt">Uzantılar</b>' + EXT.map(function(x) {
          return '<button type="button" class="cr__pr" data-ext="' + x.id + '"><span style="--c:' + x.c + '">' + ic(x.i) + '</span>' + x.n + '<small>Kapukaya Development</small></button>';
        }).join('');
        if (id === 'volumora') return '<b class="cr__pt">' + ic('fa-solid fa-volume-high') + 'Volumora</b><label class="cr__rng">Ses yükseltme <output data-vo>%200</output><input type="range" min="100" max="600" step="10" value="200" data-vol></label><div class="cr__chips">' + ['Normal', 'Bas', 'Konuşma', 'Film'].map(function(x, i) {
          return '<button type="button" data-eq' + (i === 0 ? ' class="is-on"' : '') + '>' + x + '</button>';
        }).join('') + '</div>';
        if (id === 'assetify') return '<b class="cr__pt">' + ic('fa-solid fa-images') + 'Assetify</b><p class="cr__pp">Bu sayfada <b>12 görsel</b>, <b>2 yazı tipi</b> ve şu renkler bulundu:</p><div class="cr__sw"><i style="background:#1f6f63"></i><i style="background:#f5f1ea"></i><i style="background:#1c2333"></i><i style="background:#c8a96a"></i></div><button type="button" class="pc-btn" data-dl>' + ic('fa-solid fa-download') + 'Tümünü indir (ZIP)</button>';
        if (id === 'copy') return '<b class="cr__pt">' + ic('fa-solid fa-copy') + 'Copy Unlocker</b><label class="cr__tg"><input type="checkbox" data-unlock' + (window.__cu ? ' checked' : '') + '><span></span>Bu sitede kopyalamayı ve sağ tıklamayı aç</label>';
        return '<b class="cr__pt">' + ic('fa-solid fa-hashtag') + 'FK Social Hub</b><p class="cr__pp">Bugün Türkiye\'de öne çıkanlar</p><ol class="cr__tr"><li>#yapayzeka <small>48 B gönderi</small></li><li>#kasımindirimleri <small>31 B</small></li><li>#eticaret <small>12 B</small></li></ol>';
      };
      var go = function(s) {
        var T = tabs[cur];
        T.h.push([T.s, T.st]);
        T.s = s;
        T.st = {};
        pop = null;
        render();
      };
      b.addEventListener('click', function(e) {
        var t = e.target, T = tabs[cur], x;
        if ((x = t.closest('[data-xt]'))) {
          tabs.splice(+x.dataset.xt, 1);
          if (!tabs.length) return w.close();
          cur = Math.min(cur, tabs.length - 1);
        } else if ((x = t.closest('[data-tab]'))) cur = +x.dataset.tab;
        else if (t.closest('[data-newtab]')) {
          if (tabs.length >= 4) return;
          tabs.push({ s: 'start', st: {}, h: [] });
          cur = tabs.length - 1;
        } else if (t.closest('[data-back]') && T.h.length) {
          var h = T.h.pop();
          T.s = h[0];
          T.st = h[1];
        } else if (t.closest('[data-reload]')) {
          var v = qs('[data-view]', b);
          v.classList.add('is-load');
          setTimeout(function() {
            v.classList.remove('is-load');
          }, 400);
          return;
        } else if ((x = t.closest('[data-ext]'))) pop = pop === x.dataset.ext ? null : x.dataset.ext;
        else if (t.closest('[data-pop]')) {
          if ((x = t.closest('[data-eq]'))) {
            qsa('[data-eq]', b).forEach(function(y) {
              y.classList.toggle('is-on', y === x);
            });
            return;
          }
          if (t.closest('[data-dl]')) {
            pop = null;
            notify({ t: 'Assetify', m: '12 görsel ve renk paleti indirildi: sayfa-varliklari.zip', i: 'fa-solid fa-images', c: '#00a3a3', ms: 4000 });
          } else return;
        } else if ((x = t.closest('[data-site]'))) return go(x.dataset.site);
        else if ((x = t.closest('[data-svc]'))) {
          T.st.svc = +x.dataset.svc;
          T.st.step = 1;
        } else if ((x = t.closest('[data-slot]'))) {
          T.st.slot = x.dataset.slot;
          T.st.step = 2;
        } else if ((x = t.closest('[data-step]'))) T.st.step = +x.dataset.step;
        else if ((x = t.closest('[data-ri]'))) T.st.open = T.st.open === +x.dataset.ri ? -1 : +x.dataset.ri;
        else if ((x = t.closest('[data-ra]'))) {
          var r = data.randevu[T.st.open];
          r.s = x.dataset.ra;
          T.st.open = -1;
          notify({ t: 'Randevu Paneli', m: r.c + ' için randevu ' + ST[r.s][0].toLocaleLowerCase('tr') + '. Müşteriye e-posta gönderildi.', i: 'fa-solid fa-envelope', c: '#ffd66e', ms: 4000 });
        } else if ((x = t.closest('[data-ep]'))) {
          T.st.page = x.dataset.ep;
          T.st.sent = false;
        } else if ((x = t.closest('[data-kp]'))) T.st.page = x.dataset.kp;
        else {
          if (pop && !t.closest('.cr__bar')) {
            pop = null;
            render();
          }
          return;
        }
        render();
      });
      b.addEventListener('input', function(e) {
        if (e.target.matches('[data-vol]')) qs('[data-vo]', b).textContent = '%' + e.target.value;
      });
      b.addEventListener('change', function(e) {
        if (e.target.matches('[data-unlock]')) {
          window.__cu = e.target.checked;
          notify({ t: 'Copy Unlocker', m: e.target.checked ? 'Bu sitede kopyalama ve sağ tık açıldı.' : 'Site varsayılan ayarlarına döndü.', i: 'fa-solid fa-copy', c: '#ff7a45', ms: 3500 });
        }
      });
      b.addEventListener('submit', function(e) {
        e.preventDefault();
        var T = tabs[cur];
        if (e.target.matches('[data-eg-form]')) {
          var s = SERVICES[T.st.svc];
          data.randevu.push({ t: T.st.slot, n: s[0], c: 'Misafir', s: 'new', p: s[1] });
          data.randevu.sort(function(a, z) {
            return a.t < z.t ? -1 : 1;
          });
          T.st.step = 3;
          notify({ t: 'Randevu Paneli', m: 'Yeni randevu: bugün ' + T.st.slot + ', ' + s[0] + '. Kuaföre ve müşteriye e-posta gitti.', i: 'fa-solid fa-calendar-check', c: '#ffd66e', a: [['Panelde aç', function() {
            go('admin');
          }]] });
        } else if (e.target.matches('[data-ws-form]')) T.st.sent = true;
        render();
      });
      render();
    }
  });

  app('kiraz', {
    t: 'Kiraz Oto - Stok ve Satış', i: 'fa-solid fa-car', c: '#e5533d', w: 560, h: 340,
    draw: function(b) {
      var tab = 'stok', filter = '';
      var st = function(q) {
        return q < 5 ? ['Kritik', 'bad'] : q < 15 ? ['Azalıyor', 'wait'] : ['Yeterli', 'ok'];
      };
      var render = function() {
        var main;
        if (tab === 'stok') {
          var low = filter.toLocaleLowerCase('tr');
          main = '<div class="ko-top"><label class="os-search">' + ic('fa-solid fa-magnifying-glass') + '<input type="search" placeholder="Ürün ara" value="' + esc(filter) + '" data-filter aria-label="Ürün ara"></label><span class="' + (data.stok.some(function(x) {
            return x.q < 5;
          }) ? 'bad' : 'ok') + ' ko-badge">' + data.stok.filter(function(x) {
            return x.q < 5;
          }).length + ' kritik</span></div><table class="ui-table"><thead><tr><th>Ürün</th><th>Fiyat</th><th>Adet</th><th>Durum</th></tr></thead><tbody>' + data.stok.map(function(x, i) {
            if (low && x.n.toLocaleLowerCase('tr').indexOf(low) === -1) return '';
            var s = st(x.q);
            return '<tr><td>' + esc(x.n) + '</td><td>' + tl(x.p) + '</td><td><span class="qty"><button type="button" data-d="-1" data-i="' + i + '" aria-label="Azalt">−</button><b>' + x.q + '</b><button type="button" data-d="1" data-i="' + i + '" aria-label="Artır">+</button></span></td><td><em class="' + s[1] + '">' + s[0] + '</em></td></tr>';
          }).join('') + '</tbody></table>';
        } else if (tab === 'satis') {
          var tot = data.satis.reduce(function(a, x) {
            return a + x.t;
          }, 0);
          main = '<form class="ko-sale" data-sale><select data-sp aria-label="Ürün">' + data.stok.map(function(x, i) {
            return '<option value="' + i + '"' + (x.q ? '' : ' disabled') + '>' + esc(x.n) + ' (' + x.q + ')</option>';
          }).join('') + '</select><input type="number" min="1" max="20" value="1" data-sq aria-label="Adet"><button type="submit" class="pc-btn">' + ic('fa-solid fa-cart-shopping') + 'Satışı kaydet</button></form><div class="ko-sum"><span>Bugünkü satış</span><b>' + tl(tot) + '</b><small>' + data.satis.length + ' işlem · e-Arşiv fatura otomatik</small></div><ul class="ui-log">' + (data.satis.slice(-4).reverse().map(function(x) {
            return '<li><em class="ok">' + x.h + '</em>' + x.q + ' × ' + esc(x.n) + ' · ' + tl(x.t) + '</li>';
          }).join('') || '<li class="os-empty">Henüz satış yok. Bir ürün seçip kaydedin.</li>') + '</ul>';
        } else {
          main = '<ul class="os-list">' + [['34 ABC 123', 'Lastik değişimi', 'ok', 'Teslim edildi'], ['34 KRZ 42', 'Yol yardım · çekici', 'wait', 'Yolda'], ['06 TST 06', 'Rot balans', 'new', 'Sırada']].map(function(x) {
            return '<li><div class="os-list__row"><span class="os-list__t">' + ic('fa-solid fa-car') + '</span><span class="os-list__n"><b>' + x[0] + '</b><small>' + x[1] + '</small></span><em class="' + x[2] + '">' + x[3] + '</em></div></li>';
          }).join('') + '</ul>';
        }
        b.innerHTML = '<div class="app2"><nav class="app2__nav">' + [['stok', 'fa-solid fa-boxes-stacked', 'Stok'], ['satis', 'fa-solid fa-cart-shopping', 'Satış'], ['servis', 'fa-solid fa-wrench', 'Servis']].map(function(x) {
          return '<button type="button" data-t="' + x[0] + '"' + (x[0] === tab ? ' class="is-on"' : '') + '>' + ic(x[1]) + x[2] + '</button>';
        }).join('') + '</nav><div class="app2__main">' + main + '</div></div>';
        if (tab === 'stok' && filter) {
          var f = qs('[data-filter]', b);
          f.focus();
          f.setSelectionRange(f.value.length, f.value.length);
        }
      };
      b.addEventListener('click', function(e) {
        var x = e.target.closest('[data-t]'), d = e.target.closest('[data-d]');
        if (x) {
          tab = x.dataset.t;
          render();
        } else if (d) {
          var it = data.stok[+d.dataset.i], was = it.q;
          it.q = Math.max(0, it.q + +d.dataset.d);
          render();
          if (was >= 5 && it.q < 5) notify({ t: 'Kiraz Oto', m: it.n + ' kritik stok seviyesine düştü. Satın almaya e-posta gönderildi.', i: 'fa-solid fa-triangle-exclamation', c: '#e5533d', ms: 5000 });
        }
      });
      b.addEventListener('input', function(e) {
        if (e.target.matches('[data-filter]')) {
          filter = e.target.value;
          render();
        }
      });
      b.addEventListener('submit', function(e) {
        e.preventDefault();
        var it = data.stok[+qs('[data-sp]', b).value], q = Math.min(it.q, Math.max(1, +qs('[data-sq]', b).value || 1));
        if (!q) return;
        it.q -= q;
        data.satis.push({ n: it.n, q: q, t: q * it.p, h: now() });
        render();
        notify({ t: 'Kiraz Oto', m: q + ' × ' + it.n + ' satıldı. e-Arşiv fatura oluşturuldu.', i: 'fa-solid fa-receipt', c: '#e5533d', ms: 4000 });
      });
      render();
    }
  });

  app('olivia', {
    t: 'Olivia Salon Yönetimi', i: 'fa-solid fa-scissors', c: '#c58b4c', w: 560, h: 380,
    draw: function(b) {
      var pick = null, PR = { 'Kesim': 600, 'Fön': 350, 'Boya': 1800, 'Manikür': 400, 'Cilt bakımı': 900, 'Keratin': 2500 };
      var render = function() {
        var staff = Object.keys(data.salon), hours = [10, 11, 12, 13, 14, 15, 16, 17], total = 0, count = 0;
        staff.forEach(function(s) {
          Object.keys(data.salon[s]).forEach(function(h) {
            total += PR[data.salon[s][h]];
            count++;
          });
        });
        b.innerHTML = '<div class="ol"><div class="ol__top"><div><small>Bugün</small><b>' + count + ' randevu</b></div><div><small>Kasa (tahmini)</small><b>' + tl(total) + '</b></div><div><small>Doluluk</small><b>%' + Math.round(count / (staff.length * hours.length) * 100) + '</b></div></div><div class="ol__grid" style="--cols:' + staff.length + '"><span></span>' + staff.map(function(s) {
          return '<b>' + s + '</b>';
        }).join('') + hours.map(function(h) {
          return '<small>' + h + ':00</small>' + staff.map(function(s) {
            var v = data.salon[s][h];
            return v ? '<button type="button" class="is-busy" data-cell="' + s + '|' + h + '" title="Randevuyu kaldır">' + v + '</button>' : '<button type="button" data-cell="' + s + '|' + h + '" aria-label="' + s + ' ' + h + ':00 boş"' + (pick === s + '|' + h ? ' class="is-pick"' : '') + '>' + (pick === s + '|' + h ? 'Seçildi' : '') + '</button>';
          }).join('');
        }).join('') + '</div>' + (pick ? '<div class="ol__pick"><span>' + pick.replace('|', ' · ') + ':00 için hizmet:</span>' + Object.keys(PR).map(function(k) {
          return '<button type="button" data-svc2="' + k + '">' + k + '</button>';
        }).join('') + '</div>' : '<p class="ol__tip">Boş bir saate tıklayarak randevu ekleyin.</p>') + '</div>';
      };
      b.addEventListener('click', function(e) {
        var c = e.target.closest('[data-cell]'), s = e.target.closest('[data-svc2]');
        if (c) {
          var k = c.dataset.cell.split('|');
          if (data.salon[k[0]][k[1]]) {
            delete data.salon[k[0]][k[1]];
            pick = null;
          } else pick = pick === c.dataset.cell ? null : c.dataset.cell;
          render();
        } else if (s && pick) {
          var p = pick.split('|');
          data.salon[p[0]][p[1]] = s.dataset.svc2;
          notify({ t: 'Olivia Salon', m: p[0] + ' için ' + p[1] + ':00 ' + s.dataset.svc2 + ' randevusu eklendi. Müşteriye SMS gönderildi.', i: 'fa-solid fa-scissors', c: '#c58b4c', ms: 4000 });
          pick = null;
          render();
        }
      });
      render();
    }
  });

  var LOGS = [
    ['INFO', 'Trendyol: 6 yeni sipariş alındı'],
    ['INFO', 'ERP: 6 sipariş Logo\'ya aktarıldı'],
    ['INFO', 'e-Arşiv: 6 fatura oluşturuldu ve gönderildi'],
    ['INFO', 'Hepsiburada: 142 ürün stoğu güncellendi'],
    ['WARN', 'Kargo API yavaş yanıt verdi (1,8 sn), tekrar denendi'],
    ['INFO', 'Kargo: 4 gönderi takip numarası işlendi'],
    ['INFO', 'Banka: 12 tahsilat hareketi eşleştirildi'],
    ['INFO', 'Rapor: gün sonu özeti yöneticiye e-postalandı']
  ];
  var li = 0;
  var svcTick = function() {
    if (!data.svcOn) return;
    var l = LOGS[li++ % LOGS.length], n = (l[1].match(/\d+/) || [1])[0];
    data.synced += +n;
    data.log.push([new Date().toLocaleTimeString('tr-TR'), l[0], l[1]]);
    if (data.log.length > 40) data.log.shift();
    root.dispatchEvent(new CustomEvent('pc:log'));
  };
  app('servis', {
    t: 'Entegrasyon Servisi', i: 'fa-solid fa-server', c: '#3aa676', w: 540, h: 300,
    draw: function(b) {
      var t0 = Date.now() - 3 * 3600 * 1000 - 12 * 60 * 1000;
      b.innerHTML = '<div class="con"><div class="con__head"><span class="con__st" data-st></span><span>Çalışma süresi <b data-up></b></span><span>Aktarılan <b data-n></b></span><button type="button" class="pc-btn pc-btn--sm" data-toggle></button></div><pre class="con__log" data-log aria-live="off"></pre></div>';
      var logEl = qs('[data-log]', b);
      var paint = function() {
        qs('[data-st]', b).innerHTML = data.svcOn ? '<i class="ok-dot"></i>Çalışıyor' : '<i class="off-dot"></i>Durduruldu';
        qs('[data-toggle]', b).innerHTML = data.svcOn ? ic('fa-solid fa-pause') + 'Durdur' : ic('fa-solid fa-play') + 'Başlat';
        qs('[data-n]', b).textContent = data.synced.toLocaleString('tr-TR');
        logEl.innerHTML = data.log.map(function(x) {
          return '<span class="c-t">' + x[0] + '</span> <span class="c-' + x[1].toLowerCase() + '">[' + x[1] + ']</span> ' + esc(x[2]);
        }).join('\n') + '\n<span class="c-cur">_</span>';
        logEl.scrollTop = logEl.scrollHeight;
      };
      var up = function() {
        var s = Math.floor((Date.now() - t0) / 1000);
        qs('[data-up]', b).textContent = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60);
      };
      var iv = setInterval(up, 1000);
      up();
      qs('[data-toggle]', b).addEventListener('click', function() {
        data.svcOn = !data.svcOn;
        data.log.push([new Date().toLocaleTimeString('tr-TR'), data.svcOn ? 'INFO' : 'WARN', data.svcOn ? 'Servis başlatıldı' : 'Servis kullanıcı tarafından durduruldu']);
        qs('.pc__svc').classList.toggle('is-off', !data.svcOn);
        paint();
      });
      root.addEventListener('pc:log', paint);
      paint();
      return function() {
        clearInterval(iv);
        root.removeEventListener('pc:log', paint);
      };
    }
  });

  app('mesaj', {
    t: 'Mesajlar', i: 'fa-solid fa-comment-dots', c: '#2aa84a', w: 380, h: 330,
    draw: function(b) {
      var QA = [
        ['Hangi işleri yapıyorsunuz?', 'Masaüstü programlar, web siteleri, yönetim panelleri, entegrasyonlar ve tarayıcı eklentileri. Hepsi işletmenize göre tasarlanır.'],
        ['Fiyat nasıl belirleniyor?', 'Kapsam, ekran sayısı ve entegrasyonlara göre. Kısa bir görüşmeden sonra sabit fiyatlı teklif hazırlarım.'],
        ['Ne kadar sürer?', 'Kurumsal site genellikle 2-4 hafta, panel veya masaüstü uygulama 1-3 ay sürer.'],
        ['Teklif almak istiyorum', 'Harika! Formu doldurmanız yeterli, en geç 1 iş günü içinde dönüş yaparım.']
      ];
      var used = {}, busy = false, tm = [];
      b.innerHTML = '<div class="chat-w"><div class="chat" data-chat><div class="chat__m"><span class="chat__av">FK</span><p>Merhaba! Ben Furkan. Size nasıl yardımcı olabilirim?</p></div></div><div class="chat__q" data-q></div></div>';
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
        used[i] = busy = true;
        chips();
        add('<p>' + esc(QA[i][0]) + '</p>', true);
        var typing = add('<p class="chat__dots"><i></i><i></i><i></i></p>');
        tm.push(setTimeout(function() {
          typing.innerHTML = '<span class="chat__av">FK</span><p>' + esc(QA[i][1]) + (i === 3 ? '<a href="#iletisim" class="chat__cta">Teklif formuna git</a>' : '') + '</p>';
          chat.scrollTop = chat.scrollHeight;
          busy = false;
        }, reduce ? 0 : 1000));
      });
      b.addEventListener('click', function(e) {
        if (e.target.closest('.chat__cta')) {
          e.preventDefault();
          contact();
        }
      });
      chips();
      return function() {
        tm.forEach(clearTimeout);
      };
    }
  });

  var ICONS = [
    ['pc', 'Bu Bilgisayar', 'fa-solid fa-desktop', '#6cb6ff', 'explorer', 'pc'],
    ['docs', 'Belgelerim', 'fa-solid fa-folder', '#f4c04e', 'explorer', 'docs'],
    ['trash', 'Çöp Kutusu', 'fa-solid fa-trash-can', '#a6adb4', 'explorer', 'trash'],
    ['chrome', 'Google Chrome', 'fa-brands fa-chrome', '#4285f4', 'chrome'],
    ['kiraz', 'Kiraz Oto', 'fa-solid fa-car', '#e5533d', 'kiraz'],
    ['olivia', 'Olivia Salon', 'fa-solid fa-scissors', '#c58b4c', 'olivia'],
    ['servis', 'Entegrasyon Servisi', 'fa-solid fa-server', '#3aa676', 'servis'],
    ['mesaj', 'Mesajlar', 'fa-solid fa-comment-dots', '#2aa84a', 'mesaj'],
    ['teklif', 'Teklif Al', 'fa-solid fa-paper-plane', '#ffd66e', null]
  ];
  qs('[data-icons]').innerHTML = ICONS.map(function(x) {
    return '<button type="button" class="pc-ico" data-icon="' + x[0] + '"><span class="pc-ico__img" style="--c:' + x[3] + '">' + ic(x[2]) + '</span><span class="pc-ico__t">' + x[1] + '</span></button>';
  }).join('');
  var hello = document.createElement('div');
  hello.className = 'pc__hello';
  hello.innerHTML = '<small>Kapukaya Development</small><b>Bu bilgisayardaki her şey bizim geliştirdiğimiz yazılımlardan örnekler.</b><p>Chrome\'da web projelerini ve eklentileri, masaüstünde Kiraz Oto ve Olivia Salon programlarını açın; arka planda Entegrasyon Servisi çalışıyor.</p><div><button type="button" data-h="chrome">' + ic('fa-brands fa-chrome') + 'Web projeleri</button><button type="button" data-h="kiraz">' + ic('fa-solid fa-car') + 'Kiraz Oto</button></div>';
  desk.insertBefore(hello, winsEl);
  hello.addEventListener('click', function(e) {
    var b = e.target.closest('[data-h]');
    if (b) open(b.dataset.h, null, b);
  });
  qsa('[data-icon]').forEach(function(b, k) {
    b.addEventListener('click', function() {
      var x = ICONS[k];
      if (!x[4]) return contact();
      open(x[4], x[5], b);
    });
  });

  var wins = {}, z = 10, seq = 0;
  var small = function() {
    return desk.clientWidth < 480;
  };
  var focus = function(w) {
    Object.keys(wins).forEach(function(k) {
      wins[k].el.classList.toggle('is-front', wins[k] === w);
    });
    if (!w) return paintTasks();
    w.el.style.zIndex = ++z;
    w.min = false;
    w.el.hidden = false;
    w.el.classList.remove('is-min');
    paintTasks();
  };
  var front = function() {
    var best = null;
    Object.keys(wins).forEach(function(k) {
      var w = wins[k];
      if (!w.min && (!best || +w.el.style.zIndex > +best.el.style.zIndex)) best = w;
    });
    return best;
  };
  var open = function(id, arg, from) {
    closeStart();
    var key = id === 'explorer' ? 'explorer' : id, A = APPS[id];
    if (wins[key]) {
      var ex = wins[key];
      if (arg && ex.arg !== arg) {
        ex.arg = arg;
        ex.redraw(arg);
      }
      focus(ex);
      return ex;
    }
    var el = document.createElement('section');
    el.className = 'pc-win';
    el.setAttribute('aria-label', A.t);
    el.innerHTML = '<header class="pc-win__bar"><span class="pc-win__ic" style="color:' + A.c + '">' + ic(A.i) + '</span><b class="pc-win__t">' + esc(A.t) + '</b><div class="pc-win__ctl"><button type="button" data-w="min" aria-label="Simge durumuna küçült">' + ic('fa-solid fa-minus') + '</button><button type="button" data-w="max" aria-label="Ekranı kapla">' + ic('fa-regular fa-square') + '</button><button type="button" data-w="close" class="is-close" aria-label="Kapat">' + ic('fa-solid fa-xmark') + '</button></div></header><div class="pc-win__body"></div>';
    var dw = desk.clientWidth, dh = desk.clientHeight, ww = Math.min(A.w, dw - 24), wh = Math.min(A.h, dh - 20);
    var n = seq++ % 5;
    var x = Math.max(8, Math.min(dw - ww - 8, (dw - ww) / 2 + (n - 2) * 22)), y = Math.max(8, Math.min(dh - wh - 8, (dh - wh) / 2 + (n - 2) * 16));
    el.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + ww + 'px;height:' + wh + 'px';
    if (from) {
      var r = from.getBoundingClientRect(), d = desk.getBoundingClientRect();
      el.style.transformOrigin = (r.left + r.width / 2 - d.left - x) + 'px ' + (r.top + r.height / 2 - d.top - y) + 'px';
    }
    winsEl.appendChild(el);
    var w = { id: key, app: A, el: el, arg: arg, min: false, max: small(), cleanup: null };
    if (w.max) el.classList.add('is-max');
    w.setTitle = function(t) {
      qs('.pc-win__t', el).textContent = t;
    };
    w.close = function() {
      closeWin(w);
    };
    w.redraw = function(a) {
      if (w.cleanup) w.cleanup();
      var old = qs('.pc-win__body', el), nb = old.cloneNode(false);
      old.parentNode.replaceChild(nb, old);
      nb.className = 'pc-win__body app-' + id;
      w.cleanup = A.draw(nb, w, a) || null;
    };
    wins[key] = w;
    w.redraw(arg);
    requestAnimationFrame(function() {
      el.classList.add('is-open');
    });
    focus(w);
    el.addEventListener('pointerdown', function() {
      if (!el.classList.contains('is-front')) focus(w);
    });
    qs('.pc-win__ctl', el).addEventListener('click', function(e) {
      var b = e.target.closest('[data-w]');
      if (!b) return;
      if (b.dataset.w === 'close') closeWin(w);
      else if (b.dataset.w === 'min') minWin(w);
      else toggleMax(w);
    });
    var bar = qs('.pc-win__bar', el);
    bar.addEventListener('dblclick', function(e) {
      if (!e.target.closest('button')) toggleMax(w);
    });
    bar.addEventListener('pointerdown', function(e) {
      if (e.target.closest('button') || w.max || e.button !== 0) return;
      var sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop;
      el.classList.add('is-drag');
      bar.setPointerCapture(e.pointerId);
      var mv = function(ev) {
        var nx = Math.max(-el.offsetWidth + 80, Math.min(desk.clientWidth - 80, ox + ev.clientX - sx));
        var ny = Math.max(0, Math.min(desk.clientHeight - 36, oy + ev.clientY - sy));
        el.style.left = nx + 'px';
        el.style.top = ny + 'px';
      };
      var upf = function() {
        el.classList.remove('is-drag');
        bar.removeEventListener('pointermove', mv);
        bar.removeEventListener('pointerup', upf);
        bar.removeEventListener('pointercancel', upf);
      };
      bar.addEventListener('pointermove', mv);
      bar.addEventListener('pointerup', upf);
      bar.addEventListener('pointercancel', upf);
    });
    return w;
  };
  var closeWin = function(w) {
    if (w.cleanup) w.cleanup();
    delete wins[w.id];
    w.el.classList.remove('is-open');
    w.el.classList.add('is-closing');
    setTimeout(function() {
      w.el.remove();
    }, reduce ? 0 : 200);
    focus(front());
  };
  var minWin = function(w) {
    w.min = true;
    w.el.classList.add('is-min');
    setTimeout(function() {
      if (w.min) w.el.hidden = true;
    }, reduce ? 0 : 220);
    focus(front());
  };
  var toggleMax = function(w) {
    if (small()) return;
    w.max = !w.max;
    w.el.classList.toggle('is-max', w.max);
  };

  var PINNED = [['explorer', 'pc'], ['chrome'], ['kiraz'], ['olivia']];
  var paintTasks = function() {
    var ids = PINNED.map(function(p) {
      return p[0];
    });
    Object.keys(wins).forEach(function(k) {
      if (ids.indexOf(k) === -1) ids.push(k);
    });
    var f = front();
    tasks.innerHTML = ids.map(function(id) {
      var A = APPS[id], w = wins[id];
      return '<button type="button" class="pc-task' + (w ? ' is-run' : '') + (w && w === f && w.el.classList.contains('is-front') ? ' is-on' : '') + '" data-task="' + id + '" title="' + A.t + '" aria-label="' + A.t + '" style="--c:' + A.c + '">' + ic(A.i) + '</button>';
    }).join('');
  };
  tasks.addEventListener('click', function(e) {
    var b = e.target.closest('[data-task]');
    if (!b) return;
    var id = b.dataset.task, w = wins[id];
    if (!w) {
      var p = PINNED.filter(function(x) {
        return x[0] === id;
      })[0];
      open(id, p && p[1], b);
    } else if (!w.min && w.el.classList.contains('is-front')) minWin(w);
    else focus(w);
  });
  paintTasks();

  start.innerHTML = '<div class="sm"><label class="os-search">' + ic('fa-solid fa-magnifying-glass') + '<input type="search" placeholder="Uygulama ara" data-sm-q aria-label="Uygulama ara"></label><p class="sm__k">Uygulamalar</p><div class="sm__grid" data-sm-grid>' + [['chrome'], ['explorer', 'docs'], ['kiraz'], ['olivia'], ['servis'], ['mesaj'], ['sheet'], ['notepad']].map(function(p) {
    var A = APPS[p[0]];
    return '<button type="button" data-sm="' + p[0] + '" data-arg="' + (p[1] || '') + '" data-name="' + A.t.toLocaleLowerCase('tr') + '"><span style="--c:' + A.c + '">' + ic(A.i) + '</span>' + A.t.replace(' - Google Chrome', '').split(' - ')[0].replace('_', ' ').replace('.xlsx', '').replace('.txt', '') + '</button>';
  }).join('') + '</div><div class="sm__foot"><span class="sm__user"><span class="pc__logo">FK</span>Kapukaya Development</span><button type="button" class="pc-btn pc-btn--sm" data-sm-go>' + ic('fa-solid fa-paper-plane') + 'Teklif al</button></div></div>';
  var closeStart = function() {
    start.hidden = true;
    startBtn.setAttribute('aria-expanded', 'false');
  };
  startBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    var o = start.hidden;
    start.hidden = !o;
    startBtn.setAttribute('aria-expanded', o ? 'true' : 'false');
    if (o) qs('[data-sm-q]', start).value = '', qsa('[data-sm]', start).forEach(function(x) {
      x.hidden = false;
    });
  });
  start.addEventListener('click', function(e) {
    var b = e.target.closest('[data-sm]');
    if (b) open(b.dataset.sm, b.dataset.arg || null, startBtn);
    else if (e.target.closest('[data-sm-go]')) {
      closeStart();
      contact();
    }
  });
  qs('[data-sm-q]', start).addEventListener('input', function(e) {
    var v = e.target.value.toLocaleLowerCase('tr');
    qsa('[data-sm]', start).forEach(function(x) {
      x.hidden = v && x.dataset.name.indexOf(v) === -1 && x.textContent.toLocaleLowerCase('tr').indexOf(v) === -1;
    });
  });
  desk.addEventListener('pointerdown', function(e) {
    if (!start.hidden && !e.target.closest('[data-start]')) closeStart();
  });
  qsa('[data-open]').forEach(function(b) {
    b.addEventListener('click', function() {
      open(b.dataset.open, null, b);
    });
  });
  root.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    if (!start.hidden) return closeStart();
    var f = front();
    if (f && f.el.contains(document.activeElement)) closeWin(f);
  });

  for (var k = 0; k < 6; k++) svcTick();
  var running = false, visible = false, step = 0;
  var SCHEDULE = [
    function() {
      notify({ t: 'Entegrasyon Servisi', m: '18 sipariş ERP\'ye aktarıldı, 18 e-Arşiv fatura gönderildi.', i: 'fa-solid fa-server', c: '#3aa676', a: [['Günlüğü aç', function() {
        open('servis');
      }]] });
    },
    function() {
      notify({ t: 'Furkan Kapukaya', m: 'İşletmeniz için böyle bir sistem kuralım mı? Ücretsiz ön görüşme için teklif isteyin.', i: 'fa-solid fa-paper-plane', c: '#ffd66e', ms: 8000, a: [['Teklif al', contact], ['Mesaj gönder', function() {
        open('mesaj');
      }]] });
    },
    function() {
      notify({ t: 'Kiraz Oto', m: 'Silecek seti kritik stokta (3 adet). Sipariş önerisi hazır.', i: 'fa-solid fa-triangle-exclamation', c: '#e5533d', a: [['Stoğu aç', function() {
        open('kiraz');
      }]] });
    },
    function() {
      notify({ t: 'Yeni mesaj', m: 'Aklınıza takılan bir soru mu var? Hemen yazın, aynı gün dönüş yapayım.', i: 'fa-solid fa-comment-dots', c: '#2aa84a', ms: 8000, a: [['Mesaj gönder', function() {
        open('mesaj');
      }]] });
    }
  ];
  var loop = function() {
    if (visible && !document.hidden) {
      svcTick();
      if (step < SCHEDULE.length && (Date.now() - (loop.last || 0) > 13000)) {
        SCHEDULE[step++]();
        loop.last = Date.now();
      }
    }
  };
  if ('IntersectionObserver' in window) new IntersectionObserver(function(en) {
    visible = en[0].isIntersecting;
    if (visible && !running) {
      running = true;
      loop.last = Date.now() - 9000;
      setInterval(loop, 3500);
    }
  }, { threshold: .5 }).observe(root);
})();
