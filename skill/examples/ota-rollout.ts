import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.dark;
const sky = ramps.sky;
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const bright = 'rgb(125 211 252 / .95)';
const done = 'rgb(56 189 248 / .3)';
const loopLength = 14;
const beat = { canary: 0.4, wave: 2.6, retry: 5.6, all: 7.6, reset: 12.3 } as const;

type Step = 'off' | 'on' | 'halt';
const look: Record<Step, { ink: string; border: string }> = {
  off: { ink: '#a1a1aa', border: 'rgb(255 255 255 / .1)' },
  on: { ink: '#7dd3fc', border: 'rgb(125 211 252 / .45)' },
  halt: { ink: '#fda4af', border: 'rgb(251 113 133 / .55)' },
};
const steps: readonly { id: string; states: readonly [Step, Step, Step] }[] = [
  { id: 'step-0', states: ['off', 'off', 'off'] },
  { id: 'step-1', states: ['on', 'off', 'off'] },
  { id: 'step-2', states: ['on', 'on', 'off'] },
  { id: 'step-h', states: ['on', 'halt', 'off'] },
  { id: 'step-3', states: ['on', 'on', 'on'] },
];
function stepper(states: readonly [Step, Step, Step]): string {
  const chip = (text: string, st: Step) => `<span style="padding:.3em .7em;border-radius:8px;background:#1b1c22;border:1px solid ${look[st].border};color:${look[st].ink};font-family:var(--iso-mono)">${text}</span>`;
  const join = (st: Step) => `<span style="width:1.4em;height:1px;background:${st === 'off' ? 'rgb(255 255 255 / .14)' : look[st].border}"></span>`;
  return `<span style="display:flex;align-items:center;gap:.45em">${chip('5 %', states[0])}${join(states[1])}${chip('25 %', states[1])}${join(states[2])}${chip('100 %', states[2])}</span>`;
}

type Layout = { name: string; width: number; height: number; origin: readonly [number, number]; k: number; cols: number; rows: number; minPx: number; legend: { x: number; y: number; align: 'center' | 'left' } };

function build({ name, width, height, origin, k, cols, rows, minPx, legend }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label, ratio: 0.64 });
  const pitch = 46 * k;
  const size = 30 * k;
  const dh = 7 * k;
  const plate = { size: [cols * pitch + 14 * k, rows * pitch + 14 * k] as const, height: 12 * k };
  const ctrl = { at: [-plate.size[0] / 2 - 86 * k, 0, 4 * k] as Vec3, size: 62 * k, height: 26 * k };
  const entry: Vec3 = [-plate.size[0] / 2, 0, -plate.height + 2 * k];
  const total = cols * rows;
  const counts = [Math.max(1, Math.round(total * 0.05)), Math.round(total * 0.25), total] as const;

  const devices = Array.from({ length: total }, (_, i) => {
    const at: Vec3 = [(i % cols - (cols - 1) / 2) * pitch, (Math.floor(i / cols) - (rows - 1) / 2) * pitch, dh];
    return { i, at, dist: Math.hypot(at[0] - entry[0], (at[1] - entry[1]) * 1.15) };
  });
  const order = [...devices].sort((a, b) => a.dist - b.dist);
  const waves = [order.slice(0, counts[0]), order.slice(counts[0], counts[1]), order.slice(counts[1])] as const;
  const failing = waves[1][Math.min(3, waves[1].length - 1)]!;

  s.wire({ id: 'w-ctrl', points: [[ctrl.at[0] + ctrl.size / 2, 0, entry[2]], entry], stroke: ui.wire, width: 1.25 });
  s.pulse({ id: 'p-ctrl', wire: 'w-ctrl', color: sky[2], length: 0.3 });
  s.slab({ id: 'ctrl', at: ctrl.at, size: [ctrl.size, ctrl.size], height: ctrl.height, radius: 13 * k, top: ui.top, side: paints.gradient(s, sky), grain: 0.06, edge: ui.edge });
  s.face({ id: 'ctrl-glow', at: ctrl.at, size: [ctrl.size, ctrl.size], radius: 13 * k, fill: 'rgb(56 189 248 / .3)' });
  s.text({ id: 'ctrl-name', at: ctrl.at, text: 'fw 2.4', size: 11, color: '#bae6fd', on: 'top', anchor: 'middle', weight: 500 });

  s.slab({ id: 'plate', at: [0, 0, 0], size: plate.size, height: plate.height, radius: 20 * k, top: '#16171b', side: paints.brushed(s, ramps.graphite), edge: ui.edge });
  s.face({ id: 'plate-glow', at: [0, 0, 0], size: plate.size, radius: 20 * k, fill: 'rgb(56 189 248 / .07)' });
  s.group('devices', () => {
    [...devices].sort((a, b) => a.at[0] + a.at[1] - (b.at[0] + b.at[1])).forEach(d => {
      const device = () => {
        s.slab({ id: `d${d.i}`, at: d.at, size: [size, size], height: dh, radius: 7 * k, top: '#24252c', side: paints.flat('#3f3f46'), edge: 'rgb(255 255 255 / .1)', shadow: false });
        s.face({ id: `d${d.i}-new`, at: d.at, size: [size, size], radius: 7 * k, fill: done, stroke: 'rgb(125 211 252 / .55)' });
      };
      if (d !== failing) return device();
      s.face({ id: 'ring', at: d.at, size: [size + 14 * k, size + 14 * k], radius: 11 * k, stroke: 'rgb(251 113 133 / .8)', strokeWidth: 1.25, dash: '4 4' });
      s.group('failing', () => {
        device();
        s.face({ id: 'fail', at: d.at, size: [size, size], radius: 7 * k, fill: 'rgb(251 113 133 / .55)', stroke: '#fb7185' });
      });
    });
  });
  s.march('ring', 4, 4, 24);

    const messages = [
    { id: 'm-canary', text: `canary · ${counts[0]} of ${total}`, color: '#7dd3fc' },
    { id: 'm-wave', text: `wave 2 · ${counts[1]} of ${total}`, color: '#7dd3fc' },
    { id: 'm-halt', text: 'halted · 1 failed', color: '#fda4af' },
    { id: 'm-retry', text: 'retry ok · resumed', color: '#7dd3fc' },
    { id: 'm-done', text: `${total} of ${total} on 2.4`, color: '#6ee7b7' },
  ] as const;
  const widest = '5 % - 25 % - 100 %'.padEnd(25, ' ');
  const anchor = legend.align;
  const x0 = anchor === 'left' ? fitX(legend.x, widest, width, minPx, 'left') : legend.x;
  const msgAt: readonly [number, number] = [x0, legend.y + 46];
  steps.forEach(st => s.label({ id: st.id, at: { screen: [x0, legend.y] }, html: stepper(st.states), size: 13, anchor, variant: 'plain' }));
  messages.forEach(m => s.label({ id: m.id, at: { screen: msgAt }, html: `<span style="color:${m.color}">${m.text}</span>`, size: 13, anchor, variant: 'plain' }));

  s.dropIn('ctrl', 0.1);
  s.dropIn('plate', 0.2);
  s.intro('devices', 'opacity', 0.45, 0.4, 0, 1, ease.out);
  s.intro('step-0', 'opacity', 0.6, 0.3, 0, 1, ease.out);

  s.loop(loopLength, 4.6);
  const ping = (t: number, failed = false) => {
    s.at('ctrl', 'translate', t, 0.14, '0 0', '0 3px', ease.out);
    s.at('ctrl', 'translate', t + 0.14, 0.74, '0 3px', '0 0', settle);
    s.at('ctrl-glow', 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at('ctrl-glow', 'opacity', t + 0.1, 0.6, 1, 0, ease.linear);
    const dur = Math.max(0.3, s.wireLength('w-ctrl') / 270);
    s.travel('p-ctrl', t + 0.05, dur);
    const land = t + 0.05 + dur;
    if (!failed) {
      s.at('plate-glow', 'opacity', land, 0.1, 0, 1, ease.linear);
      s.at('plate-glow', 'opacity', land + 0.1, 0.6, 1, 0, ease.linear);
    }
    return land;
  };
  const flash = (id: string, t: number) => {
    s.at(`${id}-new`, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at(`${id}-new`, 'fill', t, 0.7, bright, done, ease.linear);
  };
  const show = (id: string, from: number, to: number) => {
    s.at(id, 'opacity', from, 0.25, 0, 1, ease.out);
    s.at(id, 'translate', from, 0.4, '0 6px', '0 0', ease.out);
    s.at(id, 'opacity', to, 0.25, 1, 0, ease.linear);
  };

  const t1 = ping(beat.canary);
  waves[0].forEach((d, n) => flash(`d${d.i}`, t1 + n * 0.15));
  s.at('step-1', 'opacity', t1, 0.3, 0, 1, ease.linear);
  show('m-canary', t1, beat.wave);

  const t2 = ping(beat.wave);
  const gap = 0.12;
  const at = waves[1].indexOf(failing);
  const failAt = t2 + at * gap;
  const resume = beat.retry + 0.5;
  waves[1].forEach((d, n) => {
    if (d === failing) return;
    flash(`d${d.i}`, n < at ? t2 + n * gap : resume + (n - at - 1) * gap);
  });
  s.at('step-2', 'opacity', t2, 0.3, 0, 1, ease.linear);
  show('m-wave', t2, failAt + 0.05);

  s.at('fail', 'opacity', failAt, 0.1, 0, 1, ease.linear);
  s.at('ring', 'opacity', failAt + 0.1, 0.3, 0, 1, ease.linear);
  s.at('failing', 'translate', failAt, 0.3, '0 0', '0 -5px', pull);
  s.at('failing', 'translate', failAt + 0.3, 0.74, '0 -5px', '0 0', settle);
  s.at('step-h', 'opacity', failAt + 0.1, 0.3, 0, 1, ease.linear);
  show('m-halt', failAt + 0.3, beat.retry);

  s.at('ring', 'opacity', beat.retry, 0.3, 1, 0, ease.linear);
  s.at('fail', 'opacity', beat.retry + 0.1, 0.4, 1, 0, ease.linear);
  flash(`d${failing.i}`, beat.retry + 0.1);
  s.at('step-h', 'opacity', beat.retry, 0.3, 1, 0, ease.linear);
  show('m-retry', beat.retry + 0.25, beat.all);

  const t3 = ping(beat.all);
  const spread = 1.5 / Math.max(1, waves[2].length - 1);
  waves[2].forEach((d, n) => flash(`d${d.i}`, t3 + n * spread));
  s.at('step-3', 'opacity', t3, 0.3, 0, 1, ease.linear);
  show('m-done', t3 + 1.5, beat.reset);

  [...order].reverse().forEach((d, n) => s.at(`d${d.i}-new`, 'opacity', beat.reset + n * (0.8 / total), 0.35, 1, 0, ease.linear));
  ['step-1', 'step-2', 'step-3'].forEach(id => s.at(id, 'opacity', beat.reset + 0.2, 0.4, 1, 0, ease.linear));
  return s;
}

export const example: Example = {
  slug: 'ota-rollout',
  title: 'Staged firmware rollout',
  story: 'Firmware reaches a field of devices in waves of 5, 25 and 100 percent; one device in the second wave fails, the rollout halts until it recovers, then finishes.',
  prompt: 'Draw a firmware update rolling out to a field of devices in waves (canary 5 %, then 25 %, then all), each device flashing as it updates; one fails, the rollout halts, it recovers and the rollout continues.',
  level: 'complex',
  category: 'infra',
  layout: 'field',
  useCase: 'Devices',
  surface: 'dark',
  interaction: 'watch',
  art: art(
    build({ name: 'ota-sm', width: 390, height: 440, origin: [212, 170], k: 0.9, cols: 6, rows: 5, minPx: narrowest, legend: { x: 195, y: 354, align: 'center' } }),
    build({ name: 'ota-lg', width: 1100, height: 520, origin: [640, 236], k: 1.18, cols: 10, rows: 6, minPx: 521, legend: { x: 130, y: 410, align: 'left' } }),
    520,
  ),
};

export default page(example);
