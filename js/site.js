/* ==========================================================================
   BMA v3 — site.js
   Behaviors:
     1. Toggle .is-scrolled on .site-header after ~8px scroll (hairline fade).
     2. Lenis smooth scroll (started once the intro has cleared the scroll-lock).
     3. Spring reveal: each line of text rises in with a per-section stagger as
        its section enters view. Triggered as the intro panels part so the page
        opens with motion; falls back gracefully with no JS / reduced motion.
   No build step. Respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var docEl = document.documentElement;
  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- 1. Nav hairline on scroll ---------------------------------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var SCROLL_THRESHOLD = 8;
    var ticking = false;
    var updateHeader = function () {
      if (window.scrollY > SCROLL_THRESHOLD) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(updateHeader);
          ticking = true;
        }
      },
      { passive: true },
    );
    updateHeader();
  }

  /* --- 2. Lenis smooth scroll (idempotent) ------------------------------ */
  var lenisInstance = null; // shared so the menu can pause/resume scrolling
  var lenisStarted = false;
  function startLenis() {
    if (lenisStarted) return;
    lenisStarted = true;
    if (prefersReduced || typeof Lenis === "undefined") return; // native scroll
    try {
      lenisInstance = new Lenis({
        duration: 1.1,
        // ease-out-expo: quick, then a long smooth glide (premium feel).
        easing: function (t) {
          return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        },
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.15,
      });
      var raf = function (time) {
        lenisInstance.raf(time);
        window.requestAnimationFrame(raf);
      };
      window.requestAnimationFrame(raf);
    } catch (e) {
      /* if Lenis fails, native scrolling still works */
      lenisInstance = null;
    }
  }

  /* --- 3. Spring reveal for text (idempotent) --------------------------- */
  // Text-line elements. Container-ish tags are excluded; buttons are left out
  // so their own hover transitions are never overridden by the reveal delay.
  var LINE_SEL =
    "h1,h2,h3,h4,h5,p,li,blockquote,figcaption,.label,.proof-claim";
  var reveals = document.querySelectorAll(".reveal");
  var revealStarted = false;

  function showAllReveals() {
    for (var i = 0; i < reveals.length; i++) {
      reveals[i].classList.add("is-visible");
    }
  }

  function setupReveal() {
    if (revealStarted) return;
    revealStarted = true;
    if (!reveals.length) return;

    if (prefersReduced || !("IntersectionObserver" in window)) {
      showAllReveals();
      return;
    }

    docEl.classList.add("reveal-ready");

    // Tag only leaf-level text lines (skip any element that contains another
    // target, so a list row and its inner lines never both animate) and give
    // each a small staggered delay within its section.
    for (var s = 0; s < reveals.length; s++) {
      var candidates = reveals[s].querySelectorAll(LINE_SEL);
      var idx = 0;
      for (var c = 0; c < candidates.length; c++) {
        var el = candidates[c];
        if (el.querySelector(LINE_SEL)) continue; // not a leaf line
        el.classList.add("r-line");
        el.style.transitionDelay = Math.min(idx * 0.06, 0.48) + "s";
        idx++;
      }
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target); // once only
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
    for (var r = 0; r < reveals.length; r++) {
      observer.observe(reveals[r]);
    }
  }

  /* --- Coordinate with the intro ---------------------------------------- */
  // If the intro is going to play, wait for its signals so the hero rises in as
  // the panels part (reveal) and Lenis starts once scroll is unlocked (done).
  // Otherwise (internal nav with the overlay already gone, or reduced motion)
  // just start everything now.
  var introWillPlay =
    !prefersReduced && !!document.querySelector(".bma-preloader");

  if (introWillPlay) {
    document.addEventListener("bma:intro-reveal", setupReveal, { once: true });
    document.addEventListener("bma:intro-done", startLenis, { once: true });
    // Fail-safe: never leave the page unrevealed if the events never fire.
    window.setTimeout(function () {
      setupReveal();
      startLenis();
    }, 7000);
  } else {
    setupReveal();
    startLenis();
  }

  /* --- 4. Full-screen menu overlay -------------------------------------- */
  (function menuController() {
    var toggle = document.querySelector(".menu-toggle");
    var menu = document.getElementById("site-menu");
    if (!toggle || !menu) return;

    // Progressive enhancement: with JS on, the closed overlay is inert and
    // hidden from assistive tech. (No JS leaves it a static, reachable list.)
    menu.setAttribute("inert", "");
    menu.setAttribute("aria-hidden", "true");

    var lastFocused = null;
    var getFocusables = function () {
      return menu.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
    };
    var isOpen = function () {
      return toggle.getAttribute("aria-expanded") === "true";
    };

    function openMenu() {
      lastFocused = document.activeElement;
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      menu.classList.add("is-open");
      menu.removeAttribute("inert");
      menu.setAttribute("aria-hidden", "false");
      docEl.classList.add("menu-open");
      if (lenisInstance) lenisInstance.stop();
      document.addEventListener("keydown", onKeydown, true);
      var f = getFocusables();
      if (f.length) {
        window.setTimeout(function () {
          f[0].focus();
        }, 80);
      }
    }

    function closeMenu(returnFocus) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      menu.classList.remove("is-open");
      menu.setAttribute("inert", "");
      menu.setAttribute("aria-hidden", "true");
      docEl.classList.remove("menu-open");
      if (lenisInstance) lenisInstance.start();
      document.removeEventListener("keydown", onKeydown, true);
      if (returnFocus !== false && lastFocused && lastFocused.focus) {
        lastFocused.focus();
      }
    }

    function onKeydown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key !== "Tab") return;
      // Trap focus across [toggle, ...menu focusables].
      var f = getFocusables();
      if (!f.length) return;
      var first = f[0];
      var last = f[f.length - 1];
      var active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || active === toggle) {
          e.preventDefault();
          (active === toggle ? last : toggle).focus();
        }
      } else if (active === last || active === toggle) {
        e.preventDefault();
        (active === toggle ? first : toggle).focus();
      }
    }

    toggle.addEventListener("click", function () {
      if (isOpen()) closeMenu();
      else openMenu();
    });

    // Clicking a link navigates (or jumps) -> close the menu behind it.
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a[href]")) closeMenu(false);
    });
  })();
})();
