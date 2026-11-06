import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fonts, page, ramps, surfaces, type Example, fitX, narrowest, paints } from './shared';

const ui = surfaces.dark;
const amber = ramps.amber;

const services = [
  { id: 'api', cell: [-2, -0.5], p95: '38 ms' },
  { id: 'auth', cell: [-1, -0.5], p95: '42 ms' },
  { id: 'cache', cell: [0, -0.5], p95: '3 ms' },
  { id: 'files', cell: [1, -0.5], p95: '61 ms' },
  { id: 'search', cell: [2, -0.5], p95: '55 ms' },
  { id: 'mail', cell: [-2, 0.5], p95: '140 ms' },
  { id: 'billing', cell: [-1, 0.5], p95: '27 ms' },
  { id: 'jobs', cell: [0, 0.5], p95: '12 ms' },
  { id: 'logs', cell: [1, 0.5], p95: '8 ms' },
] as const;

type Service = (typeof services)[number];
type Id = Service['id'];

const path: readonly Id[] = ['api', 'auth', 'billing', 'jobs'];

type Layout = { name: string; width: number; height: number; origin: readonly [number, number]; k: number };

function build({ name, width, height, origin, k }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const pitch = 112 * k;
  const size = 74 * k;
  const h = 18 * k;
  const radius = 13 * k;
  const lift = 16;
  const at = (id: Id): Vec3 => {
    const c = services.find(x => x.id === id)!.cell;
    return [c[0] * pitch, c[1] * pitch, 0];
  };
  const blur = s.blur(9 * k);

  path.slice(1).forEach((id, i) => {
    const a = at(path[i]!);
    const b = at(id);
    const dx = Math.sign(b[0] - a[0]);
    const dy = Math.sign(b[1] - a[1]);
    const points: Vec3[] = [[a[0] + (dx * size) / 2, a[1] + (dy * size) / 2, -h], [b[0] - (dx * size) / 2, b[1] - (dy * size) / 2, -h]];
    s.wire({ id: `w-${i}`, points, stroke: ui.wire, width: 1.25 });
    s.wire({ id: `lit-${i}`, points, stroke: 'rgb(251 191 36 / .55)', width: 1.5, hidden: true });
    s.pulse({ id: `p-${i}`, wire: `w-${i}`, color: amber[2], length: 0.45 });
  });

  services.forEach(sv => {
    const p = at(sv.id);
    const r = (size + 26 * k) / 2;
    s.svg(`${sv.id}-glow`, s.plane([p[0], p[1], -h], `<rect x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" rx="${radius * 1.6}" fill="${amber[2]}" opacity=".9" filter="${blur}"/>`));
  });

  services.forEach(sv => {
    const p = at(sv.id);
    const tag = s.project([p[0], p[1], 38 * k + lift]);
    s.label({ id: `${sv.id}-stat`, at: { screen: [fitX(tag[0], `${sv.id} · p95 ${sv.p95}`, width, width > 500 ? 521 : narrowest), tag[1]] }, text: `${sv.id} · p95 ${sv.p95}`, size: 13 });
  });

  [...services].sort((a, b) => a.cell[0] + a.cell[1] - (b.cell[0] + b.cell[1])).forEach(sv => {
    const p = at(sv.id);
    const name = `<text text-anchor="middle" dominant-baseline="central" font-size="${11}" fill="#d4d4d8" style="font-family:var(--iso-mono)">${sv.id}</text>`;
    s.slab({
      id: sv.id,
      at: p,
      size: [size, size],
      height: h,
      radius,
      top: ui.top,
      side: paints.brushed(s, ramps.graphite),
      grain: 0.06,
      edge: ui.edge,
      content: name,
      hover: { lift, top: '#262014', side: paints.gradient(s, amber), edge: 'rgb(251 191 36 / .7)', guides: 'rgb(251 191 36 / .5)', label: `${sv.id}-stat` },
    });
  });

  const api = at('api');
  s.label({ id: 'request', at: [api[0], api[1], 44 * k], text: 'GET /checkout', size: 13 });
  s.label({ id: 'result', at: [api[0], api[1], 44 * k], text: '200 OK · 118 ms', size: 13 });

  services.forEach((sv, i) => s.dropIn(sv.id, 0.1 + i * 0.083));

  s.loop(8, 3.6);
  s.at('request', 'opacity', 0.3, 0.25, 0, 1, ease.out);
  s.at('request', 'translate', 0.3, 0.4, '0 8px', '0 0', ease.out);
  const hop = 0.75;
  const arrive = path.map((_, i) => 0.6 + i * hop);
  path.forEach((id, i) => {
    const t = arrive[i]!;
    const next = arrive[i + 1] ?? 5.4;
    s.at(`${id}-glow`, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at(`${id}-glow`, 'opacity', next, 0.6, 1, 0, ease.linear);
    if (i === 0) return;
    const dur = 0.3;
    s.travel(`p-${i - 1}`, t - dur, dur);
    s.draw(`lit-${i - 1}`, t - dur, dur, ease.linear);
    s.retract(`lit-${i - 1}`, 5.6 + (i - 1) * 0.1, 0.3, 'start', ease.in);
  });
  services.forEach(sv => {
    if (!path.includes(sv.id)) s.set(`${sv.id}-glow`, 'opacity', 0, 0);
  });
  const done = arrive[arrive.length - 1]! + 0.3;
  s.at('result', 'opacity', done, 0.25, 0, 1, ease.out);
  s.at('result', 'translate', done, 0.4, '0 8px', '0 0', ease.out);
  s.at('request', 'opacity', done - 0.05, 0.2, 1, 0, ease.linear);
  s.at('result', 'opacity', 5.5, 0.3, 1, 0, ease.linear);
  return s;
}

export const example: Example = {
  slug: 'service-map',
  title: 'Live service map',
  story: 'A request lights its path through api, auth, billing and jobs, and any service lifts to show its p95 latency when you point at it.',
  prompt: 'Draw two rows of service tiles where a request lights a path through four of them, and hovering a tile lifts it and shows its p95 latency.',
  level: 'simple',
  category: 'infra',
  layout: 'field',
  useCase: 'Platform',
  surface: 'dark',
  interaction: 'hover',
  art: art(
    build({ name: 'svcmap-sm', width: 390, height: 330, origin: [197, 166], k: 0.7 }),
    build({ name: 'svcmap-lg', width: 720, height: 400, origin: [366, 206], k: 0.98 }),
    520,
  ),
};

export default page(example);
