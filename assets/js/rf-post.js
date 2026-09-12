/* =============================================================
   RF POST — halaman detail artikel (post.html)
   -------------------------------------------------------------
   Membaca ?slug=... dari URL, lalu mengambil artikel dari Supabase
   melalui window.RFCMS yang disediakan rf-cms.js.

   Juga menyiapkan artikel sebelumnya/berikutnya dan tiga artikel
   terkait berdasarkan kategori yang sama.
   ============================================================= */
(function () {
  'use strict';

  var CFG = window.RF_CMS_CONFIG || {};
  if (!CFG.url || !CFG.anonKey) return;

  var REST = CFG.url.replace(/\/+$/, '') + '/rest/v1';
  var HEADERS = { apikey: CFG.anonKey, Authorization: 'Bearer ' + CFG.anonKey };

  var elLoad = document.getElementById('stLoad');
  var elEmpty = document.getElementById('stEmpty');
  var elArt = document.getElementById('stArt');

  /* --------------------------------------------------------- utils */
  function get(path) {
    return fetch(REST + path, { headers: HEADERS })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .catch(function () { return []; });
  }

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function monthYear(value) {
    if (!value) return '';
    var d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function slugParam() {
    var m = location.search.match(/[?&]slug=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function show(el) { if (el) el.classList.remove('hide'); }
  function hide(el) { if (el) el.classList.add('hide'); }

  /* --------------------------------------------------------- render */
  function renderArticle(post) {
    document.title = post.title + ' — Ramahfakhirin';

    var meta = document.querySelector('meta[name="description"]');
    if (meta && post.excerpt) meta.setAttribute('content', post.excerpt);

    var cat = post.category || 'Article';
    document.getElementById('crumbCat').textContent = cat;
    document.getElementById('artCat').textContent = cat;
    document.getElementById('artTitle').textContent = post.title;
    document.getElementById('artAuthor').textContent = post.author || 'Rama Hadyan Fakhirin';
    document.getElementById('artDate').textContent = monthYear(post.published_at);
    document.getElementById('artRead').textContent = (post.read_minutes || 5) + ' min read';

    var lead = document.getElementById('artLead');
    if (post.excerpt) lead.textContent = post.excerpt;
    else hide(lead);

    /* Cover: pakai gambar kalau ada, kalau tidak pakai inisial kategori */
    var cover = document.getElementById('artCover');
    if (post.cover) {
      cover.className = 'art-cover';
      cover.innerHTML = '<img src="' + esc(post.cover) + '" alt="' + esc(post.title) + '">';
    } else {
      cover.className = 'art-cover ph';
      cover.innerHTML = '<b>' + esc(cat.slice(0, 2).toUpperCase()) + '</b>';
    }

    /* Isi artikel. Konten berasal dari admin terautentikasi (RLS),
       jadi HTML sederhana diizinkan. Kalau kosong, pakai excerpt. */
    var body = document.getElementById('artBody');
    var content = (post.content || '').trim();
    if (!content) content = '<p>' + esc(post.excerpt || '') + '</p>';
    if (content.indexOf('<') !== 0 && content.indexOf('<p') === -1) {
      content = '<p>' + content + '</p>';
    }
    body.innerHTML = content;

    /* Tag */
    var tags = Array.isArray(post.tags) ? post.tags : [];
    var elTags = document.getElementById('artTags');
    if (tags.length) {
      elTags.innerHTML = tags.map(function (t) {
        return '<span>' + esc(t) + '</span>';
      }).join('');
      show(elTags);
    }

    /* Share */
    var url = location.href;
    var title = post.title;
    document.getElementById('shWa').addEventListener('click', function () {
      window.open('https://wa.me/?text=' + encodeURIComponent(title + ' — ' + url), '_blank', 'noopener');
    });
    document.getElementById('shLi').addEventListener('click', function () {
      window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url), '_blank', 'noopener');
    });
    document.getElementById('shCopy').addEventListener('click', function () {
      var btn = this;
      navigator.clipboard.writeText(url).then(function () {
        var old = btn.getAttribute('title');
        btn.setAttribute('title', 'Link copied');
        setTimeout(function () { btn.setAttribute('title', old); }, 1800);
      });
    });

    hide(elLoad);
    show(elArt);
  }

  function renderNav(all, current) {
    var idx = -1;
    all.forEach(function (p, i) { if (p.slug === current.slug) idx = i; });
    if (idx === -1) return;

    var prev = all[idx + 1];  // urutan desc, jadi index besar = lebih lama
    var next = all[idx - 1];
    var html = '';

    if (prev) {
      html += '<a class="pv" href="post.html?slug=' + esc(prev.slug) + '">' +
                '<small>&larr; Previous</small><b>' + esc(prev.title) + '</b></a>';
    } else {
      html += '<span></span>';
    }
    if (next) {
      html += '<a class="nx" href="post.html?slug=' + esc(next.slug) + '">' +
                '<small>Next &rarr;</small><b>' + esc(next.title) + '</b></a>';
    }
    document.getElementById('artNav').innerHTML = html;
  }

  function renderRelated(all, current) {
    var same = [];
    var other = [];
    all.forEach(function (p) {
      if (p.slug === current.slug) return;
      if (p.category === current.category) same.push(p);
      else other.push(p);
    });

    var picks = same.concat(other).slice(0, 3);
    if (!picks.length) return;

    document.getElementById('relGrid').innerHTML = picks.map(function (p) {
      var cat = p.category || 'Article';
      var media = p.cover
        ? '<div class="rcard-ph" style="background-image:url(' + esc(p.cover) + ');background-size:cover;background-position:center"></div>'
        : '<div class="rcard-ph"><b>' + esc(cat.slice(0, 2).toUpperCase()) + '</b></div>';

      return '<a class="rcard rv" href="post.html?slug=' + esc(p.slug) + '">' +
               media +
               '<div class="rcard-b">' +
                 '<div class="rcard-c">' + esc(cat) + '</div>' +
                 '<h3>' + esc(p.title) + '</h3>' +
                 '<p>' + esc((p.excerpt || '').slice(0, 110)) + '…</p>' +
                 '<div class="rcard-m">' + esc(monthYear(p.published_at)) +
                   ' · ' + (p.read_minutes || 5) + ' min</div>' +
               '</div>' +
             '</a>';
    }).join('');

    show(document.getElementById('relSec'));
    document.querySelectorAll('.rv:not(.in)').forEach(function (el) {
      el.classList.add('in');
    });
  }

  /* --------------------------------------------------------- boot */
  function boot() {
    var slug = slugParam();
    if (!slug) {
      hide(elLoad);
      show(elEmpty);
      return;
    }

    Promise.all([
      get('/posts?select=*&slug=eq.' + encodeURIComponent(slug) + '&is_published=eq.true&limit=1'),
      get('/posts?select=slug,title,excerpt,category,cover,read_minutes,published_at' +
          '&is_published=eq.true&order=published_at.desc'),
    ]).then(function (res) {
      var post = (res[0] || [])[0];
      var all = res[1] || [];

      if (!post) {
        hide(elLoad);
        show(elEmpty);
        return;
      }

      renderArticle(post);
      renderNav(all, post);
      renderRelated(all, post);

      /* Hitung pembacaan. Gagal pun tidak masalah. */
      fetch(REST + '/rpc/increment_post_views', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, HEADERS),
        body: JSON.stringify({ p_slug: post.slug }),
      }).catch(function () { /* diamkan */ });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
