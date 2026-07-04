/* ==========================================================================
   BMA v3 — preloader.js
   Drives the dependency-free intro overlay (see css/preloader.css).

   Timeline (~1.2s to lock, then a ~0.6s split-lift):
     1. rise    : "BLUE MODERN ADVISORY" letters slide up into view + tags fade in
     2. resolve : trailing letters collapse so initials lock into "BMA"
     3. lift    : tags clear, the two paper panels part (top up / bottom down)
     4. remove  : overlay taken out of the DOM, scroll + pointer restored

   Guarantees:
     - Plays once per session (sessionStorage). Later navigations remove it
       instantly with no replay.
     - prefers-reduced-motion: removed immediately, no animation.
     - Fail-safe: a safety timeout force-removes the overlay after ~2.5s no
       matter what, and everything runs inside try/catch so the page is never
       gated behind the overlay. (No-JS is handled purely in CSS.)
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
    } catch (e) {
      /* never let cleanup throw */
    }
  }

  // Safety net first: whatever happens below, the page is revealed by ~2.5s.
  var safety = window.setTimeout(removeOverlay, 2500);

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

    // Reduced motion or already seen this session -> no intro, reveal now.
    if (prefersReduced || alreadyPlayed) {
      window.clearTimeout(safety);
      removeOverlay();
      return;
    }

    // Mark as played at the START so a mid-animation reload does not replay it.
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch (e) {
      /* ignore */
    }

    // Lock scroll only while the intro is on screen (both paths clear it).
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    var start = function () {
      // 1. rise letters + fade tags
      overlay.classList.add("is-revealed");

      // 2. collapse trailing letters -> lock "BMA"
      window.setTimeout(function () {
        overlay.classList.add("is-resolved");
      }, 640);

      // 3 + 4. clear tags and part the panels
      window.setTimeout(function () {
        overlay.classList.add("is-lifting");
      }, 1240);

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
          if (ev.propertyName === "transform") finish();
        });
      }
      // Backstop in case transitionend never fires.
      window.setTimeout(finish, 2000);
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
