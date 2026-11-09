// Shared helpers used by every scene.
// GSAP and ScrollTrigger are loaded as globals from the CDN in index.html.

const REDUCED = '(prefers-reduced-motion: reduce)';
const NARROW = '(max-width: 799px)'; // keep in sync with css/style.css

// Add ?reduced-motion to the page address to preview the reduced-motion
// version without changing your device settings.
const FORCE_REDUCED = new URLSearchParams(window.location.search).has('reduced-motion');
if (FORCE_REDUCED) document.documentElement.classList.add('reduced-motion');

/** True when the viewer has asked their device for less motion. */
export function reducedMotion() {
  return FORCE_REDUCED || window.matchMedia(REDUCED).matches;
}

/**
 * Animation length for the click-driven demos: the given number of
 * seconds normally, or 0 (an instant change) under reduced motion.
 */
export function dur(seconds) {
  return reducedMotion() ? 0 : seconds;
}

/** True when the browser's built-in cryptography is available (https or localhost). */
export function hasCrypto() {
  return Boolean(window.crypto?.subtle);
}

/** Real SHA-256 of some text (or raw bytes), as 64 hexadecimal characters. */
export async function sha256Hex(input) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return toHex(digest);
}

/** Bytes → hexadecimal text. */
export function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Put a scene's SVG into its stage and return the <svg> element. */
export function mountStage(container, svgMarkup) {
  const stage = container.querySelector('[data-stage]');
  stage.innerHTML = svgMarkup;
  return stage.querySelector('svg');
}

/** Create an SVG element (document.createElement only makes HTML ones). */
export function svgNode(markup) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = markup;
  return g;
}

/**
 * Connect a scene's timeline to its caption cards.
 *
 * Convention: the timeline is built so that caption N's animation
 * lives between time N and time N+1 (0-based). As each caption card
 * scrolls from the bottom of the screen up to reading height, it
 * drives its own one-unit slice of the timeline.
 *
 * Reduced motion: nothing glides. The picture jumps straight to the
 * finished state of each step as its caption arrives, like a slide.
 */
export function driveScene(section, timeline) {
  const steps = gsap.utils.toArray(section.querySelectorAll('.step'));
  const count = steps.length;

  // Pad the timeline to exactly one unit per caption.
  timeline.set({}, {}, count);
  timeline.pause(0);

  const mm = gsap.matchMedia();
  mm.add({ reduced: REDUCED, narrow: NARROW, always: '(min-width: 0px)' }, (ctx) => {
    const { narrow } = ctx.conditions;
    const reduced = FORCE_REDUCED || ctx.conditions.reduced;
    let triggers = [];

    const sync = () => {
      const done = triggers.reduce(
        (sum, t) => sum + (reduced ? Math.round(t.progress) : t.progress),
        0
      );
      const progress = done / count;
      if (reduced) {
        gsap.killTweensOf(timeline);
        timeline.progress(progress);
      } else {
        // Ease towards the scroll position so the motion stays smooth.
        gsap.to(timeline, { progress, duration: 0.5, ease: 'power2.out', overwrite: true });
      }
    };

    triggers = steps.map((step) =>
      ScrollTrigger.create({
        trigger: step,
        // On a phone the graphic covers the top 46% of the screen, so
        // captions are read lower down than on a wide screen.
        start: narrow ? 'top 97%' : 'top 85%',
        end: narrow ? 'top 62%' : 'top 45%',
        onUpdate: sync,
      })
    );

    // Re-sync once ScrollTrigger has finished measuring every caption
    // (on load, on resize, and when the browser restores a scroll
    // position after a reload part-way down the page).
    const resync = () => requestAnimationFrame(sync);
    ScrollTrigger.addEventListener('refresh', resync);

    // Highlight whichever caption is currently being read.
    steps.forEach((step) =>
      ScrollTrigger.create({
        trigger: step,
        start: narrow ? 'top 97%' : 'top 85%',
        end: narrow ? 'bottom 46%' : 'bottom 15%',
        toggleClass: 'is-active',
      })
    );

    sync();
    return () => ScrollTrigger.removeEventListener('refresh', resync);
  });
}
