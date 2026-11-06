import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fonts, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.dark;
const emerald = ramps.emerald;
const rise = 'cubic-bezier(.32,.5,.06,1)';

const cells = 4;

function build(name: string, width: number, height: number, origin: readonly [number, number]) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const [w, d, h] = [112, 84, 150];
  const pad = 10;
  const gap = 7;
  const cellH = (h - 2 * pad - (cells - 1) * gap) / cells;
  const cell: Vec2 = [w - 2 * pad, d - 2 * pad];
  const base = (i: number): Vec3 => [0, 0, -h + pad + i * (cellH + gap)];

  for (let i = 0; i < cells; i++) {
    s.face({ id: `slot-${i}`, at: base(i), size: cell, radius: 8, stroke: 'rgb(52 211 153 / .3)', dash: '4 4' });
    s.prism({ id: `cell-${i}`, at: base(i), size: cell, height: cellH, radius: 8, top: emerald[2], side: [emerald[1], '#10b981'], stroke: 'rgb(209 250 229 / .35)' });
  }

  s.slab({ id: 'case', at: [0, 0, 0], size: [w, d], height: h, radius: 22, top: 'rgb(255 255 255 / .04)', side: paints.glass(s, '#3f3f46', 0.5), edge: 'rgb(255 255 255 / .22)', translucent: true });
  s.face({ id: 'case-glow', at: [0, 0, 0], size: [w, d], radius: 22, fill: 'rgb(52 211 153 / .22)' });
  const nub: Vec3 = [0, 0, 13];
  s.slab({ id: 'nub', at: nub, size: [46, 34], height: 13, radius: 9, top: ui.top, side: paints.brushed(s, ramps.graphite), grain: 0.06, edge: ui.edge, shadow: false });
  s.face({ id: 'nub-lit', at: nub, size: [46, 34], radius: 9, fill: 'rgb(52 211 153 / .7)' });

  s.dropIn('case', 0.1);
  s.dropIn('nub', 0.25);
  s.introUntil(0.8);

  const first = 0.4;
  const step = 0.55;
  const fill = 0.75;
  const topped = first + (cells - 1) * step + fill;
  const drain = 4.6;
  s.loop(6.4, topped + 0.6);
  for (let i = 0; i < cells; i++) {
    const t = first + i * step;
    const out = drain + (cells - 1 - i) * 0.14;
    s.at(`cell-${i}`, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.heightTo(`cell-${i}`, t, fill, 0, cellH, rise);
    s.heightTo(`cell-${i}`, out, 0.5, cellH, 0, ease.io);
    s.at(`cell-${i}`, 'opacity', out + 0.4, 0.1, 1, 0, ease.linear);
    s.march(`slot-${i}`, 4, 4, 24);
  }
  s.at('case-glow', 'opacity', topped - 0.1, 0.1, 0, 1, ease.linear);
  s.at('case-glow', 'opacity', topped, 0.6, 1, 0, ease.linear);
  s.at('nub-lit', 'opacity', topped - 0.1, 0.2, 0, 1, ease.linear);
  s.at('nub-lit', 'opacity', drain - 0.2, 0.4, 1, 0, ease.linear);
  return s;
}

export const example: Example = {
  slug: 'battery-charge',
  title: 'Battery charging',
  story: 'Four cells inside a glass battery fill one by one from the bottom, the battery flashes full, then drains back to empty.',
  prompt: 'Draw a battery whose level cells fill one by one with an accent colour, flash when full, then drain back.',
  level: 'spot',
  category: 'infra',
  useCase: 'Capacity',
  surface: 'dark',
  interaction: 'watch',
  art: art(build('spot-battery', 390, 300, [195, 78])),
};

export default page(example);
