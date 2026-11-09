// Scene 4 — The mempool: transactions waiting to be confirmed.
//
// Two parts:
//   1. A scroll-driven picture with four steps (one per caption in index.html).
//   2. A "try it" demo: pick a fee and see where you land in the queue.
//
// SIMPLIFIED: there is no single mempool. Every node keeps its own, and they
// differ slightly. The picture shows one node's view.
// SIMPLIFIED: fees are shown as plain numbers. Really, miners rank
// transactions by fee per unit of size ("satoshis per virtual byte"), because
// a block has room for a limited amount of data, not a fixed number of
// transactions.
// SIMPLIFIED: the block here holds 4 transactions. Real blocks typically hold
// a few thousand.
// SIMPLIFIED: miners are free to choose any valid transactions. Picking the
// highest fees is simply what earns them the most.

import { mountStage, driveScene } from '../lib/helpers.js';

// Nine waiting transactions in a 3 × 3 grid. Slot 4 (the middle) is Alice's.
const FEES = [4, 21, 9, 35, 15, 2, 27, 6, 12];
const ALICE = 4;
const BLOCK_ROOM = 4;

const slotPosition = (i) => ({ x: 95 + (i % 3) * 120, y: 205 + Math.floor(i / 3) * 78 });

// The four best-paying slots, highest fee first.
const WINNERS = FEES.map((fee, slot) => ({ fee, slot }))
  .sort((a, b) => b.fee - a.fee)
  .slice(0, BLOCK_ROOM)
  .map((entry) => entry.slot);

const slip = (i) => `
  <g class="m-slip m-slip-${i} ${i === ALICE ? 'm-alice' : 'm-other'}">
    <rect class="card ${i === ALICE ? 's-orange' : ''}" x="-50" y="-23" width="100" height="46" rx="7"/>
    <text class="m-fee mono mid ${i === ALICE ? 't-orange' : ''}" y="7">fee ${FEES[i]}</text>
  </g>`;

// ── The scroll-driven picture (viewBox is 640 × 480) ───────────────────────

const SVG = `
<svg viewBox="0 0 640 480" role="img"
     aria-label="Alice's transaction is checked and joins a waiting room of transactions, each offering a fee. The four highest-paying transactions are picked for the next block.">

  <!-- The checks every node makes -->
  <text class="m-check t-teal" x="285" y="54">✓ signature is valid</text>
  <text class="m-check t-teal" x="285" y="86">✓ coin not already spent</text>

  <!-- The waiting room -->
  <rect class="card" x="30" y="120" width="370" height="335" rx="14"/>
  <text class="small t-muted" x="50" y="152">MEMPOOL</text>
  <text class="m-legend t-muted end" x="382" y="152" style="font-size:16px">waiting to be confirmed</text>

  <!-- The next block -->
  <rect class="outline s-muted" x="440" y="120" width="170" height="335" rx="14" stroke-dasharray="7 7"/>
  <text class="small t-muted mid" x="525" y="152">NEXT BLOCK</text>
  <text class="m-room t-muted mid" x="525" y="438" style="font-size:16px">room for ${BLOCK_ROOM}</text>

  ${FEES.map((_, i) => (i === ALICE ? '' : slip(i))).join('')}
  ${slip(ALICE)}
</svg>`;

function buildTimeline(svg) {
  const q = gsap.utils.selector(svg);
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });

  const CHECKPOINT = { x: 150, y: 64 };

  // Starting picture: an empty waiting room. Alice's transaction is off-stage.
  gsap.set(q('.m-slip'), { transformOrigin: '50% 50%' });
  FEES.forEach((_, i) => gsap.set(q(`.m-slip-${i}`), { ...slotPosition(i) }));
  gsap.set(q('.m-other'), { opacity: 0, scale: 0.6 });
  gsap.set(q('.m-alice'), { x: -70, y: CHECKPOINT.y });
  gsap.set(q('.m-check, .m-room'), { opacity: 0 });

  // Step 1 (0 → 1): the transaction arrives from the network.
  tl.to(q('.m-alice'), { ...CHECKPOINT, duration: 0.7, ease: 'power2.out' }, 0.15);

  // Step 2 (1 → 2): it is checked, then let into the waiting room.
  tl.to(q('.m-check'), { opacity: 1, duration: 0.15, stagger: 0.2 }, 1.1)
    .to(q('.m-alice'), { ...slotPosition(ALICE), duration: 0.4 }, 1.55);

  // Step 3 (2 → 3): thousands of others are waiting too.
  tl.to(q('.m-check'), { opacity: 0.35, duration: 0.15 }, 2)
    .to(q('.m-other'), { opacity: 1, scale: 1, duration: 0.2, stagger: 0.07, ease: 'back.out(2)' }, 2.1);

  // Step 4 (3 → 4): the best-paying four are picked for the next block.
  tl.to(q('.m-room'), { opacity: 1, duration: 0.15 }, 3.05);
  WINNERS.forEach((slot, rank) => {
    tl.to(q(`.m-slip-${slot}`), { x: 525, y: 196 + rank * 58, duration: 0.35 }, 3.15 + rank * 0.14);
  });
  const losers = FEES.map((_, i) => i).filter((i) => !WINNERS.includes(i));
  tl.to(losers.map((i) => q(`.m-slip-${i}`)[0]), { opacity: 0.4, duration: 0.2 }, 3.75);

  return tl;
}

// ── "Try it": choose your fee ──────────────────────────────────────────────
//
// SIMPLIFIED: "about 10 minutes" per block is an average. Blocks arrive at
// random: sometimes two in a minute, sometimes none for an hour. New
// transactions also keep arriving and can jump the queue with higher fees.

const OTHERS = [38, 31, 27, 22, 18, 14, 11, 9, 6, 4, 2];
const GROUPS = ['Next block · about 10 min', 'Block after · about 20 min', 'Later · 30 min or more'];

const DEMO = `
<label class="field">
  <span>Your fee: <strong data-fee></strong></span>
  <input class="range" type="range" min="1" max="40" value="5" data-range>
</label>
<div class="queue" data-queue></div>
<p class="status" aria-live="polite"></p>`;

function initDemo(root) {
  root.innerHTML = DEMO;
  const range = root.querySelector('[data-range]');
  const queue = root.querySelector('[data-queue]');
  const status = root.querySelector('.status');

  function render() {
    const mine = Number(range.value);
    root.querySelector('[data-fee]').textContent = mine;

    // Highest fee first. On a tie, those already waiting stay ahead of you.
    const line = [...OTHERS.map((fee) => ({ fee })), { fee: mine, you: true }]
      .sort((a, b) => b.fee - a.fee || (a.you ? 1 : 0) - (b.you ? 1 : 0));
    const place = line.findIndex((entry) => entry.you);
    const group = Math.floor(place / BLOCK_ROOM);

    queue.innerHTML = GROUPS.map((title, g) => {
      const chips = line
        .slice(g * BLOCK_ROOM, (g + 1) * BLOCK_ROOM)
        .map((entry) => `<span class="chip ${entry.you ? 'is-you' : ''}">${entry.you ? 'you · ' : ''}${entry.fee}</span>`)
        .join('');
      return `<div class="queue__group"><p class="queue__title">${title}</p>${chips}</div>`;
    }).join('');

    status.textContent =
      group === 0
        ? `A fee of ${mine} puts you ${place + 1} of 12 in line: you make the very next block.`
        : group === 1
          ? `A fee of ${mine} puts you ${place + 1} of 12 in line: you miss the next block and wait for the one after.`
          : `A fee of ${mine} puts you ${place + 1} of 12 in line: you could be waiting a while, especially if better-paying transactions keep arriving.`;
  }

  range.addEventListener('input', render);
  render();
}

// ── Start ──────────────────────────────────────────────────────────────────

export function init(section) {
  const svg = mountStage(section, SVG);
  driveScene(section, buildTimeline(svg));
  initDemo(section.querySelector('[data-demo]'));
}
