import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fonts, page, ramps, surfaces, type Example, fitX, narrowest, paints } from './shared';

const ui = surfaces.dark;
const accent = '#2dd4bf';
const glow = 'rgb(45 212 191 / .26)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';

const handoff = { start: 4.5, dur: 1.2, gap: 0.22, ghosts: 4 } as const;

function build(name: string, width: number, height: number, origin: readonly [number, number], k: number) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const ground = -30 * k;
  const idAt: Vec3 = [0, 0, 50 * k];
  const idSize = 132 * k;
  const appAt: Vec3 = [214 * k, 36 * k, 0];
  const appSize = 112 * k;
  const phone = { w: 78 * k, h: 138 * k, t: 9 * k };
  const phoneAt: Vec3 = [-34 * k, 192 * k, ground + phone.h / 2];
  const tokenSize = 38 * k;
  const tokenFrom: Vec3 = [idAt[0], idAt[1], idAt[2] + 10 * k];
  const tokenTo: Vec3 = [appAt[0], appAt[1], appAt[2] + 10 * k];

  const wz = 8 * k;
  s.wire({ id: 'w-cred', points: [[phoneAt[0], phoneAt[1] - phone.t, wz], [phoneAt[0], idSize / 2, wz]], stroke: ui.wire, width: 1.25 });
  s.wire({ id: 'w-push', points: [[phoneAt[0], idSize / 2, wz], [phoneAt[0], phoneAt[1] - phone.t, wz]], stroke: 'none' });
  s.pulse({ id: 'p-cred', wire: 'w-cred', color: accent, length: 0.22 });
  s.pulse({ id: 'p-push', wire: 'w-push', color: accent, length: 0.22 });
  s.pulse({ id: 'p-ok', wire: 'w-cred', color: accent, length: 0.22 });
  s.wire({ id: 'w-app', points: [[idSize / 2, appAt[1], -12 * k], [appAt[0] - appSize / 2, appAt[1], -12 * k]], stroke: ui.wire, width: 1.25 });

  s.slab({ id: 'identity', at: idAt, size: [idSize, idSize], height: idAt[2] - ground, radius: 22 * k, top: ui.top, side: paints.gradient(s, ['#031e1d', '#06403b', '#0f766e', '#5eead4']), grain: 0.06, edge: ui.edge });
  s.face({ id: 'identity-glow', at: idAt, size: [idSize, idSize], radius: 22 * k, fill: glow });
  s.text({ id: 'identity-name', at: [idAt[0] + idSize / 2 - 16 * k, 0, idAt[2]], text: 'identity', size: 12, color: '#99f6e4', on: 'top', along: 'y', anchor: 'middle' });
  s.face({ id: 'token-slot', at: tokenFrom, size: [tokenSize + 10 * k, tokenSize + 10 * k], radius: 10 * k, stroke: 'rgb(45 212 191 / .35)', dash: '3 3' });

  s.slab({ id: 'app', at: appAt, size: [appSize, appSize], height: appAt[2] - ground, radius: 18 * k, top: ui.top, side: paints.brushed(s, ramps.graphite), grain: 0.06, edge: ui.edge });
  s.face({ id: 'app-glow', at: appAt, size: [appSize, appSize], radius: 18 * k, fill: glow });
  s.text({ id: 'app-name', at: [appAt[0] + appSize / 2 - 14 * k, appAt[1], 0], text: 'app', size: 12, color: '#d4d4d8', on: 'top', along: 'y', anchor: 'middle' });

  const screen = (w: number, h: number) =>
    `<rect x="${-w / 2 + 8 * k}" y="${-h / 2 + 16 * k}" width="${16 * k}" height="${16 * k}" rx="${8 * k}" fill="rgb(255 255 255 / .14)"/>` +
    `<rect x="${-w / 2 + 8 * k}" y="${-h / 2 + 44 * k}" width="${w - 16 * k}" height="${12 * k}" rx="${3 * k}" fill="none" stroke="rgb(255 255 255 / .18)" vector-effect="non-scaling-stroke"/>` +
    `<rect x="${-w / 2 + 8 * k}" y="${-h / 2 + 62 * k}" width="${w - 16 * k}" height="${12 * k}" rx="${3 * k}" fill="none" stroke="rgb(255 255 255 / .18)" vector-effect="non-scaling-stroke"/>` +
    [0, 1, 2, 3, 4].map(i => `<circle cx="${-w / 2 + 14 * k + i * 6 * k}" cy="${-h / 2 + 68 * k}" r="${1.6 * k}" fill="rgb(255 255 255 / .5)"/>`).join('') +
    `<rect x="${-w / 2 + 8 * k}" y="${h / 2 - 30 * k}" width="${w - 16 * k}" height="${14 * k}" rx="${4 * k}" fill="rgb(45 212 191 / .22)"/>`;
  s.panel({ id: 'phone', at: phoneAt, size: [phone.w, phone.h], thickness: phone.t, facing: 'left', radius: 12 * k, front: ui.top, side: '#2a2b33', edge: 'rgb(255 255 255 / .16)', content: screen(phone.w, phone.h) });
  s.svg('phone-btn', `<g transform="${s.planeTransform(phoneAt, 'left')}"><rect x="${-phone.w / 2 + 8 * k}" y="${phone.h / 2 - 30 * k}" width="${phone.w - 16 * k}" height="${14 * k}" rx="${4 * k}" fill="${accent}"/></g>`);

  for (let i = handoff.ghosts - 1; i >= 0; i--) s.face({ id: `ghost-${i}`, at: tokenFrom, size: [tokenSize, tokenSize], radius: 9 * k, stroke: accent, strokeWidth: 1 });
  s.group('token-move', () => {
    s.slab({ id: 'token', at: tokenFrom, size: [tokenSize, tokenSize], height: 9 * k, radius: 9 * k, top: '#ccfbf1', side: paints.gradient(s, ramps.teal), edge: 'rgb(255 255 255 / .5)', shadow: false });
  });
  s.pivot('token', [tokenFrom[0], tokenFrom[1], tokenFrom[2] - 9 * k]);

  const minPx = width > 500 ? 521 : narrowest;
  const ph = s.project([phoneAt[0] + phone.w / 2, phoneAt[1], ground]);
  const idTop = s.project(idAt);
  const app = s.project(appAt);
  s.label({ id: 'email', at: { screen: [fitX(ph[0] - 8 * k, 'ana@studio.dev', width, minPx, 'top'), ph[1] + 18 * k] }, text: 'ana@studio.dev', size: 13, anchor: 'top' });
  s.label({ id: 'pass', at: { screen: [idTop[0], idTop[1] - idSize * 0.42 - 54 * k] }, html: `password <span style="color:${accent}">✓</span>`, size: 13, anchor: 'bottom' });
  s.label({ id: 'mfa', at: { screen: [idTop[0], idTop[1] - idSize * 0.42 - 16 * k] }, html: `2-step <span style="color:${accent}">✓</span>`, size: 13, anchor: 'bottom' });
  s.label({ id: 'session', at: { screen: [fitX(app[0] - 16 * k, 'session open · 24 h', width, minPx, 'top'), app[1] + appSize * 0.42 + (width > 500 ? 24 : 40) * k] }, html: `session open <span style="color:#8b8d98">· 24 h</span>`, size: 13, anchor: 'top' });

  s.march('token-slot', 3, 3, 24);
  s.dropIn('identity', 0.1);
  s.dropIn('app', 0.25);
  s.intro('phone', 'opacity', 0.35, 0.12, 0, 1, ease.linear);
  s.intro('phone', 'translate', 0.35, 0.5, '0 20px', '0 0', ease.out);

  s.loop(9, 6.1);
  s.at('email', 'opacity', 0.1, 0.2, 0, 1, ease.out);
  s.typeIn('email', 0.1, 0.6, 14);
  s.at('email', 'opacity', 7.7, 0.4, 1, 0, ease.linear);

  const flash = (id: string, t: number, hold = 0) => {
    s.at(id, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at(id, 'opacity', t + 0.1 + hold, 0.6, 1, 0, ease.linear);
  };
  const credDur = Math.max(0.3, s.wireLength('w-cred') / 270);
  flash('phone-btn', 0.8);
  s.travel('p-cred', 0.85, credDur);
  const passAt = 0.85 + credDur;
  flash('identity-glow', passAt);
  s.tug('identity', passAt, '0 4px');
  s.at('pass', 'opacity', passAt + 0.05, 0.25, 0, 1, ease.out);
  s.at('pass', 'translate', passAt + 0.05, 0.4, '0 6px', '0 0', ease.out);

  const pushAt = passAt + 0.7;
  s.travel('p-push', pushAt, credDur);
  flash('phone-btn', pushAt + credDur, 0.3);
  s.at('phone', 'translate', pushAt + credDur, 0.3, '0 0', '0 -5px', pull);
  s.at('phone', 'translate', pushAt + credDur + 0.3, 0.74, '0 -5px', '0 0', settle);
  const okAt = pushAt + credDur + 0.5;
  s.travel('p-ok', okAt, credDur);
  const mfaAt = okAt + credDur;
  flash('identity-glow', mfaAt);
  s.at('mfa', 'opacity', mfaAt + 0.05, 0.25, 0, 1, ease.out);
  s.at('mfa', 'translate', mfaAt + 0.05, 0.4, '0 6px', '0 0', ease.out);

  const mint = handoff.start - 0.5;
  s.at('token', 'opacity', mint, 0.1, 0, 1, ease.linear);
  s.at('token', 'scale', mint, 0.23, 0.05, 1.14, ease.out);
  s.at('token', 'scale', mint + 0.23, 0.24, 1.14, 1, ease.io);
  s.at('token-slot', 'opacity', mint, 0.3, 1, 0.25, ease.linear);
  s.at('token-slot', 'opacity', 8.2, 0.5, 0.25, 1, ease.linear);

  const move = s.offset(tokenFrom, tokenTo);
  for (let i = 0; i < handoff.ghosts; i++) {
    const t = handoff.start + i * handoff.gap;
    const peak = 1 - 0.22 * i;
    s.at(`ghost-${i}`, 'opacity', t, 0.12, 0, peak, ease.linear);
    s.at(`ghost-${i}`, 'translate', t, handoff.dur, '0 0', move, ease.io);
    s.at(`ghost-${i}`, 'opacity', t + handoff.dur - 0.3, 0.3, peak, 0, ease.linear);
    s.set(`ghost-${i}`, 'translate', t + handoff.dur + 0.05, '0 0');
  }
  s.at('token-move', 'translate', handoff.start, handoff.dur, '0 0', move, ease.io);
  const land = handoff.start + handoff.dur;
  s.at('token', 'scale', land, 0.12, 1, '1.08 0.9', ease.out);
  s.at('token', 'scale', land + 0.12, 0.3, '1.08 0.9', 1, ease.settle);
  s.tug('app', land, '0 5px');
  s.at('app-glow', 'opacity', land, 0.1, 0, 1, ease.linear);
  s.at('app-glow', 'opacity', 7.7, 0.6, 1, 0, ease.linear);
  s.at('session', 'opacity', land + 0.15, 0.3, 0, 1, ease.out);
  s.at('session', 'translate', land + 0.15, 0.45, '0 -6px', '0 0', ease.out);

  for (const id of ['pass', 'mfa', 'session']) s.at(id, 'opacity', 7.7, 0.4, 1, 0, ease.linear);
  s.at('token', 'opacity', 7.7, 0.4, 1, 0, ease.linear);
  s.set('token-move', 'translate', 8.2, '0 0');
  return s;
}

export const example: Example = {
  slug: 'auth-flow',
  title: 'Sign-in with 2-step',
  ask: 'Show sign-in with a password and a second factor.',
  story: 'A sign-in passes password and a second factor, and the identity service hands the app a session token.',
  prompt: 'Draw a sign-in flow: a phone sends credentials to an identity service, which checks the password and a push approval, then hands a token tile to the app to open a session.',
  level: 'medium',
  intent: 'talk',
  layout: 'panels',
  useCase: 'Auth',
  surface: 'dark',
  interaction: 'watch',
  art: art(build('auth-sm', 390, 480, [196, 232], 0.86), build('auth-lg', 720, 420, [376, 200], 1), 520),
};

export default page(example);
