import { Scene, ease, type Vec3 } from '../lib/iso.ts';
import { art, fonts, page, ramps, surfaces, type Example, paints } from './shared.ts';

const ui = surfaces.light;
const green = ramps.emerald;
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const names = { compact: 'flags-sm', wide: 'flags-lg' } as const;

const percents = [0, 10, 50, 100] as const;
const rollout = [7, 12, 3, 16, 9, 0, 14, 5, 18, 11, 1, 19, 6, 13, 2, 17, 8, 15, 4, 10] as const;
const cohorts = [rollout.slice(0, 2), rollout.slice(2, 10), rollout.slice(10)] as const;
const starts = [0.6, 2.6, 4.9, 7.6] as const;
const loopLength = 9.6;
const inGap = 0.09;
const outGap = 0.033;
const fade = 0.3;

type Layout = { name: string; width: number; height: number; origin: readonly [number, number]; k: number; stacked: boolean };

function build({ name, width, height, origin, k, stacked }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const plate = { at: (stacked ? [0, 0, -12 * k] : [70 * k, -50 * k, -12 * k]) as Vec3, size: [232 * k, 192 * k] as const, height: 10 * k };
  const core = { at: (stacked ? [plate.at[0] - 200 * k, plate.at[1] - 200 * k, 0] : [-190 * k, -50 * k, 0]) as Vec3, size: 96 * k, height: 30 * k };
  const pitch = 40 * k;
  const tile = { size: 27 * k, height: 7 * k };
  const wz = plate.at[2] - plate.height + 2 * k;
  const entry: Vec3 = stacked ? [plate.at[0] - 60 * k, plate.at[1] - plate.size[1] / 2, wz] : [plate.at[0] - plate.size[0] / 2, plate.at[1], wz];
  const route: Vec3[] = stacked ? [[core.at[0] + core.size / 2, core.at[1], wz], [entry[0], core.at[1], wz], entry] : [[core.at[0] + core.size / 2, core.at[1], wz], entry];
  s.wire({ id: 'w-flag', points: route, stroke: ui.wire, width: 1.25, corner: 16 * k });
  s.pulse({ id: 'p-flag', wire: 'w-flag', color: green[2], length: 0.22 });

  s.slab({ id: 'core', at: core.at, size: [core.size, core.size], height: core.height, radius: 17 * k, top: ui.top, side: paints.gradient(s, green), grain: 0.06, edge: ui.edge });
  s.face({ id: 'core-glow', at: core.at, size: [core.size, core.size], radius: 17 * k, fill: 'rgb(52 211 153 / .3)' });
  s.text({ id: 'core-name', at: [core.at[0], core.at[1] + core.size / 2, -core.height * 0.6], text: 'flags', size: 11, color: '#ffffff', on: 'left', anchor: 'middle' });

  s.slab({ id: 'plate', at: plate.at, size: plate.size, height: plate.height, radius: 22 * k, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.05, edge: ui.edge });
  s.face({ id: 'plate-glow', at: plate.at, size: plate.size, radius: 22 * k, fill: 'rgb(52 211 153 / .12)' });
  s.text({ id: 'plate-name', at: [plate.at[0], plate.at[1] + plate.size[1] / 2 - 11 * k, plate.at[2]], text: '20 users', size: 10, color: '#4b4e57', on: 'top', anchor: 'middle' });

  const tiles = Array.from({ length: 20 }, (_, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const at: Vec3 = [plate.at[0] + (col - 2) * pitch, plate.at[1] + (row - 1.5) * pitch, plate.at[2] + tile.height];
    return { i, at, dist: Math.hypot(at[0] - entry[0], at[1] - entry[1]) };
  });
  const back = [...tiles].sort((a, b) => a.at[0] + a.at[1] - (b.at[0] + b.at[1]));
  back.forEach(t => {
    s.slab({ id: `u${t.i}`, at: t.at, size: [tile.size, tile.size], height: tile.height, radius: 6 * k, top: '#f4f4f5', side: { kind: 'flat', color: '#d4d4d8' }, edge: ui.edge, shadow: false });
    s.slab({ id: `u${t.i}-on`, at: t.at, size: [tile.size, tile.size], height: tile.height, radius: 6 * k, top: green[2], side: { kind: 'flat', color: '#059669' }, edge: 'rgb(255 255 255 / .55)', shadow: false });
  });

  const buttonAt: Vec3 = [core.at[0], core.at[1], 70 * k];
  s.label({ id: 'switch', at: buttonAt, html: button(), variant: 'plain', size: 13 });

  s.dropIn('core', 0.1);
  s.dropIn('plate', 0.2);
  back.forEach((t, n) => s.intro(`u${t.i}`, 'opacity', 0.45 + n * 0.02, 0.2, 0, 1, ease.out));
  s.intro('switch', 'opacity', 0.7, 0.3, 0, 1, ease.out);
  s.intro('switch', 'translate', 0.7, 0.4, '0 8px', '0 0', ease.out);

  s.loop(loopLength, 4.3);
  const ping = (t: number) => {
    const dur = 0.5;
    s.at('core', 'translate', t, 0.14, '0 0', '0 3px', ease.out);
    s.at('core', 'translate', t + 0.14, 0.74, '0 3px', '0 0', settle);
    s.at('core-glow', 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at('core-glow', 'opacity', t + 0.1, 0.6, 1, 0, ease.linear);
    s.travel('p-flag', t + 0.05, dur);
    const land = t + 0.05 + dur;
    s.at('plate-glow', 'opacity', land, 0.1, 0, 1, ease.linear);
    s.at('plate-glow', 'opacity', land + 0.1, 0.6, 1, 0, ease.linear);
    return land;
  };

  const ends: number[] = [];
  cohorts.forEach((cohort, c) => {
    const land = ping(starts[c]!);
    const wave = tiles.filter(t => (cohort as readonly number[]).includes(t.i)).sort((a, b) => a.dist - b.dist);
    wave.forEach((t, n) => s.at(`u${t.i}-on`, 'opacity', land + n * inGap, fade, 0, 1, ease.linear));
    ends.push(land + (wave.length - 1) * inGap + fade);
  });
  const land = ping(starts[3]);
  const all = [...tiles].sort((a, b) => b.dist - a.dist);
  all.forEach((t, n) => s.at(`u${t.i}-on`, 'opacity', land + n * outGap, fade * 0.8, 1, 0, ease.linear));
  ends.push(land + (all.length - 1) * outGap + fade * 0.8);

  const steps = starts.map((at, i) => ({ at, end: Math.round(ends[i]! * 1000) / 1000 }));
  return { scene: s, steps };
}

function button(): string {
  return `<button type="button" class="ff-btn" aria-pressed="false"><span class="ff-switch" aria-hidden="true"><span class="ff-knob"></span></span><span class="ff-copy"><span class="ff-name">new-checkout</span><span class="ff-pct">off</span></span><span class="ff-next" aria-hidden="true">next 10 %</span></button>`;
}

const css = `[data-iso^="flags-"] .ff-btn{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:.75em;padding:.6em .7em .6em .65em;background:#fff;border:1px solid rgb(22 23 27 / .12);border-radius:14px;box-shadow:0 1px 2px rgb(15 23 42 / .06),0 12px 28px -16px rgb(15 23 42 / .4);cursor:pointer;font:500 1em/1.25 ${fonts.sans};color:#16171b;transition:scale .18s cubic-bezier(.22,1,.36,1),box-shadow .25s cubic-bezier(.22,1,.36,1);-webkit-tap-highlight-color:transparent;touch-action:manipulation}
[data-iso^="flags-"] .ff-btn:hover{box-shadow:0 1px 2px rgb(15 23 42 / .06),0 16px 32px -14px rgb(15 23 42 / .45)}
[data-iso^="flags-"] .ff-btn:active{scale:.97}
[data-iso^="flags-"] .ff-btn:focus-visible{outline:2px solid #10b981;outline-offset:3px}
[data-iso^="flags-"] .ff-switch{position:relative;flex:none;width:2.4em;height:1.4em;border-radius:1em;background:linear-gradient(90deg,#10b981 calc(var(--p,0) * 100%),#e4e4e7 0);transition:background-color .25s linear}
[data-iso^="flags-"] .ff-knob{position:absolute;top:.2em;left:.2em;width:1em;height:1em;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgb(15 23 42 / .3);translate:calc(var(--p,0) * 1em) 0;transition:translate .35s cubic-bezier(.22,1,.36,1)}
[data-iso^="flags-"] .ff-copy{display:flex;flex-direction:column}
[data-iso^="flags-"] .ff-name{font-family:${fonts.mono};font-size:.92em}
[data-iso^="flags-"] .ff-pct{font-family:${fonts.mono};font-weight:500;color:#047857}
[data-iso^="flags-"] .ff-next{margin-left:.25em;padding:.25em .55em;border-radius:8px;background:#f4f4f5;color:#52525b;font-family:${fonts.mono};font-size:.92em}
@media (prefers-reduced-motion:reduce){[data-iso^="flags-"] .ff-knob,[data-iso^="flags-"] .ff-btn{transition:none}}`;

function script(steps: { at: number; end: number }[]): string {
  const data = JSON.stringify({ steps, percents, names: Object.values(names) });
  return `<script type="module">
const { steps, percents, names } = ${data};
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const idleMs = 6000;
const loopTime = (root) => {
  const h = root.iso;
  if (!h) return 0;
  const a = root.getAnimations({ subtree: true }).find(x => x.effect?.getTiming().iterations === Infinity && x.effect.getTiming().duration === h.spec.loop * 1000);
  if (!a || a.currentTime === null) return 0;
  const t = Number(a.currentTime) / 1000 - h.spec.intro;
  return t < 0 ? 0 : t % h.spec.loop;
};
const stateAt = (t) => steps.filter(s => s.at <= t).length % percents.length;
const bind = (root) => {
  if (root.dataset.ffBound) return;
  root.dataset.ffBound = '1';
  const btn = root.querySelector('.ff-btn');
  const pct = btn.querySelector('.ff-pct');
  const next = btn.querySelector('.ff-next');
  let shown = -1;
  let scrub = 0;
  let idle = 0;
  let waiting = false;
  let pending = false;
  const show = (n) => {
    if (n === shown) return;
    shown = n;
    const p = percents[n];
    const after = percents[(n + 1) % percents.length];
    btn.style.setProperty('--p', String(n / (percents.length - 1)));
    btn.setAttribute('aria-pressed', p === 0 ? 'false' : p === 100 ? 'true' : 'mixed');
    pct.textContent = p === 0 ? 'off' : p + ' %';
    next.textContent = 'next ' + (after === 0 ? 'off' : after + ' %');
  };
  const inView = () => {
    const r = root.getBoundingClientRect();
    return root.offsetParent !== null && r.bottom > 0 && r.top < innerHeight;
  };
  const resume = () => {
    if (!root.iso || reduce.matches) return;
    waiting = !inView();
    if (waiting) return;
    root.iso.play();
  };
  const seen = new IntersectionObserver(entries => {
    if (waiting && entries.some(e => e.isIntersecting)) resume();
  });
  seen.observe(root);
  const press = () => {
    const h = root.iso;
    pending = !h;
    if (!h) return;
    cancelAnimationFrame(scrub);
    clearTimeout(idle);
    waiting = false;
    h.pause();
    const target = (stateAt(loopTime(root)) + 1) % percents.length;
    const step = steps[(target + percents.length - 1) % percents.length];
    show(target);
    const settle = () => (idle = setTimeout(resume, idleMs));
    if (reduce.matches) {
      h.seek(h.spec.intro + step.end);
      return;
    }
    h.seek(h.spec.intro + step.at);
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(step.end, step.at + (now - t0) / 1000);
      h.seek(h.spec.intro + t);
      if (t < step.end) scrub = requestAnimationFrame(tick);
      else settle();
    };
    scrub = requestAnimationFrame(tick);
  };
  btn.addEventListener('click', press);
  const sync = setInterval(() => {
    if (!root.isConnected) {
      clearInterval(sync);
      seen.disconnect();
      return;
    }
    if (!root.iso) return;
    if (pending) press();
    else show(stateAt(loopTime(root)));
  }, 150);
};
const scan = () => {
  for (const name of names) for (const root of document.querySelectorAll('[data-iso="' + name + '"]')) bind(root);
};
scan();
new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
</script>`;
}

const compact = build({ name: names.compact, width: 390, height: 420, origin: [195, 290], k: 0.95, stacked: true });
const wide = build({ name: names.wide, width: 720, height: 420, origin: [360, 225], k: 1, stacked: false });
if (JSON.stringify(compact.steps) !== JSON.stringify(wide.steps)) throw new Error('feature-flags: the compact and wide scenes must share one rollout timeline, the switch script drives both');

export const example: Example = {
  slug: 'feature-flags',
  title: 'Flag rollout',
  ask: 'Show a flag rolling a feature out to 10, 50 and 100 %.',
  story: 'Flipping a feature flag rolls the feature out to 10, 50 and then 100 percent of users, each step spreading across the user grid in a wave.',
  prompt: 'Draw a feature flag service rolling a feature out to a grid of users at 10, 50 and 100 percent, with a real switch I can press to step the rollout myself.',
  level: 'medium',
  intent: 'scale',
  layout: 'field',
  useCase: 'Release',
  surface: 'light',
  interaction: 'play',
  art: art(compact.scene, wide.scene, 520, `<style>${css}</style>${script(wide.steps)}`),
};

export default page(example);
