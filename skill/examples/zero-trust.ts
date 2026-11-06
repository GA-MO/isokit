import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.dark;
const accent = '#2dd4bf';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const popIn = 'linear(0, 0.007 1.5%, 0.033 3.3%, 0.078 5%, 0.14 6.8%, 0.216 8.5%, 0.305 10.3%, 0.709 17.3%, 0.863 20.3%, 0.936 22%, 0.987 23.5%, 1.03 25.3%, 1.052 26.8%, 1.06 28.2%, 1.06 38.3%, 1.015 67.5%, 1)';

const lanes = [
  { id: 'remote', service: 'git', start: 0.3 },
  { id: 'ci', service: 'deploy', start: 1.95 },
  { id: 'office', service: 'payroll', start: 3.6 },
] as const;

const arrive = 0.95;
const stamp = 0.75;
const leave = 0.95;

type Layout = { name: string; width: number; height: number; origin: readonly [number, number]; k: number; reach: number; pitch: number; wide: boolean };

function build({ name, width, height, origin, k, reach, pitch, wide }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const tile = 72 * k;
  const tileH = 20 * k;
  const plate: readonly [number, number] = [60 * k, (lanes.length - 1) * pitch * k + 84 * k];
  const tok = 30 * k;
  const tokH = 12 * k;
  const X = reach * k;
  const laneY = (i: number) => (i - (lanes.length - 1) / 2) * pitch * k;
  const wz = -10 * k;
  const minPx = wide ? 521 : narrowest;

  lanes.forEach((l, i) => {
    const y = laneY(i);
    s.wire({ id: `w-in-${l.id}`, points: [[-X + tile / 2, y, wz], [-plate[0] / 2, y, wz]], stroke: ui.wire, width: 1.25 });
    s.wire({ id: `w-out-${l.id}`, points: [[plate[0] / 2, y, wz], [X - tile / 2, y, wz]], stroke: ui.wire, width: 1.25 });
  });

  s.group('policy', () => {
    s.slab({ id: 'policy-slab', at: [0, 0, 0], size: plate, height: 30 * k, radius: 14 * k, top: ui.top, side: paints.dots(s, ramps.teal, 4), grain: 0.06, edge: ui.edge });
    lanes.forEach((l, i) => s.face({ id: `check-${l.id}`, at: [0, laneY(i), 0], size: [44 * k, 44 * k], radius: 10 * k, fill: 'rgb(45 212 191 / .26)', stroke: 'rgb(45 212 191 / .6)' }));
    s.text({ id: 'policy-name', at: [0, -plate[1] / 2 + 15 * k, 0], text: 'policy', size: wide ? 11 : 10, color: '#99f6e4', on: 'top', anchor: 'middle' });
  });

  const station = (id: string, at: Vec3, label: string, side: ReturnType<typeof paints.brushed>) =>
    s.group(id, () => {
      s.slab({ id: `${id}-slab`, at, size: [tile, tile], height: tileH, radius: 13 * k, top: ui.top, side, grain: 0.06, edge: ui.edge });
      s.face({ id: `${id}-hit`, at, size: [tile, tile], radius: 13 * k, fill: 'rgb(45 212 191 / .22)' });
      s.text({ id: `${id}-name`, at: [at[0] + tile / 2 - 12 * k, at[1], 0], text: label, size: wide ? 11 : 10, color: '#a1a1aa', on: 'top', along: 'y', anchor: 'middle' });
    });
  lanes.forEach((l, i) => {
    station(`src-${l.id}`, [-X, laneY(i), 0], l.id, paints.brushed(s, ramps.graphite));
    station(`svc-${l.id}`, [X, laneY(i), 0], l.service, paints.random(s, ramps.graphite, 11 + i * 7));
  });

  lanes.forEach((l, i) => {
    const y = laneY(i);
    const home: Vec3 = [-X, y, tokH];
    const sealAt: Vec3 = [-X, y, tokH + 16 * k];
    const [cx, cy] = s.project(sealAt);
    const r = 9 * k;
    s.group(`req-${l.id}`, () => {
      s.slab({ id: `req-${l.id}-box`, at: home, size: [tok, tok], height: tokH, radius: 7 * k, top: '#20242a', side: paints.brushed(s, ramps.silver), edge: 'rgb(255 255 255 / .35)', shadow: false });
      s.svg(`seal-${l.id}`, `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${accent}"/><path d="M${cx - r * 0.42} ${cy + r * 0.02}l${r * 0.3} ${r * 0.3} ${r * 0.56}-${r * 0.6}" fill="none" stroke="#042f2e" stroke-width="${1.8 * k}" stroke-linecap="round" stroke-linejoin="round"/>`);
    });
    s.pivot(`seal-${l.id}`, sealAt);
  });

  const top = s.project([0, -plate[1] / 2, 0]);
  const tag = 'verify every request';
  const ruleAt: readonly [number, number] = wide ? [fitX(top[0] + 10 * k, tag, width, minPx, 'left'), top[1] - 30 * k] : [fitX(width, tag, width, minPx, 'right'), top[1] - 92 * k];
  s.label({ id: 'rule', at: { screen: ruleAt }, text: tag, size: 13, anchor: wide ? 'left' : 'right' });
  const office = s.project([-X, laneY(2) + tile / 2, -tileH]);
  const inside = 'internal · checked too';
  const below = s.project([X, laneY(2) + tile / 2, -tileH]);
  const insideAt: readonly [number, number] = wide ? [fitX(office[0], inside, width, minPx), office[1] + 26 * k] : [fitX(0, inside, width, minPx, 'left'), below[1] + 22 * k];
  s.label({ id: 'inside', at: { screen: insideAt }, html: `internal <span style="color:${accent}">· checked too</span>`, size: 13, anchor: wide ? 'top' : 'left' });

  s.dropIn('policy', 0.1);
  lanes.forEach((l, i) => {
    s.dropIn(`src-${l.id}`, 0.25 + i * 0.083);
    s.dropIn(`svc-${l.id}`, 0.35 + i * 0.083);
  });
  s.intro('rule', 'opacity', 0.7, 0.3, 0, 1, ease.out);
  s.intro('rule', 'translate', 0.7, 0.4, '0 8px', '0 0', ease.out);

  s.loop(8.6, 3.0);
  const flash = (id: string, t: number) => s.at(id, 'opacity', t, 0.1, 0, 1, ease.linear).at(id, 'opacity', t + 0.1, 0.6, 1, 0, ease.linear);
  lanes.forEach((l, i) => {
    const y = laneY(i);
    const id = `req-${l.id}`;
    const home: Vec3 = [-X, y, 0];
    const t0 = l.start;
    const atCheck = t0 + 0.6 + arrive;
    const go = atCheck + stamp;
    const land = go + leave;
    s.dropAt(id, t0, 26 * k);
    flash(`src-${l.id}-hit`, t0 + 0.2);
    s.at(id, 'translate', t0 + 0.6, arrive, '0 0', s.offset(home, [0, y, 0]), settle);
    s.at(`check-${l.id}`, 'opacity', atCheck - 0.15, 0.2, 0, 1, ease.linear);
    s.at(`check-${l.id}`, 'opacity', go + 0.1, 0.6, 1, 0, ease.linear);
    s.at(`seal-${l.id}`, 'opacity', atCheck, 0.08, 0, 1, ease.linear);
    s.at(`seal-${l.id}`, 'scale', atCheck, 0.6, 0, 1, popIn);
    s.at('policy', 'translate', atCheck - 0.02, 0.14, '0 0', '0 3px', ease.out);
    s.at('policy', 'translate', atCheck + 0.12, 0.6, '0 3px', '0 0', settle);
    s.at(id, 'translate', go, leave, s.offset(home, [0, y, 0]), s.offset(home, [X, y, 0]), settle);
    flash(`svc-${l.id}-hit`, land - 0.2);
    s.at(`svc-${l.id}`, 'translate', land - 0.2, 0.3, '0 0', '0 -6px', pull);
    s.at(`svc-${l.id}`, 'translate', land + 0.1, 0.74, '0 -6px', '0 0', settle);
    s.at(id, 'opacity', land - 0.1, 0.35, 1, 0, ease.linear);
    s.set(id, 'translate', land + 0.3, '0 0');
    s.set(`seal-${l.id}`, 'opacity', land + 0.3, 0);
    s.set(`seal-${l.id}`, 'scale', land + 0.31, 0);
    if (l.id === 'office') {
      s.at('inside', 'opacity', atCheck + 0.1, 0.25, 0, 1, ease.out);
      s.at('inside', 'translate', atCheck + 0.1, 0.4, '8px 0', '0 0', ease.out);
      s.at('inside', 'opacity', 7.6, 0.35, 1, 0, ease.linear);
    }
  });
  return s;
}

export const example: Example = {
  slug: 'zero-trust',
  title: 'Zero-trust access',
  story: 'Requests from a remote laptop, the office and CI all stop at one policy check, get stamped, and only then reach their service.',
  prompt: 'Draw zero-trust access: requests from remote, office and CI sources each stop at one policy check in front of the services, get a seal stamped on them, then continue to their service, the internal one included.',
  level: 'medium',
  category: 'security',
  useCase: 'Access',
  surface: 'dark',
  interaction: 'watch',
  art: art(
    build({ name: 'zerotrust-sm', width: 390, height: 420, origin: [195, 214], k: 0.74, reach: 140, pitch: 90, wide: false }),
    build({ name: 'zerotrust-lg', width: 720, height: 400, origin: [372, 196], k: 0.9, reach: 230, pitch: 108, wide: true }),
    520,
  ),
};

export default page(example);
