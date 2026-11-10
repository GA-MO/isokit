import { Scene, ease, type Vec3 } from '../lib/iso.ts';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared.ts';

const ui = surfaces.light;
const accent = '#d97706';
const line = 'rgb(22 23 27 / .14)';
const shift = 'cubic-bezier(.49,.19,.28,.81)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';

const products = ['tote', 'mug', 'lamp', 'shoe'] as const;
type Product = (typeof products)[number];
const slots = products.length;
const beat = 3;
const signals: Readonly<Record<Product, string>> = { shoe: 'viewed: trail run', lamp: 'clicked: desk setup', mug: 'viewed: pour-over', tote: 'clicked: weekender' };
const order = (b: number): Product[] => products.map((_, k) => products[(((k - b) % slots) + slots) % slots]!);

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: readonly [number, number];
  k: number;
  minPx: number;
  signal: { dx: number; dy: number; anchor: 'left' | 'right' | 'top' };
  textSize: number;
}

function build(l: Layout) {
  const { k } = l;
  const s = new Scene({ name: l.name, width: l.width, height: l.height, origin: l.origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const tile = 60 * k;
  const pitch = 86 * k;
  const shelfLen = pitch * (slots - 1) + tile + 34 * k;
  const shelfTop = 12 * k;
  const slotAt = (i: number): Vec3 => [(i - (slots - 1) / 2) * pitch, 0, shelfTop];
  const userAt: Vec3 = [slotAt(slots - 1)[0], 178 * k, 0];
  const userSize = 54 * k;
  const step = s.offset(slotAt(0), slotAt(1));
  const out = 72 * k;

  s.wire({ id: 'w-signal', points: [[userAt[0], userAt[1] - userSize / 2, -8 * k], [userAt[0], 45 * k, -8 * k]], stroke: ui.wire, width: 1.25 });
  s.pulse({ id: 'p-signal', wire: 'w-signal', color: accent, length: 0.3 });

  s.slab({ id: 'shelf', at: [0, 0, 0], size: [shelfLen, 90 * k], height: shelfTop, radius: 18 * k, top: '#fbfbfa', side: paints.brushed(s, ramps.silver), grain: 0.06, edge: ui.edge, outline: line });

  const card = (id: string, at: Vec3, hot: boolean, glow: boolean) => {
    s.slab({ id: `${id}-n`, at, size: [tile, tile], height: 20 * k, radius: 13 * k, top: ui.top, side: paints.gradient(s, ramps.silver), grain: 0.08, edge: ui.edge, outline: line });
    if (hot) s.slab({ id: `${id}-hot`, at, size: [tile, tile], height: 20 * k, radius: 13 * k, top: '#fffbeb', side: paints.gradient(s, ramps.amber), grain: 0.08, edge: ui.edge, outline: 'rgb(180 83 9 / .35)' });
    if (glow) s.face({ id: `${id}-glow`, at, size: [tile, tile], radius: 13 * k, fill: 'rgb(245 158 11 / .16)', stroke: 'rgb(217 119 6 / .7)' });
    products.forEach(p => s.text({ id: `${id}-${p}`, at, text: p, size: l.textSize, color: '#4b4e57', on: 'top', anchor: 'middle' }));
  };
  for (let i = 0; i < slots; i++) s.group(`slot-${i}`, () => card(`slot-${i}`, slotAt(i), i === 0, i === slots - 1));
  s.group('mover', () => card('mover', slotAt(0), true, true));

  s.slab({ id: 'user', at: userAt, size: [userSize, userSize], height: 18 * k, radius: 27 * k, top: ui.top, side: paints.dots(s, ramps.amber, 3), grain: 0.08, edge: ui.edge, outline: 'rgb(180 83 9 / .35)' });
  s.text({ id: 'user-name', at: userAt, text: 'you', size: l.textSize, color: '#92400e', on: 'top', anchor: 'middle' });

  const [ux, uy] = s.project(userAt);
  const longest = Object.values(signals).reduce((a, b) => (b.length > a.length ? b : a));
  const sx = fitX(ux + l.signal.dx * k, longest, l.width, l.minPx, l.signal.anchor === 'top' ? 'center' : l.signal.anchor);
  products.forEach(p => {
    const [verb, what] = signals[p].split(': ');
    s.label({ id: `sig-${p}`, at: { screen: [sx, uy + l.signal.dy * k] }, html: `<span style="color:${ui.muted}">${verb}:</span> ${what}`, size: 13, anchor: l.signal.anchor });
  });

  s.dropIn('shelf', 0.1);
  for (let i = 0; i < slots; i++) s.dropIn(`slot-${i}`, 0.2 + i * 0.083);
  s.dropIn('user', 0.55);

  const show = (id: string, from: Product, to: Product, t: number) => {
    if (from === to) return;
    s.set(`${id}-${from}`, 'opacity', t, 0);
    s.set(`${id}-${to}`, 'opacity', t, 1);
  };
  const d = Math.max(0.3, s.wireLength('w-signal') / 270);
  const last = slots - 1;
  for (let b = 0; b < slots; b++) {
    const now = order(b);
    const next = order(b + 1);
    const best = now[last]!;
    const prev = order(b - 1)[last]!;
    const t0 = b * beat;
    s.at(`sig-${prev}`, 'opacity', t0 + 0.1, 0.2, 1, 0, ease.linear);
    s.at(`sig-${best}`, 'opacity', t0 + 0.2, 0.25, 0, 1, ease.out);
    s.at(`sig-${best}`, 'translate', t0 + 0.2, 0.45, '0 6px', '0 0', ease.out);
    s.travel('p-signal', t0 + 0.35, d);
    const a = t0 + 0.35 + d;
    s.at(`slot-${last}-glow`, 'opacity', a, 0.1, 0, 1, ease.linear);
    s.at(`slot-${last}`, 'translate', a, 0.23, '0 0', '0 -5px', pull);

    const take = a + 0.3;
    s.set(`slot-${last}`, 'opacity', take, 0);
    s.set(`slot-${last}-glow`, 'opacity', take, 0);
    s.set(`slot-${last}`, 'translate', take, '0 0');
    const from = s.offset(slotAt(0), [slotAt(last)[0], 0, shelfTop + 5]);
    const outLast = s.offset(slotAt(0), [slotAt(last)[0], out, shelfTop + 8]);
    const outFront = s.offset(slotAt(0), [slotAt(0)[0], out, shelfTop + 8]);
    show('mover', prev, best, take);
    s.set('mover', 'opacity', take, 1);
    s.at('mover', 'translate', take, 0.4, from, outLast, pull);
    s.at('mover', 'translate', take + 0.4, 0.9, outLast, outFront, settle);
    s.at('mover', 'translate', take + 1.3, 0.4, outFront, '0 0', settle);
    s.at('mover-glow', 'opacity', take, 0.6, 1, 0, ease.linear);
    s.at('mover-hot', 'opacity', take + 0.3, 0.6, 0, 1, ease.linear);
    for (let i = 0; i < last; i++) s.at(`slot-${i}`, 'translate', take + 0.2, 0.82, '0 0', step, shift);
    s.at('slot-0-hot', 'opacity', take + 0.2, 0.6, 1, 0, ease.linear);

    const jump = take + 1.75;
    for (let i = 0; i < last; i++) s.set(`slot-${i}`, 'translate', jump, '0 0');
    s.set(`slot-${last}`, 'opacity', jump, 1);
    s.set('slot-0-hot', 'opacity', jump, 1);
    s.set('mover', 'opacity', jump, 0);
    s.set('mover-hot', 'opacity', jump, 0);
    now.forEach((p, i) => show(`slot-${i}`, p, next[i]!, jump));
  }
  s.loop(slots * beat, 2.8);
  return s;
}

export const example: Example = {
  slug: 'recs-rerank',
  title: 'Recommendations re-rank',
  ask: 'Show recommendations re-ranking as a shopper browses.',
  story: 'Each time the shopper views or clicks something, the product that matches it best lifts off the shelf and moves to the front.',
  prompt: 'Draw a shelf of product tiles that re-orders when a view or click signal arrives, the best match lifting out and moving to the front while the rest shift back.',
  level: 'medium',
  intent: 'choose',
  layout: 'diagonal',
  useCase: 'Recommendations',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build({ name: 'recs-sm', width: 390, height: 400, origin: [195, 178], k: 0.8, minPx: narrowest, signal: { dx: 0, dy: 44, anchor: 'top' }, textSize: 10 }),
    build({ name: 'recs-lg', width: 720, height: 400, origin: [372, 170], k: 1.32, minPx: 521, signal: { dx: -54, dy: 0, anchor: 'right' }, textSize: 12 }),
    520,
  ),
};

export default page(example);
