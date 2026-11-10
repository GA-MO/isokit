import { Scene, ease, type Vec3 } from '../lib/iso.ts';
import { art, fonts, page, paints, ramps, surfaces, type Example } from './shared.ts';

const ui = surfaces.light;
const line = 'rgb(22 23 27 / .14)';
const shrink = 'cubic-bezier(.33,0,.91,.03)';

const grid = [0, 1, 2].flatMap(i => [0, 1, 2].map(j => ({ i, j, wave: i + j })));
const gap = 0.16;
const inAt = 0.2;
const outAt = 2.6;

function build(name: string) {
  const s = new Scene({ name, width: 390, height: 300, origin: [195, 152], font: fonts.sans, mono: fonts.mono, label: ui.label });
  const size = 56;
  const pitch = 70;
  const h = 16;
  const at = (i: number, j: number): Vec3 => [(i - 1) * pitch, (j - 1) * pitch, h];

  s.slab({ id: 'plate', at: [0, 0, 0], size: [3 * pitch + 20, 3 * pitch + 20], height: 10, radius: 26, top: '#fbfbfa', side: paints.brushed(s, ramps.silver), grain: 0.06, edge: ui.edge, outline: line });
  grid.forEach(({ i, j }) => s.face({ id: `slot-${i}-${j}`, at: [(i - 1) * pitch, (j - 1) * pitch, 0], size: [size, size], radius: 11, stroke: 'rgb(22 23 27 / .16)', dash: '4 4' }));
  grid.forEach(({ i, j }) => {
    s.group(`t-${i}-${j}`, () => {
      s.slab({ id: `t-${i}-${j}-slab`, at: at(i, j), size: [size, size], height: h, radius: 11, top: ui.top, side: paints.gradient(s, ramps.sky), grain: 0.08, edge: ui.edge, outline: 'rgb(3 105 161 / .3)' });
      s.face({ id: `t-${i}-${j}-glow`, at: at(i, j), size: [size, size], radius: 11, fill: 'rgb(14 165 233 / .2)', stroke: 'rgb(2 132 199 / .45)' });
    });
    s.pivot(`t-${i}-${j}`, [(i - 1) * pitch, (j - 1) * pitch, 0]);
  });

  s.dropIn('plate', 0.1);
  s.introUntil(0.5);

  s.loop(4.2, 1.5);
  grid.forEach(({ i, j, wave }) => {
    const id = `t-${i}-${j}`;
    const tin = inAt + wave * gap;
    const tout = outAt + wave * gap;
    s.dropAt(id, tin, 30);
    s.at(`${id}-glow`, 'opacity', 1.5 + wave * gap, 0.2, 0, 1, ease.linear);
    s.at(`${id}-glow`, 'opacity', 1.7 + wave * gap, 0.5, 1, 0, ease.linear);
    s.at(id, 'scale', tout, 0.45, 1, 0, shrink);
    s.set(id, 'opacity', tout + 0.46, 0);
    s.set(id, 'scale', tout + 0.48, 1);
  });
  return s;
}

export const example: Example = {
  slug: 'tile-loader',
  title: 'Tile loader',
  ask: 'A loading state.',
  story: 'Nine tiles drop into a grid in a diagonal wave, hold, then shrink away in the same order and start again.',
  prompt: 'Draw a calm loading state: a 3 by 3 grid of small tiles dropping in one after another, holding, then leaving in order, looping.',
  level: 'spot',
  layout: 'object',
  useCase: 'Loading',
  surface: 'light',
  interaction: 'watch',
  art: art(build('spot-loader')),
};

export default page(example);
