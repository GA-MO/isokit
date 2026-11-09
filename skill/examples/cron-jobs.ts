import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, nightFloor, page, paints, ramps, surfaces, type Example, type Ramp } from './shared';

const ui = surfaces.night;
const cyan: Ramp = ['#083344', '#0e7490', '#22d3ee', '#cffafe'];
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const anticipateExit = 'linear(0, -0.007 11.8%, -0.045 37.8%, -0.048 57%, -0.028 63.2%, 0.018 69.3%, 0.079 74.3%, 0.164 79.3%, 0.27 84%, 0.392 88.3%, 0.459 90.3%, 0.535 92.3%, 0.609 94%, 0.694 95.8%, 0.777 97.3%, 0.859 98.5%, 0.942 99.5%, 1)';

const ticks = 12;
const step = 0.7;
const loop = ticks * step + 0.7;
const tickAt = (j: number) => 0.2 + j * step;
const runs = [
  { tick: 0, time: '12:00' },
  { tick: 4, time: '12:20' },
  { tick: 8, time: '12:40' },
] as const;
const schedule = '*/20 * * * *';
const runFor = 0.6;
const clear = 8.15;
const reset = loop - 0.35;

type Layout = { name: string; width: number; height: number; origin: Vec2; k: number; minPx: number };

function build({ name, width, height, origin, k, minPx }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const clock: Vec3 = [-160 * k, 0, 0];
  const plate = 196 * k;
  const ring = 72 * k;
  const tile = 58 * k;
  const tileH = 18 * k;
  const wz = -8 * k;
  const tileAt = (i: number): Vec3 => [(26 + i * 84) * k, 0, 0];
  const dial = (j: number): Vec3 => {
    const a = (j / ticks) * 2 * Math.PI;
    return [clock[0] + ((Math.sin(a) - Math.cos(a)) / Math.SQRT2) * ring, clock[1] - ((Math.sin(a) + Math.cos(a)) / Math.SQRT2) * ring, 0];
  };
  const major = (j: number) => runs.some(r => r.tick === j);
  const floor: Vec3 = [-40 * k, 0, -tileH];

  const pitch = 18 * k;
  const span = 560 * k;
  nightFloor(s, floor, span, pitch);
  const halo = s.def('halo-fill', '<radialGradient id="$ID"><stop offset=".35" stop-color="#22d3ee" stop-opacity=".45"/><stop offset=".6" stop-color="#22d3ee" stop-opacity=".16"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient>');
  s.face({ id: 'halo', at: [clock[0], clock[1], -tileH], size: [plate * 1.6, plate * 1.6], radius: plate * 0.8, fill: halo });

  runs.forEach((_, i) => {
    s.wire({ id: `w-${i}`, points: [[clock[0] + plate / 2, 0, wz], [tileAt(i)[0] - tile / 2, 0, wz]], stroke: 'rgb(34 211 238 / .4)', width: 1.25 });
    s.pulse({ id: `p-${i}`, wire: `w-${i}`, color: cyan[2], length: 0.22 });
  });

  s.group('clock', () => {
    s.slab({ id: 'plate', at: clock, size: [plate, plate], height: 16 * k, radius: plate / 2, top: ui.top, side: paints.brushed(s, cyan), grain: 0.06, edge: 'rgb(103 232 249 / .45)' });
    Array.from({ length: ticks }, (_, j) => {
      const d = (major(j) ? 16 : 9) * k;
      s.face({ id: `tick-${j}`, at: dial(j), size: [d, d], radius: d / 2, ...(major(j) ? { fill: 'rgb(34 211 238 / .16)', stroke: 'rgb(34 211 238 / .5)' } : { fill: 'rgb(199 210 254 / .16)' }) });
      s.face({ id: `lit-${j}`, at: dial(j), size: [d, d], radius: d / 2, fill: cyan[2] });
    });
    s.slab({ id: 'hub', at: [clock[0], clock[1], 8 * k], size: [34 * k, 34 * k], height: 8 * k, radius: 17 * k, top: '#1f3a66', side: paints.gradient(s, cyan), edge: 'rgb(207 250 254 / .5)', shadow: false });
  });

  runs.forEach((r, i) => {
    const at = tileAt(i);
    s.group(`job-${i}`, () => {
      s.slab({ id: `job-${i}-run`, at, size: [tile, tile], height: tileH, radius: 12 * k, top: ui.top, side: paints.stripes(s, cyan, 3), grain: 0.06, edge: ui.edge });
      s.slab({ id: `job-${i}-rest`, at, size: [tile, tile], height: tileH, radius: 12 * k, top: ui.top, side: paints.brushed(s, ramps.steel), grain: 0.06, edge: ui.edge, shadow: false });
      s.face({ id: `job-${i}-hit`, at, size: [tile, tile], radius: 12 * k, fill: 'rgb(34 211 238 / .1)', stroke: cyan[2], strokeWidth: 1.5 });
      s.text({ id: `job-${i}-time`, at, text: r.time, size: width > 520 ? 14 : 11, color: ui.ink, on: 'top', anchor: 'middle' });
    });
    s.pivot(`job-${i}`, [at[0], at[1], -tileH]);
  });

  const [cx, cy] = s.project(clock);
  s.label({ id: 'cron', at: { screen: [fitX(cx, schedule, width, minPx), cy - 0.29 * plate - 16] }, text: schedule, size: 13, anchor: 'bottom' });

  s.dropIn('clock', 0.1);
  s.intro('cron', 'opacity', 0.45, 0.3, 0, 1, ease.out);
  s.intro('cron', 'translate', 0.45, 0.4, '0 8px', '0 0', ease.out);
  s.introUntil(0.7);

  s.loop(loop, 7.9);
  Array.from({ length: ticks }, (_, j) => {
    const t = tickAt(j);
    s.at(`lit-${j}`, 'opacity', t, 0.12, 0, 1, ease.linear);
    if (t + 0.62 <= reset) {
      s.at(`lit-${j}`, 'opacity', t + 0.12, 0.5, 1, 0.4, ease.linear);
      s.at(`lit-${j}`, 'opacity', reset, 0.25, 0.4, 0, ease.linear);
    } else s.at(`lit-${j}`, 'opacity', reset, 0.25, 1, 0, ease.linear);
  });

  runs.forEach((r, i) => {
    const pop = tickAt(r.tick) + 0.1;
    const wired = pop + 0.47 + 0.3;
    const dur = Math.max(0.3, s.wireLength(`w-${i}`) / 270);
    const arrive = wired + dur;
    s.at(`job-${i}`, 'opacity', pop, 0.05, 0, 1, ease.linear);
    s.at(`job-${i}`, 'scale', pop, 0.23, 0.05, 1.14, ease.out);
    s.at(`job-${i}`, 'scale', pop + 0.23, 0.24, 1.14, 1, ease.io);
    s.at('hub', 'translate', wired, 0.14, '0 0', '0 2px', ease.out);
    s.at('hub', 'translate', wired + 0.14, 0.74, '0 2px', '0 0', settle);
    s.travel(`p-${i}`, wired, dur);
    s.at(`job-${i}-hit`, 'opacity', arrive, 0.1, 0, 1, ease.linear);
    s.at(`job-${i}-hit`, 'opacity', arrive + 0.1, 0.6, 1, 0, ease.linear);
    s.at(`job-${i}-rest`, 'opacity', arrive, 0.12, 1, 0, ease.linear);
    s.at(`job-${i}-rest`, 'opacity', arrive + runFor, 0.5, 0, 1, ease.linear);

    const out = clear + (runs.length - 1 - i) * 0.06;
    s.at(`job-${i}`, 'scale', out, 0.745, 1, 0, anticipateExit);
    s.at(`job-${i}`, 'opacity', out + 0.6, 0.145, 1, 0, ease.linear);
  });
  return s;
}

export const example: Example = {
  slug: 'cron-jobs',
  title: 'Scheduled jobs',
  ask: 'Show scheduled jobs firing every twenty minutes.',
  story: 'A dial lights minute by minute, and every twenty minutes a job tile pops in, the dial wires to it and a pulse sets it running before it comes to rest.',
  prompt: 'Draw a cron schedule as a dial whose ticks light up in turn; at each scheduled tick a new job tile pops in, a wire grows to it from the dial and a pulse sets it running before it rests.',
  level: 'simple',
  intent: 'scale',
  layout: 'radial',
  useCase: 'Jobs',
  surface: 'night',
  interaction: 'watch',
  art: art(
    build({ name: 'cron-sm', width: 390, height: 360, origin: [207, 196], k: 0.95, minPx: narrowest }),
    build({ name: 'cron-lg', width: 720, height: 400, origin: [414, 246], k: 1.2, minPx: 521 }),
    520,
  ),
};

export default page(example);
