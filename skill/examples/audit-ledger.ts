import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const accent = '#4f46e5';
const line = 'rgb(22 23 27 / .3)';
const popIn = 'linear(0, 0.007 1.5%, 0.033 3.3%, 0.078 5%, 0.14 6.8%, 0.216 8.5%, 0.305 10.3%, 0.709 17.3%, 0.863 20.3%, 0.936 22%, 0.987 23.5%, 1.03 25.3%, 1.052 26.8%, 1.06 28.2%, 1.06 38.3%, 1.015 67.5%, 1)';

const events = ['user.login', 'role.granted', 'key.rotated', 'export.run'] as const;
const beat = 1.45;
const first = 0.3;

function lock(k: number) {
  const w = 10 * k;
  const h = 8 * k;
  return `<g fill="${accent}"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${1.6 * k}"/></g><path d="M${-w / 2 + 2 * k} ${-h / 2}V${-h / 2 - 2.5 * k}a${w / 2 - 2 * k} ${w / 2 - 2 * k} 0 0 1 ${w - 4 * k} 0V${-h / 2}" fill="none" stroke="${accent}" stroke-width="${1.6 * k}"/>`;
}

function build(name: string, width: number, height: number, origin: readonly [number, number], k: number, wide: boolean) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const sheet: readonly [number, number] = [164 * k, 92 * k];
  const stepY = 21 * k;
  const stepZ = 7 * k;
  const sheetH = 3 * k;
  const front = 38 * k;
  const pageAt = (i: number): Vec3 => [0, front - i * stepY, 5 * k + i * stepZ];
  const trayLen = sheet[1] + (events.length - 1) * stepY + 22 * k;
  const trayY = front + sheet[1] / 2 + 11 * k - trayLen / 2;
  const tray: Vec3 = [0, trayY, 0];
  const traySize: readonly [number, number] = [sheet[0] + 22 * k, trayLen];
  const src: Vec3 = [-210 * k, trayY, 4 * k];
  const srcSize = 70 * k;
  const lineArt = (id: string, at: Vec3, size: readonly [number, number], h: number) =>
    s.slab({ id, at, size, height: h, radius: Math.min(size[0], size[1]) * 0.18, top: ui.top, side: paints.flat('#f4f4f2'), outline: line, shade: false, shadow: true, edge: line });

  s.wire({ id: 'w-log', points: [[src[0] + srcSize / 2, trayY, -8 * k], [-traySize[0] / 2, trayY, -8 * k]], stroke: ui.wire, width: 1.25 });
  s.pulse({ id: 'p-log', wire: 'w-log', color: accent, length: 0.22 });

  s.group('src-g', () => {
    lineArt('src', src, [srcSize, srcSize], 20 * k);
    s.face({ id: 'src-glow', at: src, size: [srcSize, srcSize], radius: srcSize * 0.18, fill: 'rgb(99 102 241 / .16)' });
    s.text({ id: 'src-name', at: [src[0] + srcSize / 2 - 12 * k, src[1], src[2]], text: 'iam', size: wide ? 12 : 10, color: '#4b4e57', on: 'top', along: 'y', anchor: 'middle' });
  });

  s.slab({ id: 'tray', at: tray, size: traySize, height: 16 * k, radius: 14 * k, top: '#fbfbfa', side: paints.brushed(s, ramps.silver), outline: line, shade: false, edge: line });

  events.forEach((ev, i) => {
    const at = pageAt(i);
    const strip = at[1] + sheet[1] / 2 - 10 * k;
    s.group(`page-${i}`, () => {
      lineArt(`page-${i}-sheet`, at, sheet, sheetH);
      s.text({ id: `page-${i}-ev`, at: [-sheet[0] / 2 + 12 * k, strip, at[2]], text: ev, size: wide ? 11 : 10, color: '#3f3f46', on: 'top' });
      s.svg(`page-${i}-rule`, s.plane([0, 0, at[2]], [1, 2, 3].map(j => `<path d="M${-sheet[0] / 2 + 12 * k} ${strip - j * 14 * k - 2 * k}H${sheet[0] / 2 - (j === 3 ? 60 : 24) * k}" stroke="rgb(22 23 27 / .1)" stroke-width="${3 * k}" stroke-linecap="round"/>`).join('')));
      s.svg(`page-${i}-lock`, s.plane([sheet[0] / 2 - 14 * k, strip, at[2]], lock(k)));
    });
    s.pivot(`page-${i}-lock`, [sheet[0] / 2 - 14 * k, strip, at[2]]);
  });

  const right = s.project([traySize[0] / 2, trayY - trayLen / 2, 0]);
  const tag = 'append-only · 4 sealed';
  s.label({
    id: 'sealed',
    at: { screen: wide ? [fitX(right[0] + 14, tag, width, 521, 'left'), right[1] + 40 * k] : [fitX(s.project(tray)[0], tag, width, narrowest), s.project([0, trayY + trayLen / 2, -16 * k])[1] + 40 * k] },
    html: `append-only <span style="color:${accent}">· 4 sealed</span>`,
    size: 13,
    anchor: wide ? 'left' : 'top',
  });

  s.dropIn('src-g', 0.1);
  s.dropIn('tray', 0.2);
  s.introUntil(0.8);

  s.loop(8.6, 6.6);
  events.forEach((_, i) => {
    const t = first + i * beat;
    s.at('src-glow', 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at('src-glow', 'opacity', t + 0.1, 0.6, 1, 0, ease.linear);
    const dur = Math.max(0.3, s.wireLength('w-log') / 270);
    s.travel('p-log', t + 0.05, dur);
    const land = t + 0.05 + dur;
    s.dropAt(`page-${i}`, land - 0.1, 34 * k);
    s.at(`page-${i}-lock`, 'opacity', land + 0.5, 0.06, 0, 1, ease.linear);
    s.at(`page-${i}-lock`, 'scale', land + 0.5, 0.6, 0, 1, popIn);
  });
  const done = first + (events.length - 1) * beat + 1.7;
  s.at('sealed', 'opacity', done, 0.3, 0, 1, ease.out);
  s.at('sealed', 'translate', done, 0.45, wide ? '-8px 0' : '0 -8px', '0 0', ease.out);
  const clear = 7.7;
  s.at('sealed', 'opacity', clear, 0.3, 1, 0, ease.linear);
  events.forEach((_, i) => {
    const t = clear + (events.length - 1 - i) * 0.07;
    s.at(`page-${i}`, 'opacity', t, 0.3, 1, 0, ease.linear);
    s.at(`page-${i}-lock`, 'opacity', t, 0.3, 1, 0, ease.linear);
  });
  return s;
}

export const example: Example = {
  slug: 'audit-ledger',
  title: 'Audit ledger',
  story: 'Each event lands in the audit log as a new ledger page with its line printed on it, and a lock seals the page before the next one arrives.',
  prompt: 'Draw an audit log as a stack of thin ledger pages: each event drops in as a new page printed with its name, like role.granted, and a small lock seals it.',
  level: 'simple',
  category: 'security',
  layout: 'exploded',
  useCase: 'Compliance',
  surface: 'light',
  interaction: 'watch',
  art: art(build('audit-sm', 390, 400, [224, 236], 0.82, false), build('audit-lg', 720, 400, [356, 214], 1.05, true), 520),
};

export default page(example);
