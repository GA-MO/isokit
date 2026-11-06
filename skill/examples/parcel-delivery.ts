import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const line = 'rgb(22 23 27 / .16)';
const ink = '#4b4e57';
const amber = '#b45309';
const done = '#047857';
const hopEase = 'cubic-bezier(.39,.08,.04,.91)';
const drive = 'cubic-bezier(.45,0,.2,1)';

const steps = ['label created', 'packed', 'in transit', 'at hub', 'out for delivery', 'delivered'] as const;

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: Vec2;
  k: number;
  leg: number;
  from: 1 | -1;
  status: Vec2;
  narrow: number;
}

const dots = (lit: number, color: string) =>
  `<span style="display:inline-flex;gap:.28em;margin-right:.6em;vertical-align:.1em">${steps.slice(1).map((_, i) => `<i style="display:block;width:.42em;height:.42em;border-radius:1em;background:${i < lit ? color : 'rgb(22 23 27 / .14)'}"></i>`).join('')}</span>`;

function build(l: Layout) {
  const s = new Scene({ name: l.name, width: l.width, height: l.height, origin: l.origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const { k, from } = l;
  const L = l.leg;
  const road = 52 * k;
  const hubSize = 120 * k;
  const hubH = 58 * k;
  const h = hubSize / 2 + road / 2 + 14 * k;
  const hub: Vec3 = [-h, -h, 0];
  const tableSize = 78 * k;
  const tableH = 30 * k;
  const table: Vec3 = [-(road / 2 + tableSize / 2 + 34 * k), from * -L, 0];
  const houseSize = 92 * k;
  const houseH = 66 * k;
  const house: Vec3 = [L + 70 * k, -(road / 2 + 34 * k + houseSize / 2), 0];
  const mat: Vec3 = [house[0] - 6 * k, house[1] + houseSize / 2 + 22 * k, 0];
  const truckStart: Vec3 = [0, from * -L, 0];
  const truckStop: Vec3 = [0, -h, 0];
  const vanStart: Vec3 = [-h - 6 * k, 0, 0];
  const vanStop: Vec3 = [L - 30 * k, 0, 0];

  const tw = 44 * k;
  const cargoLen = 70 * k;
  const cargoTop = 46 * k;
  const cabLen = 26 * k;
  const lift = 6 * k;
  const fwd = from;
  const cargoAt = (p: Vec3): Vec3 => [p[0], p[1] - fwd * 12 * k, p[2]];
  const cabAt = (p: Vec3): Vec3 => [p[0], p[1] + fwd * 38 * k, p[2]];
  const vw = 40 * k;
  const vanLen = 62 * k;
  const vanTop = 36 * k;
  const bodyAt = (p: Vec3): Vec3 => [p[0] - 10 * k, p[1], p[2]];
  const hoodAt = (p: Vec3): Vec3 => [p[0] + 32 * k, p[1], p[2]];

  const legA = Math.min(truckStart[1], truckStop[1]) - 40 * k;
  const legB = Math.max(truckStart[1], truckStop[1]) + 50 * k;
  s.face({ id: 'road-1', at: [0, (legA + legB) / 2, 0], size: [road, legB - legA], radius: road / 2, fill: 'rgb(22 23 27 / .045)' });
  const xA = vanStart[0] - 50 * k;
  const xB = house[0] + 20 * k;
  s.face({ id: 'road-2', at: [(xA + xB) / 2, 0, 0], size: [xB - xA, road], radius: road / 2, fill: 'rgb(22 23 27 / .045)' });
  s.wire({ id: 'lane-1', points: [[0, legA + 20 * k, 0], [0, legB - 20 * k, 0]], stroke: 'rgb(22 23 27 / .14)', width: 1, dash: '6 6' });
  s.wire({ id: 'lane-2', points: [[xA + 20 * k, 0, 0], [xB - 20 * k, 0, 0]], stroke: 'rgb(22 23 27 / .14)', width: 1, dash: '6 6' });

  const solid = (id: string, at: Vec3, size: Vec2, height: number, radius: number, extra: { grain?: number; shadow?: boolean } = {}) =>
    s.slab({ id, at, size, height, radius, top: ui.top, side: paints.gradient(s, ramps.silver), edge: ui.edge, outline: line, ...extra });

  s.group('hub-g', () => {
    const top: Vec3 = [hub[0], hub[1], hubH];
    solid('hub', top, [hubSize, hubSize], hubH, 18 * k, { grain: 0.05 });
    s.face({ id: 'hub-lit', at: top, size: [hubSize, hubSize], radius: 18 * k, fill: 'rgb(245 158 11 / .2)' });
    s.text({ id: 'hub-name', at: [top[0] + hubSize / 2 - 16 * k, top[1], top[2]], text: 'hub', size: 12, color: ink, on: 'top', along: 'y', anchor: 'middle' });
    [-30, 0, 30].forEach((dy, i) => s.svg(`dock-${i}`, s.plane([hub[0] + hubSize / 2, hub[1] + dy * k, 0], `<rect x="${-12 * k}" y="${-30 * k}" width="${24 * k}" height="${26 * k}" rx="${3 * k}" fill="rgb(22 23 27 / .07)" stroke="rgb(22 23 27 / .14)"/>`, 'right')));
  });

  s.group('table-g', () => {
    const top: Vec3 = [table[0], table[1], tableH];
    solid('table', top, [tableSize, tableSize], tableH, 12 * k);
    s.face({ id: 'table-lit', at: top, size: [tableSize, tableSize], radius: 12 * k, fill: 'rgb(245 158 11 / .2)' });
    s.text({ id: 'table-name', at: [top[0] + tableSize / 2 - 12 * k, top[1], top[2]], text: 'packing', size: 11, color: ink, on: 'top', along: 'y', anchor: 'middle' });
  });

  s.group('house-g', () => {
    const top: Vec3 = [house[0], house[1], houseH];
    solid('house', top, [houseSize, houseSize], houseH, 14 * k, { grain: 0.05 });
    s.svg('door', s.plane([house[0], house[1] + houseSize / 2, 0], `<rect x="${-12 * k}" y="${-40 * k}" width="${24 * k}" height="${40 * k}" rx="${3 * k}" fill="#e8e8e4" stroke="rgb(22 23 27 / .22)"/><circle cx="${6 * k}" cy="${-20 * k}" r="${1.6 * k}" fill="rgb(22 23 27 / .4)"/>`, 'left'));
    s.svg('door-ok', s.plane([house[0], house[1] + houseSize / 2, 0], `<rect x="${-12 * k}" y="${-40 * k}" width="${24 * k}" height="${40 * k}" rx="${3 * k}" fill="rgb(16 185 129 / .28)" stroke="rgb(4 120 87 / .5)"/>`, 'left'));
    s.svg('window', s.plane([house[0] + houseSize / 2, house[1], 0], `<rect x="${-16 * k}" y="${-48 * k}" width="${32 * k}" height="${20 * k}" rx="${3 * k}" fill="#eef2f7" stroke="rgb(22 23 27 / .18)"/>`, 'right'));
  });
  s.face({ id: 'mat', at: mat, size: [44 * k, 24 * k], radius: 5 * k, fill: 'rgb(22 23 27 / .07)', stroke: 'rgb(22 23 27 / .16)' });
  s.face({ id: 'mat-ok', at: mat, size: [44 * k, 24 * k], radius: 5 * k, fill: 'rgb(16 185 129 / .3)', stroke: 'rgb(4 120 87 / .55)' });

  const wheels = (id: string, points: readonly Vec3[], on: 'left' | 'right') => s.svg(id, points.map(p => s.plane(p, `<circle r="${7.5 * k}" fill="#3f3f46"/><circle r="${3 * k}" fill="#a1a1aa"/>`, on)).join(''));
  const vehicle = (id: string, parts: readonly { at: Vec3; size: Vec2; height: number; key: string }[], wheel: () => void) => {
    s.group(id, () => {
      s.group(`${id}-body`, () => {
        wheel();
        [...parts].sort((a, b) => a.at[0] + a.at[1] - (b.at[0] + b.at[1])).forEach(p => solid(`${id}-${p.key}`, [p.at[0], p.at[1], p.height + lift], p.size, p.height, 8 * k, { shadow: p.key !== 'cab' && p.key !== 'hood' }));
      });
    });
  };

  const c = cargoAt(truckStart);
  const cab = cabAt(truckStart);
  vehicle('truck', [{ key: 'cargo', at: c, size: [tw, cargoLen], height: cargoTop - lift }, { key: 'cab', at: cab, size: [tw - 4 * k, cabLen], height: 30 * k }], () =>
    wheels('truck-wheels', [[tw / 2, c[1] - fwd * 22 * k, lift], [tw / 2, c[1] + fwd * 24 * k, lift], [tw / 2 - 2 * k, cab[1], lift]], 'right'));
  const vb = bodyAt(vanStart);
  const vh = hoodAt(vanStart);
  vehicle('van', [{ key: 'box', at: vb, size: [vanLen, vw], height: vanTop - lift }, { key: 'hood', at: vh, size: [22 * k, vw - 4 * k], height: 18 * k }], () =>
    wheels('van-wheels', [[vb[0] - 18 * k, vw / 2, lift], [vh[0] - 2 * k, vw / 2 - 2 * k, lift]], 'left'));

  const boxSize = 30 * k;
  const boxH = 24 * k;
  const base: Vec3 = [table[0], table[1], tableH];
  s.group('box', () => {
    s.group('box-hop', () => {
      s.group('box-body', () => {
        s.slab({ id: 'parcel', at: [base[0], base[1], base[2] + boxH], size: [boxSize, boxSize], height: boxH, radius: 5 * k, top: '#fffbeb', side: paints.gradient(s, ramps.amber), edge: ui.edge, outline: 'rgb(180 83 9 / .35)', shadow: false });
        s.face({ id: 'tape', at: [base[0], base[1], base[2] + boxH + 0.5], size: [7 * k, boxSize], radius: 1, fill: 'rgb(217 119 6 / .45)' });
        s.slab({ id: 'lid', at: [base[0], base[1], base[2] + boxH + 4 * k], size: [boxSize + 3 * k, boxSize + 3 * k], height: 4 * k, radius: 6 * k, top: '#fffbeb', side: paints.flat('#d97706'), edge: ui.edge, outline: 'rgb(180 83 9 / .35)', shadow: false });
      });
    });
  });
  s.pivot('box-body', base);

  const stops = {
    table: base,
    truck: [cargoAt(truckStart)[0], cargoAt(truckStart)[1], cargoTop],
    truckHub: [cargoAt(truckStop)[0], cargoAt(truckStop)[1], cargoTop],
    hub: [hub[0], hub[1], hubH],
    van: [bodyAt(vanStart)[0], bodyAt(vanStart)[1], vanTop],
    vanDoor: [bodyAt(vanStop)[0], bodyAt(vanStop)[1], vanTop],
    mat: [mat[0], mat[1], 0],
  } satisfies Record<string, Vec3>;

  steps.forEach((step, i) => {
    const color = i === steps.length - 1 ? done : amber;
    const word = i === steps.length - 1 ? `<span style="color:${done}">✓ ${step}</span>` : step;
    s.label({ id: `st-${i}`, at: { screen: [fitX(l.status[0], `00000 ${steps[4]}`, l.width, l.narrow, 'left'), l.status[1]] }, html: `${dots(i, color)}${word}`, size: 13, anchor: 'left' });
  });

  s.dropIn('hub-g', 0.1);
  s.dropIn('table-g', 0.2);
  s.dropIn('house-g', 0.28);
  s.dropIn('truck-body', 0.4);
  s.dropIn('van-body', 0.48);
  s.intro('st-0', 'opacity', 0.7, 0.3, 0, 1, ease.out);
  s.intro('st-0', 'translate', 0.7, 0.4, '0 8px', '0 0', ease.out);

  let shown = 0;
  const status = (i: number, t: number) => {
    s.at(`st-${shown}`, 'opacity', t, 0.25, 1, 0, ease.linear);
    s.at(`st-${i}`, 'opacity', t + 0.1, 0.3, 0, 1, ease.out);
    s.at(`st-${i}`, 'translate', t + 0.1, 0.45, '0 6px', '0 0', ease.out);
    shown = i;
  };
  const flash = (id: string, t: number) => s.at(id, 'opacity', t, 0.1, 0, 1, ease.linear).at(id, 'opacity', t + 0.1, 0.6, 1, 0, ease.linear);
  const hop = (a: Vec3, b: Vec3, t: number, up = 34) => {
    const rise = Math.max(up, b[2] - a[2] + 20);
    s.at('box', 'translate', t, 0.95, s.offset(base, a), s.offset(base, b), hopEase);
    s.at('box-hop', 'translate', t, 0.38, '0 0', `0 ${-rise}px`, ease.out);
    s.at('box-hop', 'translate', t + 0.38, 0.4, `0 ${-rise}px`, '0 0', ease.in);
    s.at('box-body', 'scale', t + 0.78, 0.12, 1, '1.08 0.88', ease.out);
    s.at('box-body', 'scale', t + 0.9, 0.3, '1.08 0.88', 1, ease.settle);
    return t + 0.8;
  };

  s.at('lid', 'opacity', 0.3, 0.1, 0, 1, ease.out);
  s.at('lid', 'translate', 0.3, 0.32, `0 ${-26 * k}px`, '0 1px', ease.drop);
  s.at('lid', 'translate', 0.62, 0.23, '0 1px', '0 0', ease.settle);
  flash('table-lit', 0.62);
  status(1, 0.7);

  const onTruck = hop(stops.table, stops.truck, 1.3);
  s.at('truck', 'translate', onTruck, 0.3, '0 0', '0 2px', ease.out);
  s.at('truck', 'translate', onTruck + 0.3, 0.5, '0 2px', '0 0', ease.settle);

  const go1 = onTruck + 0.8;
  const dur1 = 2.0;
  s.at('truck', 'translate', go1, dur1, '0 0', s.offset(truckStart, truckStop), drive);
  s.at('box', 'translate', go1, dur1, s.offset(base, stops.truck), s.offset(base, stops.truckHub), drive);
  status(2, go1);

  const atHub = hop(stops.truckHub, stops.hub, go1 + dur1 + 0.2, 30);
  flash('hub-lit', atHub);
  s.at('hub-g', 'translate', atHub, 0.3, '0 0', '0 3px', 'cubic-bezier(.41,.27,.05,.79)');
  s.at('hub-g', 'translate', atHub + 0.3, 0.74, '0 3px', '0 0', 'cubic-bezier(.39,.08,.04,.91)');
  status(3, atHub);

  const onVan = hop(stops.hub, stops.van, atHub + 1.0, 20);
  const go2 = onVan + 0.4;
  const dur2 = 1.8;
  s.at('van', 'translate', go2, dur2, '0 0', s.offset(vanStart, vanStop), drive);
  s.at('box', 'translate', go2, dur2, s.offset(base, stops.van), s.offset(base, stops.vanDoor), drive);
  status(4, go2);

  const delivered = hop(stops.vanDoor, stops.mat, go2 + dur2 + 0.2, 24);
  s.at('mat-ok', 'opacity', delivered, 0.4, 0, 1, ease.linear);
  s.at('door-ok', 'opacity', delivered + 0.1, 0.4, 0, 1, ease.linear);
  status(5, delivered + 0.05);

  const clear = delivered + 1.7;
  ['box-hop', 'truck-body', 'van-body'].forEach((id, i) => s.at(id, 'opacity', clear + i * 0.05, 0.4, 1, 0, ease.linear));
  s.at('mat-ok', 'opacity', clear, 0.5, 1, 0, ease.linear);
  s.at('door-ok', 'opacity', clear, 0.5, 1, 0, ease.linear);
  const back = clear + 0.55;
  s.set('box', 'translate', back, '0 0');
  s.set('truck', 'translate', back, '0 0');
  s.set('van', 'translate', back, '0 0');
  s.set('lid', 'opacity', back, 0);
  s.dropAt('truck-body', back + 0.1);
  s.dropAt('van-body', back + 0.2);
  s.dropAt('box-hop', back + 0.35, 30);
  status(0, back + 0.3);
  s.loop(Math.round((back + 1.0) * 10) / 10, delivered + 0.9);
  return s;
}

export const example: Example = {
  slug: 'parcel-delivery',
  title: 'Parcel tracking',
  story: 'A box is packed, rides a truck to the hub, moves onto a van and lands on the doorstep, with the tracking status updating at every stop.',
  prompt: 'Draw a parcel being delivered: a box is packed and loaded onto a truck, passes through a hub, goes onto a van and arrives at a doorstep, with a tracking status line that updates at each stop.',
  level: 'complex',
  category: 'product',
  layout: 'wide',
  useCase: 'Logistics',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build({ name: 'parcel-sm', width: 390, height: 420, origin: [106, 262], k: 0.6, leg: 230, from: 1, status: [18, 40], narrow: narrowest }),
    build({ name: 'parcel-lg', width: 1260, height: 440, origin: [610, 205], k: 1, leg: 470, from: -1, status: [150, 60], narrow: 721 }),
    720,
  ),
};

export default page(example);
