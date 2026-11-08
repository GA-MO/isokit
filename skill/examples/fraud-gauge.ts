import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, nightFloor, type Example } from './shared';

const ui = surfaces.night;
const rose = ramps.rose;
const signal = '#a5b4fc';
const points = '#f0abfc';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const popIn = 'linear(0, 0.007 1.5%, 0.033 3.3%, 0.078 5%, 0.14 6.8%, 0.216 8.5%, 0.305 10.3%, 0.709 17.3%, 0.863 20.3%, 0.936 22%, 0.987 23.5%, 1.03 25.3%, 1.052 26.8%, 1.06 28.2%, 1.06 38.3%, 1.015 67.5%, 1)';

const signals = [
  { id: 'device', points: 18, height: 14 },
  { id: 'location', points: 31, height: 24 },
  { id: 'velocity', points: 34, height: 27 },
] as const;
const gap = 24;
const threshold = 70;
const total = signals.reduce((sum, x) => sum + x.points, 0);

const loopLength = 9;
const firstLift = 1.0;
const liftGap = 1.0;
const crossAt = firstLift + 2 * liftGap + 0.55;
const resetAt = 7.4;

type Layout = { name: string; width: number; height: number; origin: readonly [number, number]; k: number; wide: boolean };

function build({ name, width, height, origin, k, wide }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const minPx = wide ? 521 : narrowest;
  const base = { size: 130 * k, height: 18 * k };
  const col = 110 * k;
  const pay = { at: (wide ? [-250 * k, 0, 0] : [180 * k, 0, 0]) as Vec3, size: 76 * k, height: 16 * k };
  const dir = wide ? -1 : 1;
  const wz = -8 * k;
  const near: Vec3 = [dir * base.size / 2, 0, wz];
  const far: Vec3 = [pay.at[0] - dir * pay.size / 2, 0, wz];

  const floorAt: Vec3 = [pay.at[0] * 0.4, 0, -base.height];
  const pitch = 18 * k;
  const span = 640 * k;
  nightFloor(s, floorAt, span, pitch);
  const glow = (id: string, color: string, strength: number) => s.def(id, `<radialGradient id="$ID"><stop offset=".3" stop-color="${color}" stop-opacity="${strength}"/><stop offset=".55" stop-color="${color}" stop-opacity="${strength / 2.5}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`);
  const haloSize = base.size * 2;
  s.face({ id: 'halo', at: [0, 0, -base.height], size: [haloSize, haloSize], radius: haloSize / 2, fill: glow('halo-cool', '#818cf8', 0.3) });
  s.face({ id: 'halo-hot', at: [0, 0, -base.height], size: [haloSize, haloSize], radius: haloSize / 2, fill: glow('halo-rose', '#f43f5e', 0.7) });

  s.wire({ id: 'w-in', points: [far, near], stroke: ui.wire, width: 1.25 });
  s.pulse({ id: 'p-in', wire: 'w-in', color: signal, length: 0.2 });
  s.wire({ id: 'w-out', points: [near, far], stroke: 'rgb(255 255 255 / 0)', width: 1.25 });
  s.pulse({ id: 'p-out', wire: 'w-out', color: rose[2], length: 0.2 });

  const layers = signals.reduce<{ id: string; points: number; z0: number; z1: number }[]>((acc, x) => {
    const z0 = (acc.length ? acc[acc.length - 1]!.z1 : 0) + gap * k;
    return [...acc, { id: x.id, points: x.points, z0, z1: z0 + x.height * k }];
  }, []);
  const top = layers[layers.length - 1]!.z1;
  const ringZ = (top * threshold) / total;
  const ring = col + 14 * k;
  const corner = (cx: number, cy: number) => s.project([(cx * ring) / 2, (cy * ring) / 2, ringZ]);
  const path = (pts: readonly (readonly [number, number])[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');
  const back = path([corner(-1, 1), corner(-1, -1), corner(1, -1)]);
  const front = path([corner(-1, 1), corner(1, 1), corner(1, -1)]);
  const dash = (d: string, color: string) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.25" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"/>`;

  s.slab({ id: 'base', at: [0, 0, 0], size: [base.size, base.size], height: base.height, radius: 20 * k, top: ui.top, side: paints.brushed(s, ramps.steel), grain: 0.06, edge: ui.edge });
  s.face({ id: 'base-glow', at: [0, 0, 0], size: [base.size, base.size], radius: 20 * k, fill: 'rgb(165 180 252 / .16)', stroke: signal, strokeWidth: 1.25 });
  s.text({ id: 'base-name', at: [-base.size / 2 + 16 * k, base.size / 2 - 16 * k, 0], text: 'risk', size: 11, color: ui.muted, on: 'top' });

  s.svg('ring-back', dash(back, 'rgb(199 210 254 / .35)'));
  s.svg('ring-back-hot', dash(back, rose[2]));

  layers.forEach((l, i) => {
    const at: Vec3 = [0, 0, l.z1];
    s.group(`layer-${i}`, () => {
      s.slab({ id: l.id, at, size: [col, col], height: l.z1 - l.z0, radius: 16 * k, top: ui.top, side: paints.glass(s, '#a21caf', 0.72), grain: 0.06, edge: 'rgb(245 208 254 / .45)', shadow: false });
      s.slab({ id: `${l.id}-hot`, at, size: [col, col], height: l.z1 - l.z0, radius: 16 * k, top: ui.top, side: paints.gradient(s, rose), grain: 0.06, edge: 'rgb(254 205 211 / .3)', shadow: false });
    });
  });

  s.svg('ring-front', dash(front, 'rgb(199 210 254 / .35)'));
  s.svg('ring-front-hot', dash(front, rose[2]));

  s.slab({ id: 'pay', at: pay.at, size: [pay.size, pay.size], height: pay.height, radius: 14 * k, top: ui.top, side: paints.brushed(s, ramps.steel), grain: 0.06, edge: ui.edge });
  s.slab({ id: 'pay-hot', at: pay.at, size: [pay.size, pay.size], height: pay.height, radius: 14 * k, top: ui.top, side: paints.gradient(s, rose), grain: 0.06, edge: 'rgb(254 205 211 / .3)' });
  s.face({ id: 'pay-glow', at: pay.at, size: [pay.size, pay.size], radius: 14 * k, fill: 'rgb(165 180 252 / .16)', stroke: signal, strokeWidth: 1.25 });
  s.text({ id: 'pay-name', at: [pay.at[0], pay.at[1], 0], text: '$1,240', size: 11, color: ui.ink, on: 'top', anchor: 'middle' });

  layers.forEach(l => {
    const [x, y] = wide ? s.project([ring / 2, -ring / 2, (l.z0 + l.z1) / 2]) : s.project([-ring / 2, ring / 2, (l.z0 + l.z1) / 2]);
    const text = `${l.id} +${l.points}`;
    const html = `${l.id} <span style="color:${points}">+${l.points}</span>`;
    s.label({ id: `${l.id}-tag`, at: { screen: wide ? [fitX(x + 14, text, width, minPx, 'left'), y] : [fitX(x - 12, text, width, minPx, 'right'), y] }, html, size: 13, anchor: wide ? 'left' : 'right' });
  });

  const [sx, sy] = s.project([0, 0, top]);
  const scoreY = sy - col * 0.41 - 22 * k;
  const sums = layers.map((_, i) => signals.slice(0, i + 1).reduce((sum, x) => sum + x.points, 0));
  sums.forEach((v, i) => {
    const over = v >= threshold;
    const text = `risk ${v} · hold at ${threshold}`;
    s.label({ id: `score-${i}`, at: { screen: [fitX(sx, text, width, minPx), scoreY] }, html: `risk <span style="color:${over ? rose[2] : ui.ink}">${v}</span><span style="color:${ui.muted}"> · hold at ${threshold}</span>`, size: 13, anchor: 'bottom' });
  });

  const [px, py] = s.project([pay.at[0], pay.at[1], 0]);
  const held = 'payment held';
  const heldY = wide ? py - pay.size * 0.41 - 16 * k : py + pay.size * 0.41 + pay.height + 2 * k;
  s.label({ id: 'held', at: { screen: [fitX(px, held, width, minPx), heldY] }, html: `<span style="color:${rose[2]}">●</span> payment held`, size: 13, anchor: wide ? 'bottom' : 'top' });

  s.dropIn('base', 0.1);
  s.dropIn('pay', 0.2);
  s.intro('base-name', 'opacity', 0.4, 0.3, 0, 1, ease.out);
  s.intro('pay-name', 'opacity', 0.5, 0.3, 0, 1, ease.out);
  s.introUntil(0.8);

  s.loop(loopLength, 5.6);
  const inStart = 0.2;
  const inDur = Math.max(0.3, s.wireLength('w-in') / 270);
  s.at('pay-glow', 'opacity', inStart - 0.1, 0.1, 0, 1, ease.linear);
  s.at('pay-glow', 'opacity', inStart, 0.6, 1, 0, ease.linear);
  s.travel('p-in', inStart, inDur);
  const arrive = inStart + inDur;
  s.at('base-glow', 'opacity', arrive, 0.1, 0, 1, ease.linear);
  s.at('base-glow', 'opacity', arrive + 0.1, 0.6, 1, 0, ease.linear);

  layers.forEach((l, i) => {
    const g = `layer-${i}`;
    const t = firstLift + i * liftGap;
    s.at(g, 'opacity', t, 0.2, 0, 1, ease.linear);
    s.at(g, 'translate', t, 0.95, `0 ${l.z1}px`, '0 0', settle);
    s.at(`${l.id}-tag`, 'opacity', t + 0.5, 0.25, 0, 1, ease.out);
    s.at(`${l.id}-tag`, 'translate', t + 0.5, 0.4, wide ? '-8px 0' : '8px 0', '0 0', ease.out);
    s.at(`score-${i}`, 'opacity', t + 0.62, 0.2, 0, 1, ease.linear);
    if (i < layers.length - 1) s.at(`score-${i}`, 'opacity', t + liftGap + 0.45, 0.15, 1, 0, ease.linear);
    s.at(`${l.id}-hot`, 'opacity', crossAt + 0.15 + i * 0.06, 0.4, 0, 1, ease.linear);
    s.at(`${l.id}-tag`, 'opacity', resetAt, 0.3, 1, 0, ease.linear);
    const f = resetAt + 0.2 + (layers.length - 1 - i) * 0.08;
    s.at(g, 'translate', f, 0.6, '0 0', `0 ${l.z1}px`, ease.in);
    s.at(g, 'opacity', f + 0.4, 0.2, 1, 0, ease.linear);
    s.set(`${l.id}-hot`, 'opacity', loopLength - 0.1, 0);
  });
  s.at('score-2', 'opacity', resetAt, 0.3, 1, 0, ease.linear);

  for (const id of ['ring-back-hot', 'ring-front-hot', 'halo-hot']) {
    s.at(id, 'opacity', crossAt, 0.1, 0, 1, ease.linear);
    s.at(id, 'opacity', resetAt + 0.3, 0.6, 1, 0, ease.linear);
  }

  const outStart = crossAt + 0.5;
  s.travel('p-out', outStart, inDur);
  const hold = outStart + inDur;
  s.at('pay', 'translate', hold, 0.3, '0 0', '0 -6px', 'cubic-bezier(.41,.27,.05,.79)');
  s.at('pay', 'translate', hold + 0.3, 0.74, '0 -6px', '0 0', settle);
  s.at('pay-hot', 'translate', hold, 0.3, '0 0', '0 -6px', 'cubic-bezier(.41,.27,.05,.79)');
  s.at('pay-hot', 'translate', hold + 0.3, 0.74, '0 -6px', '0 0', settle);
  s.at('pay-hot', 'opacity', hold, 0.3, 0, 1, ease.linear);
  s.at('pay-hot', 'opacity', resetAt + 0.3, 0.6, 1, 0, ease.linear);
  s.at('held', 'opacity', hold + 0.1, 0.06, 0, 1, ease.linear);
  s.at('held', 'scale', hold + 0.1, 0.6, 0, 1, popIn);
  s.at('held', 'opacity', resetAt, 0.3, 1, 0, ease.linear);
  return s;
}

export const example: Example = {
  slug: 'fraud-gauge',
  title: 'Fraud risk gauge',
  ask: 'Show risk signals adding up until a payment is held.',
  story: 'A payment comes in, device, location and velocity signals lift onto a gauge stack one by one, their score adds up past the hold line, and the payment is held for review.',
  prompt: 'Draw a fraud check as a layered gauge: device, location and velocity risk signals lift onto a stack and add up to a score that crosses a threshold, then the payment is held.',
  level: 'simple',
  intent: 'inside',
  layout: 'exploded',
  useCase: 'Risk',
  surface: 'night',
  interaction: 'watch',
  art: art(
    build({ name: 'fraud-sm', width: 390, height: 430, origin: [226, 262], k: 0.85, wide: false }),
    build({ name: 'fraud-lg', width: 720, height: 400, origin: [400, 262], k: 1, wide: true }),
    520,
  ),
};

export default page(example);
