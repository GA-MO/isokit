import { Scene, ease, type Vec3 } from '../lib/iso.ts';
import { art, fitX, fonts, page, paints, ramps, surfaces, type Example, narrowest } from './shared.ts';

const ui = surfaces.light;
const accent = '#0284c7';
const probe = '#71717a';
const bad = '#e11d48';
const good = '#047857';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const shift = 'cubic-bezier(.49,.19,.28,.81)';
const snapOff = 'cubic-bezier(.45,.86,.17,.96)';
const redraw = 'cubic-bezier(.31,.12,.03,.72)';

const nodes = [
  { id: 'a', y: -125 },
  { id: 'b', y: 0 },
  { id: 'c', y: 125 },
] as const;
const sick = 1;
const fail = { check: 3.4, retract: 4.2, out: 4.45 } as const;
const heal = { at: 7.0, back: 7.25, draw: 7.7 } as const;
const checks = [0.35, fail.check, 6.1, 9.0] as const;
const traffic = [1.25, 1.55, 1.85, 2.2, 2.5, 2.8, 4.7, 5.0, 5.3, 5.65, 6.75, 7.05, 8.3, 8.6, 8.9, 9.55, 9.85] as const;
const loopLength = 11.6;

const inPool = (i: number, t: number) => i !== sick || t < fail.retract || t > heal.draw + 0.37;

function build(name: string, width: number, height: number, origin: readonly [number, number], k: number, wide: boolean) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const lb: Vec3 = [-150 * k, 0, 0];
  const lbSize = 108 * k;
  const nodeX = 112 * k;
  const nodeSize = 86 * k;
  const nodeH = 22 * k;
  const z = -12 * k;
  const back = 40 * k;
  const nodeAt = (i: number): Vec3 => [nodeX, nodes[i]!.y * k, 0];

  nodes.forEach((n, i) => {
    const y = n.y * k;
    const from = lb[0] + lbSize / 2;
    const to = nodeX - nodeSize / 2;
    const bend = -24 * k;
    const points: Vec3[] = y === 0 ? [[from, 0, z], [to, 0, z]] : [[from, 0, z], [bend, 0, z], [bend, y, z], [to, y, z]];
    s.wire({ id: `w-${n.id}`, points, stroke: ui.wire, width: 1.25, hidden: true });
    s.pulse({ id: `ping-${n.id}`, wire: `w-${n.id}`, color: probe, length: 0.08, width: 1.5 });
    [0, 1].forEach(j => s.pulse({ id: `p-${n.id}-${j}`, wire: `w-${n.id}`, color: accent, length: 0.16 }));
  });

  s.group('lb', () => {
    s.slab({ id: 'lb-slab', at: lb, size: [lbSize, lbSize], height: 28 * k, radius: 18 * k, top: ui.top, side: paints.gradient(s, ramps.sky), grain: 0.06, edge: ui.edge });
    s.face({ id: 'lb-glow', at: lb, size: [lbSize, lbSize], radius: 18 * k, fill: 'rgb(14 165 233 / .18)' });
    s.text({ id: 'lb-name', at: [lb[0] + lbSize / 2 - 15 * k, 0, 0], text: 'balancer', size: 11, color: '#075985', on: 'top', along: 'y', anchor: 'middle' });
  });

  nodes.forEach((n, i) => {
    const at = nodeAt(i);
    const tile = { at, size: [nodeSize, nodeSize] as const, height: nodeH, radius: 15 * k, grain: 0.06 };
    s.group(`node-${n.id}-pos`, () =>
      s.group(`node-${n.id}`, () => {
        s.slab({ id: `node-${n.id}-slab`, ...tile, top: ui.top, side: paints.brushed(s, ramps.silver), edge: ui.edge });
        if (i === sick) {
          s.slab({ id: 'sick-bad', ...tile, top: '#fff1f2', side: paints.gradient(s, ramps.rose), edge: ui.edge, shadow: false });
          s.slab({ id: 'sick-ok', ...tile, top: '#ecfdf5', side: paints.gradient(s, ramps.emerald), edge: ui.edge, shadow: false });
        }
        s.face({ id: `node-${n.id}-hit`, at, size: [nodeSize, nodeSize], radius: 15 * k, fill: 'rgb(14 165 233 / .16)' });
        s.text({ id: `node-${n.id}-name`, at: [at[0] + nodeSize / 2 - 13 * k, at[1], 0], text: `node-${n.id}`, size: 10, color: '#52525b', on: 'top', along: 'y', anchor: 'middle' });
      }),
    );
  });

  const down = `node-${nodes[sick]!.id} · failing`;
  const up = `node-${nodes[sick]!.id} · healthy`;
  const pill = (color: string, text: string) => `<span style="color:${color}">●</span> ${text}`;
  const labelAt = (() => {
    if (wide) {
      const [cx, cy] = s.project([nodeX + nodeSize / 2, nodes[sick]!.y * k - nodeSize / 2, -nodeH / 2]);
      const x = cx + 16 * k;
      const y = cy;
      return { screen: [fitX(x, `● ${up}`, width, 521, 'left'), y] as const, anchor: 'left' as const };
    }
    const [x, y] = s.project([nodeX, nodes[2]!.y * k, 0]);
    return { screen: [fitX(x, `● ${up}`, width, narrowest), y + 62 * k] as const, anchor: 'top' as const };
  })();
  s.label({ id: 'down', at: { screen: labelAt.screen }, html: pill(bad, down), size: 13, anchor: labelAt.anchor });
  s.label({ id: 'up', at: { screen: labelAt.screen }, html: pill(good, up), size: 13, anchor: labelAt.anchor });

  s.dropIn('lb', 0.1);
  nodes.forEach((n, i) => s.dropIn(`node-${n.id}`, 0.28 + i * 0.083));
  nodes.forEach((n, i) => s.draw(`w-${n.id}`, 0.85 + i * 0.05, 0.3, ease.out, 'intro'));

  s.loop(loopLength, 5.4);
  const lit = new Map<string, number>();
  const flash = (id: string, t: number) => {
    if ((lit.get(id) ?? -1) > t) return;
    s.at(id, 'opacity', t, 0.1, 0, 1, ease.linear).at(id, 'opacity', t + 0.1, 0.6, 1, 0, ease.linear);
    lit.set(id, t + 0.7);
  };
  const dur = (i: number) => Math.max(0.3, s.wireLength(`w-${nodes[i]!.id}`) / 270);

  checks.forEach(t => {
    flash('lb-glow', t - 0.1);
    nodes.forEach((n, i) => {
      if (!inPool(i, t) && t !== fail.check) return;
      s.travel(`ping-${n.id}`, t, dur(i));
      if (!(i === sick && t === fail.check)) flash(`node-${n.id}-hit`, t + dur(i));
    });
  });

  const busy = new Map<string, number>();
  let turn = 0;
  traffic.forEach(t => {
    const pool = nodes.map((_, i) => i).filter(i => inPool(i, t));
    const i = pool[turn++ % pool.length]!;
    const n = nodes[i]!;
    const j = [0, 1].find(j => (busy.get(`p-${n.id}-${j}`) ?? -1) <= t);
    if (j === undefined) throw new Error(`health-check: no free pulse on w-${n.id} at ${t}s`);
    busy.set(`p-${n.id}-${j}`, t + dur(i) + 0.01);
    s.travel(`p-${n.id}-${j}`, t, dur(i));
    flash(`node-${n.id}-hit`, t + dur(i));
  });

  const sickId = `node-${nodes[sick]!.id}`;
  const hit = fail.check + dur(sick);
  s.at('sick-bad', 'opacity', hit, 0.25, 0, 1, ease.linear);
  s.at('down', 'opacity', hit + 0.05, 0.25, 0, 1, ease.out);
  s.at('down', 'translate', hit + 0.05, 0.4, '-8px 0', '0 0', ease.out);
  s.retract(`w-${nodes[sick]!.id}`, fail.retract, 0.23, 'start', snapOff);
  const away = s.offset([0, 0, 0], [back, 0, 0]);
  s.at(`${sickId}-pos`, 'translate', fail.out, 0.74, '0 0', away, settle);
  if (wide) s.at('down', 'translate', fail.out, 0.74, '0 0', away, settle);
  s.at(`${sickId}-pos`, 'opacity', fail.out, 0.5, 1, 0.42, ease.linear);

  s.at(`${sickId}-pos`, 'opacity', heal.at, 0.4, 0.42, 1, ease.linear);
  s.at('sick-ok', 'opacity', heal.at, 0.3, 0, 1, ease.linear);
  s.set('sick-bad', 'opacity', heal.at + 0.3, 0);
  s.at('down', 'opacity', heal.at, 0.25, 1, 0, ease.linear);
  s.at('up', 'opacity', heal.at, 0.25, 0, 1, ease.linear);
  s.at(`${sickId}-pos`, 'translate', heal.back, 0.82, away, '0 0', shift);
  if (wide) s.set('up', 'translate', heal.at, away).at('up', 'translate', heal.back, 0.82, away, '0 0', shift);
  s.draw(`w-${nodes[sick]!.id}`, heal.draw, 0.37, redraw);
  s.at(`${sickId}-pos`, 'translate', heal.draw + 0.4, 0.23, '0 0', '-4px -2px', ease.out);
  s.at(`${sickId}-pos`, 'translate', heal.draw + 0.88, 0.65, '-4px -2px', '0 0', settle);
  s.at('sick-ok', 'opacity', 9.4, 0.6, 1, 0, ease.linear);
  s.at('up', 'opacity', 9.7, 0.35, 1, 0, ease.linear);
  return s;
}

export const example: Example = {
  slug: 'health-check',
  title: 'Health checks',
  ask: 'Show a failing node leaving the pool and rejoining.',
  story: 'The balancer pings its nodes; one fails, drops out of the pool while traffic flows to the others, then recovers and rejoins.',
  prompt: 'Draw a load balancer health-checking three nodes: one fails and turns rose, its wire retracts and it slides out of the pool while traffic continues to the healthy ones, then it recovers and rejoins.',
  level: 'medium',
  intent: 'change',
  layout: 'radial',
  useCase: 'Reliability',
  surface: 'light',
  interaction: 'watch',
  art: art(build('health-sm', 390, 390, [176, 180], 0.74, false), build('health-lg', 720, 400, [300, 190], 1, true), 520),
};

export default page(example);
