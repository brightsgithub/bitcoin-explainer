// Scene 9 — Supply: the block reward, halvings and the 21 million cap.
//
// Two parts:
//   1. A scroll-driven picture with five steps (one per caption in index.html).
//   2. A "try it" slider: pick a year, see the reward and the total supply.
//
// The numbers follow Bitcoin's actual rule: the reward starts at 50 BTC and
// halves every 210,000 blocks, counted in whole satoshis (1 BTC =
// 100,000,000 satoshis), which is why the total stops at
// 20,999,999.9769 BTC, a little short of 21 million.
//
// SIMPLIFIED: past halving dates are the real ones (November 2012, July 2016,
// May 2020, April 2024). Future ones are assumed to follow every four years;
// the real dates depend on how fast blocks are found. The reward reaches zero
// at the 33rd halving, around the year 2140.
// SIMPLIFIED: "about 95% already exist" counts coins ever created. Some of
// those are lost for good (forgotten keys), so fewer can actually be spent.

import { mountStage, driveScene } from '../lib/helpers.js';

// ── The supply rule ────────────────────────────────────────────────────────

const BLOCKS_PER_ERA = 210000;
const HALVINGS = 33;
const PAST_ERA_STARTS = [2009.0, 2012.9, 2016.5, 2020.4, 2024.3];

/** The (approximate) year in which reward era `k` begins. */
const eraStart = (k) => (k < PAST_ERA_STARTS.length ? PAST_ERA_STARTS[k] : 2024.3 + 4 * (k - 4));

/** Reward per block in era `k`, in BTC, rounded down to whole satoshis. */
const rewardIn = (k) => (k >= HALVINGS ? 0 : Math.floor(5_000_000_000 / 2 ** k) / 100_000_000);

/** Coins that exist at the start of era `k`. */
function supplyAtEra(k) {
  let total = 0;
  for (let era = 0; era < Math.min(k, HALVINGS); era += 1) total += BLOCKS_PER_ERA * rewardIn(era);
  return total;
}

const CAP = supplyAtEra(HALVINGS); // 20,999,999.9769
const END_YEAR = eraStart(HALVINGS); // about 2140

/** Reward and total supply at a given year. */
function at(year) {
  let k = 0;
  while (k < HALVINGS && year >= eraStart(k + 1)) k += 1;
  const reward = rewardIn(k);
  const progress = k >= HALVINGS ? 0 : (year - eraStart(k)) / (eraStart(k + 1) - eraStart(k));
  return { reward, supply: supplyAtEra(k) + progress * BLOCKS_PER_ERA * reward };
}

// ── The scroll-driven picture (viewBox is 640 × 480) ───────────────────────

// Bar chart of the reward in each era so far, plus the next one.
const BARS = [
  { year: '2009', reward: 50 },
  { year: '2012', reward: 25 },
  { year: '2016', reward: 12.5 },
  { year: '2020', reward: 6.25 },
  { year: '2024', reward: 3.125 },
  { year: '2028', reward: 1.5625, next: true },
];
const BASE_Y = 400;
const barX = (i) => 44 + i * 96;
const barHeight = (reward) => (reward / 50) * 270;

const bar = ({ year, reward, next }, i) => `
  <g class="s-bar ${next ? 's-bar-next' : i === 4 ? 's-bar-now' : 's-bar-past'}">
    <rect class="s-bar-rect" x="${barX(i)}" y="${BASE_Y - barHeight(reward)}" width="64" height="${barHeight(reward)}" rx="4"
          ${next ? 'fill="none" stroke="#F7931A" stroke-width="2" stroke-dasharray="5 5"' : 'fill="#F7931A"'}/>
    <text class="s-bar-label bold mid" x="${barX(i) + 32}" y="${BASE_Y - barHeight(reward) - 10}" style="font-size:18px">${reward}</text>
    <text class="s-bar-label t-muted mid" x="${barX(i) + 32}" y="${BASE_Y + 26}" style="font-size:17px">${year}</text>
  </g>`;

// Supply curve: total coins over time, a straight line within each era.
const curveX = (year) => 60 + ((year - 2009) / (END_YEAR - 2009)) * 530;
const curveY = (supply) => BASE_Y - (supply / 21_000_000) * 280;
const CURVE = Array.from({ length: HALVINGS + 1 }, (_, k) => `${k === 0 ? 'M' : 'L'}${curveX(eraStart(k)).toFixed(1)} ${curveY(supplyAtEra(k)).toFixed(1)}`).join(' ');

const NOW_YEAR = Math.min(new Date().getFullYear() + new Date().getMonth() / 12, END_YEAR);
const NOW = { x: curveX(NOW_YEAR), y: curveY(at(NOW_YEAR).supply) };

const SVG = `
<svg viewBox="0 0 640 480" role="img"
     aria-label="Each block creates new coins for its miner. The reward has halved from 50 to 25, 12.5, 6.25 and 3.125 bitcoin. The total supply curve flattens out just under 21 million around the year 2140.">

  <!-- Step 1: a block mints new coins -->
  <g class="s-mint">
    <rect class="card" x="250" y="230" width="140" height="120" rx="12"/>
    <path class="hair" d="M270 262 h100 M270 286 h100 M270 310 h60"/>
    <g class="s-coin">
      <circle class="coin__disc" cx="320" cy="150" r="42"/>
      <text class="mono bold mid t-ink" x="320" y="160" style="font-size:28px">50</text>
    </g>
    <text class="s-mint-label t-muted mid" x="320" y="386">brand-new coins for the winning miner</text>
  </g>

  <!-- Steps 2–3: the reward, halving by halving -->
  <g class="s-chart">
    <text class="s-chart-title t-muted" x="44" y="70">new bitcoin created per block</text>
    <path class="hair" d="M34 ${BASE_Y} H620"/>
    ${BARS.map(bar).join('')}
  </g>

  <!-- Steps 4–5: total supply over time -->
  <g class="s-curve">
    <text class="t-muted" x="60" y="70">total bitcoin in existence</text>
    <path class="outline s-muted" stroke-dasharray="7 7" d="M60 ${curveY(21_000_000)} H600"/>
    <text class="bold" x="60" y="${curveY(21_000_000) - 12}">21 million</text>
    <path class="hair" d="M60 ${BASE_Y} H600"/>
    <text class="t-muted" x="60" y="${BASE_Y + 26}" style="font-size:17px">2009</text>
    <text class="t-muted end" x="600" y="${BASE_Y + 26}" style="font-size:17px">2140</text>
    <path class="s-line" pathLength="1" d="${CURVE}" fill="none" stroke="#F7931A" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
    <g class="s-now">
      <circle cx="${NOW.x.toFixed(1)}" cy="${NOW.y.toFixed(1)}" r="8" fill="#E8E6E1"/>
      <path class="outline" d="M${NOW.x.toFixed(1)} ${(NOW.y + 14).toFixed(1)} V196"/>
      <text class="bold" x="${(NOW.x - 6).toFixed(1)}" y="222">today: about 95% already exist</text>
    </g>
    <g class="s-end">
      <circle cx="590" cy="${curveY(CAP).toFixed(1)}" r="8" fill="#3DD6B0"/>
      <text class="t-teal bold end" x="600" y="290">around 2140: the last new coins</text>
      <text class="t-muted end" x="600" y="318">after that, miners earn fees only</text>
    </g>
  </g>
</svg>`;

function buildTimeline(svg) {
  const q = gsap.utils.selector(svg);
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });

  // Starting picture: a freshly mined block.
  gsap.set(q('.s-coin'), { y: 110, scale: 0, transformOrigin: '50% 50%' });
  gsap.set(q('.s-mint-label, .s-chart, .s-curve, .s-now, .s-end, .s-bar-label'), { opacity: 0 });
  gsap.set(q('.s-bar-rect'), { scaleY: 0, transformOrigin: '50% 100%' });
  gsap.set(q('.s-line'), { strokeDasharray: 1, strokeDashoffset: 1 });

  // Step 1 (0 → 1): the block reward appears out of the new block.
  tl.to(q('.s-coin'), { y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.6)' }, 0.15)
    .to(q('.s-mint-label'), { opacity: 1, duration: 0.2 }, 0.65);

  // Step 2 (1 → 2): 50, 25, 12.5, 6.25, 3.125.
  tl.to(q('.s-mint'), { opacity: 0, duration: 0.15 }, 1)
    .to(q('.s-chart'), { opacity: 1, duration: 0.15 }, 1.12);
  q('.s-bar-past, .s-bar-now').forEach((group, i) => {
    tl.to(group.querySelector('.s-bar-rect'), { scaleY: 1, duration: 0.2, ease: 'power2.out' }, 1.22 + i * 0.13)
      .to(group.querySelectorAll('.s-bar-label'), { opacity: 1, duration: 0.1 }, 1.32 + i * 0.13);
  });

  // Step 3 (2 → 3): today's reward, and the next halving.
  tl.to(q('.s-bar-past'), { opacity: 0.35, duration: 0.2 }, 2.1)
    .to(q('.s-bar-next .s-bar-rect'), { scaleY: 1, duration: 0.25 }, 2.45)
    .to(q('.s-bar-next .s-bar-label'), { opacity: 1, duration: 0.15 }, 2.65);

  // Step 4 (3 → 4): add it all up and it levels off below 21 million.
  tl.to(q('.s-chart'), { opacity: 0, duration: 0.15 }, 3)
    .to(q('.s-curve'), { opacity: 1, duration: 0.15 }, 3.12)
    .to(q('.s-line'), { strokeDashoffset: 0, duration: 0.5, ease: 'power1.inOut' }, 3.25)
    .to(q('.s-now'), { opacity: 1, duration: 0.2 }, 3.75);

  // Step 5 (4 → 5): the end of new coins.
  tl.to(q('.s-end'), { opacity: 1, duration: 0.3 }, 4.2);

  return tl;
}

// ── "Try it": travel through the halvings ──────────────────────────────────

const DEMO = `
<label class="field">
  <span>Year: <strong data-year></strong></span>
  <input class="range" type="range" min="2009" max="2141" step="1" data-range>
</label>
<div class="stats">
  <div><span class="stat__num" data-reward></span><span class="stat__label">new bitcoin per block</span></div>
  <div><span class="stat__num" data-supply></span><span class="stat__label">bitcoin in existence</span></div>
  <div><span class="stat__num" data-share></span><span class="stat__label">of the final total</span></div>
</div>
<p class="status" aria-live="polite"></p>`;

function initDemo(root) {
  root.innerHTML = DEMO;
  const range = root.querySelector('[data-range]');
  const status = root.querySelector('.status');
  const thisYear = new Date().getFullYear();
  range.value = thisYear;

  // Show a reward without trailing zeros: 3.125, not 3.12500000.
  const tidy = (reward) => (reward === 0 ? '0' : reward.toFixed(8).replace(/\.?0+$/, ''));

  function render() {
    const year = Number(range.value);
    // Read the figures at the middle of the chosen year.
    const { reward, supply } = at(Math.min(year + 0.5, END_YEAR + 1));

    root.querySelector('[data-year]').textContent = year;
    root.querySelector('[data-reward]').textContent = tidy(reward);
    root.querySelector('[data-supply]').textContent = `${(supply / 1_000_000).toFixed(2)} million`;
    root.querySelector('[data-share]').textContent = `${((supply / CAP) * 100).toFixed(1)}%`;

    status.textContent =
      reward === 0
        ? 'No new coins are created any more. The total stays at 20,999,999.9769 for good.'
        : year < thisYear
          ? 'In the past.'
          : year === thisYear
            ? 'This year.'
            : 'A projection, assuming a halving every four years from here on.';
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
