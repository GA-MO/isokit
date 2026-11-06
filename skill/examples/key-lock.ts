import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, n, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.dark;
const violet = ramps.violet;
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';

function build(name: string, width: number, height: number, origin: readonly [number, number]) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const [w, d, h] = [128, 56, 96];
  const top: Vec3 = [0, 0, 0];
  const a = 40;
  const rise = 18;
  const bar = 13;
  const lift = 22;

  const [ox, oy] = s.project(top);
  const lineAt = (x: number) => oy + (x - ox) * s.ratio;
  // The clip rides with the shackle, so it moves down by as much as the shackle rises: its edge stays on the body's top face.
  const clip = (raised: number) => `polygon(0px 0px, ${width}px 0px, ${width}px ${n(lineAt(width) + raised)}px, 0px ${n(lineAt(0) + raised)}px)`;
  const leg = (dy: number, stroke: string, sw: number, dx = 0) =>
    `<path d="M${-a + dx} ${46 + dy}V${-rise + dy}A${a} ${a} 0 0 1 ${a + dx} ${-rise + dy}V${6 + dy}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;

  s.group('lock', () => {
    s.slab({ id: 'body', at: top, size: [w, d], height: h, radius: 16, top: ui.top, side: paints.gradient(s, violet), grain: 0.06, edge: ui.edge });
    s.face({ id: 'body-glow', at: top, size: [w, d], radius: 16, fill: 'rgb(167 139 250 / .32)' });
    const hole = (fill: string) => s.plane([0, d / 2, -h * 0.42], `<circle cx="0" cy="-6" r="7.5" fill="${fill}"/><path d="M-3.5 -2L3.5 -2L5.5 15Q5.6 16.5 4 16.5H-4Q-5.6 16.5 -5.5 15Z" fill="${fill}"/>`, 'left');
    s.svg('keyhole', hole('#140a2e'));
    s.svg('keyhole-lit', hole('#ede9fe'));
    s.svg(
      'shackle',
      `<rect width="${width}" height="${height}" fill="none"/>` +
        s.plane([0, -4, 0], leg(0, '#3f3f46', bar), 'left') +
        s.plane(top, leg(0, '#a1a1aa', bar) + leg(0, '#e4e4e7', 4.5, -3) + leg(0, '#ffffff', 1.5, -4), 'left'),
    );
  });

  const text = 'locked';
  const [lx, ly] = s.project([w / 2 + 6, -d / 2, -h * 0.46]);
  s.label({ id: 'state', at: { screen: [fitX(lx + 6, text, width, narrowest, 'left'), ly] }, text, size: 13, anchor: 'left' });

  s.dropIn('lock', 0.1);
  s.introUntil(0.8);

  s.loop(6, 2);
  const shut = 0.5;
  const fall = 0.4;
  const click = shut + fall;
  s.at('shackle', 'translate', shut, fall, `0 ${-lift}px`, '0 0', pull);
  s.at('shackle', 'clipPath', shut, fall, clip(lift), clip(0), pull);
  s.at('lock', 'translate', click - 0.02, 0.14, '0 0', '0 3px', ease.out);
  s.at('lock', 'translate', click + 0.12, 0.74, '0 3px', '0 0', settle);
  s.at('body-glow', 'opacity', click, 0.1, 0, 1, ease.linear);
  s.at('body-glow', 'opacity', click + 0.1, 0.6, 1, 0, ease.linear);
  s.at('keyhole-lit', 'opacity', click, 0.3, 0, 1, ease.linear);
  s.at('state', 'opacity', click + 0.1, 0.25, 0, 1, ease.out);
  s.at('state', 'translate', click + 0.1, 0.4, '-8px 0', '0 0', ease.out);

  const open = 4;
  s.at('state', 'opacity', open - 0.35, 0.3, 1, 0, ease.linear);
  s.at('keyhole-lit', 'opacity', open - 0.3, 0.4, 1, 0, ease.linear);
  s.at('shackle', 'translate', open, 0.74, '0 0', `0 ${-lift}px`, settle);
  s.at('shackle', 'clipPath', open, 0.74, clip(0), clip(lift), settle);
  return s;
}

export const example: Example = {
  slug: 'key-lock',
  title: 'Lock and unlock',
  story: 'A padlock shackle drops into its body with a soft violet flash, holds locked, then lifts open again.',
  prompt: 'Draw a padlock whose shackle drops into the body with a click and a soft flash, holds locked, then opens again.',
  level: 'spot',
  category: 'security',
  useCase: 'Access',
  surface: 'dark',
  interaction: 'watch',
  art: art(build('spot-lock', 390, 300, [185, 134])),
};

export default page(example);
