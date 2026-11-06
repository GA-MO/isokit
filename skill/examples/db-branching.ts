import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fonts, page, ramps, surfaces, type Example, paints } from './shared';

const ui = surfaces.dark;
const indigo = ramps.indigo;
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const glide = 'cubic-bezier(.45,.05,.05,1)';

type Layout = { name: string; width: number; height: number; origin: readonly [number, number]; k: number; wide: boolean };

function build({ name, width, height, origin, k, wide }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const d = (wide ? 112 : 128) * k;
  const size = 118 * k;
  const h = 52 * k;
  const radius = 20 * k;
  const main: Vec3 = wide ? [-d, d, 0] : [-d, 0, 0];
  const branch: Vec3 = wide ? [d, -d, 0] : [d, 0, 0];
  const wz = -h + 2 * k;
  const tileSize = 46 * k;
  const tileH = 8 * k;
  const onBranch: Vec3 = [branch[0], branch[1], tileH];
  const onMain: Vec3 = [main[0], main[1], tileH];

  const route: Vec3[] = wide ? [[main[0] + size / 2, main[1], wz], [d, d, wz], [d, -d + size / 2, wz]] : [[main[0] + size / 2, 0, wz], [branch[0] - size / 2, 0, wz]];
  s.wire({ id: 'w-branch', points: route, stroke: 'rgb(165 180 252 / .32)', width: 1.25, corner: 18 * k, hidden: true });

  s.slab({ id: 'main', at: main, size: [size, size], height: h, radius, top: ui.top, side: paints.gradient(s, indigo), grain: 0.06, edge: ui.edge });
  s.face({ id: 'main-glow', at: main, size: [size, size], radius, fill: 'rgb(129 140 248 / .3)' });
  s.text({ id: 'main-name', at: [main[0], main[1] + size / 2, -h * 0.5], text: 'main', size: 12, color: '#e0e7ff', on: 'left', anchor: 'middle' });

  s.frame({ id: 'ghost', at: branch, size: [size, size], height: h, radius, stroke: 'rgb(165 180 252 / .55)', dash: '4 4' });
  s.slab({ id: 'branch', at: branch, size: [size, size], height: h, radius, top: ui.top, side: paints.brushed(s, ramps.graphite), grain: 0.06, edge: 'rgb(165 180 252 / .35)' });
  s.face({ id: 'branch-hit', at: branch, size: [size, size], radius, fill: 'rgb(129 140 248 / .22)' });
  s.text({ id: 'branch-name', at: [branch[0], branch[1] + size / 2, -h * 0.5], text: 'preview', size: 12, color: '#a5b4fc', on: 'left', anchor: 'middle' });

  s.slab({ id: 'change', at: onBranch, size: [tileSize, tileSize], height: tileH, radius: 8 * k, top: '#a5b4fc', side: { kind: 'flat', color: indigo[1] }, edge: 'rgb(255 255 255 / .45)', shadow: false });

  const below: Vec3 = [branch[0] + size / 2, branch[1] + size / 2, -h - 8 * k];
  const above: Vec3 = [branch[0], branch[1], 64 * k];
  s.label({ id: 'branch-note', at: wide ? above : below, text: wide ? 'branch · copy-on-write · 0 B' : 'branch · 0 B copied', size: 13, anchor: wide ? 'center' : 'top' });
  s.label({ id: 'change-note', at: wide ? below : above, text: '+ column plan', size: 13, anchor: wide ? 'top' : 'center' });

  s.dropIn('main', 0.1);
  s.introUntil(0.8);

  s.loop(9, 4.2);
  s.draw('w-branch', 0.5, 0.45, ease.out);
  s.at('ghost', 'opacity', 0.75, 0.25, 0, 1, ease.linear);
  s.at('branch-note', 'opacity', 0.85, 0.25, 0, 1, ease.out);
  s.at('branch-note', 'translate', 0.85, 0.4, wide ? '0 8px' : '0 -8px', '0 0', ease.out);
  s.at('branch', 'opacity', 1.45, 0.4, 0, 1, ease.linear);
  s.at('branch-name', 'opacity', 1.45, 0.4, 0, 1, ease.linear);
  s.at('ghost', 'opacity', 1.65, 0.3, 1, 0, ease.linear);

  s.dropAt('change', 2.4, 34 * k);
  s.at('branch-hit', 'opacity', 2.72, 0.1, 0, 1, ease.linear);
  s.at('branch-hit', 'opacity', 2.82, 0.6, 1, 0, ease.linear);
  s.at('change-note', 'opacity', 2.85, 0.25, 0, 1, ease.out);
  s.at('change-note', 'translate', 2.85, 0.4, wide ? '0 -8px' : '0 8px', '0 0', ease.out);
  s.at('change-note', 'opacity', 4.5, 0.25, 1, 0, ease.linear);

  const leave = 4.6;
  const travel = 1.25;
  const land = leave + travel;
  s.at('change', 'translate', leave, travel, '0 0', s.offset(onBranch, onMain), glide);
  s.at('main-glow', 'opacity', land - 0.25, 0.1, 0, 1, ease.linear);
  s.at('main-glow', 'opacity', land - 0.15, 0.6, 1, 0, ease.linear);
  s.at('main', 'translate', land - 0.25, 0.14, '0 0', '0 4px', ease.out);
  s.at('main', 'translate', land - 0.11, 0.74, '0 4px', '0 0', settle);
  s.at('change', 'opacity', land - 0.05, 0.35, 1, 0, ease.linear);
  s.set('change', 'translate', land + 0.4, '0 0');

  s.at('branch', 'opacity', 6.4, 0.35, 1, 0, ease.linear);
  s.at('branch-name', 'opacity', 6.4, 0.35, 1, 0, ease.linear);
  s.at('ghost', 'opacity', 6.4, 0.3, 0, 1, ease.linear);
  s.at('ghost', 'opacity', 7.0, 0.3, 1, 0, ease.linear);
  s.at('branch-note', 'opacity', 6.8, 0.3, 1, 0, ease.linear);
  s.retract('w-branch', 7.2, 0.4, 'start', ease.in);
  s.march('ghost', 4, 4, 24);
  return s;
}

export const example: Example = {
  slug: 'db-branching',
  title: 'Database branching',
  story: 'A branch appears beside the main database as a copy-on-write outline, turns solid, takes one change and merges it back.',
  prompt: 'Draw a main database spawning an instant copy-on-write branch that starts as an outline and turns solid, gets one schema change, then merges back.',
  level: 'simple',
  category: 'data',
  layout: 'diagonal',
  useCase: 'Databases',
  surface: 'dark',
  interaction: 'watch',
  art: art(
    build({ name: 'branch-sm', width: 390, height: 400, origin: [195, 138], k: 0.8, wide: false }),
    build({ name: 'branch-lg', width: 720, height: 400, origin: [360, 200], k: 1, wide: true }),
    520,
  ),
};

export default page(example);
