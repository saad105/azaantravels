/* ==========================================================================
   Azaan International Tours & Travels — site scripts (vanilla JS)
   ========================================================================== */
(function () {
  'use strict';

  var WA_NUMBER = '919985442951';
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.remove('no-js');

  /* ---------- Local preview: make folder links (about-us/) open index.html under file:// ---------- */
  if (location.protocol === 'file:') {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (/^(https?:|mailto:|tel:|#|javascript:)/i.test(href)) return;
      var parts = href.split('#');
      if (parts[0] && /\/$/.test(parts[0])) {
        a.setAttribute('href', parts[0] + 'index.html' + (parts[1] ? '#' + parts[1] : ''));
      }
    });
  }

  /* ---------- Active navigation link ---------- */
  var page = document.body.getAttribute('data-page');
  document.querySelectorAll('[data-nav="' + page + '"]').forEach(function (a) {
    a.classList.add('active');
    a.setAttribute('aria-current', 'page');
    // highlight the parent menu item when a dropdown child is the current page
    var dd = a.closest('.nav-dd');
    if (dd) dd.querySelector('.nav-link').classList.add('active');
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Header state + back-to-top progress ---------- */
  var header = document.querySelector('.site-header');
  var toTop = document.querySelector('.to-top');
  var ring = toTop ? toTop.querySelector('circle') : null;
  var RING_LEN = 145;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 40);
    if (toTop) {
      toTop.classList.toggle('is-visible', y > 600);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (ring && max > 0) ring.style.strokeDashoffset = RING_LEN * (1 - Math.min(y / max, 1));
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

  /* ---------- Close mobile menu after choosing an in-page link ---------- */
  var menu = document.getElementById('mobileMenu');
  if (menu) {
    menu.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function () {
        if (window.bootstrap) bootstrap.Offcanvas.getOrCreateInstance(menu).hide();
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal], .reveal-mask, .steps');
    items.forEach(function (el) {
      var d = el.getAttribute('data-delay');
      if (d) el.style.setProperty('--d', d + 's');
    });
    if (!('IntersectionObserver' in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    // .reveal-mask starts fully clipped, and Chrome counts the element's own clip-path
    // when measuring intersection – so watch its parent instead, or it never reveals.
    var watched = new Map();
    items.forEach(function (el) {
      var target = el.classList.contains('reveal-mask') && el.parentElement ? el.parentElement : el;
      if (!watched.has(target)) watched.set(target, []);
      watched.get(target).push(el);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          (watched.get(entry.target) || []).forEach(function (el) { el.classList.add('is-visible'); });
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    watched.forEach(function (_, target) { io.observe(target); });
  }

  /* ---------- Click-to-play video cards ---------- */
  document.querySelectorAll('[data-video]').forEach(function (card) {
    var video = card.querySelector('video');
    var btn = card.querySelector('.video-play');
    var stack = card.closest('.img-stack');
    if (!video || !btn) return;
    btn.addEventListener('click', function () {
      card.classList.add('is-playing');
      if (stack) stack.classList.add('is-playing');
      video.controls = true;
      var p = video.play();
      if (p && p.catch) p.catch(function () { /* browser blocked playback; controls remain */ });
    });
    video.addEventListener('ended', function () {
      video.controls = false;
      video.load(); // back to the cover image
      card.classList.remove('is-playing');
      if (stack) stack.classList.remove('is-playing');
    });
  });

  /* ---------- Animated counters ---------- */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;
    function run(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduceMotion) { el.textContent = target + suffix; return; }
      var start = null, dur = 1900;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!('IntersectionObserver' in window)) { counters.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Subtle parallax backgrounds (desktop only) ---------- */
  function initParallax() {
    var els = document.querySelectorAll('[data-parallax]');
    if (!els.length || reduceMotion || !window.matchMedia('(min-width: 992px)').matches) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.15;
        var offset = (r.top + r.height / 2 - vh / 2) * speed;
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- Home hero slider ---------- */
  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) return;
    var slides = hero.querySelectorAll('.hero-slide');
    var texts = hero.querySelectorAll('.hero-text');
    var dots = hero.querySelectorAll('.hero-dot');
    var delay = 7000, index = 0, timer = null;
    hero.style.setProperty('--hero-delay', delay + 'ms');

    // load the remaining slide images once the page is ready
    hero.querySelectorAll('.hero-bg[data-bg]').forEach(function (bg) {
      bg.style.backgroundImage = "url('" + bg.getAttribute('data-bg') + "')";
    });

    function go(n) {
      index = (n + slides.length) % slides.length;
      [slides, texts, dots].forEach(function (list) {
        list.forEach(function (el, i) {
          var on = i === index;
          el.classList.toggle('is-active', on);
          if (list === texts) el.setAttribute('aria-hidden', on ? 'false' : 'true');
          if (list === dots) el.setAttribute('aria-current', on ? 'true' : 'false');
        });
      });
    }
    function play() { stop(); if (!reduceMotion) timer = setInterval(function () { go(index + 1); }, delay); }
    function stop() { if (timer) clearInterval(timer); timer = null; }

    dots.forEach(function (dot, i) { dot.addEventListener('click', function () { go(i); play(); }); });
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    if (prev) prev.addEventListener('click', function () { go(index - 1); play(); });
    if (next) next.addEventListener('click', function () { go(index + 1); play(); });

    var x0 = null;
    hero.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) { go(index + (dx < 0 ? 1 : -1)); play(); }
      x0 = null;
    }, { passive: true });

    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : play(); });

    // replay the first slide's entrance animation once the preloader is gone
    texts[0].classList.remove('is-active');
    dots[0].classList.remove('is-active');
    requestAnimationFrame(function () { go(0); play(); });
  }

  /* ---------- WhatsApp enquiry forms (same message format as the previous site) ---------- */
  var templates = {
    home: function (v) {
      return 'Hello Azaan Travels,\n\nI would like to make an enquiry.\n\n' +
        'Name: ' + v('azName') + '\nMobile: ' + v('azPhone') +
        '\nDestination / Requirement: ' + v('azDest') +
        '\nService: ' + (v('azService') || 'Not selected') +
        '\nAdditional details: ' + (v('azMsg') || 'None') +
        '\n\nPlease contact me with the details.';
    },
    contact: function (v) {
      return 'Hello Azaan Travels,\n\nI would like to make an enquiry.\n\n' +
        'Name: ' + v('azcName') + '\nMobile: ' + v('azcPhone') +
        '\nEmail: ' + (v('azcEmail') || 'Not provided') +
        '\nRequired service: ' + v('azcService') +
        '\nDestination / Requirement: ' + (v('azcDestination') || 'Not specified') +
        '\nAdditional details: ' + (v('azcMessage') || 'None') +
        '\n\nPlease contact me with the relevant information.';
    },
    visa: function (v) {
      return 'Hello Azaan Travels,\n\nI need visa assistance.\n\n' +
        'Name: ' + v('azvName') + '\nMobile: ' + v('azvPhone') +
        '\nDestination country: ' + v('azvCountry') +
        '\nVisa type: ' + v('azvType') +
        '\nExpected travel date/month: ' + (v('azvDate') || 'Not decided') +
        '\nAdditional details: ' + (v('azvMessage') || 'None') +
        '\n\nPlease share the applicable requirements.';
    },
    umrah: function (v) {
      return 'Assalamu Alaikum Azaan Travels,\n\nI need Hajj/Umrah assistance.\n\n' +
        'Name: ' + v('azuName') + '\nMobile: ' + v('azuPhone') +
        '\nJourney: ' + v('azuJourney') +
        '\nNumber of pilgrims: ' + v('azuPeople') +
        '\nPreferred date/month: ' + (v('azuDate') || 'Not decided') +
        '\nAdditional requirements: ' + (v('azuMessage') || 'None') +
        '\n\nPlease share the available package details and requirements.';
    }
  };

  document.querySelectorAll('form[data-wa-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        var bad = form.querySelector(':invalid');
        if (bad) bad.focus();
        return;
      }
      var build = templates[form.getAttribute('data-wa-form')];
      if (!build) return;
      var v = function (id) {
        var el = form.querySelector('#' + id);
        return el ? el.value.trim() : '';
      };
      var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(build(v));
      var win = window.open(url, '_blank', 'noopener');
      if (!win) window.location.href = url;
      var status = form.querySelector('.form-status');
      if (status) {
        status.hidden = false;
        status.textContent = 'Opening WhatsApp with your enquiry…';
      }
    });
  });

  /* ---------- "Enquire Now" on a package pre-fills the enquiry form ---------- */
  document.querySelectorAll('[data-prefill-service], [data-prefill-dest]').forEach(function (link) {
    link.addEventListener('click', function () {
      var target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      var service = target.querySelector('select');
      var dest = target.querySelector('#azDest, #azcDestination');
      var s = link.getAttribute('data-prefill-service');
      var d = link.getAttribute('data-prefill-dest');
      if (service && s) service.value = s;
      if (dest && d) dest.value = d;
      var first = target.querySelector('input');
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 700);
    });
  });

  /* ---------- Home offer popup (once per browser session) ---------- */
  function initOffer() {
    var modal = document.getElementById('offerModal');
    if (!modal || modal.getAttribute('data-enabled') !== 'true' || !window.bootstrap) return;
    var seen = false;
    try { seen = sessionStorage.getItem('azOfferSeen') === '1'; } catch (err) { /* storage blocked */ }
    if (seen) return;
    setTimeout(function () {
      bootstrap.Modal.getOrCreateInstance(modal).show();
      try { sessionStorage.setItem('azOfferSeen', '1'); } catch (err) { /* storage blocked */ }
    }, 2600);
  }

  /* ---------- Boot: hide preloader, then start animations ---------- */
  var started = false;
  function start() {
    if (started) return;
    started = true;
    var pre = document.querySelector('.preloader');
    if (pre) {
      pre.classList.add('is-hidden');
      setTimeout(function () { pre.remove(); }, 900);
    }
    initHero();
    initReveal();
    initCounters();
    initParallax();
    initOffer();
  }
  if (document.readyState === 'complete') start();
  else {
    window.addEventListener('load', start);
    setTimeout(start, 2200); // never keep visitors waiting on slow images
  }
})();
