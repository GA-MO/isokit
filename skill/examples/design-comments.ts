import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, surfaces, type Example } from './shared';

const ui = surfaces.light;
const accent = '#6d28d9';
const ink = '#3f3f46';
const bar = '#d9dade';
const line = 'rgb(22 23 27 / .3)';
const slide = 'cubic-bezier(.38,.08,0,.97)';

interface Layout {
  width: number;
  height: number;
  origin: readonly [number, number];
  design: readonly [number, number];
  thread: readonly [number, number];
  threadAt: readonly [number, number];
}

const replies = [
  { who: 'A', tone: '#6d28d9', bars: [0.8, 0.5] },
  { who: 'J', tone: '#4338ca', bars: [0.62, 0.36] },
  { who: 'M', tone: '#7e22ce', bars: [0.72] },
] as const;

function build(name: string, l: Layout) {
  const s = new Scene({ name, width: l.width, height: l.height, origin: l.origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const minPx = l.width > 500 ? 521 : narrowest;
  const [W, H] = l.design;
  const [TW, TH] = l.thread;
  const t = 7;
  const designAt: Vec3 = [W / 2, 0, H / 2];
  const threadAt: Vec3 = [l.threadAt[0], l.threadAt[1], TH / 2];
  const on = (at: Vec3, u: number, v: number): Vec3 => [at[0] + u, at[1], at[2] - v];
  const plane = (at: Vec3, u: number, v: number) => s.planeTransform(on(at, u, v), 'left');

  const shade = (id: string, at: Vec3, w: number) =>
    s.svg(id, `<g filter="${s.blur(6)}">${s.plane([at[0], at[1] + 6, 0], `<rect x="${-w / 2}" y="-10" width="${w}" height="20" rx="10" fill="rgb(22 23 27 / .1)"/>`)}</g>`);
  shade('design-shade', designAt, W);
  shade('thread-shade', threadAt, TW);

  const x0 = -W / 2 + 16;
  const mock =
    `<rect x="${-W / 2}" y="${-H / 2}" width="${W}" height="22" rx="0" fill="#f4f4f5"/>` +
    [0, 1, 2].map(i => `<circle cx="${-W / 2 + 12 + i * 9}" cy="${-H / 2 + 11}" r="2.6" fill="#d4d4d8"/>`).join('') +
    `<rect x="${x0}" y="${-H / 2 + 40}" width="${W * 0.42}" height="10" rx="3" fill="${ink}"/>` +
    `<rect x="${x0}" y="${-H / 2 + 56}" width="${W * 0.3}" height="10" rx="3" fill="${ink}"/>` +
    [0, 1].map(i => `<rect x="${x0}" y="${-H / 2 + 78 + i * 10}" width="${W * (i ? 0.28 : 0.38)}" height="4" rx="2" fill="${bar}"/>`).join('') +
    `<rect x="${x0}" y="${H / 2 - 44}" width="64" height="20" rx="10" fill="${accent}"/>` +
    `<rect x="${W * 0.06}" y="${-H / 2 + 38}" width="${W * 0.38}" height="${H - 70}" rx="10" fill="#ede9fe"/>` +
    `<path d="M${W * 0.1} ${H / 2 - 44}l${W * 0.1} ${-36}l${W * 0.07} ${22}l${W * 0.05} ${-12}l${W * 0.08} ${26}z" fill="#c4b5fd"/>` +
    `<circle cx="${W * 0.34}" cy="${-H / 2 + 62}" r="9" fill="#c4b5fd"/>`;
  s.panel({ id: 'design', at: designAt, size: [W, H], thickness: t, facing: 'left', radius: 14, front: '#ffffff', side: '#e7e7ea', edge: line, content: mock });

  const head = `<text x="${-TW / 2 + 14}" y="${-TH / 2 + 20}" font-size="11" font-weight="500" fill="#4b4e57" dominant-baseline="central" style="font-family:var(--iso-mono)">thread</text><rect x="${-TW / 2 + 12}" y="${-TH / 2 + 34}" width="${TW - 24}" height="1" fill="rgb(22 23 27 / .1)"/>`;
  s.panel({ id: 'thread', at: threadAt, size: [TW, TH], thickness: t, facing: 'left', radius: 14, front: '#ffffff', side: '#e7e7ea', edge: line, content: head });
  const cardH = 38;
  const cardV = (i: number) => -TH / 2 + 46 + i * (cardH + 8) + cardH / 2;
  replies.forEach((r, i) => {
    const cw = TW - 24;
    const body =
      `<rect x="${-cw / 2}" y="${-cardH / 2}" width="${cw}" height="${cardH}" rx="8" fill="#fafafa" stroke="rgb(22 23 27 / .12)" stroke-width="1" vector-effect="non-scaling-stroke"/>` +
      `<circle cx="${-cw / 2 + 13}" cy="${-cardH / 2 + 13}" r="7" fill="${r.tone}"/>` +
      `<text x="${-cw / 2 + 13}" y="${-cardH / 2 + 13.5}" font-size="8" font-weight="600" fill="#ffffff" text-anchor="middle" dominant-baseline="central" style="font-family:var(--iso-font)">${r.who}</text>` +
      r.bars.map((f, j) => `<rect x="${-cw / 2 + 26}" y="${-cardH / 2 + 10 + j * 10}" width="${(cw - 36) * f}" height="4" rx="2" fill="${j ? bar : '#a1a1aa'}"/>`).join('');
    s.svg(`card-${i}`, `<g transform="${plane(threadAt, 0, cardV(i))}">${body}</g>`);
  });

  const spots = [
    on(designAt, x0 + W * 0.3, -H / 2 + 44),
    on(designAt, W * 0.3, -H / 2 + 92),
    on(designAt, x0 + 52, H / 2 - 38),
  ];
  spots.forEach((p, i) => {
    const [px, py] = s.project(p);
    const r = 11;
    s.svg(`pin-${i}`, `<g transform="translate(${px} ${py})"><path d="M0 0v${-r}a${r} ${r} 0 1 1 ${r} ${r}z" fill="${accent}" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/><text x="${r}" y="${-r}" font-size="11" font-weight="600" fill="#ffffff" text-anchor="middle" dominant-baseline="central" style="font-family:var(--iso-font)">${i + 1}</text></g>`);
  });
  s.svg('pin-0-ring', (() => {
    const [px, py] = s.project(spots[0]!);
    return `<circle cx="${px + 11}" cy="${py - 11}" r="17" fill="none" stroke="${accent}" stroke-width="1.5" opacity=".5"/>`;
  })());

  const wide = l.width > 500;
  const top = s.project(on(threadAt, -TW / 2, -TH / 2));
  const mid = s.project(on(threadAt, 0, wide ? -TH / 2 : TH / 2));
  const bottom = s.project(on(threadAt, TW / 2, TH / 2));
  const counts = ['1 comment', '2 replies', '3 replies'] as const;
  counts.forEach((c, i) => {
    const text = `#1 · ${c}`;
    s.label({ id: `count-${i}`, at: { screen: [fitX(mid[0], text, l.width, minPx, 'center'), wide ? top[1] - 12 : bottom[1] + 14] }, html: `<span style="color:${accent}">#1</span> · ${c}`, size: 13, anchor: wide ? 'bottom' : 'top' });
  });

  s.intro('design-shade', 'opacity', 0.1, 0.4, 0, 1, ease.linear);
  s.intro('design', 'opacity', 0.1, 0.12, 0, 1, ease.linear);
  s.intro('design', 'translate', 0.1, 0.5, '0 20px', '0 0', ease.out);
  s.intro('thread-shade', 'opacity', 0.27, 0.4, 0, 1, ease.linear);
  s.intro('thread', 'opacity', 0.27, 0.12, 0, 1, ease.linear);
  s.intro('thread', 'translate', 0.27, 0.5, '0 20px', '0 0', ease.out);

  const L = 9;
  const out = 7.9;
  s.loop(L, 5.6);
  const pinAt = [0.3, 3.7, 4.3];
  pinAt.forEach((p, i) => {
    s.dropAt(`pin-${i}`, p, 30);
    s.at(`pin-${i}`, 'opacity', out + i * 0.08, 0.35, 1, 0, ease.linear);
  });
  s.at('pin-0-ring', 'opacity', 0.55, 0.2, 0, 1, ease.linear);
  s.at('pin-0-ring', 'scale', 0.55, 0.6, 0.6, 1, ease.out);
  s.at('pin-0-ring', 'opacity', out, 0.35, 1, 0, ease.linear);

  const cardAt = [0.6, 1.7, 2.8];
  cardAt.forEach((c, i) => {
    s.at(`card-${i}`, 'opacity', c, 0.2, 0, 1, ease.linear);
    s.at(`card-${i}`, 'translate', c, 0.6, '0 -10px', '0 0', slide);
    s.at(`card-${i}`, 'opacity', out + (2 - i) * 0.08, 0.35, 1, 0, ease.linear);
    s.at(`count-${i}`, 'opacity', c + 0.05, 0.25, 0, 1, ease.linear);
    if (i < 2) s.at(`count-${i}`, 'opacity', cardAt[i + 1]! + 0.05, 0.25, 1, 0, ease.linear);
    else s.at(`count-${i}`, 'opacity', out, 0.35, 1, 0, ease.linear);
  });
  return s;
}

export const example: Example = {
  slug: 'design-comments',
  title: 'Design review comments',
  story: 'Comment pins drop onto a design file while replies stack up in the thread beside it.',
  prompt: 'Draw a design file panel with numbered comment pins dropping onto it and a thread panel beside it where replies stack one under another.',
  level: 'simple',
  category: 'product',
  layout: 'panels',
  useCase: 'Design review',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build('comments-sm', { width: 390, height: 410, origin: [172, 214], design: [220, 170], thread: [124, 186], threadAt: [72, 170] }),
    build('comments-lg', { width: 720, height: 400, origin: [150, 230], design: [300, 196], thread: [150, 200], threadAt: [410, -70] }),
    520,
  ),
};

export default page(example);
