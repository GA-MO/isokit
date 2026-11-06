import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fonts, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.dark;
const accent = '#2dd4bf';
const glow = 'rgb(45 212 191 / .26)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const spread = 'cubic-bezier(.22,1,.36,1)';

const sensors = [
  { id: 'temp', reading: '21.4°C' },
  { id: 'humidity', reading: '48% rh' },
  { id: 'motion', reading: 'no motion' },
  { id: 'power', reading: '1.2 kW' },
  { id: 'air', reading: 'CO₂ 612' },
  { id: 'door', reading: 'door shut' },
] as const;

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: readonly [number, number];
  k: number;
  spots: readonly Vec2[];
  card: Vec2;
  print: number;
}

const tall = (a: number, d: number): Vec2[] => [[0, -a], [a, 0], [d, d], [0, a], [-a, 0], [-d, -d]];
const wide = (a: number, d: number): Vec2[] => [[0, -a], [d, -d], [a, 0], [0, a], [-d, d], [-a, 0]];

function build(l: Layout) {
  const { k } = l;
  const s = new Scene({ name: l.name, width: l.width, height: l.height, origin: l.origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const tile = 72 * k;
  const core = 116 * k;
  const coreH = 32 * k;
  const wz = -12 * k;
  const floor = -coreH;
  const spot = (i: number, z = 0): Vec3 => [l.spots[i]![0] * k, l.spots[i]![1] * k, z];

  [0, 1].forEach(i => {
    s.face({ id: `wave-${i}`, at: [0, 0, floor], size: [core, core], radius: core / 2, stroke: 'rgb(45 212 191 / .5)', strokeWidth: 1.25 });
    s.pivot(`wave-${i}`, [0, 0, floor]);
  });
  sensors.forEach((c, i) => {
    s.wire({ id: `w-${c.id}`, points: [spot(i, wz), [0, 0, wz]], stroke: ui.wire, width: 1.25 });
    s.pulse({ id: `p-${c.id}`, wire: `w-${c.id}`, color: accent, length: 0.22 });
  });

  const drawSensor = (i: number) => {
    const c = sensors[i]!;
    const at = spot(i);
    const r = 13 * k;
    s.group(`${c.id}-g`, () => {
      s.slab({ id: c.id, at, size: [tile, tile], height: 18 * k, radius: r, top: ui.top, side: paints.brushed(s, ramps.graphite), grain: 0.06, edge: ui.edge, shadow: false });
      s.face({ id: `${c.id}-lit`, at, size: [tile, tile], radius: r, fill: glow });
      s.text({ id: `${c.id}-name`, at, text: c.id, size: l.print, color: '#a1a1aa', on: 'top', anchor: 'middle' });
      s.text({ id: `${c.id}-value`, at, text: c.reading, size: l.print, weight: 500, color: '#f4f4f5', on: 'top', anchor: 'middle' });
    });
    s.pivot(`${c.id}-g`, [at[0], at[1], -18 * k]);
  };

  const depth = (i: number) => l.spots[i]![0] + l.spots[i]![1];
  const order = sensors.map((_, i) => i).sort((a, b) => depth(a) - depth(b));
  order.filter(i => depth(i) < 0).forEach(drawSensor);
  s.group('core-g', () => {
    s.slab({ id: 'core', at: [0, 0, 0], size: [core, core], height: coreH, radius: 24 * k, top: ui.top, side: paints.gradient(s, ramps.teal), grain: 0.06, edge: ui.edge });
    s.face({ id: 'core-lit', at: [0, 0, 0], size: [core, core], radius: 24 * k, fill: glow });
    s.text({ id: 'core-name', at: [core / 2 - 15 * k, 0, 0], text: 'gateway', size: 11, color: '#99f6e4', on: 'top', along: 'y', anchor: 'middle' });
    sensors.forEach((_, j) => {
      const at: Vec3 = [(j < 3 ? -26 : -8) * k, ((j % 3) - 1) * 20 * k, 0];
      s.face({ id: `led-${j}`, at, size: [9 * k, 9 * k], radius: 4.5 * k, fill: 'rgb(255 255 255 / .1)' });
      s.face({ id: `led-${j}-on`, at, size: [9 * k, 9 * k], radius: 4.5 * k, fill: accent });
    });
  });
  order.filter(i => depth(i) >= 0).forEach(drawSensor);

  const muted = `<div style="font-size:.8em;color:#a1a1aa;margin-bottom:.3em">zone A · 6 sensors</div>`;
  s.label({ id: 'reading', at: { screen: l.card }, variant: 'card', size: 14, anchor: 'bottom', html: `${muted}<span style="font-weight:600;color:#ccfbf1">21.4 °C</span> · all normal` });

  s.dropIn('core-g', 0.1);
  sensors.forEach((c, i) => {
    const t = 0.45 + i * 0.167;
    s.intro(`${c.id}-g`, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.intro(`${c.id}-g`, 'scale', t, 0.23, 0.05, 1.14, ease.out);
    s.intro(`${c.id}-g`, 'scale', t + 0.23, 0.24, 1.14, 1, ease.io);
  });

  const end = 8.4;
  s.loop(10, 6);
  const flash = (id: string, t: number, hold: number, rest = 0) => {
    s.at(id, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at(id, 'opacity', t + 0.1 + hold, 0.6, 1, rest, ease.linear);
  };
  const tug = (id: string, t: number, by: string) => {
    s.at(id, 'translate', t, 0.3, '0 0', by, pull);
    s.at(id, 'translate', t + 0.3, 0.74, by, '0 0', settle);
  };

  let last = 0;
  sensors.forEach((c, i) => {
    const send = 0.3 + i * 0.36;
    const dur = Math.max(0.35, s.wireLength(`w-${c.id}`) / 270);
    flash(`${c.id}-lit`, send, 0.2);
    tug(`${c.id}-g`, send, '0 -5px');
    s.at(`${c.id}-value`, 'opacity', send + 0.15, 0.25, 0, 1, ease.linear);
    s.at(`${c.id}-value`, 'opacity', end + i * 0.05, 0.5, 1, 0, ease.linear);
    s.at(`${c.id}-name`, 'opacity', send, 0.18, 1, 0, ease.linear);
    s.at(`${c.id}-name`, 'opacity', end + 0.4 + i * 0.05, 0.4, 0, 1, ease.linear);
    s.travel(`p-${c.id}`, send + 0.15, dur);
    const arrive = send + 0.15 + dur;
    last = arrive;
    s.at(`led-${i}-on`, 'opacity', arrive, 0.1, 0, 1, ease.linear);
    s.at(`led-${i}-on`, 'opacity', end, 0.5, 1, 0, ease.linear);
  });

  const agg = last + 0.25;
  flash('core-lit', agg, 0.8, 0.35);
  s.at('core-lit', 'opacity', end, 0.5, 0.35, 0, ease.linear);
  tug('core-g', agg, '0 4px');
  [0, 1].forEach(i => {
    const t = agg + 0.15 + i * 0.45;
    s.at(`wave-${i}`, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at(`wave-${i}`, 'scale', t, 1.6, 1, 2.7, spread);
    s.at(`wave-${i}`, 'opacity', t + 0.1, 1.5, 1, 0, ease.linear);
  });
  s.at('reading', 'opacity', agg + 0.3, 0.25, 0, 1, ease.out);
  s.at('reading', 'translate', agg + 0.3, 0.45, '0 10px', '0 0', ease.out);
  s.at('reading', 'opacity', end, 0.5, 1, 0, ease.linear);
  return s;
}

export const example: Example = {
  slug: 'sensor-gateway',
  title: 'Sensors to one reading',
  story: 'Six sensors around a gateway send their readings in one by one, and the gateway merges them into one zone reading that pulses out.',
  prompt: 'Draw an IoT gateway as a core with a ring of sensors around it (temperature, humidity, motion, power, air, door); each sensor sends its reading in, then the gateway combines them into one reading that pulses out as a ring.',
  level: 'medium',
  category: 'infra',
  layout: 'radial',
  useCase: 'IoT',
  surface: 'dark',
  interaction: 'watch',
  art: art(
    build({ name: 'sensors-sm', width: 390, height: 500, origin: [195, 282], k: 0.96, spots: tall(150, 150), card: [195, 82], print: 12 }),
    build({ name: 'sensors-lg', width: 720, height: 400, origin: [360, 226], k: 1.12, spots: wide(150, 132), card: [360, 96], print: 13 }),
    520,
  ),
};

export default page(example);
