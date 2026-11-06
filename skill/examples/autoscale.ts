import { Scene, ease, type Material, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, page, paints, ramps, surfaces, type Example, narrowest } from './shared';

const ui = surfaces.light;
const accent = '#7c3aed';
const line = 'rgb(22 23 27 / .16)';
const shift = 'cubic-bezier(.49,.19,.28,.81)';
const snapOff = 'cubic-bezier(.45,.86,.17,.96)';
const redraw = 'cubic-bezier(.31,.12,.03,.72)';
const fill = 'cubic-bezier(.32,.5,.06,1)';
const exit = 'linear(0, -0.007 11.8%, -0.045 37.8%, -0.048 57%, -0.028 63.2%, 0.018 69.3%, 0.079 74.3%, 0.164 79.3%, 0.27 84%, 0.392 88.3%, 0.459 90.3%, 0.535 92.3%, 0.609 94%, 0.694 95.8%, 0.777 97.3%, 0.859 98.5%, 0.942 99.5%, 1)';

const pitch = 130;
const two = [-pitch / 2, pitch / 2] as const;
const three = [-pitch, 0, pitch] as const;
const out = { retract: 3.1, pan: 3.3, drop: 4.15, draw: 4.6 } as const;
const back = { retract: 8.3, exit: 8.5, pan: 9.05, draw: 10.15 } as const;
const panFor = 1.4;

type Pool = 'two' | 'three';
const traffic: readonly { pool: Pool; t: number }[] = [
  ...[0.15, 0.85, 1.4, 1.85, 2.2, 2.5, 2.75].map(t => ({ pool: 'two' as const, t })),
  ...[5.0, 5.3, 5.6, 5.9, 6.3, 6.7, 7.2, 7.8].map(t => ({ pool: 'three' as const, t })),
  ...[10.55, 10.95].map(t => ({ pool: 'two' as const, t })),
];
const loads = [
  { t: 0.2, dur: 2.6, from: 14, to: 62 },
  { t: 5.2, dur: 1.4, from: 62, to: 38 },
  { t: 7.0, dur: 1.6, from: 38, to: 14 },
] as const;

function build(name: string, width: number, height: number, origin: readonly [number, number], k: number, minPx: number) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const lb: Vec3 = [-180 * k, 0, 0];
  const lbSize = 96 * k;
  const nodeX = 70 * k;
  const nodeSize = 84 * k;
  const bend = -55 * k;
  const z = -10 * k;
  const pan = s.offset([0, 0, 0], [0, (-pitch / 2) * k, 0]);
  const meter: Vec3 = [lb[0] - 20 * k, lb[1] + 140 * k, 0];
  const wireTo = (id: string, y: number) => {
    const from = lb[0] + lbSize / 2;
    const to = nodeX - nodeSize / 2;
    const points: Vec3[] = y === 0 ? [[from, 0, z], [to, 0, z]] : [[from, 0, z], [bend, 0, z], [bend, y * k, z], [to, y * k, z]];
    s.wire({ id, points, stroke: ui.wire, width: 1.25, hidden: true });
    [0, 1, 2].forEach(j => s.pulse({ id: `${id}-p${j}`, wire: id, color: accent, length: 0.14 }));
  };
  two.forEach((y, i) => wireTo(`w2-${i}`, y));
  three.forEach((y, i) => wireTo(`w3-${i}`, y));

  const box = (id: string, at: Vec3, size: number, h: number, side = paints.brushed(s, ramps.silver)) =>
    s.slab({ id, at, size: [size, size], height: h, radius: size * 0.17, top: ui.top, side, grain: 0.05, edge: ui.edge, outline: line });

  s.group('meter', () => {
    box('meter-base', meter, 56 * k, 8 * k);
    s.prism({ id: 'meter-bar', at: meter, size: [28 * k, 28 * k], height: loads[0].from * k, reach: 64 * k, radius: 6 * k, top: '#ede9fe', side: ['#7c3aed', '#a78bfa'], stroke: 'rgb(91 33 182 / .35)' });
    s.text({ id: 'meter-name', at: [meter[0], meter[1] + 22 * k, 0], text: 'load', size: 10, color: ui.muted, on: 'top', anchor: 'middle' });
  });

  s.group('lb', () => {
    box('lb-slab', lb, lbSize, 26 * k, paints.gradient(s, ramps.violet));
    s.face({ id: 'lb-glow', at: lb, size: [lbSize, lbSize], radius: lbSize * 0.17, fill: 'rgb(139 92 246 / .16)' });
    s.text({ id: 'lb-name', at: [lb[0] + lbSize / 2 - 14 * k, 0, 0], text: 'balancer', size: 11, color: '#6d28d9', on: 'top', along: 'y', anchor: 'middle' });
  });

  const nodeIn = (id: string, at: Vec3, side?: Material) => {
    s.group(id, () => {
      box(`${id}-slab`, at, nodeSize, 22 * k, side);
      s.face({ id: `${id}-hit`, at, size: [nodeSize, nodeSize], radius: nodeSize * 0.17, fill: 'rgb(139 92 246 / .16)' });
    });
  };
  s.group('row', () => two.forEach((y, i) => nodeIn(`node-${i}`, [nodeX, y * k, 0])));
  const fresh: Vec3 = [nodeX, pitch * k, 0];
  nodeIn('node-new', fresh, paints.stripes(s, ramps.violet, 3));
  s.pivot('node-new', [fresh[0], fresh[1], -22 * k]);

  const [lx, ly] = s.project([nodeX, pitch * k, 0]);
  const up = 'nodes 2 → 3';
  const down = 'nodes 3 → 2';
  const labelAt = { screen: [fitX(lx, up, width, minPx, 'center'), ly + 52 * k] } as const;
  s.label({ id: 'scale-up', at: labelAt, text: up, size: 13, anchor: 'top' });
  s.label({ id: 'scale-down', at: labelAt, text: down, size: 13, anchor: 'top' });

  s.dropIn('lb', 0.1);
  s.dropIn('meter', 0.18);
  two.forEach((_, i) => s.dropIn(`node-${i}`, 0.3 + i * 0.083));
  two.forEach((_, i) => s.draw(`w2-${i}`, 0.9 + i * 0.05, 0.3, ease.out, 'intro'));

  s.loop(12.5, 6.2);
  loads.forEach(l => s.heightTo('meter-bar', l.t, l.dur, l.from * k, l.to * k, fill));

  const busy = new Map<string, number>();
  const lit = new Map<string, number>();
  const flash = (id: string, t: number) => {
    if ((lit.get(id) ?? -1) > t) return;
    s.at(id, 'opacity', t, 0.1, 0, 1, ease.linear).at(id, 'opacity', t + 0.1, 0.6, 1, 0, ease.linear);
    lit.set(id, t + 0.7);
  };
  const turn = { two: 0, three: 0 };
  traffic.forEach(({ pool, t }) => {
    const n = pool === 'two' ? 2 : 3;
    const i = turn[pool]++ % n;
    const wire = `${pool === 'two' ? 'w2' : 'w3'}-${i}`;
    const dur = Math.max(0.3, s.wireLength(wire) / 270);
    const j = [0, 1, 2].find(j => (busy.get(`${wire}-p${j}`) ?? -1) <= t);
    if (j === undefined) throw new Error(`autoscale: no free pulse on ${wire} at ${t}s`);
    busy.set(`${wire}-p${j}`, t + dur + 0.01);
    s.travel(`${wire}-p${j}`, t, dur);
    flash('lb-glow', t - 0.1);
    const target = pool === 'three' && i === 2 ? 'node-new' : `node-${i}`;
    flash(`${target}-hit`, t + dur);
  });

  two.forEach((_, i) => {
    s.retract(`w2-${i}`, out.retract + i * 0.04, 0.23, 'start', snapOff);
    s.draw(`w2-${i}`, back.draw + i * 0.05, 0.37, redraw);
  });
  three.forEach((_, i) => {
    s.draw(`w3-${i}`, out.draw + i * 0.05, 0.37, redraw);
    s.retract(`w3-${i}`, back.retract + i * 0.04, 0.23, 'start', snapOff);
  });
  s.at('row', 'translate', out.pan, panFor, '0 0', pan, shift);
  s.at('row', 'translate', back.pan, panFor, pan, '0 0', shift);
  s.dropAt('node-new', out.drop, 75 * k);
  s.at('node-new', 'scale', back.exit, 0.745, 1, 0, exit);
  s.set('node-new', 'opacity', back.exit + 0.8, 0);
  s.set('node-new', 'scale', back.exit + 0.9, 1);

  s.at('scale-up', 'opacity', 2.95, 0.3, 0, 1, ease.out);
  s.at('scale-up', 'translate', 2.95, 0.45, '0 6px', '0 0', ease.out);
  s.at('scale-up', 'opacity', 8.0, 0.25, 1, 0, ease.linear);
  s.at('scale-down', 'opacity', 8.0, 0.25, 0, 1, ease.linear);
  s.at('scale-down', 'opacity', back.pan + 0.4, 0.35, 1, 0, ease.linear);
  return s;
}

export const example: Example = {
  slug: 'autoscale',
  title: 'Autoscale on load',
  story: 'As load climbs a third node drops into the row and takes its share of traffic, then leaves again once load falls.',
  prompt: 'Draw a load balancer feeding two nodes while a load meter rises; a third node drops into the row, traffic spreads across all three, and it leaves when load falls.',
  level: 'medium',
  category: 'infra',
  useCase: 'Scaling',
  surface: 'light',
  interaction: 'watch',
  art: art(build('autoscale-sm', 390, 380, [232, 182], 0.8, narrowest), build('autoscale-lg', 720, 400, [378, 186], 1, 521), 520),
};

export default page(example);
