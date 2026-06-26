/* ============================================================
   FINAL CTA — fade in on first scroll into view
   The closing sentence + Download button fade/slide up the moment
   they actually enter the viewport. Using IntersectionObserver
   (async) guarantees the opacity:0 state is painted first, so the
   CSS transition plays instead of snapping. Reveal is sticky.
   The footer is left in normal document flow (no animation).
   ============================================================ */
(function () {
  var cta = document.getElementById('finalCta');

  function revealAll() {
    if (cta) cta.classList.add('revealed');
  }

  /* Returning from a subpage lands at the bottom already — show at once,
     no fade (the inline <head> style also forces this instantly). */
  if (sessionStorage.getItem('comingFromSubpage') === 'true') {
    revealAll();
    return;
  }

  if (!('IntersectionObserver' in window)) {
    revealAll();
    return;
  }

  function revealWhenSeen(el, onSeen) {
    if (!el) return;
    var io = new IntersectionObserver(function (entries, obs) {
      if (entries[0] && entries[0].isIntersecting) {
        onSeen();
        obs.disconnect();
      }
    }, { threshold: 0.01 });
    io.observe(el);
  }

  revealWhenSeen(cta, function () { cta.classList.add('revealed'); });
})();
