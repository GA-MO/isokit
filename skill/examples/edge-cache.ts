import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fonts, page, ramps, surfaces, type Example, paints } from './shared';

const ui = surfaces.light;
const hit = '#0d9488';
const miss = '#d97706';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const wireZ = -8;

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: readonly [number, number];
  codes: readonly string[];
  edges: readonly Vec3[];
  edgeSize: number;
  client: Vec3;
  clientSize: number;
  server: Vec3;
  serverSize: number;
  request: readonly Vec3[];
  feeds: readonly (readonly Vec3[])[];
  card: Vec3;
  get: Vec3;
}

const reverse = (points: readonly Vec3[]) => [...points].reverse();

function wide(): Layout {
  const k = 1.1;
  const edges = [-195, -65, 65, 195].map((y): Vec3 => [0, y * k, 0]);
  const e = edges[3]!;
  const edgeSize = 64 * k;
  const client: Vec3 = [e[0] - 150 * k, e[1] + 150 * k, 0];
  const clientSize = 56 * k;
  const server: Vec3 = [250 * k, -262 * k, 60 * k];
  const serverSize = 120 * k;
  const z = wireZ * k;
  return {
    name: 'edgecache-lg',
    width: 1120,
    height: 520,
    origin: [520, 222],
    codes: ['sin', 'gru', 'sfo', 'ams'],
    edges,
    edgeSize,
    client,
    clientSize,
    server,
    serverSize,
    request: [[client[0] + clientSize / 2, client[1], z], [e[0], client[1], z], [e[0], e[1] + edgeSize / 2, z]],
    feeds: edges.map(p => [[p[0] + edgeSize / 2, p[1], z], [server[0], p[1], z], [server[0], server[1] + serverSize / 2, z]]),
    card: [client[0] + 92 * k, client[1] + 92 * k, 0],
    get: [client[0] - 30 * k, client[1] - 30 * k, 54 * k],
  };
}

function compact(): Layout {
  const edges = [-186, -62, 62, 186].map((t): Vec3 => [t / 2 + 6, -t / 2 + 6, 0]);
  const codes = ['sfo', 'ams', 'sin', 'gru'];
  const e = edges[codes.indexOf('ams')]!;
  const edgeSize = 50;
  const client: Vec3 = [e[0] + 150, e[1] + 150, 0];
  const clientSize = 46;
  const server: Vec3 = [-184, -156, 46];
  const serverSize = 82;
  return {
    name: 'edgecache-sm',
    width: 390,
    height: 560,
    origin: [195, 290],
    codes,
    edges,
    edgeSize,
    client,
    clientSize,
    server,
    serverSize,
    request: [[client[0], client[1] - clientSize / 2, wireZ], [client[0], e[1], wireZ], [e[0] + edgeSize / 2, e[1], wireZ]],
    feeds: edges.map(p => [[p[0], p[1] - edgeSize / 2, wireZ], [p[0], server[1], wireZ], [server[0] + serverSize / 2, server[1], wireZ]]),
    card: [client[0] + 70, client[1] + 70, 0],
    get: [client[0] - 40, client[1] + 40, 40],
  };
}

function build(l: Layout) {
  const { codes } = l;
  const near = codes.indexOf('ams');
  const s = new Scene({ name: l.name, width: l.width, height: l.height, origin: l.origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const k = l.edgeSize / 64;

  l.feeds.forEach((points, i) => s.wire({ id: `feed-${codes[i]}`, points, stroke: ui.wire, width: 1.25 }));
  s.wire({ id: 'fill', points: reverse(l.feeds[near]!), stroke: 'transparent' });
  s.wire({ id: 'req', points: l.request, stroke: ui.wire, width: 1.25 });
  s.wire({ id: 'res', points: reverse(l.request), stroke: 'transparent' });
  s.pulse({ id: 'p-req-miss', wire: 'req', color: hit, length: 0.16 });
  s.pulse({ id: 'p-up', wire: `feed-${codes[near]}`, color: miss, length: 0.12 });
  s.pulse({ id: 'p-down', wire: 'fill', color: miss, length: 0.12 });
  s.pulse({ id: 'p-res-miss', wire: 'res', color: miss, length: 0.16 });
  s.pulse({ id: 'p-req-hit', wire: 'req', color: hit, length: 0.16 });
  s.pulse({ id: 'p-res-hit', wire: 'res', color: hit, length: 0.16 });

  const sh = l.serverSize;
  s.group('server-g', () => {
  s.slab({ id: 'server', at: l.server, size: [sh, sh], height: 80 * k * (l.name.endsWith('sm') ? 0.85 : 1), radius: sh * 0.16, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.06, edge: ui.edge });
  s.face({ id: 'server-glow', at: l.server, size: [sh, sh], radius: sh * 0.16, fill: 'rgb(245 158 11 / .2)' });
  s.text({ id: 'server-name', at: l.server, text: 'origin', size: 12, color: '#52525b', on: 'top', anchor: 'middle' });
  });

  const es = l.edgeSize;
  l.edges.forEach((at, i) => {
    const code = codes[i]!;
    s.group(`${code}-g`, () => {
    s.slab({ id: code, at, size: [es, es], height: 18 * k, radius: es * 0.18, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.06, edge: ui.edge });
    if (i === near) {
      s.slab({ id: 'warm', at, size: [es, es], height: 18 * k, radius: es * 0.18, top: '#f0fdfa', side: paints.gradient(s, ramps.teal), grain: 0.06, edge: ui.edge });
      s.face({ id: 'edge-miss', at, size: [es, es], radius: es * 0.18, fill: 'rgb(245 158 11 / .22)' });
      s.face({ id: 'edge-hit', at, size: [es, es], radius: es * 0.18, fill: 'rgb(20 184 166 / .24)' });
    }
    s.text({ id: `${code}-name`, at, text: code, size: 11, color: i === near ? '#115e59' : '#52525b', on: 'top', anchor: 'middle' });
    });
  });

  const cs = l.clientSize;
  s.group('client-g', () => {
  s.slab({ id: 'client', at: l.client, size: [cs, cs], height: 12 * k, radius: cs * 0.2, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.06, edge: ui.edge });
  s.face({ id: 'client-glow', at: l.client, size: [cs, cs], radius: cs * 0.2, fill: 'rgb(20 184 166 / .22)' });
  s.text({ id: 'client-name', at: l.client, text: 'you', size: 11, color: '#3f3f46', on: 'top', anchor: 'middle' });
  });

  s.label({ id: 'get', at: l.get, text: 'GET /hero.jpg', size: 13 });
  const row = (tag: string, color: string, bar: number, ms: string) =>
    `<span style="display:flex;align-items:center;gap:.6em;width:11em"><b style="font-weight:500;color:${color};width:2.6em">${tag}</b><i style="display:block;height:.42em;width:${bar}em;border-radius:1em;background:${color}"></i><span style="color:${ui.muted}">${ms}</span></span>`;
  s.label({ id: 'lat-miss', at: l.card, html: row('miss', '#b45309', 6.5, '214 ms'), size: 13, anchor: 'top', variant: 'plain' });
  s.label({ id: 'lat-hit', at: [l.card[0], l.card[1], l.card[2] - 24], html: row('hit', '#0f766e', 0.6, '9 ms'), size: 13, anchor: 'top', variant: 'plain' });

  s.dropIn('server-g', 0.1);
  l.edges.forEach((_, i) => s.dropIn(`${codes[i]}-g`, 0.3 + i * 0.083));
  s.dropIn('client-g', 0.7);
  s.intro('req', 'opacity', 0.7, 0.35, 0, 1, ease.linear);
  s.intro('get', 'opacity', 1.0, 0.3, 0, 1, ease.out);
  s.intro('get', 'translate', 1.0, 0.4, '0 8px', '0 0', ease.out);

  const flash = (id: string, t: number) => s.at(id, 'opacity', t, 0.1, 0, 1, ease.linear).at(id, 'opacity', t + 0.1, 0.6, 1, 0, ease.linear);
  const nudge = (id: string, t: number, px: number) => s.at(id, 'translate', t, 0.3, '0 0', `0 ${-px}px`, pull).at(id, 'translate', t + 0.3, 0.74, `0 ${-px}px`, '0 0', settle);
  const go = (pulse: string, wire: string, t: number) => {
    const dur = Math.max(0.3, s.wireLength(wire) / 270);
    s.travel(pulse, t, dur);
    return t + dur;
  };

  const a1 = go('p-req-miss', 'req', 0.3);
  flash('edge-miss', a1);
  nudge(`${codes[near]}-g`, a1, 5);
  const a2 = go('p-up', `feed-${codes[near]}`, a1 + 0.15);
  flash('server-glow', a2);
  nudge('server-g', a2, 6);
  const a3 = go('p-down', 'fill', a2 + 0.2);
  s.at('warm', 'opacity', a3, 0.4, 0, 1, ease.linear);
  const a4 = go('p-res-miss', 'res', a3 + 0.1);
  flash('client-glow', a4);
  s.at('lat-miss', 'opacity', a4, 0.25, 0, 1, ease.out);
  s.at('lat-miss', 'translate', a4, 0.4, '-8px 0', '0 0', ease.out);

  const b0 = a4 + 0.9;
  const b1 = go('p-req-hit', 'req', b0);
  flash('edge-hit', b1);
  nudge(`${codes[near]}-g`, b1, 5);
  const b2 = go('p-res-hit', 'res', b1 + 0.05);
  flash('client-glow', b2);
  s.at('lat-hit', 'opacity', b2, 0.25, 0, 1, ease.out);
  s.at('lat-hit', 'translate', b2, 0.4, '-8px 0', '0 0', ease.out);

  const out = b2 + 1.5;
  s.at('lat-miss', 'opacity', out, 0.35, 1, 0, ease.linear);
  s.at('lat-hit', 'opacity', out + 0.05, 0.35, 1, 0, ease.linear);
  s.at('warm', 'opacity', out + 0.1, 0.5, 1, 0, ease.linear);
  s.loop(Math.round((out + 0.95) * 10) / 10, b2 + 0.8);
  return s;
}

export const example: Example = {
  slug: 'edge-cache',
  title: 'Edge cache hit',
  ask: 'Show a cache miss, then a fast edge hit.',
  story: 'The first request misses the nearest edge and fetches from the origin; the next one is answered by the warmed edge in a fraction of the time.',
  prompt: 'Draw a request hitting the nearest edge region: first a cache miss that goes to the origin and back, then a cache hit answered right at the edge, with both latencies.',
  level: 'complex',
  intent: 'change',
  layout: 'diagonal',
  useCase: 'Edge',
  surface: 'light',
  interaction: 'watch',
  art: art(build(compact()), build(wide()), 760),
};

export default page(example);
