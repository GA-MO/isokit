import { Scene, ease, type Vec3 } from '../lib/iso.ts';
import { art, fitX, fonts, narrowest, page, surfaces, type Example } from './shared.ts';

const ui = surfaces.light;
const ink = '#3f3f46';
const name = '#4b4e57';
const bar = '#d9dade';
const line = 'rgb(22 23 27 / .3)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';

const people = [
  { id: 'ana', name: 'Ana', color: '#6d28d9', tint: 'rgb(109 40 217 / .1)' },
  { id: 'ben', name: 'Ben', color: '#0369a1', tint: 'rgb(3 105 161 / .16)' },
  { id: 'kai', name: 'Kai', color: '#c2410c', tint: 'rgb(194 65 12 / .1)' },
] as const;

interface Layout {
  width: number;
  height: number;
  origin: readonly [number, number];
  doc: readonly [number, number];
  side: number;
  rows: number;
  pitch: number;
}

function build(sceneName: string, l: Layout) {
  const s = new Scene({ name: sceneName, width: l.width, height: l.height, origin: l.origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const [W, H] = l.doc;
  const P = l.side;
  const gap = 12;
  const t = 7;
  const docAt: Vec3 = [gap + W / 2, 0, H / 2];
  const sideAt: Vec3 = [0, gap + P / 2, H / 2];
  const onDoc = (u: number, v: number): Vec3 => [docAt[0] + u, docAt[1], docAt[2] - v];
  const docPlane = (u: number, v: number) => s.planeTransform(onDoc(u, v), 'left');
  const onSide = (u: number, v: number): Vec3 => [sideAt[0], sideAt[1] - u, sideAt[2] - v];
  const sidePlane = (u: number, v: number) => s.planeTransform(onSide(u, v), 'right');

  const u0 = -W / 2 + 20;
  const rowV = (i: number) => -H / 2 + 58 + i * l.pitch;
  const widths = [0.9, 0.78, 0, 0.84, 0.6, 0.92, 0.66, 0, 0.5].slice(0, l.rows).map(f => f * (W - 40));
  const typed = { ana: { row: 2, len: 0.82 * (W - 40) }, kai: { row: 7, len: 0.5 * (W - 40) } } as const;
  const pick = { row: 4, from: 0.12 * (W - 40), to: 0.46 * (W - 40) };

  const shade = (id: string, at: Vec3, size: readonly [number, number]) =>
    s.svg(id, `<g filter="${s.blur(6)}">${s.plane(at, `<rect x="${-size[0] / 2}" y="${-size[1] / 2}" width="${size[0]}" height="${size[1]}" rx="${size[1] / 2}" fill="rgb(22 23 27 / .1)"/>`)}</g>`);
  shade('side-shade', [6, sideAt[1], 0], [20, P]);
  shade('doc-shade', [docAt[0], 6, 0], [W, 20]);

  const sideContent =
    `<text x="${-P / 2 + 14}" y="${-H / 2 + 24}" font-size="11" font-weight="500" fill="${name}" dominant-baseline="central" style="font-family:var(--iso-mono)">editing now</text>` +
    people.map((p, i) => {
      const v = -H / 2 + 56 + i * 34;
      return `<circle cx="${-P / 2 + 22}" cy="${v}" r="6" fill="${p.color}"/><text x="${-P / 2 + 36}" y="${v}" font-size="12" font-weight="500" fill="${ink}" dominant-baseline="central" style="font-family:var(--iso-font)">${p.name}</text>`;
    }).join('');
  s.panel({ id: 'side', at: sideAt, size: [P, H], thickness: t, facing: 'right', radius: 14, front: '#ffffff', side: '#e7e7ea', edge: line, content: sideContent });
  people.forEach((p, i) => {
    const v = -H / 2 + 56 + i * 34;
    s.svg(`row-${p.id}`, `<g transform="${sidePlane(0, v)}"><rect x="${-P / 2 + 8}" y="-12" width="${P - 16}" height="24" rx="8" fill="${p.tint}"/></g>`);
  });

  const docContent =
    `<text x="${u0}" y="${-H / 2 + 26}" font-size="13" font-weight="600" fill="${ink}" dominant-baseline="central" style="font-family:var(--iso-font)">Launch plan</text>` +
    widths.map((w, i) => (w ? `<rect x="${u0}" y="${rowV(i) - 2.5}" width="${w}" height="5" rx="2.5" fill="${bar}"/>` : '')).join('');
  s.panel({ id: 'doc', at: docAt, size: [W, H], thickness: t, facing: 'left', radius: 16, front: '#ffffff', side: '#e7e7ea', edge: line, content: docContent });

  s.svg('pick', `<g transform="${docPlane(u0, rowV(pick.row))}"><rect x="${pick.from - 3}" y="-8" width="${pick.to - pick.from + 6}" height="16" rx="3" fill="${people[1].tint}"/><rect x="${pick.from}" y="-2.5" width="${pick.to - pick.from}" height="5" rx="2.5" fill="${people[1].color}" opacity=".55"/></g>`);
  for (const [who, tl] of Object.entries(typed)) {
    s.svg(`line-${who}`, `<g transform="${docPlane(u0, rowV(tl.row))}"><rect x="0" y="-2.5" width="${tl.len}" height="5" rx="2.5" fill="${bar}"/></g>`);
  }

  const caretRest = { ana: [u0, rowV(typed.ana.row)], ben: [u0 + pick.from, rowV(pick.row)], kai: [u0, rowV(typed.kai.row)] } as const;
  const caretEnd = { ana: [u0 + typed.ana.len, rowV(typed.ana.row)], ben: [u0 + pick.to, rowV(pick.row)], kai: [u0 + typed.kai.len, rowV(typed.kai.row)] } as const;
  const minPx = l.width > 500 ? 521 : narrowest;
  people.forEach(p => {
    const [u, v] = caretRest[p.id];
    s.svg(`caret-${p.id}`, `<g transform="${docPlane(u, v)}"><rect x="-1" y="-9" width="2" height="18" rx="1" fill="${p.color}"/></g>`);
    const [sx, sy] = s.project(onDoc(u, v - 9));
    s.label({ id: `tag-${p.id}`, at: { screen: [fitX(sx + 2, p.name, l.width, minPx, 'left', 'sans', 1), sy] }, html: `<span style="display:block;background:${p.color};color:#fff;padding:.1em .45em;border-radius:5px 5px 5px 0">${p.name}</span>`, variant: 'plain', size: 12, anchor: 'left' });
  });

  people.forEach((p, i) => {
    s.intro(`caret-${p.id}`, 'opacity', 0.75 + i * 0.12, 0.15, 0, 1, ease.linear);
    s.intro(`tag-${p.id}`, 'opacity', 0.8 + i * 0.12, 0.2, 0, 1, ease.out);
    s.intro(`tag-${p.id}`, 'translate', 0.8 + i * 0.12, 0.4, '0 6px', '0 0', ease.out);
  });
  s.intro('side-shade', 'opacity', 0.15, 0.4, 0, 1, ease.linear);
  s.intro('doc-shade', 'opacity', 0.32, 0.4, 0, 1, ease.linear);
  s.intro('side', 'opacity', 0.15, 0.12, 0, 1, ease.linear);
  s.intro('side', 'translate', 0.15, 0.5, '0 20px', '0 0', ease.out);
  s.intro('doc', 'opacity', 0.32, 0.12, 0, 1, ease.linear);
  s.intro('doc', 'translate', 0.32, 0.5, '0 20px', '0 0', ease.out);

  const L = 10;
  s.loop(L, 6.6);
  const move = (id: string, start: number, dur: number, a: readonly [number, number], b: readonly [number, number], easing: string) => {
    const by = s.offset(onDoc(a[0], a[1]), onDoc(b[0], b[1]));
    s.at(`caret-${id}`, 'translate', start, dur, '0 0', by, easing);
    s.at(`tag-${id}`, 'translate', start, dur, '0 0', by, easing);
    return by;
  };
  const back = (id: string, start: number, by: string) => {
    s.at(`caret-${id}`, 'translate', start, 0.74, by, '0 0', settle);
    s.at(`tag-${id}`, 'translate', start, 0.74, by, '0 0', settle);
  };
  const light = (id: string, start: number) => {
    s.at(`row-${id}`, 'opacity', start, 0.25, 0, 1, ease.linear);
    s.at(`row-${id}`, 'opacity', 8.7, 0.5, 1, 0, ease.linear);
  };

  const type = (id: 'ana' | 'kai', start: number, dur: number, steps: number) => {
    light(id, start - 0.15);
    s.typeIn(`line-${id}`, start, dur, steps);
    const by = move(id, start, dur, caretRest[id], caretEnd[id], `steps(${steps}, end)`);
    s.at(`line-${id}`, 'opacity', 8.6, 0.45, 1, 0, ease.linear);
    s.set(`line-${id}`, 'clipPath', 9.3, 'inset(-20% 100% -20% 0)');
    s.set(`line-${id}`, 'opacity', 9.35, 1);
    back(id, 8.7, by);
  };
  type('ana', 0.4, 1.5, 15);

  light('ben', 2.35);
  s.at('pick', 'clipPath', 2.6, 0.9, 'inset(-20% 100% -20% 0)', 'inset(-20% 0% -20% 0)', settle);
  const benBy = move('ben', 2.6, 0.9, caretRest.ben, caretEnd.ben, settle);
  s.at('pick', 'opacity', 8.6, 0.45, 1, 0, ease.linear);
  s.set('pick', 'clipPath', 9.3, 'inset(-20% 100% -20% 0)');
  s.set('pick', 'opacity', 9.35, 1);
  back('ben', 8.7, benBy);

  type('kai', 4.1, 1.3, 13);
  return s;
}

export const example: Example = {
  slug: 'live-cursors',
  title: 'Live cursors',
  ask: 'Show three people editing one document live.',
  story: 'Three people edit one document at once: two type new lines, one selects a phrase, and the side panel shows who is active.',
  prompt: 'Draw a shared document panel where three coloured cursors with name tags edit at the same time, typing lines and selecting text, with presence dots on a side panel.',
  level: 'medium',
  intent: 'talk',
  layout: 'panels',
  useCase: 'Collaboration',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build('cursors-sm', { width: 390, height: 430, origin: [138, 284], doc: [252, 244], side: 116, rows: 9, pitch: 20 }),
    build('cursors-lg', { width: 720, height: 410, origin: [290, 230], doc: [320, 196], side: 160, rows: 8, pitch: 18 }),
    520,
  ),
};

export default page(example);
