import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const ink = '#4b4e57';
const ok = '#047857';
const accent = '#4f46e5';
const line = 'rgb(22 23 27 / .22)';
const tint = 'rgb(99 102 241 / .22)';
const okTint = 'rgb(16 185 129 / .24)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const merge = 'cubic-bezier(.52,.18,.25,1)';

const gates = [
  { id: 'lint', y: -160, wait: 'lint', pass: 'lint' },
  { id: 'test', y: -40, wait: 'test', pass: '248 passed' },
  { id: 'review', y: 80, wait: 'review', pass: 'approved' },
] as const;
const startY = -285;
const mainY = 228;
const hops = [0.5, 2.3, 4.1] as const;
const glide = 0.9;
const toMain = 5.9;
const toMainDur = 1.05;
const landed = toMain + toMainDur;

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: Vec2;
  k: number;
  minPx: number;
  checks: { kind: 'beside' } | { kind: 'row'; y: number };
  merged: 'right' | 'below';
}

function build({ name, width, height, origin, k, minPx, checks, merged: mergedAt }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const pad = 92 * k;
  const padH = 6 * k;
  const gateH = 46 * k;
  const gateSize = 84 * k;
  const diff = 66 * k;
  const diffH = 14 * k;
  const mainSize = 136 * k;
  const mainH = 30 * k;
  const print = width > 520 ? 12 : 11;
  const slot = (y: number, base = padH): Vec3 => [0, y * k, base + diffH];
  const start = slot(startY, 0);
  const onMain: Vec3 = [0, mainY * k, mainH + diffH];

  s.wire({ id: 'track', points: [[0, (startY + 30) * k, 0], [0, (mainY - 60) * k, 0]], stroke: ui.wire, width: 1.25, dash: '4 4' });

  s.face({ id: 'origin', at: [0, startY * k, 0], size: [diff + 12 * k, diff + 12 * k], radius: 12 * k, stroke: 'rgb(79 70 229 / .45)', dash: '4 4' });
  gates.forEach(g => {
    const at: Vec3 = [0, g.y * k, padH];
    s.slab({ id: `${g.id}-pad`, at, size: [pad, pad], height: padH, radius: 14 * k, top: ui.top, side: paints.flat('#f1f1f3'), outline: line, edge: line, shade: false, shadow: false });
    s.face({ id: `${g.id}-lit`, at, size: [pad, pad], radius: 14 * k, fill: okTint });
  });
  s.slab({ id: 'main', at: [0, mainY * k, mainH], size: [mainSize, mainSize], height: mainH, radius: 22 * k, top: ui.top, side: paints.brushed(s, ramps.silver), outline: line, edge: line, grain: 0.05 });
  s.face({ id: 'main-hit', at: [0, mainY * k, mainH], size: [mainSize, mainSize], radius: 22 * k, fill: tint });
  s.text({ id: 'main-name', at: [mainSize / 2 - 14 * k, mainY * k, mainH], text: 'main', size: print + 1, color: ink, on: 'top', along: 'y', anchor: 'middle' });

  gates.forEach(g => {
    const at: Vec3 = [0, g.y * k, padH + gateH];
    s.frame({ id: `${g.id}-gate`, at, size: [gateSize, gateSize], height: gateH, radius: 12 * k, stroke: 'rgb(22 23 27 / .3)', dash: '3 3', edges: ['left', 'right', 'back'], bottom: false });
    s.frame({ id: `${g.id}-pass`, at, size: [gateSize, gateSize], height: gateH, radius: 12 * k, stroke: 'rgb(4 120 87 / .7)', dash: '1 0', width: 1.25, edges: ['left', 'right', 'back'], bottom: false });
  });
  s.group('diff-move', () => {
    s.group('diff', () => {
      s.slab({ id: 'diff-slab', at: start, size: [diff, diff], height: diffH, radius: 11 * k, top: ui.top, side: paints.gradient(s, ramps.indigo), edge: 'rgb(255 255 255 / .9)', outline: 'rgb(55 48 163 / .35)', shadow: true });
      const t = print - 1;
      s.text({ id: 'diff-add', at: [start[0], start[1] + 0.9 * t, start[2]], text: '+24', size: t, color: ok, on: 'top', along: 'y', anchor: 'middle', weight: 600 });
      s.text({ id: 'diff-del', at: [start[0], start[1] - 1.2 * t, start[2]], text: '−6', size: t, color: '#be123c', on: 'top', along: 'y', anchor: 'middle', weight: 600 });
    });
  });
  s.pivot('diff', [start[0], start[1], start[2] - diffH]);


  gates.forEach((g, i) => {
    const pass = checks.kind === 'row' ? g.wait : g.pass;
    const [x, y] = s.project([pad / 2 + 14 * k, g.y * k, 0]);
    const at: Vec2 = checks.kind === 'row' ? [width / 2 + (i - 1) * 96, checks.y] : [fitX(x, `✓ ${pass}`, width, minPx, 'left'), y];
    const anchor = checks.kind === 'row' ? 'center' : 'left';
    s.label({ id: `${g.id}-wait`, at: { screen: at }, html: `<span style="color:${ink}">${g.wait}</span>`, size: 13, anchor });
    s.label({ id: `${g.id}-ok`, at: { screen: at }, html: `<span style="color:${ok}">✓</span> ${pass}`, size: 13, anchor });
  });
  const pr = 'PR #482 · retry backoff';
  const [px, py] = s.project([0, startY * k, 0]);
  s.label({ id: 'pr', at: { screen: [fitX(px, pr, width, minPx), py - 40 * k] }, text: pr, size: 13, anchor: 'bottom' });
  const merged = 'merged · main @ 3f9a2c1';
  const [mx, my] = s.project([mainSize / 2 + 34 * k, mainY * k, 0]);
  const front = s.extremes([0, mainY * k, 0], [mainSize, mainSize], 22 * k).front;
  const mergedScreen: Vec2 = mergedAt === 'right' ? [fitX(mx, `⤵ ${merged}`, width, minPx, 'left'), my] : [fitX(front[0], `⤵ ${merged}`, width, minPx), front[1] + 16];
  s.label({ id: 'merged', at: { screen: mergedScreen }, html: `<span style="color:${accent}">⤵</span> ${merged}`, size: 13, anchor: mergedAt === 'right' ? 'left' : 'top' });

  gates.forEach((g, i) => s.dropIn(`${g.id}-pad`, 0.1 + i * 0.083));
  s.dropIn('main', 0.35);
  s.dropIn('diff', 0.55);
  s.intro('pr', 'opacity', 0.7, 0.3, 0, 1, ease.out);
  s.intro('pr', 'translate', 0.7, 0.4, '0 8px', '0 0', ease.out);
  gates.forEach((g, i) => s.intro(`${g.id}-wait`, 'opacity', 0.5 + i * 0.083, 0.3, 0, 1, ease.out));
  s.introUntil(1.1);

  s.loop(10, landed + 0.9);
  const at = (i: number) => (i < 0 ? start : slot(gates[i]!.y));
  hops.forEach((h, i) => {
    const g = gates[i]!;
    const arrive = h + glide;
    s.at('diff-move', 'translate', h, glide, s.offset(start, at(i - 1)), s.offset(start, at(i)), settle);
    s.at(`${g.id}-pass`, 'opacity', arrive - 0.05, 0.35, 0, 1, ease.linear);
    s.at(`${g.id}-gate`, 'opacity', arrive - 0.05, 0.35, 1, 0, ease.linear);
    s.at(`${g.id}-lit`, 'opacity', arrive, 0.1, 0, 1, ease.linear);
    s.at(`${g.id}-lit`, 'opacity', arrive + 0.1, 0.9, 1, 0.45, ease.linear);
    s.at(`${g.id}-wait`, 'opacity', arrive + 0.05, 0.2, 1, 0, ease.linear);
    s.at(`${g.id}-ok`, 'opacity', arrive + 0.1, 0.3, 0, 1, ease.out);
    s.at(`${g.id}-ok`, 'translate', arrive + 0.1, 0.45, checks.kind === 'row' ? '0 6px' : '-6px 0', '0 0', ease.out);
    s.at('diff', 'scale', arrive - 0.06, 0.12, 1, '1.04 0.92', ease.out);
    s.at('diff', 'scale', arrive + 0.06, 0.3, '1.04 0.92', 1, ease.settle);
  });
  s.at('origin', 'opacity', hops[0] + 0.2, 0.5, 1, 0.35, ease.linear);

  s.at('diff-move', 'translate', toMain, toMainDur, s.offset(start, at(2)), s.offset(start, onMain), settle);
  s.at('diff', 'translate', landed + 0.15, 0.6, '0 0', `0 ${diffH}px`, merge);
  s.at('diff', 'opacity', landed + 0.35, 0.4, 1, 0, ease.linear);
  s.at('main-hit', 'opacity', landed + 0.55, 0.1, 0, 1, ease.linear);
  s.at('main-hit', 'opacity', landed + 0.65, 0.7, 1, 0, ease.linear);
  s.at('main', 'translate', landed + 0.55, 0.14, '0 0', '0 4px', ease.out);
  s.at('main', 'translate', landed + 0.69, 0.74, '0 4px', '0 0', settle);
  s.at('merged', 'opacity', landed + 0.6, 0.3, 0, 1, ease.out);
  s.at('merged', 'translate', landed + 0.6, 0.45, mergedAt === 'right' ? '-8px 0' : '0 -8px', '0 0', ease.out);

  const clear = 8.7;
  s.at('merged', 'opacity', clear, 0.35, 1, 0, ease.linear);
  gates.forEach((g, i) => {
    const t = clear + 0.1 + i * 0.08;
    s.at(`${g.id}-pass`, 'opacity', t, 0.4, 1, 0, ease.linear);
    s.at(`${g.id}-gate`, 'opacity', t, 0.4, 0, 1, ease.linear);
    s.at(`${g.id}-lit`, 'opacity', t, 0.4, 0.45, 0, ease.linear);
    s.at(`${g.id}-ok`, 'opacity', t, 0.3, 1, 0, ease.linear);
    s.at(`${g.id}-wait`, 'opacity', t + 0.2, 0.3, 0, 1, ease.linear);
  });
  s.at('origin', 'opacity', clear + 0.3, 0.4, 0.35, 1, ease.linear);
  s.set('diff-move', 'translate', clear + 0.4, '0 0');
  s.set('diff', 'translate', clear + 0.4, '0 0');
  s.dropAt('diff', clear + 0.5, 30 * k);
  return s;
}

export const example: Example = {
  slug: 'diff-merge',
  title: 'Diff through checks',
  story: 'A diff glides through lint, test and review, each gate turning green as it passes, then sinks into main.',
  prompt: 'Draw a pull request as a small diff tile gliding down a diagonal track through three check gates (lint, test, review) that turn green one by one, then merging into a larger main tile.',
  level: 'simple',
  category: 'infra',
  layout: 'diagonal',
  useCase: 'Code review',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build({ name: 'merge-sm', width: 390, height: 410, origin: [214, 178], k: 0.64, minPx: narrowest, checks: { kind: 'row', y: 380 }, merged: 'below' }),
    build({ name: 'merge-lg', width: 720, height: 400, origin: [344, 200], k: 0.9, minPx: 521, checks: { kind: 'beside' }, merged: 'right' }),
    520,
  ),
};

export default page(example);
