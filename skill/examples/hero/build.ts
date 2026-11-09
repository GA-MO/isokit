import { ease, type Scene, type Vec2 } from '../../lib/iso';
import { paints } from '../shared';
import { piece, ui, type Story, type Variant } from './stage';

const squash = 'cubic-bezier(.05,.6,.2,1)';
const orange = { top: '#fff7ed', side: ['#c2410c', '#f97316'] as const, ink: '#c2410c' };
const white = { top: ui.top, side: ['#d6d3d1', '#ebe9e7'] as const };

const bars = [
  { id: 'install', before: '3m 10s', after: '24s', tall: 0.55, short: 0.07 },
  { id: 'compile', before: '6m 20s', after: '52s', tall: 1, short: 0.14 },
  { id: 'test', before: '3m 10s', after: '36s', tall: 0.55, short: 0.1 },
] as const;

const sizes: Record<Variant, { pitch: number; bar: number; reach: number; text: number; name: number; total: { at: Vec2; size: number; caption: number; anchor: 'start' | 'middle' } }> = {
  wide: { pitch: 116, bar: 64, reach: 210, text: 14, name: 12, total: { at: [40, 70], size: 36, caption: 13, anchor: 'start' } },
  compact: { pitch: 88, bar: 52, reach: 170, text: 13, name: 11, total: { at: [195, 58], size: 30, caption: 12, anchor: 'middle' } },
};

const shrinkAt = [0.3, 1.2, 2.1];

function draw(s: Scene, v: Variant) {
  const k = sizes[v];
  const halo = s.def('b-halo-fill', '<radialGradient id="$ID"><stop offset="0" stop-color="#fdba74" stop-opacity=".34"/><stop offset=".55" stop-color="#fed7aa" stop-opacity=".12"/><stop offset="1" stop-color="#fed7aa" stop-opacity="0"/></radialGradient>');
  piece(s, 'b-halo', () => s.face({ id: 'b-halo-face', at: [0, 0, 0], size: [k.pitch * 4, k.pitch * 4], radius: k.pitch * 2, fill: halo }), 0.05);
  const plate: Vec2 = [k.pitch * 3 + k.bar * 0.2, k.bar * 1.7];
  piece(s, 'b-plate', () => s.slab({ id: 'b-plate-box', at: [0, 0, 0], size: plate, height: 8, radius: 14, top: '#fbfaf8', side: paints.flat('#e7e5e4'), edge: 'rgb(255 255 255 / .9)', outline: 'rgb(68 64 60 / .14)', shadow: false }), 0.05);

  const t = k.total;
  piece(s, 'b-total', () => {
    s.text({ id: 'b-caption', at: { screen: [t.at[0], t.at[1] - t.size * 0.95] }, text: 'Build time', size: t.caption, color: ui.muted, font: 'sans', weight: 500, anchor: t.anchor });
    s.text({ id: 'b-total-before', at: { screen: t.at }, text: '12m 40s', size: t.size, color: ui.ink, font: 'sans', weight: 600, anchor: t.anchor, tracking: -1 });
    s.text({ id: 'b-total-after', at: { screen: t.at }, text: '1m 52s', size: t.size, color: orange.ink, font: 'sans', weight: 600, anchor: t.anchor, tracking: -1 });
    const pillX = t.anchor === 'start' ? t.at[0] + t.size * 3.6 + 44 : t.at[0];
    const pillY = t.anchor === 'start' ? t.at[1] : t.at[1] + t.size * 0.95;
    s.group('b-faster', () => s.text({ id: 'b-faster-text', at: { screen: [pillX, pillY] }, text: '6.8× faster', size: k.text, color: '#9a3412', font: 'sans', weight: 600, pill: { fill: '#ffedd5', stroke: 'rgb(234 88 12 / .35)', radius: k.text * 0.8 } }));
  });

  bars.forEach((b, i) => {
    const x = (i - 1) * k.pitch;
    const [tall, short] = [Math.round(k.reach * b.tall), Math.round(k.reach * b.short)];
    const size: Vec2 = [k.bar, k.bar];
    piece(
      s,
      `b-${b.id}`,
      () => {
        s.frame({ id: `b-${b.id}-was`, at: [x, 0, tall + 8], size, height: tall, radius: k.bar * 0.16, stroke: 'rgb(194 65 12 / .5)', dash: '3 3', edges: ['left', 'right'], bottom: false });
        s.prism({ id: `b-${b.id}-slow`, at: [x, 0, 8], size, height: tall, radius: k.bar * 0.16, top: white.top, side: white.side, stroke: 'rgb(68 64 60 / .16)' });
        s.prism({ id: `b-${b.id}-fast`, at: [x, 0, 8], size, height: tall, radius: k.bar * 0.16, top: orange.top, side: orange.side, stroke: 'rgb(154 52 18 / .25)' });
        s.text({ id: `b-${b.id}-name`, at: [x, k.bar * 0.5 + k.name * 1.1, 8], text: b.id, size: k.name, color: '#57534e', on: 'top', anchor: 'middle', font: 'sans', weight: 500 });
        const [sx, sy] = s.project([x, 0, 8]);
        const top = (h: number): Vec2 => [sx, sy - h - k.bar * 0.42 - 10];
        s.text({ id: `b-${b.id}-before`, at: { screen: top(tall) }, text: b.before, size: k.text, color: '#57534e', font: 'sans', weight: 500, anchor: 'middle' });
        s.text({ id: `b-${b.id}-after`, at: { screen: top(short) }, text: b.after, size: k.text + 1, color: '#9a3412', font: 'sans', weight: 700, anchor: 'middle' });
      },
      0.13 + i * 0.083,
    );
  });

  bars.forEach((b, i) => {
    const [tall, short] = [Math.round(k.reach * b.tall), Math.round(k.reach * b.short)];
    const at = shrinkAt[i]!;
    s.at(`b-${b.id}-fast`, 'opacity', at, 0.4, 0, 1, ease.linear);
    s.heightTo(`b-${b.id}-slow`, at, 0.75, tall, short, squash);
    s.heightTo(`b-${b.id}-fast`, at, 0.75, tall, short, squash);
    s.at(`b-${b.id}-was`, 'opacity', at + 0.15, 0.3, 0, 1, ease.linear);
    s.at(`b-${b.id}-after`, 'opacity', at + 0.55, 0.25, 0, 1, ease.linear);
    const back = 5.3 + i * 0.08;
    s.heightTo(`b-${b.id}-slow`, back, 0.9, short, tall, ease.io);
    s.heightTo(`b-${b.id}-fast`, back, 0.9, short, tall, ease.io);
    s.at(`b-${b.id}-fast`, 'opacity', back, 0.5, 1, 0, ease.linear);
    s.at(`b-${b.id}-was`, 'opacity', back, 0.3, 1, 0, ease.linear);
    s.at(`b-${b.id}-after`, 'opacity', back, 0.2, 1, 0, ease.linear);
  });
  s.at('b-total-before', 'opacity', 2.9, 0.25, 1, 0, ease.linear);
  s.at('b-total-after', 'opacity', 3.0, 0.3, 0, 1, ease.linear);
  s.at('b-faster', 'opacity', 3.2, 0.12, 0, 1, ease.linear);
  s.at('b-faster', 'translate', 3.2, 0.35, '-12px 0', '2px 0', ease.out);
  s.at('b-faster', 'translate', 3.55, 0.5, '2px 0', '0 0', ease.io);
  s.at('b-total-before', 'opacity', 5.6, 0.3, 0, 1, ease.linear);
  s.at('b-total-after', 'opacity', 5.3, 0.25, 1, 0, ease.linear);
  s.at('b-faster', 'opacity', 5.3, 0.25, 1, 0, ease.linear);
}

export const build: Story = {
  slug: 'build',
  label: 'Build time',
  prompt: 'Compare our build time before and after',
  dir: '~/ci',
  file: 'build-time.svg',
  beats: 'Storyboarding 3 beats: install, compile, test',
  alt: 'Three tall white bars for install, compile and test squash into short orange bars, and the build time drops from 12 minutes 40 seconds to 1 minute 52 seconds',
  swatch: 'linear-gradient(135deg, #fdba74, #ea580c)',
  enter: 1.0,
  loop: 6.4,
  peak: 4.9,
  still: 3.9,
  origin: { wide: [420, 330], compact: [195, 360] },
  draw,
};
