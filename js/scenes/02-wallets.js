// Scene 2 — Wallets and keys: a private key that signs, a public address.
//
// Two parts:
//   1. A scroll-driven picture with five steps (one per caption in index.html).
//   2. A "try it" demo that generates a real key pair in the browser.
//
// SIMPLIFIED: the key and address strings in the picture are made-up
// examples, shortened with "…". A real private key is 64 hexadecimal
// characters (256 bits).
// SIMPLIFIED: modern wallets derive many key pairs from one master secret
// (the 12 or 24 "seed words") and use a fresh address for each payment.
// The picture shows a single key pair.

import { mountStage, driveScene, hasCrypto, sha256Hex, toHex } from '../lib/helpers.js';

const PRIVATE = '5f3a…c21e';
const PUBLIC = '02b4…9d07';
const ADDRESS = 'bc1q…k7x';

// ── Drawing helpers ────────────────────────────────────────────────────────

const box = (cls, x, title, value) => `
  <g class="w-box ${cls}">
    <rect class="card" x="${x}" y="120" width="170" height="110" rx="10" style="fill:var(--bg)"/>
    <text class="small t-muted mid" x="${x + 85}" y="150">${title}</text>
    <text class="w-value mono mid" x="${x + 85}" y="200" style="font-size:21px">${value}</text>
  </g>`;

const arrow = (cls, x) => `
  <path class="${cls} outline s-muted" d="M${x} 175 h18 m-7 -7 l7 7 l-7 7"/>`;

const person = (cls, x, name) => `
  <g class="avatar ${cls}" transform="translate(${x},390)">
    <circle r="30"/>
    <text class="avatar__initial" y="9">${name[0]}</text>
    <text class="avatar__name" y="56">${name}</text>
  </g>`;

const addressSlip = (cls) => `
  <g class="${cls}">
    <rect class="card s-teal" x="-58" y="-19" width="116" height="38" rx="8"/>
    <text class="mono mid" y="6" style="font-size:17px">${ADDRESS}</text>
  </g>`;

// ── The scroll-driven picture (viewBox is 640 × 480) ───────────────────────

const SVG = `
<svg viewBox="0 0 640 480" role="img"
     aria-label="A wallet holds a private key. A public key and then an address are worked out from it, one way only. The address is shared; the private key is kept secret. The coins themselves are entries on the shared ledger.">

  <rect class="card" x="15" y="56" width="610" height="236" rx="16"/>
  <text class="bold" x="36" y="92">Alice's wallet</text>

  ${box('w-private', 35, 'PRIVATE KEY', PRIVATE)}
  ${box('w-public', 235, 'PUBLIC KEY', PUBLIC)}
  ${box('w-address', 435, 'ADDRESS', ADDRESS)}
  ${arrow('w-arrow', 209)}
  ${arrow('w-arrow', 409)}

  <!-- Step 2: no way back -->
  <path class="w-back outline s-red" pathLength="1" d="M520 236 Q320 318 120 236"/>
  <text class="w-back-label t-red bold mid" x="320" y="270">✗ no way back</text>

  <!-- Steps 3–4: what to share, what to guard -->
  <rect class="w-guard outline s-red" x="28" y="113" width="184" height="124" rx="14" stroke-dasharray="6 6"/>
  <text class="w-tag-secret t-red bold mid" x="120" y="268">keep secret</text>
  <text class="w-tag-share t-teal bold mid" x="520" y="268">safe to share</text>

  ${person('w-person', 110, 'Bob')}
  ${person('w-person', 530, 'Carol')}
  ${addressSlip('w-share w-share-a')}
  ${addressSlip('w-share w-share-b')}

  <!-- Step 5: the coins live on the ledger, not in the wallet -->
  <g class="w-ledger">
    <rect class="card" x="130" y="330" width="380" height="120" rx="12"/>
    <text class="small t-muted" x="152" y="362">SHARED LEDGER</text>
    <path class="hair" d="M152 376 H488"/>
    <text class="mono" x="152" y="414">${ADDRESS}</text>
    <text class="mono t-orange bold end" x="488" y="414">0.5 BTC</text>
  </g>
  <path class="w-link outline s-teal" pathLength="1" d="M520 232 C520 300 420 300 330 396"/>
</svg>`;

// A stand-in "random number being picked": the digits tumble, then settle.
function tumble(progress) {
  if (progress >= 1) return PRIVATE;
  const HEX = '0123456789abcdef';
  let seed = Math.floor(progress * 24) + 7;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return HEX[seed % 16];
  };
  return `${next()}${next()}${next()}${next()}…${next()}${next()}${next()}${next()}`;
}

function buildTimeline(svg) {
  const q = gsap.utils.selector(svg);
  const privateValue = q('.w-private .w-value')[0];
  const dial = { progress: 0 };
  const render = () => { privateValue.textContent = tumble(dial.progress); };

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' }, onUpdate: render });

  const ADDRESS_BOX = { x: 520, y: 175 };

  // Starting picture: a wallet with an empty slot for the private key.
  gsap.set(q('.w-public, .w-address, .w-arrow, .w-back-label, .w-guard, .w-tag-secret, .w-tag-share, .w-person, .w-share'), { opacity: 0 });
  gsap.set(q('.w-back, .w-link'), { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set(q('.w-share'), { ...ADDRESS_BOX });
  gsap.set(q('.w-ledger'), { opacity: 0, y: 24 });
  render();

  // Step 1 (0 → 1): the wallet picks a huge random number.
  tl.to(dial, { progress: 1, duration: 0.7, ease: 'none' }, 0.1);

  // Step 2 (1 → 2): public key and address follow from it. One way only.
  tl.to(q('.w-arrow')[0], { opacity: 1, duration: 0.1 }, 1.05)
    .to(q('.w-public'), { opacity: 1, duration: 0.2 }, 1.15)
    .to(q('.w-arrow')[1], { opacity: 1, duration: 0.1 }, 1.4)
    .to(q('.w-address'), { opacity: 1, duration: 0.2 }, 1.5)
    .to(q('.w-back'), { strokeDashoffset: 0, duration: 0.2 }, 1.72)
    .to(q('.w-back-label'), { opacity: 1, duration: 0.1 }, 1.88);

  // Step 3 (2 → 3): the address is handed out freely.
  tl.to(q('.w-back, .w-back-label'), { opacity: 0, duration: 0.12 }, 2)
    .to(q('.w-tag-share'), { opacity: 1, duration: 0.15 }, 2.1)
    .to(q('.w-person'), { opacity: 1, duration: 0.15 }, 2.1)
    .to(q('.w-share'), { opacity: 1, duration: 0.05 }, 2.28)
    .to(q('.w-share-a'), { x: 228, y: 390, duration: 0.45 }, 2.3)
    .to(q('.w-share-b'), { x: 412, y: 390, duration: 0.45 }, 2.4);

  // Step 4 (3 → 4): the private key is guarded.
  tl.to(q('.w-guard'), { opacity: 1, duration: 0.2 }, 3.1)
    .to(q('.w-tag-secret'), { opacity: 1, duration: 0.2 }, 3.25);

  // Step 5 (4 → 5): the coins are on the ledger; the wallet only holds keys.
  tl.to(q('.w-person, .w-share'), { opacity: 0, duration: 0.2 }, 4)
    .to(q('.w-ledger'), { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 4.2)
    .to(q('.w-link'), { strokeDashoffset: 0, duration: 0.3 }, 4.5);

  return tl;
}

// ── "Try it": make a wallet ────────────────────────────────────────────────
//
// Real keys from the browser's built-in Web Crypto.
// SIMPLIFIED: browsers offer the P-256 curve; Bitcoin uses a different
// curve, secp256k1. The idea is identical: a random private number, and a
// public key computed from it that cannot be reversed.
// SIMPLIFIED: a real address is the public key hashed twice (SHA-256, then
// RIPEMD-160) and written in a typo-resistant alphabet, giving the familiar
// "bc1q…" or "1…" look. Here it is the first 20 bytes of one SHA-256, in hex.

const DEMO = `
<div class="controls" style="margin-top:0">
  <button class="btn" type="button" data-make>Make a new wallet</button>
</div>
<p class="readout is-secret">
  <span class="readout__label">Private key: a random number. Keep it secret.</span>
  <span class="readout__value" data-private>…</span>
</p>
<p class="readout">
  <span class="readout__label">Public key: worked out from the private key.</span>
  <span class="readout__value" data-public>…</span>
</p>
<p class="readout is-public">
  <span class="readout__label">Address: a fingerprint of the public key. Share it freely.</span>
  <span class="readout__value" data-address>…</span>
</p>
<p class="note">Made in your browser just now and sent nowhere. It is a demonstration only: never use these for real money.</p>`;

function initDemo(root) {
  if (!hasCrypto()) {
    root.innerHTML = '<p class="status">This demo needs a secure page (https or localhost).</p>';
    return;
  }
  root.innerHTML = DEMO;

  // Web Crypto hands keys back in "base64url"; turn that into raw bytes.
  const bytesFrom = (base64url) =>
    Uint8Array.from(atob(base64url.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

  async function make() {
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
    const x = bytesFrom(jwk.x);
    const y = bytesFrom(jwk.y);

    // "Compressed" public key, the same form Bitcoin uses: one byte saying
    // whether y is even or odd, followed by x.
    const publicKey = new Uint8Array([y[y.length - 1] % 2 === 0 ? 2 : 3, ...x]);

    root.querySelector('[data-private]').textContent = toHex(bytesFrom(jwk.d));
    root.querySelector('[data-public]').textContent = toHex(publicKey);
    root.querySelector('[data-address]').textContent = (await sha256Hex(publicKey)).slice(0, 40);
  }

  root.querySelector('[data-make]').addEventListener('click', make);
  return make();
}

// ── Start ──────────────────────────────────────────────────────────────────

export function init(section) {
  const svg = mountStage(section, SVG);
  driveScene(section, buildTimeline(svg));
  initDemo(section.querySelector('[data-demo]'))?.catch((error) => console.error('Wallet demo failed', error));
}
