import { ease, type Scene, type Vec2, type Vec3 } from '../../lib/iso.ts';
import { custom, edgeLight, layers } from '../materials-kit.ts';
import { rng, vertical } from '../shared.ts';
import { hidden } from './motion.ts';
import { block, link, piece, ui, type Story, type Variant } from './stage.ts';

const accent = '#7c3aed';
const unlit = 'rgb(124 58 237 / 0)';
const hit = 'rgb(124 58 237 / .32)';
const glow = 'rgb(124 58 237 / .16)';
const curve = { slide: 'cubic-bezier(.15,.6,.6,1)', shrink: 'cubic-bezier(.33,0,.91,.03)', snapOff: 'cubic-bezier(.45,.86,.17,.96)' } as const;

type Service = 'gateway' | 'queue' | 'db' | 'cache';
type Leaf = `${Service}-${'a' | 'b'}`;
type Node = 'core' | Service | Leaf;

const services: readonly Service[] = ['db', 'cache', 'queue', 'gateway'];
const leaves: readonly Leaf[] = services.flatMap(n => [`${n}-a`, `${n}-b`] as const);
const parent = (l: Leaf) => l.slice(0, l.lastIndexOf('-')) as Service;
const isLeaf = (n: Node): n is Leaf => n.includes('-');
const axis: Record<Service, Vec2> = { db: [0, -1], cache: [-1, 0], queue: [1, 0], gateway: [0, 1] };

const sizes: Record<Variant, { core: number; coreH: number; coreText: number; svc: number; svcH: number; svcText: number; ring: number; leaf: number; leafH: number; reach: number; spread: number; counter: { at: Vec2; size: number; anchor: 'start' | 'middle' | 'end' } }> = {
  wide: { core: 92, coreH: 40, coreText: 13, svc: 56, svcH: 20, svcText: 12, ring: 150, leaf: 34, leafH: 13, reach: 240, spread: 64, counter: { at: [696, 32], size: 15, anchor: 'end' } },
  compact: { core: 74, coreH: 32, coreText: 11, svc: 48, svcH: 17, svcText: 11, ring: 110, leaf: 28, leafH: 11, reach: 176, spread: 48, counter: { at: [195, 30], size: 14, anchor: 'middle' } },
};

const violetGlass = (s: Scene) => custom((_, a, t, band) => layers(a, t, vertical(s, 'violet-glass', band, [[0, '#f5f3ff'], [0.08, '#c4b5fd'], [0.4, '#8b5cf6'], [1, '#6d28d9']])) + edgeLight(a, t, band, 0.8, 1), 0.82);

function draw(s: Scene, v: Variant) {
  const k = sizes[v];
  const place = (n: Node): Vec2 => {
    if (n === 'core') return [0, 0];
    if (!isLeaf(n)) return [axis[n][0] * k.ring, axis[n][1] * k.ring];
    const [ax, ay] = axis[parent(n)];
    const side = n.endsWith('-a') ? -1 : 1;
    return [ax * k.reach + ay * side * k.spread, ay * k.reach + ax * side * k.spread];
  };
  const sizeOf = (n: Node) => (n === 'core' ? k.core : isLeaf(n) ? k.leaf : k.svc);
  const heightOf = (n: Node) => (n === 'core' ? k.coreH : isLeaf(n) ? k.leafH : k.svcH);
  const depth = (n: Node) => place(n)[0] + place(n)[1];
  const behindPerHeight = 1 / (2 * (s.project([1, 0, 0])[1] - s.project([0, 0, 0])[1]));
  const clear = (n: Node, dir: number) => sizeOf(n) / 2 + (dir < 0 ? Math.min(heightOf(n) * behindPerHeight, sizeOf(n) / 2) : 0);
  const route = (a: Node, b: Node): Vec3[] => {
    const [[ax, ay], [bx, by]] = [place(a), place(b)];
    const [sx, sy] = [Math.sign(bx - ax), Math.sign(by - ay)];
    if (Math.abs(by - ay) < 0.5) return [[ax + sx * clear(a, sx), ay, 0], [bx - sx * clear(b, -sx), by, 0]];
    if (Math.abs(bx - ax) < 0.5) return [[ax, ay + sy * clear(a, sy), 0], [bx, by - sy * clear(b, -sy), 0]];
    return Math.abs(bx - ax) > Math.abs(by - ay) ? [[ax + sx * clear(a, sx), ay, 0], [bx, ay, 0], [bx, by - sy * clear(b, -sy), 0]] : [[ax, ay + sy * clear(a, sy), 0], [ax, by, 0], [bx - sx * clear(b, -sx), by, 0]];
  };

  const flashed = new Map<string, number>();
  const flash = (id: string, t: number) => {
    if ((flashed.get(id) ?? -1) > t) return;
    flashed.set(id, t + 0.72);
    s.at(id, 'fill', t, 0.1, unlit, hit, ease.linear);
    s.at(id, 'fill', t + 0.1, 0.6, hit, unlit, ease.linear);
  };
  const busy = new Map<string, number>();
  const travel = (pulse: string, t: number, dur: number, back: boolean) => {
    busy.set(pulse, t + dur + 0.05);
    s.at(pulse, 'strokeDashoffset', t, dur, back ? -1.06 : 0.34, back ? 0.34 : -1.06, ease.linear);
  };
  const free = (pulse: string, t: number) => (busy.get(pulse) ?? -1) <= t;
  const hop = (wire: string) => Math.min(0.6, Math.max(0.3, s.wireLength(wire) / 300));
  const draw = (wire: string, t: number, dur: number, easing: string) => s.at(wire, 'strokeDashoffset', t, dur, hidden, 0, easing);
  const retract = (wire: string, t: number, dur: number, easing: string) => s.at(wire, 'strokeDashoffset', t, dur, 0, hidden, easing);

  const halo = s.def('o-halo-fill', '<radialGradient id="$ID"><stop offset="0" stop-color="#a78bfa" stop-opacity=".34"/><stop offset=".55" stop-color="#c4b5fd" stop-opacity=".12"/><stop offset="1" stop-color="#c4b5fd" stop-opacity="0"/></radialGradient>');
  piece(s, 'o-halo', () => s.face({ id: 'o-halo-face', at: [0, 0, 0], size: [k.ring * 2.4, k.ring * 2.4], radius: k.ring * 1.2, fill: halo }), 0.05);

  piece(s, 'o-links', () => {
    const links = services.flatMap(n => [['core', n], [n, `${n}-a`], [n, `${n}-b`]] as const);
    for (const [from, to] of links) link(s, { id: `o-w-${to}`, points: route(from, to), stroke: ui.wire, width: 1.25, joins: [from === 'core' ? 'o-core-box' : `o-${from}`, `o-${to}`] }, { pulse: { id: `o-p-${to}`, color: accent, length: isLeaf(to) ? 0.3 : 0.28, glow: false } });
  });

  const tile = {
    svc: block(s, 'o-svc', k.svc, k.svcH, 0.2, { top: ui.top, side: ['rgb(109 40 217 / .62)', 'rgb(167 139 250 / .5)'], edge: 'rgb(91 33 182 / .28)' }),
    leaf: block(s, 'o-leaf', k.leaf, k.leafH, 0.2, { top: '#faf8ff', side: ['rgb(109 40 217 / .5)', 'rgb(167 139 250 / .38)'], edge: 'rgb(91 33 182 / .24)' }),
  };
  const drawTile = (n: Service | Leaf) => {
    const [x, y] = place(n);
    const [size, h] = isLeaf(n) ? [k.leaf, k.leafH] : [k.svc, k.svcH];
    s.group(`o-g-${n}`, () => {
      s.svg(`o-${n}`, (isLeaf(n) ? tile.leaf : tile.svc)([x, y, h]));
      s.face({ id: `o-${n}-hit`, at: [x, y, h], size: [size, size], radius: size * 0.2, fill: unlit });
      if (!isLeaf(n)) s.text({ id: `o-${n}-name`, at: [x, y, h], text: n, size: k.svcText, color: '#4c1d95', on: 'top', along: 'y', anchor: 'middle', font: 'sans', weight: 500 });
    });
    s.pivot(`o-g-${n}`, [x, y, 0]);
  };
  for (const n of [...services].sort((a, b) => depth(a) - depth(b))) piece(s, `o-svc-${n}`, () => drawTile(n));

  piece(
    s,
    'o-core',
    () =>
      s.group('o-core-live', () => {
        s.slab({ id: 'o-core-box', at: [0, 0, k.coreH], size: [k.core, k.core], height: k.coreH, radius: k.core * 0.2, top: ui.top, side: violetGlass(s), edge: 'rgb(255 255 255 / .95)', outline: 'rgb(91 33 182 / .3)', shadow: false });
        s.face({ id: 'o-core-glow', at: [0, 0, k.coreH], size: [k.core, k.core], radius: k.core * 0.2, fill: unlit });
        s.face({ id: 'o-core-hit', at: [0, 0, k.coreH], size: [k.core, k.core], radius: k.core * 0.2, fill: unlit });
        s.text({ id: 'o-core-name', at: [0, 0, k.coreH], text: 'orders-api', size: k.coreText, color: '#5b21b6', on: 'top', along: 'y', anchor: 'middle', weight: 600 });
      }),
    0.1,
  );

  const clusters = [...services].sort((a, b) => depth(a) - depth(b));
  for (const n of clusters) {
    piece(s, `o-leaves-${n}`, () => {
      for (const l of [`${n}-a`, `${n}-b`] as const) drawTile(l);
    });
  }

  const c = k.counter;
  const counts = [
    { id: 'o-count-1', text: '1 node' },
    { id: 'o-count-5', text: '5 nodes' },
  ] as const;
  const liveText = '13 nodes · live';
  piece(s, 'o-count', () => {
    for (const n of counts) s.text({ id: n.id, at: { screen: c.at }, text: n.text, size: c.size, color: ui.muted, font: 'sans', anchor: c.anchor, weight: 500 });
    const width = [...liveText].length * c.size * 0.56;
    const pad = c.size * 0.7;
    const x = c.anchor === 'end' ? c.at[0] - width / 2 - pad : c.anchor === 'start' ? c.at[0] + width / 2 + pad : c.at[0];
    s.text({ id: 'o-count-live', at: { screen: [x, c.at[1]] }, text: liveText, size: c.size, color: '#047857', font: 'sans', weight: 500, pill: { fill: '#ecfdf5', stroke: 'rgb(5 150 105 / .35)', padX: pad, radius: c.size * 0.8 } });
  });

  const fade = (id: string, on: number, off: number) => {
    s.at(id, 'opacity', on, 0.25, 0, 1, ease.linear);
    s.at(id, 'opacity', off, 0.2, 1, 0, ease.linear);
  };
  s.intro('o-count-1', 'opacity', 0.5, 0.25, 0, 1, ease.linear);
  s.at('o-count-1', 'opacity', 0.3, 0.2, 1, 0, ease.linear);
  s.at('o-count-1', 'opacity', 6.5, 0.25, 0, 1, ease.linear);
  fade('o-count-5', 0.45, 2.2);
  fade('o-count-live', 2.35, 6.3);
  for (const n of [...services, ...leaves]) s.intro(`o-p-${n}`, 'opacity', 0, 0.01, 1, 1, ease.linear);

  const slideFrom = (n: Service) => s.offset([...place(n), 0], [0, 0, 0]);
  const slide = 0.355;
  services.forEach((n, i) => {
    const t = 0.05 + i * 0.05;
    s.set(`o-g-${n}`, 'opacity', t, 1);
    s.at(`o-g-${n}`, 'translate', t, slide, slideFrom(n), '0 0', curve.slide);
    draw(`o-w-${n}`, t + slide, 0.28, ease.out);
  });
  flash('o-core-hit', 0.62);
  services.forEach((n, i) => {
    const t = 0.75 + i * 0.08;
    const d = hop(`o-w-${n}`);
    travel(`o-p-${n}`, t, d, false);
    flash(`o-${n}-hit`, t + d);
  });
  leaves.forEach((n, i) => {
    const t = 1.35 + i * 0.1;
    s.at(`o-g-${n}`, 'scale', t, 0.23, 0.05, 1.14, ease.out);
    s.at(`o-g-${n}`, 'scale', t + 0.23, 0.24, 1.14, 1, ease.io);
    draw(`o-w-${n}`, t + 0.47, 0.25, ease.out);
    flash(`o-${n}-hit`, t + 0.72);
  });

  const r = rng(11);
  let turn = 0;
  for (let t = 2.5; t < 5.5; t += 0.55 + r() * 0.25) {
    const leaf = leaves[(turn * 3 + 1) % leaves.length]!;
    const svc = parent(leaf);
    const inbound = turn % 3 === 2;
    const [first, second] = inbound ? [leaf, svc] : [svc, leaf];
    const [d1, d2] = [hop(`o-w-${first}`), hop(`o-w-${second}`)];
    if (!free(`o-p-${first}`, t) || !free(`o-p-${second}`, t + d1)) continue;
    turn++;
    travel(`o-p-${first}`, t, d1, inbound);
    travel(`o-p-${second}`, t + d1 + 0.02, d2, inbound);
    flash(inbound ? 'o-core-hit' : `o-${leaf}-hit`, t + d1 + d2);
  }
  for (const at of [2.6, 4.4]) {
    s.at('o-core-glow', 'fill', at, 0.9, unlit, glow, ease.io);
    s.at('o-core-glow', 'fill', at + 0.9, 0.9, glow, unlit, ease.io);
  }

  const reset = 6.0;
  [...leaves].reverse().forEach((n, i) => {
    const t = reset + i * 0.04;
    retract(`o-w-${n}`, t, 0.23, curve.snapOff);
    s.at(`o-g-${n}`, 'scale', t + 0.23, 0.36, 1, 0, curve.shrink);
  });
  services.forEach((n, i) => {
    const t = reset + 0.55 + i * 0.05;
    retract(`o-w-${n}`, t, 0.23, curve.snapOff);
    s.at(`o-g-${n}`, 'translate', t + 0.23, slide, '0 0', slideFrom(n), curve.slide);
    s.set(`o-g-${n}`, 'opacity', t + 0.23 + slide + 0.02, 0);
  });
}

export const orders: Story = {
  slug: 'orders',
  label: 'Orders API',
  prompt: 'Show how our orders API scales',
  dir: '~/orders-api',
  file: 'orders-api.svg',
  beats: 'Storyboarding 1, 5, then 13 nodes',
  alt: 'One violet glass box, the orders API, grows into a system of 13 connected nodes with requests flowing through it',
  swatch: 'linear-gradient(135deg, #c4b5fd, #7c3aed)',
  enter: 0.9,
  loop: 7.4,
  peak: 5.0,
  still: 3.2,
  origin: { wide: [360, 222], compact: [195, 220] },
  draw,
};
