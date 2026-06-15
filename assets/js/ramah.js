/* =============================================================
   RAMAHFAKHIRIN.COM — Custom Scripts
   Handles : Skill bars · Portfolio filter · FAQ · Nav scroll
   File    : assets/js/ramah.js
   ============================================================= */

(function () {
  'use strict';

  /* ── 1. Skill bars animate on scroll ── */
  var fills = document.querySelectorAll('.rf-sb-fill');
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('go'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.25 });
  fills.forEach(function (f) { obs.observe(f); });

  /* ── 2. Portfolio filter ── */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.rf-fbtn');
    if (!btn) return;
    document.querySelectorAll('.rf-fbtn').forEach(function (b) { b.classList.remove('on'); });
    btn.classList.add('on');
    var f = btn.getAttribute('data-filter');
    document.querySelectorAll('.rf-port-item').forEach(function (item) {
      if (f === 'all' || item.getAttribute('data-cat') === f) {
        item.style.display = '';
        setTimeout(function () { item.style.opacity = ''; item.style.transform = ''; }, 10);
      } else {
        item.style.opacity = '0'; item.style.transform = 'scale(0.94)';
        setTimeout(function () { item.style.display = 'none'; }, 280);
      }
    });
  });

  /* ── 3. FAQ accordion ── */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.rf-faq-btn');
    if (!btn) return;
    var item = btn.closest('.rf-faq-item');
    var ans = item.querySelector('.rf-faq-ans');
    var isOpen = item.classList.contains('open');
    document.querySelectorAll('.rf-faq-item.open').forEach(function (i) {
      i.classList.remove('open');
      i.querySelector('.rf-faq-ans').style.maxHeight = '0';
    });
    if (!isOpen) { item.classList.add('open'); ans.style.maxHeight = ans.scrollHeight + 'px'; }
  });

  /* ── 4. NAV FIX: intercept anchor clicks for GSAP ScrollSmoother ──
     Template uses GSAP ScrollSmoother inside #smooth-wrapper.
     Native href="#id" does not work — we intercept, find target,
     and scroll using gsap.to() or native fallback. ── */
  function rfScrollTo(targetId) {
    var el = document.getElementById(targetId);
    if (!el) return;

    // Try GSAP ScrollSmoother first (template's smooth scroll engine)
    if (window.ScrollSmoother && window.ScrollSmoother.get && window.ScrollSmoother.get()) {
      window.ScrollSmoother.get().scrollTo(el, true, 'top 80px');
      return;
    }

    // Fallback: GSAP gsap.to scrollTo plugin
    if (window.gsap && window.gsap.to) {
      var scroller = document.querySelector('#smooth-content') || document.querySelector('#smooth-wrapper') || window;
      gsap.to(scroller, {
        duration: 1,
        scrollTo: { y: el, offsetY: 80 },
        ease: 'power2.inOut'
      });
      return;
    }

    // Final fallback: native smooth scroll
    var headerH = 80;
    var top = el.getBoundingClientRect().top + window.pageYOffset - headerH;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  // Intercept ALL anchor clicks to #section
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var hash = link.getAttribute('href');
    if (!hash || hash === '#' || hash.length < 2) return;
    var targetId = hash.slice(1);
    var target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();
    e.stopPropagation();

    // Close mobile offcanvas if open
    var offcanvas = document.querySelector('.tp-offcanvas-area');
    if (offcanvas && offcanvas.classList.contains('opened')) {
      offcanvas.classList.remove('opened');
      document.querySelector('.body-overlay') && document.querySelector('.body-overlay').classList.remove('opened');
    }

    rfScrollTo(targetId);
  }, true); // capture phase so it fires before template JS
  /* ── 5. Testimonial marquee (JS — GSAP-safe, no CSS transform conflict) ── */
  (function () {
    var wrapper = document.querySelector('.app-testimonial-wrapper');
    if (!wrapper) return;

    // Disable any CSS animation on wrapper
    wrapper.style.animation = 'none';
    wrapper.style.webkitAnimation = 'none';

    var SPEED = 1;          // ~120px/s @ 60fps — matches template feel          // px per frame — matches template feel
    var PAUSE_ON_HOVER = true;
    var x = 0;
    var paused = false;
    var halfW = 0;
    var rafId = null;

    function getHalfWidth() {
      // half = width of ONE set (4 items)
      var items = wrapper.querySelectorAll('.app-testimonial-item:not([aria-hidden])');
      var w = 0;
      items.forEach(function (el) {
        var s = window.getComputedStyle(el);
        w += el.offsetWidth
          + parseInt(s.marginLeft || 0)
          + parseInt(s.marginRight || 0);
      });
      return w;
    }

    function tick() {
      if (!paused) {
        x -= SPEED;
        halfW = halfW || getHalfWidth();
        if (Math.abs(x) >= halfW) {
          x = 0; // seamless reset
        }
        wrapper.style.transform = 'translateX(' + x + 'px)';
      }
      rafId = requestAnimationFrame(tick);
    }

    if (PAUSE_ON_HOVER) {
      wrapper.addEventListener('mouseenter', function () { paused = true; });
      wrapper.addEventListener('mouseleave', function () { paused = false; });
    }

    // Wait for layout to settle before measuring
    window.addEventListener('load', function () {
      halfW = getHalfWidth();
      tick();
    });
  })();

})();