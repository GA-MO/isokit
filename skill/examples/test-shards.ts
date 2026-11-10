import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso.ts';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared.ts';

const ui = surfaces.light;
const lit = 'rgb(139 92 246 / .26)';
const line = 'rgb(22 23 27 / .14)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const slideOut = 'cubic-bezier(.15,.6,.6,1)';
const merge = 'cubic-bezier(.52,.18,.25,1)';

const shards = [
  { run: 2.3, took: '44s' },
  { run: 3.0, took: '58s' },
  { run: 1.7, took: '33s' },
  { run: 2.6, took: '51s' },
] as const;
const cells = 7;
const runAt = 0.9;
const slowest = Math.max(...shards.map(sh => sh.run));

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: Vec2;
  k: number;
  flow: Vec2;
  cross: Vec2;
  suite: number;
  lane: readonly [number, number];
  result: number;
  pitch: number;
  narrow: number;
  tookSide: 'right' | 'below';
}

function build(l: Layout) {
  const s = new Scene({ name: l.name, width: l.width, height: l.height, origin: l.origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const { k } = l;
  const at = (f: number, c: number, z = 0): Vec3 => [f * l.flow[0] + c * l.cross[0], f * l.flow[1] + c * l.cross[1], z];
  const lanes = shards.map((_, j) => (j - (shards.length - 1) / 2) * l.pitch);
  const [f0, f1] = l.lane;
  const cellF = (i: number) => f0 + ((f1 - f0) * (i + 1)) / (cells + 1);
  const cell = 26 * k;
  const shardSize = 46 * k;
  const shardH = 12 * k;
  const bigSize = 118 * k;
  const bigH = 42 * k;
  const suite = at(l.suite, 0);
  const result = at(l.result, 0);

  lanes.forEach((c, j) => {
    for (let i = 0; i < cells; i++) {
      const p = at(cellF(i), c);
      s.face({ id: `c${j}-${i}`, at: p, size: [cell, cell], radius: 6 * k, fill: 'rgb(22 23 27 / .03)', stroke: 'rgb(22 23 27 / .1)' });
      s.face({ id: `c${j}-${i}-on`, at: p, size: [cell, cell], radius: 6 * k, fill: lit, stroke: 'rgb(124 58 237 / .55)' });
    }
    s.face({ id: `end-${j}`, at: at(f1, c), size: [shardSize + 8 * k, shardSize + 8 * k], radius: 11 * k, stroke: 'rgb(22 23 27 / .18)', dash: '3 3' });
    s.march(`end-${j}`, 3, 3, 12);
  });

  shards.forEach((_, j) => {
    const top: Vec3 = [suite[0], suite[1], shardH];
    s.group(`shard-${j}`, () => {
      s.group(`shard-${j}-body`, () => {
        s.slab({ id: `sh-${j}`, at: top, size: [shardSize, shardSize], height: shardH, radius: 10 * k, top: '#f5f3ff', side: paints.gradient(s, ramps.violet), grain: 0.05, edge: ui.edge, outline: 'rgb(91 33 182 / .35)', shadow: false });
        s.slab({ id: `sh-${j}-ok`, at: top, size: [shardSize, shardSize], height: shardH, radius: 10 * k, top: '#ecfdf5', side: paints.gradient(s, ramps.emerald), grain: 0.05, edge: ui.edge, outline: 'rgb(4 120 87 / .35)', shadow: false });
        s.text({ id: `sh-${j}-name`, at: top, text: `${j + 1}/4`, size: 10, color: '#27272a', on: 'top', anchor: 'middle' });
      });
    });
    s.pivot(`shard-${j}-body`, [suite[0], suite[1], 0]);
  });

  const slab = (id: string, p: Vec3, side: 'silver' | 'emerald') => {
    const top: Vec3 = [p[0], p[1], bigH];
    if (side === 'silver') s.slab({ id, at: top, size: [bigSize, bigSize], height: bigH, radius: 18 * k, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.06, edge: ui.edge, outline: line });
    else s.slab({ id, at: top, size: [bigSize, bigSize], height: bigH, radius: 18 * k, top: '#ecfdf5', side: paints.gradient(s, ramps.emerald), grain: 0.08, edge: ui.edge, outline: 'rgb(4 120 87 / .35)' });
  };
  s.group('suite-g', () => {
    slab('suite', suite, 'silver');
    s.face({ id: 'suite-glow', at: [suite[0], suite[1], bigH], size: [bigSize, bigSize], radius: 18 * k, fill: 'rgb(139 92 246 / .2)' });
    s.text({ id: 'suite-name', at: [suite[0], suite[1], bigH], text: 'suite', size: 12, color: '#4b4e57', on: 'top', anchor: 'middle' });
  });
  s.group('result-g', () => {
    slab('result', result, 'silver');
    slab('result-ok', result, 'emerald');
    s.text({ id: 'result-name', at: [result[0], result[1], bigH], text: 'merge', size: 12, color: '#4b4e57', on: 'top', anchor: 'middle' });
  });

  const fit = (x: number, text: string, anchor: 'center' | 'left' = 'center') => fitX(x, text, l.width, l.narrow, anchor);
  const [qx, qy] = s.project([suite[0] - bigSize / 2, suite[1] - bigSize / 2, bigH]);
  s.label({ id: 'tests', at: { screen: [fit(qx, '1,240 tests'), qy - 18 * k] }, text: '1,240 tests', size: 13, anchor: 'bottom' });
  const [rx, ry] = l.tookSide === 'right' ? s.project([result[0] - bigSize / 2, result[1] - bigSize / 2, bigH]) : s.project([result[0] + bigSize / 2, result[1] + bigSize / 2, 0]);
  const passed = `✓ 1,240 passed · ${shards[1].took}`;
  const passAt: Vec2 = l.tookSide === 'right' ? [fit(rx, passed), ry - 18 * k] : [fit(rx, passed), ry + 16];
  s.label({ id: 'passed', at: { screen: passAt }, html: `<span style="color:#047857">✓</span> 1,240 passed · ${shards[1].took}`, size: 13, anchor: l.tookSide === 'right' ? 'bottom' : 'top' });

  s.dropIn('suite-g', 0.1);
  s.dropIn('result-g', 0.25);
  s.intro('tests', 'opacity', 0.5, 0.3, 0, 1, ease.out);
  s.intro('tests', 'translate', 0.5, 0.4, '0 8px', '0 0', ease.out);

  s.at('suite-glow', 'opacity', 0.1, 0.1, 0, 1, ease.linear);
  s.at('suite-glow', 'opacity', 0.2, 0.6, 1, 0, ease.linear);
  const join = runAt + slowest + 0.5;
  const fold = join + 2.6;
  lanes.forEach((c, j) => {
    const sh = shards[j]!;
    const start = at(f0, c);
    const end = at(f1, c);
    const out = 0.2 + j * 0.05;
    s.at(`shard-${j}`, 'translate', out, 0.5, '0 0', s.offset(suite, start), slideOut);
    s.at(`shard-${j}`, 'translate', runAt, sh.run, s.offset(suite, start), s.offset(suite, end), ease.linear);
    for (let i = 0; i < cells; i++) {
      const t = runAt + (sh.run * (cellF(i) - f0)) / (f1 - f0);
      s.at(`c${j}-${i}-on`, 'opacity', t, 0.1, 0, 1, ease.linear);
      s.at(`c${j}-${i}-on`, 'opacity', fold + (cells - 1 - i) * 0.033, 0.2, 1, 0, ease.linear);
    }
    const done = runAt + sh.run;
    s.at(`shard-${j}-body`, 'scale', done, 0.12, 1, '1.06 0.9', ease.out);
    s.at(`shard-${j}-body`, 'scale', done + 0.12, 0.3, '1.06 0.9', 1, ease.settle);
    s.at(`sh-${j}-ok`, 'opacity', done, 0.3, 0, 1, ease.linear);
    s.at(`shard-${j}`, 'translate', join + j * 0.06, 0.85, s.offset(suite, end), s.offset(suite, result), merge);
    s.set(`shard-${j}`, 'translate', join + 1.2, '0 0');
    s.set(`sh-${j}-ok`, 'opacity', join + 1.2, 0);
    const [ex, ey] = s.project(at(f1, c));
    const tookAt: Vec2 = l.tookSide === 'right' ? [ex + shardSize / 2 + 18, ey] : [ex, ey + 30 * k];
    s.label({ id: `took-${j}`, at: { screen: [l.tookSide === 'right' ? fit(tookAt[0], sh.took, 'left') : fit(tookAt[0], sh.took), tookAt[1]] }, text: sh.took, size: 13, anchor: l.tookSide === 'right' ? 'left' : 'top' });
    s.at(`took-${j}`, 'opacity', done + 0.05, 0.25, 0, 1, ease.out);
    s.at(`took-${j}`, 'translate', done + 0.05, 0.4, '-6px 0', '0 0', ease.out);
    s.at(`took-${j}`, 'opacity', fold + 0.1, 0.35, 1, 0, ease.linear);
  });
  const lands = join + 0.85 + 0.18;
  s.at('result-ok', 'opacity', lands - 0.1, 0.4, 0, 1, ease.linear);
  s.at('result-g', 'translate', lands - 0.1, 0.3, '0 0', '0 4px', 'cubic-bezier(.41,.27,.05,.79)');
  s.at('result-g', 'translate', lands + 0.2, 0.74, '0 4px', '0 0', settle);
  s.at('passed', 'opacity', lands, 0.3, 0, 1, ease.out);
  s.at('passed', 'translate', lands, 0.45, '0 8px', '0 0', ease.out);
  s.at('passed', 'opacity', fold + 0.2, 0.35, 1, 0, ease.linear);
  s.at('result-ok', 'opacity', fold + 0.3, 0.5, 1, 0, ease.linear);
  s.loop(Math.round((fold + 0.9) * 10) / 10, lands + 0.6);
  return s;
}

export const example: Example = {
  slug: 'test-shards',
  title: 'Sharded test run',
  ask: 'Show a test suite split into four parallel shards.',
  story: 'A test suite splits into four shards that run side by side, finish at different times and merge into one green result as fast as the slowest shard.',
  prompt: 'Draw a test suite splitting into four shards that run in parallel lanes left to right, each filling its lane at its own pace and finishing at a different time, then joining into one green passed result.',
  level: 'medium',
  intent: 'scale',
  layout: 'wide',
  useCase: 'Testing',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build({ name: 'shards-sm', width: 390, height: 590, origin: [195, 40], k: 0.7, flow: [Math.SQRT1_2, Math.SQRT1_2], cross: [Math.SQRT1_2, -Math.SQRT1_2], suite: 110, lane: [215, 560], result: 790, pitch: 78, narrow: narrowest, tookSide: 'below' }),
    build({ name: 'shards-lg', width: 1260, height: 420, origin: [0, 210], k: 1, flow: [Math.SQRT1_2, -Math.SQRT1_2], cross: [Math.SQRT1_2, Math.SQRT1_2], suite: 160, lane: [300, 880], result: 1080, pitch: 120, narrow: 721, tookSide: 'right' }),
    720,
  ),
};

export default page(example);
