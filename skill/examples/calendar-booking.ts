import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const indigo = ramps.indigo;
const line = 'rgb(22 23 27 / .16)';
const ink = '#4b4e57';
const shift = 'cubic-bezier(.49,.19,.28,.81)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const exit = 'linear(0, -0.007 11.8%, -0.045 37.8%, -0.048 57%, -0.028 63.2%, 0.018 69.3%, 0.079 74.3%, 0.164 79.3%, 0.27 84%, 0.392 88.3%, 0.459 90.3%, 0.535 92.3%, 0.609 94%, 0.694 95.8%, 0.777 97.3%, 0.859 98.5%, 0.942 99.5%, 1)';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;
const hours = ['9:00', '10:00', '11:00', '12:00', '13:00'] as const;
type Day = 0 | 1 | 2 | 3 | 4;
type Hour = 0 | 1 | 2 | 3 | 4;
const busy: readonly { day: Day; hour: Hour; span: 1 | 2 }[] = [
  { day: 0, hour: 0, span: 1 },
  { day: 0, hour: 3, span: 1 },
  { day: 1, hour: 1, span: 2 },
  { day: 2, hour: 3, span: 1 },
  { day: 3, hour: 0, span: 1 },
  { day: 3, hour: 3, span: 2 },
  { day: 4, hour: 1, span: 1 },
];
const tried = { day: 1, hour: 1 } as const;
const booked = { day: 2, hour: 1 } as const;
if (!busy.some(b => b.day === tried.day && tried.hour >= b.hour && tried.hour < b.hour + b.span)) throw new Error('calendar-booking: the first slot tried must be busy, that is the conflict the tile skips');
if (busy.some(b => b.day === booked.day && booked.hour >= b.hour && booked.hour < b.hour + b.span)) throw new Error('calendar-booking: the booked slot must be free');

const beat = { conflict: 0.35, glide: 1.75, drop: 2.75, out: 6.4, back: 7.45 } as const;
const loopLength = 8.2;

const card = `<div style="display:flex;align-items:center;gap:.7em"><span style="width:.75em;height:.75em;border-radius:.22em;background:#6366f1"></span><span style="display:flex;flex-direction:column;gap:.1em"><span style="font-weight:600;color:#16171b">Design review</span><span style="font-family:var(--iso-mono);color:#4b4e57">1 h · 4 guests</span></span></div>`;

type Layout = { name: string; width: number; height: number; origin: readonly [number, number]; k: number; minPx: number; notes: 'top' | 'right' };

function build({ name, width, height, origin, k, minPx, notes }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label, ratio: 0.64 });
  const pitch = 44 * k;
  const cell = 37 * k;
  const margin = 30 * k;
  const span = pitch * 5;
  const boardH = 10 * k;
  const busyH = 6 * k;
  const tileH = 10 * k;
  const hover = 26 * k;
  const cx = (d: number) => (d - 2) * pitch;
  const cy = (h: number) => (h - 2) * pitch;

  s.slab({ id: 'board', at: [-margin / 2, -margin / 2, 0], size: [span + margin + 8 * k, span + margin + 8 * k], height: boardH, radius: 18 * k, top: ui.top, side: paints.brushed(s, ramps.silver), edge: line, outline: line, shade: false });
  days.forEach((d, i) => s.text({ id: `day-${i}`, at: [cx(i), -span / 2 - margin / 2, 0], text: d, size: 11, color: ink, on: 'top', anchor: 'middle', weight: 500 }));
  hours.forEach((h, i) => s.text({ id: `hour-${i}`, at: [-span / 2 - margin / 2, cy(i), 0], text: h, size: 10, color: ink, on: 'top', along: 'y', anchor: 'middle' }));
  days.forEach((_, d) => hours.forEach((_, h) => s.face({ id: `cell-${d}-${h}`, at: [cx(d), cy(h), 0], size: [cell, cell], radius: 7 * k, fill: '#fafaf9', stroke: 'rgb(22 23 27 / .07)' })));

  const target: Vec3 = [cx(booked.day), cy(booked.hour), 0];
  s.face({ id: 'slot', at: target, size: [cell, cell], radius: 7 * k, stroke: 'rgb(79 70 229 / .7)', strokeWidth: 1.25, dash: '4 4' });
  s.march('slot', 4, 4, 24);
  s.face({ id: 'slot-glow', at: target, size: [cell + 8 * k, cell + 8 * k], radius: 10 * k, fill: 'rgb(99 102 241 / .2)' });

  const guide = 'rgb(79 70 229 / .55)';
  s.wire({ id: 'g-day', points: [[target[0], target[1] - cell / 2, 0], [target[0], -span / 2 - margin * 0.15, 0]], stroke: guide, width: 1.25, hidden: true });
  s.wire({ id: 'g-hour', points: [[target[0] - cell / 2, target[1], 0], [-span / 2 - margin * 0.15, target[1], 0]], stroke: guide, width: 1.25, hidden: true });
  s.text({ id: 'day-hot', at: [cx(booked.day), -span / 2 - margin / 2, 0], text: days[booked.day], size: 11, color: '#4338ca', on: 'top', anchor: 'middle', weight: 600 });
  s.text({ id: 'hour-hot', at: [-span / 2 - margin / 2, cy(booked.hour), 0], text: hours[booked.hour], size: 10, color: '#4338ca', on: 'top', along: 'y', anchor: 'middle', weight: 600 });

  busy.forEach((b, i) => {
    const at: Vec3 = [cx(b.day), cy(b.hour) + ((b.span - 1) * pitch) / 2, busyH];
    const size = [cell, cell + (b.span - 1) * pitch] as const;
    s.slab({ id: `busy-${i}`, at, size, height: busyH, radius: 7 * k, top: '#f1f1f0', side: paints.flat('#d4d4d8'), edge: line, outline: line, shade: false, shadow: false });
    if (b.day === tried.day && b.hour <= tried.hour && tried.hour < b.hour + b.span) {
      s.face({ id: 'clash', at, size, radius: 7 * k, fill: 'rgb(251 113 133 / .32)', stroke: 'rgb(225 29 72 / .75)', strokeWidth: 1.25 });
    }
  });

  const start: Vec3 = [cx(tried.day), cy(tried.hour), tileH + hover];
  const over: Vec3 = [target[0], target[1], tileH + hover];
  const down: Vec3 = [target[0], target[1], tileH];
  s.face({ id: 'shade', at: [start[0], start[1], busyH], size: [cell * 0.9, cell * 0.9], radius: 8 * k, fill: 'rgb(30 27 75 / .16)' });
  s.group('tile', () => {
    s.slab({ id: 'tile-slab', at: start, size: [cell, cell], height: tileH, radius: 8 * k, top: '#eef2ff', side: paints.gradient(s, indigo), edge: 'rgb(255 255 255 / .9)', outline: 'rgb(55 48 163 / .35)', shadow: false });
    s.text({ id: 'tile-name', at: start, text: 'review', size: 10, color: '#3730a3', on: 'top', anchor: 'middle', weight: 500 });
  });
  s.pivot('tile', [start[0], start[1], start[2] - tileH]);

  const busyText = 'Tue 10:00 · busy';
  const bookText = 'Wed 10:00 · booked';
  const right = fitX(s.project([span / 2 + margin, -span / 2, 0])[0] + 34, 'Wed 10:00 · booked', width, minPx, 'left');
  const cardAt = notes === 'top' ? { screen: [width / 2, 44] as const } : { screen: [right, height * 0.36] as const };
  const noteAt = notes === 'top' ? { screen: [width / 2, 104] as const } : { screen: [right, height * 0.36 + 62] as const };
  const anchor = notes === 'top' ? 'center' : 'left';
  s.label({ id: 'request', at: cardAt, html: card, size: 13, anchor, variant: 'card' });
  s.label({ id: 'busy-note', at: noteAt, html: `<span style="color:#be123c">${busyText}</span>`, size: 13, anchor });
  s.label({ id: 'book-note', at: noteAt, html: `<span style="color:#3730a3">${bookText}</span>`, size: 13, anchor });

  s.dropIn('board', 0.1);
  s.intro('request', 'opacity', 0.3, 0.3, 0, 1, ease.out);
  s.intro('request', 'translate', 0.3, 0.45, '0 8px', '0 0', ease.out);
  s.intro('tile', 'opacity', 0.5, 0.2, 0, 1, ease.out);
  s.intro('tile', 'translate', 0.5, 0.55, '0 -20px', '0 0', ease.out);
  s.intro('shade', 'opacity', 0.5, 0.4, 0, 1, ease.linear);

  s.loop(loopLength, 4.6);
  s.at('clash', 'opacity', beat.conflict, 0.1, 0, 1, ease.linear);
  s.at('clash', 'opacity', beat.glide + 0.2, 0.6, 1, 0, ease.linear);
  s.at('busy-note', 'opacity', beat.conflict + 0.05, 0.25, 0, 1, ease.out);
  s.at('busy-note', 'translate', beat.conflict + 0.05, 0.4, '0 6px', '0 0', ease.out);
  s.at('busy-note', 'opacity', beat.glide, 0.3, 1, 0, ease.linear);

  const lift = s.offset(start, [start[0], start[1], start[2] + 8 * k]);
  const glide = s.offset(start, over);
  const land = s.offset(start, down);
  const shadeGlide = s.offset([start[0], start[1], 0], [over[0], over[1], 0]);
  s.at('tile', 'translate', beat.conflict, 0.3, '0 0', lift, pull);
  s.at('tile', 'translate', beat.conflict + 0.3, 0.74, lift, '0 0', settle);
  s.at('tile', 'translate', beat.glide, 0.82, '0 0', glide, shift);
  s.at('shade', 'translate', beat.glide, 0.82, '0 0', shadeGlide, shift);
  s.at('tile', 'translate', beat.drop, 0.32, glide, land, ease.drop);
  s.at('tile', 'scale', beat.drop + 0.3, 0.12, '1 1', '1.04 .92', ease.out);
  s.at('tile', 'scale', beat.drop + 0.42, 0.4, '1.04 .92', '1 1', ease.settle);
  s.at('shade', 'opacity', beat.drop, 0.3, 1, 0, ease.linear);
  s.at('slot', 'opacity', beat.drop + 0.2, 0.2, 1, 0, ease.linear);
  s.at('slot-glow', 'opacity', beat.drop + 0.32, 0.1, 0, 1, ease.linear);
  s.at('slot-glow', 'opacity', beat.drop + 0.42, 0.6, 1, 0, ease.linear);
  s.draw('g-day', beat.drop + 0.4, 0.6, 'cubic-bezier(.05,1,.6,1)');
  s.draw('g-hour', beat.drop + 0.46, 0.6, 'cubic-bezier(.05,1,.6,1)');
  s.at('day-hot', 'opacity', beat.drop + 0.7, 0.3, 0, 1, ease.linear);
  s.at('hour-hot', 'opacity', beat.drop + 0.76, 0.3, 0, 1, ease.linear);
  s.retract('g-day', beat.out, 0.23, 'start', 'cubic-bezier(.45,.86,.17,.96)');
  s.retract('g-hour', beat.out, 0.23, 'start', 'cubic-bezier(.45,.86,.17,.96)');
  s.at('day-hot', 'opacity', beat.out, 0.3, 1, 0, ease.linear);
  s.at('hour-hot', 'opacity', beat.out, 0.3, 1, 0, ease.linear);
  s.at('book-note', 'opacity', beat.drop + 0.4, 0.25, 0, 1, ease.out);
  s.at('book-note', 'translate', beat.drop + 0.4, 0.4, '0 6px', '0 0', ease.out);

  s.at('book-note', 'opacity', beat.out, 0.3, 1, 0, ease.linear);
  s.at('tile', 'scale', beat.out, 0.745, 1, 0, exit);
  s.set('tile', 'translate', beat.out + 0.8, '0 0');
  s.set('tile', 'opacity', beat.out + 0.8, 0);
  s.set('tile', 'scale', beat.out + 0.85, 1);
  s.set('shade', 'translate', beat.out + 0.8, '0 0');
  s.at('slot', 'opacity', beat.out + 0.4, 0.4, 0, 1, ease.linear);
  s.at('tile', 'opacity', beat.back, 0.2, 0, 1, ease.out);
  s.at('tile', 'translate', beat.back, 0.55, '0 -20px', '0 0', ease.out);
  s.at('shade', 'opacity', beat.back, 0.4, 0, 1, ease.linear);
  return s;
}

export const example: Example = {
  slug: 'calendar-booking',
  title: 'Find a free slot',
  ask: 'Show a meeting skipping a busy slot for a free one.',
  story: 'A meeting tile hovers over the week, finds Tuesday at ten already busy, glides on to Wednesday and drops into the free slot.',
  prompt: 'Draw a week calendar laid flat as a grid of slots with some busy blocks, and a meeting tile that skips a busy slot and drops into a free one with its time.',
  level: 'simple',
  intent: 'choose',
  layout: 'field',
  useCase: 'Scheduling',
  surface: 'light',
  interaction: 'watch',
  art: art(build({ name: 'calendar-sm', width: 390, height: 372, origin: [200, 232], k: 0.98, minPx: narrowest, notes: 'top' }), build({ name: 'calendar-lg', width: 720, height: 400, origin: [290, 212], k: 1.02, minPx: 521, notes: 'right' }), 520),
};

export default page(example);
