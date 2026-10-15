/* =============================================================
   RF CMS LOADER — menghubungkan halaman HTML statis ke Supabase
   -------------------------------------------------------------
   Cara pakai di halaman HTML (letakkan sebelum </body>):

     <script>
       window.RF_CMS_CONFIG = {
         url: 'https://xxxx.supabase.co',
         anonKey: 'eyJ...',   // anon key, aman di publik (dilindungi RLS)
         page: 'home'         // slug halaman: home|about|services|portfolio|pricelist|blog|contact
       };
     </script>
     <script src="assets/js/rf-cms.js" defer></script>

   Menandai elemen yang isinya diambil dari CMS:

     <h1 data-cms="home.hero.title">Turning Ideas Into Impact.</h1>
     <p  data-cms="home.hero.subtitle">…</p>
     <a  data-cms="home.hero.cta_label" data-cms-attr="href:home.hero.cta_url">Let's Talk</a>
     <img data-cms-attr="src:home.hero.image" src="assets/img/…">

   Isi HTML yang sudah ada dipakai sebagai fallback: kalau CMS
   belum punya datanya atau koneksi gagal, halaman tetap tampil
   normal seperti sekarang.
   ============================================================= */
(function () {
  'use strict';

  var CFG = window.RF_CMS_CONFIG || {};
  if (!CFG.url || !CFG.anonKey) return;

  var REST = CFG.url.replace(/\/+$/, '') + '/rest/v1';
  var HEADERS = { apikey: CFG.anonKey, Authorization: 'Bearer ' + CFG.anonKey };
  var PAGE = CFG.page || 'home';
  var store = {
    sections: {},
    settings: {},
    projects: [],
    posts: [],
    faqs: [],
  };

  /* --------------------------------------------------------- fetch */
  function get(path) {
    return fetch(REST + path, { headers: HEADERS })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .catch(function () {
        return [];
      });
  }

  /* --------------------------------------------------------- value lookup
     Kunci berbentuk "<page>.<sectionKey>.<field>" atau "settings.<key>"    */
  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function resolve(key) {
    if (!key) return undefined;
    var parts = key.split('.');

    if (parts[0] === 'settings') {
      return store.settings[parts.slice(1).join('.')];
    }

    var sectionKey = parts[1];
    var field = parts.slice(2).join('.');
    var section = store.sections[sectionKey];
    if (!section) return undefined;
    if (!field) return section.body;

    return field.split('.').reduce(function (acc, k) {
      if (acc == null) return undefined;
      return acc[k];
    }, section.body || {});
  }

  /* --------------------------------------------------------- render */
  function applyText(el) {
    var value = resolve(el.getAttribute('data-cms'));
    if (value == null || value === '') return;

    if (typeof value === 'string') {
      el.innerHTML = value;
    } else {
      el.textContent = String(value);
    }
  }

  /* Mengganti hanya text node terakhir, struktur anak (ikon, svg) dibiarkan.
     Dipakai pada tombol yang isinya campuran <span><svg></span> + teks. */
  function applyTextNode(el) {
    var value = resolve(el.getAttribute('data-cms-text'));
    if (value == null || value === '') return;

    for (var i = el.childNodes.length - 1; i >= 0; i--) {
      var node = el.childNodes[i];
      if (node.nodeType === 3 && node.nodeValue.trim() !== '') {
        node.nodeValue = String(value);
        return;
      }
    }
    el.appendChild(document.createTextNode(String(value)));
  }

  function applyAttrs(el) {
    el.getAttribute('data-cms-attr')
      .split(',')
      .forEach(function (pair) {
        var bits = pair.split(':');
        if (bits.length < 2) return;
        var attr = bits[0].trim();
        var value = resolve(bits.slice(1).join(':').trim());
        if (value == null || value === '') return;
        el.setAttribute(attr, String(value));
      });
  }

  /* --------------------------------------------------------- kategori filter
     Halaman portfolio memakai kunci pendek pada tombol filter
     (yearbook|web|app|ar|event). Nama kategori di CMS lebih panjang,
     jadi dipetakan supaya tombol filter tetap berfungsi. */
  function catKey(category) {
    var c = String(category || '').toLowerCase();
    if (c.indexOf('yearbook') !== -1) return 'yearbook';
    if (c.indexOf('ar') === 0 || c.indexOf('ar tech') !== -1) return 'ar';
    if (c.indexOf('app') !== -1) return 'app';
    if (c.indexOf('event') !== -1) return 'event';
    if (c.indexOf('web') !== -1) return 'web';
    return 'web';
  }

  /* --------------------------------------------------------- portfolio grid
     Membangun ulang #grid dari CMS. Setelah selesai, halaman
     mengindeks ulang kartunya lewat event rf-cms:rendered. */
  function renderPortfolio() {
    var grid = document.getElementById('grid');
    if (!grid || !store.projects.length) return;

    var html = '';
    store.projects.forEach(function (p) {
      var img = p.thumbnail
        ? '<img src="' + esc(p.thumbnail) + '" alt="' + esc(p.title) + '" loading="lazy">'
        : '';
      var pov = '<a class="pov" href="' + esc(p.url || '#') + '"' + (p.url ? ' target="_blank" rel="noopener"' : '') + '>' +
            '<span class="pov-cat">' + esc(p.category || '') + '</span>' +
            '<span class="pov-title">' + esc(p.title) + '</span>' +
            '<span class="pov-link">' + esc(p.url ? 'View Project &#8594;' : 'Coming Soon') + '</span>' +
          '</a>';
      var tags = (p.tags || []).map(function (t) {
        return '<span>' + esc(t) + '</span>';
      }).join('');
      var haystack = [p.title, p.client, p.category, (p.tags || []).join(' ')]
        .filter(Boolean).join(' ').toLowerCase();

      html += '<article class="pcard rv" data-cat="' + esc(catKey(p.category)) + '"' +
                ' data-q="' + esc(haystack) + '">' +
                '<div class="pcard-media">' +
                  (p.year ? '<span class="year">' + esc(p.year) + '</span>' : '') +
                  img + pov +
                '</div>' +
                '<div class="pcard-body">' +
                  '<h3>' + esc(p.title) + '</h3>' +
                  '<p>' + esc(p.summary || '') + '</p>' +
                  '<div class="tags">' + tags + '</div>' +
                '</div>' +
              '</article>';
    });

    grid.innerHTML = html;
  }

  /* --------------------------------------------------------- skill bars */
  function renderSkillBars() {
    var bar = document.getElementById('rfSkillBars');
    if (!bar || !store.skills || !store.skills.items || !store.skills.items.length) return;
    var items = store.skills.items;
    var html = '';
    items.forEach(function (s) {
      html += '<div class="rf-sb-item">' +
                '<div class="rf-sb-hd">' +
                  '<span class="rf-sb-name">' + esc(s.label || s.title) + '</span>' +
                  '<span class="rf-sb-pct">' + esc(s.value || s.pct || s.percent) + '</span>' +
                '</div>' +
                '<div class="rf-sb-track">' +
                  '<div class="rf-sb-fill" style="width:' + esc(s.value || s.pct || s.percent) + '"></div>' +
                '</div>' +
              '</div>';
    });
    bar.innerHTML = html;
  }

  /* --------------------------------------------------------- blog helpers */
  function postCatKey(category) {
    var c = String(category || '').toLowerCase();
    if (c.indexOf('tech') !== -1) return 'tech';
    if (c.indexOf('business') !== -1) return 'business';
    if (c.indexOf('journey') !== -1) return 'journey';
    if (c.indexOf('design') !== -1) return 'design';
    if (c.indexOf('news') !== -1) return 'news';
    return 'tech';
  }

  function monthYear(value) {
    if (!value) return '';
    var d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  /* --------------------------------------------------------- blog */
  function renderBlog() {
    if (!store.posts.length) return;

    var postGrid = document.getElementById('postGrid');

    /* ---- Halaman blog penuh ---- */
    if (postGrid) {
      var featured = null;
      var rest = [];
      store.posts.forEach(function (p) {
        if (!featured && p.is_featured) featured = p;
        else rest.push(p);
      });

       var featEl = document.getElementById('featured');
       if (featEl) {
         if (featured) {
           featEl.setAttribute('data-cat', postCatKey(featured.category));
           featEl.setAttribute('data-q', [featured.title, (featured.tags || []).join(' ')]
             .join(' ').toLowerCase());
           var catEl = featEl.querySelector('.feat-cat');
           if (catEl) catEl.textContent = featured.category || '';
           var h2 = featEl.querySelector('h2');
           if (h2) h2.textContent = featured.title || '';
           var pEl = featEl.querySelector('.feat-body p');
           if (pEl) pEl.textContent = featured.excerpt || '';
           var metaSpans = featEl.querySelectorAll('.feat-meta span');
           if (metaSpans.length >= 5) {
             metaSpans[2].textContent = (featured.read_minutes || 5) + ' min read';
             metaSpans[4].textContent = monthYear(featured.published_at);
           }

           /* Update featured image jika tersedia */
           var featMedia = featEl.querySelector('.feat-media');
           if (featMedia && featured.cover) {
             var img = document.createElement('img');
             img.src = featured.cover;
             img.alt = featured.title || '';
             img.style.width = '100%';
             img.style.height = '100%';
             img.style.objectFit = 'cover';
             img.style.display = 'block';
             featMedia.innerHTML = '';
             featMedia.appendChild(img);
             var featPin = document.createElement('span');
             featPin.className = 'feat-pin';
             featPin.textContent = '★ Featured';
             featMedia.appendChild(featPin);
           }

           /* Kartu unggulan dibuat bisa diklik menuju halaman artikel */
           featEl.style.cursor = 'pointer';
           if (!featEl.dataset.linked) {
             featEl.dataset.linked = '1';
             featEl.addEventListener('click', function () {
               location.href = 'post.html?slug=' + featEl.dataset.slug;
             });
           }
           featEl.dataset.slug = featured.slug;
         } else {
           featEl.style.display = 'none';
         }
       }

      var phColors = ['a', 'b', 'c', 'd', 'e', 'f'];
       var html = '';
       rest.forEach(function (p, i) {
         var cat = p.category || 'Tech';
         var tags = (p.tags || []).map(function (t) {
           return '<span>' + esc(t) + '</span>';
         }).join('');
         var haystack = [p.title, p.excerpt, cat, (p.tags || []).join(' ')]
           .filter(Boolean).join(' ').toLowerCase();

         var mediaHtml = '';
         if (p.cover) {
           mediaHtml = '<img src="' + esc(p.cover) + '" alt="' + esc(p.title) + '" loading="lazy">';
         } else {
           mediaHtml = '<div class="ph ph-' + phColors[i % 6] + '">' +
                       '<svg viewBox="0 0 24 24"><path d="M12 2l9 5v10l-9 5-9-5V7l9-5z"></path>' +
                       '<path d="M3 7l9 5 9-5M12 12v10"></path></svg>' +
                       '<span>' + esc(cat) + '</span>' +
                       '</div>';
         }

         html += '<article class="post rv" data-cat="' + esc(postCatKey(cat)) + '"' +
                   ' data-q="' + esc(haystack) + '">' +
                   '<div class="post-media">' +
                     mediaHtml +
                     '<span class="post-pin">' + esc(cat) + '</span>' +
                     '<span class="post-read">' + (p.read_minutes || 5) + ' min</span>' +
                   '</div>' +
                   '<div class="post-body">' +
                     '<div class="post-date">' + esc(monthYear(p.published_at)) + '</div>' +
                     '<h3>' + esc(p.title) + '</h3>' +
                     '<p>' + esc(p.excerpt || '') + '</p>' +
                     '<div class="post-tags">' + tags + '</div>' +
                     '<a class="post-more" href="post.html?slug=' + esc(p.slug) + '">Read article &#8594;</a>' +
                   '</div>' +
                 '</article>';
       });

      postGrid.innerHTML = html;
      return;
    }

     /* ---- Blok blog di halaman home ---- */
     var homeRow = document.querySelectorAll('.app-blog-area .row');
     homeRow = homeRow.length > 1 ? homeRow[1] : null;
     if (!homeRow) return;

     var bgColors = ['rf-bg-a', 'rf-bg-b', 'rf-bg-c', 'rf-bg-d', 'rf-bg-e', 'rf-bg-f'];
     var delays = ['.3', '.5', '.7', '.3', '.5', '.7'];
     var homeHtml = '';
     store.posts.slice(0, 6).forEach(function (p, i) {
       var cat = p.category || 'Tech';
       var mono = cat.slice(0, 2).toUpperCase();
       var mediaHtml = '';
       var monoDisplay = 'block';
       if (p.cover) {
         mediaHtml = '<img src="' + esc(p.cover) + '" alt="' + esc(p.title) + '" style="width:100%; height:100%; object-fit:cover; display:block; position:relative; z-index:1;" loading="lazy">';
         monoDisplay = 'none';
       }
       homeHtml += '<div class="col-lg-4 col-md-6">' +
                     '<a href="post.html?slug=' + esc(p.slug) + '" class="rf-bcard tp_fade_anim"' +
                       ' data-delay="' + delays[i % 6] + '">' +
                       '<div class="rf-bcard-media ' + bgColors[i % 6] + '" style="position:relative;">' +
                         mediaHtml +
                         '<span class="rf-bcard-pin">' + esc(cat) + '</span>' +
                         '<span class="rf-bcard-read">' + (p.read_minutes || 5) + ' min</span>' +
                         '<div class="rf-bcard-mono" style="display:' + monoDisplay + ';">' + esc(mono) + '</div>' +
                       '</div>' +
                       '<div class="rf-bcard-body">' +
                         '<div class="rf-bcard-date">' + esc(monthYear(p.published_at)) + '</div>' +
                         '<h4 class="rf-bcard-title">' + esc(p.title) + '</h4>' +
                         '<p class="rf-bcard-text">' + esc(p.excerpt || '') + '</p>' +
                         '<span class="rf-bcard-more">Read article &#8594;</span>' +
                       '</div>' +
                     '</a>' +
                   '</div>';
     });
    homeRow.innerHTML = homeHtml;
  }

  /* --------------------------------------------------------- FAQ */
  function renderFAQ() {
    var list = document.getElementById('rfFaqList');
    if (!list || !store.faqs || !store.faqs.length) return;
    var html = '';
    store.faqs.forEach(function (f) {
      if (!f.is_published) return;
      html += '<div class="rf-faq-item">' +
                '<button class="rf-faq-btn">' + esc(f.question) + '<div class="rf-faq-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14" /></svg></div></button>' +
                '<div class="rf-faq-ans"><div class="rf-faq-ans-in">' + esc(f.answer) + '</div></div>' +
              '</div>';
    });
    if (html) list.innerHTML = html;
  }

  function render() {
    document.querySelectorAll('[data-cms]').forEach(applyText);
    document.querySelectorAll('[data-cms-text]').forEach(applyTextNode);
    document.querySelectorAll('[data-cms-attr]').forEach(applyAttrs);

    // Custom renderers (periksa container ada dulu)
    if (store.projects.length) renderPortfolio();
    if (store.skills && document.getElementById('rfSkillBars')) renderSkillBars();
    if (store.posts.length) renderBlog();
    if (store.faqs && document.getElementById('rfFaqList')) renderFAQ();

    document.dispatchEvent(new CustomEvent('rf-cms:rendered', { detail: store }));
  }

  /* --------------------------------------------------------- load */
  function load() {
    return Promise.all([
      get('/sections?select=key,body,kind,sort_order&page_slug=eq.' + encodeURIComponent(PAGE) +
        '&is_published=eq.true&order=sort_order.asc'),
      get('/settings?select=key,value'),
      get('/projects?select=*&is_published=eq.true&order=sort_order.asc'),
      get('/posts?select=*&is_published=eq.true&order=published_at.desc&limit=20'),
      get('/faqs?select=*&is_published=eq.true&page_slug=eq.home&order=sort_order.asc'),
    ]).then(function (res) {
      (res[0] || []).forEach(function (s) {
        store.sections[s.key] = s;
      });
      (res[1] || []).forEach(function (s) {
        store.settings[s.key] = s.value;
      });
      store.projects = res[2] || [];
      store.posts = res[3] || [];
      store.faqs = res[4] || [];
      render();
    });
  }

  /* --------------------------------------------------------- public API
     Untuk render dinamis (portfolio, blog, pricelist) yang butuh markup
     custom, ambil datanya sendiri lalu bangun DOM sesuai template. */
  window.RFCMS = {
    store: store,
    get: get,
    value: resolve,
    render: render,
    projects: function (limit) {
      return get('/projects?select=*&is_published=eq.true&order=sort_order.asc' +
        (limit ? '&limit=' + limit : ''));
    },
    posts: function (limit) {
      return get('/posts?select=*&is_published=eq.true&order=published_at.desc' +
        (limit ? '&limit=' + limit : ''));
    },
    services: function () {
      return get('/services?select=*&is_published=eq.true&order=sort_order.asc');
    },
    plans: function () {
      return get('/pricing_plans?select=*&is_published=eq.true&order=sort_order.asc');
    },
    addons: function () {
      return get('/pricing_addons?select=*&is_published=eq.true&order=sort_order.asc');
    },
    faqs: function (page) {
      return get('/faqs?select=*&is_published=eq.true&page_slug=eq.' +
        encodeURIComponent(page || PAGE) + '&order=sort_order.asc');
    },
    /* Kirim submission form kontak ke tabel messages */
    sendMessage: function (payload) {
      return fetch(REST + '/messages', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }, HEADERS),
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          phone: payload.phone || null,
          subject: payload.subject || null,
          message: payload.message,
          source: location.pathname.split('/').pop() || 'index.html',
        }),
      }).then(function (res) {
        if (!res.ok) throw new Error('Gagal mengirim pesan.');
        return true;
      });
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
