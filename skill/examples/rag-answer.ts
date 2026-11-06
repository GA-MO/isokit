import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.light;
const accent = '#7c3aed';
const deep = ramps.violet[1];
const tint = 'rgb(139 92 246 / .2)';
const line = 'rgb(22 23 27 / .22)';
const wire = 'rgb(22 23 27 / .28)';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const shrink = 'cubic-bezier(.33,0,.91,.03)';

const grid: readonly Vec2[] = [-44, 0, 44].flatMap(x => [-30, 30].map((y): Vec2 => [x, y]));
const matches: readonly number[] = [1, 4, 2];
const cited = [1, 3] as const;

const cite = (n: number) => `<span style="display:inline-block;margin-left:.15em;padding:.05em .5em;border-radius:.45em;font-size:.8em;line-height:1.45;vertical-align:.08em;background:#ede9fe;color:${deep};font-weight:600;font-variant-numeric:tabular-nums">${n}</span>`;

interface Layout {
  name: string;
  width: number;
  height: number;
  origin: readonly [number, number];
  k: number;
  dir: Vec2;
  minPx: number;
  question: { anchor: 'left' | 'right' | 'top' | 'bottom'; dx: number; dy: number };
  answer: { anchor: 'left' | 'right' | 'top' | 'bottom'; dx: number; dy: number };
  textSize: number;
  rankSize: number;
  legs: { q: Vec2; a: Vec2; qLen: number; aLen: number };
}

function build(l: Layout) {
  const { k } = l;
  const s = new Scene({ name: l.name, width: l.width, height: l.height, origin: l.origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const along = (d: number, z = 0): Vec3 => [l.dir[0] * d * k, l.dir[1] * d * k, z];
  const gap = 205;
  const rSize = 82 * k;
  const sSize = 150 * k;
  const mSize = 104 * k;
  const sTop = 34 * k;
  const mTop = 30 * k;
  const R = along(-gap);
  const S = along(0);
  const M = along(gap);
  const wz = -10 * k;

  const off = (from: Vec3, d: Vec2, by: number): Vec3 => [from[0] + d[0] * by, from[1] + d[1] * by, wz];
  const qEnd = off(R, l.legs.q, rSize / 2 + l.legs.qLen * k);
  const aEnd = off(M, l.legs.a, mSize / 2 + l.legs.aLen * k);
  s.wire({ id: 'w-q', points: [qEnd, off(R, l.legs.q, rSize / 2)], stroke: wire, width: 1.25 });
  s.wire({ id: 'w-r', points: [along(-gap + rSize / 2 / k, wz), along(-sSize / 2 / k, wz)], stroke: wire, width: 1.25 });
  s.wire({ id: 'w-s', points: [along(sSize / 2 / k, wz), along(gap - mSize / 2 / k, wz)], stroke: wire, width: 1.25 });
  s.wire({ id: 'w-a', points: [off(M, l.legs.a, mSize / 2), aEnd], stroke: wire, width: 1.25 });
  for (const w of ['q', 'r', 'a']) s.pulse({ id: `p-${w}`, wire: `w-${w}`, color: accent, length: 0.3 });

  const tiles = [
    {
      at: R,
      draw: () =>
        s.group('retriever', () => {
          s.slab({ id: 'retriever-slab', at: R, size: [rSize, rSize], height: 22 * k, radius: 15 * k, top: ui.top, side: paints.dots(s, ramps.graphite), grain: 0.05, edge: ui.edge, outline: line });
          s.face({ id: 'retriever-glow', at: R, size: [rSize, rSize], radius: 15 * k, fill: tint });
          s.text({ id: 'retriever-name', at: R, text: 'retriever', size: l.textSize, weight: 500, color: ui.ink, on: 'top', anchor: 'middle' });
        }),
    },
    {
      at: S,
      draw: () =>
        s.group('store', () => {
          s.slab({ id: 'store-slab', at: S, size: [sSize, sSize], height: sTop, radius: 24 * k, top: '#f4f4f5', side: paints.brushed(s, ramps.graphite), grain: 0.05, edge: ui.edge, outline: line });
          s.face({ id: 'store-glow', at: S, size: [sSize, sSize], radius: 24 * k, fill: tint });
          s.text({ id: 'store-name', at: [S[0] + sSize * 0.18, S[1] + sSize / 2, -sTop / 2], text: 'docs', size: l.textSize, weight: 500, color: '#f4f4f5', on: 'left', anchor: 'middle' });
        }),
    },
    {
      at: M,
      draw: () =>
        s.group('model', () => {
          s.slab({ id: 'model-slab', at: M, size: [mSize, mSize], height: mTop, radius: 20 * k, top: ui.top, side: paints.gradient(s, ramps.violet), grain: 0.06, edge: ui.edge, outline: 'rgb(91 33 182 / .3)' });
          s.face({ id: 'model-glow', at: M, size: [mSize, mSize], radius: 20 * k, fill: 'rgb(139 92 246 / .28)' });
          s.text({ id: 'model-name', at: M, text: 'model', size: l.textSize, weight: 500, color: deep, on: 'top', anchor: 'middle' });
        }),
    },
  ].sort((a, b) => a.at[0] + a.at[1] - (b.at[0] + b.at[1]));
  tiles.forEach(t => t.draw());

  const docAt = (i: number): Vec3 => [S[0] + grid[i]![0] * k, S[1] + grid[i]![1] * k, sTop];
  const docSize = [34 * k, 46 * k] as const;
  const order = grid.map((_, i) => i).sort((a, b) => docAt(a)[0] + docAt(a)[1] - (docAt(b)[0] + docAt(b)[1]));
  order.forEach(i => {
    const at = docAt(i);
    const rank = matches.indexOf(i);
    s.group(`doc-${i}`, () => {
      s.slab({ id: `doc-${i}-slab`, at, size: docSize, height: 5 * k, radius: 6 * k, top: ui.top, side: paints.flat('#d4d4d8'), edge: ui.edge, outline: 'rgb(22 23 27 / .3)', shade: false });
      [-12, -4, 4].forEach((dx, j) => s.face({ id: `doc-${i}-line-${j}`, at: [at[0] + dx * k, at[1] - (j === 2 ? 4 : 0) * k, at[2] + 5 * k], size: [3 * k, (j === 2 ? 20 : 28) * k], radius: 1.5 * k, fill: 'rgb(22 23 27 / .2)' }));
      if (rank >= 0) {
        s.face({ id: `doc-${i}-hot`, at: [at[0], at[1], at[2] + 5 * k], size: docSize, radius: 6 * k, fill: 'rgb(139 92 246 / .16)', stroke: accent });
        s.text({ id: `doc-${i}-rank`, at: [at[0], at[1], at[2] + 5 * k], text: `${rank + 1}`, size: l.rankSize, weight: 600, font: 'sans', color: '#ffffff', anchor: 'middle', pill: { fill: '#6d28d9', padX: l.rankSize * 0.55, padY: l.rankSize * 0.3, radius: l.rankSize * 0.8 } });
      }
    });
    s.pivot(`doc-${i}`, at);
  });

  const card = (end: Vec3, o: Layout['question']): Vec2 => {
    const [x, y] = s.project(end);
    return [x + o.dx * k, y + o.dy * k];
  };
  const muted = `<div style="font-size:.8em;color:${ui.muted};margin-bottom:.35em">`;
  const qText = 'How long do refunds take?';
  const qAt = card(qEnd, l.question);
  const aAt = card(aEnd, l.answer);
  const fit = (p: Vec2, text: string, anchor: Layout['question']['anchor']): Vec2 => [fitX(p[0], text, l.width, l.minPx, anchor === 'top' || anchor === 'bottom' ? 'center' : anchor, 'sans', 2.2), p[1]];
  s.label({ id: 'question', at: { screen: fit(qAt, qText, l.question.anchor) }, variant: 'card', size: 14, anchor: l.question.anchor, html: `${muted}you</div>${qText}` });
  s.label({ id: 'answer', at: { screen: fit(aAt, 'Refunds reach your card in', l.answer.anchor) }, variant: 'card', size: 14, anchor: l.answer.anchor, html: `${muted}answer · 3 sources</div>Refunds reach your card in<br>5 to 7 business days. ${cite(cited[0])} ${cite(cited[1])}` });

  s.dropIn('store', 0.1);
  s.dropIn('retriever', 0.25);
  s.dropIn('model', 0.33);
  order.forEach((i, n) => s.intro(`doc-${i}`, 'opacity', 0.45 + n * 0.05, 0.15, 0, 1, ease.linear));

  const flash = (id: string, t: number, hold = 0) => {
    s.at(id, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at(id, 'opacity', t + 0.1 + hold, 0.6, 1, 0, ease.linear);
  };
  const tug = (id: string, t: number, by: string) => {
    s.at(id, 'translate', t, 0.3, '0 0', by, pull);
    s.at(id, 'translate', t + 0.3, 0.74, by, '0 0', settle);
  };
  const go = (p: string, t: number) => {
    const d = Math.max(0.3, s.wireLength(`w-${p}`) / 270);
    s.travel(`p-${p}`, t, d);
    return t + d;
  };

  s.at('question', 'opacity', 0.2, 0.25, 0, 1, ease.out);
  s.at('question', 'translate', 0.2, 0.45, '0 10px', '0 0', ease.out);
  const atR = go('q', 1.0);
  flash('retriever-glow', atR, 0.3);
  tug('retriever', atR, '0 3px');
  const atS = go('r', atR + 0.15);
  flash('store-glow', atS, 0.2);

  const lift = 30 * k;
  let into = 0;
  matches.forEach((i, n) => {
    const at = docAt(i);
    const up: Vec3 = [at[0], at[1], at[2] + lift];
    const t = atS + 0.1 + n * 0.12;
    s.at(`doc-${i}-hot`, 'opacity', t, 0.25, 0, 1, ease.linear);
    s.at(`doc-${i}-rank`, 'opacity', t, 0.25, 0, 1, ease.linear);
    s.at(`doc-${i}`, 'translate', t, 0.35, '0 0', s.offset(at, up), pull);
    const fly = atS + 0.9 + n * 0.18;
    const over: Vec3 = [M[0] + (n - 1) * 14 * k * l.dir[1], M[1] - (n - 1) * 14 * k * l.dir[0], mTop + lift];
    s.at(`doc-${i}`, 'translate', fly, 1.0, s.offset(at, up), s.offset(at, over), settle);
    const sink = fly + 1.0;
    s.at(`doc-${i}`, 'scale', sink, 0.35, 1, 0.2, shrink);
    s.at(`doc-${i}`, 'opacity', sink + 0.2, 0.15, 1, 0, ease.linear);
    into = sink + 0.35;
  });
  const first = atS + 1.9;
  s.at('model-glow', 'opacity', first + 0.3, 0.1, 0, 1, ease.linear);
  s.at('model-glow', 'opacity', into + 0.1, 0.6, 1, 0, ease.linear);
  tug('model', into, '0 4px');
  const atA = go('a', into + 0.2);
  s.at('answer', 'opacity', atA, 0.2, 0, 1, ease.linear);
  s.at('answer', 'clipPath', atA, 1.4, 'inset(-40% 100% -60% -20%)', 'inset(-40% -20% -60% -20%)', 'steps(30, end)');
  const read = atA + 1.4;

  const reset = read + 2.6;
  s.at('question', 'opacity', reset, 0.5, 1, 0, ease.linear);
  s.at('answer', 'opacity', reset, 0.5, 1, 0, ease.linear);
  matches.forEach((i, n) => {
    const t = reset + 0.5;
    s.set(`doc-${i}`, 'translate', t, '0 0');
    s.set(`doc-${i}`, 'scale', t, 1);
    s.set(`doc-${i}-hot`, 'opacity', t, 0);
    s.set(`doc-${i}-rank`, 'opacity', t, 0);
    s.at(`doc-${i}`, 'opacity', t + 0.1 + n * 0.12, 0.3, 0, 1, ease.linear);
  });
  s.loop(Math.round((reset + 0.5 + 0.1 + matches.length * 0.12 + 0.6) * 10) / 10, read + 0.6);
  return s;
}

export const example: Example = {
  slug: 'rag-answer',
  title: 'Retrieval-backed answer',
  story: 'A question reaches the retriever, three matching documents lift out of the store and flow into the model, and the answer types in citing two of them.',
  prompt: 'Draw retrieval-augmented generation: a question goes to a retriever, three matching document cards lift out of a store and travel into a model, and an answer card types in with citations.',
  level: 'complex',
  category: 'data',
  useCase: 'AI search',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build({
      name: 'rag-sm', width: 390, height: 540, origin: [214, 268], k: 0.76, dir: [1, 0], minPx: narrowest,
      question: { anchor: 'bottom', dx: 0, dy: -2 }, answer: { anchor: 'top', dx: 0, dy: 2 }, textSize: 10, rankSize: 11, legs: { q: [0, -1], a: [0, 1], qLen: 60, aLen: 96 },
    }),
    build({
      name: 'rag-lg', width: 1100, height: 520, origin: [556, 268], k: 1.12, dir: [0, -1], minPx: 721,
      question: { anchor: 'right', dx: -12, dy: 0 }, answer: { anchor: 'left', dx: 12, dy: 0 }, textSize: 13, rankSize: 12, legs: { q: [0, 1], a: [0, -1], qLen: 62, aLen: 62 },
    }),
    720,
  ),
};

export default page(example);
