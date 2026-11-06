import { Scene, ease, responsive, type Vec2, type Vec3 } from '../lib/iso';
import { fonts, page, ramps, surfaces, type Example } from './shared';

const ui = surfaces.dark;
const accent = '#a78bfa';
const tint = 'rgb(167 139 250 / .3)';
const curve = {
  snapOff: 'cubic-bezier(.45,.86,.17,.96)',
  pull: 'cubic-bezier(.41,.27,.05,.79)',
  settle: 'cubic-bezier(.39,.08,.04,.91)',
  shrink: 'cubic-bezier(.33,0,.91,.03)',
  exit: 'linear(0, -0.007 11.8%, -0.045 37.8%, -0.048 57%, -0.028 63.2%, 0.018 69.3%, 0.079 74.3%, 0.164 79.3%, 0.27 84%, 0.392 88.3%, 0.459 90.3%, 0.535 92.3%, 0.609 94%, 0.694 95.8%, 0.777 97.3%, 0.859 98.5%, 0.942 99.5%, 1)',
} as const;

const prompts = ['draw our deploy flow: build, test, ship', 'map our gateway to its four services'] as const;
const width = Math.max(...prompts.map(p => p.length));
const stepTime = 0.03;

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: Vec2;
  plate: number;
  card: { at: Vec2; anchor: 'center' | 'left'; size: number };
  feed: 'drop' | 'diagonal';
  feedFrom: Vec2;
  tile: number;
  pitch: number;
  hub: number;
  sat: number;
  reach: number;
  thick: number;
  text: number;
}

interface Tile {
  id: string;
  at: Vec3;
  size: number;
  name: string;
}

function box(body: string, o: { line: string; border: string; bg: string; dot: string; head: boolean; shadow?: string }) {
  const head = `<div style="display:flex;align-items:center;gap:.55em;font:500 1em/1.45 var(--iso-font);color:${ui.muted};margin-bottom:.3em${o.head ? '' : ';visibility:hidden'}"><span style="width:.5em;height:.5em;border-radius:50%;background:${o.dot}"></span>prompt</div>`;
  return `<div style="padding:.75em 2ch;border:1px solid ${o.border};border-radius:12px;background:${o.bg};${o.shadow ? `box-shadow:${o.shadow};` : ''}font:400 1em/1.45 var(--iso-mono);color:${o.line}">${head}<div>${body}</div></div>`;
}

const hidden = (chars: number) => (chars > 0 ? `<span style="visibility:hidden">${'x'.repeat(chars)}</span>` : '');

function build(l: Layout) {
  const s = new Scene({ name: l.name, width: l.width, height: l.height, origin: l.origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const half = l.plate / 2;
  const mid = l.thick / 2;

  const card = { at: { screen: l.card.at }, anchor: l.card.anchor, size: l.card.size, variant: 'plain' } as const;
  s.label({ ...card, id: 'frame', html: box(hidden(width), { line: ui.ink, border: 'rgb(255 255 255 / .1)', bg: '#16171c', dot: '#3f414b', head: true, shadow: '0 18px 40px -20px rgb(0 0 0 / .8)' }) });
  s.label({ ...card, id: 'hot', html: box(hidden(width), { line: ui.ink, border: 'rgb(167 139 250 / .7)', bg: 'transparent', dot: accent, head: true, shadow: '0 0 0 3px rgb(167 139 250 / .12), 0 0 28px -6px rgb(167 139 250 / .55)' }).replace('>prompt<', '><') });
  s.label({ ...card, id: 'hint', html: box(`<span style="color:#5d606b">describe a scene to draw</span>${hidden(width - 24)}`, { line: ui.ink, border: 'transparent', bg: 'transparent', dot: 'transparent', head: false }) });
  prompts.forEach((p, i) => s.label({ ...card, id: `p${i}`, html: box(`${p}${hidden(width - p.length)}`, { line: ui.ink, border: 'transparent', bg: 'transparent', dot: 'transparent', head: false }) }));

  const corner = s.unproject(s.extremes([0, 0, 0], [l.plate, l.plate], l.plate * 0.07).back, 0);
  const start = s.unproject(l.feedFrom, 0);
  const feed: Vec3[] =
    l.feed === 'drop'
      ? [[corner[0], corner[1], s.project(corner)[1] - l.feedFrom[1]], corner]
      : [start, [-half + 2, start[1], 0]];
  if (l.feed === 'diagonal' && !(Math.abs(start[1]) < half - l.plate * 0.07)) throw new Error(`hero ${l.name}: the feed wire misses the plate edge (y ${start[1].toFixed(1)})`);
  s.wire({ id: 'feed', points: feed, stroke: ui.wire, width: 1.25, hidden: true });
  s.pulse({ id: 'p-feed', wire: 'feed', color: accent, length: 0.18 });

  const grid = s.def('grid', `<pattern id="$ID" patternUnits="userSpaceOnUse" width="20" height="20" x="${half % 20}" y="${half % 20}"><circle cx="10" cy="10" r="1" fill="rgb(255 255 255 / .11)"/></pattern>`);
  const inset = 14;
  s.slab({
    id: 'plate',
    at: [0, 0, 0],
    size: [l.plate, l.plate],
    height: 12,
    radius: l.plate * 0.07,
    top: '#131418',
    grain: 0.05,
    side: { kind: 'marble', colors: ramps.graphite, streak: 'wide' },
    edge: 'rgb(255 255 255 / .1)',
    content: `<rect x="${-half + inset}" y="${-half + inset}" width="${l.plate - inset * 2}" height="${l.plate - inset * 2}" rx="${l.plate * 0.04}" fill="${grid}"/>`,
  });
  s.face({ id: 'rim', at: [0, 0, 0], size: [l.plate, l.plate], radius: l.plate * 0.07, stroke: accent, strokeWidth: 1.5 });
  s.text({ id: 'canvas', at: [-half + 22, half - 14, 0], text: 'scene.svg', size: 11, color: '#5d606b', on: 'top' });

  const flow: Tile[] = ['build', 'test', 'ship'].map((name, i) => ({ id: name, at: [(i - 1) * l.pitch, 0, l.thick], size: l.tile, name }));
  const hub: Tile = { id: 'gateway', at: [0, 0, l.thick], size: l.hub, name: 'gateway' };
  const sats: Tile[] = (
    [
      ['auth', 0, -1],
      ['users', 1, 0],
      ['files', 0, 1],
      ['search', -1, 0],
    ] as const
  ).map(([name, dx, dy]) => ({ id: name, at: [dx * l.reach, dy * l.reach, l.thick], size: l.sat, name }));

  flow.slice(1).forEach((b, i) => {
    const a = flow[i]!;
    s.wire({ id: `w-${a.id}`, points: [[a.at[0] + a.size / 2, 0, mid], [b.at[0] - b.size / 2, 0, mid]], stroke: ui.wire, width: 1.25, hidden: true });
    s.pulse({ id: `p-${a.id}`, wire: `w-${a.id}`, color: accent, length: 0.3 });
  });
  sats.forEach(t => {
    const [dx, dy] = [Math.sign(t.at[0]), Math.sign(t.at[1])];
    const from: Vec3 = [(dx * hub.size) / 2, (dy * hub.size) / 2, mid];
    const to: Vec3 = [t.at[0] - (dx * t.size) / 2, t.at[1] - (dy * t.size) / 2, mid];
    s.wire({ id: `w-${t.id}`, points: [from, to], stroke: ui.wire, width: 1.25, hidden: true });
    s.pulse({ id: `p-${t.id}`, wire: `w-${t.id}`, color: accent, length: 0.3 });
  });

  const tile = (t: Tile) => {
    const [x, y] = t.at;
    const r = t.size * 0.18;
    s.group(`g-${t.id}`, () => {
      s.svg(`${t.id}-glow`, `<g filter="${s.blur(t.size * 0.16)}">${s.plane([x, y, 0], `<rect x="${-t.size * 0.55}" y="${-t.size * 0.55}" width="${t.size * 1.1}" height="${t.size * 1.1}" rx="${r}" fill="${accent}" opacity=".55"/>`)}</g>`);
      s.slab({ id: t.id, at: t.at, size: [t.size, t.size], height: l.thick, radius: r, top: ui.top, grain: 0.06, side: { kind: 'marble', colors: ramps.graphite, streak: 'wide' }, edge: ui.edge });
      s.slab({ id: `${t.id}-hot`, at: t.at, size: [t.size, t.size], height: l.thick, radius: r, top: ui.top, grain: 0.06, side: { kind: 'marble', colors: ramps.violet, streak: 'wide' }, edge: 'rgb(196 181 253 / .5)', shadow: false });
      s.face({ id: `${t.id}-hit`, at: t.at, size: [t.size, t.size], radius: r, fill: tint });
      s.text({ id: `${t.id}-name`, at: t.at, text: t.name, size: l.text, color: '#d4d4d8', on: 'top', anchor: 'middle', font: 'sans' });
    });
    s.pivot(`g-${t.id}`, [x, y, 0]);
    s.set(`${t.id}-glow`, 'opacity', 0, 0);
    s.set(`${t.id}-hit`, 'opacity', 0, 0);
    s.set(`${t.id}-hot`, 'opacity', 0, 0);
  };
  [...flow, ...sats, hub].sort((a, b) => a.at[0] + a.at[1] - (b.at[0] + b.at[1])).forEach(tile);

  s.intro('frame', 'opacity', 0.1, 0.35, 0, 1, ease.out);
  s.intro('hint', 'opacity', 0.1, 0.35, 0, 1, ease.out);
  s.intro('frame', 'translate', 0.1, 0.5, '0 10px', '0 0', ease.out);
  s.intro('hint', 'translate', 0.1, 0.5, '0 10px', '0 0', ease.out);
  s.dropIn('plate', 0.25);
  s.dropIn('canvas', 0.25);
  s.draw('feed', 0.85, 0.4, ease.out, 'intro');

  const flash = (id: string, t: number) => {
    s.at(id, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at(id, 'opacity', t + 0.1, 0.6, 1, 0, ease.linear);
  };
  const feedTime = Math.max(0.3, s.wireLength('feed') / 270);
  const steps = width + 4;
  const send = (i: number, t0: number) => {
    s.typeIn(`p${i}`, t0, steps * stepTime, steps);
    const sent = t0 + steps * stepTime + 0.2;
    flash('hot', sent);
    s.travel('p-feed', sent + 0.05, feedTime);
    const landed = sent + 0.05 + feedTime;
    flash('rim', landed - 0.05);
    return landed;
  };
  const clear = (i: number, t: number) => {
    s.at(`p${i}`, 'opacity', t, 0.35, 1, 0, ease.linear);
    s.set(`p${i}`, 'clipPath', t + 0.5, 'inset(-20% 100% -20% 0)');
    s.set(`p${i}`, 'opacity', t + 0.55, 1);
  };
  const light = (t: Tile, on: number, off: number) => {
    for (const id of [`${t.id}-glow`, `${t.id}-hit`, `${t.id}-hot`]) {
      s.at(id, 'opacity', on, 0.25, 0, 1, ease.linear);
      s.at(id, 'opacity', off, 0.5, 1, 0, ease.linear);
    }
  };

  s.at('hint', 'opacity', 0.25, 0.15, 1, 0, ease.linear);

  const land1 = send(0, 0.35);
  const drops = flow.map((_, i) => land1 + 0.05 + i * 0.2);
  flow.forEach((t, i) => {
    s.set(`g-${t.id}`, 'scale', drops[i]!, 1);
    s.dropAt(`g-${t.id}`, drops[i]!);
  });
  flow.slice(0, -1).forEach((t, i) => s.draw(`w-${t.id}`, drops[i + 1]! + 0.45, 0.24));
  let run = drops[2]! + 0.75;
  flow.slice(0, -1).forEach((t, i) => {
    const dur = Math.max(0.3, s.wireLength(`w-${t.id}`) / 270);
    s.travel(`p-${t.id}`, run, dur);
    run += dur;
    const next = flow[i + 1]!;
    if (i < flow.length - 2) {
      flash(`${next.id}-hit`, run);
      run += 0.1;
    }
  });
  const ship = flow[2]!;
  s.at(`g-${ship.id}`, 'translate', run, 0.3, '0 0', '0 -6px', curve.pull);
  s.at(`g-${ship.id}`, 'translate', run + 0.3, 0.74, '0 -6px', '0 0', curve.settle);
  const exit1 = run + 1.45;
  light(ship, run, exit1);
  const still = run + 0.6;

  flow.slice(0, -1).forEach(t => s.retract(`w-${t.id}`, exit1, 0.23, 'start', curve.snapOff));
  flow.forEach((t, i) => {
    const t0 = exit1 + 0.1 + i * 0.08;
    s.at(`g-${t.id}`, 'scale', t0, 0.745, 1, 0, curve.exit);
    s.set(`g-${t.id}`, 'opacity', t0 + 0.8, 0);
  });
  clear(0, exit1 + 0.1);

  const t2 = exit1 + 0.55;
  const land2 = send(1, t2);
  const pop = (t: Tile, at: number) => {
    s.at(`g-${t.id}`, 'scale', at, 0.23, 0.05, 1.14, ease.out);
    s.at(`g-${t.id}`, 'scale', at + 0.23, 0.24, 1.14, 1, ease.io);
  };
  pop(hub, land2 + 0.05);
  const satPops = sats.map((_, i) => land2 + 0.4 + i * 0.167);
  sats.forEach((t, i) => {
    pop(t, satPops[i]!);
    s.draw(`w-${t.id}`, satPops[i]! + 0.3, 0.3, ease.out);
  });
  const fan = satPops[3]! + 0.85;
  const exit2 = fan + 1.4;
  light(hub, fan - 0.15, exit2);
  sats.forEach(t => {
    const dur = Math.max(0.3, s.wireLength(`w-${t.id}`) / 270);
    s.travel(`p-${t.id}`, fan, dur);
    flash(`${t.id}-hit`, fan + dur);
  });

  sats.forEach(t => s.retract(`w-${t.id}`, exit2, 0.23, 'start', curve.snapOff));
  [...sats].reverse().forEach((t, i) => s.at(`g-${t.id}`, 'scale', exit2 + 0.1 + i * 0.06, 0.42, 1, 0, curve.shrink));
  s.at(`g-${hub.id}`, 'scale', exit2 + 0.4, 0.45, 1, 0, curve.shrink);
  clear(1, exit2 + 0.1);
  const end = Math.ceil((exit2 + 1.2) * 10) / 10;
  s.at('hint', 'opacity', exit2 + 0.85, 0.3, 0, 1, ease.linear);
  s.loop(end, still);
  return s;
}

export const html = responsive(
  build({
    name: 'hero-sm',
    width: 390,
    height: 500,
    origin: [195, 318],
    plate: 256,
    card: { at: [195, 62], anchor: 'center', size: 13 },
    feed: 'drop',
    feedFrom: [195, 80],
    tile: 64,
    pitch: 94,
    hub: 72,
    sat: 52,
    reach: 94,
    thick: 20,
    text: 11,
  }),
  build({
    name: 'hero-lg',
    width: 1200,
    height: 560,
    origin: [850, 290],
    plate: 440,
    card: { at: [56, 150], anchor: 'left', size: 14 },
    feed: 'diagonal',
    feedFrom: [380, 150],
    tile: 100,
    pitch: 152,
    hub: 116,
    sat: 84,
    reach: 160,
    thick: 26,
    text: 13,
  }),
  640,
);

const preview: Example = {
  slug: 'hero',
  title: 'Prompt to scene',
  story: 'A prompt goes in and an animated isometric explainer builds itself on the artboard, then a second prompt draws a different one.',
  prompt: 'Draw a hero where a typed prompt feeds an artboard and the diagram it asks for assembles itself: tiles drop in, wires connect, light runs through.',
  level: 'complex',
  useCase: 'Hero',
  surface: 'dark',
  interaction: 'watch',
  html,
};

export default { ...page(preview), background: ui.page };
