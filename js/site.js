/* ==========================================================================
   BMA v3 — site.js
   Only two behaviors:
     1. Toggle .is-scrolled on .site-header after ~8px scroll (hairline fade).
     2. IntersectionObserver reveals .reveal elements (fade + 8px rise, once).
   No libraries. Respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

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

    var onScroll = function () {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateHeader();
  }

  /* --- 2. Reveal on scroll ---------------------------------------------- */
  var reveals = document.querySelectorAll(".reveal");
  if (!reveals.length) return;

  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // No animation support or reduced motion: just show everything.
  if (prefersReduced || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
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

  reveals.forEach(function (el) {
    observer.observe(el);
  });
})();
