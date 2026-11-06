import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fonts, page, ramps, surfaces, type Example, paints } from './shared';

const ui = surfaces.dark;
const accent = '#34d399';
const shift = 'cubic-bezier(.49,.19,.28,.81)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';

const slots = 6;
const workers = [-118, 0, 118] as const;
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

function build(name: string, width: number, height: number, origin: readonly [number, number], k: number) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const pitch = 54 * k;
  const trayLen = pitch * slots + 14 * k;
  const tray: Vec3 = [0, 0, 0];
  const slotAt = (i: number): Vec3 => [trayLen / 2 - 7 * k - pitch * (i + 0.5), 0, 0];
  const producer: Vec3 = [slotAt(slots - 1)[0], -130 * k, 0];
  const ws = 66 * k;
  const wx = trayLen / 2 + 130 * k;
  const busZ = -8 * k;
  const busX = trayLen / 2 + 50 * k;
  const jobSize = 38 * k;
  const jobZ = 10 * k;

  s.wire({ id: 'feed', points: [[producer[0], producer[1] + 32 * k, busZ], [producer[0], -35 * k, busZ]], stroke: ui.wire, width: 1.25 });
  s.pulse({ id: 'p-feed', wire: 'feed', color: '#d4d4d8', length: 0.3 });
  workers.forEach((y, i) => {
    const points: Vec3[] = y === 0 ? [[trayLen / 2, 0, busZ], [wx - ws / 2, 0, busZ]] : [[trayLen / 2, 0, busZ], [busX, 0, busZ], [busX, y * k, busZ], [wx - ws / 2, y * k, busZ]];
    s.wire({ id: `w${i}`, points, stroke: ui.wire, width: 1.25 });
    s.pulse({ id: `p${i}`, wire: `w${i}`, color: accent, length: 0.2 });
    s.wire({ id: `back${i}`, points: [...points].reverse(), stroke: 'transparent' });
    s.pulse({ id: `ack${i}`, wire: `back${i}`, color: '#d4d4d8', length: 0.12, width: 1.5 });
  });

  s.slab({ id: 'producer', at: producer, size: [64 * k, 64 * k], height: 22 * k, radius: 12 * k, top: ui.top, side: paints.brushed(s, ramps.graphite), grain: 0.06, edge: ui.edge });
  s.text({ id: 'producer-name', at: producer, text: 'api', size: 11, color: '#a1a1aa', on: 'top', anchor: 'middle' });

  s.slab({ id: 'tray', at: tray, size: [trayLen, 70 * k], height: 14 * k, radius: 14 * k, top: '#18191e', side: paints.brushed(s, ramps.graphite), grain: 0.05, edge: ui.edge });
  for (let i = 0; i < slots; i++) s.face({ id: `slot-${i}`, at: slotAt(i), size: [jobSize + 6 * k, jobSize + 6 * k], radius: 8 * k, stroke: 'rgb(255 255 255 / .14)', dash: '3 3' });

  s.group('jobs', () => {
    for (let i = peak - 1; i >= 0; i--) {
      const at = slotAt(i);
      s.slab({ id: `job-${i}`, at: [at[0], at[1], jobZ], size: [jobSize, jobSize], height: 10 * k, radius: 8 * k, top: '#2a2b32', side: { kind: 'flat', color: '#52525b' }, grain: 0.05, edge: 'rgb(255 255 255 / .2)' });
    }
  });

  workers.forEach((y, i) => {
    const at: Vec3 = [wx, y * k, 0];
    s.group(`worker-${i}`, () => {
      s.slab({ id: `wk-${i}`, at, size: [ws, ws], height: 26 * k, radius: 13 * k, top: ui.top, side: paints.brushed(s, ramps.graphite), grain: 0.06, edge: ui.edge });
      s.slab({ id: `wk-hot-${i}`, at, size: [ws, ws], height: 26 * k, radius: 13 * k, top: '#17231f', side: paints.gradient(s, ramps.emerald), grain: 0.06, edge: 'rgb(52 211 153 / .45)' });
      s.text({ id: `wk-name-${i}`, at: [at[0] + 20 * k, at[1] + 20 * k, 0], text: `w${i + 1}`, size: 10, color: '#a1a1aa', on: 'top', anchor: 'middle' });
    });
    s.slab({ id: `held-${i}`, at: [at[0], at[1], jobZ + 2 * k], size: [jobSize, jobSize], height: 10 * k, radius: 8 * k, top: '#1d3a30', side: { kind: 'flat', color: '#047857' }, grain: 0.05, edge: 'rgb(52 211 153 / .6)' });
  });

  const depthAt: Vec3 = [tray[0] + 40 * k, tray[1] + 135 * k, 0];
  for (let d = 0; d <= peak; d++) {
    s.label({ id: `depth-${d}`, at: depthAt, html: `<span style="color:${ui.muted}">queued</span> <b style="font-weight:500;color:${d ? ui.ink : ui.muted}">${d}</b>`, size: 13, anchor: 'center' });
  }

  s.dropIn('producer', 0.1);
  s.dropIn('tray', 0.18);
  workers.forEach((_, i) => s.dropIn(`worker-${i}`, 0.3 + i * 0.083));
  s.intro('depth-0', 'opacity', 0.7, 0.3, 0, 1, ease.out);

  const feedDur = Math.max(0.3, s.wireLength('feed') / 270);
  const slide = s.offset([0, 0, 0], [pitch, 0, 0]);
  const showDepth = (t: number, from: number, to: number) => {
    s.set(`depth-${from}`, 'opacity', t, 0);
    s.set(`depth-${to}`, 'opacity', t, 1);
  };
  const busyUntil = workers.map(() => 0);
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
  story: 'Jobs pile up in the queue faster than they are taken, then three workers pull them off the front one by one until it is empty again.',
  prompt: 'Draw jobs arriving into a queue faster than they are handled, three workers pulling from the front, each glowing while it works and acking when done.',
  level: 'medium',
  category: 'infra',
  layout: 'wide',
  useCase: 'Queues',
  surface: 'dark',
  interaction: 'watch',
  art: art(build('qworkers-sm', 390, 440, [146, 226], 0.7), build('qworkers-lg', 720, 420, [300, 190], 0.92), 520),
};

export default page(example);
