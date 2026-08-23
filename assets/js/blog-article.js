(function () {
  'use strict';

  function slugify(text) {
    const map = {
      'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'İ': 'i',
      'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u'
    };
    return text
      .replace(/[çÇğĞıİöÖşŞüÜ]/g, function (char) { return map[char] || char; })
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function uniqueId(base, used) {
    let id = base || 'bolum';
    let index = 2;
    while (used.has(id) || document.getElementById(id)) {
      id = (base || 'bolum') + '-' + index++;
    }
    used.add(id);
    return id;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const article = document.querySelector('.blog-article');
    if (!article) return;

    document.body.classList.add('blog-article-page');

    // Reading progress
    const progress = document.createElement('div');
    progress.className = 'reading-progress';
    progress.setAttribute('aria-hidden', 'true');
    progress.innerHTML = '<span></span>';
    document.body.prepend(progress);
    const progressBar = progress.querySelector('span');

    // Group the article heading area into a premium hero card.
    const breadcrumbs = article.querySelector(':scope > .blog-breadcrumbs');
    const kicker = article.querySelector(':scope > .blog-kicker');
    const title = article.querySelector(':scope > h1');
    const meta = article.querySelector(':scope > .blog-meta');

    if (title) {
      const hero = document.createElement('header');
      hero.className = 'article-hero-card';
      const inner = document.createElement('div');
      inner.className = 'article-hero-inner';
      hero.appendChild(inner);

      if (breadcrumbs) inner.appendChild(breadcrumbs);
      if (kicker) inner.appendChild(kicker);
      inner.appendChild(title);

      if (meta) {
        const raw = meta.textContent.trim();
        const parts = raw.split('·').map(function (part) { return part.trim(); }).filter(Boolean);
        meta.textContent = '';
        meta.classList.add('article-meta-row');
        parts.forEach(function (part, index) {
          const item = document.createElement('span');
          item.className = 'article-meta-item';
          const icon = document.createElement('i');
          icon.className = index === 0 ? 'fa-regular fa-user' : 'fa-regular fa-clock';
          icon.setAttribute('aria-hidden', 'true');
          item.appendChild(icon);
          item.appendChild(document.createTextNode(part));
          meta.appendChild(item);
        });
        inner.appendChild(meta);
      }

      const accent = document.createElement('div');
      accent.className = 'article-hero-accent';
      accent.setAttribute('aria-hidden', 'true');
      hero.appendChild(accent);
      article.insertBefore(hero, article.firstChild);
    }

    const body = article.querySelector(':scope > .article-body');
    const related = article.querySelector(':scope > .blog-related');
    if (!body) return;

    // Build table of contents from h2 headings.
    const headings = Array.from(body.querySelectorAll('h2'));
    const usedIds = new Set();
    const toc = document.createElement('aside');
    toc.className = 'article-aside';
    toc.setAttribute('aria-label', 'İçindekiler');

    const tocCard = document.createElement('div');
    tocCard.className = 'article-toc-card';
    const tocTitle = document.createElement('div');
    tocTitle.className = 'article-toc-title';
    tocTitle.innerHTML = '<i class="fa-solid fa-list-ul" aria-hidden="true"></i><span>İçindekiler</span>';
    tocCard.appendChild(tocTitle);

    const nav = document.createElement('nav');
    nav.className = 'article-toc-links';

    headings.forEach(function (heading, index) {
      if (!heading.id) heading.id = uniqueId(slugify(heading.textContent), usedIds);
      const link = document.createElement('a');
      link.href = '#' + heading.id;
      link.textContent = heading.textContent;
      if (index === 0) link.classList.add('active');
      nav.appendChild(link);
    });

    tocCard.appendChild(nav);
    toc.appendChild(tocCard);

    // Reading column.
    const grid = document.createElement('div');
    grid.className = 'article-reading-grid';
    const mainColumn = document.createElement('div');
    mainColumn.className = 'article-main-column';

    article.insertBefore(grid, body);
    grid.appendChild(toc);
    grid.appendChild(mainColumn);
    mainColumn.appendChild(body);
    if (related) mainColumn.appendChild(related);

    // Author / continuation card.
    const author = document.createElement('div');
    author.className = 'article-author-card';
    author.innerHTML = [
      '<img src="../assets/images/my-avatar.png" alt="Furkan Kapukaya" loading="lazy">',
      '<div class="article-author-copy">',
      '<span class="article-author-label">Yazar</span>',
      '<strong>Furkan Kapukaya</strong>',
      '<p>Software Developer · C#, .NET, backend ve yazılım çözümleri üzerine notlar.</p>',
      '</div>',
      '<a href="./index.html" class="article-author-link">Tüm yazılar <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>'
    ].join('');
    mainColumn.appendChild(author);

    // Copy buttons for code examples.
    body.querySelectorAll('pre').forEach(function (pre) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy-btn';
      button.setAttribute('aria-label', 'Kodu kopyala');
      button.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i><span>Kopyala</span>';
      button.addEventListener('click', function () {
        const code = pre.querySelector('code');
        const text = (code || pre).innerText;
        if (!navigator.clipboard) return;
        navigator.clipboard.writeText(text).then(function () {
          button.classList.add('copied');
          button.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i><span>Kopyalandı</span>';
          window.setTimeout(function () {
            button.classList.remove('copied');
            button.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i><span>Kopyala</span>';
          }, 1600);
        }).catch(function () {});
      });
      pre.appendChild(button);
    });

    // Scroll state: reading progress + active table-of-contents link.
    const tocLinks = Array.from(nav.querySelectorAll('a'));
    function updateScrollState() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      progressBar.style.transform = 'scaleX(' + ratio + ')';

      if (!headings.length) return;
      let current = headings[0].id;
      const marker = window.scrollY + 170;
      headings.forEach(function (heading) {
        if (heading.getBoundingClientRect().top + window.scrollY <= marker) current = heading.id;
      });
      tocLinks.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
      });
    }

    window.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    updateScrollState();
  });
})();
