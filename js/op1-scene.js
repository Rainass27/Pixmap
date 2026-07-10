/* ============================================================
   OP1 SCENE — narrative sequence

   Flow:
     sem1+patch fade → sentence A → op1 tile assembly → op1 panels
     → op1 card rises/fades out → final CTA → footer

   Final handoff:
     Once the op1 panels have revealed, held, and slid away, the op1
     card itself rises and fades, then the final CTA + footer are
     revealed. On reverse scroll, the CTA hides and op1 returns
     naturally with its six panels. No forced scroll jump.
   ============================================================ */

(function () {
  'use strict';

  var sem1Bg    = document.getElementById('sem1Bg');
  var patchFin  = document.getElementById('patchFinal');
  var op1Scene  = document.getElementById('op1Scene');
  var op1Grid   = document.getElementById('op1TileGrid');
  var op1Img    = document.getElementById('op1Seamless');
  var op1TextEl = document.getElementById('op1Text');
  var finalCta  = document.getElementById('finalCta');
  var uspSection = document.getElementById('uspSection');

  if (!sem1Bg || !op1Scene || !op1Grid) return;

  /* ── Helpers ──────────────────────────────────────────────── */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function eio(t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2; }
  function px(n) { return Math.round(n) + 'px'; }

  function getHeaderHeight() {
    var root = getComputedStyle(document.documentElement);
    var fromVar = parseFloat(root.getPropertyValue('--header-h'));
    if (!isNaN(fromVar)) return fromVar;
    var header = document.querySelector('.site-header');
    return header ? header.offsetHeight : 0;
  }

  /* ── Tile grid (16 × 9 = 144 tiles) ──────────────────────── */
  var COLS = 16, ROWS = 9, NT = COLS * ROWS;
  var tiles = [], tileDelay = [];
  var cCol = (COLS-1)/2, cRow = (ROWS-1)/2;
  var maxD = Math.sqrt(cCol*cCol*0.70 + cRow*cRow*2.0);
  var WAVE_DUR = 0.85, DELAY_RANGE = 0.45, TILE_TOTAL = WAVE_DUR + DELAY_RANGE;

  for (var ti = 0; ti < NT; ti++) {
    var col  = ti % COLS, row = Math.floor(ti / COLS);
    var tile = document.createElement('div');
    tile.className = 'op1-tile';
    tile.style.backgroundPosition =
      (col / (COLS-1) * 100).toFixed(3) + '% ' +
      (row / (ROWS-1) * 100).toFixed(3) + '%';
    op1Grid.appendChild(tile);
    tiles.push(tile);
    var dx = col-cCol, dy = row-cRow, d = Math.sqrt(dx*dx*0.70 + dy*dy*2.0);
    tileDelay.push(d/maxD*DELAY_RANGE);
  }

  function setTiles(elapsed) {
    for (var i = 0; i < NT; i++) {
      var raw = clamp((elapsed - tileDelay[i]) / WAVE_DUR, 0, 1);
      var t = raw >= 1 ? 1 : 1 - Math.pow(2, -10 * raw);
      tiles[i].style.opacity = t.toFixed(3);
      tiles[i].style.transform = 'scale(' + (0.28 + t * 0.72).toFixed(3) + ')';
    }
  }

  /* ── Glass panel group factory ────────────────────────────── */
  function createGroup(data) {
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:495;visibility:hidden;';
    document.body.appendChild(wrap);
    var panels = [];
    data.forEach(function (p, i) {
      var el = document.createElement('div');
      /* Left 3 tilt one way, right 3 the opposite — a "wings" splay. */
      el.className = 'op1-panel ' + (i < 3 ? 'op1-tilt-l' : 'op1-tilt-r');

      var inner = document.createElement('div');
      inner.className = 'op1-panel-inner';
      inner.innerHTML =
        '<p class="op1-panel-title">' + p.title + '</p>' +
        '<p class="op1-panel-desc">'  + p.desc  + '</p>';

      el.appendChild(inner);
      wrap.appendChild(el);
      panels.push(el);
    });
    return { wrap: wrap, panels: panels };
  }

  /* 3 panels on the left, 3 on the right — anchored to the centred image's
     edges so they sit "stuck" to it (tucked slightly onto the image), three
     rows spanning the image height. Mirrors the #op1Scene CSS width formula
     so it stays in sync without needing a live measurement. */
  function layoutGroup(g) {
    var vw = window.innerWidth, vh = window.innerHeight;
    var headerH = getHeaderHeight();

    var capW    = Math.max(480, Math.min(0.78 * vw, 1160));   /* clamp(480,78vw,1160) */
    var heightW = (vh - headerH - 120) * (16 / 9);
    var imgW    = Math.min(capW, heightW);
    var imgH    = imgW * 9 / 16;
    var imgLeft  = (vw - imgW) / 2;
    var imgRight = (vw + imgW) / 2;
    var imgTop   = (vh / 2 + headerH / 2) - imgH / 2;

    var isMobile = vw <= 820;

    if (isMobile) {
      /* Mobile layout: 3 above the image, 3 below the image.
         Spread them horizontally. */
      var pw    = Math.floor((vw - 20) / 3);
      var space = (vw - 3 * pw) / 4;

      g.panels.forEach(function (el, i) {
        var isTop = i < 3;
        var col   = isTop ? i : i - 3;
        var L     = space + col * (pw + space);

        el.style.width  = pw + 'px';
        el.style.left   = px(L);
        el.style.right  = 'auto';

        if (isTop) {
          el.style.top    = 'auto';
          el.style.bottom = px(vh - imgTop + 10);
        } else {
          el.style.bottom = 'auto';
          el.style.top    = px(imgTop + imgH + 10);
        }
      });
    } else {
      /* Original desktop layout */
      var pw      = Math.round(Math.max(190, Math.min(vw * 0.17, 264)));  /* panel width */
      var overlap = 26;                 /* how far each panel tucks onto the image */
      var rowTop  = [0.10, 0.40, 0.70]; /* row positions, relative to image height */

      g.panels.forEach(function (el, i) {
        var isLeft = i < 3, ri = isLeft ? i : i - 3;
        el.style.width  = pw + 'px';
        el.style.right  = 'auto';
        el.style.bottom = 'auto';
        el.style.top    = px(imgTop + imgH * rowTop[ri]);

        var L = isLeft ? (imgLeft - pw + overlap) : (imgRight - overlap);
        L = Math.max(6, Math.min(L, vw - pw - 6));   /* keep fully on-screen */
        el.style.left = px(L);
      });
    }
  }

  function hideGroup(g) {
    g.panels.forEach(function (el) { el.classList.remove('visible'); });
    g.wrap.style.visibility = 'hidden';
    g.wrap.style.opacity = '0';
    g.wrap.style.transform = '';   /* clear any exit-up shift */
  }

  var OP1_PANELS = [
    { title: 'Advanced Output Structuring',   desc: 'Organizes complex LED layouts into clean, structured, output-ready sections for final deployment.' },
    { title: 'Precision Slice Management',     desc: 'Controls each LED slice with accurate positioning, alignment, scale, and resolution.' },
    { title: 'Pixel-Perfect Output Control',  desc: 'Maintains exact pixel accuracy across all LED sections without distortion or misalignment.' },
    { title: 'Faster Output Preparation',     desc: 'Streamlines the output setup process by reducing manual arrangement and correction time.' },
    { title: 'Clean Section Organization',    desc: 'Groups screens, segments, and LED parts clearly for easier identification and management.' },
    { title: 'Production-Ready Output Layout', desc: 'Prepares the complete LED output structure for smooth technical execution on-site.' }
  ];

  var op1Group = createGroup(OP1_PANELS);
  layoutGroup(op1Group);
  window.addEventListener('resize', function () {
    layoutGroup(op1Group);
  });

  /* ── Word spans (sentence A) ──────────────────────────────── */
  var wordSpans = [], textInited = false;

  function buildWordSpans(el, store) {
    var sentence = el.textContent.replace(/\s+/g, ' ').trim();
    el.innerHTML = '';
    sentence.split(' ').forEach(function (w, i, arr) {
      if (!w) return;
      var s = document.createElement('span');
      s.textContent = w;
      s.style.cssText =
        'display:inline-block;opacity:0;filter:blur(6px);transform:translateY(10px);' +
        'transition:opacity 0.26s ease,filter 0.26s ease,transform 0.26s ease;' +
        'margin-right:' + (i < arr.length-1 ? '0.34em' : '0') + ';';
      el.appendChild(s);
      store.push(s);
    });
  }

  function initText() {
    if (textInited || !op1TextEl) return;
    textInited = true;
    buildWordSpans(op1TextEl, wordSpans);
  }

  function showWords(el, spans, count) {
    if (!el || !spans.length) return;
    var n = clamp(Math.round(count), 0, spans.length);
    el.style.visibility = 'visible';
    spans.forEach(function (s, i) {
      var on = i < n;
      s.style.opacity = on ? '1' : '0';
      s.style.filter = on ? 'blur(0px)' : 'blur(6px)';
      s.style.transform = on ? 'translateY(0)' : 'translateY(10px)';
    });
  }

  function hideText(el, spans) {
    if (!el) return;
    el.style.visibility = 'hidden';
    el.style.opacity = '1';
    spans.forEach(function (s) {
      s.style.opacity = '0';
      s.style.filter = 'blur(6px)';
      s.style.transform = 'translateY(10px)';
    });
  }

  /* ── Sequence timing ──────────────────────────────────────── */
  var S = { BG_OUT:0.55, TEXT_START:0.45, TEXT_STEP:0.095, TEXT_HOLD:2.00, TEXT_FADE:0.55, OP1_GAP:0.20 };
  function textDoneAt()  { return S.TEXT_START + wordSpans.length * S.TEXT_STEP; }
  function fadeStartAt() { return textDoneAt() + S.TEXT_HOLD; }
  function fadeEndAt()   { return fadeStartAt() + S.TEXT_FADE; }
  function op1StartAt()  { return fadeEndAt() + S.OP1_GAP; }
  function seqDoneAt()   { return op1StartAt() + TILE_TOTAL + 0.20; }

  var STATE = 'IDLE', savedAnchor = null, op1AsmScrollY = null, seqT0 = null;

  /* Scroll runway reserved below the op1 assembly so the panel reveal +
     exit sequence has room to play before the footer could be reached. */
  var reservedHeightPx = null;
  var NARRATIVE_RUNWAY = 3;            /* in viewport-heights */

  /* Handoff state for the op1 → finale transition (mirrors the old op2
     handoff logic, but with no flip / wiring stage in between). */
  var exitFwdSaved = null;
  var HANDOFF_HYST = 40;               /* px dead-band so the handoff doesn't thrash */

  function revealFinale() {
    if (window.PIXMAP && typeof window.PIXMAP.revealFinale === 'function') {
      window.PIXMAP.revealFinale();
    } else {
      document.body.classList.add('story-final');
    }
  }

  function hideFinale() {
    document.body.classList.remove('story-final');
    if (finalCta) finalCta.classList.remove('revealed');
  }

  function setBaseHidden() {
    sem1Bg.style.opacity = '0';
    sem1Bg.style.visibility = 'hidden';
    if (patchFin) {
      patchFin.style.opacity = '0';
      patchFin.style.visibility = 'hidden';
    }
  }

  function resetFinalLatch() {
    if (window.PIXMAP) window.PIXMAP._op1ExitDone = false;
    /* Final CTA + footer stay revealed once they've faded in —
       the fade only plays on the very first entry. */
  }

  function completeOp1Handoff(exitFwd) {
    if (window.PIXMAP && window.PIXMAP._op1ExitDone) return;

    window.PIXMAP = window.PIXMAP || {};
    window.PIXMAP._op1ExitDone = true;
    window.PIXMAP.netActive = true;
    exitFwdSaved = exitFwd;   /* remember where op1 left, for reversible scroll-up */

    op1Scene.style.opacity = '0';
    op1Scene.style.visibility = 'hidden';
    op1Scene.style.transform = '';
    op1Scene.classList.remove('glow-active');
    hideGroup(op1Group);
    setBaseHidden();

    var uspSticky = document.getElementById('uspSticky');
    if (uspSticky) uspSticky.classList.remove('active');

    if (uspSection) {
      /* Anchor the document end to whichever is lower: the ideal handoff
         point, or wherever the scroll has actually reached. */
      var asmAnchor = op1AsmScrollY || savedAnchor;
      var handoffScrollY = Math.max(window.scrollY, asmAnchor + exitFwd);
      var idealHeight = handoffScrollY - uspSection.offsetTop + 4;

      /* Keep the document tall enough that the CURRENT scroll position is
         still valid after the collapse — see original op2 handoff notes:
         reserve at least a viewport's worth below this point so nothing
         jumps if the finale is shorter than the viewport. */
      var footerEl = document.querySelector('.site-footer');
      var belowH = (finalCta ? finalCta.offsetHeight : 0) +
                   (footerEl ? footerEl.offsetHeight : 0);
      var noClampHeight = (window.scrollY + window.innerHeight) -
                          uspSection.offsetTop - belowH;

      var nextHeight = Math.max(0, idealHeight, noClampHeight);
      uspSection.style.height = px(nextHeight);
    }

    /* The op1 panel stage is fully done — now (and only now) reveal the
       closing CTA + footer together. They were hard-hidden until this
       moment, so they can never surface early no matter how fast the
       user scrolled. */
    revealFinale();
  }

  /* ── rAF loop ─────────────────────────────────────────────── */
  function frame(ts) {
    requestAnimationFrame(frame);

    if (STATE === 'ANIMATING' && seqT0) {
      var el = (ts - seqT0) / 1000;

      var bgOp = 1 - eio(clamp(el / S.BG_OUT, 0, 1));
      sem1Bg.style.opacity = bgOp.toFixed(3);
      sem1Bg.style.visibility = bgOp > 0.005 ? 'visible' : 'hidden';
      if (patchFin) {
        patchFin.style.opacity = bgOp.toFixed(3);
        patchFin.style.visibility = bgOp > 0.005 ? 'visible' : 'hidden';
      }

      var textEl = el - S.TEXT_START;
      if (textEl >= 0 && wordSpans.length) {
        showWords(op1TextEl, wordSpans, textEl / S.TEXT_STEP);
        var fadeEl = el - fadeStartAt();
        if (fadeEl < 0) op1TextEl.style.opacity = '1';
        else {
          var fo = 1 - eio(clamp(fadeEl / S.TEXT_FADE, 0, 1));
          op1TextEl.style.opacity = fo.toFixed(3);
          if (fo < 0.005) op1TextEl.style.visibility = 'hidden';
        }
      }

      var op1El = el - op1StartAt();
      if (op1El > 0) {
        op1Scene.style.visibility = 'visible';
        op1Scene.style.opacity = '1';
        setTiles(op1El);
        var imgT = eio(clamp((op1El - TILE_TOTAL*0.70) / (TILE_TOTAL*0.30), 0, 1));
        if (op1Img) op1Img.style.opacity = imgT.toFixed(3);
      }

      if (el >= seqDoneAt()) {
        setBaseHidden();
        if (op1TextEl) { op1TextEl.style.opacity = '0'; op1TextEl.style.visibility = 'hidden'; }
        setTiles(TILE_TOTAL + 1);
        if (op1Img) op1Img.style.opacity = '1';
        op1Scene.style.opacity = '1';
        op1Scene.style.visibility = 'visible';
        op1Scene.style.transform = '';
        op1Scene.classList.add('glow-active');
        STATE = 'COMPLETE';
        op1AsmScrollY = window.scrollY;
        seqT0 = null;
        window.PIXMAP = window.PIXMAP || {};
        window.PIXMAP.netActive = true;

        /* Reserve a guaranteed scroll runway below this point for the
           panel reveal + exit sequence. Height only ever grows here, so
           the USP runway is untouched. */
        if (uspSection) {
          var needPx = (op1AsmScrollY - uspSection.offsetTop) +
                       NARRATIVE_RUNWAY * window.innerHeight;
          reservedHeightPx = Math.max(uspSection.offsetHeight, needPx);
          uspSection.style.height = px(reservedHeightPx);
        }
      }
    }
  }
  requestAnimationFrame(frame);

  function leave() {
    STATE = 'IDLE';
    savedAnchor = null;
    op1AsmScrollY = null;
    seqT0 = null;
    exitFwdSaved = null;
    reservedHeightPx = null;
    /* Re-hide the finale; the USP scene re-establishes its own section
       height as the user scrolls back up into USP territory. */
    hideFinale();
    op1Scene.classList.remove('glow-active');
    op1Scene.style.opacity = '0';
    op1Scene.style.visibility = 'hidden';
    op1Scene.style.transform = '';
    if (op1Img) op1Img.style.opacity = '0';
    setTiles(-1);
    sem1Bg.style.opacity = '';
    sem1Bg.style.visibility = '';
    if (patchFin) { patchFin.style.opacity = ''; patchFin.style.visibility = ''; }
    if (window.PIXMAP) {
      window.PIXMAP.netActive = false;
      if (window.PIXMAP._op1SavedPE) {
        window.PIXMAP.setPatchExit = window.PIXMAP._op1SavedPE;
        delete window.PIXMAP._op1SavedPE;
      }
      window.PIXMAP._op1ExitDone = false;
    }
    hideGroup(op1Group);
    hideText(op1TextEl, wordSpans);
  }

  function doReversal(backRaw) {
    hideGroup(op1Group);
    op1Scene.style.transform = '';   /* clear any exit-up shift from before */

    var op1T = eio(clamp(backRaw / 0.32, 0, 1));
    setTiles(TILE_TOTAL * (1 - op1T));
    if (op1Img) op1Img.style.opacity = (1 - op1T).toFixed(3);
    var op1Op = 1 - op1T;
    op1Scene.style.opacity = op1Op.toFixed(3);
    op1Scene.style.visibility = op1Op > 0.005 ? 'visible' : 'hidden';
    if (op1T < 0.5) op1Scene.classList.add('glow-active');
    else op1Scene.classList.remove('glow-active');

    var bgIn = eio(clamp((backRaw - 0.15) / 0.40, 0, 1));
    sem1Bg.style.opacity = bgIn.toFixed(3);
    sem1Bg.style.visibility = bgIn > 0.005 ? 'visible' : 'hidden';
    if (patchFin) {
      patchFin.style.opacity = bgIn.toFixed(3);
      patchFin.style.visibility = bgIn > 0.005 ? 'visible' : 'hidden';
    }
  }

  /* ── Scroll listener ──────────────────────────────────────── */
  window.addEventListener('scroll', function () {
    var anchor = window.PIXMAP && window.PIXMAP.uspCompleteScrollY;

    if (STATE === 'IDLE') {
      if (!anchor) return;
      if ((window.scrollY - anchor) / window.innerHeight < 0.20) return;
      savedAnchor = anchor;
      seqT0 = performance.now();
      STATE = 'ANIMATING';
      resetFinalLatch();
      window.PIXMAP = window.PIXMAP || {};
      window.PIXMAP.netActive = true;
      if (window.PIXMAP.setPatchExit && !window.PIXMAP._op1SavedPE) {
        window.PIXMAP._op1SavedPE = window.PIXMAP.setPatchExit;
        window.PIXMAP.setPatchExit = function () {};
      }
      initText();
      return;
    }

    if (STATE === 'ANIMATING') {
      window.PIXMAP = window.PIXMAP || {};
      window.PIXMAP.netActive = true;
      if (savedAnchor && window.scrollY < savedAnchor + 60) {
        if (op1TextEl) { op1TextEl.style.visibility = 'hidden'; op1TextEl.style.opacity = '0'; }
        leave();
      }
      return;
    }

    if (STATE === 'COMPLETE') {
      window.PIXMAP = window.PIXMAP || {};
      if (!savedAnchor) { leave(); return; }

      var vh = window.innerHeight;
      var asmAnchor = op1AsmScrollY || savedAnchor;
      var fwd = window.scrollY - asmAnchor;

      /* Staged op1 timeline (scroll-driven):
         1) REVEAL  : items appear one-by-one
         2) HOLD    : items stay fully formed (~2 scrolls)
         3) LIST_UP : the 6 items slide UP and fade out (a clean beat)
         4) EXIT    : the whole card rises + fades into the finale */
      var P1_REVEAL = 0.60 * vh;
      var P1_HOLD   = 0.60 * vh;
      var P1_LISTUP = 0.55 * vh;
      var EXIT_START = P1_REVEAL + P1_HOLD + P1_LISTUP;
      var LIST_RISE = 0.55 * vh;

      var sceneH = op1Scene.offsetHeight ||
        (op1Scene.getBoundingClientRect && op1Scene.getBoundingClientRect().height) ||
        (vh * 0.56);
      var EXIT_DIST = (vh / 2 + getHeaderHeight() / 2) + (sceneH / 2) + 4;

      /* Already handed off to the finale — reversible: scrolling back up
         un-reveals it once past a small hysteresis band. */
      if (window.PIXMAP._op1ExitDone) {
        if (exitFwdSaved !== null && fwd < exitFwdSaved - HANDOFF_HYST) {
          if (reservedHeightPx !== null && uspSection) {
            uspSection.style.height = px(reservedHeightPx);
          }
          hideFinale();
          resetFinalLatch();
          window.PIXMAP._op1ExitDone = false;
          /* fall through to re-render the panel/exit state below */
        } else {
          return;   /* stay in the finale */
        }
      }

      if (fwd > 0) {
        window.PIXMAP.netActive = true;
        op1Scene.style.visibility = 'visible';
        setTiles(TILE_TOTAL + 1);
        if (op1Img) op1Img.style.opacity = '1';
        setBaseHidden();

        /* 1) reveal one-by-one */
        op1Group.wrap.style.visibility = 'visible';
        var op1Reveal = clamp(fwd / P1_REVEAL, 0, 1);
        var op1Shown  = clamp(Math.round(op1Reveal * OP1_PANELS.length), 0, OP1_PANELS.length);
        op1Group.panels.forEach(function (el, i) {
          el.classList.toggle('visible', i < op1Shown);
        });
        /* 2) hold (P1_HOLD), then slide the whole column UP + fade */
        var op1Up = clamp((fwd - (P1_REVEAL + P1_HOLD)) / P1_LISTUP, 0, 1);
        if (op1Up >= 1) {
          hideGroup(op1Group);
        } else {
          op1Group.wrap.style.transform = 'translateY(' + px(-op1Up * LIST_RISE) + ')';
          op1Group.wrap.style.opacity = (1 - op1Up).toFixed(3);
        }

        /* 3) exit — only after the panels have fully left */
        var up = fwd > EXIT_START ? (fwd - EXIT_START) : 0;
        var sceneOp = up > 0 ? clamp(1 - up / EXIT_DIST, 0, 1) : 1;
        op1Scene.style.opacity = sceneOp.toFixed(3);
        op1Scene.style.transform = up > 0
          ? 'translateX(-50%) translateY(calc(-50% - ' + px(up) + '))'
          : '';

        if (up > 0) op1Scene.classList.remove('glow-active');
        else if (fwd < P1_REVEAL) op1Scene.classList.add('glow-active');
        else op1Scene.classList.remove('glow-active');

        if (up >= EXIT_DIST) {
          completeOp1Handoff(EXIT_START + EXIT_DIST);
        }
      } else {
        window.PIXMAP.netActive = true;
        hideGroup(op1Group);

        var back = (savedAnchor - window.scrollY) / vh;
        if (back > 0.65) { leave(); return; }
        if (back > 0) doReversal(back);
        else {
          setTiles(TILE_TOTAL + 1);
          if (op1Img) op1Img.style.opacity = '1';
          op1Scene.style.opacity = '1';
          op1Scene.style.visibility = 'visible';
          op1Scene.style.transform = '';
          op1Scene.classList.add('glow-active');
          setBaseHidden();
        }
      }
    }
  }, { passive: true });

}());
