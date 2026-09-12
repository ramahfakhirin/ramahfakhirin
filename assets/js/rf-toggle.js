/* =============================================================
   RF TOGGLE — EN/ID language switcher
   Shared by every page. Self-injecting: no per-page markup
   needed beyond loading this file.

   Default language: English. Persisted in localStorage("rf-lang").
   Translates any element carrying data-rf-id, or falls back to
   text matching when data-rf-id is missing.
   ============================================================= */
(function () {
  'use strict';

  var LANG_KEY = 'rf-lang';
  var root = document.documentElement;

  function storedLang() {
    try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; }
  }

  function save(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }

  var lang = storedLang() === 'id' ? 'id' : 'en';

  /* ─────────────────────────────────────────────────────────────
     1. DICTIONARY — combined key table + runtime string matcher
     ───────────────────────────────────────────────────────────── */
  var DictByID = window.RF_I18N_ID || {};

  /* Cache original English HTML so switching back is 100% lossless. */
  var nodes = [];

  function norm(s) {
    return (s || '').replace(/\s+/g, ' ').trim();
  }

  function collect() {
    nodes = [];
    document.querySelectorAll('[data-rf-id]').forEach(function (el) {
      nodes.push({
        el: el,
        key: el.getAttribute('data-rf-id'),
        enHtml: el.innerHTML
      });
    });
  }

  function applyLang(next) {
    lang = next;
    root.setAttribute('lang', next);

    nodes.forEach(function (n) {
      if (next === 'en') {
        n.el.innerHTML = n.enHtml;
        return;
      }
      /* ID mode: try key lookup first, then HTML match */
      var idText = DictByID[n.key];
      if (idText) {
        n.el.innerHTML = idText;
      }
    });

    /* input placeholders */
    document.querySelectorAll('[data-rf-ph]').forEach(function (el) {
      if (!el.dataset.rfPhEn) el.dataset.rfPhEn = el.getAttribute('placeholder') || '';
      var k = el.getAttribute('data-rf-ph');
      var idPh = DictByID[k];
      el.setAttribute('placeholder', (next === 'id' && idPh) ? idPh : el.dataset.rfPhEn);
    });

    /* update toggle button aria/state */
    document.querySelectorAll('.rf-tg-lang').forEach(function (tg) {
      tg.setAttribute('data-lang', next);
      tg.setAttribute('aria-label', next === 'id' ? 'Ganti ke Bahasa Inggris' : 'Switch to Indonesian');
      tg.querySelectorAll('span').forEach(function (s) {
        s.classList.toggle('on', s.getAttribute('data-l') === next);
      });
    });

    save(LANG_KEY, next);
  }

  /* ─────────────────────────────────────────────────────────────
     2. MARKUP INJECTION — desktop + mobile
     ───────────────────────────────────────────────────────────── */
  function toolsHTML() {
    return '<button type="button" class="rf-tg rf-tg-lang" data-lang="en" aria-label="Switch language">' +
      '<span data-l="en" class="on">EN</span><span data-l="id">ID</span>' +
      '</button>';
  }

  function inject() {
    var host = document.querySelector('.hdr-right')
      || document.querySelector('.tp-header-10-right');
    if (host && !host.querySelector('.rf-tools')) {
      var d = document.createElement('div');
      d.className = 'rf-tools rf-tools-desktop';
      d.innerHTML = toolsHTML();
      var burger = host.querySelector('#burger') || host.querySelector('.tp-header-10-offcanvas');
      if (burger) host.insertBefore(d, burger); else host.appendChild(d);
    }

    var mob = document.querySelector('#mobileNav')
      || document.querySelector('.tp-offcanvas-main');
    if (mob && !mob.querySelector('.rf-tools')) {
      var m = document.createElement('div');
      m.className = 'rf-tools-mobile';
      m.innerHTML = '<span class="rf-tools-label">Language</span>' +
        '<span class="rf-tools">' + toolsHTML() + '</span>';
      mob.appendChild(m);
    }
  }

  /* ─────────────────────────────────────────────────────────────
     3. EVENTS
     ───────────────────────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var l = e.target.closest('.rf-tg-lang');
    if (l) applyLang(lang === 'id' ? 'en' : 'id');
  });

  /* ─────────────────────────────────────────────────────────────
     4. BOOT
     ───────────────────────────────────────────────────────────── */
  function boot() {
    inject();
    collect();
    applyLang(lang);
    root.classList.add('rf-i18n-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
