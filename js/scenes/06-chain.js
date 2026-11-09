// Scene 6 — Blocks and the chain: each block links to the previous one by
// its hash, and why tampering breaks the chain.
//
// Two parts:
//   1. A scroll-driven picture with five steps (one per caption in index.html).
//   2. A "try it" demo: three linked blocks with real hashes to tamper with.
//
// SIMPLIFIED: the six-character hashes in the picture are made-up examples.
// Real ones are 64 characters. (The demo below uses real SHA-256.)
// SIMPLIFIED: a real block's hash covers a small "header" that holds the
// previous hash, a timestamp, the nonce, and one combined fingerprint of all
// the block's transactions (a Merkle root). The effect is the same: change
// any transaction and the block's hash changes.
// SIMPLIFIED: "about every ten minutes" is an average; see scene 7.

import { mountStage, driveScene, hasCrypto, sha256Hex } from '../lib/helpers.js';

const RED = '#FF5C5C';

// ── Drawing helpers ────────────────────────────────────────────────────────

const BLOCKS = [
  { x: 20, name: 'Block 101', prev: '7c2e91', hash: '00a3f1' },
  { x: 230, name: 'Block 102', prev: '00a3f1', hash: '004be7' },
  { x: 440, name: 'Block 103', prev: '004be7', hash: '00d92c' },
];
const TAMPERED_HASH = 'e81f04';

const block = ({ x, name, prev, hash }, i) => `
  <g class="c-block c-block-${i}">
    <rect class="c-frame card" x="${x}" y="120" width="180" height="244" rx="12"/>
    <text class="bold" x="${x + 16}" y="153">${name}</text>
    <text class="t-muted" x="${x + 16}" y="185" style="font-size:16px">previous</text>
    <text class="c-prev mono t-teal" x="${x + 16}" y="210">${prev}</text>
    <path class="hair" d="M${x + 16} 224 h148"/>
    <g class="c-contents">
      ${i === 0
        ? `<text class="c-tx" x="${x + 16}" y="252" style="font-size:17px">Alice → Bob 0.3</text>
           <text class="c-tx-bad t-red" x="${x + 16}" y="252" style="font-size:17px">Alice → Bob 9.3</text>`
        : `<path class="hair" d="M${x + 16} 246 h148"/>`}
      <path class="hair" d="M${x + 16} 268 h148 M${x + 16} 288 h96"/>
    </g>
    <path class="hair" d="M${x + 16} 304 h148"/>
    <g class="c-hash-row">
      <text class="t-muted" x="${x + 16}" y="328" style="font-size:16px">hash</text>
      <text class="c-hash mono t-teal" x="${x + 16}" y="352">${hash}</text>
      ${i === 0 ? `<text class="c-hash-bad mono t-red" x="${x + 16}" y="352">${TAMPERED_HASH}</text>` : ''}
    </g>
  </g>`;

// A link runs from one block's hash to the next block's "previous".
const link = (i) => {
  const from = BLOCKS[i].x + 180;
  return `
    <path class="c-link c-link-${i} outline s-teal" pathLength="1" d="M${from} 346 C${from + 22} 346 ${from + 8} 204 ${from + 30} 204"/>
    <text class="c-snap c-snap-${i} t-red bold mid" x="${from + 15}" y="284" style="font-size:26px">✗</text>`;
};

const flyingSlip = (i) => `
  <g class="c-slip c-slip-${i}">
    <rect class="card" x="-34" y="-13" width="68" height="26" rx="5"/>
    <path class="hair" d="M-22 0 h44"/>
  </g>`;

// ── The scroll-driven picture (viewBox is 640 × 480) ───────────────────────

const SVG = `
<svg viewBox="0 0 640 480" role="img"
     aria-label="Three blocks in a row. Each records the hash of the block before it. When a transaction in the first block is changed, its hash changes, the link to the second block breaks, and every later block is cut off.">
  ${BLOCKS.map(block).join('')}
  ${link(0)}
  ${link(1)}
  ${[0, 1, 2].map(flyingSlip).join('')}
  <rect class="c-scan" x="22" y="122" width="176" height="5" rx="2" fill="#3DD6B0"/>
  <text class="c-verdict t-red bold mid" x="320" y="420">everything after the edit is cut off</text>
</svg>`;

function buildTimeline(svg) {
  const q = gsap.utils.selector(svg);
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });

  // Starting picture: one empty block, waiting for transactions.
  gsap.set(q('.c-block-1, .c-block-2, .c-block-0 .c-contents, .c-hash-row, .c-tx-bad, .c-hash-bad, .c-snap, .c-scan, .c-verdict'), { opacity: 0 });
  gsap.set(q('.c-link'), { strokeDasharray: 1, strokeDashoffset: 1 });
  [0, 1, 2].forEach((i) => gsap.set(q(`.c-slip-${i}`), { x: 60 + i * 50, y: 60 }));
  gsap.set(q('.c-block-1 .c-hash-row, .c-block-2 .c-hash-row'), { opacity: 1 });

  // Step 1 (0 → 1): waiting transactions are bundled into a block.
  [0, 1, 2].forEach((i) => {
    tl.to(q(`.c-slip-${i}`), { x: 110, y: 250 + i * 20, duration: 0.3 }, 0.15 + i * 0.15)
      .to(q(`.c-slip-${i}`), { opacity: 0, duration: 0.08 }, 0.45 + i * 0.15);
  });
  tl.to(q('.c-block-0 .c-contents'), { opacity: 1, duration: 0.25 }, 0.55);

  // Step 2 (1 → 2): the block's contents are hashed into a fingerprint.
  tl.to(q('.c-scan'), { opacity: 0.7, duration: 0.05 }, 1.1)
    .to(q('.c-scan'), { y: 236, duration: 0.45, ease: 'none' }, 1.1)
    .to(q('.c-scan'), { opacity: 0, duration: 0.05 }, 1.55)
    .to(q('.c-block-0 .c-hash-row'), { opacity: 1, duration: 0.2 }, 1.6);

  // Step 3 (2 → 3): each new block records the previous block's hash.
  tl.to(q('.c-block-1'), { opacity: 1, duration: 0.2 }, 2.1)
    .to(q('.c-link-0'), { strokeDashoffset: 0, duration: 0.2 }, 2.3)
    .to(q('.c-block-2'), { opacity: 1, duration: 0.2 }, 2.5)
    .to(q('.c-link-1'), { strokeDashoffset: 0, duration: 0.2 }, 2.7);

  // Step 4 (3 → 4): someone edits a transaction in the first block.
  tl.to(q('.c-tx'), { opacity: 0, duration: 0.12 }, 3.15)
    .to(q('.c-tx-bad'), { opacity: 1, duration: 0.12 }, 3.2)
    .to(q('.c-block-0 .c-frame'), { stroke: RED, duration: 0.15 }, 3.3)
    .to(q('.c-block-0 .c-hash'), { opacity: 0, duration: 0.12 }, 3.6)
    .to(q('.c-hash-bad'), { opacity: 1, duration: 0.12 }, 3.65);

  // Step 5 (4 → 5): the link to the next block snaps.
  tl.to(q('.c-link-0'), { stroke: RED, duration: 0.12 }, 4.1)
    .to(q('.c-snap-0'), { opacity: 1, duration: 0.1 }, 4.15)
    .to(q('.c-block-1 .c-prev'), { fill: RED, duration: 0.12 }, 4.25)
    .to(q('.c-block-1 .c-frame'), { stroke: RED, duration: 0.12 }, 4.3)
    // Blocks 102 and 103 still fit each other, but they no longer attach
    // to anything, so they are cut off together.
    .to(q('.c-block-2 .c-frame'), { stroke: RED, duration: 0.12 }, 4.5)
    .to(q('.c-block-1, .c-block-2, .c-link-1'), { opacity: 0.45, duration: 0.2 }, 4.6)
    .to(q('.c-verdict'), { opacity: 1, duration: 0.2 }, 4.78);

  return tl;
}

// ── "Try it": tamper with a block ──────────────────────────────────────────
//
// Each block's hash is the real SHA-256 of its "previous" value plus its
// transactions. Only the first 12 of 64 characters are shown, to fit.
//
// The "Repair" button is there to make a point: without proof of work
// (scene 7), a cheat could simply recompute every later hash in an instant.

const ORIGINAL = ['Alice pays Bob 0.3', 'Bob pays Carol 0.1', 'Carol pays Dan 0.05'];
const GENESIS_PREV = '000000000000';
const short = (hash) => hash.slice(0, 12);

const DEMO = `
<div class="blocks">
  ${ORIGINAL.map((_, i) => `
    <div class="blk" data-block="${i}">
      <h4>Block ${i + 1}</h4>
      <p class="readout"><span class="readout__label">Previous</span><span class="readout__value" data-prev></span></p>
      <label class="field"><span>Transactions</span><input type="text" autocomplete="off" spellcheck="false" data-data></label>
      <p class="readout"><span class="readout__label">Hash</span><span class="readout__value" data-hash></span></p>
    </div>`).join('')}
</div>
<div class="controls">
  <button class="btn" type="button" data-repair>Repair the chain</button>
  <button class="btn btn--quiet" type="button" data-reset>Reset</button>
</div>
<p class="status" aria-live="polite"></p>`;

async function initDemo(root) {
  root.innerHTML = DEMO;
  const cards = [...root.querySelectorAll('[data-block]')];
  const status = root.querySelector('.status');
  const chain = ORIGINAL.map((data) => ({ data, prev: '', hash: '' }));

  const hashOf = (entry) => sha256Hex(`${entry.prev}|${entry.data}`);

  // Rebuild every link from the first block onwards.
  async function relink() {
    for (let i = 0; i < chain.length; i += 1) {
      chain[i].prev = i === 0 ? GENESIS_PREV : short(chain[i - 1].hash);
      chain[i].hash = await hashOf(chain[i]);
    }
  }

  function render(message, tone = '') {
    let broken = -1;
    chain.forEach((entry, i) => {
      if (broken < 0 && i > 0 && entry.prev !== short(chain[i - 1].hash)) broken = i;
      const card = cards[i];
      card.classList.toggle('is-bad', broken >= 0);
      card.querySelector('[data-prev]').textContent = entry.prev;
      card.querySelector('[data-hash]').textContent = short(entry.hash);
      card.querySelector('[data-prev]').parentElement.className = `readout ${broken === i ? 'is-bad' : ''}`;
    });

    if (message) {
      status.textContent = message;
      status.className = `status ${tone}`;
    } else if (broken < 0) {
      status.textContent = 'Every block\'s "previous" matches the hash of the block before it. The chain is intact.';
      status.className = 'status is-good';
    } else {
      status.textContent = `Block ${broken}'s hash changed, so block ${broken + 1}'s "previous" no longer matches it. Everything from block ${broken + 1} onwards is cut off.`;
      status.className = 'status is-bad';
    }
  }

  async function reset() {
    chain.forEach((entry, i) => {
      entry.data = ORIGINAL[i];
      cards[i].querySelector('[data-data]').value = ORIGINAL[i];
    });
    await relink();
    render();
  }

  cards.forEach((card, i) => {
    card.querySelector('[data-data]').addEventListener('input', async (event) => {
      chain[i].data = event.target.value;
      chain[i].hash = await hashOf(chain[i]); // its own hash changes; later blocks don't know yet
      render();
    });
  });

  root.querySelector('[data-repair]').addEventListener('click', async () => {
    await relink();
    render('Repaired in an instant: every later hash was simply recomputed. If that were all it took, rewriting history would be easy. Bitcoin\'s answer is to make each hash slow and costly to find. That is mining, next.');
  });
  root.querySelector('[data-reset]').addEventListener('click', reset);

  await reset();
}

// ── Start ──────────────────────────────────────────────────────────────────

export function init(section) {
  const svg = mountStage(section, SVG);
  driveScene(section, buildTimeline(svg));

  const demo = section.querySelector('[data-demo]');
  if (!hasCrypto()) {
    demo.innerHTML = '<p class="status">This demo needs a secure page (https or localhost) to compute hashes.</p>';
    return;
  }
  initDemo(demo).catch((error) => console.error('Chain demo failed', error));
}
