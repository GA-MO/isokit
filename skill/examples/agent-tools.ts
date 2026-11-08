import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fonts, page, ramps, surfaces, type Example, fitX, narrowest, paints } from './shared';

const ui = surfaces.dark;
const call = '#818cf8';
const reply = '#c7d2fe';
const glow = 'rgb(129 140 248 / .3)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';

type Anchor = 'left' | 'right' | 'top' | 'bottom';
interface Tool {
  id: string;
  name: string;
  result: string;
  at: Vec2;
  route: readonly Vec2[];
  pill: { dx: number; dy: number; anchor: Anchor };
}

const toolSize = 96;
const coreSize = 144;
const callStart = [2.8, 4.9, 7.0] as const;

function tools(wide: boolean): Tool[] {
  const p = (dx: number, dy: number, anchor: Anchor) => ({ dx, dy, anchor });
  return [
    { id: 'search', name: 'search', result: '8 docs', at: [0, 240], route: [[0, coreSize / 2], [0, 240 - toolSize / 2]], pill: wide ? p(58, -64, 'left') : p(-12, 58, 'top') },
    { id: 'db', name: 'database', result: '1,204 rows', at: [232, 232], route: [[coreSize / 2, 34], [150, 34], [150, 232], [232 - toolSize / 2, 232]], pill: wide ? p(84, 6, 'left') : p(0, 58, 'top') },
    { id: 'code', name: 'runner', result: 'Δ +18.4 %', at: [240, 0], route: [[coreSize / 2, 0], [240 - toolSize / 2, 0]], pill: wide ? p(58, 62, 'left') : p(8, 58, 'top') },
  ];
}

function build(name: string, width: number, height: number, origin: readonly [number, number], k: number, wide: boolean, chat: { question: Vec2; answer: Vec2 }) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const side = wide ? -1 : 1;
  const plane = ([a, b]: Vec2, z = 0): Vec3 => [a * k, b * side * k, z];
  const list = tools(wide);
  const wz = -12 * k;

  list.forEach(t => {
    const pts = t.route.map(r => plane(r, wz));
    s.wire({ id: `w-${t.id}`, points: pts, stroke: ui.wire, width: 1.25 });
    s.wire({ id: `r-${t.id}`, points: [...pts].reverse(), stroke: 'none' });
    s.pulse({ id: `call-${t.id}`, wire: `w-${t.id}`, color: call, length: 0.2 });
    s.pulse({ id: `back-${t.id}`, wire: `r-${t.id}`, color: reply, length: 0.2 });
  });

  const drawTool = (t: Tool) => {
    const at = plane(t.at);
    const size = [toolSize * k, toolSize * k] as const;
    s.slab({ id: t.id, at, size, height: 22 * k, radius: 16 * k, top: ui.top, side: paints.brushed(s, ramps.graphite), grain: 0.06, edge: ui.edge });
    s.face({ id: `${t.id}-glow`, at, size, radius: 16 * k, fill: glow });
    s.text({ id: `${t.id}-name`, at: [at[0] + (toolSize / 2 - 14) * k, at[1], 0], text: t.name, size: wide ? 12 : 10, color: '#d4d4d8', on: 'top', along: 'y', anchor: 'middle' });
  };
  const drawCore = () => {
    const at = plane([0, 0], 14 * k);
    const size = [coreSize * k, coreSize * k] as const;
    s.slab({ id: 'core', at, size, height: 44 * k, radius: 26 * k, top: ui.top, side: paints.gradient(s, ramps.indigo), grain: 0.06, edge: ui.edge });
    s.face({ id: 'core-glow', at, size, radius: 26 * k, fill: glow });
    s.text({ id: 'core-name', at: [at[0] + (coreSize / 2 - 18) * k, 0, at[2]], text: 'agent', size: wide ? 13 : 11, color: reply, on: 'top', along: 'y', anchor: 'middle' });
    [-34, 0, 34].forEach((dy, i) => {
      const p: Vec3 = [at[0] - 14 * k, dy * k * side, at[2]];
      s.face({ id: `step-${i}`, at: p, size: [22 * k, 22 * k], radius: 6 * k, stroke: 'rgb(199 210 254 / .45)', dash: '2 2' });
      s.face({ id: `step-${i}-done`, at: p, size: [22 * k, 22 * k], radius: 6 * k, fill: call });
    });
  };
  const order = wide ? ['search', 'core', 'db', 'code'] : ['core', 'search', 'code', 'db'];
  order.forEach(id => (id === 'core' ? drawCore() : drawTool(list.find(t => t.id === id)!)));

  list.forEach(t => {
    const [x, y] = s.project(plane(t.at));
    s.label({ id: `${t.id}-out`, at: { screen: [fitX(x + t.pill.dx * k, t.result, width, wide ? 761 : narrowest, t.pill.anchor), y + t.pill.dy * k] }, text: t.result, size: 13, anchor: t.pill.anchor });
  });
  const muted = `<div style="font-size:.8em;color:${ui.muted};margin-bottom:.35em">`;
  s.label({ id: 'question', at: { screen: chat.question }, variant: 'card', size: 14, anchor: wide ? 'left' : 'top', html: `${muted}you</div>Why did refunds rise in March?` });
  s.label({ id: 'answer', at: { screen: chat.answer }, variant: 'card', size: 14, anchor: wide ? 'left' : 'top', html: `${muted}agent · 3 tools</div>Refunds rose 18 % after the 3.2<br>checkout bug: 41 % were duplicates.` });

  s.dropIn('core', 0.1);
  list.forEach((t, i) => {
    s.intro(t.id, 'opacity', 0.45 + i * 0.167, 0.1, 0, 1, ease.linear);
    s.pivot(t.id, plane(t.at, -22 * k));
    s.intro(t.id, 'scale', 0.45 + i * 0.167, 0.23, 0.05, 1.14, ease.out);
    s.intro(t.id, 'scale', 0.68 + i * 0.167, 0.24, 1.14, 1, ease.io);
  });

  const end = 12.2;
  s.loop(13, 10.6);
  s.at('question', 'opacity', 0.2, 0.25, 0, 1, ease.out);
  s.at('question', 'translate', 0.2, 0.45, '0 10px', '0 0', ease.out);
  s.at('question', 'opacity', end, 0.5, 1, 0, ease.linear);

  const flash = (id: string, t: number, hold = 0) => {
    s.at(id, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at(id, 'opacity', t + 0.1 + hold, 0.6, 1, 0, ease.linear);
  };
  const tug = (id: string, t: number, by: string) => {
    s.at(id, 'translate', t, 0.3, '0 0', by, pull);
    s.at(id, 'translate', t + 0.3, 0.74, by, '0 0', settle);
  };
  flash('core-glow', 1.0, 0.5);
  tug('core', 1.0, '0 5px');
  [0, 1, 2].forEach(i => {
    const t = 1.7 + i * 0.167;
    s.at(`step-${i}`, 'opacity', t, 0.2, 0, 1, ease.linear);
    s.at(`step-${i}`, 'opacity', end, 0.5, 1, 0, ease.linear);
  });

  list.forEach((t, i) => {
    const start = callStart[i]!;
    const d = Math.max(0.35, s.wireLength(`w-${t.id}`) / 270);
    const arrive = start + d;
    s.travel(`call-${t.id}`, start, d);
    flash(`${t.id}-glow`, arrive, 0.45);
    tug(t.id, arrive, '0 -6px');
    const out = arrive + 0.5;
    s.at(`${t.id}-out`, 'opacity', out, 0.25, 0, 1, ease.out);
    s.at(`${t.id}-out`, 'translate', out, 0.45, `${t.pill.anchor === 'right' ? 8 : t.pill.anchor === 'left' ? -8 : 0}px ${t.pill.anchor === 'top' ? -8 : 0}px`, '0 0', ease.out);
    s.at(`${t.id}-out`, 'opacity', end, 0.5, 1, 0, ease.linear);
    s.travel(`back-${t.id}`, out, d);
    const home = out + d;
    s.at(`step-${i}-done`, 'opacity', home, 0.2, 0, 1, ease.linear);
    s.at(`step-${i}-done`, 'opacity', end, 0.5, 1, 0, ease.linear);
    s.at('core-glow', 'opacity', home, 0.1, 0, 0.7, ease.linear);
    s.at('core-glow', 'opacity', home + 0.1, 0.5, 0.7, 0, ease.linear);
  });

  s.at('answer', 'opacity', 9.1, 0.2, 0, 1, ease.linear);
  s.typeIn('answer', 9.1, 1.3, 26);
  s.at('answer', 'opacity', end, 0.5, 1, 0, ease.linear);
  return s;
}

export const example: Example = {
  slug: 'agent-tools',
  title: 'Agent calls its tools',
  ask: 'Show an AI agent calling its tools to answer.',
  story: 'An AI agent plans three steps, calls search, a database and a code runner in turn, and writes the answer from what comes back.',
  prompt: 'Draw an AI agent as a core with three tool satellites: a question arrives, the agent plans, calls search, database and code runner one by one, then types an answer card.',
  level: 'complex',
  intent: 'talk',
  layout: 'radial',
  useCase: 'AI agents',
  surface: 'dark',
  interaction: 'watch',
  art: art(
    build('agent-sm', 390, 560, [196, 300], 0.7, false, { question: [195, 24], answer: [195, 110] }),
    build('agent-lg', 1120, 520, [590, 280], 1, true, { question: [120, 178], answer: [120, 272] }),
    760,
  ),
};

export default page(example);
