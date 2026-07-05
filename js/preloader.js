/* ==========================================================================
   BMA v3 — preloader.js
   Drives the dependency-free intro overlay (see css/preloader.css).

   Timeline (anchored to start(), ~4.1s to fully clear — deliberately paced so
   both the phrase and the locked "BMA" are actually readable):
     1. rise    : "BLUE MODERN ADVISORY" letters slide up into view + tags fade in
     2. read    : the full phrase holds ~0.7s so it can be read
     3. resolve : trailing letters collapse so the initials lock into "BMA"
     4. hold    : the locked "BMA" wordmark holds ~1s, centered and still
     5. lift    : tags clear, the two paper panels part (top up / bottom down)
     6. remove  : overlay taken out of the DOM, scroll + pointer restored

   When it plays:
     - Fresh open of the tab (not seen this session)  -> plays
     - Hard reload of any page                         -> plays (so it's re-viewable)
     - Clicking between the three pages in one session -> skipped (no replay)
     - prefers-reduced-motion                          -> skipped, page shown at once

   Guarantees:
     - Fail-safe: a safety timeout force-removes the overlay well after the
       choreography would have finished, no matter what, and everything runs
       inside try/catch so the page is never gated behind the overlay. (No-JS
       is handled purely in CSS.)
   ========================================================================== */
(function () {
  "use strict";

  var SESSION_KEY = "bma_preloaded";
  var overlay = document.querySelector(".bma-preloader");
  if (!overlay) return;

  var removed = false;

  function removeOverlay() {
    if (removed) return;
    removed = true;
    try {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      // Whenever the overlay clears, tell site.js to reveal the page NOW. This
      // is what makes in-session navigation (intro skipped) reveal instantly:
      // the skip path never runs start()'s 3100ms `bma:intro-reveal`, so without
      // this the page would sit hidden until site.js's 7s fail-safe. On the
      // normal play path intro-reveal already fired at 3100ms, so this re-fire
      // is a guarded no-op. intro-done then starts Lenis smooth scroll.
      try {
        document.dispatchEvent(new CustomEvent("bma:intro-reveal"));
        document.dispatchEvent(new CustomEvent("bma:intro-done"));
      } catch (e2) {
        /* site.js has a timeout fail-safe */
      }
    } catch (e) {
      /* never let cleanup throw */
    }
  }

  // Was this load a reload (vs. a first open or an internal link click)?
  function isReload() {
    try {
      var nav =
        window.performance &&
        window.performance.getEntriesByType &&
        window.performance.getEntriesByType("navigation");
      if (nav && nav.length) return nav[0].type === "reload";
      // Legacy fallback: performance.navigation.type === 1 is TYPE_RELOAD.
      if (window.performance && window.performance.navigation) {
        return window.performance.navigation.type === 1;
      }
    } catch (e) {
      /* ignore and treat as not-a-reload */
    }
    return false;
  }

  // Safety net first: whatever happens below, the page is revealed. Set well
  // clear of the full choreography (start can be delayed up to ~400ms by font
  // loading, and the intro runs ~4.1s from start), so it never truncates a
  // real play. finish() clears it as soon as the panels have actually parted.
  var safety = window.setTimeout(removeOverlay, 6500);

  try {
    var prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var alreadyPlayed = false;
    try {
      alreadyPlayed = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch (e) {
      /* private mode / storage blocked: treat as not played */
    }

    // Play on a fresh open or a reload; skip only for in-session navigation
    // between pages (already played AND this load wasn't a reload).
    var shouldPlay = !prefersReduced && (isReload() || !alreadyPlayed);

    if (!shouldPlay) {
      window.clearTimeout(safety);
      removeOverlay();
      return;
    }

    // Mark as played at the START so a mid-animation reload does not stack.
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch (e) {
      /* ignore */
    }

    // Lock scroll only while the intro is on screen (cleared on removal).
    // Only on <html>: setting overflow:hidden on <body> would make the body a
    // scroll container and reparent the sticky header, jogging it on release.
    // The gutter is reserved site-wide (scrollbar-gutter: stable) so no shift.
    document.documentElement.style.overflow = "hidden";

    var start = function () {
      // Fit the long phrase to the viewport BEFORE it plays so no letters get
      // clipped by the panels' overflow (e.g. the trailing "Y" of ADVISORY).
      // The mark settles back up to full size when it resolves to "BMA".
      try {
        var mark = overlay.querySelector(".bma-pl-mark");
        if (mark) {
          var natural = mark.getBoundingClientRect().width;
          var viewport =
            window.innerWidth || document.documentElement.clientWidth || 0;
          var avail = viewport * 0.88; // ~6% breathing room each side
          if (natural > 0 && avail > 0 && natural > avail) {
            overlay.style.setProperty("--pl-fit", avail / natural);
          }
        }
      } catch (e) {
        /* if measuring fails, fall back to the CSS clamp size */
      }

      // Pin each trailing run ("lue" / "odern" / "dvisory") to its own exact
      // width so they all collapse from their real size, in sync and with no
      // max-width dead-time. offsetWidth is the layout width, unaffected by the
      // fit-scale transform above. Falls back to the CSS 12ch ceiling on error.
      try {
        var rests = overlay.querySelectorAll(".bma-pl-rest");
        for (var i = 0; i < rests.length; i++) {
          rests[i].style.setProperty(
            "--rest-w",
            rests[i].offsetWidth + 1 + "px",
          );
        }
      } catch (e) {
        /* keep the CSS fallback ceiling */
      }

      // 1. rise letters + fade tags
      overlay.classList.add("is-revealed");

      // 2 + 3. let the full phrase read (~0.7s after it settles ~880ms), then
      //        collapse the trailing letters so the initials lock into "BMA".
      window.setTimeout(function () {
        overlay.classList.add("is-resolved");
      }, 1500);

      // 4 + 5. hold the locked "BMA" ~1s, then clear tags and part the panels.
      window.setTimeout(function () {
        overlay.classList.add("is-lifting");
        // Tell site.js to begin revealing the page NOW so the text rises into
        // place as the panels part (overlaps the open, not after it).
        try {
          document.dispatchEvent(new CustomEvent("bma:intro-reveal"));
        } catch (e) {
          /* CustomEvent unsupported: site.js has a timeout fail-safe */
        }
      }, 3100);

      // Remove once the split-lift transition has finished.
      var panel = overlay.querySelector(".bma-pl-panel--top");
      var finished = false;
      var finish = function () {
        if (finished) return;
        finished = true;
        window.clearTimeout(safety);
        removeOverlay();
      };
      if (panel) {
        panel.addEventListener("transitionend", function (ev) {
          // transitionend BUBBLES: the rising letters and the scaling wordmark
          // are descendants of this panel and also animate `transform`, so we
          // must accept ONLY the panel's own lift transition (ev.target ===
          // panel). Otherwise the rise finishing at ~0.7s would remove the
          // overlay before "BMA" ever appears.
          if (ev.target === panel && ev.propertyName === "transform") finish();
        });
      }
      // Backstop in case transitionend never fires (lift done ~4000ms in).
      window.setTimeout(finish, 4200);
    };

    // Wait a beat so fonts settle and the first frame paints the start state.
    if (document.fonts && document.fonts.ready) {
      var kicked = false;
      var kick = function () {
        if (kicked) return;
        kicked = true;
        window.requestAnimationFrame(start);
      };
      document.fonts.ready.then(kick)["catch"](kick);
      // Don't wait forever on the font promise.
      window.setTimeout(kick, 400);
    } else {
      window.requestAnimationFrame(start);
    }
  } catch (e) {
    // Any unexpected error: reveal the page immediately.
    window.clearTimeout(safety);
    removeOverlay();
  }
})();
