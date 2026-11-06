import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fonts, page, surfaces, type Example } from './shared';

const ui = surfaces.light;
const accent = '#6366f1';
const ink = '#3f3f46';
const line = 'rgb(22 23 27 / .32)';
const rise = 'cubic-bezier(.22,1,.36,1)';

const terms = ['edge', 'fast', 'token', 'shard', 'cache', 'rank', 'store', 'match', 'query', 'score', 'index', 'term'] as const;
const query = ['fast', 'cache'] as const;
const cols = 4;
const results = ['doc-b', 'doc-a', 'doc-c'] as const;

function build(name: string, width: number, height: number, origin: readonly [number, number], k: number, askLabel: 'top' | 'side') {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const v = (x: number, y: number, z = 0): Vec3 => [x * k, y * k, z * k];
  const wz = -6;
  const tile = 40 * k;
  const termSize = Math.round(tile * 0.28 * 2) / 2;
  const pitch = 47 * k;
  const plateSize = [cols * pitch + 16 * k, 3 * pitch + 16 * k] as const;
  const tileAt = (i: number): Vec3 => [(-(cols - 1) / 2 + (i % cols)) * pitch, (-1 + Math.floor(i / cols)) * pitch, 8 * k];
  const pile = v(-230, 0);
  const ask = v(0, -200);
  const ranked = [-72, 0, 72].map(x => v(x, 226));
  const slab = (id: string, at: Vec3, size: readonly [number, number], h: number, top: string = ui.top) =>
    s.slab({ id, at, size, height: h, radius: Math.min(size[0], size[1]) * 0.18, top, side: { kind: 'flat', color: '#f1f1f3' }, outline: line, shade: false, shadow: true, edge: line });

  s.wire({ id: 'w-docs', points: [v(-230 + 30, 0, wz), v(-plateSize[0] / 2 / k, 0, wz)], stroke: ui.wire, width: 1.25 });
  s.wire({ id: 'w-ask', points: [v(0, -200 + 28, wz), v(0, -plateSize[1] / 2 / k, wz)], stroke: ui.wire, width: 1.25 });
  const out = ranked.map(at => [[at[0], plateSize[1] / 2, wz * k], [at[0], at[1] - 30 * k, wz * k]] as const);
  out.forEach((points, i) => s.wire({ id: `w-out-${i}`, points, stroke: ui.wire, width: 1.25, hidden: true }));
  s.pulse({ id: 'p-docs', wire: 'w-docs', color: accent, length: 0.22 });
  s.pulse({ id: 'p-ask', wire: 'w-ask', color: accent, length: 0.22 });

  s.group('pile', () => {
    [0, 1, 2].forEach(i => slab(`doc-${i}`, [pile[0], pile[1], pile[2] + i * 9 * k], [60 * k, 60 * k], 6 * k));
    s.face({ id: 'doc-glow', at: [pile[0], pile[1], pile[2] + 18 * k], size: [60 * k, 60 * k], radius: 11 * k, fill: 'rgb(99 102 241 / .16)' });
    s.text({ id: 'pile-name', at: [pile[0], pile[1], pile[2] + 18 * k], text: 'docs', size: 11, color: ink, on: 'top', anchor: 'middle' });
  });

  s.group('ask', () => {
    slab('ask-slab', ask, [56 * k, 56 * k], 14 * k);
    s.face({ id: 'ask-glow', at: ask, size: [56 * k, 56 * k], radius: 10 * k, fill: 'rgb(99 102 241 / .18)' });
    s.text({ id: 'ask-name', at: ask, text: 'search', size: 10, color: ink, on: 'top', anchor: 'middle' });
  });

  slab('plate', [0, 0, 0], plateSize, 12 * k, '#fafafa');
  terms.forEach((term, i) => {
    const at = tileAt(i);
    s.group(`t-${i}`, () => {
      slab(`t-${i}-slab`, at, [tile, tile], 8 * k);
      if ((query as readonly string[]).includes(term)) {
        s.face({ id: `t-${i}-hit`, at, size: [tile, tile], radius: tile * 0.18, fill: accent });
        s.text({ id: `t-${i}-word`, at, text: term, size: termSize, color: ink, on: 'top', anchor: 'middle' });
        s.text({ id: `t-${i}-lit`, at, text: term, size: termSize, color: '#ffffff', on: 'top', anchor: 'middle' });
      } else s.text({ id: `t-${i}-word`, at, text: term, size: termSize, color: ink, on: 'top', anchor: 'middle' });
    });
  });

  ranked.forEach((at, i) => {
    const r = results[i]!;
    s.group(`r-${i}`, () => {
      slab(`r-${i}-slab`, at, [60 * k, 60 * k], 14 * k, i === 0 ? '#eef0ff' : ui.top);
      s.text({ id: `r-${i}-rank`, at: [at[0], at[1] - 11 * k, at[2]], text: `${i + 1}`, size: 16, weight: 600, font: 'sans', color: i === 0 ? accent : ink, on: 'top', anchor: 'middle' });
      s.text({ id: `r-${i}-doc`, at: [at[0], at[1] + 13 * k, at[2]], text: r, size: termSize, color: '#71717a', on: 'top', anchor: 'middle' });
    });
  });

  s.label({ id: 'q', at: askLabel === 'top' ? [ask[0], ask[1], ask[2] + 52 * k] : [ask[0] - 24 * k, ask[1] + 24 * k, ask[2] + 34 * k], text: query.join(' '), size: 13, anchor: askLabel === 'top' ? 'center' : 'right' });

  s.dropIn('plate', 0.1);
  s.dropIn('pile', 0.25);
  s.dropIn('ask', 0.33);

  const travel = (p: string, wire: string, t: number) => {
    const dur = Math.max(0.3, s.wireLength(wire) / 270);
    s.travel(p, t, dur);
    return t + dur;
  };
  const flash = (id: string, t: number) => s.at(id, 'opacity', t, 0.1, 0, 1, ease.linear).at(id, 'opacity', t + 0.1, 0.6, 1, 0, ease.linear);

  let t = 0.2;
  for (let batch = 0; batch < 3; batch++) {
    flash('doc-glow', t);
    const land = travel('p-docs', 'w-docs', t + 0.05);
    for (let j = 0; j < cols; j++) s.dropAt(`t-${batch * cols + j}`, land + j * 0.117, 24 * k);
    t = land + cols * 0.117 + 0.25;
  }

  const ask0 = t + 0.3;
  s.at('q', 'opacity', ask0, 0.2, 0, 1, ease.out);
  s.typeIn('q', ask0, 0.6, 10);
  flash('ask-glow', ask0 + 0.6);
  const found = travel('p-ask', 'w-ask', ask0 + 0.65);
  terms.forEach((term, i) => {
    if (!(query as readonly string[]).includes(term)) return;
    const on = found + 0.05 * query.indexOf(term as (typeof query)[number]);
    s.at(`t-${i}-hit`, 'opacity', on, 0.25, 0, 1, ease.linear);
    s.at(`t-${i}-lit`, 'opacity', on, 0.25, 0, 1, ease.linear);
    s.at(`t-${i}`, 'translate', on, 0.3, '0 0', '0 -6px', rise);
  });
  const send = found + 0.45;
  ranked.forEach((_, i) => {
    const at = send + i * 0.22;
    s.draw(`w-out-${i}`, at, 0.3);
    s.at(`r-${i}`, 'opacity', at + 0.2, 0.2, 0, 1, ease.linear);
    s.at(`r-${i}`, 'translate', at + 0.2, 0.6, '0 18px', '0 0', rise);
  });
  const shown = send + 2 * 0.22 + 0.8;

  const clear = shown + 2.2;
  s.at('q', 'opacity', clear, 0.3, 1, 0, ease.linear);
  s.set('q', 'clipPath', clear + 0.3, 'inset(-20% 100% -20% 0)');
  ranked.forEach((_, i) => {
    s.at(`r-${i}`, 'opacity', clear + 0.1 + i * 0.06, 0.3, 1, 0, ease.linear);
    s.retract(`w-out-${i}`, clear + i * 0.06, 0.25, 'start');
  });
  terms.forEach((term, i) => {
    if (!(query as readonly string[]).includes(term)) return;
    s.at(`t-${i}-hit`, 'opacity', clear, 0.3, 1, 0, ease.linear);
    s.at(`t-${i}-lit`, 'opacity', clear, 0.3, 1, 0, ease.linear);
    s.at(`t-${i}`, 'translate', clear, 0.3, '0 -6px', '0 0', ease.io);
  });
  const empty = clear + 0.5;
  terms.forEach((_, i) => {
    const at = empty + (terms.length - 1 - i) * 0.033;
    s.at(`t-${i}`, 'opacity', at, 0.18, 1, 0, ease.linear);
  });
  s.loop(Math.round((empty + terms.length * 0.033 + 0.6) * 10) / 10, shown + 0.6);
  return s;
}

export const example: Example = {
  slug: 'search-index',
  title: 'Search index ranking',
  story: 'Documents are split into terms that fill an index; a query lights the matching terms and three results rise in ranked order.',
  prompt: 'Draw documents being split into term tiles that fill a search index, then a query lighting up the matching tiles and three ranked results rising out of it.',
  level: 'medium',
  category: 'data',
  useCase: 'Search',
  surface: 'light',
  interaction: 'watch',
  art: art(build('searchidx-sm', 390, 460, [214, 236], 0.82, 'side'), build('searchidx-lg', 720, 420, [360, 196], 0.98, 'top'), 520),
};

export default page(example);
