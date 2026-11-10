import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso.ts';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared.ts';

const ui = surfaces.light;
const teal = '#0d9488';
const tealInk = '#0f766e';
const rose = '#e11d48';
const okInk = '#047857';
const hit = 'rgb(20 184 166 / .16)';
const out = 'rgb(244 63 94 / .14)';
const line = 'rgb(22 23 27 / .14)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const merge = 'cubic-bezier(.52,.18,.25,1)';
const popIn = 'linear(0, 0.007 1.5%, 0.033 3.3%, 0.078 5%, 0.14 6.8%, 0.216 8.5%, 0.305 10.3%, 0.709 17.3%, 0.863 20.3%, 0.936 22%, 0.987 23.5%, 1.03 25.3%, 1.052 26.8%, 1.06 28.2%, 1.06 38.3%, 1.015 67.5%, 1)';

const houses = [
  { id: 'oslo', counts: ['120'] },
  { id: 'lyon', counts: ['140'] },
  { id: 'porto', counts: ['90', '78', '98'] },
  { id: 'graz', counts: ['130', '110'] },
] as const;
type House = 0 | 1 | 2 | 3;
const order: House = 2;
const from: House = 3;

const shipAt = 0.5;
const cut = shipAt + 0.45;
const syncAt = cut + 0.45;
const moveAt = 4.6;
const lift = moveAt + 0.5;
const glide = 1.0;
const landed = lift + glide;
const resync = landed + 0.45;
const reset = 10.7;
const loopLength = 12;

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: Vec2;
  k: number;
  minPx: number;
  sku: Vec2;
  log: { at: Vec2; gap: number };
}

function build({ name, width, height, origin, k, minPx, sku, log }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const size = 116 * k;
  const h = 34 * k;
  const pitch = 182 * k;
  const crate = 34 * k;
  const crateH = 14 * k;
  const wz = -10 * k;
  const big = width > 720 ? 24 : 18;
  const small = width > 720 ? 12 : 11;
  const y = (i: number) => (i - (houses.length - 1) / 2) * pitch;
  const top = (i: number): Vec3 => [0, y(i), 0];
  const seat = (i: number): Vec3 => [-size / 2 + crate / 2 + 9 * k, y(i) - size / 2 + crate / 2 + 9 * k, crateH];
  const end = (i: number, side: 1 | -1): Vec3 => [0, y(i) + (side * size) / 2, wz];

  for (let i = 0; i < houses.length - 1; i++) {
    s.wire({ id: `w-${i}`, points: [end(i, 1), end(i + 1, -1)], stroke: ui.wire, width: 1.25 });
    s.wire({ id: `f-${i}`, points: [end(i, 1), end(i + 1, -1)], stroke: 'none' });
    s.wire({ id: `b-${i}`, points: [end(i + 1, -1), end(i, 1)], stroke: 'none' });
    s.pulse({ id: `pf-${i}`, wire: `f-${i}`, color: teal, length: 0.3 });
    s.pulse({ id: `pb-${i}`, wire: `b-${i}`, color: teal, length: 0.3 });
  }

  houses.forEach((w, i) => {
    const at = top(i);
    const r = size * 0.18;
    s.group(`${w.id}-g`, () => {
      s.slab({ id: w.id, at, size: [size, size], height: h, radius: r, top: ui.top, side: i === order ? paints.gradient(s, ramps.teal) : paints.brushed(s, ramps.silver), grain: 0.08, edge: ui.edge, outline: i === order ? 'rgb(15 118 110 / .35)' : line });
      s.face({ id: `${w.id}-hit`, at, size: [size, size], radius: r, fill: hit });
      if (i === order || i === from) s.face({ id: `${w.id}-out`, at, size: [size, size], radius: r, fill: out });
      s.text({ id: `${w.id}-name`, at: [size / 2 - 12 * k, y(i), 0], text: w.id, size: small, color: ui.muted, on: 'top', along: 'y', anchor: 'middle' });
      w.counts.forEach((c, j) => s.text({ id: `${w.id}-c${j}`, at: [2 * k, y(i) - 4 * k, 0], text: c, size: big, weight: 600, font: 'sans', color: ui.ink, on: 'top', anchor: 'middle' }));
      s.text({ id: `${w.id}-s0`, at: [2 * k, y(i) + 28 * k, 0], text: 'Σ 480', size: small, color: ui.muted, on: 'top', anchor: 'middle' });
      s.text({ id: `${w.id}-s1`, at: [2 * k, y(i) + 28 * k, 0], text: 'Σ 468', size: small, color: tealInk, on: 'top', anchor: 'middle' });
    });
  });

  const box = (id: string, i: number, ramp: typeof ramps.teal | typeof ramps.rose) => {
    s.group(`${id}-move`, () => {
      s.slab({ id, at: [seat(i)[0], seat(i)[1], h + crateH], size: [crate, crate], height: crateH, radius: 7 * k, top: ramp[3], side: paints.gradient(s, ramp), edge: ui.edge, outline: `${ramp[1]}66`, shadow: false });
    });
    s.pivot(id, [seat(i)[0], seat(i)[1], h]);
  };
  box('ship', order, ramps.rose);
  box('move', from, ramps.teal);

  s.label({ id: 'sku', at: { screen: [fitX(sku[0], 'TEE-BLK-M · 4 warehouses', width, minPx, 'left'), sku[1]] }, text: 'TEE-BLK-M · 4 warehouses', size: 13, anchor: 'left' });
  const rows = [
    { id: 'row-order', html: `<span style="color:${rose}">−12</span> order · porto`, text: '−12 order · porto' },
    { id: 'row-agree', html: `<span style="color:${okInk}">✓</span> 4/4 agree · Σ 468`, text: '✓ 4/4 agree · Σ 468' },
    { id: 'row-move', html: `<span style="color:${tealInk}">⇄</span> 20 moved · graz → porto`, text: '⇄ 20 moved · graz → porto' },
  ] as const;
  rows.forEach((r, i) => s.label({ id: r.id, at: { screen: [fitX(log.at[0], r.text, width, minPx, 'left'), log.at[1] + i * log.gap] }, html: r.html, size: 13, anchor: 'left' }));

  houses.forEach((w, i) => s.dropIn(`${w.id}-g`, 0.1 + i * 0.083));
  s.intro('sku', 'opacity', 0.5, 0.3, 0, 1, ease.out);
  s.intro('sku', 'translate', 0.5, 0.4, '0 8px', '0 0', ease.out);
  s.introUntil(1.0);

  s.loop(loopLength, landed + 2.2);

  const swap = (a: string, b: string, t: number) => {
    s.at(a, 'opacity', t, 0.25, 1, 0, ease.linear);
    s.at(b, 'opacity', t + 0.1, 0.3, 0, 1, ease.linear);
  };
  const flash = (id: string, t: number, face: 'hit' | 'out' = 'hit', peak = 1) => {
    s.at(`${id}-${face}`, 'opacity', t, 0.1, 0, peak, ease.linear);
    s.at(`${id}-${face}`, 'opacity', t + 0.1, 0.6, peak, 0, ease.linear);
  };
  const bump = (id: string, t: number) => {
    s.at(`${id}-g`, 'translate', t, 0.14, '0 0', '0 4px', ease.out);
    s.at(`${id}-g`, 'translate', t + 0.14, 0.74, '0 4px', '0 0', settle);
  };
  const row = (id: string, t: number) => {
    s.at(id, 'opacity', t, 0.3, 0, 1, ease.out);
    s.at(id, 'translate', t, 0.45, '-8px 0', '0 0', ease.out);
  };
  const dur = (wire: string) => Math.max(0.3, s.wireLength(wire) / 270);
  const sync = (start: number, onArrive: (house: number, t: number) => unknown) => {
    const up = start + dur(`b-${order - 1}`);
    s.travel(`pb-${order - 1}`, start);
    s.travel(`pf-${order}`, start);
    onArrive(order - 1, up);
    onArrive(order + 1, start + dur(`f-${order}`));
    s.travel(`pb-${order - 2}`, up + 0.05);
    const last = up + 0.05 + dur(`b-${order - 2}`);
    onArrive(order - 2, last);
    return last;
  };

  s.at('ship', 'scale', shipAt, 0.6, 0, 1, popIn);
  s.at('ship', 'opacity', shipAt, 0.1, 0, 1, ease.linear);
  s.at('ship-move', 'translate', cut, 0.8, '0 0', `0 ${-48 * k}px`, ease.out);
  s.at('ship', 'opacity', cut + 0.25, 0.5, 1, 0, ease.linear);
  flash('porto', cut, 'out');
  bump('porto', cut);
  swap('porto-c0', 'porto-c1', cut + 0.05);
  swap('porto-s0', 'porto-s1', cut + 0.1);
  row('row-order', cut + 0.15);
  s.set('ship-move', 'translate', cut + 0.9, '0 0');

  const agreed = sync(syncAt, (i, t) => {
    const w = houses[i]!.id;
    flash(w, t);
    bump(w, t);
    swap(`${w}-s0`, `${w}-s1`, t + 0.05);
  });
  houses.forEach((w, i) => flash(w.id, agreed + 0.7 + i * 0.06, 'hit', 0.6));
  row('row-agree', agreed + 0.7);

  s.at('move', 'scale', moveAt, 0.6, 0, 1, popIn);
  s.at('move', 'opacity', moveAt, 0.1, 0, 1, ease.linear);
  flash('graz', moveAt + 0.05, 'out', 0.8);
  swap('graz-c0', 'graz-c1', moveAt + 0.15);
  s.at('move-move', 'translate', lift, glide, '0 0', s.offset(seat(from), seat(order)), settle);
  s.at('move', 'translate', lift, glide * 0.45, '0 0', `0 ${-22 * k}px`, ease.out);
  s.at('move', 'translate', lift + glide * 0.45, glide * 0.55, `0 ${-22 * k}px`, '0 0', ease.in);
  s.at('move', 'translate', landed + 0.1, 0.6, '0 0', `0 ${crateH}px`, merge);
  s.at('move', 'opacity', landed + 0.3, 0.4, 1, 0, ease.linear);
  flash('porto', landed + 0.35);
  bump('porto', landed + 0.35);
  swap('porto-c1', 'porto-c2', landed + 0.4);
  row('row-move', landed + 0.5);
  sync(resync + 0.3, (i, t) => {
    flash(houses[i]!.id, t, 'hit', 0.7);
    bump(houses[i]!.id, t);
  });
  s.set('move-move', 'translate', resync + 1.5, '0 0');
  s.set('move', 'translate', resync + 1.5, '0 0');

  rows.forEach((r, i) => s.at(r.id, 'opacity', reset + i * 0.06, 0.35, 1, 0, ease.linear));
  s.at('porto-c2', 'opacity', reset, 0.3, 1, 0, ease.linear);
  s.at('graz-c1', 'opacity', reset, 0.3, 1, 0, ease.linear);
  s.at('porto-c0', 'opacity', reset + 0.4, 0.4, 0, 1, ease.linear);
  s.at('graz-c0', 'opacity', reset + 0.4, 0.4, 0, 1, ease.linear);
  houses.forEach((w, i) => {
    s.at(`${w.id}-s1`, 'opacity', reset + i * 0.06, 0.3, 1, 0, ease.linear);
    s.at(`${w.id}-s0`, 'opacity', reset + 0.4 + i * 0.06, 0.4, 0, 1, ease.linear);
  });
  return s;
}

export const example: Example = {
  slug: 'stock-sync',
  title: 'Inventory in sync',
  ask: 'Show stock staying in sync across warehouses.',
  story: 'An order ships from one warehouse and its stock drops, the change syncs house to house until every total agrees, then another warehouse restocks it.',
  prompt: 'Draw four warehouses along a diagonal, each showing its stock and the network total: an order ships from one and its count drops, the change syncs warehouse to warehouse until all totals agree, then a neighbour sends it a crate of stock.',
  level: 'complex',
  intent: 'flow',
  layout: 'diagonal',
  useCase: 'Inventory',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build({ name: 'stock-sm', width: 390, height: 500, origin: [204, 196], k: 0.66, minPx: narrowest, sku: [24, 40], log: { at: [24, 384], gap: 38 } }),
    build({ name: 'stock-lg', width: 1100, height: 520, origin: [520, 250], k: 1.15, minPx: 721, sku: [80, 70], log: { at: [740, 330], gap: 40 } }),
    720,
  ),
};

export default page(example);
