import { Scene, ease, type Vec3 } from '../lib/iso.ts';
import { art, fonts, n, page, ramps, surfaces, type Example, paints, nightFloor } from './shared.ts';

const ui = surfaces.night;
const metric = '#2dd4bf';
const trace = '#99f6e4';
const log = '#b4bbe0';
const alert = '#fb7185';
const grow = 'cubic-bezier(.62,.2,.1,1)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const services = ['api', 'auth', 'billing'] as const;
const spiking = 2;
const rest = [34, 48, 28] as const;
const peak = 104;

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: readonly [number, number];
  k: number;
  services: readonly Vec3[];
  collector: Vec3;
  board: Vec3;
  boardSize: readonly [number, number];
  timeline: Vec3;
  timelineSize: readonly [number, number];
  emits: readonly (readonly Vec3[])[];
  toBoard: readonly Vec3[];
  toTimeline: readonly Vec3[];
  legend: readonly [number, number];
  alertAnchor: 'top' | 'bottom';
}

const plane = (k: number) => (x: number, y: number, z = 0): Vec3 => [x * k, y * k, z * k];

function wide(): Layout {
  const k = 1.12;
  const v = plane(k);
  const w = (x: number, y: number) => v(x, y, -8);
  const ys = [-150, 0, 150];
  return {
    name: 'observe-lg',
    width: 1120,
    height: 540,
    origin: [540, 262],
    k,
    services: ys.map(y => v(-270, y)),
    collector: v(0, 0),
    board: v(270, -140),
    boardSize: [140 * k, 120 * k],
    timeline: v(250, 150),
    timelineSize: [170 * k, 104 * k],
    emits: ys.map(y => (y === 0 ? [w(-235, 0), w(-55, 0)] : [w(-235, y), w(-140, y), w(-140, Math.sign(y) * 34), w(-55, Math.sign(y) * 34)])),
    toBoard: [w(55, -30), w(270, -30), w(270, -80)],
    toTimeline: [w(0, 55), w(0, 150), w(165, 150)],
    legend: [96, 70],
    alertAnchor: 'bottom',
  };
}

function compact(): Layout {
  const k = 0.8;
  const v = plane(k);
  const w = (x: number, y: number) => v(x, y, -8);
  return {
    name: 'observe-sm',
    width: 390,
    height: 580,
    origin: [195, 312],
    k,
    services: [v(-210, 20), v(-230, -300), v(35, -210)],
    collector: v(0, 0),
    board: v(100, 260),
    boardSize: [110 * k, 100 * k],
    timeline: v(260, 100),
    timelineSize: [100 * k, 120 * k],
    emits: [
      [w(-175, 20), w(-55, 20)],
      [w(-195, -300), w(-25, -300), w(-25, -55)],
      [w(35, -175), w(35, -55)],
    ],
    toBoard: [w(52, 55), w(52, 210)],
    toTimeline: [w(55, 52), w(210, 52)],
    legend: [22, 54],
    alertAnchor: 'top',
  };
}

function build(l: Layout) {
  const { k } = l;
  const s = new Scene({ name: l.name, width: l.width, height: l.height, origin: l.origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const ground = -34 * k;
  const span = n(720 * k);
  nightFloor(s, [l.collector[0], l.collector[1], ground], span, 18);
  const halo = s.def('collector-halo-fill', `<radialGradient id="$ID"><stop offset="0" stop-color="#2dd4bf" stop-opacity=".5"/><stop offset=".45" stop-color="#0d9488" stop-opacity=".18"/><stop offset="1" stop-color="#0d9488" stop-opacity="0"/></radialGradient>`);
  s.face({ id: 'collector-halo', at: [l.collector[0], l.collector[1], ground], size: [300 * k, 300 * k], radius: 150 * k, fill: halo });

  l.emits.forEach((points, i) => s.wire({ id: `w-${services[i]}`, points, stroke: ui.wire, width: 1.25 }));
  s.wire({ id: 'w-board', points: l.toBoard, stroke: ui.wire, width: 1.25 });
  s.wire({ id: 'w-trace', points: l.toTimeline, stroke: ui.wire, width: 1.25 });

  const signal = (id: string, wire: string, color: string, dash: readonly number[], width: number) => {
    const d = s.wirePath(wire === 'w-board' ? l.toBoard : wire === 'w-trace' ? l.toTimeline : l.emits[services.indexOf(wire.slice(2) as (typeof services)[number])]!);
    const span = dash.reduce((a, b) => a + b, 0);
    const path = (extra: string) => `<path d="${d}" fill="none" pathLength="1" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-dasharray="${[...dash, 3].join(' ')}"${extra}/>`;
    s.svg(id, path(` opacity=".4" stroke-width="${width * 3}" filter="${s.blur(3)}"`) + path(''));
    s.set(id, 'opacity', 0, 0, 'intro');
    return { id, wire, span };
  };
  type Signal = ReturnType<typeof signal>;
  const send = (sig: Signal, t: number) => {
    const dur = Math.max(0.3, s.wireLength(sig.wire) / 270);
    s.at(sig.id, 'opacity', t, 0.05, 0, 1, ease.linear);
    s.at(sig.id, 'strokeDashoffset', t, dur, sig.span, -1, ease.linear);
    s.at(sig.id, 'opacity', t + dur - 0.05, 0.05, 1, 0, ease.linear);
    return t + dur;
  };
  const logs = signal('log', 'w-api', log, [0.018, 0.016, 0.018, 0.016, 0.018], 1.6);
  const dots = signal('metric', 'w-auth', metric, [0.001], 4.2);
  const traces = [0, 1].map(i => signal(`trace-${i}`, 'w-billing', trace, [0.05, 0.02, 0.035], 2));
  const burst = [0, 1, 2].map(i => signal(`burst-${i}`, 'w-billing', alert, [0.001], 4.2));
  const toBoard = signal('metric-out', 'w-board', metric, [0.001], 4.2);
  const toBoardHot = signal('board-hot', 'w-board', alert, [0.001], 4.2);
  const toTrace = [0, 1].map(i => signal(`trace-out-${i}`, 'w-trace', trace, [0.05, 0.02, 0.035], 2));

  const bs = 70 * k;
  l.services.forEach((at, i) => {
    const name = services[i]!;
    s.group(`svc-${name}`, () => {
      s.slab({ id: `svc-${name}-slab`, at, size: [bs, bs], height: 22 * k, radius: 13 * k, top: ui.top, side: paints.brushed(s, ramps.steel), grain: 0.06, edge: ui.edge });
      if (i === spiking) s.face({ id: 'svc-hot', at, size: [bs, bs], radius: 13 * k, fill: 'rgb(251 113 133 / .42)' });
      s.text({ id: `svc-${name}-name`, at, text: name, size: 11, color: ui.ink, on: 'top', anchor: 'middle' });
    });
  });

  const cs = 110 * k;
  s.group('collector', () => {
    s.slab({ id: 'collector-slab', at: l.collector, size: [cs, cs], height: 34 * k, radius: 20 * k, top: '#163a52', side: paints.gradient(s, ramps.teal), grain: 0.06, edge: 'rgb(153 246 228 / .4)' });
    s.face({ id: 'collector-glow', at: l.collector, size: [cs, cs], radius: 20 * k, fill: 'rgb(45 212 191 / .2)' });
    s.text({ id: 'collector-name', at: l.collector, text: 'collector', size: 12, color: '#99f6e4', on: 'top', anchor: 'middle' });
  });

  const [tw, td] = l.timelineSize;
  s.slab({ id: 'timeline', at: l.timeline, size: [tw, td], height: 12 * k, radius: 12 * k, top: '#1c2250', side: paints.brushed(s, ramps.steel), grain: 0.05, edge: ui.edge });
  const spans = [
    { id: 'span-root', x0: 0.08, len: 0.7, row: 0, color: trace },
    { id: 'span-auth', x0: 0.2, len: 0.32, row: 1, color: trace },
    { id: 'span-billing', x0: 0.4, len: 0.22, row: 2, color: trace },
    { id: 'span-slow', x0: 0.4, len: 0.52, row: 2, color: alert },
  ] as const;
  spans.forEach(sp => {
    const along = tw * 0.86;
    const x = l.timeline[0] - along / 2 + along * (sp.x0 + sp.len / 2);
    const y = l.timeline[1] - td * 0.28 + sp.row * td * 0.28;
    s.face({ id: sp.id, at: [x, y, l.timeline[2]], size: [along * sp.len, td * 0.12], radius: td * 0.06, fill: sp.color });
    s.set(sp.id, 'opacity', 0, 0, 'intro');
  });

  const [bw, bd] = l.boardSize;
  s.slab({ id: 'board', at: l.board, size: [bw, bd], height: 12 * k, radius: 12 * k, top: '#1c2250', side: paints.brushed(s, ramps.steel), grain: 0.05, edge: ui.edge });
  const barAt = (i: number): Vec3 => [l.board[0], l.board[1] + (i - 1) * bd * 0.3, l.board[2]];
  const barSize = 24 * k;
  services.forEach((name, i) => {
    s.prism({ id: `bar-${name}`, at: barAt(i), size: [barSize, barSize], height: rest[i]! * k, reach: peak * k, radius: 5 * k, top: '#5eead4', side: ['#0f766e', '#14b8a6'] });
  });
  s.prism({ id: 'bar-hot', at: barAt(spiking), size: [barSize, barSize], height: rest[spiking]! * k, reach: peak * k, radius: 5 * k, top: '#fda4af', side: ['#9f1239', '#e11d48'] });

  const glyph = (kind: 'log' | 'metric' | 'trace') =>
    kind === 'log'
      ? `<i style="display:flex;gap:.2em">${`<b style="width:.38em;height:2px;background:${log};border-radius:1px"></b>`.repeat(3)}</i>`
      : kind === 'metric'
        ? `<i style="width:.42em;height:.42em;border-radius:50%;background:${metric};box-shadow:0 0 6px ${metric}"></i>`
        : `<i style="display:flex;gap:.15em"><b style="width:.9em;height:2px;background:${trace}"></b><b style="width:.6em;height:2px;background:${trace}"></b></i>`;
  const row = (kind: 'log' | 'metric' | 'trace', text: string) => `<span style="display:flex;align-items:center;gap:.55em"><span style="display:flex;width:1.7em;justify-content:center">${glyph(kind)}</span>${text}</span>`;
  s.label({ id: 'legend', at: { screen: l.legend }, html: `<span style="display:grid;gap:.35em;color:${ui.muted}">${row('log', 'logs')}${row('metric', 'metrics')}${row('trace', 'traces')}</span>`, size: 13, variant: 'plain', anchor: 'left' });
  const top = barAt(spiking);
  s.label({ id: 'alert', at: l.alertAnchor === 'top' ? [l.board[0] + bw * 0.5, l.board[1] + bd * 0.5, -22 * k] : [top[0], top[1], (peak + 30) * k], anchor: l.alertAnchor, html: `<span style="color:${alert}">billing</span> p99 <b style="font-weight:500">1.8 s</b>`, size: 13 });

  services.forEach((name, i) => s.dropIn(`svc-${name}`, 0.1 + i * 0.083));
  s.dropIn('collector', 0.3);
  s.dropIn('timeline', 0.55);
  s.dropIn('board', 0.63);
  services.forEach((name, i) => s.heightTo(`bar-${name}`, 0.9 + i * 0.08, 0.6, 0, rest[i]! * k, grow, 'intro'));
  s.heightTo('bar-hot', 0.9 + spiking * 0.08, 0.6, 0, rest[spiking]! * k, grow, 'intro');
  s.set('bar-hot', 'opacity', 0, 0, 'intro');
  s.intro('legend', 'opacity', 1.1, 0.4, 0, 1, ease.out);
  s.set('alert', 'opacity', 0, 0, 'intro');

  const collect = (t: number) => {
    s.at('collector-glow', 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at('collector-glow', 'opacity', t + 0.1, 0.6, 1, 0, ease.linear);
  };
  const bump = (bar: string, t: number, from: number, to: number) => s.heightTo(bar, t, 0.75, from * k, to * k, grow);
  const reveal = (id: string, t: number) => {
    s.set(id, 'opacity', t, 1);
    s.at(id, 'clipPath', t, 0.35, 'inset(-20% 100% -20% 0)', 'inset(-20% 0% -20% 0)', ease.out);
  };

  const cycle = (t0: number) => {
    send(logs, t0);
    const m = send(dots, t0 + 0.25);
    const tr = send(traces[0]!, t0 + 0.5);
    const inAt = Math.max(m, tr);
    collect(inAt);
    const b = send(toBoard, inAt + 0.1);
    bump('bar-auth', b, rest[1], rest[1] + 10);
    bump('bar-auth', b + 0.8, rest[1] + 10, rest[1]);
    bump('bar-api', b + 0.1, rest[0], rest[0] - 6);
    bump('bar-api', b + 0.9, rest[0] - 6, rest[0]);
    return send(toTrace[0]!, inAt + 0.15);
  };

  const t1 = cycle(0.2);
  reveal('span-root', t1);
  reveal('span-auth', t1 + 0.15);
  reveal('span-billing', t1 + 0.3);
  const calm = t1 + 1.2;
  ['span-root', 'span-auth', 'span-billing'].forEach((id, i) => s.at(id, 'opacity', calm + i * 0.04, 0.3, 1, 0, ease.linear));

  const spike = calm + 0.6;
  s.at('svc-hot', 'opacity', spike, 0.2, 0, 1, ease.linear);
  s.at(`svc-${services[spiking]}`, 'translate', spike, 0.3, '0 0', '0 -6px', pull);
  s.at(`svc-${services[spiking]}`, 'translate', spike + 0.3, 0.74, '0 -6px', '0 0', settle);
  const hit = burst.map((sig, i) => send(sig, spike + 0.1 + i * 0.16));
  const t2 = send(traces[1]!, spike + 0.62);
  collect(hit[0]!);
  const b = send(toBoardHot, hit[0]! + 0.1);
  s.heightTo(`bar-${services[spiking]}`, b, 0.75, rest[spiking] * k, peak * k, grow);
  s.heightTo('bar-hot', b, 0.75, rest[spiking] * k, peak * k, grow);
  s.at('bar-hot', 'opacity', b, 0.2, 0, 1, ease.linear);
  s.at('alert', 'opacity', b + 0.5, 0.25, 0, 1, ease.out);
  s.at('alert', 'translate', b + 0.5, 0.4, '0 6px', '0 0', ease.out);
  const tt = send(toTrace[1]!, t2 + 0.1);
  reveal('span-root', tt);
  reveal('span-auth', tt + 0.15);
  reveal('span-slow', tt + 0.3);

  const recover = b + 2.0;
  s.at('svc-hot', 'opacity', recover - 0.4, 0.6, 1, 0, ease.linear);
  s.heightTo(`bar-${services[spiking]}`, recover, 0.9, peak * k, rest[spiking] * k, grow);
  s.heightTo('bar-hot', recover, 0.9, peak * k, rest[spiking] * k, grow);
  s.at('bar-hot', 'opacity', recover + 0.3, 0.6, 1, 0, ease.linear);
  s.at('alert', 'opacity', recover, 0.3, 1, 0, ease.linear);
  s.at('span-slow', 'opacity', recover + 0.1, 0.4, 1, 0, ease.linear);
  s.set('span-billing', 'clipPath', recover + 0.4, 'inset(-20% 100% -20% 0)');
  reveal('span-billing', recover + 0.45);
  const end = recover + 1.8;
  ['span-root', 'span-auth', 'span-billing'].forEach((id, i) => s.at(id, 'opacity', end + i * 0.04, 0.3, 1, 0, ease.linear));
  s.loop(Math.round((end + 0.7) * 10) / 10, b + 1.2);
  return s;
}

export const example: Example = {
  slug: 'observability',
  title: 'Signals to dashboard',
  ask: 'Show logs, metrics and traces catching a spike.',
  story: 'Three services send logs, metrics and traces to one collector; when billing spikes, its bar jumps and turns red, its span stretches, then both recover.',
  prompt: 'Draw three services streaming logs, metrics and traces into a collector that feeds a bar dashboard and a trace waterfall, with one service spiking red and recovering.',
  level: 'complex',
  intent: 'inside',
  layout: 'radial',
  useCase: 'Observability',
  surface: 'night',
  interaction: 'watch',
  art: art(build(compact()), build(wide()), 760),
};

export default page(example);
