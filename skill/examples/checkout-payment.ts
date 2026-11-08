import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fonts, page, ramps, surfaces, type Example, paints } from './shared';

const ui = surfaces.light;
const accent = '#7c3aed';
const glow = 'rgb(139 92 246 / .2)';
const ok = '#047857';
const okTint = 'rgb(16 185 129 / .3)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const line = 'rgb(22 23 27 / .14)';

const nodes = [
  { id: 'checkout', ring: [-1, 1], size: 112, height: 26, side: ramps.silver },
  { id: 'gateway', ring: [-1, 0], size: 100, height: 30, side: ramps.violet },
  { id: 'fraud', ring: [-1, -1], size: 92, height: 22, side: ramps.silver },
  { id: 'network', ring: [0, -1], size: 92, height: 22, side: ramps.silver },
  { id: 'bank', ring: [1, -1], size: 108, height: 34, side: ramps.silver },
] as const;

const statuses = [
  { id: 'st-auth', html: 'authorizing…' },
  { id: 'st-risk', html: 'fraud check · risk 0.02' },
  { id: 'st-ok', html: `<span style="color:${ok}">✓</span> approved by bank` },
  { id: 'st-paid', html: `<span style="color:${ok}">✓</span> paid · receipt sent` },
] as const;

function build(name: string, width: number, height: number, origin: readonly [number, number], R: number, n: number, text: number, summaryAt: Vec2) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const at = (i: number): Vec3 => [nodes[i]!.ring[0] * R, nodes[i]!.ring[1] * R, 0];
  const half = (i: number) => (nodes[i]!.size * n) / 2;
  const wz = -12 * n;

  for (let i = 0; i < nodes.length - 1; i++) {
    const a = at(i);
    const b = at(i + 1);
    const alongY = a[0] === b[0];
    const pts: Vec3[] = alongY ? [[a[0], a[1] - half(i), wz], [b[0], b[1] + half(i + 1), wz]] : [[a[0] + half(i), a[1], wz], [b[0] - half(i + 1), b[1], wz]];
    s.wire({ id: `w-${i}`, points: pts, stroke: ui.wire, width: 1.25 });
    s.pulse({ id: `p-${i}`, wire: `w-${i}`, color: accent, length: 0.3 });
  }
  const bank = at(4);
  const checkout = at(0);
  const backLength = (2 * R - half(4) - half(0)) * Math.hypot(Math.SQRT1_2, Math.SQRT1_2 * Math.tan(Math.PI / 6));
  s.wire({ id: 'w-back', points: [[bank[0], bank[1] + half(4), wz], [R, R, wz], [checkout[0] + half(0), R, wz]], stroke: ui.wire, width: 1.25, dash: `${(3 / backLength).toFixed(4)} ${(5 / backLength).toFixed(4)}` });

  const order = [2, 1, 3, 0, 4];
  order.forEach(i => {
    const nd = nodes[i]!;
    const p = at(i);
    const size = [nd.size * n, nd.size * n] as const;
    const radius = nd.size * 0.18 * n;
    s.group(`${nd.id}-g`, () => {
      if (nd.id === 'fraud') s.face({ id: 'scan', at: [p[0], p[1], -nd.height * n], size: [size[0] + 26 * n, size[1] + 26 * n], radius: radius + 8 * n, stroke: accent, strokeWidth: 1.25, dash: '4 4' });
      s.slab({ id: nd.id, at: p, size, height: nd.height * n, radius, top: ui.top, side: paints.gradient(s, nd.side), grain: 0.05, edge: ui.edge, outline: nd.id === 'gateway' ? 'rgb(91 33 182 / .3)' : line });
      if (nd.id !== 'bank') s.face({ id: `${nd.id}-lit`, at: p, size, radius, fill: glow });
      if (nd.id === 'bank' || nd.id === 'checkout') s.face({ id: `${nd.id}-ok`, at: p, size, radius, fill: okTint, stroke: 'rgb(5 150 105 / .5)' });
      s.text({ id: `${nd.id}-name`, at: [p[0] + nd.size * n * 0.5 - 12 * n, p[1], 0], text: nd.id, size: text, color: nd.id === 'gateway' ? '#6d28d9' : '#4b4e57', on: 'top', along: 'y', anchor: 'middle' });
    });
  });

  const receiptFrom: Vec3 = [bank[0], bank[1], 8 * n];
  const corner: Vec3 = [R, R, 8 * n];
  const receiptTo: Vec3 = [checkout[0], checkout[1], 8 * n];
  s.group('receipt-move', () => {
    s.slab({ id: 'receipt', at: receiptFrom, size: [30 * n, 40 * n], height: 7 * n, radius: 6 * n, top: ui.top, side: paints.gradient(s, ramps.emerald), edge: ui.edge, outline: 'rgb(4 120 87 / .4)', shadow: false });
  });
  s.pivot('receipt', [receiptFrom[0], receiptFrom[1], 0]);

  s.label({ id: 'amount', at: { screen: summaryAt }, variant: 'card', size: 14, anchor: 'bottom', html: `<div style="font-size:.8em;color:${ui.muted};margin-bottom:.3em">order 1042</div><span style="font-weight:600">$48.00</span> <span style="color:${ui.muted}">· card ending 8317</span>` });
  statuses.forEach(st => s.label({ id: st.id, at: { screen: [summaryAt[0], summaryAt[1] + 12] }, html: st.html, size: 13, anchor: 'top' }));

  s.march('scan', 4, 4, 24);
  order.forEach((i, j) => s.dropIn(`${nodes[i]!.id}-g`, 0.1 + j * 0.083));
  s.intro('amount', 'opacity', 0.6, 0.3, 0, 1, ease.out);
  s.intro('amount', 'translate', 0.6, 0.4, '0 8px', '0 0', ease.out);

  s.loop(12, 8.6);
  const flash = (id: string, t: number, hold = 0) => {
    s.at(id, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at(id, 'opacity', t + 0.1 + hold, 0.6, 1, 0, ease.linear);
  };
  const tug = (id: string, t: number, by: string) => {
    s.at(id, 'translate', t, 0.3, '0 0', by, pull);
    s.at(id, 'translate', t + 0.3, 0.74, by, '0 0', settle);
  };
  const show = (id: string, t: number, until: number) => {
    s.at(id, 'opacity', t, 0.25, 0, 1, ease.out);
    s.at(id, 'translate', t, 0.4, '0 6px', '0 0', ease.out);
    s.at(id, 'opacity', until, 0.25, 1, 0, ease.linear);
  };

  flash('checkout-lit', 0.3);
  const legs = [0, 1, 2, 3].map(i => Math.max(0.35, s.wireLength(`w-${i}`) / 270));
  const holds = [0.35, 1.1, 0.35];
  const arrivals = legs.reduce<number[]>((acc, d, i) => [...acc, (i ? acc[i - 1]! + holds[i - 1]! + 0.15 : 0.5) + d], []);
  legs.forEach((d, i) => s.travel(`p-${i}`, arrivals[i]! - d, d));
  nodes.slice(1).forEach((nd, i) => {
    tug(`${nd.id}-g`, arrivals[i]!, '0 4px');
    if (nd.id !== 'bank') flash(`${nd.id}-lit`, arrivals[i]!, holds[i]!);
  });
  const [atGateway = 0, atFraud = 0, , atBank = 0] = arrivals;
  s.at('scan', 'opacity', atFraud, 0.15, 0, 1, ease.linear);
  s.at('scan', 'opacity', atFraud + 1.15, 0.35, 1, 0, ease.linear);

  show('st-auth', atGateway, atFraud - 0.05);
  show('st-risk', atFraud + 0.15, atBank);
  s.at('bank-ok', 'opacity', atBank, 0.3, 0, 1, ease.linear);
  s.at('bank-ok', 'opacity', 10.9, 0.5, 1, 0, ease.linear);
  const sent = atBank + 0.6;

  s.at('receipt', 'opacity', sent, 0.1, 0, 1, ease.linear);
  s.at('receipt', 'scale', sent, 0.23, 0.05, 1.14, ease.out);
  s.at('receipt', 'scale', sent + 0.23, 0.24, 1.14, 1, ease.io);
  const leg = 0.85;
  const go = sent + 0.5;
  s.at('receipt-move', 'translate', go, leg, '0 0', s.offset(receiptFrom, corner), 'cubic-bezier(.5,0,.8,.6)');
  s.at('receipt-move', 'translate', go + leg, leg * 1.4, s.offset(receiptFrom, corner), s.offset(receiptFrom, receiptTo), 'cubic-bezier(.2,.5,.04,1)');
  const home = go + leg * 2.4;
  show('st-ok', atBank + 0.25, home - 0.35);
  s.at('receipt', 'scale', home - 0.25, 0.12, 1, '1.08 0.9', ease.out);
  s.at('receipt', 'scale', home - 0.13, 0.3, '1.08 0.9', 1, ease.settle);
  s.at('checkout-ok', 'opacity', home - 0.3, 0.3, 0, 1, ease.linear);
  s.at('checkout-ok', 'opacity', 10.9, 0.5, 1, 0, ease.linear);
  tug('checkout-g', home - 0.3, '0 4px');
  show('st-paid', home - 0.05, 10.9);
  s.at('receipt', 'opacity', 10.9, 0.4, 1, 0, ease.linear);
  s.set('receipt-move', 'translate', 11.4, '0 0');
  return s;
}

const arts = (tag = '') =>
  art(build(`pay-sm${tag}`, 390, 460, [195, 176], 98, 0.56, 9, [195, 360]), build(`pay-lg${tag}`, 1120, 520, [560, 236], 230, 1, 12, [560, 312]), 760);

export const example: Example = {
  slug: 'checkout-payment',
  title: 'A card payment, round trip',
  ask: 'Show a card payment from checkout to the bank and back.',
  story: 'A checkout payment runs through the gateway, a fraud check and the card network to the bank, and the approval comes back as a receipt.',
  prompt: 'Draw a card payment as a ring: checkout to gateway, fraud check, card network and bank, the bank approves in green and a receipt travels back to checkout.',
  level: 'complex',
  intent: 'talk',
  layout: 'radial',
  useCase: 'Payments',
  surface: 'light',
  interaction: 'watch',
  art: arts(),
};

export const inContext = arts('-ctx');

export default page(example);
