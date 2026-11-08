import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fonts, n, page, paints, surfaces, type Example } from './shared';

const ui = surfaces.light;
const accent = '#6366f1';
const line = 'rgb(22 23 27 / .4)';
const away = 'cubic-bezier(.33,0,.91,.03)';

const letters = 5;
const jitter = [[0, 0], [5, -3], [-3, 4], [4, -2], [-2, 3]] as const;

function build(name: string, width: number, height: number, origin: readonly [number, number]) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const [w, d] = [172, 132];
  const wall = 30;
  const t = 6;
  const card: Vec2 = [128, 92];
  const pitch = 8;
  const floor = 6;
  const glass = paints.glass(s, '#c7d2fe', 0.34);
  const side = paints.flat('#f1f1f3');
  const box = (id: string, at: Vec3, size: Vec2, height: number, front: boolean) =>
    s.slab({ id, at, size, height, radius: 3, top: front ? 'rgb(255 255 255 / .7)' : ui.top, side: front ? glass : side, edge: line, outline: line, shade: false, shadow: false, translucent: front });

  s.slab({ id: 'floor', at: [0, 0, 0], size: [w, d], height: floor, radius: 6, top: '#fafafa', side, edge: line, outline: line, shade: false });
  box('wall-back', [0, -d / 2 + t / 2, wall], [w, t], wall, false);
  box('wall-left', [-w / 2 + t / 2, 0, wall], [t, d - 2 * t], wall, false);

  const flap = `<path d="M${-card[0] / 2 + 6} ${-card[1] / 2 + 6}L0 6L${card[0] / 2 - 6} ${-card[1] / 2 + 6}" fill="none" stroke="${line}" stroke-width="1" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`;
  for (let i = 0; i < letters; i++) {
    const [jx, jy] = jitter[i]!;
    const at: Vec3 = [4 + jx, 2 + jy, 5 + i * pitch];
    s.group(`letter-${i}`, () => {
      s.slab({ id: `letter-${i}-card`, at, size: card, height: 4, radius: 5, top: ui.top, side, edge: line, outline: line, shade: false, shadow: false, content: flap });
      s.face({ id: `letter-${i}-seal`, at: [at[0], at[1] + 6, at[2]], size: [12, 12], radius: 6, fill: accent });
    });
  }

  box('wall-right', [w / 2 - t / 2, 0, wall], [t, d - 2 * t], wall, true);
  box('wall-front', [0, d / 2 - t / 2, wall], [w, t], wall, true);

  s.dropIn('floor', 0.1);
  for (const [i, id] of ['wall-back', 'wall-left', 'wall-right', 'wall-front'].entries()) s.dropIn(id, 0.18 + i * 0.083);
  s.introUntil(0.9);

  const gap = 0.62;
  const first = 0.35;
  const full = first + (letters - 1) * gap + 0.4;
  const clear = 5.3;
  s.loop(7, full + 0.6);
  for (let i = 0; i < letters; i++) {
    const id = `letter-${i}`;
    s.dropAt(id, first + i * gap, 52);
    if (i < letters - 1) s.at(`${id}-seal`, 'opacity', first + (i + 1) * gap + 0.3, 0.3, 1, 0, ease.linear);
    const out = clear + (letters - 1 - i) * 0.06;
    s.at(id, 'translate', out, 0.4, '0 0', '0 -18px', away);
    s.at(id, 'opacity', out + 0.05, 0.3, 1, 0, ease.linear);
    s.set(`${id}-seal`, 'opacity', out + 0.4, 1);
  }
  return s;
}

export const example: Example = {
  slug: 'inbox-fill',
  title: 'Inbox filling up',
  ask: 'An inbox filling up.',
  story: 'Letters drop one by one into a glass-fronted tray and stack up, hold full, then the tray empties.',
  prompt: 'Draw a mail tray that slowly fills as letters drop in and stack, holds full, then empties back to the start.',
  level: 'spot',
  layout: 'object',
  useCase: 'Messaging',
  surface: 'light',
  interaction: 'watch',
  art: art(build('spot-inbox', 390, 300, [195, 166])),
};

export default page(example);
