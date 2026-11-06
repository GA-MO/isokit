import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fonts, n, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const rose = ramps.rose;
const line = 'rgb(22 23 27 / .32)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const away = 'cubic-bezier(.33,0,.91,.03)';
const pop = 'cubic-bezier(.3,1.4,.5,1)';
const popIn = 'linear(0, 0.007 1.5%, 0.033 3.3%, 0.078 5%, 0.14 6.8%, 0.216 8.5%, 0.305 10.3%, 0.709 17.3%, 0.863 20.3%, 0.936 22%, 0.987 23.5%, 1.03 25.3%, 1.052 26.8%, 1.06 28.2%, 1.06 38.3%, 1.015 67.5%, 1)';
const exit = 'linear(0, -0.007 11.8%, -0.045 37.8%, -0.048 57%, -0.028 63.2%, 0.018 69.3%, 0.079 74.3%, 0.164 79.3%, 0.27 84%, 0.392 88.3%, 0.459 90.3%, 0.535 92.3%, 0.609 94%, 0.694 95.8%, 0.777 97.3%, 0.859 98.5%, 0.942 99.5%, 1)';

const cards = 4;
const lines = [[78, 52], [64, 70], [84, 44], [58, 62]] as const;

function build(name: string, width: number, height: number, origin: readonly [number, number]) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const base: Vec2 = [212, 138];
  const card: Vec2 = [164, 72];
  const thick = 5;
  const pitch = 13;
  const from = 74;
  const z = (i: number) => thick + i * pitch;
  const side = paints.flat('#f1f1f3');

  s.slab({ id: 'tile', at: [0, 0, 0], size: base, height: 18, radius: 24, top: ui.top, side: paints.brushed(s, ramps.silver), edge: line, outline: line, shade: false });
  s.face({ id: 'slot', at: [0, 0, 0], size: card, radius: 12, stroke: 'rgb(225 29 72 / .35)', dash: '4 4' });

  const print = (i: number) => {
    const [a, b] = lines[i]!;
    const x0 = -card[0] / 2 + 46;
    return `<circle cx="${-card[0] / 2 + 24}" cy="0" r="11" fill="#e4e4e7"/>` +
      `<rect x="${x0}" y="-11" width="${a}" height="7" rx="3.5" fill="rgb(22 23 27 / .5)"/>` +
      `<rect x="${x0}" y="4" width="${b}" height="7" rx="3.5" fill="rgb(22 23 27 / .16)"/>`;
  };
  for (let i = 0; i < cards; i++) {
    const at: Vec3 = [0, 0, z(i)];
    s.group(`card-${i}`, () => {
      s.slab({ id: `card-${i}-body`, at, size: card, height: thick, radius: 12, top: ui.top, side, edge: line, outline: line, shade: false, shadow: false, content: print(i) });
      s.face({ id: `card-${i}-dot`, at: [at[0] - card[0] / 2 + 24, at[1], at[2]], size: [22, 22], radius: 11, fill: rose[2] });
    });
  }

  const [bx, by] = s.extremes([0, 0, z(0)], card, 12).right;
  const pill = { x: n(bx - 10), y: n(by - 8) };
  s.group('badge', () => {
    s.svg('badge-pill', `<rect x="${pill.x - 17}" y="${pill.y - 13}" width="34" height="26" rx="13" fill="${rose[1]}"/>`);
    for (let k = 1; k <= cards; k++) s.text({ id: `count-${k}`, at: { screen: [pill.x, pill.y + 0.5] }, text: String(k), size: 15, weight: 600, color: '#ffffff', anchor: 'middle' });
  });
  s.pivot('badge', s.unproject([pill.x, pill.y], 0));

  s.dropIn('tile', 0.1);
  s.introUntil(0.7);
  s.march('slot', 4, 4, 24);

  const first = 0.3;
  const gap = 0.75;
  const glide = 0.8;
  const clear = 4.9;
  s.loop(6.4, first + (cards - 1) * gap + glide + 0.4);
  s.set('badge', 'scale', 0, 0);
  for (let i = 0; i < cards; i++) {
    const id = `card-${i}`;
    const t = first + i * gap;
    const land = t + glide * 0.55;
    s.at(id, 'opacity', t, 0.15, 0, 1, ease.linear);
    s.at(id, 'translate', t, glide, s.offset([0, 0, 0], [0, -from, 0]), '0 0', settle);
    if (i < cards - 1) s.at(`${id}-dot`, 'opacity', first + (i + 1) * gap + 0.3, 0.3, 1, 0, ease.linear);

    const k = i + 1;
    if (k === 1) s.at('badge', 'scale', land, 0.6, 0, 1, popIn);
    else {
      s.at('badge', 'scale', land, 0.35, 0.86, 1, pop);
      s.at('badge', 'translate', t + 0.1, glide * 0.7, `0 ${-(k - 2) * pitch}px`, `0 ${-(k - 1) * pitch}px`, settle);
    }
    s.at(`count-${k}`, 'opacity', land, 0.2, 0, 1, ease.linear);
    if (k < cards) s.at(`count-${k}`, 'opacity', land + gap, 0.2, 1, 0, ease.linear);

    if (i === 0) s.at('slot', 'opacity', land, 0.2, 1, 0, ease.linear);
    const out = clear + (cards - 1 - i) * 0.08;
    s.at(id, 'translate', out, 0.45, '0 0', s.offset([0, 0, 0], [from, 0, 0]), away);
    s.at(id, 'opacity', out + 0.1, 0.35, 1, 0, ease.linear);
    s.set(`${id}-dot`, 'opacity', out + 0.5, 1);
  }
  s.at('slot', 'opacity', clear + 0.6, 0.3, 0, 1, ease.linear);
  s.at('badge', 'scale', clear - 0.2, 0.745, 1, 0, exit);
  s.set('badge', 'translate', clear + 0.6, '0 0');
  s.set(`count-${cards}`, 'opacity', clear + 0.6, 0);
  return s;
}

export const example: Example = {
  slug: 'alert-stack',
  title: 'Alerts stacking up',
  story: 'Notification cards slide in and stack on a tile as a badge counts up, then the stack clears.',
  prompt: 'Draw small notification cards sliding in one by one and stacking on a tile, with a badge counting them, then the stack clearing.',
  level: 'spot',
  category: 'product',
  useCase: 'Alerts',
  surface: 'light',
  interaction: 'watch',
  art: art(build('spot-alerts', 390, 300, [193, 158])),
};

export default page(example);
