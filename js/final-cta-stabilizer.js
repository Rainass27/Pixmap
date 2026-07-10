/* ============================================================
   FINAL CTA + FOOTER — finale reveal

   The closing sentence, Download button and footer are revealed
   together by adding `body.story-final`. On the homepage this is
   driven *only* by the op2 narrative handoff (op1-scene.js calls
   window.PIXMAP.revealFinale()), so the finale can never surface
   over the op2 stage during a fast / inertial scroll.

   The single exception is returning from a subpage, which lands at
   the bottom already — there we reveal instantly with no fade.
   ============================================================ */
(function () {
  var cta = document.getElementById('finalCta');

  function finalize() {
    document.body.classList.add('story-final');
    if (cta) cta.classList.add('revealed');
  }

  /* Expose a single reveal hook the narrative engine calls at its
     handoff. Idempotent — safe to call more than once. */
  window.PIXMAP = window.PIXMAP || {};
  window.PIXMAP.revealFinale = finalize;

  /* Returning from a subpage lands at the bottom already — show at once
     (the inline <head> style also forces this instantly). */
  if (sessionStorage.getItem('comingFromSubpage') === 'true') {
    finalize();
  }
})();
