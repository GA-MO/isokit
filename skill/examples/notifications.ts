import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, page, ramps, surfaces, type Example, paints } from './shared';

const ui = surfaces.light;
const accent = '#7c3aed';
const settle = 'cubic-bezier(.39,.08,.04,.91)';

const channels = [
  { id: 'email', y: -120, ms: '120 ms' },
  { id: 'push', y: 0, ms: '41 ms' },
  { id: 'sms', y: 120, ms: '380 ms' },
] as const;

function build(name: string, width: number, height: number, origin: readonly [number, number], k: number, latency: boolean) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const core: Vec3 = [-130 * k, 0, 0];
  const coreSize = 120 * k;
  const chSize = 84 * k;
  const chX = 110 * k;
  const z = -14 * k;

  channels.forEach(c => {
    const y = c.y * k;
    const points: Vec3[] = y === 0 ? [[core[0] + coreSize / 2, 0, z], [chX - chSize / 2, 0, z]] : [[core[0] + coreSize / 2, 0, z], [-10 * k, 0, z], [-10 * k, y, z], [chX - chSize / 2, y, z]];
    s.wire({ id: `w-${c.id}`, points, stroke: ui.wire, width: 1.25 });
    s.pulse({ id: `p-${c.id}`, wire: `w-${c.id}`, color: accent, length: 0.14 });
  });

  s.slab({ id: 'core', at: core, size: [coreSize, coreSize], height: 28 * k, radius: 18 * k, top: ui.top, side: paints.gradient(s, ramps.violet), grain: 0.06, edge: ui.edge });
  s.face({ id: 'core-glow', at: core, size: [coreSize, coreSize], radius: 18 * k, fill: 'rgb(139 92 246 / .2)' });
  s.text({ id: 'core-name', at: [core[0], core[1], 0], text: 'event', size: 12, color: '#5b21b6', on: 'top', anchor: 'middle' });
  s.label({ id: 'event', at: [core[0], core[1], 74 * k], text: 'order.shipped', size: 13 });

  channels.forEach(c => {
    const at: Vec3 = [chX, c.y * k, 0];
    s.slab({ id: c.id, at, size: [chSize, chSize], height: 20 * k, radius: 14 * k, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.06, edge: ui.edge });
    s.face({ id: `${c.id}-hit`, at, size: [chSize, chSize], radius: 14 * k, fill: 'rgb(139 92 246 / .18)' });
    s.text({ id: `${c.id}-name`, at, text: c.id, size: 11, color: '#3f3f46', on: 'top', anchor: 'middle' });
    if (latency) {
      const [x, y] = s.project([chX + chSize / 2 + 18, c.y * k - 18, 0]);
      const text = `${c.id} · ${c.ms}`;
      s.label({ id: `${c.id}-ms`, at: { screen: [fitX(x, text, width, 521, 'left'), y] }, text, size: 13, anchor: 'left' });
    }
  });

  s.dropIn('core', 0.1);
  channels.forEach((c, i) => s.dropIn(c.id, 0.3 + i * 0.083));
  s.intro('event', 'opacity', 0.6, 0.3, 0, 1, ease.out);
  s.intro('event', 'translate', 0.6, 0.4, '0 8px', '0 0', ease.out);

  s.loop(6, 2.2);
  s.at('core', 'translate', 0.2, 0.14, '0 0', '0 4px', ease.out);
  s.at('core', 'translate', 0.34, 0.74, '0 4px', '0 0', settle);
  s.at('core-glow', 'opacity', 0.2, 0.1, 0, 1, ease.linear);
  s.at('core-glow', 'opacity', 0.3, 0.6, 1, 0, ease.linear);
  channels.forEach((c, i) => {
    const start = 0.42 + i * 0.08;
    const dur = Math.max(0.3, s.wireLength(`w-${c.id}`) / 270);
    const arrive = start + dur;
    s.travel(`p-${c.id}`, start, dur);
    s.at(`${c.id}-hit`, 'opacity', arrive, 0.1, 0, 1, ease.linear);
    s.at(`${c.id}-hit`, 'opacity', arrive + 0.1, 0.6, 1, 0, ease.linear);
    s.at(c.id, 'translate', arrive, 0.3, '0 0', '0 -6px', 'cubic-bezier(.41,.27,.05,.79)');
    s.at(c.id, 'translate', arrive + 0.3, 0.74, '0 -6px', '0 0', settle);
    if (latency) {
      s.at(`${c.id}-ms`, 'opacity', arrive + 0.05, 0.25, 0, 1, ease.out);
      s.at(`${c.id}-ms`, 'translate', arrive + 0.05, 0.4, '-8px 0', '0 0', ease.out);
      s.at(`${c.id}-ms`, 'opacity', 5.2 + i * 0.08, 0.35, 1, 0, ease.linear);
    }
  });
  return s;
}

export const example: Example = {
  slug: 'notifications',
  title: 'Fan-out notifications',
  ask: 'Show one event fanning out to email, push and SMS.',
  story: 'One event leaves the core and lands on email, push and SMS at once.',
  prompt: 'Draw one event fanning out to email, push and SMS, each channel lighting up as it receives it.',
  level: 'simple',
  intent: 'flow',
  layout: 'radial',
  useCase: 'Messaging',
  surface: 'light',
  interaction: 'watch',
  art: art(build('notify-sm', 390, 380, [205, 190], 0.82, false), build('notify-lg', 720, 400, [330, 196], 1, true), 520),
};

export default page(example);
