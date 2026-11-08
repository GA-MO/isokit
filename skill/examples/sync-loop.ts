import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fonts, n, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const accent = '#6366f1';
const line = 'rgb(22 23 27 / .32)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const shift = 'cubic-bezier(.49,.19,.28,.81)';

function build(name: string, width: number, height: number, origin: readonly [number, number]) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const size = 148;
  const h = 32;
  const ground: Vec3 = [0, 0, -h];
  const r = 138;
  const [cx, cy] = s.project(ground);

  const span = 110;
  const on = (deg: number, along = 0, out = 0) => {
    const t = (deg * Math.PI) / 180;
    return `${n(cx + (r + out) * Math.cos(t) - along * Math.sin(t))} ${n(cy + (r + out) * Math.sin(t) + along * Math.cos(t))}`;
  };
  const arrow = (start: number) => {
    const end = start + span;
    const [x1, y1] = on(start).split(' ');
    const [x2, y2] = on(end).split(' ');
    const tail = s.def(`tail-${start}`, `<linearGradient id="$ID" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${accent}" stop-opacity="0"/><stop offset="1" stop-color="${accent}"/></linearGradient>`);
    const head = `M${on(end, 13)}L${on(end, -4, 10)}L${on(end, -1)}L${on(end, -4, -10)}Z`;
    return `<path d="M${on(start)}A${r} ${r} 0 0 1 ${on(end)}" fill="none" stroke="${tail}" stroke-width="5" stroke-linecap="round"/><path d="${head}" fill="${accent}" stroke="${accent}" stroke-width="2" stroke-linejoin="round"/>`;
  };

  s.face({ id: 'track', at: ground, size: [r * 2, r * 2], radius: r, stroke: 'rgb(99 102 241 / .28)', dash: '3 5' });
  // The arrows are drawn round in screen space: 'orbit' squashes them onto the ground plane, so 'arrows' can turn with a plain CSS rotate.
  s.group('orbit', () => s.svg('arrows', arrow(-20) + arrow(160)));

  s.slab({ id: 'tile', at: [0, 0, 0], size: [size, size], height: h, radius: 28, top: ui.top, side: paints.brushed(s, ramps.silver), edge: line, outline: line, shade: false });
  s.face({ id: 'tile-glow', at: [0, 0, 0], size: [size, size], radius: 28, fill: 'rgb(99 102 241 / .16)' });
  s.face({ id: 'dot', at: [0, 0, 0], size: [22, 22], radius: 11, fill: 'rgb(22 23 27 / .14)' });
  s.face({ id: 'dot-lit', at: [0, 0, 0], size: [22, 22], radius: 11, fill: accent });

  s.pivot('orbit', ground);
  s.pivot('arrows', ground);
  s.dropIn('tile', 0.1);
  s.intro('orbit', 'opacity', 0.45, 0.35, 0, 1, ease.linear);

  const lap = 2;
  const turn = 1.4;
  s.loop(lap * 3, 1.55);
  s.set('orbit', 'scale', 0, `1 ${n(s.ratio)}`);
  for (let i = 0; i < 3; i++) {
    const t = i * lap;
    const done = t + turn - 0.3;
    s.at('arrows', 'rotate', t, turn, `${i * 360}deg`, `${(i + 1) * 360}deg`, shift);
    s.at('tile-glow', 'opacity', done, 0.1, 0, 1, ease.linear);
    s.at('tile-glow', 'opacity', done + 0.1, 0.6, 1, 0, ease.linear);
    s.at('dot-lit', 'opacity', done, 0.1, 0, 1, ease.linear);
    s.at('dot-lit', 'opacity', done + 0.1, 0.6, 1, 0, ease.linear);
    s.at('tile', 'translate', done, 0.14, '0 0', '0 3px', ease.out);
    s.at('tile', 'translate', done + 0.14, 0.74, '0 3px', '0 0', settle);
  }
  return s;
}

export const example: Example = {
  slug: 'sync-loop',
  title: 'Sync in progress',
  ask: 'A sync in progress.',
  story: 'Two arrows circle a tile on the plane and the tile brightens each time a lap completes.',
  prompt: 'Draw a tile with two arrows circling it on the ground, the tile lighting up each time a sync lap completes.',
  level: 'spot',
  layout: 'object',
  useCase: 'Sync',
  surface: 'light',
  interaction: 'watch',
  art: art(build('spot-sync', 390, 300, [195, 124])),
};

export default page(example);
