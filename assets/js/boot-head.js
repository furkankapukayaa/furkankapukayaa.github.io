(function() {
  var d = document.documentElement;
  if (window.top !== window.self) {
    var same = false;
    try {
      same = window.top.location.hostname === location.hostname;
    } catch (e) {
      same = false;
    }
    if (!same) {
      d.style.display = 'none';
      try {
        window.top.location = window.self.location.href;
      } catch (e) {}
      return;
    }
  }
  var a = {};
  try {
    a = JSON.parse(localStorage.getItem('fk-a11y') || '{}') || {};
  } catch (e) {}
  if (a.size) d.setAttribute('data-a11y-size', a.size);
  if (a.contrast) d.classList.add('a11y-contrast');
  if (a.links) d.classList.add('a11y-links');
  if (a.motion) d.classList.add('a11y-motion');
})();
(function() {
  var d = document.documentElement, seen = false;
  try {
    seen = sessionStorage.getItem('fk-splash') === '1';
    sessionStorage.setItem('fk-splash', '1');
  } catch (e) {
    seen = true;
  }
  var calm = d.classList.contains('a11y-motion') || window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (seen || calm || navigator.webdriver && !/splash/.test(location.hash)) return;
  d.classList.add('fk-splash');
  var end = function() {
    d.classList.remove('fk-splash');
    var s = document.getElementById('fk-splash');
    if (s) s.remove();
  };
  var t = setTimeout(end, 4000);
  document.addEventListener('DOMContentLoaded', (function() {
    var s = document.createElement('div');
    s.id = 'fk-splash';
    s.className = 'splash';
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<div class="splash__in"><span class="splash__mark">FK</span><span class="splash__name">Kapukaya Development</span><span class="splash__line"><i></i></span></div>';
    document.body.appendChild(s);
    setTimeout((function() {
      s.classList.add('is-out');
      d.classList.remove('fk-splash');
      setTimeout((function() {
        clearTimeout(t);
        end();
      }), 700);
    }), 1500);
  }));
})();
