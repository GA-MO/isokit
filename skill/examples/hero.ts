import { ISO_X, ISO_Y, Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fonts, page, paints, ramps, rng, surfaces } from './shared';

const ui = surfaces.dark;
const accent = '#a78bfa';
const hit = 'rgb(167 139 250 / .5)';
const unlit = 'rgb(167 139 250 / 0)';
const glow = 'rgb(167 139 250 / .2)';
const liveInk = '#34d399';
const curve = {
  grow: 'cubic-bezier(.4,.1,.1,1)',
  spin: 'cubic-bezier(.8,.9,.3,1)',
  fall: 'cubic-bezier(.5,0,.4,1)',
  slide: 'cubic-bezier(.15,.6,.6,1)',
  shrink: 'cubic-bezier(.33,0,.91,.03)',
  snapOff: 'cubic-bezier(.45,.86,.17,.96)',
} as const;

const prompt = 'build an orders API for 1M users';
const stack = {
  sans: `${fonts.sans.replace(', sans-serif', '')}, -apple-system, 'Segoe UI', Roboto, sans-serif`,
  mono: `${fonts.mono.replace(', monospace', '')}, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace`,
};
const typeStep = 0.035;

type Service = 'gateway' | 'queue' | 'db' | 'cache';
type Leaf = 'cdn-a' | 'cdn-b' | 'auth' | 'worker-a' | 'worker-b' | 'worker-c' | 'replica-a' | 'replica-b' | 'shard-a' | 'shard-b';
type Node = 'core' | Service | Leaf;

const services: readonly Service[] = ['queue', 'db', 'gateway', 'cache'];
const parents: Record<Leaf, Service> = {
  'worker-a': 'queue',
  'worker-b': 'queue',
  'worker-c': 'queue',
  'replica-a': 'db',
  'replica-b': 'db',
  'cdn-b': 'gateway',
  'cdn-a': 'gateway',
  auth: 'gateway',
  'shard-a': 'cache',
  'shard-b': 'cache',
};
const leaves = Object.keys(parents) as Leaf[];
const isLeaf = (n: Node): n is Leaf => n in parents;

interface Place {
  at: Vec2;
  exit?: 'x' | 'y';
}

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: Vec2;
  core: { size: number; height: number; text: number; air: number };
  service: { size: number; height: number; text: number };
  leaf: { size: number; height: number };
  place: Record<Service | Leaf, Place>;
  pool: { at: Vec2; cols: number; rows: number; pitch: number; pod: number; empty: readonly number[]; from: Leaf };
  card: { x: number; y: number; w: number; h: number; text: number; head: number };
  feed: Vec2;
  ground: { at: Vec2; size: number; pitch: number };
}

const T = {
  hint: 0.3,
  type: 0.4,
  sent: 0.4 + prompt.length * typeStep + 0.25,
  spin: 2.55,
  crossfade: 3.55,
  lean: 3.8,
  fall: 4.1,
  landed: 4.73,
  slide: 5.25,
  pops: 6.7,
  pool: 9.6,
  live: 11.9,
  collapse: 17.9,
  end: 20,
  still: 15.5,
} as const;

const num = (v: number) => Number(v.toFixed(2));

function blocks(s: Scene, key: string, size: number, height: number, round: number, look: { top: string; side: readonly [dark: string, light: string]; edge: string }) {
  const [half, r] = [size / 2, size * round];
  const width = (half - r) * Math.SQRT2 + r;
  const square = (paint: string) => `<rect x="${-half}" y="${-half}" width="${size}" height="${size}" rx="${num(r)}" ${paint}/>`;
  const face = `scale(1 ${num(Math.tan(Math.PI / 6) * 1000) / 1000}) rotate(45)`;
  const split = `<stop offset=".5" stop-color="${look.side[0]}"/><stop offset=".5" stop-color="${look.side[1]}"/>`;
  const across = s.def(`${key}-across`, `<linearGradient id="$ID">${split}</linearGradient>`);
  const turned = s.def(`${key}-turned`, `<linearGradient id="$ID" gradientUnits="userSpaceOnUse" x1="${-half}" y1="${half}" x2="${half}" y2="${-half}">${split}</linearGradient>`);
  s.def(key, `<g id="$ID"><g transform="translate(0 ${height}) ${face}">${square(`fill="${turned}"`)}</g><rect x="${num(-width)}" width="${num(2 * width)}" height="${height}" fill="${across}"/><g transform="${face}">${square(`fill="${look.top}"`)}${square(`fill="none" stroke="${look.edge}" vector-effect="non-scaling-stroke"`)}</g></g>`);
  return (at: Vec3) => {
    const [x, y] = s.project(at);
    return `<use href="#${s.ref(key)}" x="${num(x)}" y="${num(y)}"/>`;
  };
}

function build(l: Layout) {
  const s = new Scene({ name: l.name, width: l.width, height: l.height, origin: l.origin, font: stack.sans, mono: stack.mono, label: ui.label });
  const flashed = new Map<string, number>();
  const flash = (id: string, t: number) => {
    if ((flashed.get(id) ?? -1) > t) return;
    flashed.set(id, t + 0.72);
    s.at(id, 'fill', t, 0.1, unlit, hit, ease.linear);
    s.at(id, 'fill', t + 0.1, 0.6, hit, unlit, ease.linear);
  };

  const ground = l.ground;
  const dots = s.def('ground-dots', `<pattern id="$ID" patternUnits="userSpaceOnUse" width="${ground.pitch}" height="${ground.pitch}"><circle cx="${ground.pitch / 2}" cy="${ground.pitch / 2}" r="1.1" fill="rgb(255 255 255 / .09)"/></pattern>`);
  const vignette = s.def('ground-vignette', `<radialGradient id="$ID"><stop offset=".35" stop-color="${ui.page}" stop-opacity="0"/><stop offset=".72" stop-color="${ui.page}"/></radialGradient>`);
  const groundAt = s.unproject(ground.at, 0);
  s.face({ id: 'ground', at: groundAt, size: [ground.size, ground.size], radius: 0, fill: dots });
  s.face({ id: 'ground-fade', at: groundAt, size: [ground.size * 1.02, ground.size * 1.02], radius: 0, fill: vignette });
  const card = l.card;
  const rect = (paint: string) => `<rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="12" ${paint}/>`;
  const dot = (fill: string) => `<circle cx="${card.x + 20}" cy="${card.y + 22}" r="3.5" fill="${fill}"/>`;
  s.svg('card', rect('fill="#16171c" stroke="rgb(255 255 255 / .1)"') + dot('#3f414b'));
  s.svg('card-hot', rect('fill="none" stroke="rgb(167 139 250 / .16)" stroke-width="6"') + rect(`fill="none" stroke="${accent}" stroke-opacity=".8"`) + dot(accent));
  s.text({ id: 'card-head', at: { screen: [card.x + 32, card.y + 22] }, text: 'prompt', size: card.head, color: ui.muted, font: 'sans', weight: 500 });
  const line: Vec2 = [card.x + 20, card.y + card.h - 26];
  s.text({ id: 'hint', at: { screen: line }, text: 'describe a system to build', size: card.text, color: '#5d606b' });
  s.text({ id: 'prompt', at: { screen: line }, text: prompt, size: card.text, color: ui.ink });
  const charW = card.text * 0.6;
  s.group('caret', () => s.svg('caret-blink', `<rect x="${line[0] + 1.5}" y="${line[1] - card.text * 0.62}" width="${Math.max(1.5, card.text * 0.09)}" height="${card.text * 1.24}" rx="1" fill="${accent}"/>`));
  s.ambient('caret-blink', 'opacity', 1.1, [1, 1, 0, 0, 1], 'steps(1, end)');

  const head: Vec2 = [card.x + card.w - 20, card.y + 22];
  const counts = [
    { id: 'count-1', text: '1 node', at: T.landed },
    { id: 'count-5', text: '5 nodes', at: T.slide + 0.3 },
    { id: 'count-15', text: '15 nodes', at: T.pops + 1.3 },
  ] as const;
  counts.forEach(c => s.text({ id: c.id, at: { screen: head }, text: c.text, size: card.head, color: ui.muted, font: 'sans', anchor: 'end' }));
  const liveText = '40 nodes · live';
  const pad = card.head * 0.7;
  s.text({ id: 'count-live', at: { screen: [head[0] + 6 - pad - (liveText.length * card.head * 0.6) / 2, head[1]] }, text: liveText, size: card.head, color: liveInk, pill: { fill: 'rgb(52 211 153 / .1)', stroke: 'rgb(52 211 153 / .32)', padX: pad, radius: card.head * 0.8 } });

  const placeOf = (n: Node): Vec2 => (n === 'core' ? [0, 0] : l.place[n].at);
  const sizeOf = (n: Node) => (n === 'core' ? l.core.size : isLeaf(n) ? l.leaf.size : l.service.size);
  const heightOf = (n: Node) => (n === 'core' ? l.core.height : isLeaf(n) ? l.leaf.height : l.service.height);
  const route = (a: Node, b: Service | Leaf): Vec3[] => {
    const [ax, ay] = placeOf(a);
    const [bx, by] = placeOf(b);
    const [ar, br] = [sizeOf(a) / 2 + 2, sizeOf(b) / 2 + 2];
    const [sx, sy] = [Math.sign(bx - ax), Math.sign(by - ay)];
    if (Math.abs(by - ay) < 0.5) return [[ax + sx * ar, ay, 0], [bx - sx * br, by, 0]];
    if (Math.abs(bx - ax) < 0.5) return [[ax, ay + sy * ar, 0], [bx, by - sy * br, 0]];
    const exit = l.place[b].exit ?? (Math.abs(bx - ax) >= Math.abs(by - ay) ? 'x' : 'y');
    return exit === 'x' ? [[ax + sx * ar, ay, 0], [bx, ay, 0], [bx, by - sy * br, 0]] : [[ax, ay + sy * ar, 0], [ax, by, 0], [bx - sx * br, by, 0]];
  };
  const depth = (n: Node) => placeOf(n)[0] + placeOf(n)[1];

  const beam = l.origin[1] - l.feed[1];
  const reach = (l.feed[0] - l.origin[0]) / (2 * ISO_X);
  const feed: Vec3[] = Math.abs(reach) < 1 ? [[0, 0, beam], [0, 0, 0]] : [[reach, -reach, beam], [0, 0, beam], [0, 0, 0]];
  s.wire({ id: 'feed', points: feed, stroke: accent, width: 1.5, hidden: true, corner: 14 });

  const edges = [...services.map(n => ['core', n] as const), ...leaves.map(n => [parents[n], n] as const)];
  for (const [a, b] of edges) s.wire({ id: `w-${b}`, points: route(a, b), stroke: ui.wire, width: 1.25, hidden: true });
  for (const [, b] of edges) s.pulse({ id: `p-${b}`, wire: `w-${b}`, color: accent, length: 0.28, glow: false });

  const ring = l.core.size * 1.14;
  s.face({ id: 'core-target', at: [0, 0, 0], size: [ring, ring], radius: ring * 0.22, stroke: 'rgb(167 139 250 / .55)', dash: '4 4' });
  const shadow = s.def('shadow-fill', '<radialGradient id="$ID"><stop offset=".4" stop-color="#000" stop-opacity=".6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>');
  const sh = l.core.size * 0.7;
  s.svg('core-shadow', s.plane([8, 8, 0], `<rect x="${-sh}" y="${-sh}" width="${sh * 2}" height="${sh * 2}" rx="${sh * 0.5}" fill="${shadow}"/>`));
  s.face({ id: 'core-ring', at: [0, 0, 0], size: [l.core.size, l.core.size], radius: l.core.size * 0.22, stroke: accent, strokeWidth: 1.5 });

  const block = {
    service: blocks(s, 'service', l.service.size, l.service.height, 0.2, { top: ui.top, side: ['#2b2c33', '#35363e'], edge: ui.edge }),
    leaf: blocks(s, 'leaf', l.leaf.size, l.leaf.height, 0.2, { top: ui.top, side: ['#212228', '#292a30'], edge: ui.edge }),
  };
  const tile = (n: Service | Leaf, name?: string) => {
    const [x, y] = placeOf(n);
    const [size, h] = [sizeOf(n), heightOf(n)];
    s.group(`g-${n}`, () => {
      s.svg(n, block[isLeaf(n) ? 'leaf' : 'service']([x, y, h]));
      s.face({ id: `${n}-hit`, at: [x, y, h], size: [size, size], radius: size * 0.2, fill: unlit });
      if (name) s.text({ id: `${n}-name`, at: [x, y, h], text: name, size: l.service.text, color: '#a1a1aa', on: 'top', along: 'y', anchor: 'middle', font: 'sans' });
    });
    s.pivot(`g-${n}`, [x, y, 0]);
  };
  [...services].sort((a, b) => depth(a) - depth(b)).forEach(n => tile(n, n));

  const { size, height } = l.core;
  s.group('core-fall', () =>
    s.group('core-lean', () =>
      s.group('core-live', () => {
        s.turntable({ id: 'core-spin', at: [0, 0, height], size: [size, size], height, radius: size * 0.2, top: ui.top, side: ['#2e1065', '#3b1580', '#4a1c9b', '#5b21b6', '#7046d0', '#8b5cf6'], edge: 'rgb(196 181 253 / .5)', layers: 5 });
        s.group('core-body', () => {
          s.slab({ id: 'core', at: [0, 0, height], size: [size, size], height, radius: size * 0.2, top: ui.top, side: paints.gradient(s, ramps.violet), edge: 'rgb(196 181 253 / .5)', shadow: false });
          s.face({ id: 'core-glow', at: [0, 0, height], size: [size, size], radius: size * 0.2, fill: unlit });
          s.face({ id: 'core-hit', at: [0, 0, height], size: [size, size], radius: size * 0.2, fill: unlit });
          s.text({ id: 'core-name', at: [0, 0, height], text: 'orders-api', size: l.core.text, color: '#d4d4d8', on: 'top', along: 'y', anchor: 'middle', weight: 500 });
        });
      }),
    ),
  );
  s.pivot('core-spin', [0, 0, height / 2]);
  s.pivot('core-lean', s.unproject(s.extremes([0, 0, 0], [size, size], size * 0.2).front, 0));
  s.pivot('core-live', [0, 0, 0]);

  [...leaves].sort((a, b) => depth(a) - depth(b)).forEach(n => tile(n));

  const pool = l.pool;
  const centre = pool.at;
  const span: Vec2 = [(pool.cols + 0.4) * pool.pitch, (pool.rows + 0.4) * pool.pitch];
  const src = placeOf(pool.from);
  const facing = (a: 0 | 1) => Math.abs(src[a] - centre[a]) <= span[a] / 2 - pool.pitch / 2;
  const axis = facing(1) ? 0 : facing(0) ? 1 : null;
  if (axis === null) throw new Error(`hero ${l.name}: the wire from ${pool.from} misses the pool`);
  const dir = Math.sign(centre[axis] - src[axis]);
  const along = (v: number): Vec3 => (axis === 0 ? [v, src[1], 0] : [src[0], v, 0]);
  s.wire({ id: 'w-pool', points: [along(src[axis] + dir * (l.leaf.size / 2 + 2)), along(centre[axis] - (dir * span[axis]) / 2 - dir * 2)], stroke: ui.wire, width: 1.25, hidden: true });
  s.pulse({ id: 'p-pool', wire: 'w-pool', color: accent, length: 0.28, glow: false });
  s.slab({ id: 'pool', at: [centre[0], centre[1], 6], size: span, height: 6, radius: pool.pitch * 0.35, top: '#141519', side: paints.flat('#202127'), edge: 'rgb(255 255 255 / .09)', shadow: false });
  const slots = Array.from({ length: pool.cols * pool.rows }, (_, i) => {
    const [c, r] = [i % pool.cols, Math.floor(i / pool.cols)];
    const at: Vec2 = [centre[0] + (c - (pool.cols - 1) / 2) * pool.pitch, centre[1] + (r - (pool.rows - 1) / 2) * pool.pitch];
    return { i, wave: Math.floor((c + r) / 2), at };
  });
  const empty = slots.filter(sl => pool.empty.includes(sl.i));
  const pods = slots.filter(sl => !pool.empty.includes(sl.i));
  if (1 + services.length + leaves.length + 1 + pods.length !== 40) throw new Error(`hero ${l.name}: the system must end at 40 objects, the pool holds ${pods.length} pods`);
  s.group('slots', () => empty.forEach(sl => s.face({ id: `slot-${sl.i}`, at: [sl.at[0], sl.at[1], 6], size: [pool.pod, pool.pod], radius: pool.pod * 0.22, stroke: 'rgb(167 139 250 / .4)', dash: '3 3' })));
  const podH = Math.round(pool.pod * 0.36);
  const lit = pods.filter((_, k) => k % 7 === 3).map(p => p.i);
  const waves = [...new Set(pods.map(p => p.wave))].sort((a, b) => a - b);
  const pod = blocks(s, 'pod', pool.pod, podH, 0.22, { top: '#1d1e24', side: ['#25262c', '#2e2f36'], edge: 'rgb(255 255 255 / .1)' });
  for (const w of waves) {
    const row = pods.filter(p => p.wave === w);
    s.group(`wave-${w}`, () => {
      s.svg(`pods-${w}`, row.map(p => pod([p.at[0], p.at[1], 6 + podH])).join(''));
      row.filter(p => lit.includes(p.i)).forEach(p => s.face({ id: `pod-${p.i}-hit`, at: [p.at[0], p.at[1], 6 + podH], size: [pool.pod, pool.pod], radius: pool.pod * 0.22, fill: unlit }));
    });
  }

  const gone = 1.04;
  const draw = (wire: string, t: number, dur: number, easing: string) => s.at(wire, 'strokeDashoffset', t, dur, gone, 0, easing);
  const retract = (wire: string, t: number, dur: number, toward: 'start' | 'end', easing: string) => s.at(wire, 'strokeDashoffset', t, dur, 0, toward === 'start' ? gone : -gone, easing);
  s.intro('card', 'opacity', 0.1, 0.4, 0, 1, ease.out);
  s.intro('card-head', 'opacity', 0.1, 0.4, 0, 1, ease.out);
  for (const n of [...services, ...leaves, 'pool']) s.intro(`p-${n}`, 'opacity', 0, 0.01, 1, 1, ease.linear);

  s.set('card-hot', 'opacity', 0, 0);
  s.at('card-hot', 'opacity', T.sent, 0.1, 0, 1, ease.linear);
  s.at('card-hot', 'opacity', T.sent + 0.1, 0.6, 1, 0, ease.linear);
  s.at('hint', 'opacity', T.hint, 0.15, 1, 0, ease.linear);
  const steps = prompt.length;
  s.typeIn('prompt', T.type, steps * typeStep, steps);
  s.at('caret', 'translate', T.type, steps * typeStep, '0 0', `${steps * charW}px 0`, `steps(${steps}, end)`);

  draw('feed', T.sent + 0.05, 0.3, ease.out);
  retract('feed', T.sent + 0.6, 0.3, 'end', curve.snapOff);
  s.at('core-target', 'opacity', T.sent + 0.3, 0.2, 0, 1, ease.linear);
  s.at('core-target', 'opacity', T.landed, 0.2, 1, 0, ease.linear);

  s.set('core-spin', 'opacity', T.spin, 1);
  s.at('core-spin', 'scale', T.spin, 1.0, 0, 1, curve.grow);
  s.spin('core-spin', T.spin, 1.0, 180, 0, curve.spin);
  s.set('core-spin', 'opacity', T.crossfade, 0);
  s.set('core-body', 'opacity', T.crossfade, 1);
  const over = 10 * (l.core.air / 278);
  s.set('core-fall', 'translate', T.spin - 0.05, `0 ${-l.core.air}px`);
  s.at('core-fall', 'translate', T.fall, 0.63, `0 ${-l.core.air}px`, `0 ${over}px`, curve.fall);
  s.at('core-fall', 'translate', T.landed, 0.4, `0 ${over}px`, '0 0', ease.io);
  s.at('core-lean', 'scale', T.lean, 0.3, '1 1', '1 1.1', ease.out);
  s.at('core-lean', 'scale', T.fall, 0.63, '1 1.1', '1 0.96', curve.fall);
  s.at('core-lean', 'scale', T.landed, 0.4, '1 0.96', '1 1', ease.io);
  s.at('core-shadow', 'opacity', T.spin, 0.6, 0, 0.25, ease.out);
  s.at('core-shadow', 'opacity', T.fall, 0.63, 0.25, 1, curve.fall);
  s.at('core-ring', 'opacity', T.landed, 0.05, 0, 0.7, ease.linear);
  s.at('core-ring', 'opacity', T.landed + 0.05, 0.8, 0.7, 0, ease.out);
  s.at('core-ring', 'scale', T.landed, 0.85, 1, 1.7, ease.out);

  const fade = (id: string, on: number, off: number) => {
    s.at(id, 'opacity', on, 0.25, 0, 1, ease.linear);
    s.at(id, 'opacity', off, 0.2, 1, 0, ease.linear);
  };
  fade('count-1', counts[0].at, counts[1].at - 0.1);
  fade('count-5', counts[1].at, counts[2].at - 0.1);
  fade('count-15', counts[2].at, T.live - 0.1);
  fade('count-live', T.live, T.collapse + 0.9);

  const pulseFree = new Map<string, number>();
  const free = (pulse: string, t: number, dur: number) => (pulseFree.get(pulse) ?? -1) <= t && t + dur <= T.collapse + 0.1;
  const travel = (pulse: string, t: number, dur: number, back: boolean) => {
    pulseFree.set(pulse, t + dur + 0.05);
    s.at(pulse, 'strokeDashoffset', t, dur, back ? -1.06 : 0.34, back ? 0.34 : -1.06, ease.linear);
  };
  const hop = (wire: string) => Math.min(0.75, Math.max(0.32, s.wireLength(wire) / 300));

  const slideFrom = (n: Service) => s.offset([...placeOf(n), 0], [0, 0, 0]);
  services.forEach((n, i) => {
    const t = T.slide + i * 0.05;
    s.set(`g-${n}`, 'opacity', t, 1);
    s.at(`g-${n}`, 'translate', t, 0.355, slideFrom(n), '0 0', curve.slide);
    draw(`w-${n}`, t, 0.355, curve.slide);
  });
  flash('core-hit', T.slide + 0.55);
  services.forEach((n, i) => {
    const t = T.slide + 0.7 + i * 0.08;
    const d = hop(`w-${n}`);
    travel(`p-${n}`, t, d, false);
    flash(`${n}-hit`, t + d);
  });

  leaves.forEach((n, i) => {
    const t = T.pops + i * 0.12;
    s.at(`g-${n}`, 'scale', t, 0.23, 0.05, 1.14, ease.out);
    s.at(`g-${n}`, 'scale', t + 0.23, 0.24, 1.14, 1, ease.io);
    draw(`w-${n}`, t + 0.3, 0.3, ease.out);
    flash(`${n}-hit`, t + 0.55);
  });

  s.dropAt('pool', T.pool, 75, 0.8);
  waves.forEach(w => s.dropAt(`wave-${w}`, T.pool + 0.5 + w * 0.16));
  s.at('slots', 'opacity', T.pool + 0.5 + Math.min(...empty.map(sl => sl.wave)) * 0.16, 0.4, 0, 1, ease.linear);
  draw('w-pool', T.pool + 1, 0.35, ease.out);

  type Hop = readonly [wire: Service | Leaf, back: boolean];
  const into = (cdn: 'cdn-a' | 'cdn-b'): Hop[] => [[cdn, true], ['gateway', true]];
  const routes: { hops: Hop[]; pool?: true }[] = [
    { hops: [...into('cdn-a'), ['queue', false], ['worker-c', false]], pool: true },
    { hops: [...into('cdn-b'), ['db', false], ['replica-a', false]] },
    { hops: [['auth', false], ['auth', true]] },
    { hops: [...into('cdn-a'), ['cache', false], ['shard-b', false]] },
    { hops: [...into('cdn-b'), ['queue', false], ['worker-c', false]], pool: true },
    { hops: [...into('cdn-a'), ['db', false], ['replica-b', false]] },
    { hops: [...into('cdn-b'), ['queue', false], ['worker-a', false]] },
    { hops: [...into('cdn-a'), ['cache', false], ['shard-a', false]] },
    { hops: [...into('cdn-b'), ['queue', false], ['worker-b', false]] },
  ];
  const lands = (n: Service | Leaf, back: boolean): Node => (!back ? n : isLeaf(n) ? parents[n] : 'core');
  const r = rng(7);
  let k = 0;
  let podTurn = 0;
  for (let t = T.pops + 1.9; t < T.collapse - 0.4; t += 0.42 + r() * 0.2) {
    const route = routes[k % routes.length]!;
    let at = t;
    const plan = route.hops.map(([n, back]) => {
      const dur = hop(`w-${n}`);
      const h = { n, back, at, dur };
      at += dur + 0.02;
      return h;
    });
    const tail = route.pool && t > T.pool + 1.2 ? { at, dur: hop('w-pool') } : null;
    if (!plan.every(h => free(`p-${h.n}`, h.at, h.dur)) || (tail && !free('p-pool', tail.at, tail.dur))) continue;
    k++;
    for (const h of plan) {
      travel(`p-${h.n}`, h.at, h.dur, h.back);
      const to = lands(h.n, h.back);
      if (to === 'core' || h === plan[plan.length - 1]) flash(`${to}-hit`, h.at + h.dur);
    }
    if (tail) {
      travel('p-pool', tail.at, tail.dur, false);
      flash(`pod-${lit[podTurn++ % lit.length]}-hit`, tail.at + tail.dur);
    }
  }

  for (const at of [T.live + 0.5, T.live + 3.5]) {
    s.at('core-glow', 'fill', at, 1.5, unlit, glow, ease.io);
    s.at('core-glow', 'fill', at + 1.5, 1.5, glow, unlit, ease.io);
  }

  const c = T.collapse;
  retract('w-pool', c, 0.23, 'start', curve.snapOff);
  [...waves].reverse().forEach((w, i) => s.at(`wave-${w}`, 'opacity', c + 0.05 + i * 0.1, 0.18, 1, 0, ease.linear));
  s.at('slots', 'opacity', c + 0.05, 0.2, 1, 0, ease.linear);
  s.at('pool', 'opacity', c + 0.85, 0.25, 1, 0, ease.linear);
  [...leaves].reverse().forEach((n, i) => {
    const t = c + 0.15 + i * 0.05;
    retract(`w-${n}`, t, 0.23, 'start', curve.snapOff);
    s.at(`g-${n}`, 'scale', t + 0.1, 0.42, 1, 0, curve.shrink);
  });
  services.forEach((n, i) => {
    const t = c + 0.8 + i * 0.05;
    s.at(`g-${n}`, 'translate', t, 0.355, '0 0', slideFrom(n), curve.slide);
    retract(`w-${n}`, t, 0.355, 'start', curve.slide);
    s.set(`g-${n}`, 'opacity', t + 0.4, 0);
  });
  s.at('core-live', 'scale', c + 1.3, 0.45, '1 1', '0 0', curve.shrink);
  s.at('core-shadow', 'opacity', c + 1.3, 0.4, 1, 0, ease.linear);
  s.set('core-body', 'opacity', c + 1.8, 0);
  s.set('core-live', 'scale', c + 1.85, '1 1');
  s.at('prompt', 'opacity', c + 1.2, 0.3, 1, 0, ease.linear);
  s.set('prompt', 'clipPath', c + 1.55, 'inset(-20% 100% -20% 0)');
  s.set('prompt', 'opacity', c + 1.6, 1);
  s.set('caret', 'translate', c + 1.55, '0 0');
  s.at('hint', 'opacity', c + 1.6, 0.25, 0, 1, ease.linear);
  s.loop(T.end, T.still);
  return s;
}

const sp = (dx: number, dy: number): Vec2 => {
  const [a, b] = [dx / ISO_X, dy / ISO_Y];
  return [(a + b) / 2, (b - a) / 2];
};

const wide = build({
  name: 'hero-lg',
  width: 720,
  height: 570,
  origin: [282, 300],
  core: { size: 96, height: 44, text: 13, air: 86 },
  service: { size: 56, height: 20, text: 12 },
  leaf: { size: 34, height: 13 },
  place: {
    cache: { at: [-160, 0] },
    'shard-a': { at: [-255, -75] },
    'shard-b': { at: [-255, 75] },
    db: { at: [0, -160] },
    'replica-a': { at: [-75, -255] },
    'replica-b': { at: [75, -255] },
    gateway: { at: [0, 160] },
    'cdn-a': { at: [-75, 255], exit: 'x' },
    'cdn-b': { at: [75, 255], exit: 'x' },
    auth: { at: [0, 255] },
    queue: { at: [160, 0] },
    'worker-a': { at: [255, -75], exit: 'y' },
    'worker-b': { at: [255, 75], exit: 'y' },
    'worker-c': { at: [255, 0] },
  },
  pool: { at: [420, 0], cols: 6, rows: 5, pitch: 28, pod: 20, empty: [17, 22, 23, 27, 28, 29], from: 'worker-c' },
  card: { x: 24, y: 20, w: 480, h: 100, text: 22, head: 15 },
  feed: [282, 120],
  ground: { at: [400, 330], size: 900, pitch: 24 },
});

const compact = build({
  name: 'hero-sm',
  width: 390,
  height: 580,
  origin: [195, 310],
  core: { size: 72, height: 34, text: 10, air: 122 },
  service: { size: 42, height: 15, text: 9 },
  leaf: { size: 28, height: 11 },
  place: {
    queue: { at: sp(-95, 55) },
    'worker-a': { at: sp(-160, 35), exit: 'x' },
    'worker-b': { at: sp(-135, 110), exit: 'y' },
    'worker-c': { at: sp(-70, 125), exit: 'y' },
    db: { at: sp(95, 55) },
    'replica-a': { at: sp(160, 35), exit: 'y' },
    'replica-b': { at: sp(130, 112), exit: 'x' },
    gateway: { at: sp(95, -55) },
    'cdn-a': { at: sp(55, -125), exit: 'x' },
    'cdn-b': { at: sp(150, -105), exit: 'y' },
    auth: { at: sp(160, -30) },
    cache: { at: sp(-95, -55) },
    'shard-a': { at: sp(-50, -125), exit: 'y' },
    'shard-b': { at: sp(-160, -40), exit: 'x' },
  },
  pool: { at: sp(0, 205), cols: 6, rows: 5, pitch: 26, pod: 18, empty: [17, 22, 23, 27, 28, 29], from: 'worker-c' },
  card: { x: 16, y: 16, w: 358, h: 80, text: 14, head: 12 },
  feed: [195, 96],
  ground: { at: [195, 290], size: 640, pitch: 18 },
});

const tilt = `<script type="module">
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const rest = [${T.live}, ${num(T.collapse - 0.1)}];
const max = 3.5;
const bind = (wrap) => {
  if (wrap.dataset.tilt) return;
  wrap.dataset.tilt = '1';
  wrap.style.transition = 'transform 1.1s cubic-bezier(.22,1,.36,1)';
  const clocks = new WeakMap();
  const loopTime = () => {
    const root = [...wrap.querySelectorAll('.iso')].find(r => r.offsetParent !== null && r.iso);
    if (!root) return -1;
    let a = clocks.get(root);
    if (!a) {
      a = root.getAnimations({ subtree: true }).find(x => x.effect?.getTiming().iterations === Infinity && x.effect.getTiming().duration === root.iso.spec.loop * 1000);
      if (!a) return -1;
      clocks.set(root, a);
    }
    const t = Number(a.currentTime) / 1000 - root.iso.spec.intro;
    return t < 0 ? -1 : t % root.iso.spec.loop;
  };
  let pointer = null;
  let frame = 0;
  let timer = 0;
  const flat = 'perspective(1800px) rotateX(0deg) rotateY(0deg)';
  const update = () => {
    frame = 0;
    const t = loopTime();
    if (!pointer || reduce.matches || !fine.matches || t < rest[0] || t > rest[1]) {
      wrap.style.transform = flat;
      return;
    }
    const r = wrap.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (pointer[0] - r.left - r.width / 2) / (r.width / 2)));
    const y = Math.max(-1, Math.min(1, (pointer[1] - r.top - r.height / 2) / (r.height / 2)));
    wrap.style.transform = 'perspective(1800px) rotateX(' + (y * max * 0.8).toFixed(2) + 'deg) rotateY(' + (-x * max).toFixed(2) + 'deg)';
  };
  const queue = () => frame || (frame = requestAnimationFrame(update));
  wrap.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    pointer = [e.clientX, e.clientY];
    if (!timer) timer = setInterval(queue, 250);
    queue();
  }, { passive: true });
  wrap.addEventListener('pointerleave', () => {
    pointer = null;
    clearInterval(timer);
    timer = 0;
    queue();
  });
};
const scan = () => document.querySelectorAll('.iso-switch-${compact.name}').forEach(bind);
scan();
new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
</script>`;

export const hero = art(compact, wide, 520, tilt);

export default { ...page({ title: 'One prompt, a whole system', surface: 'dark', art: hero }), background: ui.page };
