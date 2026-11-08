import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.dark;
const teal = ramps.teal;
const names = { compact: 'loadslider-sm', wide: 'loadslider-lg' } as const;
const snapOff = 'cubic-bezier(.45,.86,.17,.96)';
const redraw = 'cubic-bezier(.31,.12,.03,.72)';
const exit = 'linear(0, -0.007 11.8%, -0.045 37.8%, -0.048 57%, -0.028 63.2%, 0.018 69.3%, 0.079 74.3%, 0.164 79.3%, 0.27 84%, 0.392 88.3%, 0.459 90.3%, 0.535 92.3%, 0.609 94%, 0.694 95.8%, 0.777 97.3%, 0.859 98.5%, 0.942 99.5%, 1)';

const perNode = 800;
const slots = 12;
const minNodes = 2;
const load = { min: perNode, max: perNode * slots, step: 100 } as const;
const loopLength = 16;
const curve: readonly (readonly [number, number])[] = [
  [0, load.min],
  [0.5, load.min],
  [7.5, load.max],
  [8.5, load.max],
  [14.5, load.min],
  [loopLength, load.min],
];
const rise = [curve[1]![0], curve[2]![0]] as const;
const fall = [curve[3]![0], curve[4]![0]] as const;
const drop = 0.55;

const riseAt = (v: number) => rise[0] + ((v - load.min) / (load.max - load.min)) * (rise[1] - rise[0]);
const fallAt = (v: number) => fall[0] + ((load.max - v) / (load.max - load.min)) * (fall[1] - fall[0]);
const threshold = (k: number) => (k - 1) * perNode;
const arrivals = Array.from({ length: slots - minNodes }, (_, i) => riseAt(threshold(i + minNodes + 1)));
if (arrivals.some((t, i) => i > 0 && t - arrivals[i - 1]! < drop)) throw new Error('load-slider: node drops overlap; the slider snaps out of drop windows, so each must end before the next starts');
const windows = arrivals.map(t => [Number(t.toFixed(3)), Number((t + drop).toFixed(3))] as const);

const order = [
  [0, 1], [1, 1], [2, 1], [3, 1],
  [0, 0], [1, 0], [2, 0], [3, 0],
  [0, 2], [1, 2], [2, 2], [3, 2],
] as const;
const rowOn = (row: number) => order.findIndex(c => c[1] === row) + 1;
const tiers = [
  { id: 'a', from: load.min, width: 1.5, period: 1.7, length: 0.12 },
  { id: 'b', from: 4000, width: 2.5, period: 1.15, length: 0.14 },
  { id: 'c', from: 7200, width: 3.5, period: 0.8, length: 0.16 },
] as const;

type Layout = { name: string; width: number; height: number; origin: readonly [number, number]; k: number; minPx: number; panel: { x: number; y: number; anchor: 'center' | 'left' } };

function build({ name, width, height, origin, k, minPx, panel }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label, ratio: 0.64 });
  const pitch = 76 * k;
  const size = 42 * k;
  const h = 10 * k;
  const radius = 9 * k;
  const plate = { at: [0, -0.2 * pitch, 0] as Vec3, size: [pitch * 4 + 6 * k, pitch * 3.3] as const, height: 10 * k };
  const left = -plate.size[0] / 2;
  const busY = (r: number) => (r - 1.5) * pitch;
  const lb = { at: [left - 92 * k, busY(1), 8 * k] as Vec3, size: 64 * k, height: 26 * k };
  const wz = -plate.height + 2 * k + 0.01;
  const lz = 0.5;
  const cell = (c: number, r: number): Vec3 => [(c - 1.5) * pitch, (r - 1) * pitch, h];
  const bend = left - 26 * k;
  const end = cell(3, 0)[0] + size / 2;
  const lane = (r: number): Vec3[] => {
    const y = busY(r);
    const top: Vec3[] = [[left + 6 * k, y, lz], [end, y, lz]];
    const from: Vec3 = [lb.at[0] + lb.size / 2, busY(1), wz];
    return r === 1 ? [from, [left, y, wz], ...top] : [from, [bend, busY(1), wz], [bend, y, wz], [left, y, wz], ...top];
  };

  s.wire({ id: 'feed', points: lane(1).slice(0, 2), stroke: ui.wire, width: 1.25 });
  [0, 2].forEach(r => s.wire({ id: `lane-${r}-in`, points: lane(r).slice(0, 4), stroke: ui.wire, width: 1.25, corner: 12 * k, hidden: true }));
  s.slab({ id: 'plate', at: plate.at, size: plate.size, height: plate.height, radius: 18 * k, top: '#16171b', side: paints.brushed(s, ramps.graphite), edge: ui.edge });
  order.forEach(([c, r], i) => {
    s.face({ id: `slot-${i}`, at: [cell(c, r)[0], cell(c, r)[1], 0], size: [size, size], radius, stroke: 'rgb(94 234 212 / .28)', dash: '4 4' });
    s.march(`slot-${i}`, 4, 4, 24);
  });

  const lanes = [0, 1, 2].map(r => {
    const id = `lane-${r}`;
    s.wire({ id, points: lane(r).slice(r === 1 ? 2 : 4), stroke: 'rgb(94 234 212 / .3)', width: 1.25, hidden: true });
    return { r, id, on: riseAt(threshold(rowOn(r))) + drop * 0.6, off: fallAt(threshold(rowOn(r))) };
  });
  lanes.forEach(l => {
    const d = s.wirePath(lane(l.r).slice(l.r === 1 ? 2 : 4), 12 * k);
    tiers.forEach(t => {
      const markup = `<path d="${d}" fill="none" stroke="${teal[2]}" stroke-width="${t.width * 3}" stroke-linecap="round" pathLength="1" stroke-dasharray="${t.length} 2" opacity=".35" filter="${s.blur(3)}"/><path d="${d}" fill="none" stroke="${teal[3]}" stroke-width="${t.width}" stroke-linecap="round" pathLength="1" stroke-dasharray="${t.length} 2"/>`;
      s.group(`tier-${l.r}-${t.id}`, () => s.svg(`run-${l.r}-${t.id}`, markup));
      s.ambient(`run-${l.r}-${t.id}`, 'strokeDashoffset', t.period, [t.length, -1]);
    });
  });

  [...order.map(([c, r], i) => ({ c, r, i }))].sort((a, b) => a.c + a.r - (b.c + b.r)).forEach(({ c, r, i }) => {
    const at = cell(c, r);
    s.group(`node-${i}`, () => {
      s.wire({ id: `node-${i}-tap`, points: [[at[0], busY(r), lz], [at[0], at[1] - size / 2, lz]], stroke: 'rgb(94 234 212 / .3)', width: 1.25 });
      s.slab({ id: `node-${i}-slab`, at, size: [size, size], height: h, radius, top: ui.top, side: paints.gradient(s, teal), edge: ui.edge, shadow: false });
      s.face({ id: `node-${i}-hit`, at, size: [size, size], radius, fill: 'rgb(45 212 191 / .3)' });
    });
    s.pivot(`node-${i}`, [at[0], at[1], 0]);
  });

  s.slab({ id: 'lb', at: lb.at, size: [lb.size, lb.size], height: lb.height, radius: 13 * k, top: ui.top, side: paints.gradient(s, ramps.graphite), grain: 0.06, edge: ui.edge });
  s.text({ id: 'lb-name', at: lb.at, text: 'ingress', size: 11, color: '#d4d4d8', on: 'top', anchor: 'middle' });

  const x = panel.anchor === 'left' ? fitX(panel.x, 'load 9,600 req/s · 12 nodes  ', width, minPx, 'left') : panel.x;
  s.label({ id: 'panel', at: { screen: [x, panel.y] }, html: control(), size: 13, anchor: panel.anchor, variant: 'plain' });

  s.dropIn('lb', 0.1);
  s.dropIn('plate', 0.18);
  for (let i = 0; i < minNodes; i++) {
    s.dropIn(`node-${i}`, 0.3 + i * 0.083);
    s.set(`node-${i}-hit`, 'opacity', 0, 0, 'intro');
  }
  s.intro('panel', 'opacity', 0.5, 0.3, 0, 1, ease.out);
  s.intro('panel', 'translate', 0.5, 0.4, '0 8px', '0 0', ease.out);
  s.draw('lane-1', 0.8, 0.4, ease.out, 'intro');
  s.intro('tier-1-a', 'opacity', 0.9, 0.3, 0, 1, ease.linear);

  s.loop(loopLength, rise[1] + 0.4);
  for (let i = minNodes; i < slots; i++) {
    const t = riseAt(threshold(i + 1));
    const out = fallAt(threshold(i + 1));
    s.dropAt(`node-${i}`, t, 46);
    s.at(`node-${i}-hit`, 'opacity', t + drop * 0.58, 0.1, 0, 1, ease.linear);
    s.at(`node-${i}-hit`, 'opacity', t + drop * 0.58 + 0.1, 0.6, 1, 0, ease.linear);
    s.at(`node-${i}`, 'scale', out, 0.745, 1, 0, exit);
    s.set(`node-${i}`, 'opacity', out + 0.76, 0);
    s.set(`node-${i}`, 'scale', out + 0.8, 1);
  }
  lanes.forEach(l => {
    if (l.r !== 1) {
      s.draw(`${l.id}-in`, l.on - 0.3, 0.3, redraw);
      s.draw(l.id, l.on, 0.37, redraw);
      s.retract(l.id, l.off, 0.23, 'start', snapOff);
      s.retract(`${l.id}-in`, l.off + 0.2, 0.23, 'start', snapOff);
    }
    tiers.forEach(t => {
      if (l.r === 1 && t.id === 'a') return;
      const on = Math.max(l.r === 1 ? 0 : l.on + 0.2, riseAt(t.from));
      const off = Math.min(l.r === 1 ? loopLength : l.off, fallAt(t.from));
      s.at(`tier-${l.r}-${t.id}`, 'opacity', on, 0.3, 0, 1, ease.linear);
      s.at(`tier-${l.r}-${t.id}`, 'opacity', off - 0.3, 0.3, 1, 0, ease.linear);
    });
  });
  return s;
}

function control(): string {
  return `<div class="ls-panel"><div class="ls-head"><span class="ls-name">load</span><output class="ls-read">${load.min.toLocaleString('en-US')} req/s · ${minNodes} nodes</output></div><input class="ls-range" type="range" min="${load.min}" max="${load.max}" step="${load.step}" value="${load.min}" aria-label="Request load in requests per second"></div>`;
}

const scope = '[data-iso^="loadslider-"]';
const css = `${scope} .ls-panel{display:flex;flex-direction:column;gap:.55em;width:19em;box-sizing:border-box;padding:.75em .9em .8em;background:#1b1c22;border:1px solid rgb(255 255 255 / .1);border-radius:12px;box-shadow:0 14px 32px -18px rgb(0 0 0 / .8)}
${scope} .ls-head{display:flex;align-items:baseline;justify-content:space-between;gap:1em}
${scope} .ls-name{font-family:${fonts.mono};color:#a1a1aa}
${scope} .ls-read{font-family:${fonts.mono};font-variant-numeric:tabular-nums;color:#ccfbf1}
${scope} .ls-range{-webkit-appearance:none;appearance:none;width:100%;height:1.6em;margin:0;background:transparent;cursor:pointer;touch-action:none;--p:0}
${scope} .ls-range::-webkit-slider-runnable-track{height:.36em;border-radius:1em;background:linear-gradient(90deg,#2dd4bf calc(var(--p) * 100%),#3f3f46 0)}
${scope} .ls-range::-moz-range-track{height:.36em;border-radius:1em;background:linear-gradient(90deg,#2dd4bf calc(var(--p) * 100%),#3f3f46 0)}
${scope} .ls-range::-webkit-slider-thumb{-webkit-appearance:none;width:1.25em;height:1.25em;margin-top:-.445em;border-radius:50%;background:#f4f4f5;border:0;box-shadow:0 0 0 .3em rgb(45 212 191 / .18),0 2px 6px rgb(0 0 0 / .5);transition:box-shadow .2s cubic-bezier(.22,1,.36,1),scale .2s cubic-bezier(.22,1,.36,1)}
${scope} .ls-range::-moz-range-thumb{width:1.25em;height:1.25em;border-radius:50%;background:#f4f4f5;border:0;box-shadow:0 0 0 .3em rgb(45 212 191 / .18),0 2px 6px rgb(0 0 0 / .5)}
${scope} .ls-range:hover::-webkit-slider-thumb{box-shadow:0 0 0 .4em rgb(45 212 191 / .26),0 2px 6px rgb(0 0 0 / .5)}
${scope} .ls-range:active::-webkit-slider-thumb{scale:1.1;box-shadow:0 0 0 .5em rgb(45 212 191 / .3),0 2px 6px rgb(0 0 0 / .5)}
${scope} .ls-range:focus{outline:none}
${scope} .ls-range:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 .2em #141519,0 0 0 .38em #2dd4bf}
${scope} .ls-range:focus-visible::-moz-range-thumb{box-shadow:0 0 0 .2em #141519,0 0 0 .38em #2dd4bf}
@media (prefers-reduced-motion:reduce){${scope} .ls-range::-webkit-slider-thumb{transition:none}}`;

function script(): string {
  const data = JSON.stringify({ names: Object.values(names), curve, rise, windows, load, perNode, minNodes, idleMs: 3000 });
  return `<script type="module">
const { names, curve, rise, windows, load, perNode, minNodes, idleMs } = ${data};
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const loadAt = (t) => {
  for (let i = 1; i < curve.length; i++) {
    const [t1, v1] = curve[i];
    const [t0, v0] = curve[i - 1];
    if (t <= t1) return t1 === t0 ? v1 : v0 + ((t - t0) / (t1 - t0)) * (v1 - v0);
  }
  return curve[curve.length - 1][1];
};
const timeFor = (v) => {
  const t = rise[0] + ((v - load.min) / (load.max - load.min)) * (rise[1] - rise[0]);
  const w = windows.find(([a, b]) => t > a && t < b);
  return w ? w[1] + 0.01 : t;
};
const nodesFor = (v) => Math.max(minNodes, Math.ceil(v / perNode - 1e-9));
const text = (v) => { const r = Math.round(v / load.step) * load.step; return r.toLocaleString('en-US') + ' req/s · ' + nodesFor(r) + ' nodes'; };
const bind = (root) => {
  if (root.dataset.lsBound) return;
  root.dataset.lsBound = '1';
  const range = root.querySelector('.ls-range');
  const read = root.querySelector('.ls-read');
  if (!range || !read) return;
  let active = false;
  let down = false;
  let idle = 0;
  let waiting = false;
  let cur = 0;
  let target = 0;
  let last = 0;
  let anims = null;
  let visible = false;
  let shown = -1;
  const handle = () => root.iso;
  const loopAnim = () => {
    const h = handle();
    if (!h) return null;
    if (!anims) {
      const all = root.getAnimations({ subtree: true });
      if (!all.length) return null;
      const timing = (a) => a.effect.getTiming();
      anims = { ambient: all.filter(a => timing(a).iterations === Infinity && timing(a).delay === 0), timed: all.filter(a => !(timing(a).iterations === Infinity && timing(a).delay === 0)), loop: all.find(a => timing(a).iterations === Infinity && timing(a).duration === h.spec.loop * 1000 && timing(a).delay > 0) };
    }
    return anims.loop;
  };
  const loopTime = () => {
    const h = handle();
    const a = loopAnim();
    if (!h || !a || a.currentTime === null) return 0;
    const t = Number(a.currentTime) / 1000 - h.spec.intro;
    return t < 0 ? 0 : t % h.spec.loop;
  };
  const show = (v) => {
    const r = Math.round(v / load.step) * load.step;
    if (r === shown) return;
    shown = r;
    read.textContent = text(r);
    range.style.setProperty('--p', String((v - load.min) / (load.max - load.min)));
    range.setAttribute('aria-valuetext', text(v));
  };
  const place = (t) => {
    const h = handle();
    if (!h || !anims) return;
    for (const a of anims.timed) a.currentTime = (h.spec.intro + t) * 1000;
  };
  const inView = () => {
    const r = root.getBoundingClientRect();
    return root.offsetParent !== null && r.bottom > 0 && r.top < innerHeight;
  };
  const resume = () => {
    const h = handle();
    if (!h || down || reduce.matches) return;
    active = false;
    waiting = !inView();
    if (!waiting) h.play();
  };
  const seen = new IntersectionObserver(entries => {
    visible = entries[entries.length - 1].isIntersecting;
    if (waiting && visible) resume();
  });
  seen.observe(root);
  const begin = () => {
    const h = handle();
    if (!h || !loopAnim()) return false;
    clearTimeout(idle);
    waiting = false;
    if (!active) {
      cur = timeFor(Math.round(loadAt(loopTime()) / load.step) * load.step);
      h.pause();
      if (!reduce.matches) for (const a of anims.ambient) a.play();
      active = true;
    }
    return true;
  };
  const later = () => {
    clearTimeout(idle);
    idle = setTimeout(resume, idleMs);
  };
  const onInput = () => {
    if (!begin()) return;
    const v = Number(range.value);
    target = timeFor(v);
    show(v);
    if (reduce.matches) cur = target;
    if (!down) later();
  };
  range.addEventListener('pointerdown', () => {
    down = true;
    if (begin()) target = cur;
  });
  const release = () => {
    if (!down) return;
    down = false;
    if (active) later();
  };
  range.addEventListener('pointerup', release);
  range.addEventListener('pointercancel', release);
  range.addEventListener('lostpointercapture', release);
  range.addEventListener('input', onInput);
  range.addEventListener('keyup', () => active && later());
  const frame = (now) => {
    if (!root.isConnected) {
      seen.disconnect();
      clearTimeout(idle);
      return;
    }
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (active) {
      cur += (target - cur) * (1 - Math.exp(-dt / 0.14));
      if (Math.abs(target - cur) < 0.002) cur = target;
      place(cur);
    } else if (visible && handle() && loopAnim()) {
      const v = loadAt(loopTime());
      if (Math.round(v / load.step) * load.step !== shown) range.value = String(Math.round(v / load.step) * load.step);
      show(v);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
};
const scan = () => {
  for (const name of names) for (const root of document.querySelectorAll('[data-iso="' + name + '"]')) bind(root);
};
scan();
new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
</script>`;
}

export const example: Example = {
  slug: 'load-slider',
  title: 'Scale with load',
  ask: 'Show the cluster growing and shrinking with load.',
  story: 'Request load climbs and falls on its own, nodes drop into the field as it rises and leave as it falls while traffic on the lanes thickens; drag the slider to set the load yourself.',
  prompt: 'Draw a field of server nodes behind an ingress with a real load slider: dragging it raises the requests per second, nodes drop in as load rises and leave as it falls, traffic thickens, and the scene sweeps the load by itself when nobody touches it.',
  level: 'complex',
  intent: 'scale',
  layout: 'field',
  useCase: 'Scaling',
  surface: 'dark',
  interaction: 'drag',
  art: art(
    build({ name: names.compact, width: 390, height: 450, origin: [214, 294], k: 0.86, minPx: narrowest, panel: { x: 195, y: 92, anchor: 'center' } }),
    build({ name: names.wide, width: 1100, height: 520, origin: [640, 290], k: 1.35, minPx: 521, panel: { x: 60, y: 90, anchor: 'left' } }),
    520,
    `<style>${css}</style>${script()}`,
  ),
};

export default page(example);
