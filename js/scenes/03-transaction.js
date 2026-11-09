// Scene 3 — A transaction: coins moving from one wallet to another, signed.
//
// Two parts:
//   1. A scroll-driven picture with six steps (one per caption in index.html).
//   2. A "try it" demo: edit a signed message and watch the signature fail.
//
// SIMPLIFIED: a "coin" here stands for what Bitcoin calls an unspent
// transaction output (UTXO). Wallets don't hold coins; they hold the keys
// that can spend outputs recorded on the shared ledger.
// SIMPLIFIED: real transactions name addresses, not people. "Bob" stands for
// an address Bob controls, and the change goes to a fresh address of Alice's.
// SIMPLIFIED: the fee is drawn as a line on the slip. In a real transaction
// it isn't written anywhere: it is whatever is left over (inputs − outputs),
// and the miner who includes the transaction collects it.
// SIMPLIFIED: 0.01 BTC is a round number for readability. Real fees are
// usually far smaller.

import { mountStage, driveScene } from '../lib/helpers.js';

// ── Drawing helpers ────────────────────────────────────────────────────────

const coin = (cls, r, label, size) => `
  <g class="${cls}">
    <circle class="coin__disc" r="${r}"/>
    <circle class="coin__dash" r="${r}"/>
    <text class="t-coin-label mono bold mid t-ink" y="${size * 0.35}" style="font-size:${size}px">${label}</text>
  </g>`;

const row = (y, tag, who, amount, extra = '') => `
  <g class="t-row ${extra}">
    <text class="t-muted" x="152" y="${y}">${tag}</text>
    <text x="212" y="${y}">${who}</text>
    <text class="mono end" x="488" y="${y}">${amount}</text>
  </g>`;

// ── The scroll-driven picture (viewBox is 640 × 480) ───────────────────────

const SVG = `
<svg viewBox="0 0 640 480" role="img"
     aria-label="Alice writes a transaction sending 0.3 bitcoin to Bob, signs it with her private key, and broadcasts it. Her 0.5 coin is split into 0.3 for Bob, 0.19 change and a 0.01 fee.">

  <!-- Wallets -->
  <g class="t-wallet">
    <rect class="card" x="30" y="36" width="170" height="150" rx="14"/>
    <text class="bold" x="48" y="68">Alice</text>
  </g>
  <g class="t-wallet">
    <rect class="card" x="440" y="36" width="170" height="150" rx="14"/>
    <text class="bold" x="458" y="68">Bob</text>
  </g>

  <!-- Step 1: what Alice wants to do -->
  <g class="t-intent">
    <path class="t-intent-line outline s-muted" pathLength="1" d="M212 100 Q320 46 428 100"/>
    <path class="t-intent-head outline s-muted" d="M413 84 L428 100 L407 104"/>
    <text class="t-intent-head mid" x="320" y="58">send 0.3</text>
  </g>

  <!-- Step 2: the transaction slip -->
  <g class="t-slip">
    <rect class="card" x="130" y="210" width="380" height="232" rx="12"/>
    <text class="small t-muted" x="152" y="243">TRANSACTION</text>
    <g class="t-pill">
      <rect class="outline s-orange" x="366" y="223" width="124" height="28" rx="14"/>
      <text class="t-orange mid" x="428" y="242" style="font-size:15px">unconfirmed</text>
    </g>
    ${row(280, 'From', "Alice's coin", '0.50')}
    ${row(313, 'To', 'Bob', '0.30')}
    ${row(346, 'To', 'Alice (change)', '0.19')}
    ${row(379, 'Fee', 'for the miner', '0.01')}
    <path class="hair" d="M152 394 H488"/>
    <text class="t-signed t-muted" x="152" y="424">Signed</text>
    <path class="t-signature outline s-teal" pathLength="1"
          d="M228 422 c8 -24 18 -24 20 -2 s14 20 20 0 s12 -20 20 -2 s14 16 24 -2 s16 -8 44 -2"/>
    <g class="t-valid">
      <rect class="outline s-teal" x="396" y="404" width="94" height="30" rx="15"/>
      <text class="t-teal bold mid" x="443" y="425" style="font-size:16px">✓ valid</text>
    </g>
    <rect class="t-scan" x="132" y="212" width="376" height="5" rx="2" fill="#3DD6B0"/>
  </g>

  <!-- Step 6: the broadcast -->
  <circle class="t-ring outline s-orange" cx="320" cy="326" r="60"/>
  <circle class="t-ring outline s-orange" cx="320" cy="326" r="60"/>
  <circle class="t-ring outline s-orange" cx="320" cy="326" r="60"/>

  <!-- Coins -->
  ${coin('t-coin t-coin-in', 30, '0.5', 19)}
  ${coin('t-coin t-coin-bob', 25, '0.30', 15)}
  ${coin('t-coin t-coin-change', 22, '0.19', 14)}
  <text class="t-pending t-muted mid" x="115" y="174" style="font-size:16px">pending</text>
  <text class="t-pending t-muted mid" x="525" y="174" style="font-size:16px">pending</text>

  <!-- Alice's private key (used as the pen in step 3) -->
  <g class="t-key">
    <circle class="outline" r="8"/>
    <path class="outline" d="M8 0 H30 M20 0 v7 M27 0 v7"/>
  </g>
</svg>`;

function buildTimeline(svg) {
  const q = gsap.utils.selector(svg);
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });

  // Where things rest.
  const IN_ALICE = { x: 115, y: 122 };  // inside Alice's wallet
  const IN_BOB = { x: 525, y: 122 };    // inside Bob's wallet
  const KEY_HOME = { x: 150, y: 61 };   // top corner of Alice's wallet
  const SPLIT = { x: 320, y: 150 };     // between the wallets, above the slip

  // Starting picture: two wallets, Alice's key, nothing else yet.
  gsap.set(q('.t-coin'), { transformOrigin: '50% 50%' });
  gsap.set(q('.t-coin-in'), { ...IN_ALICE, scale: 0 });
  gsap.set(q('.t-coin-bob, .t-coin-change'), { ...SPLIT, opacity: 0 });
  gsap.set(q('.t-key'), { ...KEY_HOME });
  gsap.set(q('.t-intent-line, .t-signature'), { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set(q('.coin__dash'), { opacity: 0 });
  gsap.set(q('.t-intent-head, .t-row, .t-signed, .t-pill, .t-scan, .t-pending, .t-ring'), { opacity: 0 });
  gsap.set(q('.t-slip'), { opacity: 0, y: 40 });
  gsap.set(q('.t-valid'), { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' });
  gsap.set(q('.t-ring'), { transformOrigin: '50% 50%' });

  // Step 1 (0 → 1): Alice has a 0.5 coin and wants to send 0.3.
  tl.to(q('.t-coin-in'), { scale: 1, duration: 0.3, ease: 'back.out(2)' }, 0.1)
    .to(q('.t-intent-line'), { strokeDashoffset: 0, duration: 0.4 }, 0.4)
    .to(q('.t-intent-head'), { opacity: 1, duration: 0.2 }, 0.75);

  // Step 2 (1 → 2): she writes the transaction, line by line.
  tl.to(q('.t-intent'), { opacity: 0, duration: 0.15 }, 1)
    .to(q('.t-slip'), { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 1.1)
    .to(q('.t-row'), { opacity: 1, duration: 0.2, stagger: 0.12 }, 1.4);

  // Step 3 (2 → 3): the private key signs, then goes back in the wallet.
  tl.to(q('.t-key'), { x: 218, y: 398, duration: 0.3 }, 2.05)
    .to(q('.t-signed'), { opacity: 1, duration: 0.15 }, 2.25)
    .to(q('.t-signature'), { strokeDashoffset: 0, duration: 0.4, ease: 'none' }, 2.35)
    .to(q('.t-key'), { x: 350, duration: 0.4, ease: 'none' }, 2.35)
    .to(q('.t-key'), { ...KEY_HOME, duration: 0.22 }, 2.76);

  // Step 4 (3 → 4): anyone can verify the signature.
  tl.to(q('.t-scan'), { opacity: 0.7, duration: 0.05 }, 3.05)
    .to(q('.t-scan'), { y: 222, duration: 0.5, ease: 'none' }, 3.05)
    .to(q('.t-scan'), { opacity: 0, duration: 0.05 }, 3.55)
    .to(q('.t-valid'), { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2)' }, 3.6);

  // Step 5 (4 → 5): the 0.5 coin is used up and split into new coins.
  // (The 0.01 fee is the part that doesn't come back out.)
  tl.to(q('.t-coin-in'), { ...SPLIT, duration: 0.35 }, 4.05)
    .to(q('.t-coin-bob, .t-coin-change'), { opacity: 1, duration: 0.05 }, 4.4)
    .to(q('.t-coin-in'), { opacity: 0, duration: 0.08 }, 4.42)
    .to(q('.t-coin-bob'), { x: 392, duration: 0.3, ease: 'power2.out' }, 4.42)
    .to(q('.t-coin-change'), { x: 252, duration: 0.3, ease: 'power2.out' }, 4.42);

  // Step 6 (5 → 6): broadcast. The new coins show in each wallet as
  // pending (dashed outlines) until the transaction is confirmed.
  tl.to(q('.t-pill'), { opacity: 1, duration: 0.15 }, 5.05);
  q('.t-ring').forEach((ring, i) => {
    const at = 5.12 + i * 0.14;
    tl.to(ring, { opacity: 0.8, duration: 0.04 }, at)
      .to(ring, { scale: 4.5, opacity: 0, duration: 0.45, ease: 'power1.out' }, at + 0.04);
  });
  tl.to(q('.t-coin-bob'), { ...IN_BOB, duration: 0.45 }, 5.3)
    .to(q('.t-coin-change'), { ...IN_ALICE, duration: 0.45 }, 5.3)
    .to(q('.t-coin-bob .coin__disc, .t-coin-change .coin__disc'), { fillOpacity: 0.12, duration: 0.3 }, 5.45)
    .to(q('.t-coin-bob .coin__dash, .t-coin-change .coin__dash'), { opacity: 1, duration: 0.3 }, 5.45)
    .to(q('.t-coin-bob .t-coin-label, .t-coin-change .t-coin-label'), { fill: '#F7931A', duration: 0.3 }, 5.45)
    .to(q('.t-pending'), { opacity: 1, duration: 0.15 }, 5.8);

  return tl;
}

// ── "Try it": change a signed transaction ──────────────────────────────────
//
// This uses real digital signatures from the browser's built-in Web Crypto.
// SIMPLIFIED: browsers offer ECDSA on the P-256 curve; Bitcoin uses ECDSA
// (and Schnorr) on a different curve, secp256k1. The behaviour shown is the
// same: change one character of the message and the signature stops matching.
// SIMPLIFIED: a real transaction is signed as structured binary data, not as
// an English sentence.

const DEMO = `
<div class="sig">
  <label class="sig__message">
    <span>Alice pays Bob</span>
    <input type="text" inputmode="decimal" value="0.3" maxlength="10" autocomplete="off" aria-label="Amount in bitcoin">
    <span>BTC</span>
  </label>
  <p class="sig__row">Alice's signature <span class="mono" data-signature>…</span></p>
  <p class="sig__verdict" role="status" data-verdict>Checking…</p>
  <div class="controls">
    <button class="btn" type="button" data-resign>Sign again as Alice</button>
  </div>
  <p class="status" data-note></p>
</div>`;

async function initDemo(root) {
  if (!window.crypto?.subtle) {
    root.innerHTML = '<p class="status">This demo needs a secure page (https or localhost) to use the browser\'s signature tools.</p>';
    return;
  }
  root.innerHTML = DEMO;

  const input = root.querySelector('input');
  const signatureEl = root.querySelector('[data-signature]');
  const verdict = root.querySelector('[data-verdict]');
  const note = root.querySelector('[data-note]');

  const ALGORITHM = { name: 'ECDSA', hash: 'SHA-256' };
  const encode = (text) => new TextEncoder().encode(text);
  const message = () => `Alice pays Bob ${input.value.trim()} BTC`;
  const toHex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

  // Alice's key pair, made fresh on each visit. The private key signs;
  // the public key is all anyone needs to check a signature.
  const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify']);
  let signature;
  let signedAmount;

  async function sign() {
    signature = await crypto.subtle.sign(ALGORITHM, keys.privateKey, encode(message()));
    signedAmount = input.value.trim();
    signatureEl.textContent = `${toHex(signature).slice(0, 40)}…`;
    await check();
  }

  async function check() {
    const valid = await crypto.subtle.verify(ALGORITHM, keys.publicKey, signature, encode(message()));
    verdict.textContent = valid ? '✓ Signature valid' : '✗ Signature invalid';
    verdict.className = `sig__verdict ${valid ? 'is-good' : 'is-bad'}`;
    note.textContent = valid
      ? 'The message matches what Alice signed. The network would accept it.'
      : `Alice signed "${signedAmount}", not "${input.value.trim()}". The network would reject this. Only someone holding Alice's private key can make a new signature that fits.`;
  }

  input.addEventListener('input', check);
  root.querySelector('[data-resign]').addEventListener('click', sign);
  await sign();
}

// ── Start ──────────────────────────────────────────────────────────────────

export function initTransaction() {
  const section = document.querySelector('#transaction');
  const svg = mountStage(section.querySelector('.scene__body'), SVG);
  driveScene(section, buildTimeline(svg));
  initDemo(section.querySelector('[data-demo]')).catch((error) => console.error('Signature demo failed', error));
}
