import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const accent = '#f59e0b';
const warm = '#b45309';
const ink = '#4b4e57';
const tint = 'rgb(251 191 36 / .18)';
const line = 'rgb(22 23 27 / .2)';
const wire = 'rgb(22 23 27 / .24)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const spread = 'cubic-bezier(.22,1,.36,1)';

type Kind = 'lights' | 'blinds' | 'thermostat' | 'speaker';
const devices: readonly { id: Kind; dir: Vec2; state: string }[] = [
  { id: 'lights', dir: [0, -1], state: 'lights · 30%' },
  { id: 'blinds', dir: [1, 0], state: 'blinds · down' },
  { id: 'thermostat', dir: [0, 1], state: 'heat · 20°C' },
  { id: 'speaker', dir: [-1, 0], state: 'music · 40%' },
];
const slats = 5;

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: readonly [number, number];
  k: number;
  minPx: number;
  pills: 'stacked' | 'sides';
  card: Vec2;
}

function build(l: Layout) {
  const { k } = l;
  const s = new Scene({ name: l.name, width: l.width, height: l.height, origin: l.origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const ring = 156 * k;
  const tile = 84 * k;
  const hub = 116 * k;
  const wz = -12 * k;
  const atOf = (d: Vec2, z = 0): Vec3 => [d[0] * ring, d[1] * ring, z];
  const tileSlab = (id: string, at: Vec3) => s.slab({ id, at, size: [tile, tile], height: 20 * k, radius: 15 * k, top: ui.top, side: paints.gradient(s, ramps.silver), outline: line, edge: line, shade: false });

  devices.forEach(d => {
    s.wire({ id: `w-${d.id}`, points: [[0, 0, wz], atOf(d.dir, wz)], stroke: wire, width: 1.25 });
    s.pulse({ id: `p-${d.id}`, wire: `w-${d.id}`, color: accent, length: 0.2 });
  });

  const lights = (at: Vec3) => {
    tileSlab('lights', at);
    s.face({ id: 'lights-lit', at, size: [tile, tile], radius: 15 * k, fill: tint });
    s.svg('lights-halo', s.plane(at, `<circle r="${30 * k}" fill="#fbbf24" opacity=".55" filter="${s.blur(9 * k)}"/>`));
    const lamp: Vec3 = [at[0], at[1], 12 * k];
    s.slab({ id: 'lamp', at: lamp, size: [36 * k, 36 * k], height: 12 * k, radius: 18 * k, top: '#ffffff', side: paints.flat('#f4f4f5'), outline: line, edge: line, shade: false, shadow: false });
    s.face({ id: 'lamp-on', at: lamp, size: [36 * k, 36 * k], radius: 18 * k, fill: '#fde68a', stroke: 'rgb(180 83 9 / .4)' });
  };
  const blinds = (at: Vec3) => {
    tileSlab('blinds', at);
    s.face({ id: 'blinds-lit', at, size: [tile, tile], radius: 15 * k, fill: tint });
    const w = 56 * k;
    const h = 50 * k;
    const p: Vec3 = [at[0], at[1] + 6 * k, h / 2 + 2 * k];
    s.panel({ id: 'window', at: p, size: [w, h], thickness: 4 * k, facing: 'left', radius: 6 * k, front: '#e0f2fe', side: '#d4d4d8', edge: 'rgb(22 23 27 / .25)' });
    const pitch = (h - 8 * k) / slats;
    for (let i = 0; i < slats; i++) {
      const y = -h / 2 + 4 * k + i * pitch;
      s.svg(`slat-${i}`, s.plane(p, `<rect x="${-w / 2 + 4 * k}" y="${y}" width="${w - 8 * k}" height="${pitch - 1.2 * k}" rx="${1.5 * k}" fill="#d6d3d1" stroke="rgb(68 64 60 / .45)" stroke-width="1" vector-effect="non-scaling-stroke"/>`, 'left'));
    }
  };
  const thermostat = (at: Vec3) => {
    tileSlab('thermostat', at);
    s.face({ id: 'thermostat-lit', at, size: [tile, tile], radius: 15 * k, fill: tint });
    s.face({ id: 'dial', at, size: [52 * k, 52 * k], radius: 26 * k, fill: '#fafaf9', stroke: 'rgb(22 23 27 / .22)' });
    s.face({ id: 'dial-on', at, size: [52 * k, 52 * k], radius: 26 * k, stroke: accent, strokeWidth: 2 });
    s.text({ id: 'temp-day', at, text: '23°', size: 15, weight: 600, font: 'sans', color: '#3f3f46', on: 'top', anchor: 'middle' });
    s.text({ id: 'temp-eve', at, text: '20°', size: 15, weight: 600, font: 'sans', color: warm, on: 'top', anchor: 'middle' });
  };
  const speaker = (at: Vec3) => {
    tileSlab('speaker', at);
    s.face({ id: 'speaker-lit', at, size: [tile, tile], radius: 15 * k, fill: tint });
    [0, 1].forEach(i => {
      s.face({ id: `sound-${i}`, at, size: [40 * k, 40 * k], radius: 20 * k, stroke: accent, strokeWidth: 1.5 });
      s.pivot(`sound-${i}`, at);
    });
    const box = 36 * k;
    const top: Vec3 = [at[0], at[1], 38 * k];
    s.slab({ id: 'box', at: top, size: [box, box], height: 38 * k, radius: 8 * k, top: '#3f3f46', side: paints.gradient(s, ramps.graphite), edge: 'rgb(255 255 255 / .18)', grain: 0.06, shadow: false });
    s.svg('cone', s.plane([at[0], at[1] + box / 2, 19 * k], `<circle r="${9 * k}" fill="#18181b" stroke="#71717a" stroke-width="1" vector-effect="non-scaling-stroke"/><circle r="${3 * k}" fill="#52525b"/>`, 'left'));
  };
  const draw: Record<Kind, (at: Vec3) => unknown> = { lights, blinds, thermostat, speaker };
  const drawDevice = (d: (typeof devices)[number]) => {
    const at = atOf(d.dir);
    s.group(`${d.id}-g`, () => draw[d.id](at));
    s.pivot(`${d.id}-g`, [at[0], at[1], -20 * k]);
  };

  devices.filter(d => d.dir[0] + d.dir[1] < 0).forEach(drawDevice);
  s.group('hub-g', () => {
    s.slab({ id: 'hub', at: [0, 0, 0], size: [hub, hub], height: 30 * k, radius: 24 * k, top: ui.top, side: paints.gradient(s, ramps.amber), outline: 'rgb(180 83 9 / .35)', edge: line, shade: false });
    s.face({ id: 'hub-lit', at: [0, 0, 0], size: [hub, hub], radius: 24 * k, fill: tint });
    s.text({ id: 'hub-name', at: [hub / 2 - 14 * k, 0, 0], text: 'home hub', size: 11, color: warm, on: 'top', along: 'y', anchor: 'middle' });
    s.svg('moon', s.plane([-10 * k, 0, 0], `<circle r="${17 * k}" fill="${accent}"/><circle cx="${7 * k}" cy="${-7 * k}" r="${14 * k}" fill="#ffffff"/>`));
  });
  devices.filter(d => d.dir[0] + d.dir[1] > 0).forEach(drawDevice);

  devices.forEach(d => {
    const at = atOf(d.dir);
    const [x, y] = s.project(at);
    const back = d.dir[0] + d.dir[1] < 0;
    const right = d.dir[0] - d.dir[1] > 0;
    const html = `<span style="color:${warm}">●</span> ${d.state}`;
    const text = `● ${d.state}`;
    if (l.pills === 'sides') {
      const anchor = right ? 'left' : 'right';
      const px = x + (right ? 1 : -1) * (tile * 0.707 + 14 * k);
      s.label({ id: `${d.id}-state`, at: { screen: [fitX(px, text, l.width, l.minPx, anchor), y - 8 * k] }, html, size: 13, anchor });
    } else {
      const lift = d.id === 'speaker' ? 36 * k : d.id === 'lights' ? 16 * k : 0;
      const py = back ? y - tile * 0.408 - 10 * k - lift : y + tile * 0.408 + 30 * k;
      s.label({ id: `${d.id}-state`, at: { screen: [fitX(x, text, l.width, l.minPx), py] }, html, size: 13, anchor: back ? 'bottom' : 'top' });
    }
  });
  s.label({ id: 'scene', at: { screen: l.card }, variant: 'card', size: 14, anchor: 'bottom', html: `<div style="font-size:.8em;color:${ui.muted};margin-bottom:.3em">scene</div><span style="font-weight:600">Evening</span> <span style="color:${ui.muted}">· 7:30 pm</span>` });

  s.dropIn('hub-g', 0.1);
  devices.forEach((d, i) => {
    const t = 0.45 + i * 0.167;
    s.intro(`${d.id}-g`, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.intro(`${d.id}-g`, 'scale', t, 0.23, 0.05, 1.14, ease.out);
    s.intro(`${d.id}-g`, 'scale', t + 0.23, 0.24, 1.14, 1, ease.io);
  });

  const back = 10;
  s.loop(12, 8.4);
  const tug = (id: string, t: number, by: string) => {
    s.at(id, 'translate', t, 0.3, '0 0', by, pull);
    s.at(id, 'translate', t + 0.3, 0.74, by, '0 0', settle);
  };
  const on = (id: string, t: number, until: number, dur = 0.5, to = 1) => {
    s.at(id, 'opacity', t, dur, 0, to, ease.linear);
    s.at(id, 'opacity', until, 0.6, to, 0, ease.linear);
  };

  s.at('scene', 'opacity', 0.3, 0.25, 0, 1, ease.out);
  s.at('scene', 'translate', 0.3, 0.45, '0 8px', '0 0', ease.out);
  s.at('scene', 'opacity', back + 0.4, 0.5, 1, 0, ease.linear);
  s.at('hub-lit', 'opacity', 0.45, 0.1, 0, 1, ease.linear);
  s.at('hub-lit', 'opacity', 0.55, 0.6, 1, 0, ease.linear);
  tug('hub-g', 0.45, '0 4px');
  on('moon', 0.45, back + 0.4, 0.4);

  devices.forEach((d, i) => {
    const start = 0.9 + i * 1.25;
    const dur = Math.max(0.35, s.wireLength(`w-${d.id}`) / 270);
    const arrive = start + dur;
    const off = back + i * 0.08;
    s.travel(`p-${d.id}`, start, dur);
    s.at(`${d.id}-lit`, 'opacity', arrive, 0.1, 0, 1, ease.linear);
    s.at(`${d.id}-lit`, 'opacity', arrive + 0.1, 0.6, 1, 0.5, ease.linear);
    s.at(`${d.id}-lit`, 'opacity', off, 0.6, 0.5, 0, ease.linear);
    tug(`${d.id}-g`, arrive, '0 -6px');
    const from = l.pills === 'sides' ? (d.dir[0] - d.dir[1] > 0 ? '-8px 0' : '8px 0') : d.dir[0] + d.dir[1] < 0 ? '0 6px' : '0 -6px';
    s.at(`${d.id}-state`, 'opacity', arrive + 0.15, 0.25, 0, 1, ease.out);
    s.at(`${d.id}-state`, 'translate', arrive + 0.15, 0.45, from, '0 0', ease.out);
    s.at(`${d.id}-state`, 'opacity', off, 0.4, 1, 0, ease.linear);
    const act = arrive + 0.1;
    if (d.id === 'lights') {
      on('lights-halo', act, off, 0.8);
      on('lamp-on', act, off, 0.6);
    } else if (d.id === 'blinds') {
      for (let j = 0; j < slats; j++) {
        s.at(`slat-${j}`, 'opacity', act + j * 0.09, 0.18, 0, 1, ease.linear);
        s.at(`slat-${j}`, 'opacity', off + (slats - 1 - j) * 0.06, 0.18, 1, 0, ease.linear);
      }
    } else if (d.id === 'thermostat') {
      s.at('temp-day', 'opacity', act, 0.2, 1, 0, ease.linear);
      s.at('temp-day', 'opacity', off + 0.3, 0.3, 0, 1, ease.linear);
      on('temp-eve', act + 0.15, off, 0.25);
      on('dial-on', act, off, 0.5);
    } else {
      [0, 1].forEach(j => {
        for (let t = act + j * 0.45; t + 0.9 < off; t += 0.9) {
          s.at(`sound-${j}`, 'opacity', t, 0.05, 0, 0.9, ease.linear);
          s.at(`sound-${j}`, 'scale', t, 0.85, 1, 1.9, spread);
          s.at(`sound-${j}`, 'opacity', t + 0.05, 0.8, 0.9, 0, ease.linear);
        }
      });
    }
  });
  return s;
}

export const example: Example = {
  slug: 'smart-home',
  title: 'Evening scene at home',
  story: 'The home hub runs the Evening scene, and the lights, blinds, thermostat and speaker around it change state one after another.',
  prompt: 'Draw a smart home hub in the centre with lights, blinds, a thermostat and a speaker around it; an Evening scene runs and each device changes state in turn: lights dim warm, blinds come down, heat drops to 20 °C, music starts.',
  level: 'medium',
  category: 'product',
  layout: 'radial',
  useCase: 'Smart home',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build({ name: 'home-sm', width: 390, height: 424, origin: [195, 246], k: 0.86, minPx: narrowest, pills: 'stacked', card: [195, 74] }),
    build({ name: 'home-lg', width: 720, height: 400, origin: [360, 220], k: 1, minPx: 521, pills: 'sides', card: [360, 96] }),
    520,
  ),
};

export default page(example);
