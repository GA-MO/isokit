import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const rose = ramps.rose;
const accent = '#e11d48';
const line = 'rgb(22 23 27 / .14)';
const ink = '#4b4e57';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const fillEase = 'cubic-bezier(.32,.5,.06,1)';

const renditions = [
  { id: 'r1080', name: '1080p', rate: '6 Mb/s', size: 176, encode: 1.3 },
  { id: 'r720', name: '720p', rate: '3 Mb/s', size: 148, encode: 1.0 },
  { id: 'r480', name: '480p', rate: '1.2 Mb/s', size: 120, encode: 0.8 },
  { id: 'r240', name: '240p', rate: '400 kb/s', size: 92, encode: 0.6 },
] as const;

const loopLength = 10;
const rise = 0.3;
const firstEncode = 1.7;
const encodeGap = 0.2;
const doneAt = 6.4;
const foldAt = 8.2;

type Layout = { name: string; width: number; height: number; origin: readonly [number, number]; k: number; wide: boolean };

function build({ name, width, height, origin, k, wide }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const source = { at: [0, 0, 0] as Vec3, size: 200 * k, height: 34 * k };
  const pitch = 46 * k;
  const thick = 10 * k;
  const minWide = 521;

  s.slab({ id: 'source', at: source.at, size: [source.size, source.size], height: source.height, radius: 24 * k, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.08, edge: ui.edge, outline: line });
  s.face({ id: 'source-glow', at: source.at, size: [source.size, source.size], radius: 24 * k, fill: 'rgb(244 63 94 / .14)' });
  s.text({ id: 'source-name', at: [-source.size / 2 + 22 * k, source.size / 2 - 22 * k, 0], text: 'source.mov', size: wide ? 12 : 11, color: ink, on: 'top' });

  let encodeAt = firstEncode;
  const timeline = renditions.map((r, i) => {
    const z = (i + 1) * pitch;
    const size = r.size * k;
    const at: Vec3 = [0, 0, z];
    const radius = Math.max(10, size * 0.14);
    const edgeY = size / 2 - 13 * k;
    const bar: Vec3[] = [[-size / 2 + 18 * k, edgeY, z], [size / 2 - 18 * k, edgeY, z]];
    s.group(`layer-${i}`, () => {
      s.slab({ id: r.id, at, size: [size, size], height: thick, radius, top: ui.top, side: paints.gradient(s, ramps.silver), grain: 0.08, edge: ui.edge, outline: line, shadow: false });
      s.slab({ id: `${r.id}-on`, at, size: [size, size], height: thick, radius, top: ui.top, side: paints.gradient(s, rose), grain: 0.08, edge: ui.edge, outline: 'rgb(190 18 60 / .35)', shadow: false });
      s.face({ id: `${r.id}-glow`, at, size: [size, size], radius, fill: 'rgb(244 63 94 / .16)', stroke: 'rgb(225 29 72 / .5)' });
      s.wire({ id: `${r.id}-track`, points: bar, stroke: 'rgb(22 23 27 / .1)', width: 3 });
      s.wire({ id: `${r.id}-bar`, points: bar, stroke: accent, width: 3, hidden: true });
      s.text({ id: `${r.id}-name`, at: [-size / 2 + 18 * k, edgeY - 13 * k, z], text: r.name, size: wide ? 12 : 11, color: ink, on: 'top' });
    });
    const start = encodeAt;
    encodeAt += r.encode + encodeGap;
    return { ...r, i, z, size, start, done: start + r.encode };
  });

  if (wide) {
    timeline.forEach(r => {
      const [x, y] = s.project([r.size / 2, -r.size / 2, r.z - thick / 2]);
      const text = `${r.name} · ${r.rate}`;
      s.label({ id: `${r.id}-tag`, at: { screen: [fitX(x + 18, text, width, minWide, 'left'), y] }, html: `${r.name} <span style="color:${ui.muted}">· ${r.rate}</span>`, size: 13, anchor: 'left' });
    });
    const [lx, ly] = s.project([-source.size / 2, source.size / 2, -source.height / 2]);
    const tag = 'source.mov · 4K';
    s.label({ id: 'source-tag', at: { screen: [fitX(lx - 18, tag, width, minWide, 'right'), ly] }, html: `source.mov <span style="color:${ui.muted}">· 4K</span>`, size: 13, anchor: 'right' });
  }
  const topZ = renditions.length * pitch;
  const [tx, ty] = s.project([0, 0, topZ]);
  const done = '4 renditions ready';
  s.label({ id: 'done', at: { screen: [fitX(tx, done, width, wide ? minWide : narrowest), ty - (renditions[3].size * k * 0.41) - 26 * k] }, html: `<span style="color:${accent}">●</span> 4 renditions ready`, size: 13, anchor: 'bottom' });

  s.dropIn('source', 0.1);
  s.intro('source-name', 'opacity', 0.4, 0.3, 0, 1, ease.out);
  if (wide) s.intro('source-tag', 'opacity', 0.5, 0.3, 0, 1, ease.out);
  s.introUntil(0.8);

  s.loop(loopLength, 7.2);
  s.at('source', 'translate', rise - 0.1, 0.14, '0 0', `0 ${3 * k}px`, ease.out);
  s.at('source', 'translate', rise + 0.04, 0.74, `0 ${3 * k}px`, '0 0', settle);
  s.at('source-glow', 'opacity', rise - 0.1, 0.1, 0, 1, ease.linear);
  s.at('source-glow', 'opacity', rise, 0.6, 1, 0, ease.linear);

  timeline.forEach(r => {
    const g = `layer-${r.i}`;
    const t = rise + r.i * 0.12;
    s.at(g, 'opacity', t, 0.25, 0, 1, ease.linear);
    s.at(g, 'translate', t, 1.1, `0 ${r.z}px`, '0 0', settle);

    s.draw(`${r.id}-bar`, r.start, r.encode, fillEase);
    s.at(`${r.id}-on`, 'opacity', r.done, 0.3, 0, 1, ease.linear);
    s.at(`${r.id}-glow`, 'opacity', r.done, 0.1, 0, 1, ease.linear);
    s.at(`${r.id}-glow`, 'opacity', r.done + 0.1, 0.6, 1, 0, ease.linear);
    if (wide) {
      s.at(`${r.id}-tag`, 'opacity', r.done + 0.05, 0.25, 0, 1, ease.out);
      s.at(`${r.id}-tag`, 'translate', r.done + 0.05, 0.4, '-8px 0', '0 0', ease.out);
      s.at(`${r.id}-tag`, 'opacity', foldAt - 0.4, 0.3, 1, 0, ease.linear);
    }

    const f = foldAt + (renditions.length - 1 - r.i) * 0.08;
    s.at(g, 'translate', f, 0.62, '0 0', `0 ${r.z}px`, 'cubic-bezier(.5,0,.75,0)');
    s.at(g, 'opacity', f + 0.42, 0.2, 1, 0, ease.linear);
    s.set(`${r.id}-on`, 'opacity', loopLength - 0.2, 0);
    s.set(`${r.id}-bar`, 'strokeDashoffset', loopLength - 0.2, 1);
  });
  s.at('done', 'opacity', doneAt, 0.3, 0, 1, ease.out);
  s.at('done', 'translate', doneAt, 0.45, '0 6px', '0 0', ease.out);
  s.at('done', 'opacity', foldAt - 0.4, 0.3, 1, 0, ease.linear);
  const land = foldAt + 0.62 + (renditions.length - 1) * 0.08;
  s.at('source-glow', 'opacity', land, 0.1, 0, 1, ease.linear);
  s.at('source-glow', 'opacity', land + 0.1, 0.6, 1, 0, ease.linear);
  return s;
}

export const example: Example = {
  slug: 'video-transcode',
  title: 'Video transcode',
  ask: 'Show one video becoming four renditions.',
  story: 'A video file lifts apart into 1080p, 720p, 480p and 240p renditions stacked with air between them, each layer fills its progress bar in turn, and the four settle as ready outputs.',
  prompt: 'Draw a video transcoding job as an exploded stack: the source file lifts apart into 1080p, 720p, 480p and 240p layers, each one encoding in turn with a progress bar.',
  level: 'medium',
  intent: 'inside',
  layout: 'exploded',
  useCase: 'Media',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build({ name: 'transcode-sm', width: 390, height: 450, origin: [195, 308], k: 0.98, wide: false }),
    build({ name: 'transcode-lg', width: 720, height: 420, origin: [330, 282], k: 0.9, wide: true }),
    520,
  ),
};

export default page(example);
