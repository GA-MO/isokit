import { ISO_X, Scene, ease } from '../lib/iso';
import { finishCategories, finishes, type Finish, type FinishCategory } from './materials';
import { art, fonts, page, surfaces, type Art } from './shared';

const ui = surfaces.dark;
const iy = ISO_X * Math.tan(Math.PI / 6);

interface Layout {
  width: number;
  cols: (count: number) => number;
  size: number;
  thickness: number;
  gap: readonly [number, number];
  pad: readonly [top: number, bottom: number];
  nameSize: number;
}

const compact: Layout = { width: 390, cols: () => 3, size: 78, thickness: 24, gap: [12, 18], pad: [30, 26], nameSize: 9.5 };
const wide: Layout = { width: 1120, cols: count => Math.ceil(count / 2), size: 124, thickness: 34, gap: [40, 34], pad: [44, 36], nameSize: 13 };

function build(name: string, list: readonly Finish[], l: Layout) {
  const cols = l.cols(list.length);
  const rows = Math.ceil(list.length / cols);
  const span = l.size * 2 * ISO_X;
  const face = l.size * 2 * iy;
  const pitch = face + l.thickness + l.gap[1];
  const height = Math.round(l.pad[0] + rows * pitch - l.gap[1] + l.pad[1]);
  const s = new Scene({ name, width: l.width, height, origin: [0, 0], font: fonts.sans, mono: fonts.mono, label: ui.label });

  list.forEach((f, i) => {
    const [row, col] = [Math.floor(i / cols), i % cols];
    const inRow = Math.min(cols, list.length - row * cols);
    const left = (l.width - (inRow * span + (inRow - 1) * l.gap[0])) / 2;
    const cx = left + span / 2 + col * (span + l.gap[0]);
    const back = l.pad[0] + row * pitch;
    s.slab({
      id: f.slug,
      at: s.unproject([cx, back + face / 2], 0),
      size: [l.size, l.size],
      height: l.thickness,
      radius: l.size * 0.16,
      top: '#17181d',
      grain: 0.06,
      side: f.material(s),
      edge: ui.edge,
      content: `<text text-anchor="middle" dominant-baseline="central" font-size="${l.nameSize}" font-weight="500" fill="#b4b7c1" style="font-family:var(--iso-font)">${f.name}</text>`,
      hover: { lift: 16, guides: 'rgb(255 255 255 / .22)' },
    });
    s.dropIn(f.slug, 0.1 + (row + col) * 0.083);
    const glint = 0.8 + (row + col) * 0.14;
    s.at(f.slug, 'filter', glint, 0.35, 'brightness(1)', 'brightness(1.5)', ease.linear);
    s.at(f.slug, 'filter', glint + 0.35, 0.8, 'brightness(1.5)', 'brightness(1)', ease.linear);
  });
  s.loop(9, 0);
  return s;
}

export interface Gallery {
  slug: FinishCategory;
  name: string;
  note: string;
  finishes: readonly Finish[];
  art: Art;
}

export const galleries: readonly Gallery[] = finishCategories.map(c => {
  const list = finishes.filter(f => f.category === c.slug);
  return { ...c, finishes: list, art: art(build(`finish-${c.slug}-sm`, list, compact), build(`finish-${c.slug}-lg`, list, wide), 640) };
});

const sampled = ['brushed', 'dichroic', 'oak', 'circuit', 'sunset', 'scatter', 'anodized', 'random'];

export function sampler(): Scene {
  const list = sampled.map(slug => {
    const f = finishes.find(x => x.slug === slug);
    if (!f) throw new Error(`material-gallery: sampler has no finish ${slug}`);
    return f;
  });
  return build('finish-sampler-lg', list, wide);
}

export default { ...page({ title: 'Side finishes', surface: 'dark', art: galleries[0]!.art }), background: ui.page, body: `<main>${galleries.map(g => g.art.html).join('')}</main>` };
