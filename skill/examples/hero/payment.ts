import { ease, type Scene, type Vec2, type Vec3 } from '../../lib/iso';
import { paints } from '../shared';
import { hidden } from './motion';
import { link, piece, ui, type Story, type Variant } from './stage';

const mint = ['#064e3b', '#059669', '#6ee7b7', '#ecfdf5'] as const;
const money = '#059669';
const unlit = 'rgb(16 185 129 / 0)';
const hit = 'rgb(16 185 129 / .35)';

type Stop = 'checkout' | 'gateway' | 'network' | 'bank';
const stops: readonly { id: Stop; corner: Vec2; tag: string }[] = [
  { id: 'checkout', corner: [-1, 1], tag: 'paid' },
  { id: 'gateway', corner: [-1, -1], tag: 'routed' },
  { id: 'network', corner: [1, -1], tag: 'checked' },
  { id: 'bank', corner: [1, 1], tag: 'approved' },
];

const sizes: Record<Variant, { span: number; tile: number; tileH: number; name: number; tag: number; card: Vec2; amount: number }> = {
  wide: { span: 128, tile: 66, tileH: 22, name: 12, tag: 13, card: [118, 80], amount: 15 },
  compact: { span: 100, tile: 54, tileH: 18, name: 11, tag: 12, card: [92, 62], amount: 13 },
};

const leg = 0.78;
const track = 0.5;
const depart = track + 0.05;

function draw(s: Scene, v: Variant) {
  const k = sizes[v];
  const at = (c: Vec2, z = 0): Vec3 => [c[0] * k.span, c[1] * k.span, z];
  const halo = s.def('p-halo-fill', '<radialGradient id="$ID"><stop offset="0" stop-color="#6ee7b7" stop-opacity=".3"/><stop offset=".55" stop-color="#a7f3d0" stop-opacity=".12"/><stop offset="1" stop-color="#a7f3d0" stop-opacity="0"/></radialGradient>');
  piece(s, 'p-halo', () => s.face({ id: 'p-halo-face', at: [0, 0, 0], size: [k.span * 3, k.span * 3], radius: k.span * 1.5, fill: halo }), 0.05);

  const ring = [...stops, stops[0]!].map(st => at(st.corner));
  piece(s, 'p-loop', () => link(s, { id: 'p-track', points: ring, stroke: 'rgb(6 95 70 / .22)', width: 1.5, corner: 1 }, { pulse: { id: 'p-coin', color: money, length: 0.07, width: 3.5, glow: false } }));

  const [cw, ch] = k.card;
  const cardTop = '#065f46';
  const chip = `<rect x="${cw * 0.18}" y="${-ch * 0.36}" width="${cw * 0.16}" height="${ch * 0.2}" rx="2" fill="#fcd34d" opacity=".9"/>`;
  piece(
    s,
    'p-card',
    () => {
      s.slab({ id: 'p-card-box', at: [0, 0, 5], size: [cw, ch], height: 5, radius: 8, top: cardTop, side: paints.flat('#064e3b'), edge: 'rgb(255 255 255 / .35)', shadow: false, content: chip });
      s.face({ id: 'p-card-hit', at: [0, 0, 5], size: [cw, ch], radius: 8, fill: unlit });
      s.text({ id: 'p-amount', at: [cw * 0.08, 0, 5], text: '$24.00', size: k.amount, color: '#ecfdf5', on: 'top', along: 'y', anchor: 'middle', weight: 600 });
    },
    0.05,
  );

  const depth = (c: Vec2) => c[0] + c[1];
  const side = paints.gradient(s, mint);
  [...stops]
    .sort((a, b) => depth(a.corner) - depth(b.corner))
    .forEach((st, i) => {
      const p = at(st.corner, k.tileH);
      piece(
        s,
        `p-${st.id}`,
        () => {
          s.slab({ id: `p-${st.id}-box`, at: p, size: [k.tile, k.tile], height: k.tileH, radius: k.tile * 0.2, top: ui.top, side, edge: 'rgb(255 255 255 / .95)', outline: 'rgb(6 78 59 / .22)', shadow: false });
          s.face({ id: `p-${st.id}-hit`, at: p, size: [k.tile, k.tile], radius: k.tile * 0.2, fill: unlit });
          s.text({ id: `p-${st.id}-name`, at: p, text: st.id, size: k.name, color: '#065f46', on: 'top', along: 'y', anchor: 'middle', font: 'sans', weight: 500 });
        },
        0.13 + i * 0.083,
      );
    });

  piece(s, 'p-tags', () => {
    for (const st of stops) {
      const [x, y] = s.project(at(st.corner, k.tileH));
      s.group(`p-tag-${st.id}`, () => s.text({ id: `p-tag-${st.id}-text`, at: { screen: [x, st.id === 'bank' ? y + k.tile * 0.62 + k.tileH : y - k.tile * 0.62] }, text: st.tag, size: k.tag, color: '#065f46', font: 'sans', weight: 500, pill: { fill: '#ffffff', stroke: 'rgb(5 150 105 / .4)', radius: k.tag * 0.8 } }));
    }
  });

  s.at('p-track', 'strokeDashoffset', 0, track, hidden, 0, ease.out);
  s.at('p-track', 'strokeDashoffset', 5.7, 0.3, 0, hidden, ease.in);
  s.intro('p-coin', 'opacity', 0, 0.01, 1, 1, ease.linear);
  s.at('p-coin', 'strokeDashoffset', depart, leg * 4, 0.07, -1, ease.linear);
  s.at('p-card-hit', 'fill', depart - 0.15, 0.1, unlit, hit, ease.linear);
  s.at('p-card-hit', 'fill', depart - 0.05, 0.6, hit, unlit, ease.linear);
  [...stops.slice(1), stops[0]!].forEach((st, i) => {
    const t = depart + (i + 1) * leg - 0.05;
    s.at(`p-${st.id}-hit`, 'fill', t, 0.1, unlit, hit, ease.linear);
    s.at(`p-${st.id}-hit`, 'fill', t + 0.1, 0.6, hit, unlit, ease.linear);
    s.at(`p-tag-${st.id}`, 'opacity', t, 0.12, 0, 1, ease.linear);
    s.at(`p-tag-${st.id}`, 'translate', t, 0.25, '0 20px', '0 -4px', ease.out);
    s.at(`p-tag-${st.id}`, 'translate', t + 0.25, 0.7, '0 -4px', '0 0', ease.io);
    s.at(`p-tag-${st.id}`, 'opacity', 5.6, 0.25, 1, 0, ease.linear);
    s.at(`p-tag-${st.id}`, 'translate', 5.6, 0.25, '0 0', '0 20px', ease.in);
  });
  const paid = depart + 4 * leg;
  s.at('p-card-hit', 'fill', paid + 0.1, 0.2, unlit, hit, ease.linear);
  s.at('p-card-hit', 'fill', paid + 0.3, 0.8, hit, unlit, ease.linear);
}

export const payment: Story = {
  slug: 'payment',
  label: 'Card payment',
  prompt: 'Walk a card payment round trip',
  dir: '~/payments',
  file: 'card-payment.svg',
  beats: 'Storyboarding the round trip',
  alt: 'A green pulse of money leaves checkout, passes the gateway, the card network and the bank, and comes back to checkout marked paid',
  swatch: 'linear-gradient(135deg, #a7f3d0, #059669)',
  enter: 1.0,
  loop: 6.2,
  peak: 4.8,
  still: 3.9,
  origin: { wide: [372, 236], compact: [195, 214] },
  draw,
};
