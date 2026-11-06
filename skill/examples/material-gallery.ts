import { ISO_X, Scene, ease } from '../lib/iso';
import { finishes } from './materials';
import { art, fonts, page, surfaces, fitX, narrowest } from './shared';

const ui = surfaces.dark;
const iy = ISO_X * Math.tan(Math.PI / 6);

interface Layout {
  name: string;
  width: number;
  height: number;
  cols: number;
  size: number;
  thickness: number;
  gap: readonly [number, number];
  top: number;
  nameSize: number;
}

function build(l: Layout) {
  const s = new Scene({ name: l.name, width: l.width, height: l.height, origin: [0, 0], font: fonts.sans, mono: fonts.mono, label: ui.label });
  const span = l.size * 2 * ISO_X;
  const face = l.size * 2 * iy;
  const left = (l.width - (l.cols * span + (l.cols - 1) * l.gap[0])) / 2;
  const lift = 16;

  finishes.forEach((f, i) => {
    const [row, col] = [Math.floor(i / l.cols), i % l.cols];
    const cx = left + span / 2 + col * (span + l.gap[0]);
    const back = l.top + row * (face + l.thickness + l.gap[1]);
    const at = s.unproject([cx, back + face / 2], 0);
    const longest = f.name.length > f.note.length ? f.name : f.note;
    const x = fitX(cx, longest, l.width, l.width > 500 ? 641 : narrowest, 'center', 'sans', 2.2);
    const above = row > 0;
    s.label({
      id: `name-${f.slug}`,
      at: { screen: [x, above ? back - lift - 10 : back + face + l.thickness - lift + 12] },
      anchor: above ? 'bottom' : 'top',
      variant: 'card',
      html: `<div style="font:600 1em/1.35 var(--iso-font);color:${ui.ink}">${f.name}</div><div style="font:400 1em/1.35 var(--iso-font);color:${ui.muted}">${f.note}</div>`,
    });
    s.slab({
      id: f.slug,
      at,
      size: [l.size, l.size],
      height: l.thickness,
      radius: l.size * 0.16,
      top: '#17181d',
      grain: 0.06,
      side: f.material(s),
      edge: ui.edge,
      content: `<text text-anchor="middle" dominant-baseline="central" font-size="${l.nameSize}" font-weight="500" fill="#a3a6b1" style="font-family:var(--iso-font)">${f.name}</text>`,
      hover: { lift, label: `name-${f.slug}`, guides: 'rgb(255 255 255 / .22)' },
    });
    s.dropIn(f.slug, 0.1 + (row + col) * 0.083);
    const glint = 0.8 + (row + col) * 0.14;
    s.at(f.slug, 'filter', glint, 0.35, 'brightness(1)', 'brightness(1.5)', ease.linear);
    s.at(f.slug, 'filter', glint + 0.35, 0.8, 'brightness(1.5)', 'brightness(1)', ease.linear);
  });
  s.loop(9, 0);
  return s;
}

export const gallery = art(
  build({ name: 'finish-sm', width: 390, height: 580, cols: 3, size: 78, thickness: 26, gap: [10, 18], top: 28, nameSize: 11 }),
  build({ name: 'finish-lg', width: 1120, height: 540, cols: 5, size: 118, thickness: 34, gap: [34, 30], top: 44, nameSize: 13 }),
  640,
);

export default { ...page({ title: 'Side finishes', surface: 'dark', art: gallery }), background: ui.page };
