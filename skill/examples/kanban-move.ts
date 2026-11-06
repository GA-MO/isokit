import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const ink = '#4b4e57';
const accent = '#6d28d9';
const done = '#047857';
const line = 'rgb(22 23 27 / .22)';
const lit = 'rgb(139 92 246 / .24)';
const okTint = 'rgb(16 185 129 / .26)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const popIn = 'linear(0, 0.007 1.5%, 0.033 3.3%, 0.078 5%, 0.14 6.8%, 0.216 8.5%, 0.305 10.3%, 0.709 17.3%, 0.863 20.3%, 0.936 22%, 0.987 23.5%, 1.03 25.3%, 1.052 26.8%, 1.06 28.2%, 1.06 38.3%, 1.015 67.5%, 1)';

const columns = [
  { id: 'todo', cards: 2 },
  { id: 'doing', cards: 1 },
  { id: 'review', cards: 1 },
  { id: 'done', cards: 2 },
] as const;
const hops = [0.6, 2.5, 4.4] as const;
const lift = 0.3;
const glide = 0.95;
const lower = 0.3;
const landAt = (h: number) => h + lift + glide + lower;
const finished = landAt(hops[2]);

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: Vec2;
  k: number;
  minPx: number;
  note: 'below' | 'left';
}

function build({ name, width, height, origin, k, minPx, note }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const colW = 112 * k;
  const colL = 204 * k;
  const pitch = 150 * k;
  const colH = 12 * k;
  const cardSize: Vec2 = [92 * k, 54 * k];
  const cardH = 10 * k;
  const slotY = -14 * k;
  const colX = (i: number) => (i - (columns.length - 1) / 2) * pitch;
  const slot = (i: number, z = cardH): Vec3 => [colX(i), slotY, z];
  const print = width > 520 ? 12 : 11;

  columns.forEach((c, i) => {
    const at: Vec3 = [colX(i), 0, 0];
    const head: Vec3 = [colX(i), -colL / 2 + 15 * k, 0];
    s.slab({ id: c.id, at, size: [colW, colL], height: colH, radius: 16 * k, top: ui.top, side: paints.flat('#f1f1f3'), outline: line, edge: line, shade: false });
    s.face({ id: `${c.id}-lit`, at, size: [colW, colL], radius: 16 * k, fill: c.id === 'done' ? okTint : lit });
    s.text({ id: `${c.id}-name`, at: head, text: c.id, size: print, color: ink, on: 'top', anchor: 'middle' });
    s.text({ id: `${c.id}-on`, at: head, text: c.id, size: print, color: c.id === 'done' ? '#065f46' : accent, on: 'top', anchor: 'middle', weight: 600 });
    for (let j = 0; j < c.cards; j++) {
      const y = slotY + (54 + j * 40) * k;
      s.face({ id: `${c.id}-card-${j}`, at: [colX(i), y, 0], size: [cardSize[0], 34 * k], radius: 7 * k, fill: '#ffffff', stroke: line });
      s.face({ id: `${c.id}-bar-${j}`, at: [colX(i) - 12 * k, y, 0], size: [34 * k, 5 * k], radius: 2.5 * k, fill: 'rgb(22 23 27 / .12)' });
    }
  });

  s.group('card-move', () => {
    s.group('card', () => {
      s.slab({ id: 'card-slab', at: slot(0), size: cardSize, height: cardH, radius: 8 * k, top: ui.top, side: paints.gradient(s, ramps.violet), edge: 'rgb(255 255 255 / .9)', outline: 'rgb(91 33 182 / .35)', shadow: true });
      s.face({ id: 'card-chip', at: [colX(0) - 24 * k, slotY, cardH], size: [14 * k, 14 * k], radius: 7 * k, fill: accent });
      s.text({ id: 'card-id', at: [colX(0) - 12 * k, slotY, cardH], text: 'FX-142', size: print - 1, color: ink, on: 'top', anchor: 'start' });
      s.group('card-ok', () => {
        s.face({ id: 'card-ok-dot', at: [colX(0) - 24 * k, slotY, cardH], size: [17 * k, 17 * k], radius: 8.5 * k, fill: done });
        s.text({ id: 'card-ok-tick', at: [colX(0) - 24 * k, slotY, cardH + 0.5], text: '✓', size: print - 1, color: '#ffffff', anchor: 'middle', weight: 700, font: 'sans' });
      });
    });
  });
  s.pivot('card', slot(0, 0));
  s.pivot('card-ok', [colX(0) - 24 * k, slotY, cardH]);

  const end = s.extremes([colX(3), 0, 0], [colW, colL], 16 * k);
  const text = 'done · cycle 2d 4h';
  const [lx, ly]: Vec2 = note === 'left' ? [fitX(end.left[0] - 16, text, width, minPx, 'right'), end.left[1] + 14] : [fitX(end.front[0], text, width, minPx), end.front[1] + 26];
  s.label({ id: 'shipped', at: { screen: [lx, ly] }, html: `<span style="color:${done}">✓</span> ${text}`, size: 13, anchor: note === 'left' ? 'right' : 'top' });
  const start = s.extremes([colX(0), 0, 0], [colW, colL], 16 * k);
  s.label({ id: 'ticket', at: { screen: note === 'left' ? [fitX(start.left[0] + 30, 'FX-142 · login copy', width, minPx, 'left'), start.back[1] - 22] : [fitX(start.back[0], 'FX-142 · login copy', width, minPx), start.back[1] - 22] }, text: 'FX-142 · login copy', size: 13, anchor: note === 'left' ? 'left' : 'bottom' });

  columns.forEach((c, i) => s.dropIn(c.id, 0.1 + i * 0.083));
  columns.forEach((c, i) => s.intro(`${c.id}-name`, 'opacity', 0.3 + i * 0.083, 0.3, 0, 1, ease.out));
  s.dropIn('card', 0.6);
  s.intro('ticket', 'opacity', 0.8, 0.3, 0, 1, ease.out);
  s.intro('ticket', 'translate', 0.8, 0.4, '0 8px', '0 0', ease.out);

  s.loop(9.6, finished + 0.9);

  hops.forEach((h, i) => {
    const from = columns[i]!.id;
    const to = columns[i + 1]!.id;
    const land = landAt(h);
    s.at('card', 'translate', h, lift, '0 0', `0 ${-22 * k}px`, pull);
    s.at('card-move', 'translate', h + lift * 0.6, glide, s.offset(slot(0), slot(i)), s.offset(slot(0), slot(i + 1)), settle);
    s.at('card', 'translate', h + lift + glide - 0.1, lower, `0 ${-22 * k}px`, '0 0', ease.in);
    s.at('card', 'scale', land - 0.1, 0.12, 1, '1.05 0.88', ease.out);
    s.at('card', 'scale', land + 0.02, 0.3, '1.05 0.88', 1, ease.settle);
    s.at(`${from}-lit`, 'opacity', h + 0.2, 0.6, 1, 0, ease.linear);
    s.at(`${from}-on`, 'opacity', h + 0.2, 0.6, 1, 0, ease.linear);
    s.at(`${to}-lit`, 'opacity', land - 0.1, 0.35, 0, 1, ease.linear);
    s.at(`${to}-on`, 'opacity', land - 0.1, 0.35, 0, 1, ease.linear);
    s.at(to, 'translate', land - 0.05, 0.14, '0 0', '0 3px', ease.out);
    s.at(to, 'translate', land + 0.09, 0.74, '0 3px', '0 0', settle);
  });

  s.at('card-ok', 'scale', finished + 0.1, 0.6, 0, 1, popIn);
  s.at('card-ok', 'opacity', finished + 0.1, 0.1, 0, 1, ease.linear);
  s.at('shipped', 'opacity', finished + 0.25, 0.3, 0, 1, ease.out);
  s.at('shipped', 'translate', finished + 0.25, 0.45, note === 'left' ? '8px 0' : '0 -8px', '0 0', ease.out);

  const clear = 8.2;
  s.at('shipped', 'opacity', clear, 0.35, 1, 0, ease.linear);
  s.at('card', 'opacity', clear + 0.1, 0.35, 1, 0, ease.linear);
  s.at('card-ok', 'opacity', clear + 0.1, 0.35, 1, 0, ease.linear);
  s.at('done-lit', 'opacity', clear + 0.2, 0.6, 1, 0, ease.linear);
  s.at('done-on', 'opacity', clear + 0.2, 0.6, 1, 0, ease.linear);
  s.set('card-move', 'translate', clear + 0.5, '0 0');
  s.dropAt('card', clear + 0.6, 30 * k);
  s.at('todo-lit', 'opacity', clear + 0.75, 0.35, 0, 1, ease.linear);
  s.at('todo-on', 'opacity', clear + 0.75, 0.35, 0, 1, ease.linear);
  return s;
}

export const example: Example = {
  slug: 'kanban-move',
  title: 'Card across the board',
  story: 'A ticket lifts off todo and slides through doing and review, each column lighting as it lands, then gets a green tick in done.',
  prompt: 'Draw a kanban board as four columns along a diagonal (todo, doing, review, done) with one card lifting and sliding column to column, the column it enters lighting up, and a green done tick at the end.',
  level: 'simple',
  category: 'product',
  layout: 'diagonal',
  useCase: 'Project boards',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build({ name: 'kanban-sm', width: 390, height: 400, origin: [195, 192], k: 0.7, minPx: narrowest, note: 'below' }),
    build({ name: 'kanban-lg', width: 720, height: 400, origin: [346, 196], k: 1, minPx: 521, note: 'left' }),
    520,
  ),
};

export default page(example);
