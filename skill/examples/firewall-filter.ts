import { Scene, ease, type Vec3 } from '../lib/iso.ts';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared.ts';

const ui = surfaces.light;
const accent = '#0369a1';
const deny = '#e11d48';
const line = 'rgb(22 23 27 / .3)';
const shift = 'cubic-bezier(.49,.19,.28,.81)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const constantPull = 'cubic-bezier(.33,0,.67,.33)';

type Packet = { id: string; start: number; ok: boolean };
const packets: readonly Packet[] = [
  { id: 'p0', start: 0.3, ok: true },
  { id: 'p1', start: 2.0, ok: true },
  { id: 'p2', start: 2.55, ok: false },
  { id: 'p3', start: 5.2, ok: true },
];
const passDur = 1.5;
const hitDur = 0.8;

function build(name: string, width: number, height: number, origin: readonly [number, number], k: number, wide: boolean) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const floor = -18 * k;
  const src: Vec3 = [0, 236 * k, 0];
  const srcSize = 92 * k;
  const api: Vec3 = [0, -236 * k, 8 * k];
  const apiSize = 108 * k;
  const wallH = 66 * k;
  const wallT = 20 * k;
  const gap = 30 * k;
  const segLen = 92 * k;
  const pkt = 28 * k;
  const pktH = 18 * k;
  const laneZ = floor + 4 * k + pktH;
  const startX = src[1] - srcSize / 2 + pkt / 2;
  const endX = api[1] + apiSize / 2 + pkt / 2;
  const hitX = wallT / 2 + pkt / 2 + 3 * k;
  const backX = src[1] - srcSize / 2 - 34 * k;
  const at = (y: number): Vec3 => [0, y, laneZ];
  const lineArt = (id: string, p: Vec3, size: readonly [number, number], h: number) =>
    s.slab({ id, at: p, size, height: h, radius: Math.min(size[0], size[1]) * 0.18, top: ui.top, side: paints.flat('#f4f4f2'), outline: line, shade: false, shadow: true, edge: line });

  s.wire({ id: 'lane', points: [[0, src[1] - srcSize / 2, floor + 2 * k], [0, api[1] + apiSize / 2, floor + 2 * k]], stroke: ui.wire, width: 1.25, dash: '3 4', joins: ['src', 'api'] });

  s.group('src-g', () => {
    lineArt('src', src, [srcSize, srcSize], 18 * k);
    s.face({ id: 'src-glow', at: src, size: [srcSize, srcSize], radius: srcSize * 0.18, fill: 'rgb(225 29 72 / .12)' });
    s.text({ id: 'src-name', at: [src[0] + srcSize / 2 - 13 * k, src[1], 0], text: 'internet', size: wide ? 12 : 10, color: ui.muted, on: 'top', along: 'y', anchor: 'middle' });
  });

  const wallZ = floor + wallH;
  const segment = (id: string, x: number) =>
    s.slab({ id, at: [x, 0, wallZ], size: [segLen, wallT], height: wallH, radius: 5 * k, top: ui.top, side: paints.stripes(s, ramps.silver, 3), outline: line, shade: false, edge: line });
  segment('wall-back', -(gap / 2 + segLen / 2));

  [...packets].reverse().forEach(p =>
    s.group(p.id, () => {
      s.slab({ id: `${p.id}-box`, at: at(startX), size: [pkt, pkt], height: pktH, radius: 5 * k, top: p.ok ? '#e0f2fe' : '#ffe4e6', side: paints.gradient(s, p.ok ? ramps.sky : ramps.rose), outline: p.ok ? 'rgb(3 105 161 / .45)' : 'rgb(190 18 60 / .45)', shade: false, edge: 'rgb(255 255 255 / .8)', shadow: false });
    }),
  );

  const gateAt: Vec3 = [0, 0, floor + wallH / 2];
  const gate = (id: string, fill: string, stroke: string) =>
    s.svg(id, `<g transform="${s.planeTransform(gateAt, 'left')}"><rect x="${-gap / 2}" y="${-wallH / 2 + 2 * k}" width="${gap}" height="${wallH - 4 * k}" rx="${3 * k}" fill="${fill}" stroke="${stroke}" vector-effect="non-scaling-stroke"/></g>`);
  gate('gate', 'rgb(14 165 233 / .06)', 'rgb(2 132 199 / .3)');
  gate('gate-ok', 'rgb(14 165 233 / .28)', 'rgb(2 132 199 / .7)');
  gate('gate-no', 'rgb(244 63 94 / .32)', 'rgb(225 29 72 / .8)');
  segment('wall-front', gap / 2 + segLen / 2);
  s.text({ id: 'wall-name', at: [gap / 2 + segLen / 2, 0, wallZ], text: 'firewall', size: wide ? 11 : 10, color: ui.muted, on: 'top', anchor: 'middle' });

  s.group('api-g', () => {
    lineArt('api', api, [apiSize, apiSize], 26 * k);
    s.face({ id: 'api-glow', at: api, size: [apiSize, apiSize], radius: apiSize * 0.18, fill: 'rgb(14 165 233 / .18)' });
    s.text({ id: 'api-name', at: [api[0] + apiSize / 2 - 14 * k, api[1], api[2]], text: 'api', size: wide ? 12 : 10, color: ui.muted, on: 'top', along: 'y', anchor: 'middle' });
  });

  const wallTop = s.project([0, 0, wallZ]);
  const tag = 'deny :23';
  s.label({ id: 'deny', at: { screen: [fitX(wallTop[0], tag, width, wide ? 521 : narrowest), wallTop[1] - 34 * k] }, html: `<span style="color:${deny}">●</span> deny :23`, size: 13, anchor: 'bottom' });
  const apiTop = s.project([api[0], api[1], api[2]]);
  const allow = 'allow :443';
  s.label({ id: 'allow', at: { screen: [fitX(apiTop[0], allow, width, wide ? 521 : narrowest), apiTop[1] - apiSize * 0.42 - 16 * k] }, html: `<span style="color:${accent}">●</span> allow :443`, size: 13, anchor: 'bottom' });

  s.dropIn('src-g', 0.1);
  s.dropIn('wall-back', 0.18);
  s.dropIn('wall-front', 0.26);
  s.dropIn('api-g', 0.34);
  s.intro('gate', 'opacity', 0.6, 0.3, 0, 1, ease.linear);
  s.intro('wall-name', 'opacity', 0.6, 0.3, 0, 1, ease.linear);
  s.intro('allow', 'opacity', 0.7, 0.3, 0, 1, ease.out);
  s.intro('allow', 'translate', 0.7, 0.4, '0 8px', '0 0', ease.out);

  s.loop(8, 3.4);
  const flash = (id: string, t: number, hold = 0) => {
    s.at(id, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at(id, 'opacity', t + 0.1 + hold, 0.6, 1, 0, ease.linear);
  };
  packets.forEach(p => {
    s.at(p.id, 'opacity', p.start, 0.15, 0, 1, ease.linear);
    if (p.ok) {
      s.at(p.id, 'translate', p.start, passDur, '0 0', s.offset(at(startX), at(endX)), shift);
      flash('gate-ok', p.start + passDur * 0.52);
      s.at(p.id, 'opacity', p.start + passDur - 0.1, 0.25, 1, 0, ease.linear);
      s.set(p.id, 'translate', p.start + passDur + 0.2, '0 0');
      flash('api-glow', p.start + passDur - 0.05);
      s.tug('api-g', p.start + passDur - 0.05, `${(-4 * k).toFixed(1)}px ${(2.3 * k).toFixed(1)}px`);
      return;
    }
    const hit = p.start + hitDur;
    s.at(p.id, 'translate', p.start, hitDur, '0 0', s.offset(at(startX), at(hitX)), constantPull);
    s.at(p.id, 'translate', hit, 1.0, s.offset(at(startX), at(hitX)), s.offset(at(startX), at(backX)), settle);
    s.at(`${p.id}-box`, 'scale', hit - 0.02, 0.1, 1, '0.86 1.08', ease.out);
    s.at(`${p.id}-box`, 'scale', hit + 0.08, 0.3, '0.86 1.08', 1, ease.settle);
    flash('gate-no', hit - 0.02, 0.5);
    s.tug('wall-front', hit - 0.02, '2px -1px');
    s.at('deny', 'opacity', hit, 0.25, 0, 1, ease.out);
    s.at('deny', 'translate', hit, 0.4, '0 8px', '0 0', ease.out);
    s.at('deny', 'opacity', 5.0, 0.35, 1, 0, ease.linear);
    s.at(p.id, 'opacity', hit + 0.6, 0.4, 1, 0, ease.linear);
    s.set(p.id, 'translate', hit + 1.1, '0 0');
    flash('src-glow', hit + 0.75);
  });
  return s;
}

export const example: Example = {
  slug: 'firewall-filter',
  title: 'Firewall filter',
  ask: 'Show a firewall passing good packets and bouncing bad ones.',
  story: 'Packets run toward a wall; the allowed ones pass through its gate to the service, a denied one hits the gate and bounces back.',
  prompt: 'Draw packets travelling toward a firewall: allowed packets pass through its gate to an api, one red packet hits the gate and bounces back the way it came.',
  level: 'medium',
  intent: 'choose',
  layout: 'diagonal',
  useCase: 'Network',
  surface: 'light',
  interaction: 'watch',
  art: art(build('firewall-sm', 390, 420, [196, 226], 0.7, false), build('firewall-lg', 720, 400, [360, 196], 0.98, true), 520),
};

export default page(example);
