import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const accent = '#6366f1';
const win = '#059669';
const line = 'rgb(22 23 27 / .16)';
const grow = 'cubic-bezier(.62,.2,.1,1)';
const shrink = 'cubic-bezier(.33,0,.91,.03)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';

const variants = [
  { id: 'a', name: 'A', at: [-100, 100], final: 68 },
  { id: 'b', name: 'B', at: [100, -100], final: 112 },
] as const;
const visits = 8;
const visitAt = (i: number) => 0.3 + i * 0.55;
const verdict = 'B wins · +4.2 %';

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: readonly [number, number];
  k: number;
  minPx: number;
  label: { dx: number; dy: number; anchor: 'left' | 'right' | 'top' | 'bottom' };
  textSize: number;
}

function build(l: Layout) {
  const { k } = l;
  const s = new Scene({ name: l.name, width: l.width, height: l.height, origin: l.origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const srcAt: Vec3 = [-250 * k, -100 * k, 0];
  const srcSize = 64 * k;
  const splitAt: Vec3 = [-100 * k, -100 * k, 0];
  const splitSize = 56 * k;
  const tileSize = 84 * k;
  const tileH = 20 * k;
  const bar = 30 * k;
  const reach = 130 * k;
  const wz = -12 * k;
  const tileAt = (v: (typeof variants)[number]): Vec3 => [v.at[0] * k, v.at[1] * k, 0];
  const barAt = (v: (typeof variants)[number]): Vec3 => [(v.at[0] - 8) * k, (v.at[1] - 8) * k, tileH];

  s.wire({ id: 'w-in', points: [[srcAt[0] + srcSize / 2, srcAt[1], wz], [splitAt[0] - splitSize / 2, splitAt[1], wz]], stroke: ui.wire, width: 1.25 });
  s.pulse({ id: 'p-in', wire: 'w-in', color: accent, length: 0.3 });
  variants.forEach(v => {
    const to = tileAt(v);
    const points: Vec3[] = v.id === 'b' ? [[splitAt[0] + splitSize / 2, splitAt[1], wz], [to[0] - tileSize / 2, to[1], wz]] : [[splitAt[0], splitAt[1] + splitSize / 2, wz], [to[0], to[1] - tileSize / 2, wz]];
    s.wire({ id: `w-${v.id}`, points, stroke: ui.wire, width: 1.25 });
    s.pulse({ id: `p-${v.id}`, wire: `w-${v.id}`, color: accent, length: 0.2 });
  });

  s.slab({ id: 'src', at: srcAt, size: [srcSize, srcSize], height: 18 * k, radius: 12 * k, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.05, edge: ui.edge, outline: line });
  s.text({ id: 'src-name', at: srcAt, text: 'users', size: l.textSize, color: ui.muted, on: 'top', anchor: 'middle' });

  s.group('split', () => {
    s.slab({ id: 'split-slab', at: splitAt, size: [splitSize, splitSize], height: 26 * k, radius: 14 * k, top: ui.top, side: paints.gradient(s, ramps.indigo), grain: 0.06, edge: ui.edge, outline: 'rgb(55 48 163 / .3)' });
    s.face({ id: 'split-glow', at: splitAt, size: [splitSize, splitSize], radius: 14 * k, fill: 'rgb(99 102 241 / .22)' });
    s.text({ id: 'split-name', at: splitAt, text: '50/50', size: l.textSize, color: '#4338ca', on: 'top', anchor: 'middle' });
  });

  variants.forEach(v => {
    const at = tileAt(v);
    s.group(`tile-${v.id}`, () => {
      s.slab({ id: `tile-${v.id}-slab`, at, size: [tileSize, tileSize], height: tileH, radius: 16 * k, top: ui.top, side: paints.dots(s, ramps.silver, 3), grain: 0.05, edge: ui.edge, outline: line });
      s.face({ id: `tile-${v.id}-hit`, at, size: [tileSize, tileSize], radius: 16 * k, fill: 'rgb(99 102 241 / .16)' });
      if (v.id === 'b') s.face({ id: 'tile-b-win', at, size: [tileSize, tileSize], radius: 16 * k, fill: 'rgb(16 185 129 / .2)', stroke: 'rgb(5 150 105 / .5)' });
      s.text({ id: `tile-${v.id}-name`, at: [at[0] + 24 * k, at[1] + 24 * k, tileH], text: v.name, size: 16, weight: 600, font: 'sans', color: ui.ink, on: 'top', anchor: 'middle' });
    });
    s.prism({ id: `bar-${v.id}`, at: barAt(v), size: [bar, bar], height: v.final * k, reach, radius: 6 * k, top: '#ffffff', side: ['#e4e4e7', '#f4f4f5'], stroke: 'rgb(22 23 27 / .26)' });
    if (v.id === 'b') s.prism({ id: 'bar-b-win', at: barAt(v), size: [bar, bar], height: v.final * k, reach, radius: 6 * k, top: '#d1fae5', side: ['#047857', '#10b981'], stroke: 'rgb(4 120 87 / .5)' });
  });

  const b = variants[1];
  const [bx, by] = s.project([barAt(b)[0], barAt(b)[1], tileH + b.final * k]);
  s.label({
    id: 'verdict',
    at: { screen: [fitX(bx + l.label.dx * k, verdict, l.width, l.minPx, l.label.anchor === 'top' || l.label.anchor === 'bottom' ? 'center' : l.label.anchor), by + l.label.dy * k] },
    html: `<b style="font-weight:600;color:${win}">B</b> wins <span style="color:${ui.muted}">·</span> <span style="color:${win}">+4.2 %</span>`,
    size: 13,
    anchor: l.label.anchor,
  });

  s.dropIn('src', 0.1);
  s.dropIn('split', 0.2);
  variants.forEach((v, i) => s.dropIn(`tile-${v.id}`, 0.3 + i * 0.083));

  const dIn = Math.max(0.3, s.wireLength('w-in') / 270);
  const heights = { a: 0, b: 0 };
  const steps = { a: 0, b: 0 };
  let last = 0;
  for (let i = 0; i < visits; i++) {
    const v = variants[i % 2]!;
    const t = visitAt(i);
    s.travel('p-in', t, dIn);
    const at = t + dIn;
    s.at('split-glow', 'opacity', at, 0.1, 0, 1, ease.linear);
    s.at('split-glow', 'opacity', at + 0.1, 0.35, 1, 0, ease.linear);
    const d = Math.max(0.3, s.wireLength(`w-${v.id}`) / 270);
    s.travel(`p-${v.id}`, at + 0.05, d);
    const land = at + 0.05 + d;
    s.at(`tile-${v.id}-hit`, 'opacity', land, 0.1, 0, 1, ease.linear);
    s.at(`tile-${v.id}-hit`, 'opacity', land + 0.1, 0.6, 1, 0, ease.linear);
    steps[v.id] += 1;
    const next = (v.final * k * steps[v.id]) / (visits / 2);
    if (heights[v.id] === 0) s.at(`bar-${v.id}`, 'opacity', land, 0.1, 0, 1, ease.linear);
    for (const id of v.id === 'b' ? ['bar-b', 'bar-b-win'] : ['bar-a']) s.heightTo(id, land, 0.5, heights[v.id], next, grow);
    heights[v.id] = next;
    last = land + 0.5;
  }

  const decide = last + 0.25;
  s.at('bar-b-win', 'opacity', decide, 0.45, 0, 1, ease.linear);
  s.at('tile-b-win', 'opacity', decide, 0.45, 0, 1, ease.linear);
  s.at('tile-b', 'translate', decide, 0.3, '0 0', '0 -5px', pull);
  s.at('tile-b', 'translate', decide + 0.3, 0.74, '0 -5px', '0 0', settle);
  const shown = decide + 0.3;
  s.at('verdict', 'opacity', shown, 0.25, 0, 1, ease.out);
  s.at('verdict', 'translate', shown, 0.45, '0 8px', '0 0', ease.out);

  const reset = shown + 2.6;
  s.at('verdict', 'opacity', reset, 0.3, 1, 0, ease.linear);
  s.at('tile-b-win', 'opacity', reset, 0.4, 1, 0, ease.linear);
  variants.forEach((v, i) => {
    const t = reset + 0.1 + i * 0.05;
    for (const id of v.id === 'b' ? ['bar-b', 'bar-b-win'] : ['bar-a']) s.heightTo(id, t, 0.4, v.final * k, 0, shrink);
    s.at(`bar-${v.id}`, 'opacity', t + 0.35, 0.1, 1, 0, ease.linear);
  });
  s.at('bar-b-win', 'opacity', reset + 0.5, 0.1, 1, 0, ease.linear);
  s.loop(Math.round((reset + 0.7 + 0.5) * 10) / 10, shown + 0.8);
  return s;
}

export const example: Example = {
  slug: 'ab-test',
  title: 'A/B test result',
  story: 'Visitors split evenly between variant A and B, each variant’s result bar grows, and B pulls ahead to win by 4.2 %.',
  prompt: 'Draw an A/B test: traffic splits at a node into variants A and B with alternating pulses, each variant grows a result bar, and B wins in green with a lift label.',
  level: 'medium',
  category: 'data',
  useCase: 'Experiments',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build({ name: 'abtest-sm', width: 390, height: 400, origin: [195, 262], k: 0.86, minPx: narrowest, label: { dx: 0, dy: -22, anchor: 'bottom' }, textSize: 10 }),
    build({ name: 'abtest-lg', width: 720, height: 400, origin: [360, 288], k: 1.32, minPx: 521, label: { dx: 0, dy: -22, anchor: 'bottom' }, textSize: 12 }),
    520,
  ),
};

export default page(example);
