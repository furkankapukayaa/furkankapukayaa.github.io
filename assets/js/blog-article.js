(function () {
  'use strict';

  function getPageKey() {
    const path = window.location.pathname || '';
    const file = path.split('/').filter(Boolean).pop();
    if (file && /\.html$/i.test(file)) return decodeURIComponent(file);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      try {
        return new URL(canonical.href).pathname.split('/').filter(Boolean).pop() || '';
      } catch (e) {}
    }
    return '';
  }

  function safeStorageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  function safeStorageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) {}
  }

  function setMeta(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', value);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const article = document.querySelector('.blog-article');
    if (!article) return;

    document.body.classList.add('blog-article-page');

    const translations = window.BLOG_TRANSLATIONS || {};
    const pageData = translations[getPageKey()] || null;
    const body = article.querySelector('.article-body');
    const title = article.querySelector('h1');
    const kicker = article.querySelector('.blog-kicker');
    const meta = article.querySelector('.blog-meta');
    const breadcrumbs = article.querySelector('.blog-breadcrumbs');
    const langButtons = Array.from(document.querySelectorAll('.lang-btn[data-lang]'));
    const languageSwitch = document.querySelector('.blog-language-switch');
    const backLabel = document.querySelector('[data-back-label]');

    if (!body) return;

    // Reading progress bar.
    const progress = document.createElement('div');
    progress.className = 'reading-progress';
    progress.setAttribute('aria-hidden', 'true');
    progress.innerHTML = '<span></span>';
    document.body.prepend(progress);
    const progressBar = progress.querySelector('span');

    // Build the article hero without creating an author, related section or table of contents.
    if (title && !article.querySelector('.article-hero-card')) {
      const hero = document.createElement('header');
      hero.className = 'article-hero-card';
      const inner = document.createElement('div');
      inner.className = 'article-hero-inner';
      hero.appendChild(inner);

      if (breadcrumbs) inner.appendChild(breadcrumbs);
      if (kicker) inner.appendChild(kicker);
      inner.appendChild(title);
      if (meta) inner.appendChild(meta);

      const accent = document.createElement('div');
      accent.className = 'article-hero-accent';
      accent.setAttribute('aria-hidden', 'true');
      hero.appendChild(accent);
      article.insertBefore(hero, article.firstChild);
    }

    // Keep the reading column centered now that the table of contents is removed.
    if (!article.querySelector('.article-reading-grid')) {
      const grid = document.createElement('div');
      grid.className = 'article-reading-grid';
      const mainColumn = document.createElement('div');
      mainColumn.className = 'article-main-column';
      article.insertBefore(grid, body);
      grid.appendChild(mainColumn);
      mainColumn.appendChild(body);
    }

    let currentLanguage = 'tr';

    function renderMeta(lang, minutes) {
      if (!meta) return;
      const readText = lang === 'en' ? (minutes + ' min read') : (minutes + ' dk okuma');
      meta.classList.add('article-meta-row');
      meta.innerHTML = '';

      const author = document.createElement('span');
      author.className = 'article-meta-item';
      author.innerHTML = '<i class="fa-regular fa-user" aria-hidden="true"></i><span>Furkan Kapukaya</span>';

      const read = document.createElement('span');
      read.className = 'article-meta-item';
      read.innerHTML = '<i class="fa-regular fa-clock" aria-hidden="true"></i><span></span>';
      read.querySelector('span').textContent = readText;

      meta.appendChild(author);
      meta.appendChild(read);
    }

    function addCopyButtons() {
      body.querySelectorAll('pre').forEach(function (pre) {
        const old = pre.querySelector(':scope > .code-copy-btn');
        if (old) old.remove();

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'code-copy-btn';

        function resetButton() {
          const isEn = currentLanguage === 'en';
          button.setAttribute('aria-label', isEn ? 'Copy code' : 'Kodu kopyala');
          button.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i><span>' + (isEn ? 'Copy' : 'Kopyala') + '</span>';
        }

        resetButton();
        button.addEventListener('click', function () {
          const code = pre.querySelector('code');
          const text = (code || pre).innerText;
          if (!navigator.clipboard) return;
          navigator.clipboard.writeText(text).then(function () {
            button.classList.add('copied');
            button.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i><span>' + (currentLanguage === 'en' ? 'Copied' : 'Kopyalandı') + '</span>';
            window.setTimeout(function () {
              button.classList.remove('copied');
              resetButton();
            }, 1600);
          }).catch(function () {});
        });
        pre.appendChild(button);
      });
    }

    function updateStructuredData(langData, lang) {
      const ld = document.querySelector('script[type="application/ld+json"]');
      if (!ld) return;
      try {
        const obj = JSON.parse(ld.textContent || '{}');
        obj.headline = langData.title;
        obj.description = langData.description;
        obj.inLanguage = lang;
        ld.textContent = JSON.stringify(obj);
      } catch (e) {}
    }

    function applyLanguage(lang) {
      if (!pageData || !pageData[lang]) return;
      currentLanguage = lang;
      const langData = pageData[lang];

      document.documentElement.lang = lang;
      document.body.setAttribute('data-blog-lang', lang);
      if (title) title.textContent = langData.title;
      if (kicker) kicker.textContent = langData.category;
      if (breadcrumbs) {
        breadcrumbs.innerHTML = '<a href="../index.html">' + (lang === 'en' ? 'Home' : 'Ana Sayfa') + '</a> / <a href="./index.html">Blog</a> / ' + langData.category;
      }
      body.innerHTML = langData.body;
      renderMeta(lang, pageData.minutes);
      addCopyButtons();

      const fullTitle = langData.title + ' | Furkan Kapukaya';
      document.title = fullTitle;
      setMeta('meta[name="description"]', langData.description);
      setMeta('meta[property="og:title"]', fullTitle);
      setMeta('meta[property="og:description"]', langData.description);
      setMeta('meta[name="twitter:title"]', fullTitle);
      setMeta('meta[name="twitter:description"]', langData.description);
      updateStructuredData(langData, lang);

      if (backLabel) backLabel.textContent = lang === 'en' ? 'Back to blog' : 'Bloga geri dön';
      if (languageSwitch) languageSwitch.setAttribute('aria-label', lang === 'en' ? 'Language selection' : 'Dil seçimi');

      langButtons.forEach(function (button) {
        const active = button.dataset.lang === lang;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      safeStorageSet('blog-language', lang);
      updateProgress();
    }

    langButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        applyLanguage(button.dataset.lang === 'en' ? 'en' : 'tr');
      });
    });

    function updateProgress() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      progressBar.style.transform = 'scaleX(' + ratio + ')';
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);

    const stored = safeStorageGet('blog-language');
    const initialLanguage = stored === 'en' ? 'en' : 'tr';
    if (pageData) applyLanguage(initialLanguage);
    else {
      currentLanguage = document.documentElement.lang === 'en' ? 'en' : 'tr';
      addCopyButtons();
      updateProgress();
    }
  });
})();
