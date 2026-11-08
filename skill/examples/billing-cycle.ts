import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const accent = '#d97706';
const accentInk = '#b45309';
const okInk = '#047857';
const line = 'rgb(22 23 27 / .14)';
const paidInk = '#065f46';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const shift = 'cubic-bezier(.49,.19,.28,.81)';
const slideOut = 'cubic-bezier(.38,.08,0,.97)';
const popIn = 'linear(0, 0.007 1.5%, 0.033 3.3%, 0.078 5%, 0.14 6.8%, 0.216 8.5%, 0.305 10.3%, 0.709 17.3%, 0.863 20.3%, 0.936 22%, 0.987 23.5%, 1.03 25.3%, 1.052 26.8%, 1.06 28.2%, 1.06 38.3%, 1.015 67.5%, 1)';

const months = 6;
const now = 3;

const statuses = [
  { id: 'st-renew', html: `<span style="color:${accentInk}">●</span> Pro plan renews · $49/mo` },
  { id: 'st-print', html: `<span style="color:${ui.muted}">invoice</span> INV-1042 printed` },
  { id: 'st-sent', html: `<span style="color:${ui.muted}">invoice</span> sent to customer` },
  { id: 'st-paid', html: `<span style="color:${okInk}">✓</span> paid · $49.00` },
] as const;

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: Vec2;
  k: number;
  flow: Vec2;
  cross: Vec2;
  strip: (i: number) => readonly [number, number];
  engine: number;
  out: number;
  customer: number;
  narrow: number;
  status: 'below' | 'bottom';
}

function build(l: Layout) {
  const s = new Scene({ name: l.name, width: l.width, height: l.height, origin: l.origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const { k } = l;
  const at = (f: number, c: number, z = 0): Vec3 => [f * l.flow[0] + c * l.cross[0], f * l.flow[1] + c * l.cross[1], z];
  const month = (i: number, z = 0) => at(...l.strip(i), z);
  const tile = 60 * k;
  const tileH = 10 * k;
  const engine = at(l.engine, 0);
  const engineSize = 120 * k;
  const engineH = 46 * k;
  const customer = at(l.customer, 0);
  const custSize = 104 * k;
  const custH = 24 * k;
  const card: Vec2 = [84 * k, 84 * k];
  const ts = (size: number) => Math.round(size * (0.5 + k / 2) * 2) / 2;
  const cardH = 4 * k;
  const wireZ = 4 * k;

  const a = month(now, wireZ);
  const b: Vec3 = [engine[0], engine[1], wireZ];
  const start: Vec3 = [a[0], a[1] + Math.sign(b[1] - a[1]) * (tile / 2), wireZ];
  const corner: Vec3 = [a[0], b[1], wireZ];
  const end: Vec3 = [b[0] + Math.sign(a[0] - b[0]) * (engineSize / 2), b[1], wireZ];
  s.wire({ id: 'w-renew', points: [start, corner, end], stroke: ui.wire, width: 1.25 });
  s.pulse({ id: 'p-renew', wire: 'w-renew', color: accent, length: 0.16 });

  s.group('strip', () => {
    for (let i = 0; i < months; i++) {
      const top = month(i, tileH);
      s.group(`m${i}`, () => {
        if (i <= now + 1) s.slab({ id: `m${i}-s`, at: top, size: [tile, tile], height: tileH, radius: 10 * k, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.06, edge: ui.edge, outline: line, shadow: false });
        if (i === now) s.face({ id: 'm-lit', at: top, size: [tile, tile], radius: 10 * k, fill: 'rgb(245 158 11 / .2)', stroke: 'rgb(217 119 6 / .6)' });
        if (i <= now) s.face({ id: `m${i}-dot`, at: top, size: [12 * k, 12 * k], radius: 6 * k, fill: '#10b981' });
        if (i >= now + 1) s.face({ id: `m${i}-dash`, at: month(i, 0), size: [tile, tile], radius: 10 * k, stroke: 'rgb(22 23 27 / .2)', dash: '3 3' });
      });
      if (i <= now) s.pivot(`m${i}-dot`, top);
    }
  });

  s.group('customer-g', () => {
    const top: Vec3 = [customer[0], customer[1], custH];
    s.slab({ id: 'customer', at: top, size: [custSize, custSize], height: custH, radius: 16 * k, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.06, edge: ui.edge, outline: line });
    s.face({ id: 'customer-glow', at: top, size: [custSize, custSize], radius: 16 * k, fill: 'rgb(16 185 129 / .18)' });
    s.text({ id: 'customer-name', at: [top[0] + custSize / 2 - 12 * k, top[1], top[2]], text: 'customer', size: 11, color: '#4b4e57', on: 'top', along: 'y', anchor: 'middle' });
  });

  const cardRest: Vec3 = [engine[0], engine[1], cardH];
  const cardOut: Vec3 = at(l.out, 0, cardH);
  const cardHome: Vec3 = [customer[0], customer[1], custH + cardH];
  s.group('card', () => {
    s.slab({ id: 'card-s', at: cardRest, size: card, height: cardH, radius: 6 * k, top: ui.top, side: paints.flat('#d4d4d8'), edge: ui.edge, outline: line, shadow: false });
    s.text({ id: 'card-no', at: [cardRest[0], cardRest[1] - 24 * k, cardH], text: 'INV-1042', size: ts(10), color: '#3f3f46', on: 'top', anchor: 'middle' });
    s.text({ id: 'card-sum', at: [cardRest[0], cardRest[1] - 3 * k, cardH], text: '$49.00', size: ts(13), weight: 600, color: '#18181b', on: 'top', anchor: 'middle' });
    s.text({ id: 'stamp', at: [cardRest[0], cardRest[1] + 23 * k, cardH], text: 'PAID', size: ts(11), weight: 600, color: paidInk, on: 'top', anchor: 'middle', pill: { fill: 'rgb(16 185 129 / .14)', stroke: paidInk, radius: 3 } });
  });
  s.pivot('stamp', [cardRest[0], cardRest[1] + 23 * k, cardH]);

  s.group('engine-g', () => {
    const top: Vec3 = [engine[0], engine[1], engineH];
    s.slab({ id: 'engine', at: top, size: [engineSize, engineSize], height: engineH, radius: 18 * k, top: ui.top, side: paints.gradient(s, ramps.gold), grain: 0.08, edge: ui.edge, outline: 'rgb(180 83 9 / .3)' });
    s.face({ id: 'engine-glow', at: top, size: [engineSize, engineSize], radius: 18 * k, fill: 'rgb(245 158 11 / .22)' });
    s.text({ id: 'engine-name', at: top, text: 'billing', size: 12, color: '#92400e', on: 'top', anchor: 'middle' });
  });

  const outAt = s.project(at(l.out, 0));
  const statusAt: Vec2 = l.status === 'below' ? [outAt[0], outAt[1] + 70 * k] : [l.width / 2, l.height - 44];
  statuses.forEach(st => s.label({ id: st.id, at: { screen: [fitX(statusAt[0], 'Pro plan renews · $49/mo', l.width, l.narrow), statusAt[1]] }, html: st.html, size: 13, anchor: 'top' }));

  s.dropIn('strip', 0.1);
  s.dropIn('engine-g', 0.25);
  s.dropIn('customer-g', 0.35);
  s.intro('st-renew', 'opacity', 0.6, 0.3, 0, 1, ease.out);
  s.intro('st-renew', 'translate', 0.6, 0.4, '0 8px', '0 0', ease.out);

  const status = (from: string, to: string, t: number) => {
    s.at(from, 'opacity', t, 0.25, 1, 0, ease.linear);
    s.at(to, 'opacity', t + 0.1, 0.3, 0, 1, ease.out);
    s.at(to, 'translate', t + 0.1, 0.45, '0 6px', '0 0', ease.out);
  };
  const nudge = (id: string, t: number, px: number) => s.at(id, 'translate', t, 0.3, '0 0', `0 ${px}px`, pull).at(id, 'translate', t + 0.3, 0.74, `0 ${px}px`, '0 0', settle);
  const flash = (id: string, t: number) => s.at(id, 'opacity', t, 0.1, 0, 1, ease.linear).at(id, 'opacity', t + 0.1, 0.6, 1, 0, ease.linear);

  s.at('m-lit', 'opacity', 0.3, 0.3, 0, 1, ease.linear);
  const renew = 0.55;
  const travel = Math.max(0.3, s.wireLength('w-renew') / 270);
  s.travel('p-renew', renew, travel);
  const hit = renew + travel;
  flash('engine-glow', hit);
  nudge('engine-g', hit, 4);

  const printAt = hit + 0.25;
  s.at('card', 'translate', printAt, 1.0, '0 0', s.offset(cardRest, cardOut), slideOut);
  status('st-renew', 'st-print', printAt + 0.2);

  const sendAt = printAt + 1.5;
  s.at('card', 'translate', sendAt, 1.0, s.offset(cardRest, cardOut), s.offset(cardRest, cardHome), settle);
  status('st-print', 'st-sent', sendAt + 0.1);
  const landed = sendAt + 0.85;
  flash('customer-glow', landed);
  s.at('customer-name', 'opacity', sendAt + 0.4, 0.3, 1, 0, ease.linear);
  nudge('customer-g', landed, 3);

  const paidAt = landed + 0.35;
  s.at('stamp', 'opacity', paidAt, 0.1, 0, 1, ease.linear);
  s.at('stamp', 'scale', paidAt, 0.6, 0, 1, popIn);
  status('st-sent', 'st-paid', paidAt + 0.1);
  s.at(`m${now}-dot`, 'opacity', paidAt + 0.3, 0.1, 0, 1, ease.linear);
  s.at(`m${now}-dot`, 'scale', paidAt + 0.3, 0.6, 0, 1, popIn);
  s.at('m-lit', 'opacity', paidAt + 0.4, 0.6, 1, 0, ease.linear);

  const away = paidAt + 1.9;
  s.at('card', 'opacity', away, 0.4, 1, 0, ease.linear);
  s.at('customer-name', 'opacity', away, 0.4, 0, 1, ease.linear);
  s.set('card', 'translate', away + 0.45, '0 0');
  s.set('card', 'opacity', away + 0.5, 1);
  s.set('stamp', 'opacity', away + 0.5, 0);
  status('st-paid', 'st-renew', away + 0.6);

  const scroll = away + 0.3;
  s.at('strip', 'translate', scroll, 0.82, '0 0', s.offset(month(1), month(0)), shift);
  s.at('m0', 'opacity', scroll, 0.5, 1, 0, ease.linear);
  s.at(`m${now + 1}-s`, 'opacity', scroll + 0.2, 0.5, 0, 1, ease.linear);
  s.at(`m${now + 1}-dash`, 'opacity', scroll + 0.2, 0.4, 1, 0, ease.linear);
  s.at(`m${now + 2}`, 'opacity', scroll + 0.2, 0.5, 0, 1, ease.linear);
  const reset = scroll + 0.9;
  s.set('strip', 'translate', reset, '0 0');
  s.set('m0', 'opacity', reset, 1);
  s.set(`m${now}-dot`, 'opacity', reset, 0);
  s.set(`m${now + 1}-s`, 'opacity', reset, 0);
  s.set(`m${now + 1}-dash`, 'opacity', reset, 1);
  s.set(`m${now + 2}`, 'opacity', reset, 0);
  s.loop(Math.round((reset + 0.4) * 10) / 10, paidAt + 0.9);
  return s;
}

const wideStrip = (i: number) => [150 + i * 96, 0] as const;
const compactStrip = (i: number) => [70, -128 + i * 66] as const;

export const example: Example = {
  slug: 'billing-cycle',
  title: 'Monthly renewal',
  ask: 'Show a subscription renewing until its invoice is paid.',
  story: 'The subscription reaches its renewal month, billing prints an invoice, sends it to the customer and a paid stamp lands on it as the month is marked paid.',
  prompt: 'Draw a subscription renewing along a timeline of months: at renewal the billing block prints an invoice card, the card is sent to the customer and a green paid stamp lands on it, then the timeline moves on a month.',
  level: 'medium',
  intent: 'change',
  layout: 'wide',
  useCase: 'Billing',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build({ name: 'billing-sm', width: 390, height: 560, origin: [195, 40], k: 0.75, flow: [Math.SQRT1_2, Math.SQRT1_2], cross: [Math.SQRT1_2, -Math.SQRT1_2], strip: compactStrip, engine: 330, out: 480, customer: 640, narrow: narrowest, status: 'bottom' }),
    build({ name: 'billing-lg', width: 1260, height: 420, origin: [0, 214], k: 1, flow: [Math.SQRT1_2, -Math.SQRT1_2], cross: [Math.SQRT1_2, Math.SQRT1_2], strip: wideStrip, engine: 770, out: 930, customer: 1110, narrow: 721, status: 'below' }),
    720,
  ),
};

export default page(example);
