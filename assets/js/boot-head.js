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
