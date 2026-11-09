// Scene 8 — The network and consensus: nodes agreeing on one chain.
//
// Two parts:
//   1. A scroll-driven picture with five steps (one per caption in index.html).
//   2. A "try it" demo: break a tie between two competing chains.
//
// SIMPLIFIED: eight nodes stand in for tens of thousands. That figure covers
// publicly reachable nodes plus estimates of those behind home routers; the
// exact number is not knowable.
// SIMPLIFIED: "the longest chain wins" is the popular shorthand. The real
// rule is the valid chain with the most accumulated proof of work. Here every
// block represents equal work, so longest and most-work are the same chain.
// SIMPLIFIED: when a block loses a tie it is dropped (a "stale" block), and
// any of its transactions not in the winning chain go back to the mempool.
// SIMPLIFIED: confirmations make reversal increasingly unlikely, not strictly
// impossible. Six (about an hour) is a convention, not a rule of the system.

import { mountStage, driveScene, dur } from '../lib/helpers.js';

const TEAL = '#3DD6B0';
const ORANGE = '#F7931A';
const IDLE = '#2A303A';

// ── The network: eight nodes and who talks to whom ─────────────────────────

const NODES = [
  { x: 70, y: 180 }, { x: 190, y: 80 }, { x: 200, y: 270 }, { x: 320, y: 170 },
  { x: 450, y: 80 }, { x: 440, y: 270 }, { x: 570, y: 180 }, { x: 320, y: 320 },
];
const LINKS = [[0, 1], [0, 2], [1, 3], [2, 3], [1, 4], [3, 4], [3, 5], [2, 7], [5, 7], [4, 6], [5, 6], [3, 7]];

// How many hops each node is from a starting node (optionally only
// spreading through the nodes listed in `within`).
function hopsFrom(start, within = NODES.map((_, i) => i)) {
  const hops = { [start]: 0 };
  const queue = [start];
  while (queue.length) {
    const here = queue.shift();
    LINKS.forEach(([a, b]) => {
      const there = a === here ? b : b === here ? a : -1;
      if (there >= 0 && within.includes(there) && !(there in hops)) {
        hops[there] = hops[here] + 1;
        queue.push(there);
      }
    });
  }
  return hops;
}

const SIDE_A = [0, 1, 2, 3]; // nodes that hear version A first
const SIDE_B = [6, 4, 5, 7]; // nodes that hear version B first

const newBlock = (cls, node, colour) => `
  <rect class="n-new ${cls}" x="${NODES[node].x - 11}" y="${NODES[node].y - 52}" width="22" height="22" rx="4" fill="${colour}"/>`;

const stripX = (i) => 95 + i * 68;

// ── The scroll-driven picture (viewBox is 640 × 480) ───────────────────────

const SVG = `
<svg viewBox="0 0 640 480" role="img"
     aria-label="A network of nodes. A new block spreads from node to node. Two competing blocks split the network, until the next block settles which chain everyone follows. Six more blocks stack up as confirmations.">

  <g class="n-net">
    ${LINKS.map(([a, b]) => `<path class="outline s-muted" opacity="0.5" d="M${NODES[a].x} ${NODES[a].y} L${NODES[b].x} ${NODES[b].y}"/>`).join('')}
    ${NODES.map(({ x, y }, i) => `
      <g class="n-node n-node-${i}">
        <circle class="card" cx="${x}" cy="${y}" r="20"/>
        <circle class="n-fill n-fill-${i}" cx="${x}" cy="${y}" r="11" fill="${IDLE}"/>
      </g>`).join('')}
    ${newBlock('n-new-first', 0, TEAL)}
    ${newBlock('n-new-a', 0, TEAL)}
    ${newBlock('n-new-b', 6, ORANGE)}
    ${newBlock('n-new-next', 1, TEAL)}
  </g>

  <text class="n-label n-label-1 t-teal bold mid" x="320" y="408">every node checks it, then passes it on</text>
  <text class="n-label n-label-2 bold mid" x="320" y="408">two versions of the latest block</text>
  <text class="n-label n-label-3 t-teal bold mid" x="320" y="408">more work wins: everyone agrees again</text>

  <!-- Step 5: confirmations -->
  <g class="n-strip">
    <path class="outline s-muted" d="M${stripX(0) + 44} 394 H${stripX(6)}"/>
    <rect class="card s-orange" x="${stripX(0)}" y="372" width="44" height="44" rx="7"/>
    <circle cx="${stripX(0) + 22}" cy="394" r="8" fill="${ORANGE}"/>
    ${[1, 2, 3, 4, 5, 6].map((i) => `<rect class="n-confirm card s-teal" x="${stripX(i)}" y="372" width="44" height="44" rx="7"/>`).join('')}
    <text class="n-count bold mid" x="320" y="452">0 confirmations</text>
  </g>
</svg>`;

function buildTimeline(svg) {
  const q = gsap.utils.selector(svg);
  const countEl = q('.n-count')[0];
  const dial = { blocks: 0 };
  const render = () => {
    const n = Math.round(dial.blocks);
    countEl.textContent = `${n} confirmation${n === 1 ? '' : 's'}`;
  };

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' }, onUpdate: render });
  const fill = (i) => q(`.n-fill-${i}`);

  // Starting picture: a quiet network.
  gsap.set(q('.n-new'), { opacity: 0, scale: 0, transformOrigin: '50% 50%' });
  gsap.set(q('.n-label, .n-strip'), { opacity: 0 });
  gsap.set(q('.n-confirm'), { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' });
  gsap.set(q('.n-node'), { opacity: 0, scale: 0.5, transformOrigin: '50% 50%' });

  // Colour the nodes one hop at a time, like news spreading.
  const spread = (hops, colour, at, pace) => {
    Object.entries(hops).forEach(([node, distance]) => {
      tl.to(fill(node), { fill: colour, duration: 0.1 }, at + distance * pace);
    });
  };

  // Step 1 (0 → 1): the nodes.
  tl.to(q('.n-node'), { opacity: 1, scale: 1, duration: 0.2, stagger: 0.07, ease: 'back.out(2)' }, 0.1);

  // Step 2 (1 → 2): a new block spreads, checked at every hop.
  tl.to(q('.n-new-first'), { opacity: 1, scale: 1, duration: 0.15, ease: 'back.out(2)' }, 1.05);
  spread(hopsFrom(0), TEAL, 1.2, 0.14);
  tl.to(q('.n-label-1'), { opacity: 1, duration: 0.15 }, 1.8);

  // Step 3 (2 → 3): two blocks found at once split the network.
  tl.to(q('.n-label-1, .n-new-first'), { opacity: 0, duration: 0.1 }, 2)
    .to(q('.n-fill'), { fill: IDLE, duration: 0.12 }, 2.02)
    .to(q('.n-new-a, .n-new-b'), { opacity: 1, scale: 1, duration: 0.15, ease: 'back.out(2)' }, 2.18);
  spread(hopsFrom(0, SIDE_A), TEAL, 2.32, 0.14);
  spread(hopsFrom(6, SIDE_B), ORANGE, 2.32, 0.14);
  tl.to(q('.n-label-2'), { opacity: 1, duration: 0.15 }, 2.8);

  // Step 4 (3 → 4): the next block lands on version A; everyone switches.
  tl.to(q('.n-label-2'), { opacity: 0, duration: 0.1 }, 3)
    .to(q('.n-new-next'), { opacity: 1, scale: 1, duration: 0.15, ease: 'back.out(2)' }, 3.1)
    .to(q('.n-new-b'), { opacity: 0, scale: 0, duration: 0.2 }, 3.3);
  spread(hopsFrom(1), TEAL, 3.3, 0.16);
  tl.to(q('.n-label-3'), { opacity: 1, duration: 0.15 }, 3.8);

  // Step 5 (4 → 5): six more blocks on top are six confirmations.
  tl.to(q('.n-label-3'), { opacity: 0, duration: 0.1 }, 4)
    .to(q('.n-net'), { opacity: 0.3, duration: 0.2 }, 4)
    .to(q('.n-strip'), { opacity: 1, duration: 0.2 }, 4.12)
    .to(q('.n-confirm'), { opacity: 1, scale: 1, duration: 0.09, stagger: 0.09, ease: 'back.out(2)' }, 4.32)
    .to(dial, { blocks: 6, duration: 0.54, ease: 'none' }, 4.32);

  return tl;
}

// ── "Try it": break a tie ──────────────────────────────────────────────────

const MAX_LENGTH = 6;
const chainX = (i) => 126 + i * 54;

const DEMO = `
<svg viewBox="0 0 480 232" role="img" aria-label="Two competing chains, top and bottom, and eight nodes choosing between them.">
  <path class="outline s-muted" d="M56 100 h14 M106 100 C116 100 110 58 126 58 M106 100 C116 100 110 142 126 142"/>
  <rect class="card" x="20" y="82" width="36" height="36" rx="6"/>
  <rect class="card" x="70" y="82" width="36" height="36" rx="6"/>
  <g class="f-top">
    ${Array.from({ length: MAX_LENGTH }, (_, i) => `<rect class="f-block card s-teal" x="${chainX(i)}" y="40" width="36" height="36" rx="6"/>`).join('')}
  </g>
  <g class="f-bottom">
    ${Array.from({ length: MAX_LENGTH }, (_, i) => `<rect class="f-block card s-orange" x="${chainX(i)}" y="124" width="36" height="36" rx="6"/>`).join('')}
  </g>
  <text class="t-muted" x="20" y="212" style="font-size:17px">nodes</text>
  ${Array.from({ length: 8 }, (_, i) => `<circle class="f-node" cx="${100 + i * 32}" cy="206" r="11"/>`).join('')}
</svg>
<div class="controls">
  <button class="btn" type="button" data-extend="top">Extend top chain</button>
  <button class="btn" type="button" data-extend="bottom">Extend bottom chain</button>
  <button class="btn btn--quiet" type="button" data-reset>Reset</button>
</div>
<p class="status" aria-live="polite"></p>`;

function initDemo(root) {
  root.innerHTML = DEMO;
  const status = root.querySelector('.status');
  const nodes = [...root.querySelectorAll('.f-node')];
  const groups = { top: root.querySelector('.f-top'), bottom: root.querySelector('.f-bottom') };
  const blocks = { top: [...groups.top.children], bottom: [...groups.bottom.children] };
  const buttons = { top: root.querySelector('[data-extend="top"]'), bottom: root.querySelector('[data-extend="bottom"]') };
  const COLOUR = { top: TEAL, bottom: ORANGE };

  let length;
  let following; // which chain each node currently follows

  function render(message, tone = '') {
    ['top', 'bottom'].forEach((side) => {
      blocks[side].forEach((block, i) => gsap.to(block, { opacity: i < length[side] ? 1 : 0, duration: dur(0.25) }));
      buttons[side].disabled = length[side] >= MAX_LENGTH;
    });
    const leader = length.top === length.bottom ? null : length.top > length.bottom ? 'top' : 'bottom';
    gsap.to(groups.top, { opacity: leader === 'bottom' ? 0.3 : 1, duration: dur(0.3) });
    gsap.to(groups.bottom, { opacity: leader === 'top' ? 0.3 : 1, duration: dur(0.3) });
    nodes.forEach((node, i) => gsap.to(node, { fill: COLOUR[following[i]], duration: dur(0.3), delay: dur(i * 0.04) }));
    status.textContent = message;
    status.className = `status ${tone}`;
  }

  function reset() {
    length = { top: 1, bottom: 1 };
    following = ['top', 'top', 'top', 'top', 'bottom', 'bottom', 'bottom', 'bottom'];
    render('Both chains are the same length, so each node sticks with the block it heard about first.');
  }

  function extend(side) {
    length[side] += 1;
    const other = side === 'top' ? 'bottom' : 'top';
    if (length[side] > length[other]) {
      following = following.map(() => side);
      render(`The ${side} chain now has more work behind it, so every node switches to it. The ${other} chain's blocks are dropped, and their transactions go back to the mempool.`, 'is-good');
    } else if (length[side] === length[other]) {
      render('Level again. The nodes stay where they are until one chain pulls ahead.');
    } else {
      render(`The ${side} chain is still shorter, so nobody switches. Its miners are wasting their effort.`);
    }
  }

  Object.entries(buttons).forEach(([side, button]) => button.addEventListener('click', () => extend(side)));
  root.querySelector('[data-reset]').addEventListener('click', reset);
  reset();
}

// ── Start ──────────────────────────────────────────────────────────────────

export function init(section) {
  const svg = mountStage(section, SVG);
  driveScene(section, buildTimeline(svg));
  initDemo(section.querySelector('[data-demo]'));
}
