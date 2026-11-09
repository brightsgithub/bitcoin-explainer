// Scene 5 — Hashing: digital fingerprints.
//
// Two parts:
//   1. A scroll-driven picture with four steps (one per caption in index.html).
//   2. A "try it" box: type text and watch its SHA-256 hash change.
//
// Every hash on this scene is the real SHA-256, computed by the browser.
//
// SIMPLIFIED: "no way back" means no known method better than guessing
// inputs until one matches. For short or predictable text, guessing can
// succeed, which is why hashes protect unpredictable data best.
// SIMPLIFIED: Bitcoin often applies SHA-256 twice in a row. Once is shown.

import { mountStage, driveScene, hasCrypto, sha256Hex } from '../lib/helpers.js';

const TEXT_A = 'Hello';
const TEXT_B = 'Hellp';

// 64 characters, shown as four lines of 16.
const hashLines = (cls, hash, colour) =>
  [0, 1, 2, 3]
    .map((i) => `<text class="${cls} mono mid ${colour}" x="517" y="${205 + i * 30}" style="font-size:19px">${hash.slice(i * 16, i * 16 + 16)}</text>`)
    .join('');

// ── The scroll-driven picture (viewBox is 640 × 480) ───────────────────────

const svgFor = (hashA, hashB) => `
<svg viewBox="0 0 640 480" role="img"
     aria-label="The word Hello goes into a hash function and a 64-character fingerprint comes out. Changing one letter gives a completely different fingerprint. The fingerprint cannot be turned back into the word.">

  <!-- Text in -->
  <text class="small t-muted mid" x="105" y="180">TEXT IN</text>
  <rect class="card" x="20" y="195" width="170" height="90" rx="10"/>
  <text class="h-in-a bold mid" x="105" y="250" style="font-size:28px">${TEXT_A}</text>
  <text class="h-in-b bold mid" x="105" y="250" style="font-size:28px">Hell<tspan class="t-orange">p</tspan></text>

  <!-- The machine -->
  <path class="outline s-muted" d="M196 240 h30 m-7 -7 l7 7 l-7 7"/>
  <rect class="h-machine card" x="235" y="175" width="130" height="130" rx="16"/>
  <text class="bold mid" x="300" y="238">SHA-256</text>
  <text class="t-muted mid" x="300" y="264" style="font-size:15px">hash function</text>
  <path class="outline s-muted" d="M371 240 h30 m-7 -7 l7 7 l-7 7"/>
  <circle class="h-pulse" cx="196" cy="240" r="7" fill="#F7931A"/>

  <!-- Fingerprint out -->
  <text class="small t-muted mid" x="517" y="136">FINGERPRINT OUT</text>
  <rect class="card" x="410" y="150" width="215" height="180" rx="10"/>
  ${hashLines('h-out-a', hashA, 't-teal')}
  ${hashLines('h-out-b', hashB, 't-orange')}

  <!-- Step labels -->
  <text class="h-label-same t-teal bold mid" x="320" y="392">same text in, same fingerprint out</text>
  <text class="h-label-diff t-orange bold mid" x="320" y="392">one letter changed, everything changed</text>
  <path class="h-back outline s-red" pathLength="1" d="M517 338 Q320 440 105 293"/>
  <text class="h-back-label t-red bold mid" x="320" y="432">✗ no way back</text>
</svg>`;

function buildTimeline(svg) {
  const q = gsap.utils.selector(svg);
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });

  // Starting picture: the machine, with nothing fed in yet.
  gsap.set(q('.h-in-a, .h-in-b, .h-out-a, .h-out-b, .h-pulse, .h-label-same, .h-label-diff, .h-back-label'), { opacity: 0 });
  gsap.set(q('.h-back'), { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set(q('.h-machine'), { transformOrigin: '50% 50%' });

  // One pass of text through the machine, starting at time `at`.
  const feed = (at) => {
    tl.fromTo(q('.h-pulse'), { x: 0, opacity: 1 }, { x: 104, opacity: 1, duration: 0.2, ease: 'power1.in', immediateRender: false }, at)
      .to(q('.h-pulse'), { opacity: 0, duration: 0.04 }, at + 0.2)
      .to(q('.h-machine'), { scale: 1.06, duration: 0.06, yoyo: true, repeat: 1 }, at + 0.2);
  };

  // Step 1 (0 → 1): text in, fingerprint out.
  tl.to(q('.h-in-a'), { opacity: 1, duration: 0.2 }, 0.1);
  feed(0.35);
  tl.to(q('.h-out-a'), { opacity: 1, duration: 0.12, stagger: 0.08 }, 0.6);

  // Step 2 (1 → 2): the same text again gives the same fingerprint.
  feed(1.1);
  tl.to(q('.h-out-a'), { opacity: 0.25, duration: 0.08 }, 1.32)
    .to(q('.h-out-a'), { opacity: 1, duration: 0.15 }, 1.42)
    .to(q('.h-label-same'), { opacity: 1, duration: 0.2 }, 1.6);

  // Step 3 (2 → 3): one letter changes, and the whole fingerprint changes.
  tl.to(q('.h-label-same'), { opacity: 0, duration: 0.1 }, 2)
    .to(q('.h-in-a'), { opacity: 0, duration: 0.12 }, 2.1)
    .to(q('.h-in-b'), { opacity: 1, duration: 0.12 }, 2.14);
  feed(2.32);
  tl.to(q('.h-out-a'), { opacity: 0, duration: 0.12 }, 2.55)
    .to(q('.h-out-b'), { opacity: 1, duration: 0.12, stagger: 0.05 }, 2.6)
    .to(q('.h-label-diff'), { opacity: 1, duration: 0.15 }, 2.82);

  // Step 4 (3 → 4): it cannot be run backwards.
  tl.to(q('.h-label-diff'), { opacity: 0, duration: 0.1 }, 3)
    .to(q('.h-back'), { strokeDashoffset: 0, duration: 0.45 }, 3.15)
    .to(q('.h-back-label'), { opacity: 1, duration: 0.2 }, 3.6);

  return tl;
}

// ── "Try it": hash anything ────────────────────────────────────────────────

const DEMO = `
<label class="field">
  <span>Your text</span>
  <input type="text" value="${TEXT_A}" autocomplete="off" autocapitalize="off" spellcheck="false" data-text>
</label>
<p class="readout">
  <span class="readout__label">SHA-256 hash</span>
  <span class="readout__value" data-hash aria-live="polite"></span>
</p>
<div class="stats">
  <div><span class="stat__num" data-changed>0</span><span class="stat__label">of 64 characters changed</span></div>
  <div><span class="stat__num">64</span><span class="stat__label">characters long, always, whether you type a letter or a novel</span></div>
</div>`;

function initDemo(root) {
  root.innerHTML = DEMO;
  const input = root.querySelector('[data-text]');
  const output = root.querySelector('[data-hash]');
  const changed = root.querySelector('[data-changed]');
  let previous = '';
  let latest = 0;

  async function render() {
    const turn = ++latest;
    const hash = await sha256Hex(input.value);
    if (turn !== latest) return; // a newer keystroke has overtaken this one

    let count = 0;
    output.innerHTML = [...hash]
      .map((char, i) => {
        const differs = previous && char !== previous[i];
        if (differs) count += 1;
        return differs ? `<span class="hl">${char}</span>` : char;
      })
      .join('');
    changed.textContent = count;
    previous = hash;
  }

  input.addEventListener('input', render);
  return render();
}

// ── Start ──────────────────────────────────────────────────────────────────

export async function init(section) {
  if (!hasCrypto()) {
    section.querySelector('[data-demo]').innerHTML = '<p class="status">This scene needs a secure page (https or localhost) to compute hashes.</p>';
    return;
  }
  const [hashA, hashB] = await Promise.all([sha256Hex(TEXT_A), sha256Hex(TEXT_B)]);
  const svg = mountStage(section, svgFor(hashA, hashB));
  driveScene(section, buildTimeline(svg));
  await initDemo(section.querySelector('[data-demo]'));
}
