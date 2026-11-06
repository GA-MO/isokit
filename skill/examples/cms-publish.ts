import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const accent = '#0ea5e9';
const deep = '#0369a1';
const tint = 'rgb(56 189 248 / .2)';
const line = 'rgb(22 23 27 / .2)';
const wire = 'rgb(22 23 27 / .24)';
const name = '#4b4e57';
const ok = '#047857';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';

type Side = 'left' | 'right' | 'top';
const channels: readonly { id: string; dir: Vec2; note: string; side: Side }[] = [
  { id: 'web', dir: [0, -1], note: 'web · live', side: 'right' },
  { id: 'app', dir: [1, 0], note: 'app · in-app', side: 'right' },
  { id: 'email', dir: [1, 1], note: 'email · 12,480 sent', side: 'top' },
  { id: 'social', dir: [0, 1], note: 'social · posted', side: 'left' },
  { id: 'feed', dir: [-1, 0], note: 'feed · rss', side: 'left' },
];

const statuses = [
  { id: 'st-draft', html: `<span style="color:${ui.muted}">●</span> draft` },
  { id: 'st-going', html: `<span style="color:${deep}">●</span> publishing…` },
  { id: 'st-live', html: `<span style="color:${ok}">✓</span> live on 5 channels` },
] as const;

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: readonly [number, number];
  k: number;
  notes: boolean;
  title: number;
  status: number;
}

function build(l: Layout) {
  const { k } = l;
  const s = new Scene({ name: l.name, width: l.width, height: l.height, origin: l.origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const ring = 150 * k;
  const tile = 72 * k;
  const core = 120 * k;
  const wz = -12 * k;
  const atOf = (d: Vec2, z = 0): Vec3 => [d[0] * ring, d[1] * ring, z];

  channels.forEach(c => {
    s.wire({ id: `w-${c.id}`, points: [[0, 0, wz], atOf(c.dir, wz)], stroke: wire, width: 1.25 });
    s.pulse({ id: `p-${c.id}`, wire: `w-${c.id}`, color: accent, length: 0.2 });
  });

  const drawChannel = (c: (typeof channels)[number]) => {
    const at = atOf(c.dir);
    const r = 13 * k;
    s.group(`${c.id}-g`, () => {
      s.slab({ id: c.id, at, size: [tile, tile], height: 20 * k, radius: r, top: ui.top, side: paints.gradient(s, ramps.silver), outline: line, edge: line, shade: false });
      s.face({ id: `${c.id}-lit`, at, size: [tile, tile], radius: r, fill: tint, stroke: 'rgb(3 105 161 / .35)' });
      s.text({ id: `${c.id}-name`, at: [at[0] + tile / 2 - 12 * k, at[1], 0], text: c.id, size: 11, color: name, on: 'top', along: 'y', anchor: 'middle' });
      const p: Vec3 = [at[0] - 8 * k, at[1], 0];
      s.group(`${c.id}-copy`, () => {
        s.face({ id: `${c.id}-sheet`, at: p, size: [34 * k, 26 * k], radius: 4 * k, fill: '#ffffff', stroke: 'rgb(3 105 161 / .5)' });
        s.face({ id: `${c.id}-l1`, at: [p[0] - 8 * k, p[1], 0], size: [5 * k, 18 * k], radius: 2 * k, fill: accent });
        s.face({ id: `${c.id}-l2`, at: [p[0] + 2 * k, p[1], 0], size: [3 * k, 18 * k], radius: 1.5 * k, fill: 'rgb(22 23 27 / .22)' });
        s.face({ id: `${c.id}-l3`, at: [p[0] + 9 * k, p[1] + 3 * k, 0], size: [3 * k, 12 * k], radius: 1.5 * k, fill: 'rgb(22 23 27 / .22)' });
      });
      s.pivot(`${c.id}-copy`, p);
    });
    s.pivot(`${c.id}-g`, [at[0], at[1], -20 * k]);
  };

  channels.filter(c => c.dir[0] + c.dir[1] < 0).forEach(drawChannel);
  s.group('core-g', () => {
    s.slab({ id: 'core', at: [0, 0, 0], size: [core, core], height: 30 * k, radius: 22 * k, top: ui.top, side: paints.gradient(s, ramps.sky), outline: 'rgb(3 105 161 / .35)', edge: line, shade: false });
    s.text({ id: 'core-name', at: [core / 2 - 14 * k, 0, 0], text: 'cms', size: 11, color: deep, on: 'top', along: 'y', anchor: 'middle' });
    const doc: Vec3 = [-8 * k, 0, 6 * k];
    s.group('doc-g', () => {
    s.slab({ id: 'doc', at: doc, size: [70 * k, 56 * k], height: 6 * k, radius: 7 * k, top: '#ffffff', side: paints.flat('#e0f2fe'), outline: 'rgb(3 105 161 / .45)', edge: line, shade: false, shadow: false });
    s.face({ id: 'doc-lit', at: doc, size: [70 * k, 56 * k], radius: 7 * k, fill: tint });
    s.face({ id: 'doc-l1', at: [doc[0] - 20 * k, doc[1], doc[2]], size: [8 * k, 40 * k], radius: 3 * k, fill: accent });
    [-5, 6, 17].forEach((dx, i) => s.face({ id: `doc-l${i + 2}`, at: [doc[0] + dx * k, doc[1] + (i === 2 ? 8 : 0) * k, doc[2]], size: [4 * k, (i === 2 ? 24 : 40) * k], radius: 2 * k, fill: 'rgb(22 23 27 / .2)' }));
    });
  });
  channels.filter(c => c.dir[0] + c.dir[1] > 0).forEach(drawChannel);

  s.label({ id: 'title', at: { screen: [l.origin[0], l.title] }, variant: 'card', size: 14, anchor: 'bottom', html: `<div style="font-size:.8em;color:${ui.muted};margin-bottom:.3em">article</div><span style="font-weight:600">Spring release notes</span>` });
  statuses.forEach(st => s.label({ id: st.id, at: { screen: [l.origin[0], l.status] }, html: st.html, size: 13, anchor: 'top' }));
  if (l.notes)
    channels.forEach(c => {
      const [x, y] = s.project(atOf(c.dir));
      const gap = tile * 0.707 + 14 * k;
      const anchor = c.side === 'top' ? 'top' : c.side === 'right' ? 'left' : 'right';
      const px = c.side === 'top' ? x + gap + 12 * k : c.side === 'right' ? x + gap : x - gap;
      s.label({ id: `${c.id}-note`, at: { screen: [fitX(px, c.note, l.width, 521, c.side === 'top' ? 'left' : anchor), c.side === 'top' ? y + 14 * k : y - 6 * k] }, text: c.note, size: 13, anchor: c.side === 'top' ? 'left' : anchor });
    });

  s.dropIn('core-g', 0.1);
  channels.forEach((c, i) => {
    const t = 0.45 + i * 0.167;
    s.intro(`${c.id}-g`, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.intro(`${c.id}-g`, 'scale', t, 0.23, 0.05, 1.14, ease.out);
    s.intro(`${c.id}-g`, 'scale', t + 0.23, 0.24, 1.14, 1, ease.io);
  });
  s.intro('title', 'opacity', 0.6, 0.3, 0, 1, ease.out);
  s.intro('title', 'translate', 0.6, 0.4, '0 8px', '0 0', ease.out);

  const loop = 10;
  const end = 8.4;
  s.loop(loop, 7.6);
  const show = (id: string, t: number, until: number) => {
    s.at(id, 'opacity', t, 0.25, 0, 1, ease.out);
    s.at(id, 'translate', t, 0.4, '0 6px', '0 0', ease.out);
    s.at(id, 'opacity', until, 0.25, 1, 0, ease.linear);
  };

  s.at('doc-lit', 'opacity', 0.5, 0.1, 0, 1, ease.linear);
  s.at('doc-lit', 'opacity', 0.6, 0.6, 1, 0, ease.linear);
  s.at('doc-g', 'translate', 0.5, 0.3, '0 0', '0 -5px', pull);
  s.at('doc-g', 'translate', 0.8, 0.74, '0 -5px', '0 0', settle);
  s.at('core-g', 'translate', 0.55, 0.3, '0 0', '0 4px', pull);
  s.at('core-g', 'translate', 0.85, 0.74, '0 4px', '0 0', settle);

  let last = 0;
  channels.forEach((c, i) => {
    const start = 0.9 + i * 0.32;
    const dur = Math.max(0.35, s.wireLength(`w-${c.id}`) / 270);
    const arrive = start + dur;
    last = arrive;
    s.travel(`p-${c.id}`, start, dur);
    s.at(`${c.id}-lit`, 'opacity', arrive, 0.1, 0, 1, ease.linear);
    s.at(`${c.id}-lit`, 'opacity', arrive + 0.1, 0.6, 1, 0.6, ease.linear);
    s.at(`${c.id}-lit`, 'opacity', end + i * 0.05, 0.5, 0.6, 0, ease.linear);
    s.at(`${c.id}-g`, 'translate', arrive, 0.3, '0 0', '0 -6px', pull);
    s.at(`${c.id}-g`, 'translate', arrive + 0.3, 0.74, '0 -6px', '0 0', settle);
    s.at(`${c.id}-copy`, 'opacity', arrive + 0.05, 0.1, 0, 1, ease.linear);
    s.at(`${c.id}-copy`, 'scale', arrive + 0.05, 0.23, 0.05, 1.14, ease.out);
    s.at(`${c.id}-copy`, 'scale', arrive + 0.28, 0.24, 1.14, 1, ease.io);
    s.at(`${c.id}-copy`, 'opacity', end + i * 0.05, 0.4, 1, 0, ease.linear);
    if (l.notes) {
      const from = c.side === 'right' ? '-8px 0' : c.side === 'left' ? '8px 0' : '0 -6px';
      s.at(`${c.id}-note`, 'opacity', arrive + 0.1, 0.25, 0, 1, ease.out);
      s.at(`${c.id}-note`, 'translate', arrive + 0.1, 0.45, from, '0 0', ease.out);
      s.at(`${c.id}-note`, 'opacity', end + i * 0.05, 0.4, 1, 0, ease.linear);
    }
  });

  s.at('st-draft', 'opacity', 0.5, 0.2, 1, 0, ease.linear);
  s.at('st-draft', 'opacity', end + 0.7, 0.3, 0, 1, ease.out);
  show('st-going', 0.65, last + 0.1);
  show('st-live', last + 0.35, end + 0.3);
  return s;
}

export const example: Example = {
  slug: 'cms-publish',
  title: 'Publish once, everywhere',
  story: 'One article leaves the CMS core for the web, the app, email, social and the feed, and each channel lights as its copy lands.',
  prompt: 'Draw a CMS as a core holding one article, with five channels around it (web, app, email, social, feed); on publish a copy travels to each channel in turn and each one lights as its copy lands.',
  level: 'medium',
  category: 'product',
  layout: 'radial',
  useCase: 'Content',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build({ name: 'cms-sm', width: 390, height: 420, origin: [195, 196], k: 0.9, notes: false, title: 86, status: 370 }),
    build({ name: 'cms-lg', width: 720, height: 400, origin: [360, 178], k: 1, notes: true, title: 82, status: 348 }),
    520,
  ),
};

export default page(example);
