(function () {
  'use strict';

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsViewTransition = 'startViewTransition' in document;

  document.documentElement.classList.add('page-transition-enabled');

  // Native cross-document View Transitions are used on the deployed HTTPS site.
  // Local file:// pages cannot reliably share an origin in modern browsers, so
  // the script intentionally falls back to a tiny fade without trying to read
  // or manipulate another document/frame.
  if (!reduceMotion && supportsViewTransition && location.protocol !== 'file:') {
    document.documentElement.style.setProperty('--page-transition-duration', '220ms');
  }

  if (reduceMotion) return;

  document.addEventListener('click', function (event) {
    const link = event.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') ||
        href.startsWith('javascript:') || link.target === '_blank' || link.hasAttribute('download')) return;

    let target;
    try {
      target = new URL(href, window.location.href);
    } catch (_) {
      return;
    }

    // Only animate normal local page navigation. External links are left alone.
    if (target.origin !== window.location.origin) return;
    if (target.href === window.location.href) return;

    // On the real website, let the browser's MPA View Transition API handle
    // the transition. This is smoother and avoids a blank-page delay.
    if (supportsViewTransition && location.protocol !== 'file:') return;

    event.preventDefault();
    document.documentElement.classList.add('page-leaving');

    // Very short fallback for local file:// testing and older browsers.
    window.setTimeout(function () {
      window.location.assign(target.href);
    }, 150);
  }, false);

  window.addEventListener('pageshow', function () {
    document.documentElement.classList.remove('page-leaving');
  });
})();
