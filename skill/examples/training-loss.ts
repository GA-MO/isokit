import { Scene, ease, type Vec3 } from '../lib/iso.ts';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared.ts';

const ui = surfaces.light;
const accent = '#0d9488';
const line = 'rgb(22 23 27 / .16)';
const fill = 'cubic-bezier(.32,.5,.06,1)';
const shrink = 'cubic-bezier(.33,0,.91,.03)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';

const losses = [0.88, 0.57, 0.39, 0.29, 0.24, 0.21] as const;
const epochStart = (i: number) => 0.3 + i * 1.1;

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: readonly [number, number];
  k: number;
  minPx: number;
  label: readonly [number, number];
  textSize: number;
}

const tag = (i: number) => `epoch ${i + 1}/${losses.length} · loss ${losses[i]!.toFixed(2)}`;

function build(l: Layout) {
  const { k } = l;
  const s = new Scene({ name: l.name, width: l.width, height: l.height, origin: l.origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const dataAt: Vec3 = [-300 * k, 0, 0];
  const dataSize = 64 * k;
  const modelAt: Vec3 = [-180 * k, 0, 0];
  const modelSize = 92 * k;
  const pitch = 52 * k;
  const bar = 30 * k;
  const plateLen = pitch * (losses.length - 1) + bar + 40 * k;
  const plateAt: Vec3 = [-80 * k + plateLen / 2, 0, -6 * k];
  const plateTop = plateAt[2] + 12 * k;
  const barAt = (i: number): Vec3 => [plateAt[0] - plateLen / 2 + 20 * k + bar / 2 + i * pitch, 0, plateTop];
  const tall = 150 * k;
  const wz = -14 * k;

  s.wire({ id: 'w-feed', points: [[dataAt[0] + dataSize / 2, 0, wz], [modelAt[0] - modelSize / 2, 0, wz]], stroke: ui.wire, width: 1.25, joins: ['data', 'model-slab'] });
  s.wire({ id: 'w-out', points: [[modelAt[0] + modelSize / 2, 0, wz], [plateAt[0] - plateLen / 2, 0, wz]], stroke: ui.wire, width: 1.25 });
  s.pulse({ id: 'p-feed', wire: 'w-feed', color: accent, length: 0.3 });
  s.pulse({ id: 'p-out', wire: 'w-out', color: accent, length: 0.3 });

  s.group('data', () => {
    [0, 1, 2].forEach(i => s.slab({ id: `data-${i}`, at: [dataAt[0], 0, i * 10 * k], size: [dataSize, dataSize], height: 6 * k, radius: 11 * k, top: ui.top, side: paints.stripes(s, ramps.silver, 2), edge: ui.edge, outline: line }));
    s.text({ id: 'data-name', at: [dataAt[0], 0, 20 * k], text: 'data', size: l.textSize, color: ui.muted, on: 'top', anchor: 'middle' });
  });

  s.group('model', () => {
    s.slab({ id: 'model-slab', at: modelAt, size: [modelSize, modelSize], height: 30 * k, radius: 18 * k, top: ui.top, side: paints.gradient(s, ramps.teal), grain: 0.06, edge: ui.edge, outline: 'rgb(15 118 110 / .3)' });
    s.face({ id: 'model-glow', at: modelAt, size: [modelSize, modelSize], radius: 18 * k, fill: 'rgb(45 212 191 / .3)' });
    s.text({ id: 'model-name', at: modelAt, text: 'model', size: l.textSize, color: '#0f766e', on: 'top', anchor: 'middle' });
  });

  s.slab({ id: 'plate', at: plateAt, size: [plateLen, 84 * k], height: 12 * k, radius: 16 * k, top: '#fafafa', side: paints.brushed(s, ramps.silver), grain: 0.05, edge: ui.edge, outline: line });

  losses.forEach((loss, i) => {
    const at = barAt(i);
    const h = loss * tall;
    s.prism({ id: `bar-${i}`, at, size: [bar, bar], height: h, reach: tall, radius: 6 * k, top: '#ffffff', side: ['#e4e4e7', '#f4f4f5'], stroke: 'rgb(22 23 27 / .26)' });
    s.prism({ id: `hot-${i}`, at, size: [bar, bar], height: h, reach: tall, radius: 6 * k, top: '#ccfbf1', side: ['#0f766e', '#14b8a6'], stroke: 'rgb(15 118 110 / .5)' });
  });

  const lx = fitX(l.label[0], tag(0), l.width, l.minPx, 'right');
  losses.forEach((_, i) => {
    s.label({
      id: `tag-${i}`,
      at: { screen: [lx, l.label[1]] },
      html: `<span style="color:${ui.muted}">epoch</span> ${i + 1}/${losses.length} <span style="color:${ui.muted}">· loss</span> <b style="font-weight:500;color:${i === losses.length - 1 ? '#0f766e' : ui.ink}">${losses[i]!.toFixed(2)}</b>`,
      size: 13,
      anchor: 'right',
    });
  });

  s.dropIn('plate', 0.1);
  s.dropIn('data', 0.2);
  s.dropIn('model', 0.28);

  const feed = Math.max(0.3, s.wireLength('w-feed') / 270);
  const out = Math.max(0.3, s.wireLength('w-out') / 270);
  let last = 0;
  losses.forEach((loss, i) => {
    const t = epochStart(i);
    const h = loss * tall;
    s.travel('p-feed', t, feed);
    const hit = t + feed;
    s.at('model-glow', 'opacity', hit, 0.1, 0, 1, ease.linear);
    s.at('model-glow', 'opacity', hit + 0.1, 0.6, 1, 0, ease.linear);
    s.at('model', 'translate', hit, 0.3, '0 0', '0 3px', pull);
    s.at('model', 'translate', hit + 0.3, 0.74, '0 3px', '0 0', settle);
    s.travel('p-out', hit + 0.1, out);
    const land = hit + 0.1 + out;
    for (const id of [`bar-${i}`, `hot-${i}`]) {
      s.at(id, 'opacity', land, 0.1, 0, 1, ease.linear);
      s.heightTo(id, land, 1, 0, h, fill);
    }
    if (i > 0) s.at(`hot-${i - 1}`, 'opacity', land, 0.4, 1, 0, ease.linear);
    const shown = land + 0.3;
    s.at(`tag-${i}`, 'opacity', shown, 0.15, 0, 1, ease.linear);
    if (i > 0) s.at(`tag-${i - 1}`, 'opacity', shown, 0.15, 1, 0, ease.linear);
    last = land + 1;
  });

  const reset = last + 1.9;
  const n = losses.length;
  s.at(`tag-${n - 1}`, 'opacity', reset, 0.3, 1, 0, ease.linear);
  losses.forEach((loss, i) => {
    const t = reset + (n - 1 - i) * 0.05;
    const h = loss * tall;
    for (const id of [`bar-${i}`, `hot-${i}`]) s.heightTo(id, t, 0.4, h, 0, shrink);
    s.at(`bar-${i}`, 'opacity', t + 0.35, 0.1, 1, 0, ease.linear);
  });
  s.at(`hot-${n - 1}`, 'opacity', reset + 0.35, 0.1, 1, 0, ease.linear);
  s.loop(Math.round((reset + (n - 1) * 0.05 + 0.45 + 0.5) * 10) / 10, last + 0.4);
  return s;
}

export const example: Example = {
  slug: 'training-loss',
  title: 'Training loss falls',
  ask: 'Show training loss falling epoch by epoch.',
  story: 'Each epoch the data runs through the model and a new bar lands lower than the last, until the loss settles at 0.21.',
  prompt: 'Draw a model training run: data pulses into a model each epoch and a row of bars, one per epoch, steps down as the loss falls, with an epoch counter and loss label updating.',
  level: 'medium',
  intent: 'change',
  layout: 'diagonal',
  useCase: 'Training',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build({ name: 'loss-sm', width: 390, height: 380, origin: [214, 170], k: 0.78, minPx: narrowest, label: [362, 330], textSize: 10 }),
    build({ name: 'loss-lg', width: 720, height: 400, origin: [380, 222], k: 1.18, minPx: 521, label: [668, 92], textSize: 12 }),
    520,
  ),
};

export default page(example);
