import { ease, type Material, type Scene, type Vec2 } from '../../lib/iso';
import { metal } from '../materials-metal';
import { paints, ramps } from '../shared';
import { piece, ui, type Story, type Variant } from './stage';

const curve = { shift: 'cubic-bezier(.49,.19,.28,.81)', settle: 'cubic-bezier(.39,.08,.04,.91)', rule: 'cubic-bezier(.05,1,.6,1)', snapOff: 'cubic-bezier(.45,.86,.17,.96)' } as const;
const titanium = metal.find(f => f.slug === 'titanium')!.material;
const faded = (m: Material): Material => (m.kind === 'custom' ? { ...m, corner: 'fade' } : m);

type Layer = 'case' | 'battery' | 'board' | 'radio' | 'lid';
const layers: readonly { id: Layer; height: number; note: string; metal: boolean }[] = [
  { id: 'case', height: 24, note: 'IP67 case', metal: true },
  { id: 'battery', height: 12, note: '72 h battery', metal: false },
  { id: 'board', height: 7, note: 'Edge chip', metal: false },
  { id: 'radio', height: 9, note: '2.4 GHz radio', metal: false },
  { id: 'lid', height: 13, note: 'Titanium lid', metal: true },
];

const sizes: Record<Variant, { size: number; gap: number; text: number; noteX: number }> = {
  wide: { size: 156, gap: 52, text: 14, noteX: 448 },
  compact: { size: 112, gap: 40, text: 13, noteX: 236 },
};

const off = 'rgb(251 191 36 / 0)';
const amber = 'rgb(251 191 36 / .55)';
const ledOff = '#d6d3e0';
const ledOn = '#10b981';

function draw(s: Scene, v: Variant) {
  const k = sizes[v];
  const r = k.size * 0.2;
  const tops: number[] = [];
  layers.reduce((z, l) => (tops.push(z + l.height), z + l.height), 0);
  const silver = faded(paints.gradient(s, ramps.silver));
  const side = faded(titanium(s));
  const halo = s.def('d-halo-fill', '<radialGradient id="$ID"><stop offset="0" stop-color="#f0abfc" stop-opacity=".32"/><stop offset=".5" stop-color="#a5b4fc" stop-opacity=".12"/><stop offset="1" stop-color="#a5b4fc" stop-opacity="0"/></radialGradient>');
  piece(s, 'd-halo', () => s.face({ id: 'd-halo-face', at: [0, 0, 0], size: [k.size * 2.2, k.size * 2.2], radius: k.size * 1.1, fill: halo }), 0.05);

  const u = k.size / 2;
  const decor: Record<Layer, string> = {
    case: '',
    battery: [-0.55, 0, 0.55].map(x => `<rect x="${x * u - u * 0.22}" y="${-u * 0.62}" width="${u * 0.44}" height="${u * 1.24}" rx="${u * 0.08}" fill="#ecfdf5" stroke="rgb(4 120 87 / .35)"/>`).join(''),
    board: `<path d="M${-u * 0.8} ${-u * 0.5}H${-u * 0.3}M${-u * 0.8} 0H${-u * 0.3}M${-u * 0.8} ${u * 0.5}H${-u * 0.3}M${u * 0.3} ${-u * 0.5}H${u * 0.8}M${u * 0.3} ${u * 0.5}H${u * 0.8}" stroke="#a5b4fc" stroke-width="1.4"/><rect x="${-u * 0.3}" y="${-u * 0.3}" width="${u * 0.6}" height="${u * 0.6}" rx="${u * 0.06}" fill="#1e1b4b"/>`,
    radio: [0.25, 0.45, 0.65].map(f => `<path d="M${-u * f} ${u * 0.2}A${u * f} ${u * f} 0 0 1 ${u * f} ${u * 0.2}" fill="none" stroke="#a1a1aa" stroke-width="1.6" stroke-linecap="round"/>`).join('') + `<circle cx="0" cy="${u * 0.2}" r="${u * 0.07}" fill="#71717a"/>`,
    lid: '',
  };
  const topFill: Record<Layer, string> = { case: '#f4f2fb', battery: ui.top, board: '#312e81', radio: ui.top, lid: '#fbfaff' };

  layers.forEach((l, i) => {
    const z = tops[i]!;
    piece(
      s,
      `d-${l.id}`,
      () =>
        s.group(`d-lift-${l.id}`, () => {
          s.slab({ id: `d-${l.id}-box`, at: [0, 0, z], size: [k.size, k.size], height: l.height, radius: r, top: topFill[l.id], side: l.metal ? side : silver, edge: 'rgb(255 255 255 / .95)', outline: 'rgb(49 46 129 / .22)', shadow: false });
          if (decor[l.id]) s.face({ id: `d-${l.id}-art`, at: [0, 0, z], size: [k.size, k.size], radius: r, content: decor[l.id] });
          if (l.id === 'board') s.face({ id: 'd-chip', at: [0, 0, z], size: [k.size * 0.3, k.size * 0.3], radius: k.size * 0.03, fill: off });
          if (l.id === 'lid') {
            s.face({ id: 'd-led', at: [k.size * 0.3, -k.size * 0.3, z], size: [k.size * 0.07, k.size * 0.07], radius: k.size * 0.035, fill: ledOff });
            s.text({ id: 'd-lid-name', at: [0, 0, z], text: 'edge-1', size: k.text - 1, color: '#4338ca', on: 'top', along: 'y', anchor: 'middle', weight: 600 });
          }
        }),
      0.05 + i * 0.083,
    );
  });

  const lifted = (i: number) => i * k.gap;
  const right = (i: number): Vec2 => {
    const [x, y] = s.project([u, -u, tops[i]!]);
    return [x, y - lifted(i) - layers[i]!.height / 2];
  };
  piece(s, 'd-notes', () => {
    layers.forEach((l, i) => {
      const [x, y] = right(i);
      s.wire({ id: `d-rule-${l.id}`, points: [s.unproject([x + 10, y], 0), s.unproject([k.noteX - 8, y], 0)], stroke: 'rgb(67 56 202 / .4)', width: 1, hidden: true });
      s.text({ id: `d-note-${l.id}`, at: { screen: [k.noteX, y] }, text: l.note, size: k.text, color: '#3f3f46', font: 'sans', weight: 500 });
    });
  });

  const order = layers.map((_, i) => i).slice(1);
  [...order].reverse().forEach((i, n) => s.at(`d-lift-${layers[i]!.id}`, 'translate', 0.1 + n * 0.08, 0.82, '0 0', `0 ${-lifted(i)}px`, curve.shift));
  [...layers.keys()].reverse().forEach((i, n) => {
    const id = layers[i]!.id;
    const t = 0.95 + n * 0.08;
    s.at(`d-rule-${id}`, 'strokeDashoffset', t, 0.6, 1.04, 0, curve.rule);
    s.at(`d-note-${id}`, 'opacity', t + 0.3, 0.2, 0, 1, ease.linear);
    s.at(`d-note-${id}`, 'opacity', 3.7, 0.2, 1, 0, ease.linear);
    s.at(`d-rule-${id}`, 'strokeDashoffset', 3.65, 0.23, 0, -1.04, curve.snapOff);
  });
  s.at('d-chip', 'fill', 1.7, 0.15, off, amber, ease.linear);
  s.at('d-chip', 'fill', 1.85, 1.2, amber, off, ease.linear);
  order.forEach((i, n) => s.at(`d-lift-${layers[i]!.id}`, 'translate', 3.9 + n * 0.08, 0.74, `0 ${-lifted(i)}px`, '0 0', curve.settle));
  s.at('d-led', 'fill', 4.95, 0.1, ledOff, ledOn, ease.linear);
  s.at('d-led', 'fill', 6.2, 0.15, ledOn, ledOff, ease.linear);
}

export const device: Story = {
  slug: 'device',
  label: 'Edge device',
  prompt: "Show what's inside our edge device",
  dir: '~/edge-device',
  file: 'edge-device.svg',
  beats: 'Storyboarding closed, apart, closed',
  alt: 'A titanium edge device lifts apart into its five layers, case, battery, edge chip, radio and lid, each named, then closes again',
  swatch: 'linear-gradient(135deg, #ecc38a, #c4568e 50%, #5b5bd6)',
  enter: 1.0,
  loop: 6.4,
  peak: 5.3,
  still: 2.4,
  origin: { wide: [300, 340], compact: [140, 306] },
  draw,
};
