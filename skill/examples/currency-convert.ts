import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.dark;
const accent = '#34d399';
const glow = 'rgb(52 211 153 / .26)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';

const currencies = [
  { code: 'THB', amount: '3,412.50', deg: 270 },
  { code: 'EUR', amount: '92.14', deg: 0 },
  { code: 'JPY', amount: '15,083', deg: 90 },
  { code: 'GBP', amount: '78.62', deg: 180 },
] as const;

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: readonly [number, number];
  k: number;
  minPx: number;
  pills: 'stacked' | 'sides';
}

function build(l: Layout) {
  const { k } = l;
  const s = new Scene({ name: l.name, width: l.width, height: l.height, origin: l.origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const ring = 170 * k;
  const tile = 84 * k;
  const core = 128 * k;
  const wz = -12 * k;
  const onRing = (deg: number, z = 0): Vec3 => [ring * Math.cos((deg * Math.PI) / 180), ring * Math.sin((deg * Math.PI) / 180), z];

  const top = onRing(225, wz);
  const steps = 72;
  const circle = Array.from({ length: steps + 1 }, (_, i) => onRing(225 + (i * 360) / steps, wz));
  const route: Vec3[] = [[0, 0, wz], ...circle];
  s.wire({ id: 'ring', points: route, stroke: ui.wire, width: 1.25, hidden: true });
  s.pulse({ id: 'rate', wire: 'ring', color: accent, length: 0.05 });

  const screen = route.map(p => s.project(p));
  const run = screen.map((_, i) => screen.slice(1, i + 1).reduce((sum, p, j) => sum + Math.hypot(p[0] - screen[j]![0], p[1] - screen[j]![1]), 0));
  const total = run[run.length - 1]!;
  const reach = (deg: number) => run[1 + Math.round((((deg - 225 + 360) % 360) / 360) * steps)]! / total;

  const drawTile = (c: (typeof currencies)[number]) => {
    const at = onRing(c.deg);
    s.group(`${c.code.toLowerCase()}-g`, () => {
      s.slab({ id: c.code.toLowerCase(), at, size: [tile, tile], height: 22 * k, radius: 15 * k, top: ui.top, side: paints.brushed(s, ramps.graphite), grain: 0.06, edge: ui.edge });
      s.face({ id: `${c.code.toLowerCase()}-lit`, at, size: [tile, tile], radius: 15 * k, fill: glow });
      s.text({ id: `${c.code.toLowerCase()}-code`, at, text: c.code, size: l.pills === 'sides' ? 13 : 12, weight: 500, color: '#d4d4d8', on: 'top', anchor: 'middle' });
    });
    s.pivot(`${c.code.toLowerCase()}-g`, [at[0], at[1], -22 * k]);
  };

  currencies.filter(c => c.deg >= 180).forEach(drawTile);
  s.group('core-g', () => {
    s.slab({ id: 'core', at: [0, 0, 0], size: [core, core], height: 34 * k, radius: 24 * k, top: ui.top, side: paints.gradient(s, ramps.emerald), grain: 0.06, edge: ui.edge });
    s.face({ id: 'core-lit', at: [0, 0, 0], size: [core, core], radius: 24 * k, fill: glow });
    s.text({ id: 'core-code', at: [-27, 0, 0], text: 'USD', size: 12, color: '#a1a1aa', on: 'top', anchor: 'end' });
    s.text({ id: 'core-amount', at: [-21, 0, 0], text: '100.00', size: 21, weight: 600, font: 'sans', color: '#ecfdf5', on: 'top', anchor: 'start' });
  });
  currencies.filter(c => c.deg < 180).forEach(drawTile);

  currencies.forEach(c => {
    const at = onRing(c.deg);
    const text = `${c.code} ${c.amount}`;
    const html = `<span style="color:#a1a1aa">${c.code}</span> <span style="color:#a7f3d0">${c.amount}</span>`;
    const [x, y] = s.project(at);
    const right = c.deg === 270 || c.deg === 0;
    const back = c.deg >= 180;
    if (l.pills === 'sides') {
      const anchor = right ? 'left' : 'right';
      const px = x + (right ? 1 : -1) * (tile * 0.707 + 14 * k);
      s.label({ id: `${c.code.toLowerCase()}-out`, at: { screen: [fitX(px, text, l.width, l.minPx, anchor), y - 10 * k] }, html, size: 13, anchor });
    } else {
      const py = back ? y - tile * 0.408 - 10 * k : y + tile * 0.408 + 30 * k;
      s.label({ id: `${c.code.toLowerCase()}-out`, at: { screen: [fitX(x, text, l.width, l.minPx), py] }, html, size: 13, anchor: back ? 'bottom' : 'top' });
    }
  });

  s.dropIn('core-g', 0.1);
  const clockwise = ['thb', 'eur', 'jpy', 'gbp'];
  clockwise.forEach((id, i) => {
    const t = 0.45 + i * 0.167;
    s.intro(`${id}-g`, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.intro(`${id}-g`, 'scale', t, 0.23, 0.05, 1.14, ease.out);
    s.intro(`${id}-g`, 'scale', t + 0.23, 0.24, 1.14, 1, ease.io);
  });
  s.draw('ring', 1.0, 0.7, settle, 'intro');

  const loop = 8;
  const out = 6.7;
  s.loop(loop, 5.9);
  s.at('core-lit', 'opacity', 0.2, 0.1, 0, 1, ease.linear);
  s.at('core-lit', 'opacity', 0.3, 0.6, 1, 0, ease.linear);
  s.at('core-g', 'translate', 0.2, 0.3, '0 0', '0 4px', pull);
  s.at('core-g', 'translate', 0.5, 0.74, '0 4px', '0 0', settle);

  const len = 0.05;
  const start = 0.45;
  const dur = ((1 + len) * total) / 270;
  s.travel('rate', start, dur);
  currencies.forEach((c, i) => {
    const id = c.code.toLowerCase();
    const arrive = start + (dur * reach(c.deg)) / (1 + len);
    s.at(`${id}-lit`, 'opacity', arrive, 0.1, 0, 1, ease.linear);
    s.at(`${id}-lit`, 'opacity', arrive + 0.1, 0.6, 1, 0.55, ease.linear);
    s.at(`${id}-lit`, 'opacity', out + i * 0.06, 0.5, 0.55, 0, ease.linear);
    s.at(`${id}-g`, 'translate', arrive, 0.3, '0 0', '0 -6px', pull);
    s.at(`${id}-g`, 'translate', arrive + 0.3, 0.74, '0 -6px', '0 0', settle);
    const from = l.pills === 'sides' ? (c.deg === 270 || c.deg === 0 ? '-8px 0' : '8px 0') : c.deg >= 180 ? '0 6px' : '0 -6px';
    s.at(`${id}-out`, 'opacity', arrive + 0.08, 0.25, 0, 1, ease.out);
    s.at(`${id}-out`, 'translate', arrive + 0.08, 0.45, from, '0 0', ease.out);
    s.at(`${id}-out`, 'opacity', out + i * 0.06, 0.4, 1, 0, ease.linear);
  });
  return s;
}

export const example: Example = {
  slug: 'currency-convert',
  title: 'One amount, four currencies',
  story: 'USD 100 leaves the core and runs once around a ring of currencies, and each tile shows its converted amount as the rate reaches it.',
  prompt: 'Draw an amount of USD 100 in a core with a ring of currency tiles around it (THB, EUR, JPY, GBP); the conversion runs around the ring and each tile lights and shows its converted amount as it is reached.',
  level: 'simple',
  category: 'product',
  layout: 'radial',
  useCase: 'Payments',
  surface: 'dark',
  interaction: 'watch',
  art: art(
    build({ name: 'fx-sm', width: 390, height: 390, origin: [195, 184], k: 0.92, minPx: narrowest, pills: 'stacked' }),
    build({ name: 'fx-lg', width: 720, height: 400, origin: [360, 190], k: 1.1, minPx: 521, pills: 'sides' }),
    520,
  ),
};

export default page(example);
