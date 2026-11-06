import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.dark;
const call = '#a78bfa';
const done = '#34d399';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const shrinkAway = 'cubic-bezier(.33,0,.91,.03)';
const popIn = 'linear(0, 0.007 1.5%, 0.033 3.3%, 0.078 5%, 0.14 6.8%, 0.216 8.5%, 0.305 10.3%, 0.709 17.3%, 0.863 20.3%, 0.936 22%, 0.987 23.5%, 1.03 25.3%, 1.052 26.8%, 1.06 28.2%, 1.06 38.3%, 1.015 67.5%, 1)';

const systems = [
  { id: 'db', side: -1, row: -1, hex: [-1, 0], work: 0.35 },
  { id: 'search', side: -1, row: 0, hex: [-1, 1], work: 0.6 },
  { id: 'cache', side: -1, row: 1, hex: [0, 1], work: 0.15 },
  { id: 'events', side: 1, row: -1, hex: [0, -1], work: 0.9 },
  { id: 'crm', side: 1, row: 0, hex: [1, -1], work: 0.45 },
  { id: 'backup', side: 1, row: 1, hex: [1, 0], work: 1.7 },
] as const;
type System = (typeof systems)[number];

const send = 1.0;
const reset = 10.9;

type Layout = { name: string; width: number; height: number; origin: Vec2; k: number; reach: number; pitch: number; wide: boolean };

function build({ name, width, height, origin, k, reach, pitch, wide }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const core: Vec3 = [0, 0, 10 * k];
  const coreSize = 124 * k;
  const coreH = 40 * k;
  const tile = 88 * k;
  const tileH = 22 * k;
  const rec = 38 * k;
  const recH = 9 * k;
  const D = reach * k;
  const P = pitch * k;
  const wz = -11 * k;
  const minPx = wide ? 721 : narrowest;
  const posOf = (sys: System): Vec3 => (wide ? [sys.hex[0] * D, sys.hex[1] * D, 0] : [sys.side * D, sys.row * P, 0]);
  const route = (sys: System): Vec2[] => {
    const [x, y] = posOf(sys);
    const c = coreSize / 2;
    const t = tile / 2;
    if (!wide) {
      const bus = (c + D - t) / 2;
      const from: Vec2 = [sys.side * c, 0];
      const to: Vec2 = [x - sys.side * t, y];
      return y === 0 ? [from, to] : [from, [sys.side * bus, 0], [sys.side * bus, y], to];
    }
    if (x !== 0 && y !== 0) {
      const dir = Math.sign(x);
      const lane = -dir * 30 * k;
      return [[dir * c, lane], [(dir * D) / 2, lane], [(dir * D) / 2, y], [x - dir * t, y]];
    }
    return x === 0 ? [[0, Math.sign(y) * c], [0, y - Math.sign(y) * t]] : [[Math.sign(x) * c, 0], [x - Math.sign(x) * t, 0]];
  };

  systems.forEach(sys => {
    const points = route(sys).map(([x, y]): Vec3 => [x, y, wz]);
    s.wire({ id: `w-${sys.id}`, points, stroke: ui.wire, width: 1.25 });
    s.wire({ id: `r-${sys.id}`, points: [...points].reverse(), stroke: 'none' });
    s.pulse({ id: `out-${sys.id}`, wire: `w-${sys.id}`, color: call, length: 0.16 });
    s.pulse({ id: `back-${sys.id}`, wire: `r-${sys.id}`, color: done, length: 0.16 });
  });

  const drawCore = () =>
    s.group('core', () => {
      s.slab({ id: 'core-slab', at: core, size: [coreSize, coreSize], height: coreH, radius: 22 * k, top: ui.top, side: paints.gradient(s, ramps.violet), grain: 0.06, edge: ui.edge });
      s.face({ id: 'core-glow', at: core, size: [coreSize, coreSize], radius: 22 * k, fill: 'rgb(167 139 250 / .26)' });
      s.face({ id: 'core-ok', at: core, size: [coreSize, coreSize], radius: 22 * k, fill: 'rgb(52 211 153 / .2)' });
      s.text({ id: 'core-name', at: [core[0] + coreSize / 2 - 16 * k, 0, core[2]], text: 'erase', size: wide ? 12 : 10, color: '#c4b5fd', on: 'top', along: 'y', anchor: 'middle' });
      for (let n = 0; n <= systems.length; n++) s.text({ id: `count-${n}`, at: [core[0] - 8 * k, 0, core[2]], text: `${n}/${systems.length}`, size: wide ? 18 : 14, weight: 500, color: n === systems.length ? done : '#ececef', on: 'top', anchor: 'middle' });
    });

  const drawSystem = (sys: (typeof systems)[number], i: number) => {
    const at = posOf(sys);
    const recAt: Vec3 = [at[0] - 15 * k, at[1] - 4 * k, recH];
    s.group(sys.id, () => {
      s.slab({ id: `${sys.id}-slab`, at, size: [tile, tile], height: tileH, radius: 15 * k, top: ui.top, side: paints.brushed(s, ramps.graphite), grain: 0.06, edge: ui.edge });
      s.face({ id: `${sys.id}-hit`, at, size: [tile, tile], radius: 15 * k, fill: 'rgb(167 139 250 / .22)' });
      s.face({ id: `${sys.id}-slot`, at: [recAt[0], recAt[1], 0], size: [rec, rec], radius: 8 * k, stroke: 'rgb(255 255 255 / .16)', dash: '3 3' });
      s.text({ id: `${sys.id}-name`, at: [at[0] + tile / 2 - 12 * k, at[1], 0], text: sys.id, size: wide ? 11 : 10, color: '#a1a1aa', on: 'top', along: 'y', anchor: 'middle' });
    });
    s.group(`rec-${sys.id}`, () => {
      s.slab({ id: `rec-${sys.id}-slab`, at: recAt, size: [rec, rec], height: recH, radius: 8 * k, top: '#221a35', side: paints.random(s, ramps.violet, 40 + i * 13, 2), edge: 'rgb(196 181 253 / .35)', shadow: false });
    });
    s.pivot(`rec-${sys.id}`, [recAt[0], recAt[1], 0]);
    const badge: Vec3 = [at[0], at[1], 34 * k];
    const [cx, cy] = s.project(badge);
    const r = 10 * k;
    s.svg(`ok-${sys.id}`, `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${done}"/><path d="M${cx - r * 0.42} ${cy + r * 0.02}l${r * 0.3} ${r * 0.3} ${r * 0.56}-${r * 0.6}" fill="none" stroke="#022c22" stroke-width="${2 * k}" stroke-linecap="round" stroke-linejoin="round"/>`);
    s.pivot(`ok-${sys.id}`, badge);
  };

  const order = [...systems.map((sys, i) => ({ depth: posOf(sys)[0] + posOf(sys)[1], draw: () => drawSystem(sys, i) })), { depth: 0, draw: drawCore }].sort((a, b) => a.depth - b.depth);
  order.forEach(o => o.draw());

  const top = s.project([0, 0, core[2]]);
  const ask = 'erase user 4821';
  const fin = 'user 4821 erased · 6/6';
  const labelY = wide ? top[1] - coreSize * 0.42 - 30 * k : s.project([D, P + tile / 2, -tileH])[1] + 30 * k;
  s.label({ id: 'ask', at: { screen: [fitX(top[0], ask, width, minPx), labelY] }, html: `<span style="color:${call}">●</span> erase user 4821`, size: 13, anchor: wide ? 'bottom' : 'top' });
  s.label({ id: 'fin', at: { screen: [fitX(top[0], fin, width, minPx), labelY] }, html: `<span style="color:${done}">✓</span> user 4821 erased <span style="color:${ui.muted}">· 6/6</span>`, size: 13, anchor: wide ? 'bottom' : 'top' });

  s.dropIn('core', 0.1);
  systems.forEach((sys, i) => {
    s.dropIn(sys.id, 0.25 + i * 0.083);
    s.dropIn(`rec-${sys.id}`, 0.45 + i * 0.083, 24 * k);
  });

  s.loop(12, 7.9);
  s.at('ask', 'opacity', 0.2, 0.25, 0, 1, ease.out);
  s.typeIn('ask', 0.2, 0.6, 15);
  s.at('core-glow', 'opacity', send - 0.2, 0.1, 0, 1, ease.linear);
  s.at('core-glow', 'opacity', send - 0.1, 0.6, 1, 0, ease.linear);
  s.at('core', 'translate', send - 0.2, 0.14, '0 0', '0 4px', ease.out);
  s.at('core', 'translate', send - 0.06, 0.74, '0 4px', '0 0', settle);

  const replies = systems
    .map((sys, i) => {
      const start = send + i * 0.06;
      const dur = Math.max(0.35, s.wireLength(`w-${sys.id}`) / 270);
      const arrive = start + dur;
      const clear = arrive + 0.2 + sys.work;
      const back = clear + 0.65;
      const home = back + dur;
      s.travel(`out-${sys.id}`, start, dur);
      s.at(`${sys.id}-hit`, 'opacity', arrive, 0.1, 0, 1, ease.linear);
      s.at(`${sys.id}-hit`, 'opacity', arrive + 0.1, 0.6, 1, 0, ease.linear);
      s.at(sys.id, 'translate', arrive, 0.3, '0 0', '0 -5px', pull);
      s.at(sys.id, 'translate', arrive + 0.3, 0.74, '0 -5px', '0 0', settle);
      s.at(`rec-${sys.id}`, 'translate', arrive, 0.3, '0 0', '0 -5px', pull);
      s.at(`rec-${sys.id}`, 'translate', arrive + 0.3, 0.74, '0 -5px', '0 0', settle);
      s.at(`rec-${sys.id}`, 'scale', clear, 0.6, 1, 0, shrinkAway);
      s.at(`rec-${sys.id}`, 'opacity', clear + 0.3, 0.3, 1, 0, ease.linear);
      s.at(`ok-${sys.id}`, 'opacity', clear + 0.5, 0.08, 0, 1, ease.linear);
      s.at(`ok-${sys.id}`, 'scale', clear + 0.5, 0.6, 0, 1, popIn);
      s.travel(`back-${sys.id}`, back, dur);
      return home;
    })
    .sort((a, b) => a - b);

  const steps = replies.reduce<number[]>((acc, home) => [...acc, Math.max(home, (acc[acc.length - 1] ?? 0) + 0.4)], []);
  steps.forEach((home, n) => {
    s.at(`count-${n}`, 'opacity', home, 0.2, 1, 0, ease.linear);
    s.at(`count-${n + 1}`, 'opacity', home, 0.2, 0, 1, ease.linear);
    s.at('core-ok', 'opacity', home, 0.1, 0, 1, ease.linear);
    s.at('core-ok', 'opacity', home + 0.1, 0.28, 1, 0, ease.linear);
  });
  const last = steps[steps.length - 1]!;
  s.at('ask', 'opacity', last + 0.1, 0.3, 1, 0, ease.linear);
  s.at('fin', 'opacity', last + 0.3, 0.3, 0, 1, ease.out);
  s.at('fin', 'translate', last + 0.3, 0.45, '0 8px', '0 0', ease.out);

  s.at('fin', 'opacity', reset - 1.2, 0.35, 1, 0, ease.linear);
  s.at(`count-${systems.length}`, 'opacity', reset - 0.9, 0.3, 1, 0, ease.linear);
  s.at('count-0', 'opacity', reset - 0.6, 0.3, 0, 1, ease.linear);
  systems.forEach((sys, i) => {
    s.at(`ok-${sys.id}`, 'opacity', reset - 1.0 + i * 0.05, 0.3, 1, 0, ease.linear);
    s.set(`ok-${sys.id}`, 'scale', reset - 0.6, 0);
    s.set(`rec-${sys.id}`, 'scale', reset - 0.5, 1);
    s.dropAt(`rec-${sys.id}`, reset - 0.4 + i * 0.083, 18 * k);
  });
  return s;
}

export const example: Example = {
  slug: 'data-erasure',
  title: 'Right to erasure',
  story: 'One delete request fans out to every system holding a user’s data; each clears its copy, reports back with a check, and the count reaches 6/6.',
  prompt: 'Draw a user-data erasure request fanning out from one core to six systems (db, search, cache, events, crm, backup); each clears its record tile, a green check pops and a reply runs back until it reads user 4821 erased 6/6.',
  level: 'complex',
  category: 'security',
  layout: 'radial',
  useCase: 'Privacy',
  surface: 'dark',
  interaction: 'watch',
  art: art(
    build({ name: 'erasure-sm', width: 390, height: 440, origin: [195, 196], k: 0.65, reach: 210, pitch: 126, wide: false }),
    build({ name: 'erasure-lg', width: 1100, height: 520, origin: [550, 272], k: 1.1, reach: 300, pitch: 0, wide: true }),
    720,
  ),
};

export default page(example);
