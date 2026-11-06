import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const accent = '#0284c7';
const line = 'rgb(22 23 27 / .3)';
const shift = 'cubic-bezier(.49,.19,.28,.81)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';

const rows = [
  [44, 72, 28],
  [36, 58, 40],
  [52, 44, 34],
  [40, 66, 24],
  [30, 54, 46],
] as const;
const match = 3;
const pitch = 38;
const moves = [0.5, 1.3, 2.1] as const;
const step = 0.6;

function build(name: string) {
  const s = new Scene({ name, width: 390, height: 300, origin: [190, 150], font: fonts.sans, mono: fonts.mono, label: ui.label });
  const rowY = (i: number) => (i - (rows.length - 1) / 2) * pitch;
  const rowSize = [206, 28] as const;
  const z = 12;
  const lensX = -44;
  const lensD = 76;
  const lensZ = z + 18;
  const outline = { outline: line, shade: false, edge: line } as const;

  s.slab({ id: 'plate', at: [0, 0, 6], size: [232, rows.length * pitch + 18], height: 10, radius: 16, top: '#fafafa', side: paints.flat('#f1f1f3'), ...outline });
  rows.forEach((cells, i) => {
    const at: Vec3 = [0, rowY(i), z];
    s.group(`row-${i}`, () => {
      s.slab({ id: `row-${i}-slab`, at, size: rowSize, height: 6, radius: 8, top: ui.top, side: paints.flat('#f4f4f5'), shadow: false, ...outline });
      if (i <= match) s.face({ id: `row-${i}-lit`, at, size: rowSize, radius: 8, fill: 'rgb(56 189 248 / .24)', stroke: 'rgb(2 132 199 / .7)' });
      if (i === match) s.face({ id: 'match-lit', at, size: rowSize, radius: 8, fill: 'rgb(56 189 248 / .3)', stroke: accent, strokeWidth: 1.5 });
      let x = -rowSize[0] / 2 + 14;
      cells.forEach((w, c) => {
        s.face({ id: `row-${i}-c${c}`, at: [x + w / 2, at[1], z], size: [w, 7], radius: 3.5, fill: c === 0 ? '#a1a1aa' : '#d4d4d8' });
        x += w + 12;
      });
    });
  });

  const [fx, fy] = s.project([116, (rows.length * pitch + 18) / 2, -4]);
  const text = '1 match';
  s.label({ id: 'found', at: { screen: [fitX(fx, text, 390, narrowest), fy + 26] }, text, size: 13 });

  const c = (lensZ - z) / (2 * Math.SQRT1_2 * Math.tan(Math.PI / 6));
  const lensAt = (i: number): Vec3 => [lensX + c, rowY(i) + c, lensZ];
  const [lx, ly] = [lensX + c, rowY(0) + c];
  s.group('lens', () => {
    s.svg('lens-shade', `<g filter="${s.blur(5)}" opacity=".2">${s.plane([lx + 8, ly + 8, z], `<circle r="${lensD / 2}" fill="#0b1020"/>`)}</g>`);
    s.slab({ id: 'lens-body', at: lensAt(0), size: [lensD, lensD], height: 8, radius: lensD / 2, top: 'rgb(224 242 254 / .3)', side: paints.brushed(s, ramps.graphite), translucent: true, edge: 'rgb(255 255 255 / .9)', shadow: false });
    s.face({ id: 'lens-rim', at: lensAt(0), size: [lensD, lensD], radius: lensD / 2, stroke: '#3f3f46', strokeWidth: 5 });
    s.face({ id: 'lens-glint', at: [lx - 14, ly - 14, lensZ], size: [24, 7], radius: 3.5, fill: 'rgb(255 255 255 / .85)' });
    s.slab({ id: 'handle', at: [lx + lensD / 2 + 24, ly, lensZ], size: [54, 16], height: 10, radius: 8, top: '#52525b', side: paints.brushed(s, ramps.graphite), edge: 'rgb(255 255 255 / .2)', shadow: false });
  });

  s.dropIn('plate', 0.1);
  rows.forEach((_, i) => s.dropIn(`row-${i}`, 0.2 + i * 0.083));
  s.dropIn('lens', 0.75);

  s.loop(7, 3.6);
  const lit = (i: number, on: number, off: number) => {
    s.at(`row-${i}-lit`, 'opacity', on, 0.2, 0, 1, ease.linear);
    s.at(`row-${i}-lit`, 'opacity', off, 0.35, 1, 0, ease.linear);
  };
  s.at('row-0-lit', 'opacity', moves[0] + 0.05, 0.35, 1, 0, ease.linear);
  s.at('row-0-lit', 'opacity', 5.85, 0.25, 0, 1, ease.linear);
  moves.forEach((t, k) => {
    s.at('lens', 'translate', t, step, s.offset(lensAt(0), lensAt(k)), s.offset(lensAt(0), lensAt(k + 1)), shift);
    if (k + 1 < match) lit(k + 1, t + step - 0.25, moves[k + 1]! + 0.05);
  });
  const hit = moves[2] + step;
  s.at(`row-${match}-lit`, 'opacity', hit - 0.25, 0.2, 0, 1, ease.linear);
  s.at(`row-${match}-lit`, 'opacity', 4.9, 0.5, 1, 0, ease.linear);
  s.at('match-lit', 'opacity', hit, 0.3, 0, 1, ease.linear);
  s.at('match-lit', 'opacity', 4.9, 0.5, 1, 0, ease.linear);
  s.at(`row-${match}`, 'translate', hit, 0.3, '0 0', '0 -5px', pull);
  s.at(`row-${match}`, 'translate', 4.9, 0.74, '0 -5px', '0 0', settle);
  s.at('found', 'opacity', hit + 0.15, 0.25, 0, 1, ease.out);
  s.at('found', 'translate', hit + 0.15, 0.4, '0 8px', '0 0', ease.out);
  s.at('found', 'opacity', 4.6, 0.3, 1, 0, ease.linear);
  s.at('lens', 'translate', 4.95, 1.2, s.offset(lensAt(0), lensAt(match)), '0px 0px', settle);
  return s;
}

export const example: Example = {
  slug: 'table-scan',
  title: 'Table scan',
  story: 'A magnifying glass glides down a table, lighting each row it passes, and stops on the one match.',
  prompt: 'Draw a magnifying glass scanning the rows of a table, each row lighting up under it, ending on a single match.',
  level: 'spot',
  category: 'data',
  useCase: 'Search',
  surface: 'light',
  interaction: 'watch',
  art: art(build('spot-scan')),
};

export default page(example);
