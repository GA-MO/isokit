import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const sky = ramps.sky;
const line = 'rgb(22 23 27 / .3)';
const muted = '#4b4e57';
const settle = 'cubic-bezier(.39,.08,.04,.91)';

const original = { size: 180, px: '4800×3200' } as const;
const sizes = [
  { id: 'x2', tier: '2x', px: '2400×1600', size: 144, z: 58 },
  { id: 'x1', tier: '1x', px: '1200×800', size: 108, z: 108 },
  { id: 'thumb', tier: 'thumb', px: '320×214', size: 68, z: 150 },
] as const;

const lift = 0.5;
const wave = 3.2;
const fold = 6.4;

function picture(s: Scene, size: number, inset: number): string {
  const w = size - inset * 2;
  const x = -w / 2;
  const r = Math.max(3, w * 0.08);
  const skyFill = s.def(`sky-${Math.round(size)}`, `<linearGradient id="$ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0f2fe"/><stop offset="1" stop-color="#bae6fd"/></linearGradient>`);
  const base = x + w;
  const peak = (cx: number, h: number, half: number) => `M${x + w * (cx - half)} ${base}L${x + w * cx} ${base - w * h}L${x + w * (cx + half)} ${base}Z`;
  return `<rect x="${x}" y="${x}" width="${w}" height="${w}" rx="${r}" fill="${skyFill}"/><circle cx="${x + w * 0.7}" cy="${x + w * 0.3}" r="${w * 0.1}" fill="#38bdf8"/><path d="${peak(0.62, 0.42, 0.3)}" fill="#7dd3fc"/><path d="${peak(0.36, 0.58, 0.32)}" fill="#0284c7"/><rect x="${x}" y="${x}" width="${w}" height="${w}" rx="${r}" fill="none" stroke="rgb(3 105 161 / .25)" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
}

type Layout = { name: string; width: number; height: number; origin: readonly [number, number]; k: number; wide: boolean };

function build({ name, width, height, origin, k, wide }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const minPx = wide ? 521 : narrowest;
  const base = original.size * k;

  s.slab({ id: 'original', at: [0, 0, 0], size: [base, base], height: 22 * k, radius: base * 0.12, top: ui.top, side: paints.flat('#f4f4f2'), outline: line, shade: false, edge: line, content: picture(s, base, 12 * k) });
  s.face({ id: 'original-glow', at: [0, 0, 0], size: [base, base], radius: base * 0.12, fill: 'rgb(56 189 248 / .22)' });

  const layers = sizes.map((l, i) => {
    const size = l.size * k;
    const z = l.z * k;
    const at: Vec3 = [0, 0, z];
    s.group(`layer-${i}`, () => {
      s.slab({ id: l.id, at, size: [size, size], height: 10 * k, radius: size * 0.12, top: ui.top, side: paints.brushed(s, ramps.silver), outline: line, shade: false, edge: line, shadow: false, content: picture(s, size, Math.max(6, 10 * k * (size / base))) });
    });
    s.pivot(`layer-${i}`, at);
    return { ...l, i, size, z };
  });

  layers.forEach(l => {
    const [x, y] = s.project([l.size / 2, -l.size / 2, l.z - 5 * k]);
    const text = `${l.tier} ${l.px}`;
    s.label({ id: `${l.id}-tag`, at: { screen: [fitX(x + 14, text, width, minPx, 'left'), y] }, html: `<span style="color:${muted}">${l.tier}</span> ${l.px}`, size: 13, anchor: 'left' });
  });
  const tag = `hero.png ${original.px}`;
  const tagHtml = `<span style="color:${muted}">hero.png</span> ${original.px}`;
  if (wide) {
    const [x, y] = s.project([-base / 2, base / 2, -11 * k]);
    s.label({ id: 'original-tag', at: { screen: [fitX(x - 16, tag, width, minPx, 'right'), y] }, html: tagHtml, size: 13, anchor: 'right' });
  } else {
    const [x, y] = s.project([base / 2, base / 2, -22 * k]);
    s.label({ id: 'original-tag', at: { screen: [fitX(x, tag, width, minPx), y + 22] }, html: tagHtml, size: 13, anchor: 'top' });
  }

  s.dropIn('original', 0.1);
  s.intro('original-tag', 'opacity', 0.4, 0.3, 0, 1, ease.out);
  s.introUntil(0.8);

  s.loop(8, 2.6);
  s.at('original', 'translate', lift - 0.2, 0.14, '0 0', `0 ${3 * k}px`, ease.out);
  s.at('original', 'translate', lift - 0.06, 0.74, `0 ${3 * k}px`, '0 0', settle);
  s.at('original-glow', 'opacity', lift - 0.2, 0.1, 0, 1, ease.linear);
  s.at('original-glow', 'opacity', lift - 0.1, 0.6, 1, 0, ease.linear);

  layers.forEach(l => {
    const g = `layer-${l.i}`;
    const grow = (base / l.size).toFixed(3);
    const t = lift + l.i * 0.22;
    s.at(g, 'opacity', t, 0.2, 0, 1, ease.linear);
    s.at(g, 'translate', t, 1.1, `0 ${l.z}px`, '0 0', settle);
    s.at(g, 'scale', t, 1.1, grow, 1, settle);
    s.at(`${l.id}-tag`, 'opacity', t + 0.7, 0.25, 0, 1, ease.out);

    const dip = `0 ${(0.4 * 48 * k).toFixed(1)}px`;
    const w = wave + l.i * 0.22;
    s.at(g, 'translate', w, 1.0, '0 0', dip, ease.io);
    s.at(g, 'translate', w + 1.0, 1.1, dip, '0 0', ease.io);
    s.at(`${l.id}-tag`, 'translate', t + 0.7, 0.4, '-8px 0', '0 0', ease.out);
    s.at(`${l.id}-tag`, 'translate', w, 1.0, '0 0', dip, ease.io);
    s.at(`${l.id}-tag`, 'translate', w + 1.0, 1.1, dip, '0 0', ease.io);
    s.at(`${l.id}-tag`, 'opacity', fold - 0.3, 0.3, 1, 0, ease.linear);

    const f = fold + (sizes.length - 1 - l.i) * 0.08;
    s.at(g, 'translate', f, 0.62, '0 0', `0 ${l.z}px`, ease.in);
    s.at(g, 'scale', f, 0.62, 1, grow, ease.in);
    s.at(g, 'opacity', f + 0.42, 0.2, 1, 0, ease.linear);
  });
  return s;
}

export const example: Example = {
  slug: 'image-resize',
  title: 'Image resize',
  story: 'One uploaded image lifts apart into stacked copies at 2x, 1x and thumbnail size, each labelled with its pixel size, then folds back into the original.',
  prompt: 'Draw an image resizing service as an exploded stack: one image tile separates into smaller layers at 2x, 1x and thumbnail size, each labelled with its pixel size.',
  level: 'simple',
  category: 'infra',
  layout: 'exploded',
  useCase: 'Images',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build({ name: 'resize-sm', width: 390, height: 380, origin: [140, 236], k: 0.8, wide: false }),
    build({ name: 'resize-lg', width: 720, height: 400, origin: [384, 262], k: 1.1, wide: true }),
    520,
  ),
};

export default page(example);
