import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fonts, n, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.dark;
const violet = ramps.violet;
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const shift = 'cubic-bezier(.49,.19,.28,.81)';
const amber = ramps.amber[2];
const emerald = ramps.emerald[2];

function build(name: string, width: number, height: number, origin: readonly [number, number]) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const [w, d, h] = [188, 136, 54];
  const slotY = -20;
  const slot = { length: 138, width: 11 };
  const card = { w: 110, h: 78, t: 4 };
  const depth = 54;
  const cardAt: Vec3 = [0, slotY + card.t / 2, 10 + card.h / 2];
  const light: Vec3 = [60, 40, 0];

  const [lx, ly] = s.project([0, slotY + slot.width / 2, 0]);
  const lip = (x: number) => n(ly + (x - lx) * s.ratio);
  const inside = `polygon(0px 0px, ${width}px 0px, ${width}px ${lip(width)}px, 0px ${lip(0)}px)`;

  const face = s.def('card-face', `<linearGradient id="$ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${violet[3]}"/><stop offset=".08" stop-color="${violet[2]}"/><stop offset=".7" stop-color="${violet[1]}"/><stop offset="1" stop-color="${violet[0]}"/></linearGradient>`);
  const print =
    `<rect x="${-card.w / 2 + 12}" y="${-card.h / 2 + 11}" width="18" height="14" rx="3" fill="#e4e4e7" opacity=".85"/>` +
    `<path d="M${-card.w / 2 + 12} ${-card.h / 2 + 18}h18M${-card.w / 2 + 21} ${-card.h / 2 + 11}v14" stroke="${violet[1]}" stroke-width=".8" opacity=".6"/>` +
    `<rect x="${card.w / 2 - 40}" y="${-card.h / 2 + 13}" width="28" height="3" rx="1.5" fill="#fff" opacity=".45"/>` +
    `<rect x="${card.w / 2 - 40}" y="${-card.h / 2 + 20}" width="18" height="3" rx="1.5" fill="#fff" opacity=".28"/>`;

  s.group('reader', () => {
    s.slab({ id: 'box', at: [0, 0, 0], size: [w, d], height: h, radius: 20, top: ui.top, side: paints.brushed(s, ramps.graphite), grain: 0.06, edge: ui.edge });
    s.face({ id: 'box-glow', at: [0, 0, 0], size: [w, d], radius: 20, fill: 'rgb(52 211 153 / .16)' });
    s.face({ id: 'slot', at: [0, slotY, 0], size: [slot.length, slot.width], radius: slot.width / 2, fill: '#060608', stroke: 'rgb(255 255 255 / .14)' });
    s.group('card-clip', () => {
      s.svg('card-box', `<rect width="${width}" height="${height}" fill="none"/>`);
      s.group('card', () => {
        s.panel({ id: 'card-panel', at: cardAt, size: [card.w, card.h], thickness: card.t, facing: 'left', radius: 7, front: face, side: violet[1], edge: 'rgb(237 233 254 / .45)', content: print });
      });
    });
    s.slab({ id: 'lamp', at: light, size: [20, 20], height: 4, radius: 10, top: '#2a2b31', side: paints.flat('#0c0c0f'), edge: 'rgb(255 255 255 / .16)', shadow: false });
    const dot = (id: string, color: string, r: number, blur?: string) => s.svg(id, s.plane(light, `<circle r="${r}" fill="${color}"${blur ? ` filter="${blur}"` : ''}/>`));
    dot('glow-wait', 'rgb(251 191 36 / .55)', 13, s.blur(5));
    dot('glow-ok', 'rgb(52 211 153 / .7)', 15, s.blur(6));
    dot('lamp-wait', amber, 6.5);
    dot('lamp-ok', emerald, 6.5);
  });

  s.dropIn('reader', 0.1);
  s.dropIn('card', 0.3, 30);
  s.introUntil(0.9);

  s.loop(6, 2.6);
  s.set('card-clip', 'clipPath', 0, inside);
  const push = 0.4;
  const travel = 0.9;
  const read = push + travel - 0.15;
  s.at('card', 'translate', push, travel, '0 0', `0 ${depth}px`, settle);

  s.at('lamp-wait', 'opacity', read, 0.25, 1, 0, ease.linear);
  s.at('glow-wait', 'opacity', read, 0.25, 1, 0, ease.linear);
  s.at('lamp-ok', 'opacity', read, 0.25, 0, 1, ease.linear);
  s.at('glow-ok', 'opacity', read, 0.25, 0, 1, ease.linear);
  s.at('box-glow', 'opacity', read, 0.1, 0, 1, ease.linear);
  s.at('box-glow', 'opacity', read + 0.1, 0.6, 1, 0, ease.linear);
  s.at('reader', 'translate', read, 0.14, '0 0', '0 3px', ease.out);
  s.at('reader', 'translate', read + 0.14, 0.74, '0 3px', '0 0', settle);

  const eject = 4;
  s.at('card', 'translate', eject, 0.95, `0 ${depth}px`, '0 0', shift);
  s.at('lamp-ok', 'opacity', eject + 0.1, 0.3, 1, 0, ease.linear);
  s.at('glow-ok', 'opacity', eject + 0.1, 0.3, 1, 0, ease.linear);
  s.at('lamp-wait', 'opacity', eject + 0.1, 0.3, 0, 1, ease.linear);
  s.at('glow-wait', 'opacity', eject + 0.1, 0.3, 0, 1, ease.linear);
  return s;
}

export const example: Example = {
  slug: 'keycard-slot',
  title: 'Keycard access',
  ask: 'A keycard opening a reader.',
  story: 'A keycard slides into a reader, its light turns from amber to green, then the card lifts out again.',
  prompt: 'Draw a keycard sliding into the slot of a small reader box, its status light turning from amber to green, then the card lifting out again.',
  level: 'spot',
  layout: 'object',
  useCase: 'Access',
  surface: 'dark',
  interaction: 'watch',
  art: art(build('spot-keycard', 390, 300, [195, 154])),
};

export default page(example);
