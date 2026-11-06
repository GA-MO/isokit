import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fonts, page, ramps, surfaces, type Example, fitX, narrowest, paints } from './shared';

const ui = surfaces.light;
const sky = ramps.sky;
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const glide = 'cubic-bezier(.45,.05,.05,1)';

const edges = [
  { id: 'lisbon', dir: [0, -1], ms: '7 ms', back: true },
  { id: 'tokyo', dir: [1, 0], ms: '9 ms', back: false },
  { id: 'denver', dir: [0, 1], ms: '6 ms', back: false },
] as const;

type Layout = { name: string; width: number; height: number; origin: readonly [number, number]; k: number; wide: boolean };

function build({ name, width, height, origin, k, wide }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const R = 205 * k;
  const store = { size: 124 * k, height: 40 * k };
  const file = { at: [-R, 0, -14 * k] as Vec3, size: 92 * k, height: 16 * k };
  const node = { size: 76 * k, height: 16 * k, z: -12 * k };
  const pitch = 18 * k;
  const strip = { w: 10 * k, d: 62 * k, h: 2.5 * k };
  const wz = -26 * k;

  s.wire({ id: 'w-in', points: [[file.at[0] + file.size / 2, 0, wz], [-store.size / 2, 0, wz]], stroke: ui.wire, width: 1.25 });
  edges.forEach(e => {
    const [dx, dy] = e.dir;
    s.wire({ id: `w-${e.id}`, points: [[(dx * store.size) / 2, (dy * store.size) / 2, wz], [dx * (R - node.size / 2), dy * (R - node.size / 2), wz]], stroke: ui.wire, width: 1.25 });
    s.pulse({ id: `p-${e.id}`, wire: `w-${e.id}`, color: sky[2], length: 0.18 });
  });

  const drawEdge = (e: (typeof edges)[number]) => {
    const at: Vec3 = [e.dir[0] * R, e.dir[1] * R, node.z];
    s.slab({ id: e.id, at, size: [node.size, node.size], height: node.height, radius: 13 * k, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.06, edge: ui.edge });
    s.face({ id: `${e.id}-hit`, at, size: [node.size, node.size], radius: 13 * k, fill: 'rgb(56 189 248 / .28)' });
    s.slab({ id: `${e.id}-copy`, at: [at[0], at[1], at[2] + 8 * k], size: [38 * k, 38 * k], height: 8 * k, radius: 7 * k, top: sky[2], side: { kind: 'flat', color: sky[1] }, edge: 'rgb(255 255 255 / .5)', shadow: false });
  };

  edges.filter(e => e.back).forEach(drawEdge);
  s.slab({ id: 'file', at: file.at, size: [file.size, file.size], height: file.height, radius: 14 * k, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.06, edge: ui.edge });
  s.face({ id: 'file-slots', at: file.at, size: [4 * pitch + 6 * k, strip.d + 10 * k], radius: 6 * k, stroke: 'rgb(22 23 27 / .16)', dash: '3 3' });
  s.slab({ id: 'store', at: [0, 0, 0], size: [store.size, store.size], height: store.height, radius: 20 * k, top: ui.top, side: paints.gradient(s, sky), grain: 0.06, edge: ui.edge });
  s.face({ id: 'store-glow', at: [0, 0, 0], size: [store.size, store.size], radius: 20 * k, fill: 'rgb(56 189 248 / .22)' });
  s.face({ id: 'track', at: [0, 0, 0], size: [4 * pitch + 6 * k, strip.d + 10 * k], radius: 6 * k, stroke: 'rgb(3 105 161 / .35)', dash: '3 3' });
  s.text({ id: 'store-name', at: [0, store.size / 2, -store.height * 0.45], text: 'storage', size: 11 * Math.max(k, 0.9), color: '#e0f2fe', on: 'left', anchor: 'middle' });

  const chunks = [0, 1, 2, 3].map(i => {
    const from: Vec3 = [file.at[0] + 1.5 * pitch - i * pitch, 0, file.at[2] + strip.h];
    const to: Vec3 = [-1.5 * pitch + i * pitch, 0, strip.h];
    return { id: `chunk-${i}`, from, to };
  });
  [...chunks].reverse().forEach(c => {
    s.slab({ id: c.id, at: c.from, size: [strip.w, strip.d], height: strip.h, radius: 3 * k, top: sky[2], side: { kind: 'flat', color: sky[1] }, edge: 'rgb(255 255 255 / .5)', shadow: false });
  });

  edges.filter(e => !e.back).forEach(drawEdge);

  const labelAt = (e: (typeof edges)[number]): Vec3 =>
    e.back ? [0, -R, node.z + 44 * k] : [e.dir[0] * R + node.size / 2, e.dir[1] * R + node.size / 2, node.z - node.height - 4 * k];
  const fileTag = s.project([file.at[0], 0, file.at[2] + 44 * k]);
  s.label({ id: 'file-name', at: { screen: [wide ? fileTag[0] : fitX(fileTag[0], 'clip.mp4 · 64 MB', width, narrowest), fileTag[1]] }, text: 'clip.mp4 · 64 MB', size: 13 });
  edges.forEach(e => s.label({ id: `${e.id}-ms`, at: labelAt(e), text: wide ? `${e.id} · ${e.ms}` : e.ms, size: 13, anchor: e.back ? 'center' : 'top' }));

  s.dropIn('store', 0.1);
  s.dropIn('file', 0.25);
  edges.forEach((e, i) => s.dropIn(e.id, 0.4 + i * 0.083));
  chunks.forEach((c, i) => s.dropIn(c.id, 0.7 + i * 0.083, 24));
  s.intro('file-name', 'opacity', 0.9, 0.3, 0, 1, ease.out);
  s.intro('file-name', 'translate', 0.9, 0.4, '0 8px', '0 0', ease.out);

  const L = 9.5;
  s.loop(L, 6.4);
  s.march('file-slots', 3, 3, 24);
  s.march('track', 3, 3, 24);

  chunks.forEach((c, i) => {
    const t = 0.3 + i * 0.55;
    s.at(c.id, 'translate', t, 1.05, '0 0', s.offset(c.from, c.to), glide);
    s.at(c.id, 'opacity', 7.9 + (3 - i) * 0.033, 0.2, 1, 0, ease.linear);
    s.set(c.id, 'translate', 8.4, '0 0');
    s.at(c.id, 'opacity', 8.5 + i * 0.117, 0.25, 0, 1, ease.linear);
  });
  const full = 0.3 + 3 * 0.55 + 1.05;
  s.at('store-glow', 'opacity', full - 0.15, 0.1, 0, 1, ease.linear);
  s.at('store-glow', 'opacity', full - 0.05, 0.6, 1, 0, ease.linear);
  s.at('store', 'translate', full - 0.15, 0.14, '0 0', '0 4px', ease.out);
  s.at('store', 'translate', full - 0.01, 0.74, '0 4px', '0 0', settle);
  s.at('track', 'opacity', full - 0.3, 0.3, 1, 0, ease.linear);
  s.at('track', 'opacity', 8.3, 0.3, 0, 1, ease.linear);

  edges.forEach((e, i) => {
    const start = full + 0.15 + i * 0.12;
    const dur = Math.max(0.35, s.wireLength(`w-${e.id}`) / 270);
    const arrive = start + dur;
    s.travel(`p-${e.id}`, start, dur);
    s.at(`${e.id}-hit`, 'opacity', arrive, 0.1, 0, 1, ease.linear);
    s.at(`${e.id}-hit`, 'opacity', arrive + 0.1, 0.6, 1, 0, ease.linear);
    s.dropAt(`${e.id}-copy`, arrive + 0.05, 30 * k);
    s.at(`${e.id}-copy`, 'opacity', 7.7 + i * 0.06, 0.3, 1, 0, ease.linear);
    s.at(`${e.id}-ms`, 'opacity', arrive + 0.25, 0.25, 0, 1, ease.out);
    s.at(`${e.id}-ms`, 'translate', arrive + 0.25, 0.4, e.back ? '0 8px' : '0 -8px', '0 0', ease.out);
    s.at(`${e.id}-ms`, 'opacity', 7.6 + i * 0.06, 0.3, 1, 0, ease.linear);
  });
  return s;
}

export const example: Example = {
  slug: 'file-upload',
  title: 'Chunked upload',
  story: 'A file uploads to storage in four chunks that fill its progress bar, then copies spread to edge points near users.',
  prompt: 'Draw a file uploading to storage in chunks that fill a progress bar, then copies of it spreading out to three edge locations near users.',
  level: 'simple',
  category: 'product',
  layout: 'field',
  useCase: 'Storage',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build({ name: 'upload-sm', width: 390, height: 380, origin: [195, 200], k: 0.84, wide: false }),
    build({ name: 'upload-lg', width: 720, height: 420, origin: [360, 215], k: 1, wide: true }),
    520,
  ),
};

export default page(example);
