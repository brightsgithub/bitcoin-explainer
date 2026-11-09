// Scene 7 — Mining and proof of work: miners searching for a valid hash,
// shown as a nonce counter.
//
// Two parts:
//   1. A scroll-driven picture with five steps (one per caption in index.html).
//   2. A "try it" demo that really mines a toy block in the browser.
//
// The nonce counter in the picture is real: the hashes shown are the true
// SHA-256 of the toy block below with each nonce, and nonce 1174 really is
// the first whose hash starts with three zeros.
//
// SIMPLIFIED: "starts with a run of zeros" stands in for the real rule, which
// is "the hash, read as a number, must be below a target". More zeros means a
// lower target. The picture asks for 3 zeros; Bitcoin currently needs about 19.
// SIMPLIFIED: real miners hash an 80-byte block header twice with SHA-256, on
// purpose-built chips, not text in a browser.
// SIMPLIFIED: the difficulty is retuned every 2,016 blocks (about two weeks)
// so that blocks keep arriving roughly ten minutes apart on average.
// SIMPLIFIED: in the last step the cheat "falls behind" because they are
// assumed to have less computing power than everyone else combined. Someone
// controlling most of the world's mining power could catch up (a "51% attack").

import { mountStage, driveScene, hasCrypto, sha256Hex } from '../lib/helpers.js';

const TOY_BLOCK = 'Block 104|prev 00d92c|Alice to Bob 0.3|nonce ';
const ZEROS = '000';
const SLOW_GUESSES = 12; // how many guesses step 2 walks through one by one
const SEARCH_LIMIT = 20000;

// ── The scroll-driven picture (viewBox is 640 × 480) ───────────────────────

const raceBlock = (cls, i, y, extra = '') =>
  `<rect class="${cls} card ${extra}" x="${34 + i * 58}" y="${y}" width="44" height="44" rx="7"/>`;

const SVG = `
<svg viewBox="0 0 640 480" role="img"
     aria-label="A block is hashed with one nonce after another until the hash starts with three zeros. Other nodes verify the result with a single hash. A cheat rewriting old blocks falls further behind the honest chain.">

  <g class="g-main">
    <!-- The block being mined -->
    <rect class="card" x="130" y="30" width="340" height="222" rx="14"/>
    <text class="bold" x="152" y="64">Block 104</text>
    <path class="hair" d="M152 84 H448 M152 100 H360"/>
    <text class="t-muted" x="152" y="142" style="font-size:17px">nonce</text>
    <text class="g-nonce mono bold end" x="448" y="144" style="font-size:28px">0</text>
    <path class="hair" d="M152 160 H448"/>
    <text class="t-muted" x="152" y="194" style="font-size:17px">hash</text>
    <text class="g-hash mono end" x="448" y="196" style="font-size:21px">…</text>
    <text class="g-verdict bold end" x="448" y="232" style="font-size:17px"></text>
    <text class="g-rule t-muted mid" x="300" y="284">rule: the hash must start with ${ZEROS}</text>

    <!-- The reward -->
    <g class="g-reward">
      <circle class="coin__disc" cx="550" cy="130" r="30"/>
      <circle class="coin__ring" cx="550" cy="130" r="21"/>
      <text class="t-muted mid" x="550" y="186" style="font-size:17px">reward</text>
    </g>

    <!-- Other nodes checking the answer -->
    ${[180, 300, 420].map((x) => `
      <path class="g-wire outline s-muted" pathLength="1" d="M300 296 L${x} 348"/>
      <g class="g-checker">
        <circle class="card" cx="${x}" cy="372" r="24"/>
        <text class="t-teal bold mid" x="${x}" y="380">✓</text>
      </g>`).join('')}
    <text class="g-instant t-teal bold mid" x="300" y="432">one hash each to check</text>
  </g>

  <!-- Step 5: the race a cheat cannot win -->
  <g class="g-race">
    <text class="t-teal bold" x="34" y="128">the honest chain keeps growing</text>
    ${[0, 1, 2, 3].map((i) => raceBlock('g-honest-old', i, 146, 's-teal')).join('')}
    ${[4, 5, 6, 7, 8, 9].map((i) => raceBlock('g-honest-new', i, 146, 's-teal')).join('')}
    <text class="t-red bold" x="34" y="282">the cheat redoes the work, block by block</text>
    ${raceBlock('g-cheat-old', 0, 300)}
    ${[1, 2, 3].map((i) => raceBlock('g-cheat-new', i, 300, 's-red')).join('')}
    <text class="g-behind t-red bold" x="34" y="396">and falls further behind</text>
  </g>
</svg>`;

function buildTimeline(svg, guesses) {
  const q = gsap.utils.selector(svg);
  const nonceEl = q('.g-nonce')[0];
  const hashEl = q('.g-hash')[0];
  const verdictEl = q('.g-verdict')[0];

  // `slow` walks the first few guesses one at a time (step 2);
  // `fast` races through the rest to the winning nonce (step 3).
  const dial = { slow: 0, fast: 0 };

  const render = () => {
    const winner = guesses.winner;
    const nonce = dial.fast > 0
      ? Math.round(SLOW_GUESSES + dial.fast * (winner - SLOW_GUESSES))
      : Math.round(dial.slow);
    const hash = guesses.hashes[nonce];
    const valid = Boolean(hash) && hash.startsWith(ZEROS);

    nonceEl.textContent = nonce.toLocaleString('en-US');
    hashEl.textContent = hash ? `${hash.slice(0, 12)}…` : '…';
    hashEl.setAttribute('class', `g-hash mono end ${valid ? 't-teal' : 't-red'}`);
    verdictEl.textContent = valid ? `✓ starts with ${ZEROS}` : `✗ doesn't start with ${ZEROS}`;
    verdictEl.setAttribute('class', `g-verdict bold end ${valid ? 't-teal' : 't-red'}`);
  };
  guesses.onReady = render;

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' }, onUpdate: render });

  // Starting picture: a block whose first hash doesn't pass.
  gsap.set(q('.g-rule, .g-verdict, .g-instant, .g-checker, .g-race, .g-behind'), { opacity: 0 });
  gsap.set(q('.g-reward'), { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' });
  gsap.set(q('.g-checker'), { scale: 0.5, transformOrigin: '50% 50%' });
  gsap.set(q('.g-wire'), { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set(q('.g-honest-new, .g-cheat-new'), { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' });
  render();

  // Step 1 (0 → 1): the rule, and a first hash that fails it.
  tl.to(q('.g-rule'), { opacity: 1, duration: 0.25 }, 0.15)
    .to(q('.g-verdict'), { opacity: 1, duration: 0.25 }, 0.55);

  // Step 2 (1 → 2): guess, check, guess again.
  tl.to(dial, { slow: SLOW_GUESSES, duration: 0.8, ease: 'none' }, 1.1);

  // Step 3 (2 → 3): the search speeds up until a guess finally works.
  tl.to(dial, { fast: 1, duration: 0.7, ease: 'power2.in' }, 2.05)
    .to(q('.g-reward'), { opacity: 1, scale: 1, duration: 0.2, ease: 'back.out(2)' }, 2.78);

  // Step 4 (3 → 4): everyone else checks it with a single hash.
  tl.to(q('.g-wire'), { strokeDashoffset: 0, duration: 0.2, stagger: 0.08 }, 3.1)
    .to(q('.g-checker'), { opacity: 1, scale: 1, duration: 0.2, stagger: 0.08, ease: 'back.out(2)' }, 3.3)
    .to(q('.g-instant'), { opacity: 1, duration: 0.2 }, 3.7);

  // Step 5 (4 → 5): six honest blocks arrive while the cheat redoes three.
  tl.to(q('.g-main'), { opacity: 0, duration: 0.18 }, 4)
    .to(q('.g-race'), { opacity: 1, duration: 0.18 }, 4.15)
    .to(q('.g-honest-new'), { opacity: 1, scale: 1, duration: 0.1, stagger: 0.09 }, 4.32)
    .to(q('.g-cheat-new'), { opacity: 1, scale: 1, duration: 0.1, stagger: 0.2 }, 4.4)
    .to(q('.g-behind'), { opacity: 1, duration: 0.12 }, 4.86);

  return tl;
}

// Work out the real hash for every nonce up to the first valid one.
async function findGuesses(guesses) {
  const BATCH = 250;
  for (let start = 0; start < SEARCH_LIMIT && guesses.winner === SEARCH_LIMIT; start += BATCH) {
    const batch = await Promise.all(
      Array.from({ length: BATCH }, (_, i) => sha256Hex(TOY_BLOCK + (start + i)))
    );
    batch.forEach((hash, i) => {
      guesses.hashes[start + i] = hash;
      if (guesses.winner === SEARCH_LIMIT && hash.startsWith(ZEROS)) guesses.winner = start + i;
    });
  }
  guesses.onReady?.();
}

// ── "Try it": mine a block ─────────────────────────────────────────────────

const DEMO = `
<label class="field">
  <span>Block contents</span>
  <input type="text" value="Alice pays Bob 0.3" autocomplete="off" spellcheck="false" data-contents>
</label>
<div class="controls">
  <label class="field field--inline">
    <span>Zeros required</span>
    <select class="select" data-zeros>
      <option value="1">1 (easy)</option>
      <option value="2">2</option>
      <option value="3" selected>3</option>
      <option value="4">4 (hard)</option>
    </select>
  </label>
  <button class="btn" type="button" data-mine>Start mining</button>
</div>
<div class="stats">
  <div><span class="stat__num" data-nonce>0</span><span class="stat__label">nonce being tried</span></div>
  <div><span class="stat__num" data-time>0.0 s</span><span class="stat__label">time spent</span></div>
</div>
<p class="readout" data-readout>
  <span class="readout__label">Hash of contents + nonce</span>
  <span class="readout__value" data-hash>…</span>
</p>
<p class="status" aria-live="polite">Press the button to begin.</p>
<p class="note">Bitcoin's real rule currently needs around 19 zeros. Each extra zero is about 16 times harder, which is why it takes the whole world's miners ten minutes.</p>`;

function initDemo(root) {
  root.innerHTML = DEMO;
  const contents = root.querySelector('[data-contents]');
  const zerosSelect = root.querySelector('[data-zeros]');
  const button = root.querySelector('[data-mine]');
  const nonceEl = root.querySelector('[data-nonce]');
  const timeEl = root.querySelector('[data-time]');
  const hashEl = root.querySelector('[data-hash]');
  const readout = root.querySelector('[data-readout]');
  const status = root.querySelector('.status');

  let job = 0; // increases whenever mining starts or stops, cancelling older jobs

  const show = (nonce, hash, startedAt, tone) => {
    nonceEl.textContent = nonce.toLocaleString('en-US');
    timeEl.textContent = `${((performance.now() - startedAt) / 1000).toFixed(1)} s`;
    hashEl.textContent = hash;
    readout.className = `readout ${tone}`;
  };

  function stop(message) {
    job += 1;
    button.textContent = 'Start mining';
    if (message) {
      status.textContent = message;
      status.className = 'status';
    }
  }

  async function mine() {
    const mine_ = ++job;
    const text = contents.value;
    const zeros = '0'.repeat(Number(zerosSelect.value));
    const startedAt = performance.now();
    const BATCH = 200;
    button.textContent = 'Stop';
    status.textContent = `Searching for a hash that starts with ${zeros} …`;
    status.className = 'status';

    for (let start = 0; mine_ === job; start += BATCH) {
      const batch = await Promise.all(
        Array.from({ length: BATCH }, (_, i) => sha256Hex(`${text}|${start + i}`))
      );
      if (mine_ !== job) return;

      const hit = batch.findIndex((hash) => hash.startsWith(zeros));
      if (hit >= 0) {
        const nonce = start + hit;
        show(nonce, batch[hit], startedAt, 'is-good');
        stop();
        status.textContent = `Found it. Nonce ${nonce.toLocaleString('en-US')} gives a hash starting with ${zeros}, after ${(nonce + 1).toLocaleString('en-US')} guesses. Change one letter of the contents and all that work must be done again.`;
        status.className = 'status is-good';
        return;
      }
      show(start + BATCH - 1, batch[BATCH - 1], startedAt, 'is-bad');
      await new Promise((resolve) => setTimeout(resolve)); // let the page redraw
    }
  }

  button.addEventListener('click', () => (button.textContent === 'Stop' ? stop('Stopped.') : mine()));
  const edited = () => stop('The block changed, so any earlier answer no longer fits. Mine it again.');
  contents.addEventListener('input', edited);
  zerosSelect.addEventListener('change', edited);
}

// ── Start ──────────────────────────────────────────────────────────────────

export function init(section) {
  const svg = mountStage(section, SVG);
  const guesses = { hashes: [], winner: SEARCH_LIMIT, onReady: null };
  driveScene(section, buildTimeline(svg, guesses));

  const demo = section.querySelector('[data-demo]');
  if (!hasCrypto()) {
    demo.innerHTML = '<p class="status">This scene needs a secure page (https or localhost) to compute hashes.</p>';
    return;
  }
  findGuesses(guesses).catch((error) => console.error('Mining picture failed', error));
  initDemo(demo);
}
