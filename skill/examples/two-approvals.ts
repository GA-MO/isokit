import { Scene, ease, type Vec3 } from '../lib/iso.ts';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared.ts';

const ui = surfaces.light;
const accent = '#4f46e5';
const ok = '#10b981';
const okInk = '#047857';
const dim = 'rgb(22 23 27 / .1)';
const line = 'rgb(22 23 27 / .14)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pop = 'cubic-bezier(.3,1.4,.5,1)';

const reviewers = [
  { id: 'a', name: 'maya', x: 110 },
  { id: 'b', name: 'leo', x: 252 },
] as const;

function build(name: string, width: number, height: number, origin: readonly [number, number], k: number) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const v = (x: number, y: number, z = 0): Vec3 => [x * k, y * k, z * k];
  const minPx = width > 500 ? 521 : narrowest;
  const req = { y: 150, w: 150 * k, h: 170 * k, t: 8 * k };
  const reqAt = v(0, req.y, 85);
  const rev = { w: 112 * k, h: 124 * k, t: 8 * k };
  const revAt = (x: number) => v(x, 0, 62);
  const mainAt = v(196, 160, 0);
  const mainSize = 104 * k;
  const onReq = (u: number, vv: number): Vec3 => [reqAt[0], reqAt[1] - u, reqAt[2] - vv];
  const reqPlane = (u: number, vv: number) => s.planeTransform(onReq(u, vv), 'right');
  const onRev = (x: number, u: number, vv: number): Vec3 => [revAt(x)[0] + u, 0, revAt(x)[2] - vv];
  const revPlane = (x: number, u: number, vv: number) => s.planeTransform(onRev(x, u, vv), 'left');

  const lanes = [118, 96];
  reviewers.forEach((r, i) => {
    const pts = [v(6, lanes[i]!), v(r.x, lanes[i]!), v(r.x, 6)];
    s.wire({ id: `w-${r.id}`, points: pts, stroke: ui.wire, width: 1.25, joins: ['req', `rev-${r.id}`] });
    s.wire({ id: `w-${r.id}-back`, points: [...pts].reverse(), stroke: 'none', joins: [`rev-${r.id}`, 'req'] });
    s.pulse({ id: `ask-${r.id}`, wire: `w-${r.id}`, color: accent, length: 0.2 });
    s.pulse({ id: `yes-${r.id}`, wire: `w-${r.id}-back`, color: ok, length: 0.2 });
  });
  s.wire({ id: 'w-main', points: [v(6, 180), v(196 - 52, 180)], stroke: ui.wire, width: 1.25, hidden: true, joins: ['req', 'main'] });
  s.pulse({ id: 'ship', wire: 'w-main', color: ok, length: 0.3 });

  reviewers.forEach(r => {
    const [W, H] = [rev.w, rev.h];
    const content =
      `<circle cx="${-W / 2 + 18 * k}" cy="${-H / 2 + 20 * k}" r="${8 * k}" fill="rgb(22 23 27 / .08)"/>` +
      `<text x="${-W / 2 + 32 * k}" y="${-H / 2 + 20 * k}" font-size="${12 * k}" fill="#3f3f46" dominant-baseline="central" style="font-family:var(--iso-mono)">${r.name}</text>` +
      [0, 1].map(i => `<rect x="${-W / 2 + 12 * k}" y="${-H / 2 + (42 + i * 12) * k}" width="${(i ? 56 : 80) * k}" height="${4 * k}" rx="${2 * k}" fill="${dim}"/>`).join('') +
      `<circle cx="0" cy="${H / 2 - 30 * k}" r="${14 * k}" fill="none" stroke="rgb(22 23 27 / .2)" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
    s.panel({ id: `rev-${r.id}`, at: revAt(r.x), size: [W, H], thickness: rev.t, facing: 'left', radius: 14 * k, front: ui.top, side: '#d4d4d8', edge: line, content });
    s.svg(`rev-${r.id}-glow`, `<g transform="${revPlane(r.x, 0, 0)}"><rect x="${-W / 2}" y="${-H / 2}" width="${W}" height="${H}" rx="${14 * k}" fill="rgb(99 102 241 / .1)" stroke="${accent}" stroke-width="1" vector-effect="non-scaling-stroke"/></g>`);
    s.svg(`tick-${r.id}`, `<g transform="${revPlane(r.x, 0, H / 2 - 30 * k)}"><circle r="${14 * k}" fill="${ok}"/><path d="M${-6 * k} ${0.5 * k}l${4 * k} ${4 * k}l${8 * k} ${-9 * k}" fill="none" stroke="#ffffff" stroke-width="${2.4 * k}" stroke-linecap="round" stroke-linejoin="round"/></g>`);
  });

  s.slab({ id: 'main', at: mainAt, size: [mainSize, mainSize], height: 26 * k, radius: 18 * k, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.06, edge: ui.edge, outline: line });
  s.face({ id: 'main-glow', at: mainAt, size: [mainSize, mainSize], radius: 18 * k, fill: 'rgb(16 185 129 / .16)', stroke: ok });
  s.text({ id: 'main-name', at: [mainAt[0] + mainSize / 2 - 16 * k, mainAt[1], mainAt[2]], text: 'main', size: 12, color: '#4b4e57', on: 'top', along: 'y', anchor: 'middle' });

  const [W, H] = [req.w, req.h];
  const lockV = H / 2 - 30 * k;
  const lockU = -W / 2 + 34 * k;
  const pips = [W / 2 - 44 * k, W / 2 - 28 * k];
  const reqContent =
    `<text x="${-W / 2 + 14 * k}" y="${-H / 2 + 20 * k}" font-size="${12 * k}" fill="#312e81" dominant-baseline="central" style="font-family:var(--iso-mono)">#482</text>` +
    [0, 1, 2].map(i => `<rect x="${-W / 2 + 14 * k}" y="${-H / 2 + (40 + i * 12) * k}" width="${[110, 84, 96][i]! * k}" height="${4 * k}" rx="${2 * k}" fill="${dim}"/>`).join('') +
    pips.map(u => `<circle cx="${u}" cy="${lockV}" r="${4.5 * k}" fill="none" stroke="rgb(22 23 27 / .25)" stroke-width="1" vector-effect="non-scaling-stroke"/>`).join('') +
    `<rect x="${-W / 2 + 14 * k}" y="${lockV - 14 * k}" width="${W - 28 * k}" height="${28 * k}" rx="${8 * k}" fill="rgb(22 23 27 / .03)" stroke="rgb(22 23 27 / .12)" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
  s.panel({ id: 'req', at: reqAt, size: [W, H], thickness: req.t, facing: 'right', radius: 16 * k, front: ui.top, side: '#4338ca', edge: 'rgb(67 56 202 / .4)', content: reqContent });
  pips.forEach((u, i) => s.svg(`pip-${i}`, `<g transform="${reqPlane(u, lockV)}"><circle r="${4.5 * k}" fill="${ok}"/></g>`));
  s.svg('merge-on', `<g transform="${reqPlane(0, lockV)}"><rect x="${-W / 2 + 14 * k}" y="${-14 * k}" width="${W - 28 * k}" height="${28 * k}" rx="${8 * k}" fill="rgb(16 185 129 / .16)" stroke="${ok}" stroke-width="1" vector-effect="non-scaling-stroke"/></g>`);
  const body = `<rect x="${-7 * k}" y="${-2 * k}" width="${14 * k}" height="${11 * k}" rx="${2.5 * k}"/>`;
  const shackle = `<path d="M${-4.5 * k} ${-2 * k}v${-3 * k}a${4.5 * k} ${4.5 * k} 0 0 1 ${9 * k} 0v${3 * k}" fill="none" stroke-width="${2 * k}" stroke-linecap="round"/>`;
  s.svg('lock-shut', `<g transform="${reqPlane(lockU, lockV - 2 * k)}"><g fill="#71717a" stroke="#71717a">${body}${shackle}</g></g>`);
  s.svg('lock-open', `<g transform="${reqPlane(lockU, lockV - 2 * k)}"><g fill="${ok}" stroke="${ok}">${body}<path d="M${-4.5 * k} ${-7 * k}v${-3 * k}a${4.5 * k} ${4.5 * k} 0 0 1 ${9 * k} 0" fill="none" stroke-width="${2 * k}" stroke-linecap="round"/></g></g>`);

  const reqTop = s.project(onReq(0, -H / 2));
  const reqHigh = s.project(onReq(W / 2, -H / 2))[1];
  const counts = ['0/2', '1/2', '2/2'] as const;
  counts.forEach((c, i) => {
    const text = `approvals ${c}`;
    s.label({ id: `count-${i}`, at: { screen: [fitX(reqTop[0], text, width, minPx, 'center'), reqHigh - 12 * k] }, html: `approvals <span style="color:${i === 2 ? okInk : ui.muted}">${c}</span>`, size: 13, anchor: 'bottom' });
  });
  reviewers.forEach(r => {
    const top = s.project(onRev(r.x, 0, -rev.h / 2));
    const high = s.project(onRev(r.x, -rev.w / 2, -rev.h / 2))[1];
    s.label({ id: `ok-${r.id}`, at: { screen: [fitX(top[0], `${r.name} ✓`, width, minPx, 'center'), high - 10 * k] }, html: `${r.name} <span style="color:${okInk}">✓</span>`, size: 13, anchor: 'bottom' });
  });
  const mainRight = s.project([mainAt[0] + mainSize / 2, mainAt[1] - mainSize / 2, mainAt[2] - 13 * k]);
  const mainFront = s.project([mainAt[0] + mainSize / 2, mainAt[1] + mainSize / 2, mainAt[2] - 26 * k]);
  const mergedAt: readonly [number, number] = width > 500 ? [fitX(mainRight[0] + 14 * k, 'merged to main', width, minPx, 'left'), mainRight[1] + 20 * k] : [fitX(mainFront[0], 'merged to main', width, minPx, 'center'), mainFront[1] + 16];
  s.label({ id: 'merged', at: { screen: mergedAt }, html: `<span style="color:${okInk}">merged</span> to main`, size: 13, anchor: width > 500 ? 'left' : 'top' });

  s.intro('req', 'opacity', 0.1, 0.12, 0, 1, ease.linear);
  s.intro('req', 'translate', 0.1, 0.5, '0 20px', '0 0', ease.out);
  reviewers.forEach((r, i) => {
    s.intro(`rev-${r.id}`, 'opacity', 0.27 + i * 0.17, 0.12, 0, 1, ease.linear);
    s.intro(`rev-${r.id}`, 'translate', 0.27 + i * 0.17, 0.5, '0 20px', '0 0', ease.out);
  });
  s.dropIn('main', 0.55);
  s.intro('count-0', 'opacity', 0.6, 0.3, 0, 1, ease.out);

  const L = 11;
  s.loop(L, 7.4);
  const flash = (id: string, t: number, hold = 0) => {
    s.at(id, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at(id, 'opacity', t + 0.1 + hold, 0.6, 1, 0, ease.linear);
  };
  const dur = (wire: string) => Math.max(0.3, s.wireLength(wire) / 270);
  const end = 9.8;
  const swap = (from: string, to: string, t: number) => {
    s.at(from, 'opacity', t, 0.3, 1, 0, ease.linear);
    s.at(to, 'opacity', t, 0.3, 0, 1, ease.linear);
    s.at(to, 'translate', t, 0.4, '0 6px', '0 0', ease.out);
  };

  let lastYes = 0;
  const approveAt = [1.7, 3.9];
  reviewers.forEach((r, i) => {
    const d = dur(`w-${r.id}`);
    s.travel(`ask-${r.id}`, 0.3, d);
    flash(`rev-${r.id}-glow`, 0.3 + d, 0.2);
    const t = approveAt[i]!;
    s.at(`tick-${r.id}`, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at(`tick-${r.id}`, 'scale', t, 0.23, 0.05, 1.14, ease.out);
    s.at(`tick-${r.id}`, 'scale', t + 0.23, 0.24, 1.14, 1, ease.io);
    s.at(`tick-${r.id}`, 'opacity', end, 0.5, 1, 0, ease.linear);
    s.at(`ok-${r.id}`, 'opacity', t + 0.1, 0.3, 0, 1, ease.out);
    s.at(`ok-${r.id}`, 'translate', t + 0.1, 0.45, '0 6px', '0 0', ease.out);
    s.at(`ok-${r.id}`, 'opacity', end, 0.4, 1, 0, ease.linear);
    s.travel(`yes-${r.id}`, t + 0.35, d);
    const arrive = t + 0.35 + d;
    s.at(`pip-${i}`, 'opacity', arrive, 0.1, 0, 1, ease.linear);
    s.at(`pip-${i}`, 'opacity', end, 0.5, 1, 0, ease.linear);
    s.tug('req', arrive, '-4px 2px');
    swap(`count-${i}`, `count-${i + 1}`, arrive + 0.05);
    lastYes = arrive;
  });
  const firstYes = approveAt[0]! + 0.35 + dur('w-a') + 0.05;
  s.at('lock-shut', 'translate', firstYes, 0.08, '0 0', '2px 0', ease.linear);
  s.at('lock-shut', 'translate', firstYes + 0.08, 0.08, '2px 0', '-2px 0', ease.linear);
  s.at('lock-shut', 'translate', firstYes + 0.16, 0.12, '-2px 0', '0 0', ease.out);

  const unlock = lastYes + 0.45;
  s.at('lock-shut', 'opacity', unlock, 0.25, 1, 0, ease.linear);
  s.at('lock-open', 'opacity', unlock, 0.25, 0, 1, ease.linear);
  s.at('lock-open', 'translate', unlock, 0.35, '0 2px', '0 0', pop);
  s.at('merge-on', 'opacity', unlock, 0.3, 0, 1, ease.linear);
  const go = unlock + 0.5;
  s.draw('w-main', go, 0.24);
  const shipDur = dur('w-main');
  s.travel('ship', go + 0.24, shipDur);
  const land = go + 0.24 + shipDur;
  s.at('main-glow', 'opacity', land, 0.1, 0, 1, ease.linear);
  s.tug('main', land, '0 5px');
  s.at('merged', 'opacity', land + 0.1, 0.3, 0, 1, ease.out);
  s.at('merged', 'translate', land + 0.1, 0.45, width > 500 ? '-6px 0' : '0 -6px', '0 0', ease.out);

  for (const id of ['lock-open', 'merge-on', 'main-glow', 'merged', 'count-2']) s.at(id, 'opacity', end, 0.5, 1, 0, ease.linear);
  s.at('lock-shut', 'opacity', end, 0.5, 0, 1, ease.linear);
  s.at('count-0', 'opacity', end + 0.3, 0.4, 0, 1, ease.out);
  s.retract('w-main', end, 0.4, 'end', settle);
  return s;
}

export const example: Example = {
  slug: 'two-approvals',
  title: 'Two-person approval',
  ask: 'Show a change that needs two approvals to merge.',
  story: 'A change request asks two reviewers; each approves in turn, and only after the second tick does its lock open and the change merge.',
  prompt: 'Draw a change request panel facing two reviewer panels: each reviewer approves in turn with a tick, and only when both have approved does the request unlock and merge into main.',
  level: 'medium',
  intent: 'talk',
  layout: 'panels',
  useCase: 'Approvals',
  surface: 'light',
  interaction: 'watch',
  art: art(build('approve-sm', 390, 430, [170, 196], 0.82), build('approve-lg', 720, 420, [328, 176], 0.92), 520),
};

export default page(example);
