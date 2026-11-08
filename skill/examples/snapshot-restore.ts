import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const ink = '#3f3f46';
const line = 'rgb(22 23 27 / .3)';
const accent = '#0d9488';
const bad = '#e11d48';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const glide = 'cubic-bezier(.45,.05,.05,1)';

const snapshots = ['06:00', '09:00', '12:00', '15:00'] as const;
const latest = snapshots.length - 1;
const target = snapshots.indexOf('09:00');
const pitch = 82;

type Layout = { name: string; width: number; height: number; origin: Vec2; k: number; noteBelow: boolean };

function build({ name, width, height, origin, k, noteBelow }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const card = 58 * k;
  const cardH = 6 * k;
  const cardX = (i: number) => (-270 + i * pitch) * k;
  const db: Vec3 = [140 * k, 0, 0];
  const disc = 100 * k;
  const discH = 16 * k;
  const discPitch = 25 * k;
  const dbTop = 2 * discPitch;
  const tile = 40 * k;
  const tileH = 10 * k;

  s.wire({ id: 'axis', points: [[cardX(0) - card / 2 - 12 * k, 0, -cardH / 2], [db[0] - disc / 2, 0, -cardH / 2]], stroke: ui.wire, width: 1.25 });
  s.face({ id: 'cursor', at: [cardX(latest), 0, -cardH], size: [card + 18 * k, card + 18 * k], radius: 16 * k, fill: 'rgb(20 184 166 / .1)', stroke: accent, strokeWidth: 1.5 });

  snapshots.forEach((time, i) => {
    const at: Vec3 = [cardX(i), 0, 0];
    s.group(`snap-${i}`, () => {
      s.slab({ id: `card-${i}`, at, size: [card, card], height: cardH, radius: 12 * k, top: ui.top, side: paints.flat('#f4f4f5'), outline: line, edge: line, shade: false });
      if (i === target) s.face({ id: `card-${i}-lit`, at, size: [card, card], radius: 12 * k, fill: 'rgb(20 184 166 / .16)', stroke: 'rgb(13 148 136 / .5)' });
      s.text({ id: `card-${i}-time`, at, text: time, size: noteBelow ? 12 : 14, color: ink, on: 'top', anchor: 'middle' });
    });
  });

  s.group('db', () => {
    [0, 1, 2].forEach(i => s.slab({ id: `disc-${i}`, at: [db[0], db[1], i * discPitch], size: [disc, disc], height: discH, radius: disc / 2, top: ui.top, side: paints.brushed(s, ramps.silver), outline: line, shade: false, edge: line, shadow: i === 0 }));
    const top: Vec3 = [db[0], db[1], dbTop];
    s.face({ id: 'db-bad', at: top, size: [disc, disc], radius: disc / 2, fill: 'rgb(244 63 94 / .16)', stroke: 'rgb(225 29 72 / .55)' });
    s.face({ id: 'db-ok', at: top, size: [disc, disc], radius: disc / 2, fill: 'rgb(20 184 166 / .28)' });
    s.slab({ id: 'change', at: [db[0] - 8 * k, db[1] - 8 * k, dbTop + tileH], size: [tile, tile], height: tileH, radius: 9 * k, top: '#fda4af', side: paints.flat(bad), outline: 'rgb(136 19 55 / .45)', edge: 'rgb(255 255 255 / .6)', shadow: false });
  });

  const from: Vec3 = [cardX(target), 0, cardH];
  const to: Vec3 = [db[0], db[1], dbTop + cardH];
  s.slab({ id: 'copy', at: from, size: [card, card], height: cardH, radius: 12 * k, top: '#ccfbf1', side: paints.flat('#5eead4'), outline: 'rgb(13 148 136 / .6)', edge: 'rgb(13 148 136 / .6)', shadow: false, shade: false });

  const [nx, ny] = s.project(noteBelow ? [db[0] + disc / 2, db[1] + disc / 2, -discH] : [db[0], db[1], dbTop]);
  const noteAt = (text: string): Vec2 => (noteBelow ? [fitX(nx, text, width, narrowest), ny + 18] : [fitX(nx, text, width, 521), ny - 0.41 * disc - 22]);
  s.label({ id: 'note-bad', at: { screen: noteAt('✗ bad migration') }, html: `<span style="color:${bad}">✗</span> bad migration`, size: 13, anchor: noteBelow ? 'top' : 'bottom' });
  s.label({ id: 'note-ok', at: { screen: noteAt('✓ restore 09:00') }, html: `<span style="color:#0f766e">✓</span> restore 09:00`, size: 13, anchor: noteBelow ? 'top' : 'bottom' });

  snapshots.forEach((_, i) => s.dropIn(`snap-${i}`, 0.1 + i * 0.083));
  s.dropIn('db', 0.45);
  s.intro('cursor', 'opacity', 0.8, 0.3, 0, 1, ease.linear);
  s.introUntil(1.1);

  s.loop(9.6, 6.6);
  const cursorAt = (i: number): Vec3 => [cardX(i), 0, -cardH];
  const back = s.offset(cursorAt(latest), cursorAt(target));

  s.dropAt('change', 0.4, 40 * k);
  s.at('db-bad', 'opacity', 0.72, 0.3, 0, 1, ease.linear);
  s.at('db', 'translate', 0.72, 0.14, '0 0', '0 4px', ease.out);
  s.at('db', 'translate', 0.86, 0.74, '0 4px', '0 0', settle);
  s.at('note-bad', 'opacity', 0.85, 0.3, 0, 1, ease.out);
  s.at('note-bad', 'translate', 0.85, 0.4, noteBelow ? '0 -6px' : '0 6px', '0 0', ease.out);

  s.at('cursor', 'translate', 2.0, 1.2, '0 0', back, settle);
  s.at(`snap-${target}`, 'translate', 3.0, 0.3, '0 0', '0 -6px', pull);
  s.at(`card-${target}-lit`, 'opacity', 3.0, 0.25, 0, 1, ease.linear);

  const [ax, ay] = s.project(from);
  const [bx, by] = s.project(to);
  const lift = 14;
  const land = 5.3;
  s.at('copy', 'opacity', 3.55, 0.15, 0, 1, ease.linear);
  s.at('copy', 'translate', 3.55, 0.35, '0 -6px', `0 ${-6 - lift}px`, ease.out);
  s.at('copy', 'translate', 4.0, land - 4.0, `0 ${-6 - lift}px`, `${(bx - ax).toFixed(2)}px ${(by - ay).toFixed(2)}px`, glide);
  s.at('note-bad', 'opacity', 4.4, 0.3, 1, 0, ease.linear);

  s.at('copy', 'opacity', land - 0.05, 0.3, 1, 0, ease.linear);
  s.set('copy', 'translate', land + 0.4, '0 -6px');
  s.at('change', 'opacity', land - 0.4, 0.3, 1, 0, ease.linear);
  s.at('db-bad', 'opacity', land, 0.4, 1, 0, ease.linear);
  s.at('db-ok', 'opacity', land, 0.1, 0, 1, ease.linear);
  s.at('db-ok', 'opacity', land + 0.1, 0.6, 1, 0.5, ease.linear);
  s.at('db-ok', 'opacity', 7.6, 0.4, 0.5, 0, ease.linear);
  s.at('db', 'translate', land, 0.14, '0 0', '0 4px', ease.out);
  s.at('db', 'translate', land + 0.14, 0.74, '0 4px', '0 0', settle);
  s.at('note-ok', 'opacity', land + 0.15, 0.3, 0, 1, ease.out);
  s.at('note-ok', 'translate', land + 0.15, 0.4, noteBelow ? '0 -6px' : '0 6px', '0 0', ease.out);

  s.at('note-ok', 'opacity', 7.6, 0.3, 1, 0, ease.linear);
  s.at(`snap-${target}`, 'translate', 7.7, 0.5, '0 -6px', '0 0', ease.io);
  s.at(`card-${target}-lit`, 'opacity', 7.7, 0.3, 1, 0, ease.linear);
  s.at('cursor', 'translate', 7.9, 1.2, back, '0 0', settle);
  return s;
}

export const example: Example = {
  slug: 'snapshot-restore',
  title: 'Snapshot restore',
  ask: 'Show a database rolled back to a good snapshot.',
  story: 'A bad migration turns the database rose, a cursor slides back along the snapshot timeline to 09:00, and that copy glides into the database to make it healthy again.',
  prompt: 'Draw a database next to a timeline of snapshots; a bad change turns it red, a cursor slides back to the 09:00 snapshot and its copy glides into the database to restore it.',
  level: 'medium',
  intent: 'change',
  layout: 'diagonal',
  useCase: 'Backups',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build({ name: 'restore-sm', width: 390, height: 380, origin: [218, 178], k: 0.86, noteBelow: true }),
    build({ name: 'restore-lg', width: 720, height: 400, origin: [396, 214], k: 1.2, noteBelow: false }),
    520,
  ),
};

export default page(example);
