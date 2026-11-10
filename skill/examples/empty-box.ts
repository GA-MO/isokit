import { Scene, ease, type Vec3 } from '../lib/iso.ts';
import { art, fitX, fonts, narrowest, page, paints, surfaces, type Example } from './shared.ts';

const ui = surfaces.light;
const line = 'rgb(22 23 27 / .32)';
const violet = 'rgb(124 58 237 / .75)';

function build(name: string) {
  const s = new Scene({ name, width: 390, height: 300, origin: [195, 196], font: fonts.sans, mono: fonts.mono, label: ui.label });
  const size = 100;
  const tall = 62;
  const radius = 12;
  const depth = 40;
  const box: Vec3 = [-52, 52, tall];
  const slot: Vec3 = [58, -58, 52];
  const rect = (w: number, extra: string) => `<rect x="${-w / 2}" y="${-w / 2}" width="${w}" height="${w}" rx="${radius}" ${extra}/>`;
  const lineArt = { outline: line, shade: false, edge: line } as const;

  s.frame({ id: 'slot', at: slot, size: [84, 84], height: 52, radius: 10, stroke: violet, dash: '4 4', back: false, fill: 'rgb(139 92 246 / .05)' });
  s.text({ id: 'slot-plus', at: slot, text: '+', size: 22, weight: 500, font: 'sans', color: 'rgb(124 58 237 / .8)', anchor: 'middle' });

  s.slab({ id: 'box', at: box, size: [size, size], height: tall, radius, top: '#e9e9ec', side: paints.flat('#ffffff'), ...lineArt });
  const rim = s.def('rim', `<clipPath id="$ID">${rect(size, `transform="${s.planeTransform(box)}"`)}</clipPath>`);
  const back = s.extremes(box, [size, size], radius).back;
  const floorBack = s.extremes([box[0], box[1], box[2] - depth], [size, size], radius).back;
  s.svg(
    'inside',
    `<g clip-path="${rim}">${s.plane([box[0], box[1], box[2] - depth], rect(size, `fill="#f6f6f7" stroke="${line}" vector-effect="non-scaling-stroke"`))}` +
      `<path d="M${back[0]} ${back[1]}V${floorBack[1]}" stroke="${line}" vector-effect="non-scaling-stroke"/></g>` +
      s.plane(box, rect(size, `fill="none" stroke="${line}" vector-effect="non-scaling-stroke"`)),
  );

  s.group('lid', () => {
    s.slab({ id: 'lid-slab', at: [box[0], box[1], tall + 50], size: [size + 8, size + 8], height: 12, radius: radius + 2, top: ui.top, side: paints.flat('#ffffff'), ...lineArt, shadow: false });
  });

  const [lx, ly] = s.project([0, 0, 0]);
  const text = 'no items yet';
  s.label({ id: 'empty', at: { screen: [fitX(lx, text, 390, narrowest), ly + 78] }, text, size: 13 });

  s.dropIn('box', 0.1);
  s.dropIn('lid', 0.28);
  s.intro('slot', 'opacity', 0.4, 0.4, 0, 1, ease.linear);
  s.intro('slot-plus', 'opacity', 0.55, 0.3, 0, 1, ease.linear);
  s.intro('empty', 'opacity', 0.7, 0.3, 0, 1, ease.out);
  s.intro('empty', 'translate', 0.7, 0.4, '0 8px', '0 0', ease.out);
  s.march('slot', 4, 4, 24);

  s.loop(6, 0);
  s.at('lid', 'translate', 0, 3, '0 0', '0 -9px', ease.io);
  s.at('lid', 'translate', 3, 3, '0 -9px', '0 0', ease.io);
  s.at('slot-plus', 'translate', 0.4, 3, '0 0', '0 -4px', ease.io);
  s.at('slot-plus', 'translate', 3.4, 2.6, '0 -4px', '0 0', ease.io);
  return s;
}

export const example: Example = {
  slug: 'empty-box',
  title: 'Empty box',
  ask: 'An empty state.',
  story: 'An open box waits under its floating lid beside a dashed slot where the first item will go.',
  prompt: 'Draw an empty state: an open box with its lid floating above it, next to a dashed placeholder with marching dashes.',
  level: 'spot',
  layout: 'object',
  useCase: 'Empty state',
  surface: 'light',
  interaction: 'watch',
  art: art(build('spot-empty')),
};

export default page(example);
