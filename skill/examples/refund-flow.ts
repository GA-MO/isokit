import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example, type Ramp } from './shared';

const ui = surfaces.dark;
interface Look {
  ramp: Ramp;
  wire: string;
  glow: string;
  ink: string;
}
const pay: Look = { ramp: ramps.sky, wire: '#38bdf8', glow: 'rgb(56 189 248 / .3)', ink: '#7dd3fc' };
const back: Look = { ramp: ramps.amber, wire: '#fbbf24', glow: 'rgb(251 191 36 / .3)', ink: '#fcd34d' };
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const merge = 'cubic-bezier(.52,.18,.25,1)';
const popIn = 'linear(0, 0.007 1.5%, 0.033 3.3%, 0.078 5%, 0.14 6.8%, 0.216 8.5%, 0.305 10.3%, 0.709 17.3%, 0.863 20.3%, 0.936 22%, 0.987 23.5%, 1.03 25.3%, 1.052 26.8%, 1.06 28.2%, 1.06 38.3%, 1.015 67.5%, 1)';

const nodes = [
  { id: 'card', size: [104, 66], height: 8 },
  { id: 'gateway', size: [88, 88], height: 26 },
  { id: 'processor', size: [88, 88], height: 26 },
  { id: 'bank', size: [104, 104], height: 36 },
] as const;
const hop = 1.3;
const glide = 0.9;
const forward = 0.5;
const paid = forward + 2 * hop + glide;
const refund = 5.9;
const refunded = refund + 2 * hop + glide;
const clear = 11.0;

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: Vec2;
  k: number;
  minPx: number;
  paidAt: 'right' | 'below';
}

function build({ name, width, height, origin, k, minPx, paidAt }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const pitch = 170 * k;
  const token = 40 * k;
  const tokenH = 10 * k;
  const wz = -6 * k;
  const print = width > 520 ? 12 : 11;
  const x = (i: number) => (i - (nodes.length - 1) / 2) * pitch;
  const size = (i: number): Vec2 => [nodes[i]!.size[0] * k, nodes[i]!.size[1] * k];
  const top = (i: number): Vec3 => [x(i), 0, 0];
  const edge = (i: number, side: 1 | -1, z = wz): Vec3 => [x(i) + (side * size(i)[0]) / 2, 0, z];

  for (let i = 0; i < nodes.length - 1; i++) {
    const a = edge(i, 1);
    const b = edge(i + 1, -1);
    s.wire({ id: `w-${i}`, points: [a, b], stroke: ui.wire, width: 1.25 });
    s.wire({ id: `w-pay-${i}`, points: [a, b], stroke: pay.wire, width: 1.5, hidden: true });
    s.wire({ id: `w-ref-${i}`, points: [b, a], stroke: back.wire, width: 1.5, hidden: true });
  }

  nodes.forEach((n, i) => {
    const at = top(i);
    const sz = size(i);
    const h = n.height * k;
    const r = Math.min(sz[0], sz[1]) * 0.18;
    s.group(`${n.id}-g`, () => {
      s.slab({ id: n.id, at, size: sz, height: h, radius: r, top: ui.top, side: paints.brushed(s, ramps.graphite), grain: 0.06, edge: ui.edge, shadow: n.id !== 'card' });
      s.face({ id: `${n.id}-pay`, at, size: sz, radius: r, fill: pay.glow });
      s.face({ id: `${n.id}-ref`, at, size: sz, radius: r, fill: back.glow });
      if (n.id === 'card') {
        s.face({ id: 'card-chip', at: [x(i) - 26 * k, -14 * k, 0], size: [18 * k, 14 * k], radius: 3 * k, fill: 'rgb(255 255 255 / .18)' });
        s.text({ id: 'card-num', at: [x(i) + 4 * k, 18 * k, 0], text: '•••• 4242', size: print - 1, color: '#d4d4d8', on: 'top', anchor: 'middle' });
      } else s.text({ id: `${n.id}-name`, at: [x(i), sz[1] / 2, -h * 0.5], text: n.id, size: Math.min(print, h * 0.55), color: '#d4d4d8', on: 'left', anchor: 'middle' });
    });
  });

  const tokenAt = (i: number): Vec3 => [x(i), 0, nodes[i]!.height * k + tokenH];
  const flow = (id: string, c: Look, from: number) => {
    s.group(`${id}-move`, () => {
      s.group(id, () => {
        s.slab({ id: `${id}-slab`, at: tokenAt(from), size: [token, token], height: tokenH, radius: 9 * k, top: c.ink, side: paints.gradient(s, c.ramp), edge: 'rgb(255 255 255 / .5)', shadow: false });
      });
    });
    s.pivot(id, [x(from), 0, nodes[from]!.height * k]);
  };
  flow('pay', pay, 0);
  flow('ref', back, 3);

  const [bx, by] = s.project(top(3));
  const bank = s.extremes(top(3), size(3), 18 * k);
  const paidText = '✓ paid $42.00';
  s.label({
    id: 'paid',
    at: { screen: paidAt === 'right' ? [fitX(bank.right[0] + 16, paidText, width, minPx, 'left'), by - 17] : [fitX(bx, paidText, width, minPx), bank.front[1] + 36 * k + 14] },
    html: `<span style="color:${pay.ink}">✓</span> paid $42.00`,
    size: 13,
    anchor: paidAt === 'right' ? 'left' : 'top',
  });
  const card = s.extremes(top(0), size(0), 12 * k);
  const doneText = '↩ refunded $42.00 · confirmed';
  s.label({ id: 'refunded', at: { screen: [fitX(card.back[0], doneText, width, minPx), card.back[1] - 22] }, html: `<span style="color:${back.ink}">↩</span> refunded $42.00 · confirmed`, size: 13, anchor: 'bottom' });
  const issueText = 'refund issued';
  s.label({ id: 'issued', at: { screen: paidAt === 'right' ? [fitX(bank.right[0] + 16, issueText, width, minPx, 'left'), by + 17] : [fitX(bx, issueText, width, minPx), bank.front[1] + 36 * k + 50] }, html: `<span style="color:${back.ink}">↩</span> refund issued`, size: 13, anchor: paidAt === 'right' ? 'left' : 'top' });

  nodes.forEach((n, i) => s.dropIn(`${n.id}-g`, 0.1 + i * 0.083));
  s.dropIn('pay', 0.5);
  s.introUntil(1.0);

  s.loop(12, refunded + 1.2);

  const arrive = (node: string, c: 'pay' | 'ref', t: number) => {
    s.at(`${node}-${c}`, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at(`${node}-${c}`, 'opacity', t + 0.1, 0.7, 1, 0.2, ease.linear);
    s.at(`${node}-g`, 'translate', t, 0.14, '0 0', '0 4px', ease.out);
    s.at(`${node}-g`, 'translate', t + 0.14, 0.74, '0 4px', '0 0', settle);
  };
  const travel = (id: 'pay' | 'ref', from: number, to: number, t: number, home: number) => {
    s.at(`${id}-move`, 'translate', t, glide, s.offset(tokenAt(home), tokenAt(from)), s.offset(tokenAt(home), tokenAt(to)), settle);
    s.at(id, 'translate', t, glide * 0.45, '0 0', `0 ${-14 * k}px`, ease.out);
    s.at(id, 'translate', t + glide * 0.45, glide * 0.55, `0 ${-14 * k}px`, '0 0', ease.in);
  };

  s.at('card-pay', 'opacity', forward - 0.3, 0.1, 0, 1, ease.linear);
  s.at('card-pay', 'opacity', forward - 0.2, 0.7, 1, 0.2, ease.linear);
  for (let i = 0; i < 3; i++) {
    const t = forward + i * hop;
    travel('pay', i, i + 1, t, 0);
    s.draw(`w-pay-${i}`, t, glide, settle);
    arrive(nodes[i + 1]!.id, 'pay', t + glide);
  }
  s.at('paid', 'opacity', paid + 0.15, 0.3, 0, 1, ease.out);
  s.at('paid', 'translate', paid + 0.15, 0.45, paidAt === 'right' ? '-8px 0' : '0 -8px', '0 0', ease.out);
  s.at('pay', 'translate', paid + 0.4, 0.6, '0 0', `0 ${tokenH}px`, merge);
  s.at('pay', 'opacity', paid + 0.6, 0.4, 1, 0, ease.linear);

  s.at('ref', 'scale', refund - 0.6, 0.6, 0, 1, popIn);
  s.at('ref', 'opacity', refund - 0.6, 0.1, 0, 1, ease.linear);
  s.at('issued', 'opacity', refund - 0.5, 0.3, 0, 1, ease.out);
  s.at('issued', 'translate', refund - 0.5, 0.45, paidAt === 'right' ? '-8px 0' : '0 -8px', '0 0', ease.out);
  for (let i = 0; i < 3; i++) s.at(`w-pay-${i}`, 'opacity', refund - 0.4 + i * 0.08, 0.5, 1, 0.25, ease.linear);
  nodes.forEach(n => s.at(`${n.id}-pay`, 'opacity', refund - 0.4, 0.5, 0.2, 0, ease.linear));
  s.at('bank-ref', 'opacity', refund - 0.6, 0.1, 0, 1, ease.linear);
  s.at('bank-ref', 'opacity', refund - 0.5, 0.7, 1, 0.2, ease.linear);
  for (let j = 0; j < 3; j++) {
    const from = 3 - j;
    const t = refund + j * hop;
    travel('ref', from, from - 1, t, 3);
    s.draw(`w-ref-${from - 1}`, t, glide, settle);
    arrive(nodes[from - 1]!.id, 'ref', t + glide);
  }
  s.at('ref', 'translate', refunded + 0.2, 0.6, '0 0', `0 ${tokenH}px`, merge);
  s.at('ref', 'opacity', refunded + 0.4, 0.4, 1, 0, ease.linear);
  s.at('card-ref', 'opacity', refunded + 0.8, 0.6, 0.2, 1, ease.linear);
  s.at('refunded', 'opacity', refunded + 0.25, 0.3, 0, 1, ease.out);
  s.at('refunded', 'translate', refunded + 0.25, 0.45, '0 8px', '0 0', ease.out);

  ['paid', 'issued', 'refunded'].forEach(id => s.at(id, 'opacity', clear, 0.35, 1, 0, ease.linear));
  for (let i = 0; i < 3; i++) {
    s.at(`w-pay-${i}`, 'opacity', clear, 0.4, 0.25, 0, ease.linear);
    s.set(`w-pay-${i}`, 'strokeDashoffset', clear + 0.45, 1);
    s.set(`w-pay-${i}`, 'opacity', clear + 0.5, 1);
    s.retract(`w-ref-${i}`, clear + 0.05 * i, 0.4, 'end', ease.in);
  }
  nodes.forEach(n => s.at(`${n.id}-ref`, 'opacity', clear, 0.5, n.id === 'card' ? 1 : 0.2, 0, ease.linear));
  s.set('pay-move', 'translate', clear + 0.3, '0 0');
  s.set('pay', 'translate', clear + 0.3, '0 0');
  s.set('ref-move', 'translate', clear + 0.3, '0 0');
  s.set('ref', 'translate', clear + 0.3, '0 0');
  s.dropAt('pay', clear + 0.4, 30 * k);
  return s;
}

export const example: Example = {
  slug: 'refund-flow',
  title: 'Payment and refund',
  story: 'A payment travels from the card through the gateway and processor to the bank, then a refund runs back the same path in amber and lands on the card confirmed.',
  prompt: 'Draw a payment moving forward along a diagonal from a card through a gateway and a processor to the bank, the path lighting blue, then a refund running back the same path in amber and landing on the card with a confirmation.',
  level: 'medium',
  category: 'product',
  layout: 'diagonal',
  useCase: 'Payments',
  surface: 'dark',
  interaction: 'watch',
  art: art(
    build({ name: 'refund-sm', width: 390, height: 430, origin: [195, 186], k: 0.66, minPx: narrowest, paidAt: 'below' }),
    build({ name: 'refund-lg', width: 720, height: 400, origin: [298, 192], k: 0.9, minPx: 521, paidAt: 'right' }),
    520,
  ),
};

export default page(example);
