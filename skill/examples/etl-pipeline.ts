import { ISO_X, ISO_Y, Scene, ease, type Vec2, type Vec3 } from '../lib/iso.ts';
import { art, fonts, page, ramps, surfaces, type Example, fitX, narrowest, paints } from './shared.ts';

const ui = surfaces.light;
const accent = '#d97706';
const grey = 'rgb(22 23 27 / .28)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';

const sources = ['orders', 'events', 'crm'] as const;
const spawn = (n: number) => 0.4 + n * 1.3;
const pitch = 56;
const cells = [-1, 0, 1].flatMap(i => [-1, 0, 1].map(j => ({ i, j }))).sort((a, b) => a.i + a.j - (b.i + b.j) || a.i - b.i);

interface Layout {
  core: Vec2;
  house: Vec2;
  sources: readonly Vec2[];
  feeds: readonly (readonly Vec2[])[];
  route: readonly Vec2[];
  clean: { dx: number; dy: number; anchor: 'left' | 'right' | 'top' };
  store: { dx: number; dy: number; anchor: 'left' | 'right' | 'top' };
}

const srcSize = 58;
const coreSize = 112;
const houseSize = 196;

function column(core: Vec2, house: Vec2, route: readonly Vec2[]): Pick<Layout, 'core' | 'house' | 'sources' | 'feeds' | 'route'> {
  const x = core[0] - 168;
  const bend = core[0] - coreSize / 2 - 34;
  const sources = [0, 1, 2].map((n): Vec2 => [x, core[1] + (n - 1) * 84]);
  const feeds = sources.map((at, n): readonly Vec2[] => {
    const from: Vec2 = [at[0] + srcSize / 2, at[1]];
    const to: Vec2 = [core[0] - coreSize / 2, core[1]];
    return n === 1 ? [from, to] : [from, [bend, at[1]], [bend, core[1]], to];
  });
  return { core, house, sources, feeds, route };
}

const ground = ([sx, sy]: Vec2): Vec2 => [(sx / ISO_X + sy / ISO_Y) / 2, (sy / ISO_Y - sx / ISO_X) / 2];
const tip = (size: number, radius: number) => size * Math.SQRT1_2 - radius * (Math.SQRT2 - 1);

function strip(): Pick<Layout, 'core' | 'house' | 'sources' | 'feeds' | 'route'> {
  const row = [-400, -139, 300] as const;
  const bend = -290;
  const pitch = 64;
  const core = ground([row[1], 0]);
  const house = ground([row[2], 0]);
  const sources = [-1, 0, 1].map(n => ground([row[0], n * pitch]));
  const into = ground([row[1] - tip(coreSize, 20), 0]);
  const feeds = [-1, 0, 1].map((n): readonly Vec2[] => {
    const from = ground([row[0] + tip(srcSize, 12), n * pitch]);
    return n === 0 ? [from, into] : [from, ground([bend, n * pitch]), ground([bend, 0]), into];
  });
  const route = [ground([row[1] + tip(coreSize, 20), 0]), ground([row[2] - tip(houseSize, 24), 0])];
  return { core, house, sources, feeds, route };
}

function build(name: string, width: number, height: number, origin: readonly [number, number], k: number, l: Layout, textSize: number) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const coreAt: Vec3 = [l.core[0] * k, l.core[1] * k, 0];
  const houseAt: Vec3 = [l.house[0] * k, l.house[1] * k, -14 * k];
  const srcAt = (n: number): Vec3 => [l.sources[n]![0] * k, l.sources[n]![1] * k, -6 * k];

  l.feeds.forEach((feed, n) => {
    const z = -20 * k;
    s.wire({ id: `w-src-${n}`, points: feed.map(([x, y]): Vec3 => [x * k, y * k, z]), stroke: ui.wire, width: 1.25, hidden: true });
    s.pulse({ id: `q-${n}`, wire: `w-src-${n}`, color: accent, length: 0.2 });
  });
  sources.forEach((src, n) => {
    const at = srcAt(n);
    s.group(`src-${n}-g`, () => {
      s.slab({ id: `src-${n}`, at, size: [srcSize * k, srcSize * k], height: 14 * k, radius: 12 * k, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.05, edge: ui.edge, outline: 'rgb(22 23 27 / .14)' });
      s.face({ id: `src-${n}-glow`, at, size: [srcSize * k, srcSize * k], radius: 12 * k, fill: 'rgb(251 191 36 / .35)' });
      s.text({ id: `src-${n}-name`, at, text: src, size: textSize, color: ui.ink, on: 'top', anchor: 'middle' });
    });
  });
  s.wire({ id: 'w-load', points: l.route.map(([x, y]) => [x * k, y * k, -20 * k]), stroke: ui.wire, width: 1.25, hidden: true });
  sources.forEach((_, n) => s.pulse({ id: `p-${n}`, wire: 'w-load', color: accent, length: 0.18 }));

  s.group('core-g', () => {
    s.slab({ id: 'core', at: coreAt, size: [coreSize * k, coreSize * k], height: 34 * k, radius: 20 * k, top: ui.top, side: paints.gradient(s, ramps.amber), grain: 0.06, edge: ui.edge, outline: 'rgb(180 83 9 / .3)' });
    s.face({ id: 'core-glow', at: coreAt, size: [coreSize * k, coreSize * k], radius: 20 * k, fill: 'rgb(251 191 36 / .3)' });
    s.text({ id: 'core-name', at: [coreAt[0] + (coreSize / 2 - 14) * k, coreAt[1], 0], text: 'transform', size: textSize, color: '#b45309', on: 'top', along: 'y', anchor: 'middle' });
  });

  s.group('house-g', () => {
    s.slab({ id: 'house', at: houseAt, size: [houseSize * k, houseSize * k], height: 16 * k, radius: 24 * k, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.05, edge: ui.edge, outline: 'rgb(22 23 27 / .14)' });
    const cellAt = (c: { i: number; j: number }, z = 0): Vec3 => [houseAt[0] + (c.i * pitch - 8) * k, houseAt[1] + c.j * pitch * k, houseAt[2] + z];
    cells.forEach((c, n) => s.face({ id: `slot-${n}`, at: cellAt(c), size: [44 * k, 44 * k], radius: 8 * k, stroke: 'rgb(22 23 27 / .2)', dash: '3 3' }));
    cells.forEach((c, n) => s.slab({ id: `cell-${n}`, at: cellAt(c, 14 * k), size: [44 * k, 44 * k], height: 14 * k, radius: 8 * k, top: ui.top, side: paints.gradient(s, ramps.amber), grain: 0.05, edge: ui.edge, outline: 'rgb(180 83 9 / .3)' }));
  });

  const core2d = s.project(coreAt);
  const house2d = s.project(houseAt);
  s.label({ id: 'clean', at: { screen: [fitX(core2d[0] + l.clean.dx * k, 'dedupe · join', width, width > 720 ? 721 : narrowest, l.clean.anchor), core2d[1] + l.clean.dy * k] }, text: 'dedupe · join', size: 13, anchor: l.clean.anchor });
  s.label({ id: 'rows', at: { screen: [house2d[0] + l.store.dx * k, house2d[1] + l.store.dy * k] }, html: `warehouse <span style="color:${ui.muted}">· 2.4 M rows</span>`, size: 13, anchor: l.store.anchor });

  s.dropIn('house-g', 0.1);
  s.dropIn('core-g', 0.25);
  sources.forEach((_, n) => {
    s.dropIn(`src-${n}-g`, 0.35 + n * 0.083);
    s.draw(`w-src-${n}`, 0.9 + n * 0.083, 0.3, ease.out, 'intro');
  });
  s.draw('w-load', 0.85, 0.4, ease.out, 'intro');
  s.intro('clean', 'opacity', 0.6, 0.3, 0, 1, ease.out);
  s.intro('rows', 'opacity', 0.7, 0.3, 0, 1, ease.out);

  const wireDur = Math.max(0.35, s.wireLength('w-load') / 270);
  const feedDur = (n: number) => Math.max(0.35, s.wireLength(`w-src-${n}`) / 270);
  const full = spawn(2) + 0.1 + feedDur(2) + 0.2 + wireDur + 2 * 0.117 + 0.6;
  s.loop(10, Math.max(5.6, Math.round(full * 10) / 10));
  sources.forEach((_, n) => {
    const t = spawn(n);
    const feed = feedDur(n);
    s.at(`src-${n}-glow`, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at(`src-${n}-glow`, 'opacity', t + 0.1, 0.6, 1, 0, ease.linear);
    const at = srcAt(n);
    s.tug(`src-${n}-g`, t, s.offset(at, [at[0] + 6 * k, at[1], at[2]]));
    s.travel(`q-${n}`, t + 0.1, feed);
    const land = t + 0.1 + feed;
    s.at('core-glow', 'opacity', land, 0.1, 0, 1, ease.linear);
    s.at('core-glow', 'opacity', land + 0.1, 0.6, 1, 0, ease.linear);
    s.at('core-g', 'translate', land, 0.3, '0 0', '0 4px', pull);
    s.at('core-g', 'translate', land + 0.3, 0.6, '0 4px', '0 0', settle);
    s.travel(`p-${n}`, land + 0.2, wireDur);
    const arrive = land + 0.2 + wireDur;
    s.at('house-g', 'translate', arrive, 0.25, '0 0', '0 3px', pull);
    s.at('house-g', 'translate', arrive + 0.25, 0.6, '0 3px', '0 0', settle);
    [0, 1, 2].forEach(j => s.dropAt(`cell-${n * 3 + j}`, arrive + j * 0.117, 40 * k));
  });

  cells.forEach((_, n) => {
    const t = 8.6 + (cells.length - 1 - n) * 0.033;
    s.at(`cell-${n}`, 'opacity', t, 0.2, 1, 0, ease.linear);
    s.at(`cell-${n}`, 'translate', t, 0.2, '0 0', '0 6px', ease.in);
  });
  return s;
}

const arts = (tag = '') =>
  art(
    build(`etl-sm${tag}`, 390, 440, [190, 180], 0.72, { ...column([0, 0], [215, 215], [[56, 0], [215, 0], [215, 117]]), clean: { dx: -86, dy: 64, anchor: 'right' }, store: { dx: 0, dy: 118, anchor: 'top' } }, 10),
    build(`etl-lg${tag}`, 1260, 420, [630, 186], 1.15, { ...strip(), clean: { dx: 0, dy: 92, anchor: 'top' }, store: { dx: 0, dy: 106, anchor: 'top' } }, 12),
    720,
  );

export const example: Example = {
  slug: 'etl-pipeline',
  title: 'Rows into the warehouse',
  ask: 'Show rows from three sources landing in the warehouse.',
  story: 'Rows from three sources flow into a transform step that cleans and joins them, and each batch fills the warehouse.',
  prompt: 'Draw an ETL pipeline: three source tiles send rows along wires into a transform block that dedupes and joins them, then each batch loads into a warehouse grid that fills up and empties.',
  level: 'medium',
  intent: 'flow',
  layout: 'wide',
  useCase: 'Data',
  surface: 'light',
  interaction: 'watch',
  art: arts(),
};

export const inContext = arts('-ctx');

export default page(example);
