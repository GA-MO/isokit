import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const accent = '#4f46e5';
const tint = 'rgb(99 102 241 / .2)';
const won = '#047857';
const line = 'rgb(22 23 27 / .16)';
const ink = '#4b4e57';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';

const stages = [
  { id: 'visit', size: 150, height: 44, count: 12480 },
  { id: 'sign up', size: 122, height: 34, count: 1872 },
  { id: 'trial', size: 96, height: 26, count: 640 },
  { id: 'paid', size: 74, height: 20, count: 212 },
] as const;

const visitors = [2, 1, 3, 1, 4] as const;
const gap = 0.6;
const hold = 0.12;

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: Vec2;
  k: number;
  flow: Vec2;
  at: readonly number[];
  count: 'below' | 'right';
  text: number;
}

const percent = (paid: number, visit: number) => `${((paid / visit) * 100).toFixed(2)}%`;
const fmt = (v: number) => v.toLocaleString('en-US');

function build(l: Layout) {
  const s = new Scene({ name: l.name, width: l.width, height: l.height, origin: l.origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const { k } = l;
  const place = (f: number): Vec3 => [f * l.flow[0], f * l.flow[1], 0];
  const site = { at: place(l.at[0]!), size: 46 * k, height: 14 * k };
  const blocks = stages.map((st, i) => ({ ...st, key: st.id.replace(' ', ''), at: place(l.at[i + 1]!), size: st.size * k, height: st.height * k }));
  const nodes = [{ key: 'site', at: site.at, size: site.size }, ...blocks];
  const wireZ = 8 * k;

  nodes.slice(1).forEach((b, i) => {
    const a = nodes[i]!;
    const start: Vec3 = [a.at[0], a.at[1] + Math.sign(b.at[1] - a.at[1]) * (a.size / 2), wireZ];
    const corner: Vec3 = [a.at[0], b.at[1], wireZ];
    const end: Vec3 = [b.at[0] + Math.sign(a.at[0] - b.at[0]) * (b.size / 2), b.at[1], wireZ];
    s.wire({ id: `w-${b.key}`, points: [start, corner, end], stroke: ui.wire, width: 1.25 });
    visitors.forEach((depth, v) => {
      if (depth >= i + 1) s.pulse({ id: `p-${b.key}-${v}`, wire: `w-${b.key}`, color: accent, length: 0.16 });
    });
  });

  s.group('site-g', () => {
    const top: Vec3 = [site.at[0], site.at[1], site.height];
    s.slab({ id: 'site', at: top, size: [site.size, site.size], height: site.height, radius: site.size * 0.22, top: ui.top, side: paints.gradient(s, ramps.silver), edge: ui.edge, outline: line });
    s.text({ id: 'site-name', at: top, text: 'site', size: l.text - 2, color: ink, on: 'top', anchor: 'middle' });
  });

  blocks.forEach((b, i) => {
    const top: Vec3 = [b.at[0], b.at[1], b.height];
    const size = [b.size, b.size] as const;
    const radius = b.size * 0.17;
    s.group(`${b.key}-g`, () => {
      s.slab({ id: b.key, at: top, size, height: b.height, radius, top: ui.top, side: paints.gradient(s, ramps.silver), grain: 0.05, edge: ui.edge, outline: line });
      if (i === stages.length - 1) {
        s.slab({ id: 'paid-won', at: top, size, height: b.height, radius, top: '#f2fbf7', side: paints.gradient(s, ramps.emerald), grain: 0.05, edge: ui.edge, outline: 'rgb(4 120 87 / .45)' });
      }
      s.face({ id: `${b.key}-lit`, at: top, size, radius, fill: tint });
      s.text({ id: `${b.key}-name`, at: [top[0] + b.size / 2 - 14 * k, top[1], top[2]], text: b.id, size: l.text, color: ink, on: 'top', along: 'y', anchor: 'middle' });
    });
  });

  blocks.forEach((b, i) => {
    const reach = visitors.filter(d => d >= i + 1).length;
    const corner = l.count === 'below' ? s.project([b.at[0] + b.size / 2, b.at[1] + b.size / 2, 0]) : s.project([b.at[0] + b.size / 2, b.at[1] - b.size / 2, b.height / 2]);
    const at: Vec2 = l.count === 'below' ? [corner[0], corner[1] + 16 * k] : [corner[0] + 16, corner[1]];
    for (let n = 0; n <= reach; n++) {
      const text = fmt(b.count + n);
      const x = l.count === 'below' ? fitX(at[0], text, l.width, 721) : fitX(at[0], text, l.width, narrowest, 'left');
      s.label({ id: `${b.key}-n${n}`, at: { screen: [x, at[1]] }, html: `<b style="font-weight:500">${text}</b>`, size: 13, anchor: l.count === 'below' ? 'top' : 'left' });
    }
  });

  const paid = blocks[blocks.length - 1]!;
  const visit = blocks[0]!;
  const before = `conversion ${percent(paid.count, visit.count)}`;
  const after = `conversion ${percent(paid.count + 1, visit.count + visitors.length)}`;
  const [cx, cy] = l.count === 'below' ? s.project([paid.at[0] - paid.size / 2, paid.at[1] - paid.size / 2, paid.height]) : s.project([paid.at[0] + paid.size / 2, paid.at[1] + paid.size / 2, 0]);
  const convAt: Vec2 = l.count === 'below' ? [fitX(cx, after, l.width, 721), cy - 24 * k] : [fitX(cx, after, l.width, narrowest), cy + 22];
  const convAnchor = l.count === 'below' ? 'bottom' : 'top';
  s.label({ id: 'conv-0', at: { screen: convAt }, html: `<span style="color:${ink}">${before}</span>`, size: 13, anchor: convAnchor });
  s.label({ id: 'conv-1', at: { screen: convAt }, html: `<span style="color:${won}">● ${after}</span>`, size: 13, anchor: convAnchor });

  const [sx, sy] = s.project([site.at[0] - site.size / 2, site.at[1] - site.size / 2, site.height]);
  const [fx, fy] = s.project([site.at[0] + site.size / 2, site.at[1] + site.size / 2, 0]);
  const liveAt: Vec2 = l.count === 'below' ? [fitX(fx, '● live', l.width, 721), fy + 16 * k] : [fitX(sx, '● live', l.width, narrowest), sy - 20 * k];
  s.label({ id: 'live', at: { screen: liveAt }, html: `<span style="color:${won}">●</span> live`, size: 13, anchor: l.count === 'below' ? 'top' : 'bottom' });

  s.dropIn('site-g', 0.1);
  blocks.forEach((b, i) => s.dropIn(`${b.key}-g`, 0.18 + i * 0.083));
  s.intro('live', 'opacity', 0.55, 0.3, 0, 1, ease.out);
  s.intro('live', 'translate', 0.55, 0.4, '0 8px', '0 0', ease.out);
  blocks.forEach((b, i) => s.intro(`${b.key}-n0`, 'opacity', 0.6 + i * 0.083, 0.3, 0, 1, ease.out));
  s.intro('conv-0', 'opacity', 0.95, 0.3, 0, 1, ease.out);

  const ticks = blocks.map(() => 0);
  const freeAt = blocks.map(() => 0);
  let paidAt = 0;
  visitors.forEach((depth, v) => {
    let t = 0.2 + v * gap;
    for (let j = 0; j < depth; j++) {
      const b = blocks[j]!;
      const wire = `w-${b.key}`;
      const dur = Math.max(0.3, s.wireLength(wire) / 270);
      s.travel(`p-${b.key}-${v}`, t, dur);
      const arrive = t + dur;
      s.at(`${b.key}-lit`, 'opacity', arrive, 0.1, 0, 1, ease.linear);
      s.at(`${b.key}-lit`, 'opacity', arrive + 0.1, 0.45, 1, 0, ease.linear);
      if (arrive >= freeAt[j]!) {
        s.at(`${b.key}-g`, 'translate', arrive, 0.3, '0 0', '0 3px', pull);
        s.at(`${b.key}-g`, 'translate', arrive + 0.3, 0.74, '0 3px', '0 0', settle);
        freeAt[j] = arrive + 1.04;
      }
      s.set(`${b.key}-n${ticks[j]}`, 'opacity', arrive + 0.08, 0);
      ticks[j] = ticks[j]! + 1;
      s.set(`${b.key}-n${ticks[j]}`, 'opacity', arrive + 0.08, 1);
      if (j === blocks.length - 1) paidAt = arrive;
      t = arrive + hold;
    }
  });

  s.at('paid-won', 'opacity', paidAt, 0.4, 0, 1, ease.linear);
  s.at('conv-0', 'opacity', paidAt + 0.1, 0.3, 1, 0, ease.linear);
  s.at('conv-1', 'opacity', paidAt + 0.1, 0.3, 0, 1, ease.linear);
  s.at('conv-1', 'translate', paidAt + 0.1, 0.45, '0 6px', '0 0', ease.out);

  const out = paidAt + 2.2;
  s.at('paid-won', 'opacity', out, 0.5, 1, 0, ease.linear);
  s.at('conv-1', 'opacity', out, 0.4, 1, 0, ease.linear);
  s.at('conv-0', 'opacity', out, 0.4, 0, 1, ease.linear);
  blocks.forEach((b, j) => {
    s.at(`${b.key}-n${ticks[j]}`, 'opacity', out + 0.05 * j, 0.4, 1, 0, ease.linear);
    s.at(`${b.key}-n0`, 'opacity', out + 0.05 * j, 0.4, 0, 1, ease.linear);
  });
  s.loop(Math.round((out + 0.8) * 10) / 10, paidAt + 0.9);
  return s;
}

export const example: Example = {
  slug: 'funnel-live',
  title: 'Live conversion funnel',
  ask: 'Show visitors narrowing from visit to paid.',
  story: 'Visitors stream from visit through sign up and trial to paid, fewer at each narrower stage, every count ticking up as they pass, until one pays and the conversion lights.',
  prompt: 'Draw a live analytics funnel left to right: visitors flow as pulses through visit, sign up, trial and paid blocks that narrow at each stage, each count ticking up as a pulse arrives, and the conversion rate lighting green when one pays.',
  level: 'medium',
  intent: 'flow',
  layout: 'wide',
  useCase: 'Analytics',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build({ name: 'funnel-sm', width: 390, height: 580, origin: [160, 40], k: 0.62, flow: [Math.SQRT1_2, Math.SQRT1_2], at: [70, 250, 455, 630, 780], count: 'right', text: 11 }),
    build({ name: 'funnel-lg', width: 1260, height: 420, origin: [0, 200], k: 1, flow: [Math.SQRT1_2, -Math.SQRT1_2], at: [140, 360, 630, 860, 1060], count: 'below', text: 14 }),
    720,
  ),
};

export default page(example);
