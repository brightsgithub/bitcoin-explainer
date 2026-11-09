// Title scene: a short chain of blocks that draws itself once on load.
// Purely decorative; it is not driven by scrolling.

import { mountStage, reducedMotion } from '../lib/helpers.js';

const BLOCKS = [0, 1, 2, 3];
const blockX = (i) => 20 + i * 160;

const SVG = `
<svg viewBox="0 0 640 130" aria-hidden="true">
  ${BLOCKS.slice(1)
    .map((i) => `<path class="i-link outline s-muted" pathLength="1" d="M${blockX(i) - 40} 65 H${blockX(i)}"/>`)
    .join('')}
  ${BLOCKS.map(
    (i) => `
    <g class="i-block">
      <rect class="card ${i === 3 ? 's-orange' : ''}" x="${blockX(i)}" y="20" width="120" height="90" rx="10"/>
      <path class="hair" d="M${blockX(i) + 20} 52 h80 M${blockX(i) + 20} 72 h80 M${blockX(i) + 20} 92 h50"/>
    </g>`
  ).join('')}
</svg>`;

export function init(section) {
  const svg = mountStage(section, SVG);
  const q = gsap.utils.selector(svg);

  gsap.set(q('.i-block'), { opacity: 0, y: 16 });
  gsap.set(q('.i-link'), { strokeDasharray: 1, strokeDashoffset: 1 });

  const tl = gsap.timeline({ delay: 0.3, defaults: { ease: 'power2.out' } });
  BLOCKS.forEach((i) => {
    tl.to(q('.i-block')[i], { opacity: 1, y: 0, duration: 0.45 }, i * 0.35);
    if (i > 0) tl.to(q('.i-link')[i - 1], { strokeDashoffset: 0, duration: 0.3 }, i * 0.35 - 0.1);
  });

  // Reduced motion: show the finished drawing straight away.
  if (reducedMotion()) tl.progress(1);
}
