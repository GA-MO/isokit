import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, rng, surfaces, type Example, type Ramp } from './shared';

const ui = surfaces.dark;
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const snapOff = 'cubic-bezier(.45,.86,.17,.96)';
const redraw = 'cubic-bezier(.31,.12,.03,.72)';

interface Cluster {
  id: 'a' | 'b' | 'c';
  centre: Vec2;
  ramp: Ramp;
  ink: string;
}

const probeFrom: Vec2 = [30, 25];
const clusters: readonly Cluster[] = [
  { id: 'a', centre: [-110, 25], ramp: ramps.violet, ink: '#c4b5fd' },
  { id: 'c', centre: [30, -115], ramp: ramps.amber, ink: '#fcd34d' },
  { id: 'b', centre: [30, 110], ramp: ramps.sky, ink: '#7dd3fc' },
];
const dist = (p: Vec2, q: Vec2) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const nearest = clusters.reduce((best, c) => (dist(c.centre, probeFrom) < dist(best.centre, probeFrom) ? c : best));
const spots: readonly Vec2[] = [[0, 0], [-27, -6], [14, -26], [24, 14], [-10, 26]];
const joinSpot: Vec2 = [-16, -30];

interface Point {
  cluster: Cluster;
  scatter: Vec2;
  home: Vec2;
}

function points(): Point[] {
  const r = rng(11);
  const scatter: Vec2[] = [];
  while (scatter.length < clusters.length * spots.length) {
    const p: Vec2 = [-135 + r() * 270, -135 + r() * 270];
    if (![probeFrom, ...scatter].some(q => dist(p, q) < 42)) scatter.push(p);
  }
  const homes = clusters.flatMap(c => spots.map(([dx, dy]) => ({ cluster: c, home: [c.centre[0] + dx, c.centre[1] + dy] as const })));
  const pairs = scatter.flatMap((p, i) => homes.map((h, j) => ({ i, j, d: dist(p, h.home) }))).sort((x, y) => x.d - y.d);
  const usedP = new Set<number>();
  const usedH = new Set<number>();
  const list: Point[] = [];
  for (const { i, j } of pairs) {
    if (usedP.has(i) || usedH.has(j)) continue;
    usedP.add(i);
    usedH.add(j);
    list.push({ cluster: homes[j]!.cluster, scatter: scatter[i]!, home: homes[j]!.home });
  }
  return list.sort((a, b) => a.home[0] + a.home[1] - (b.home[0] + b.home[1]));
}

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: readonly [number, number];
  k: number;
  minPx: number;
  label: 'side' | 'below';
}

const verdict = `nearest: cluster ${nearest.id}`;

function build(l: Layout) {
  const { k } = l;
  const s = new Scene({ name: l.name, width: l.width, height: l.height, origin: l.origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const plateSize = 330 * k;
  const top = 14 * k;
  const v = ([x, y]: Vec2, z = top): Vec3 => [x * k, y * k, z];
  const dot = 16 * k;
  const list = points();

  s.slab({ id: 'plate', at: [0, 0, 0], size: [plateSize, plateSize], height: top, radius: 34 * k, top: '#16171c', side: paints.brushed(s, ramps.graphite), grain: 0.06, edge: ui.edge });

  clusters.forEach(c => {
    s.face({ id: `ring-${c.id}`, at: v(c.centre), size: [86 * k, 86 * k], radius: 43 * k, stroke: c.ink, strokeWidth: 1, dash: '3 3' });
    s.text({ id: `ring-${c.id}-name`, at: v([c.centre[0] + 42, c.centre[1] + 42]), text: c.id, size: 12, color: c.ink, on: 'top', anchor: 'middle' });
    const dx = Math.sign(c.centre[0] - probeFrom[0]);
    const dy = Math.sign(c.centre[1] - probeFrom[1]);
    const end: Vec2 = [c.centre[0] - dx * 30, c.centre[1] - dy * 30];
    s.wire({ id: `probe-${c.id}`, points: [v([probeFrom[0] + dx * 14, probeFrom[1] + dy * 14]), v(end)], stroke: c === nearest ? c.ink : 'rgb(255 255 255 / .3)', width: 1.25, hidden: true });
  });

  list.forEach((p, i) => {
    const at = v(p.scatter);
    s.group(`pt-${i}`, () => {
      s.slab({ id: `pt-${i}-n`, at, size: [dot, dot], height: 7 * k, radius: 5 * k, top: '#2a2b33', side: paints.brushed(s, ramps.graphite), edge: 'rgb(255 255 255 / .18)' });
      s.slab({ id: `pt-${i}-c`, at, size: [dot, dot], height: 7 * k, radius: 5 * k, top: p.cluster.ramp[1], side: paints.gradient(s, p.cluster.ramp), edge: 'rgb(255 255 255 / .3)' });
    });
  });

  const fresh = v(probeFrom);
  s.group('new', () => {
    s.slab({ id: 'new-n', at: fresh, size: [dot * 1.25, dot * 1.25], height: 9 * k, radius: 6 * k, top: '#f4f4f5', side: paints.brushed(s, ramps.silver), edge: 'rgb(255 255 255 / .6)' });
    s.slab({ id: 'new-c', at: fresh, size: [dot * 1.25, dot * 1.25], height: 9 * k, radius: 6 * k, top: nearest.ramp[2], side: paints.gradient(s, nearest.ramp), edge: 'rgb(255 255 255 / .5)' });
  });

  const ring = s.project(v([nearest.centre[0] + 34, nearest.centre[1] - 34]));
  const front = s.project([plateSize / 2, plateSize / 2, 0]);
  const below = l.label === 'below';
  const anchor = below ? 'top' : 'left';
  s.label({
    id: 'verdict',
    at: { screen: below ? [fitX(ring[0] - 30 * k, verdict, l.width, l.minPx), front[1] + 22] : [fitX(ring[0] + 14 * k, verdict, l.width, l.minPx, 'left'), ring[1] + 6 * k] },
    html: `<span style="color:${ui.muted}">nearest:</span> <span style="color:${nearest.ink}">cluster ${nearest.id}</span>`,
    size: 13,
    anchor,
  });

  s.dropIn('plate', 0.1);
  list.forEach((_, i) => s.intro(`pt-${i}`, 'opacity', 0.45 + i * 0.03, 0.15, 0, 1, ease.linear));

  const lift = '0 -22px';
  list.forEach((p, i) => {
    const t = 0.3 + i * 0.03;
    const home = s.offset(v(p.scatter), v(p.home));
    s.at(`pt-${i}`, 'translate', t, 1.9, '0 0', home, settle);
    const tint = 1.9 + clusters.indexOf(p.cluster) * 0.18 + (i % 5) * 0.03;
    s.at(`pt-${i}-c`, 'opacity', tint, 0.4, 0, 1, ease.linear);
  });
  clusters.forEach((c, j) => {
    s.at(`ring-${c.id}`, 'opacity', 2.2 + j * 0.18, 0.4, 0, 1, ease.linear);
    s.at(`ring-${c.id}-name`, 'opacity', 2.3 + j * 0.18, 0.4, 0, 1, ease.linear);
  });

  s.dropAt('new', 3.2, 40 * k);
  clusters.forEach((c, j) => {
    s.draw(`probe-${c.id}`, 3.9 + j * 0.08, 0.37, redraw);
    if (c !== nearest) s.retract(`probe-${c.id}`, 4.6 + j * 0.05, 0.23, 'start', snapOff);
  });
  const move = 4.9;
  const join = s.offset(v(probeFrom), v([nearest.centre[0] + joinSpot[0], nearest.centre[1] + joinSpot[1]]));
  s.at('new', 'translate', move, 0.95, '0 0', join, settle);
  s.retract(`probe-${nearest.id}`, move, 0.8, 'end', settle);
  s.at('new-c', 'opacity', move + 0.6, 0.4, 0, 1, ease.linear);
  const shown = move + 1.0;
  s.at('verdict', 'opacity', shown, 0.25, 0, 1, ease.out);
  s.at('verdict', 'translate', shown, 0.45, '0 8px', '0 0', ease.out);

  const reset = shown + 2.4;
  s.at('verdict', 'opacity', reset, 0.3, 1, 0, ease.linear);
  clusters.forEach(c => {
    s.at(`ring-${c.id}`, 'opacity', reset, 0.3, 1, 0, ease.linear);
    s.at(`ring-${c.id}-name`, 'opacity', reset, 0.3, 1, 0, ease.linear);
  });
  s.at('new', 'opacity', reset, 0.3, 1, 0, ease.linear);
  s.set('new', 'translate', reset + 0.35, '0 0');
  s.set('new-c', 'opacity', reset + 0.35, 0);
  const back = reset + 0.5;
  list.forEach((p, i) => {
    const out = reset + 0.05 + i * 0.015;
    s.at(`pt-${i}`, 'opacity', out, 0.3, 1, 0, ease.linear);
    s.set(`pt-${i}-c`, 'opacity', back, 0);
    const home = s.offset(v(p.scatter), v(p.home));
    s.at(`pt-${i}`, 'translate', back, 0.001, home, lift, ease.linear);
    const t = back + 0.1 + i * 0.03;
    s.at(`pt-${i}`, 'opacity', t, 0.15, 0, 1, ease.linear);
    s.at(`pt-${i}`, 'translate', t, 0.5, lift, '0 0', ease.out);
  });
  s.loop(Math.round((back + 0.1 + list.length * 0.03 + 0.6) * 10) / 10, shown + 0.8);
  return s;
}

export const example: Example = {
  slug: 'embedding-clusters',
  title: 'Embeddings find clusters',
  story: 'Scattered vectors drift into three coloured clusters, then a new item drops in, measures the distance to each and joins the nearest.',
  prompt: 'Draw embedding vectors as small tiles scattered on a plate that drift into three coloured clusters, then a new item drops in and joins its nearest cluster.',
  level: 'medium',
  category: 'data',
  useCase: 'Vectors',
  surface: 'dark',
  interaction: 'watch',
  art: art(
    build({ name: 'embed-sm', width: 390, height: 400, origin: [195, 192], k: 0.76, minPx: narrowest, label: 'below' }),
    build({ name: 'embed-lg', width: 720, height: 400, origin: [360, 192], k: 1, minPx: 521, label: 'side' }),
    520,
  ),
};

export default page(example);
