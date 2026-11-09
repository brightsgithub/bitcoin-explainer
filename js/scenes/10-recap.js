// Recap — the whole journey on one screen: sign → wait → mine → link → agree.
// One scroll-driven picture with five steps (one per caption in index.html).
// Each stop reuses, in miniature, the look of the scene it stands for.

import { mountStage, driveScene } from '../lib/helpers.js';

const STOPS = [70, 195, 320, 445, 570];
const NAMES = ['sign', 'wait', 'mine', 'link', 'agree'];
const Y = 220;

// Small drawings, each centred on (0, 0) and about 70 units across.
const ICONS = [
  // A signed transaction slip
  `<rect class="card" x="-26" y="-34" width="52" height="68" rx="6"/>
   <path class="hair" d="M-15 -18 h30 M-15 -6 h30"/>
   <path class="outline s-teal" d="M-15 16 c4 -12 8 -12 10 0 s8 10 10 0 s6 -6 10 -2"/>`,
  // The mempool
  `<rect class="card" x="-34" y="-34" width="68" height="68" rx="10"/>
   <rect class="outline s-muted" x="-22" y="-23" width="44" height="11" rx="3"/>
   <rect class="outline s-orange" x="-22" y="-6" width="44" height="11" rx="3"/>
   <rect class="outline s-muted" x="-22" y="11" width="44" height="11" rx="3"/>`,
  // A block with a valid hash
  `<rect class="card" x="-34" y="-34" width="68" height="68" rx="10"/>
   <path class="hair" d="M-20 -14 h40 M-20 0 h40"/>
   <text class="mono bold mid t-teal" y="24" style="font-size:17px">000…</text>`,
  // Linked blocks
  `<rect class="card" x="-36" y="-14" width="28" height="28" rx="5"/>
   <rect class="card s-teal" x="8" y="-14" width="28" height="28" rx="5"/>
   <path class="outline s-teal" d="M-8 0 h16"/>`,
  // Nodes in agreement
  `<path class="outline s-muted" d="M0 -26 L-26 10 L26 10 Z M0 -26 L0 26 M-26 10 L0 26 L26 10"/>
   <circle cx="0" cy="-26" r="8" fill="#3DD6B0"/><circle cx="-26" cy="10" r="8" fill="#3DD6B0"/>
   <circle cx="26" cy="10" r="8" fill="#3DD6B0"/><circle cx="0" cy="26" r="8" fill="#3DD6B0"/>`,
];

const SVG = `
<svg viewBox="0 0 640 480" role="img"
     aria-label="Five stops in a row: sign a transaction, wait in the mempool, get mined into a block, link into the chain, and every node agrees.">
  ${STOPS.slice(1).map((x, i) => `<path class="r-track outline s-muted" pathLength="1" d="M${STOPS[i] + 42} ${Y} H${x - 42}"/>`).join('')}
  ${STOPS.map((x, i) => `
    <g class="r-stop">
      <g transform="translate(${x},${Y})">${ICONS[i]}</g>
      <text class="bold mid" x="${x}" y="${Y + 72}">${NAMES[i]}</text>
    </g>`).join('')}
  <circle class="r-dot" cx="${STOPS[0]}" cy="${Y - 62}" r="10" fill="#F7931A"/>
  <text class="r-end bold mid" x="320" y="388" style="font-size:24px">No bank. No one in charge.</text>
  <text class="r-end t-muted mid" x="320" y="420">Just rules that anyone can check.</text>
</svg>`;

function buildTimeline(svg) {
  const q = gsap.utils.selector(svg);
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });

  // Starting picture: all five stops dimmed, the dot above the first.
  gsap.set(q('.r-stop'), { opacity: 0.25 });
  gsap.set(q('.r-track'), { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set(q('.r-end'), { opacity: 0 });

  // Steps 1–5: the dot moves along; each stop lights up as it arrives.
  STOPS.forEach((x, i) => {
    if (i > 0) {
      tl.to(q('.r-dot'), { x: x - STOPS[0], duration: 0.4 }, i + 0.1)
        .to(q('.r-track')[i - 1], { strokeDashoffset: 0, duration: 0.4 }, i + 0.1);
    }
    tl.to(q('.r-stop')[i], { opacity: 1, duration: 0.25 }, i + (i > 0 ? 0.4 : 0.2));
  });
  tl.to(q('.r-end'), { opacity: 1, duration: 0.2, stagger: 0.12 }, 4.65);

  return tl;
}

export function init(section) {
  const svg = mountStage(section, SVG);
  driveScene(section, buildTimeline(svg));
}
