// Scene 1 — The problem: digital money without a bank, and double spending.
//
// Two parts:
//   1. A scroll-driven picture with five steps (one per caption in index.html).
//   2. A small "try it" demo where the viewer double-spends a coin.
//
// SIMPLIFIED: the "digital coin as a copyable file" is a thought experiment
// for why naive digital cash fails. It is not how Bitcoin stores coins.
// SIMPLIFIED: the last step shows "everyone holds the same ledger". How those
// copies are kept in agreement (mining, consensus) is the job of later scenes.

import { mountStage, driveScene, svgNode, dur } from '../lib/helpers.js';

// ── Drawing helpers ────────────────────────────────────────────────────────

const avatar = (cls, x, y, name) => `
  <g class="avatar ${cls}" transform="translate(${x},${y})">
    <circle r="36"/>
    <text class="avatar__initial" y="9">${name[0]}</text>
    <text class="avatar__name" y="64">${name}</text>
  </g>`;

const coin = (cls, r = 20) => `
  <g class="${cls}">
    <circle class="coin__disc" r="${r}"/>
    <circle class="coin__ring" r="${r - 7}"/>
  </g>`;

// Six small ledgers in a ring, for the final "everyone has a copy" step.
const NODES = [0, 1, 2, 3, 4, 5].map((i) => {
  const angle = ((i * 60 - 90) * Math.PI) / 180;
  return { x: 320 + 170 * Math.cos(angle), y: 240 + 160 * Math.sin(angle) };
});

const miniLedger = ({ x, y }) => `
  <g class="p-node" transform="translate(${x},${y})">
    <rect class="card" x="-24" y="-30" width="48" height="60" rx="6"/>
    <path class="outline s-teal" d="M-13 -13 h26 M-13 0 h26 M-13 13 h16"/>
  </g>`;

const ringLinks = NODES.map((a, i) => {
  const b = NODES[(i + 1) % NODES.length];
  return `<path class="p-link outline s-muted" pathLength="1" d="M${a.x} ${a.y} L${b.x} ${b.y}"/>`;
}).join('');

// ── The scroll-driven picture (viewBox is 640 × 480) ───────────────────────

const SVG = `
<svg viewBox="0 0 640 480" role="img"
     aria-label="Alice pays Bob and Carol with the same digital coin. A bank's ledger stops the second payment. Bitcoin instead gives everyone a copy of the ledger.">

  <g class="p-people">
    ${avatar('p-alice', 110, 240, 'Alice')}
    ${avatar('p-bob', 530, 120, 'Bob')}
    ${avatar('p-carol', 530, 360, 'Carol')}
  </g>

  <!-- Step 1: a banknote -->
  <g class="p-note">
    <rect class="card" x="-34" y="-20" width="68" height="40" rx="5"/>
    <circle class="outline" r="9"/>
  </g>

  <!-- Steps 2–3: one digital coin and its two copies -->
  ${coin('p-coin p-coin-a')}
  ${coin('p-coin p-coin-b')}
  ${coin('p-coin p-coin-c')}
  <circle class="p-alarm outline s-red" cx="450" cy="120" r="30"/>
  <circle class="p-alarm outline s-red" cx="450" cy="360" r="30"/>
  <text class="p-alarm-text t-red bold mid" x="450" y="234">Same coin,</text>
  <text class="p-alarm-text t-red bold mid" x="450" y="260">spent twice</text>

  <!-- Step 4: the bank and its ledger -->
  <g class="p-bank">
    <rect class="card" x="225" y="150" width="190" height="180" rx="12"/>
    <text class="small t-muted mid" x="320" y="184">BANK LEDGER</text>
    <path class="hair" d="M243 200 H397"/>
    <g class="p-row1">
      <text x="243" y="240">Alice → Bob</text>
      <text class="t-teal bold end" x="397" y="240">✓</text>
    </g>
    <g class="p-row2">
      <text x="243" y="284">Alice → Carol</text>
      <text class="t-red bold end" x="397" y="284">✗</text>
    </g>
  </g>
  ${coin('p-pay p-pay-a')}
  ${coin('p-pay p-pay-b')}

  <!-- Step 5: everyone holds a copy of the ledger -->
  <g class="p-net">
    ${ringLinks}
    ${NODES.map(miniLedger).join('')}
    <text class="p-net-text bold mid" x="320" y="234">Everyone holds</text>
    <text class="p-net-text bold mid" x="320" y="262">the same ledger</text>
  </g>
</svg>`;

function buildTimeline(svg) {
  const q = gsap.utils.selector(svg);
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });

  // Where things rest.
  const ALICE_HAND = { x: 192, y: 240 };
  const BOB_HAND = { x: 450, y: 120 };
  const CAROL_HAND = { x: 450, y: 360 };
  const BANK_DOOR = { x: 205, y: 240 };

  // Starting picture: Alice holding a banknote, Bob waiting.
  gsap.set(q('.p-note'), { ...ALICE_HAND });
  gsap.set(q('.p-carol'), { opacity: 0 });
  gsap.set(q('.p-coin, .p-pay'), { ...ALICE_HAND, opacity: 0, transformOrigin: '50% 50%' });
  gsap.set(q('.p-coin-a'), { scale: 0 });
  gsap.set(q('.p-alarm'), { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' });
  gsap.set(q('.p-alarm-text, .p-bank, .p-row1, .p-row2, .p-net-text'), { opacity: 0 });
  gsap.set(q('.p-bank'), { y: 20 });
  gsap.set(q('.p-node'), { opacity: 0, scale: 0.5, transformOrigin: '50% 50%' });
  gsap.set(q('.p-link'), { strokeDasharray: 1, strokeDashoffset: 1 });

  // Step 1 (0 → 1): cash changes hands. Alice no longer has it.
  tl.to(q('.p-note'), { ...BOB_HAND, duration: 0.8 }, 0.1);

  // Step 2 (1 → 2): a digital coin appears, then copies itself.
  tl.to(q('.p-note'), { opacity: 0, duration: 0.2 }, 1)
    .to(q('.p-coin-a'), { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2)' }, 1.15)
    .to(q('.p-coin-b'), { opacity: 1, x: 222, y: 216, duration: 0.25 }, 1.45)
    .to(q('.p-coin-c'), { opacity: 1, x: 252, y: 192, duration: 0.25 }, 1.7);

  // Step 3 (2 → 3): one copy to Bob, one to Carol. A double spend.
  tl.to(q('.p-carol'), { opacity: 1, duration: 0.2 }, 2)
    .to(q('.p-coin-b'), { ...BOB_HAND, duration: 0.5 }, 2.1)
    .to(q('.p-coin-c'), { ...CAROL_HAND, duration: 0.5 }, 2.25)
    .to(q('.p-alarm'), { opacity: 1, scale: 1, duration: 0.2, ease: 'back.out(2)' }, 2.75)
    .to(q('.p-alarm-text'), { opacity: 1, duration: 0.2 }, 2.8);

  // Step 4 (3 → 4): replay with a bank in the middle. The first payment
  // is recorded and goes through; the second is refused.
  tl.to(q('.p-coin, .p-alarm, .p-alarm-text'), { opacity: 0, duration: 0.15 }, 3)
    .to(q('.p-bank'), { opacity: 1, y: 0, duration: 0.2 }, 3.08)
    .to(q('.p-pay-a'), { opacity: 1, duration: 0.05 }, 3.28)
    .to(q('.p-pay-a'), { ...BANK_DOOR, duration: 0.12 }, 3.3)
    .to(q('.p-row1'), { opacity: 1, duration: 0.1 }, 3.42)
    .to(q('.p-pay-a'), { x: 320, y: 120, duration: 0.12, ease: 'power1.in' }, 3.48)
    .to(q('.p-pay-a'), { ...BOB_HAND, duration: 0.12, ease: 'power1.out' }, 3.6)
    .to(q('.p-pay-b'), { opacity: 1, duration: 0.05 }, 3.72)
    .to(q('.p-pay-b'), { ...BANK_DOOR, duration: 0.12 }, 3.74)
    .to(q('.p-row2'), { opacity: 1, duration: 0.1 }, 3.86)
    .to(q('.p-pay-b'), { ...ALICE_HAND, opacity: 0, duration: 0.12 }, 3.9);

  // Step 5 (4 → 5): no bank. Everyone holds a copy of the ledger.
  tl.to(q('.p-people, .p-bank, .p-pay-a'), { opacity: 0, duration: 0.25 }, 4)
    .to(q('.p-node'), { opacity: 1, scale: 1, duration: 0.25, stagger: 0.06, ease: 'back.out(2)' }, 4.2)
    .to(q('.p-link'), { strokeDashoffset: 0, duration: 0.25, stagger: 0.06 }, 4.3)
    .to(q('.p-net-text'), { opacity: 1, duration: 0.2 }, 4.75);

  return tl;
}

// ── "Try it": spend the same coin twice ────────────────────────────────────

const DEMO = `
<svg viewBox="0 0 480 250" role="img" aria-label="Alice on the left with one coin. Bob and Carol on the right.">
  <g class="avatar" transform="translate(52,118)">
    <circle r="28"/><text class="avatar__initial" y="9">A</text><text class="avatar__name" y="52">Alice</text>
  </g>
  <g class="avatar" transform="translate(428,56)">
    <circle r="28"/><text class="avatar__initial" y="9">B</text><text class="avatar__name" y="52">Bob</text>
  </g>
  <g class="avatar" transform="translate(428,178)">
    <circle r="28"/><text class="avatar__initial" y="9">C</text><text class="avatar__name" y="52">Carol</text>
  </g>
  <g class="d-bank">
    <rect class="card d-bank-box" x="158" y="62" width="164" height="124" rx="10"/>
    <text class="small t-muted mid" x="240" y="90">BANK LEDGER</text>
    <text class="d-row" x="172" y="126" style="font-size:17px"></text>
    <text class="d-row" x="172" y="158" style="font-size:17px"></text>
  </g>
  <g class="d-coins"></g>
</svg>
<div class="controls">
  <button class="btn" type="button" data-pay="Bob">Pay Bob</button>
  <button class="btn" type="button" data-pay="Carol">Pay Carol</button>
  <label class="toggle"><input type="checkbox" data-bank> A bank keeps the ledger</label>
  <button class="btn btn--quiet" type="button" data-reset>Reset</button>
</div>
<p class="status" aria-live="polite"></p>`;

function initDemo(root) {
  root.innerHTML = DEMO;

  const coinsLayer = root.querySelector('.d-coins');
  const bankGroup = root.querySelector('.d-bank');
  const bankBox = root.querySelector('.d-bank-box');
  const rows = root.querySelectorAll('.d-row');
  const status = root.querySelector('.status');
  const bankToggle = root.querySelector('[data-bank]');
  const payButtons = root.querySelectorAll('[data-pay]');

  const HOME = { x: 108, y: 118 };
  const HANDS = { Bob: { x: 372, y: 56 }, Carol: { x: 372, y: 178 } };
  const BANK_DOOR = { x: 140, y: 118 };

  let attempted; // names Alice has tried to pay
  let paid;      // names whose payment went through
  let homeCoin;

  function addCoin() {
    const node = svgNode(coin('d-coin', 16)).firstElementChild;
    coinsLayer.append(node);
    gsap.set(node, { ...HOME });
    return node;
  }

  function say(text, tone = '') {
    status.textContent = text;
    status.className = `status ${tone}`;
  }

  function reset() {
    gsap.killTweensOf(coinsLayer.children);
    coinsLayer.replaceChildren();
    attempted = new Set();
    paid = [];
    homeCoin = addCoin();
    rows.forEach((row) => { row.textContent = ''; row.setAttribute('class', 'd-row'); });
    gsap.set(bankGroup, { opacity: bankToggle.checked ? 1 : 0 });
    payButtons.forEach((button) => { button.disabled = false; });
    say(bankToggle.checked
      ? 'The bank is watching. Pay Bob, then try to pay Carol too.'
      : 'No one is keeping track. Pay Bob, then pay Carol.');
  }

  function pay(name) {
    if (attempted.has(name)) return;
    attempted.add(name);
    root.querySelector(`[data-pay="${name}"]`).disabled = true;
    const hand = HANDS[name];

    if (!bankToggle.checked) {
      // No ledger: nothing stops Alice sending a copy and keeping the original.
      gsap.to(addCoin(), { ...hand, duration: dur(0.6), ease: 'power2.inOut' });
      paid.push(name);
      if (paid.length === 1) {
        say(`${name} accepts the coin. But it was only a copy: Alice still has hers.`);
      } else {
        say('Bob and Carol each think they have been paid, with the very same coin. That is a double spend.', 'is-bad');
      }
      return;
    }

    if (paid.length === 0) {
      // With a ledger: the bank records the payment and the coin really moves.
      gsap.to(homeCoin, { ...hand, duration: dur(0.6), ease: 'power2.inOut' });
      rows[0].textContent = `Alice → ${name}  ✓`;
      rows[0].setAttribute('class', 'd-row t-teal');
      paid.push(name);
      say(`The bank records the payment. The coin is now ${name}'s, and Alice has nothing left to spend.`, 'is-good');
    } else {
      // Second attempt: the ledger shows the coin is already spent.
      const ghost = addCoin();
      gsap.timeline()
        .to(ghost, { ...BANK_DOOR, duration: dur(0.3), ease: 'power2.out' })
        .to(ghost, { ...HOME, opacity: 0, duration: dur(0.3), ease: 'power2.in' });
      gsap.fromTo(bankBox, { stroke: '#FF5C5C' }, { stroke: '#E8E6E1', duration: dur(1.2) });
      rows[1].textContent = `Alice → ${name}  ✗`;
      rows[1].setAttribute('class', 'd-row t-red');
      say('Refused. The bank checks its ledger and sees Alice has already spent that coin.', 'is-bad');
    }
  }

  payButtons.forEach((button) => button.addEventListener('click', () => pay(button.dataset.pay)));
  root.querySelector('[data-reset]').addEventListener('click', reset);
  bankToggle.addEventListener('change', reset);
  reset();
}

// ── Start ──────────────────────────────────────────────────────────────────

export function initProblem() {
  const section = document.querySelector('#problem');
  const svg = mountStage(section.querySelector('.scene__body'), SVG);
  driveScene(section, buildTimeline(svg));
  initDemo(section.querySelector('[data-demo]'));
}
