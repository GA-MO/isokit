import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const violet = ramps.violet;
const line = 'rgb(22 23 27 / .16)';
const ink = '#4b4e57';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const ruleDraw = 'cubic-bezier(.05,1,.6,1)';

const packages = [
  { id: 'types', cell: [0, 0] },
  { id: 'auth', cell: [1, 0] },
  { id: 'config', cell: [0, 1] },
  { id: 'db', cell: [1, 1] },
  { id: 'charts', cell: [2, 1] },
  { id: 'docs', cell: [3, 1] },
  { id: 'tokens', cell: [0, 2] },
  { id: 'ui', cell: [1, 2] },
  { id: 'forms', cell: [2, 2] },
  { id: 'web', cell: [3, 2] },
  { id: 'utils', cell: [0, 3] },
  { id: 'api', cell: [1, 3] },
  { id: 'cms', cell: [2, 3] },
  { id: 'admin', cell: [3, 3] },
] as const;
type Id = (typeof packages)[number]['id'];

const edges: readonly (readonly [Id, Id])[] = [
  ['config', 'db'],
  ['db', 'charts'],
  ['charts', 'docs'],
  ['tokens', 'ui'],
  ['ui', 'forms'],
  ['forms', 'web'],
  ['utils', 'api'],
  ['api', 'cms'],
  ['cms', 'admin'],
  ['types', 'auth'],
  ['forms', 'admin'],
];
const changed: Id = 'forms';

function dependents(root: Id): Id[] {
  const out: Id[] = [];
  const visit = (id: Id) => {
    for (const [from, to] of edges) {
      if (from !== id || out.includes(to)) continue;
      out.push(to);
      visit(to);
    }
  };
  visit(root);
  return out;
}
const rebuilt: readonly Id[] = [changed, ...dependents(changed)];
const cached = packages.length - rebuilt.length;

const beat = { edit: 0.3, scan: 1.0, tier: 0.42, build: 3.2, buildFor: 1.0, next: 1.5, done: 6.3, reset: 9.0 } as const;
const loopLength = 10;

type Layout = { name: string; width: number; height: number; origin: readonly [number, number]; k: number; minPx: number; side: boolean };

function build({ name, width, height, origin, k, minPx, side }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label, ratio: 0.64 });
  const pitch = 68 * k;
  const size = 42 * k;
  const h = 12 * k;
  const radius = 9 * k;
  const wz = -h + 1;
  const at = (id: Id): Vec3 => {
    const c = packages.find(p => p.id === id)!.cell;
    return [(c[0] - 1.5) * pitch, (c[1] - 1.5) * pitch, 0];
  };
  const route = (a: Id, b: Id): Vec3[] => {
    const [p, q] = [at(a), at(b)];
    if (p[1] === q[1]) return [[p[0] + size / 2, p[1], wz], [q[0] - size / 2, q[1], wz]];
    const mid = (p[0] + q[0]) / 2;
    return [[p[0] + size / 2, p[1], wz], [mid, p[1], wz], [mid, q[1], wz], [q[0] - size / 2, q[1], wz]];
  };

  s.slab({ id: 'base', at: [0, 0, -h - 2 * k], size: [pitch * 4 - 6 * k, pitch * 4 - 6 * k], height: 8 * k, radius: 22 * k, top: '#fbfbfa', side: paints.brushed(s, ramps.silver), edge: line, outline: line, shade: false });

  edges.forEach(([a, b]) => {
    s.wire({ id: `e-${a}-${b}`, points: route(a, b), stroke: ui.wire, width: 1.25, corner: 10 * k });
    if (a === changed || rebuilt.includes(a)) {
      s.wire({ id: `lit-${a}-${b}`, points: route(a, b), stroke: 'rgb(124 58 237 / .6)', width: 1.5, corner: 10 * k, hidden: true });
      s.pulse({ id: `p-${a}-${b}`, wire: `e-${a}-${b}`, color: violet[2], length: 0.3 });
    }
  });

  [...packages].sort((a, b) => a.cell[0] + a.cell[1] - (b.cell[0] + b.cell[1])).forEach(p => {
    const pos = at(p.id);
    const fresh = rebuilt.includes(p.id);
    s.group(`pkg-${p.id}`, () => {
      s.slab({ id: `${p.id}-slab`, at: pos, size: [size, size], height: h, radius, top: ui.top, side: paints.flat('#ececea'), edge: line, outline: line, shade: false, shadow: false });
      if (fresh) {
        s.slab({ id: `${p.id}-on`, at: pos, size: [size, size], height: h, radius, top: '#f5f3ff', side: paints.gradient(s, violet), edge: 'rgb(255 255 255 / .9)', outline: 'rgb(91 33 182 / .35)', shadow: false });
        s.face({ id: `${p.id}-need`, at: pos, size: [size - 6 * k, size - 6 * k], radius: radius * 0.8, stroke: 'rgb(124 58 237 / .75)', strokeWidth: 1.25, dash: '4 4' });
        s.march(`${p.id}-need`, 4, 4, 24);
      } else {
        s.face({ id: `${p.id}-hit`, at: pos, size: [size, size], radius, fill: 'rgb(16 185 129 / .14)', stroke: 'rgb(4 120 87 / .55)' });
      }
      s.text({ id: `${p.id}-name`, at: pos, text: p.id, size: 10, color: ink, on: 'top', anchor: 'middle', weight: 500 });
    });
  });

  const cachedText = `${cached} of ${packages.length} cached`;
  const builtText = `${rebuilt.length} rebuilt`;
  const editText = `${changed} changed`;
  const x = side ? fitX(s.project([pitch * 2, -pitch * 2, 0])[0] + 24, cachedText, width, minPx, 'left') : width / 2;
  const y = side ? height * 0.4 : height - 84;
  const anchor = side ? 'left' : 'center';
  const pill = (id: string, text: string, color: string, row: number) => s.label({ id, at: { screen: [x, y + row * 40] }, html: `<span style="color:${color}">${text}</span>`, size: 13, anchor });
  pill('edit', editText, '#5b21b6', 0);
  pill('cached', cachedText, '#047857', 0);
  pill('built', builtText, '#5b21b6', 1);

  s.dropIn('base', 0.1);
  [...packages].sort((a, b) => a.cell[0] + a.cell[1] - (b.cell[0] + b.cell[1])).forEach((p, i) => s.intro(`pkg-${p.id}`, 'opacity', 0.35 + i * 0.03, 0.25, 0, 1, ease.out));

  s.loop(loopLength, 7.2);
  const hop = (id: Id, t: number, by: number) => {
    s.at(`pkg-${id}`, 'translate', t, 0.3, '0 0', `0 ${-by}px`, pull);
    s.at(`pkg-${id}`, 'translate', t + 0.3, 0.74, `0 ${-by}px`, '0 0', settle);
  };

  hop(changed, beat.edit, 8);
  s.at('edit', 'opacity', beat.edit + 0.1, 0.25, 0, 1, ease.out);
  s.at('edit', 'translate', beat.edit + 0.1, 0.4, '0 6px', '0 0', ease.out);
  
  packages.forEach(p => {
    const t = beat.scan + p.cell[0] * beat.tier + p.cell[1] * 0.083;
    if (rebuilt.includes(p.id)) {
      s.at(`${p.id}-need`, 'opacity', t, 0.3, 0, 1, ease.linear);
    } else {
      s.at(`${p.id}-hit`, 'opacity', t, 0.3, 0, 1, ease.linear);
      hop(p.id, t, 4);
    }
  });
  const scanEnd = beat.scan + 3 * beat.tier + 3 * 0.083 + 0.3;
  s.at('edit', 'opacity', scanEnd - 0.3, 0.3, 1, 0, ease.linear);
  s.at('cached', 'opacity', scanEnd, 0.25, 0, 1, ease.out);
  s.at('cached', 'translate', scanEnd, 0.4, '0 6px', '0 0', ease.out);

  const buildAt = (id: Id, t: number) => {
    s.at(`${id}-on`, 'opacity', t, 0.3, 0, 1, ease.linear);
    s.at(`${id}-need`, 'opacity', t, 0.3, 1, 0, ease.linear);
    s.at(`pkg-${id}`, 'translate', t, 0.35, '0 0', '0 -8px', pull);
    s.at(`pkg-${id}`, 'translate', t + beat.buildFor - 0.1, 0.74, '0 -8px', '0 0', settle);
  };
  buildAt(changed, beat.build);
  const after = beat.build + beat.buildFor;
  edges.filter(([a]) => a === changed).forEach(([a, b], i) => {
    const dur = Math.max(0.3, s.wireLength(`e-${a}-${b}`) / 270);
    s.draw(`lit-${a}-${b}`, after - 0.2, 0.6, ruleDraw);
    s.travel(`p-${a}-${b}`, after - 0.2 + i * 0.05, dur);
    s.retract(`lit-${a}-${b}`, beat.reset, 0.3, 'end');
  });
  rebuilt.slice(1).forEach((id, i) => buildAt(id, beat.build + beat.next + i * 0.12));
  s.at('built', 'opacity', beat.done, 0.25, 0, 1, ease.out);
  s.at('built', 'translate', beat.done, 0.4, '0 6px', '0 0', ease.out);

  s.at('cached', 'opacity', beat.reset, 0.35, 1, 0, ease.linear);
  s.at('built', 'opacity', beat.reset, 0.35, 1, 0, ease.linear);
  packages.forEach(p => {
    const t = beat.reset + (6 - p.cell[0] - p.cell[1]) * 0.033;
    if (rebuilt.includes(p.id)) s.at(`${p.id}-on`, 'opacity', t, 0.4, 1, 0, ease.linear);
    else s.at(`${p.id}-hit`, 'opacity', t, 0.4, 1, 0, ease.linear);
  });
  return s;
}

export const example: Example = {
  slug: 'build-cache',
  title: 'Monorepo build cache',
  story: 'One package changes, eleven packages come straight back from the cache, and only the changed package and the two that depend on it build again.',
  prompt: 'Draw a monorepo as a grid of packages with dependency lines; one package changes, it and its dependents rebuild while the rest light up as cache hits, with an "11 of 14 cached" label.',
  level: 'medium',
  category: 'infra',
  layout: 'field',
  useCase: 'Monorepo',
  surface: 'light',
  interaction: 'watch',
  art: art(build({ name: 'cache-sm', width: 390, height: 410, origin: [195, 172], k: 0.9, minPx: narrowest, side: false }), build({ name: 'cache-lg', width: 720, height: 400, origin: [262, 190], k: 1.1, minPx: 521, side: true }), 520),
};

export default page(example);
