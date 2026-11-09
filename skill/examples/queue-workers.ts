import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fonts, n, page, ramps, surfaces, type Example, paints } from './shared';

const ui = surfaces.light;
const accent = '#059669';
const idle = '#71717a';
const line = 'rgb(22 23 27 / .14)';
const green = 'rgb(4 120 87 / .35)';
const shift = 'cubic-bezier(.49,.19,.28,.81)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';

const slots = 6;
const workerYs = [-118, 0, 118] as const;
const work = 1.25;

type Step = { kind: 'arrive'; t: number } | { kind: 'take'; t: number; worker: number };
const steps: readonly Step[] = [
  { kind: 'arrive', t: 0.2 },
  { kind: 'arrive', t: 0.6 },
  { kind: 'arrive', t: 1.0 },
  { kind: 'arrive', t: 1.4 },
  { kind: 'take', t: 1.9, worker: 1 },
  { kind: 'arrive', t: 2.75 },
  { kind: 'arrive', t: 3.15 },
  { kind: 'take', t: 3.6, worker: 0 },
  { kind: 'arrive', t: 4.45 },
  { kind: 'take', t: 4.9, worker: 2 },
  { kind: 'take', t: 5.75, worker: 1 },
  { kind: 'take', t: 6.6, worker: 0 },
  { kind: 'take', t: 7.45, worker: 2 },
  { kind: 'take', t: 8.3, worker: 1 },
];
const peak = steps.reduce((acc, st) => {
  const d = acc.d + (st.kind === 'arrive' ? 1 : -1);
  return { d, max: Math.max(acc.max, d) };
}, { d: 0, max: 0 }).max;

interface Geometry {
  slotAt: (i: number) => Vec3;
  slide: Vec3;
  producer: Vec3;
  feed: readonly Vec3[];
  workers: readonly Vec3[];
  routes: readonly (readonly Vec3[])[];
  depth: Vec3;
  tray: () => Scene;
}

function chain(s: Scene, k: number): Geometry {
  const pitch = 54 * k;
  const trayLen = pitch * slots + 14 * k;
  const slotAt = (i: number): Vec3 => [trayLen / 2 - 7 * k - pitch * (i + 0.5), 0, 0];
  const producer: Vec3 = [slotAt(slots - 1)[0], -130 * k, 0];
  const ws = 66 * k;
  const wx = trayLen / 2 + 130 * k;
  const busZ = -8 * k;
  const busX = trayLen / 2 + 50 * k;
  return {
    slotAt,
    slide: [pitch, 0, 0],
    producer,
    feed: [[producer[0], producer[1] + 32 * k, busZ], [producer[0], -35 * k, busZ]],
    workers: workerYs.map((y): Vec3 => [wx, y * k, 0]),
    routes: workerYs.map((y): Vec3[] => (y === 0 ? [[trayLen / 2, 0, busZ], [wx - ws / 2, 0, busZ]] : [[trayLen / 2, 0, busZ], [busX, 0, busZ], [busX, y * k, busZ], [wx - ws / 2, y * k, busZ]])),
    depth: [40 * k, 135 * k, 0],
    tray: () => s.slab({ id: 'tray', at: [0, 0, 0], size: [trayLen, 70 * k], height: 14 * k, radius: 14 * k, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.06, edge: ui.edge, outline: line }),
  };
}

const tip = (size: number, radius: number) => size * Math.SQRT1_2 - radius * (Math.SQRT2 - 1);

function strip(s: Scene, k: number): Geometry {
  const [ox, oy] = s.project([0, 0, 0]);
  const at = (x: number, y: number, z = 0): Vec3 => s.unproject([ox + x * k, oy + y * k], z);
  const pitch = 68;
  const half = (pitch * slots + 16) / 2;
  const busZ = -8 * k;
  const rows = [-92, 0, 92] as const;
  const bus = half + 70;
  const wx = bus + 60 + tip(66, 13);
  const px = -half - 80 - tip(64, 12);
  const route = (row: number): Vec3[] => (row === 0 ? [at(half, 0, busZ), at(wx - tip(66, 13), 0, busZ)] : [at(half, 0, busZ), at(bus, 0, busZ), at(bus, row, busZ), at(wx - tip(66, 13), row, busZ)]);
  return {
    slotAt: i => at(half - 8 - pitch * (i + 0.5), 0),
    slide: at(pitch, 0),
    producer: at(px, 0),
    feed: [at(px + tip(64, 12), 0, busZ), at(-half, 0, busZ)],
    workers: rows.map(row => at(wx, row)),
    routes: rows.map(route),
    depth: at(0, 70),
    tray: () => {
      const [ww, hh, r, ry, t] = [n(2 * half * k), n(40 * k), n(14 * k), n(14 * k * 0.58), n(14 * k)];
      const x = n(ox - ww / 2);
      const y = n(oy - hh / 2);
      const side = s.def('tray-side', `<linearGradient id="$ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ramps.silver[3]}"/><stop offset=".12" stop-color="${ramps.silver[2]}"/><stop offset="1" stop-color="${ramps.silver[0]}"/></linearGradient>`);
      return s.svg('tray', `<rect x="${x}" y="${n(y + t + 6 * k)}" width="${ww}" height="${hh}" rx="${r}" ry="${ry}" fill="#16171b" opacity=".12" filter="${s.blur(8)}"/><rect x="${x}" y="${n(y + t)}" width="${ww}" height="${hh}" rx="${r}" ry="${ry}" fill="${side}"/><rect x="${x}" y="${n(oy)}" width="${ww}" height="${t}" fill="${side}"/><rect x="${x}" y="${y}" width="${ww}" height="${hh}" rx="${r}" ry="${ry}" fill="${ui.top}" stroke="${line}" stroke-width="1"/>`);
    },
  };
}

function build(name: string, width: number, height: number, origin: readonly [number, number], k: number, layout: typeof chain) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const g = layout(s, k);
  const ws = 66 * k;
  const jobSize = 38 * k;
  const jobZ = 10 * k;

  s.wire({ id: 'feed', points: g.feed, stroke: ui.wire, width: 1.25, joins: ['producer', 'tray'] });
  s.pulse({ id: 'p-feed', wire: 'feed', color: idle, length: 0.3 });
  g.routes.forEach((points, i) => {
    const worker = [`wk-${i}`, `wk-hot-${i}`];
    s.wire({ id: `w${i}`, points, stroke: ui.wire, width: 1.25, joins: ['tray', worker] });
    s.pulse({ id: `p${i}`, wire: `w${i}`, color: accent, length: 0.2 });
    s.wire({ id: `back${i}`, points: [...points].reverse(), stroke: 'transparent', joins: [worker, 'tray'] });
    s.pulse({ id: `ack${i}`, wire: `back${i}`, color: idle, length: 0.12, width: 1.5 });
  });

  s.slab({ id: 'producer', at: g.producer, size: [64 * k, 64 * k], height: 22 * k, radius: 12 * k, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.06, edge: ui.edge, outline: line });
  s.text({ id: 'producer-name', at: g.producer, text: 'api', size: k > 1 ? 13 : 11, color: '#4b4e57', on: 'top', anchor: 'middle' });

  g.tray();
  for (let i = 0; i < slots; i++) s.face({ id: `slot-${i}`, at: g.slotAt(i), size: [jobSize + 6 * k, jobSize + 6 * k], radius: 8 * k, stroke: 'rgb(22 23 27 / .18)', dash: '3 3' });

  s.group('jobs', () => {
    for (let i = peak - 1; i >= 0; i--) {
      const at = g.slotAt(i);
      s.slab({ id: `job-${i}`, at: [at[0], at[1], jobZ], size: [jobSize, jobSize], height: 10 * k, radius: 8 * k, top: ramps.emerald[3], side: paints.gradient(s, ramps.emerald), grain: 0.05, edge: ui.edge, outline: green });
    }
  });

  g.workers.forEach((at, i) => {
    s.group(`worker-${i}`, () => {
      s.slab({ id: `wk-${i}`, at, size: [ws, ws], height: 26 * k, radius: 13 * k, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.06, edge: ui.edge, outline: line });
      s.slab({ id: `wk-hot-${i}`, at, size: [ws, ws], height: 26 * k, radius: 13 * k, top: '#ecfdf5', side: paints.gradient(s, ramps.emerald), grain: 0.06, edge: ui.edge, outline: green });
      s.text({ id: `wk-name-${i}`, at: [at[0] + 20 * k, at[1] + 20 * k, 0], text: `w${i + 1}`, size: k > 1 ? 12 : 10, color: '#4b4e57', on: 'top', anchor: 'middle' });
    });
    s.slab({ id: `held-${i}`, at: [at[0], at[1], jobZ + 2 * k], size: [jobSize, jobSize], height: 10 * k, radius: 8 * k, top: ramps.emerald[3], side: { kind: 'flat', color: '#059669' }, grain: 0.05, edge: ui.edge, outline: green });
  });

  for (let d = 0; d <= peak; d++) {
    s.label({ id: `depth-${d}`, at: g.depth, html: `<span style="color:${ui.muted}">queued</span> <b style="font-weight:500;color:${d ? ui.ink : ui.muted}">${d}</b>`, size: 13, anchor: 'center' });
  }

  s.dropIn('producer', 0.1);
  s.dropIn('tray', 0.18);
  g.workers.forEach((_, i) => s.dropIn(`worker-${i}`, 0.3 + i * 0.083));
  s.intro('depth-0', 'opacity', 0.7, 0.3, 0, 1, ease.out);

  const feedDur = Math.max(0.3, s.wireLength('feed') / 270);
  const slide = s.offset([0, 0, 0], g.slide);
  const showDepth = (t: number, from: number, to: number) => {
    s.set(`depth-${from}`, 'opacity', t, 0);
    s.set(`depth-${to}`, 'opacity', t, 1);
  };
  const busyUntil = g.workers.map(() => 0);
  let depth = 0;
  let end = 0;
  for (const step of steps) {
    if (step.kind === 'arrive') {
      if (depth === slots) throw new Error(`${name}: queue overflows at ${step.t}s`);
      s.travel('p-feed', step.t, feedDur);
      const land = step.t + feedDur - 0.05;
      s.dropAt(`job-${depth}`, land, 30 * k);
      showDepth(land + 0.2, depth, depth + 1);
      depth += 1;
      continue;
    }
    const w = step.worker;
    if (depth === 0) throw new Error(`${name}: worker ${w} takes from an empty queue at ${step.t}s`);
    const t = step.t;
    s.at('job-0', 'opacity', t, 0.25, 1, 0, ease.linear);
    s.at('job-0', 'translate', t, 0.3, '0 0', '0 -14px', ease.out);
    s.set('job-0', 'translate', t + 0.75, '0 0');
    s.at('jobs', 'translate', t + 0.15, 0.6, '0 0', slide, shift);
    s.set('jobs', 'translate', t + 0.75, '0 0');
    depth -= 1;
    if (depth > 0) {
      s.set('job-0', 'opacity', t + 0.75, 1);
      s.set(`job-${depth}`, 'opacity', t + 0.75, 0);
    }
    showDepth(t + 0.2, depth + 1, depth);

    const dur = Math.max(0.3, s.wireLength(`w${w}`) / 270);
    s.travel(`p${w}`, t + 0.05, dur);
    const got = t + 0.05 + dur;
    if (got < busyUntil[w]!) throw new Error(`${name}: worker ${w} is still busy at ${got}s`);
    s.dropAt(`held-${w}`, got - 0.1, 18 * k, 0.45);
    s.at(`wk-hot-${w}`, 'opacity', got, 0.3, 0, 1, ease.linear);
    s.at(`worker-${w}`, 'translate', got, 0.3, '0 0', '0 3px', pull);
    s.at(`worker-${w}`, 'translate', got + 0.3, 0.74, '0 3px', '0 0', settle);
    const done = got + work;
    s.at(`held-${w}`, 'opacity', done, 0.25, 1, 0, ease.linear);
    s.at(`held-${w}`, 'scale', done, 0.25, 1, 0.4, ease.in);
    s.set(`held-${w}`, 'scale', done + 0.3, 1);
    s.at(`wk-hot-${w}`, 'opacity', done, 0.5, 1, 0, ease.linear);
    s.travel(`ack${w}`, done + 0.1, dur);
    busyUntil[w] = done + 0.3;
    end = Math.max(end, done + 0.1 + dur, done + 0.5);
  }
  if (depth !== 0) throw new Error(`${name}: the loop ends with ${depth} jobs queued`);
  s.loop(Math.round((end + 0.4) * 10) / 10, 4.6);
  return s;
}

export const example: Example = {
  slug: 'queue-workers',
  title: 'Queue and workers',
  ask: 'Show workers draining a queue of jobs.',
  story: 'Jobs pile up in the queue faster than they are taken, then three workers pull them off the front one by one until it is empty again.',
  prompt: 'Draw jobs arriving into a queue faster than they are handled, three workers pulling from the front, each glowing while it works and acking when done.',
  level: 'medium',
  intent: 'scale',
  layout: 'wide',
  useCase: 'Queues',
  surface: 'light',
  interaction: 'watch',
  art: art(build('qworkers-sm', 390, 440, [146, 226], 0.7, chain), build('qworkers-lg', 1200, 400, [560, 190], 1.3, strip), 720),
};

export default page(example);
