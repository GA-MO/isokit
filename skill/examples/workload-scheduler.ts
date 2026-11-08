import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const accent = '#4f46e5';
const line = 'rgb(22 23 27 / .14)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const popIn = 'linear(0, 0.007 1.5%, 0.033 3.3%, 0.078 5%, 0.14 6.8%, 0.216 8.5%, 0.305 10.3%, 0.709 17.3%, 0.863 20.3%, 0.936 22%, 0.987 23.5%, 1.03 25.3%, 1.052 26.8%, 1.06 28.2%, 1.06 38.3%, 1.015 67.5%, 1)';
const shrink = 'cubic-bezier(.33,0,.91,.03)';

const capacity = 4;
const slots = [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const;
const nodes = [
  { id: 'a', y: -128, used: 2 },
  { id: 'b', y: 0, used: 1 },
  { id: 'c', y: 128, used: 4 },
] as const;
const arrivals = [0.3, 2.4, 4.5] as const;
const done = 7.4;

interface Placement {
  t: number;
  node: number;
  slot: number;
}

function schedule(): readonly Placement[] {
  const used: number[] = nodes.map(n => n.used);
  return arrivals.map(t => {
    const open = used.map((u, i) => ({ u, i })).filter(n => n.u < capacity);
    const pick = open.reduce((best, n) => (n.u < best.u ? n : best));
    const slot = used[pick.i]!;
    used[pick.i] = slot + 1;
    return { t, node: pick.i, slot };
  });
}

const placements = schedule();
const counts = nodes.map((n, i) => [n.used, ...placements.filter(p => p.node === i).map(p => p.slot + 1)]);
const tag = (node: number, used: number) => `node-${nodes[node]!.id} · ${used}/${capacity}`;

function build(name: string, width: number, height: number, origin: readonly [number, number], k: number, wide: boolean) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const sched: Vec3 = [-150 * k, 0, 0];
  const schedSize = 112 * k;
  const nodeX = 120 * k;
  const nodeSize = 100 * k;
  const block = 32 * k;
  const blockH = 14 * k;
  const gap = 22 * k;
  const z = -12 * k;
  const nodeAt = (i: number): Vec3 => [nodeX, nodes[i]!.y * k, 0];
  const slotAt = (i: number, slot: number, lift = 0): Vec3 => {
    const [dx, dy] = slots[slot]!;
    const at = nodeAt(i);
    return [at[0] + dx * gap, at[1] + dy * gap, blockH + lift];
  };
  const pending: Vec3 = [sched[0], sched[1], blockH];
  const blockSlab = (id: string, at: Vec3, fresh: boolean) =>
    s.slab({ id, at, size: [block, block], height: blockH, radius: 7 * k, top: fresh ? '#eef2ff' : '#f4f4f5', side: paints.gradient(s, fresh ? ramps.indigo : ramps.silver), grain: 0.06, edge: ui.edge, outline: fresh ? 'rgb(55 48 163 / .35)' : line });

  nodes.forEach((n, i) => {
    const y = n.y * k;
    const from = sched[0] + schedSize / 2;
    const to = nodeX - nodeSize / 2;
    const bend = -16 * k;
    const points: Vec3[] = y === 0 ? [[from, 0, z], [to, 0, z]] : [[from, 0, z], [bend, 0, z], [bend, y, z], [to, y, z]];
    s.wire({ id: `w-${n.id}`, points, stroke: ui.wire, width: 1.25 });
    s.pulse({ id: `p-${n.id}`, wire: `w-${n.id}`, color: accent, length: 0.16 });
  });

  s.slab({ id: 'sched', at: sched, size: [schedSize, schedSize], height: 28 * k, radius: 18 * k, top: ui.top, side: paints.gradient(s, ramps.indigo), grain: 0.08, edge: ui.edge, outline: 'rgb(55 48 163 / .35)' });
  s.face({ id: 'sched-glow', at: sched, size: [schedSize, schedSize], radius: 18 * k, fill: 'rgb(99 102 241 / .16)' });
  s.text({ id: 'sched-name', at: [sched[0] + schedSize / 2 - 15 * k, sched[1], 0], text: 'scheduler', size: 11, color: '#3730a3', on: 'top', along: 'y', anchor: 'middle' });

  nodes.forEach((n, i) => {
    const at = nodeAt(i);
    s.group(`node-${n.id}`, () => {
      s.slab({ id: `node-${n.id}-slab`, at, size: [nodeSize, nodeSize], height: 18 * k, radius: 15 * k, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.08, edge: ui.edge, outline: line });
      if (placements.some(p => p.node === i)) s.face({ id: `node-${n.id}-hit`, at, size: [nodeSize, nodeSize], radius: 15 * k, fill: 'rgb(99 102 241 / .12)', stroke: 'rgb(79 70 229 / .45)' });
      for (let slot = 0; slot < capacity; slot++) s.face({ id: `node-${n.id}-slot-${slot}`, at: slotAt(i, slot, -blockH), size: [block + 4 * k, block + 4 * k], radius: 8 * k, stroke: 'rgb(22 23 27 / .16)', dash: '6 4' });
      for (let slot = 0; slot < n.used; slot++) blockSlab(`node-${n.id}-job-${slot}`, slotAt(i, slot), false);
    });
  });

  placements.forEach((p, j) => {
    const at = slotAt(p.node, p.slot);
    s.group(`job-${j}`, () => blockSlab(`job-${j}-slab`, at, true));
    s.pivot(`job-${j}-slab`, [at[0], at[1], 0]);
  });

  const labelAt = (i: number) => {
    const [x, y] = s.project([nodeX + nodeSize / 2 + 16 * k, nodes[i]!.y * k - 16 * k, 0]);
    return [fitX(x, tag(i, capacity), width, 521, 'left'), y] as const;
  };
  if (wide) {
    counts.forEach((list, i) => list.forEach(used => s.label({ id: `cap-${i}-${used}`, at: { screen: labelAt(i) }, text: tag(i, used), size: 13, anchor: 'left' })));
  } else {
    const [x, y] = s.project([sched[0], sched[1], 0]);
    placements.forEach((p, j) => s.label({ id: `pick-${j}`, at: { screen: [fitX(x, tag(p.node, p.slot + 1), width, 300), y - 62 * k] }, text: tag(p.node, p.slot + 1), size: 13, anchor: 'bottom' }));
  }

  s.dropIn('sched', 0.1);
  s.dropIn('sched-name', 0.1);
  nodes.forEach((n, i) => s.dropIn(`node-${n.id}`, 0.25 + i * 0.083));
  if (wide) counts.forEach((_, i) => {
    s.intro(`cap-${i}-${counts[i]![0]}`, 'opacity', 0.7 + i * 0.08, 0.3, 0, 1, ease.out);
    s.intro(`cap-${i}-${counts[i]![0]}`, 'translate', 0.7 + i * 0.08, 0.4, '-8px 0', '0 0', ease.out);
  });

  s.loop(9, 6.4);
  placements.forEach((p, j) => {
    const n = nodes[p.node]!;
    const at = slotAt(p.node, p.slot);
    const move = `job-${j}`;
    const slab = `job-${j}-slab`;
    const go = p.t + 0.55;
    const land = go + 0.95;
    s.set(move, 'translate', p.t, s.offset(at, pending));
    s.at(slab, 'scale', p.t, 0.6, 0, 1, popIn);
    s.at('sched-glow', 'opacity', p.t + 0.1, 0.1, 0, 1, ease.linear);
    s.at('sched-glow', 'opacity', p.t + 0.2, 0.6, 1, 0, ease.linear);
    s.travel(`p-${n.id}`, go - 0.05, 0.9);
    s.at(move, 'translate', go, 0.95, s.offset(at, pending), '0 0', settle);
    s.at(slab, 'translate', go, 0.34, '0 0', `0 ${-30 * k}px`, ease.out);
    s.at(slab, 'translate', go + 0.34, 0.42, `0 ${-30 * k}px`, '0 0', ease.in);
    s.at(slab, 'scale', go + 0.76, 0.12, 1, '1.08 0.88', ease.out);
    s.at(slab, 'scale', go + 0.88, 0.3, '1.08 0.88', 1, ease.settle);
    s.at(`node-${n.id}-hit`, 'opacity', go + 0.8, 0.1, 0, 1, ease.linear);
    s.at(`node-${n.id}-hit`, 'opacity', go + 0.9, 0.6, 1, 0, ease.linear);
    s.at(slab, 'scale', done + j * 0.15, 0.5, 1, 0, shrink);
    if (wide) {
      const before = `cap-${p.node}-${p.slot}`;
      const after = `cap-${p.node}-${p.slot + 1}`;
      s.at(before, 'opacity', go + 0.8, 0.25, 1, 0, ease.linear);
      s.at(after, 'opacity', go + 0.8, 0.25, 0, 1, ease.linear);
    } else {
      s.at(`pick-${j}`, 'opacity', p.t + 0.1, 0.25, 0, 1, ease.out);
      s.at(`pick-${j}`, 'translate', p.t + 0.1, 0.4, '0 6px', '0 0', ease.out);
      s.at(`pick-${j}`, 'opacity', j === placements.length - 1 ? done : arrivals[j + 1]! - 0.2, 0.3, 1, 0, ease.linear);
    }
  });
  if (wide) counts.forEach((list, i) => {
    const first = list[0]!;
    const last = list[list.length - 1]!;
    if (first === last) return;
    const leave = done + Math.max(...placements.map((p, j) => (p.node === i ? j : 0))) * 0.15;
    s.at(`cap-${i}-${last}`, 'opacity', leave + 0.25, 0.25, 1, 0, ease.linear);
    s.at(`cap-${i}-${first}`, 'opacity', leave + 0.25, 0.25, 0, 1, ease.linear);
  });
  return s;
}

export const example: Example = {
  slug: 'workload-scheduler',
  title: 'Workload scheduler',
  ask: 'Show a scheduler placing work on the emptiest node.',
  story: 'A scheduler places each new workload on the node with the most room, skipping the full one, until the jobs finish.',
  prompt: 'Draw a scheduler placing small workload blocks onto three nodes, each block gliding to the least busy node with room while a capacity label counts up.',
  level: 'medium',
  intent: 'choose',
  layout: 'field',
  useCase: 'Orchestration',
  surface: 'light',
  interaction: 'watch',
  art: art(build('sched-sm', 390, 400, [176, 200], 0.74, false), build('sched-lg', 720, 400, [300, 186], 1, true), 520),
};

export default page(example);
