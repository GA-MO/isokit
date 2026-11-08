import { expect, test } from 'bun:test';
import { Scene, isoCss, lazyBox } from './iso';
import { mount } from './runtime';

const scene = () => new Scene({ name: 'demo', width: 400, height: 300 });

test('segments that meet through float error compile to ordered offsets inside [0, 1]', () => {
  const s = scene().slab({ id: 'core', at: [0, 0, 0], size: [80, 80], height: 20, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' } });
  s.loop(0.3, 0).at('core', 'opacity', 0.1, 0.2, 0, 1).intro('core', 'scale', 0, 0.1, 0.5, 1);
  const s2 = scene().slab({ id: 'core', at: [0, 0, 0], size: [80, 80], height: 20, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' } });
  s2.loop(5, 0).at('core', 'opacity', 4.65, 0.12, 0, 1).at('core', 'opacity', 4.77, 0.1, 1, 0);
  for (const spec of [s.motion(), s2.motion()]) {
    for (const t of spec.tracks) {
      const offsets = t.keyframes.map(k => Number(k.offset));
      expect(offsets.every((o, i) => o >= 0 && o <= 1 && (i === 0 || o >= offsets[i - 1]!))).toBe(true);
    }
  }
});

test('overlapping segments on one property are rejected with the id and time', () => {
  const s = scene().slab({ id: 'core', at: [0, 0, 0], size: [80, 80], height: 20, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' } });
  s.loop(4, 0).at('core', 'opacity', 1, 1, 0, 1).at('core', 'opacity', 1.5, 1, 1, 0);
  expect(() => s.motion()).toThrow(/core\.opacity segments overlap at 1\.5s/);
});

test('a value holds across a gap instead of drifting to the next segment', () => {
  const s = scene().slab({ id: 'core', at: [0, 0, 0], size: [80, 80], height: 20, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' } });
  s.loop(10, 0).at('core', 'opacity', 1, 1, 0, 1).at('core', 'opacity', 6, 1, 0.5, 0);
  const kf = s.motion().tracks[0]!.keyframes;
  const at6 = kf.filter(k => Number(k.offset) === 0.6).map(k => k.opacity);
  expect(at6).toEqual([1, 0.5]);
});

test('ids the kit makes for itself never collide with author ids', () => {
  const html = scene()
    .slab({ id: 'core', at: [0, 0, 0], size: [80, 80], height: 20, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' } })
    .label({ id: 'core-left', at: [0, 0, 40], text: 'hi' })
    .render();
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  expect(new Set(ids).size).toBe(ids.length);
});

test('quotes in fonts and text cannot break the markup', () => {
  const html = new Scene({ name: 'q', width: 200, height: 200, font: '"Noto Sans Thai", sans-serif' })
    .label({ id: 'l', at: { screen: [10, 10] }, text: '<b>"x"</b>', className: 'a" onclick="x' })
    .render();
  expect(html).not.toContain('onclick="x');
  expect(html).not.toContain('<b>');
  expect(html).toContain('&quot;Noto Sans Thai&quot;');
});

test('a wire with a repeated point is rejected', () => {
  expect(() => scene().wire({ id: 'w', points: [[0, 0, 0], [10, 0, 0], [10, 0, 0], [10, 10, 0]], stroke: '#000000' })).toThrow(/repeats point/);
});

test('non-finite times are rejected', () => {
  const s = scene().slab({ id: 'core', at: [0, 0, 0], size: [80, 80], height: 20, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' } });
  expect(() => s.at('core', 'opacity', Number.NaN, 1, 0, 1)).toThrow(/finite/);
  expect(() => s.loop(4, Number.NaN)).toThrow(/still/);
});

test('slab sides bend around the corner with unique ids for every paint and corner mode', () => {
  const paint = (_: 'left' | 'right', a: { x: number; y: number; width: number; height: number }, t: string) => `<rect x="${a.x}" y="${a.y}" width="${a.width}" height="${a.height}" fill="#123456" transform="${t}"/>`;
  const html = new Scene({ name: 'c', width: 400, height: 300 })
    .slab({ id: 'bend', at: [-80, 0, 0], size: [80, 80], height: 20, radius: 14, top: '#ffffff', side: { kind: 'custom', paint } })
    .slab({ id: 'fade', at: [80, 0, 0], size: [80, 80], height: 20, radius: 14, top: '#ffffff', side: { kind: 'custom', paint, corner: 'fade', opacity: 0.6 }, translucent: true })
    .slab({ id: 'mb', at: [0, 80, 0], size: [80, 80], height: 20, top: '#ffffff', side: { kind: 'marble', colors: ['#000000', '#777777', '#ffffff'] } })
    .render();
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  expect(new Set(ids).size).toBe(ids.length);
  expect(html).toContain('id="c_bend_k12"');
  expect(html).toContain('mask="url(#c_fade_hole)"');
  expect(html).toContain('opacity="0.6"');
  expect(html).not.toContain('NaN');
});

test('square, oversized-radius and thin slabs still shade the left side and stay finite', () => {
  const html = new Scene({ name: 'e', width: 400, height: 300 })
    .slab({ id: 'sq', at: [-80, 0, 0], size: [80, 80], height: 20, radius: 0, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' } })
    .slab({ id: 'big', at: [80, 0, 0], size: [60, 40], height: 20, radius: 90, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' } })
    .slab({ id: 'thin', at: [0, 80, 0], size: [60, 60], height: 3, radius: 12, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' } })
    .render();
  expect(html).not.toContain('NaN');
  expect(html).toContain('id="e_sq_shade"');
  expect(html).not.toContain('id="e_thin_k1"');
});

const tile = (hover?: { label: string }) =>
  scene().slab({ id: 'tile', at: [0, 0, 10], size: [60, 60], height: 10, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' }, ...(hover ? { hover: { lift: 12, ...hover } } : {}) });

test('a hover slab lifts by its own amount and reveals its label only on hover or tap', () => {
  const s = scene().label({ id: 'name', at: [0, 0, 60], text: 'docs' });
  s.slab({ id: 'tile', at: [0, 0, 10], size: [60, 60], height: 10, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' }, hover: { lift: 12, side: { kind: 'flat', color: '#2563eb' }, label: 'name' } });
  const html = s.render();
  expect(html).toContain('class="iso-hover" style="--lift:12"');
  expect(html).toContain('class="iso-hot"');
  expect(html).toContain('#demo_name{opacity:0');
  expect(html).toContain('.iso:has(#demo_tile.is-hot) #demo_name{opacity:1');
});

test('a hover slab without a new look only lifts, and a plain slab stays plain', () => {
  const lift = scene().slab({ id: 'tile', at: [0, 0, 10], size: [60, 60], height: 10, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' }, hover: {} });
  expect(lift.render()).toContain('--lift:16');
  expect(lift.render()).not.toContain('iso-hot');
  expect(tile().render()).not.toContain('iso-hover');
});

test('a hover label must exist before the slab that reveals it', () => {
  expect(() => tile({ label: 'missing' })).toThrow(/reveals label "missing"/);
});

test('offset gives the screen move between two plane points', () => {
  expect(scene().offset([0, 0, 0], [100, 0, 20])).toBe('70.71px 20.82px');
});

test('dropAt drops inside the loop and needs an exit so the element is hidden before it falls', () => {
  const s = tile();
  s.loop(4, 0).dropAt('tile', 1).at('tile', 'opacity', 3, 0.2, 1, 0);
  const op = s.motion().tracks.find(t => t.prop === 'opacity')!;
  expect(op.repeat).toBe(true);
  expect(op.keyframes[0]!.opacity).toBe(0);
});

test('a hover slab may not fade in the loop, and its label may not be animated', () => {
  const fades = scene().slab({ id: 'tile', at: [0, 0, 10], size: [60, 60], height: 10, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' }, hover: {} });
  fades.loop(4, 0).dropAt('tile', 1);
  expect(() => fades.motion()).toThrow(/hover slab "tile" fades inside the loop/);
  const s = scene().label({ id: 'name', at: [0, 0, 60], text: 'docs' });
  s.slab({ id: 'tile', at: [0, 0, 10], size: [60, 60], height: 10, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' }, hover: { label: 'name' } });
  s.intro('name', 'opacity', 0, 0.3, 0, 1).intro('tile', 'opacity', 0, 0.1, 0, 1);
  expect(() => s.motion()).toThrow(/label "name" is revealed by hover/);
});

test('frame draws a dashed box with top, bottom and four upright edges, or three without the back', () => {
  const s = scene().frame({ id: 'cage', at: [0, 0, 80], size: [100, 100], height: 80, stroke: '#888888' });
  const html = s.render();
  expect((html.match(/<path [^>]*stroke-dasharray="3 3"/g) ?? []).length).toBe(4);
  expect((html.match(/<rect [^>]*stroke-dasharray="3 3"/g) ?? []).length).toBe(2);
  const noBack = scene().frame({ id: 'cage', at: [0, 0, 80], size: [100, 100], height: 80, stroke: '#888888', back: false }).render();
  expect((noBack.match(/<path [^>]*stroke-dasharray/g) ?? []).length).toBe(3);
});

test('tug pulls, holds and eases back to rest inside the loop', () => {
  const s = tile();
  s.loop(3, 0).tug('tile', 0.5, '-6px 0');
  const kf = s.motion().tracks.find(t => t.prop === 'translate')!.keyframes;
  expect(kf[0]!.translate).toBe('0 0');
  expect(kf.some(k => k.translate === '-6px 0')).toBe(true);
  expect(kf[kf.length - 1]!.translate).toBe('0 0');
});

test('hover guides appear only with the guides option', () => {
  const g = scene().slab({ id: 'tile', at: [0, 0, 10], size: [60, 60], height: 10, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' }, hover: { guides: '#ffffff' } }).render();
  expect((g.match(/class="iso-guides"[^>]*>(<path [^>]*\/>){3}<\/g>/g) ?? []).length).toBe(1);
  expect(tile().render()).not.toContain('iso-guides');
});

test('unproject inverts project at any height and ratio', () => {
  for (const ratio of [Math.tan(Math.PI / 6), 0.55]) {
    const s = new Scene({ name: 'u', width: 640, height: 320, ratio });
    const p: readonly [number, number, number] = [37, -12, 25];
    const back = s.unproject(s.project(p), 25);
    back.forEach((v, i) => expect(v).toBeCloseTo(p[i]!, 6));
  }
});

test('a group wraps everything drawn inside it and refuses HTML labels', () => {
  const s = scene();
  s.group('stack', () => {
    s.slab({ id: 'a', at: [0, 0, 10], size: [60, 60], height: 10, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' } });
    s.text({ id: 't', at: [0, 0, 40], text: 'hi' });
  });
  expect(s.render()).toMatch(/<g id="demo_stack"><g id="demo_a">.*<g id="demo_t">/s);
  expect(() => scene().group('g', () => {}).label({ id: 'l', at: [0, 0, 0], text: 'x' })).not.toThrow();
  const bad = scene();
  expect(() => bad.group('g', () => { bad.label({ id: 'l', at: [0, 0, 0], text: 'x' }); })).toThrow(/use text\(\) instead/);
});

test('pivot sets a view-box transform origin at the projected point and rejects unknown ids', () => {
  const s = tile();
  s.pivot('tile', [0, 0, 0]);
  expect(s.render()).toContain('#demo_tile{transform-box:view-box;transform-origin:200px 150px}');
  expect(() => tile().pivot('nope', [0, 0, 0]).render()).toThrow(/pivot\(\) names unknown id "nope"/);
});

test('a flat side is one rect instead of corner strips', () => {
  const html = tile().render();
  expect(html).not.toContain('_k0');
});

test('prism heightTo reveals the column and moves the cap within its reach', () => {
  const s = scene().prism({ id: 'bar', at: [0, 0, 0], size: [60, 60], height: 10, reach: 80, top: '#ffffff', side: '#3355ff' });
  s.loop(2, 0).heightTo('bar', 0.2, 0.6, 10, 80).heightTo('bar', 1.2, 0.5, 80, 10);
  const tracks = s.motion().tracks;
  expect(tracks.find(t => t.target === 'demo_bar-col')!.keyframes.some(k => k.clipPath === 'inset(0px -4px -4px -4px)')).toBe(true);
  expect(tracks.find(t => t.target === 'demo_bar-cap')!.keyframes.some(k => k.translate === '0 -70px')).toBe(true);
  expect(() => scene().prism({ id: 'b', at: [0, 0, 0], size: [60, 60], height: 10, reach: 40, top: '#fff', side: '#000' }).heightTo('b', 0, 1, 10, 90)).toThrow(/between 0 and its reach 40/);
});

test('turntable spins every layer in its own plane', () => {
  const s = scene().turntable({ id: 'core', at: [0, 0, 30], size: [80, 80], height: 30, top: '#111111', side: ['#222222', '#7c3aed'], layers: 6 });
  s.spin('core', 0, 1, 180, 0, undefined, 'intro');
  const rot = s.motion().tracks.filter(t => t.prop === 'rotate');
  expect(rot.length).toBe(7);
  expect(rot[0]!.keyframes[0]!.rotate).toBe('180deg');
  expect(() => scene().spin('nope', 0, 1, 0, 90)).toThrow(/not a turntable/);
});

test('a hidden wire draws in and retracts, set() jumps instantly, introUntil pads the intro', () => {
  const s = scene().slab({ id: 'a', at: [0, 0, 10], size: [40, 40], height: 10, top: '#fff', side: { kind: 'flat', color: '#ccc' } });
  s.wire({ id: 'w', points: [[0, 0, 0], [80, 0, 0]], stroke: '#888888', hidden: true });
  expect(s.render()).toContain('stroke-dasharray="1 2"');
  s.loop(3, 0).draw('w', 0.2, 0.4).retract('w', 2, 0.3).set('a', 'opacity', 1.5, 0.5).introUntil(1.25);
  const spec = s.motion();
  expect(spec.intro).toBe(1.25);
  expect(spec.tracks.find(t => t.prop === 'strokeDashoffset')!.keyframes.map(k => k.strokeDashoffset)).toContain(0);
  expect(() => scene().draw('nope', 0, 1)).toThrow(/wire\(\{ hidden: true \}\)/);
});

test('hover timing options reach the element as CSS variables and a hold', () => {
  const html = scene().slab({ id: 't', at: [0, 0, 10], size: [40, 40], height: 10, top: '#fff', side: { kind: 'flat', color: '#ccc' }, hover: { on: 420, off: 270, onEase: 'linear(0, 1.3 30%, 1)' } }).render();
  expect(html).toContain('--iso-on:420ms;--iso-off:270ms;--iso-on-ease:linear(0, 1.3 30%, 1)');
  expect(html).toContain('data-hold="420"');
});

test('prism follows a slanted top on non-square sizes and starts clipped without JS', () => {
  for (const size of [[200, 50], [50, 200]] as const) {
    const s = scene().prism({ id: 'p', at: [0, 0, 0], size, height: 40, reach: 140, top: '#ffffff', side: ['#111111', '#333333'] });
    const html = s.render();
    expect(html).toMatch(/#demo_p-col\{clip-path:inset\([\d.]+px -4px -4px -4px\)\}/);
    expect(html).toContain('_rs)');
    expect(html).toMatch(/<g id="demo_p-cap"><path d="M[^"]+Z" fill="#111111"\/>/);
  }
});

test('hidden wires reject a dash and draw() rejects wires that are not hidden', () => {
  expect(() => scene().wire({ id: 'w', points: [[0, 0, 0], [10, 0, 0]], stroke: '#000', hidden: true, dash: '2 2' })).toThrow(/cannot also take dash/);
  const s = scene().wire({ id: 'w', points: [[0, 0, 0], [10, 0, 0]], stroke: '#000' });
  expect(() => s.draw('w', 0, 1)).toThrow(/wire\(\{ hidden: true \}\)/);
});

test('ambient tracks run on their own period from the first frame and refuse to share a property with timed segments', () => {
  const s = tile();
  s.loop(18, 0).march('tile', 4, 4, 24).at('tile', 'opacity', 1, 0.5, 1, 0).at('tile', 'opacity', 5, 0.5, 0, 1);
  const t = s.motion().tracks.find(k => k.prop === 'strokeDashoffset')!;
  expect(t.duration).toBe(333);
  expect(t.delay).toBe(0);
  expect(t.repeat).toBe(true);
  expect(t.keyframes.map(k => k.strokeDashoffset)).toEqual([0, -8]);
  const clash = tile();
  clash.loop(4, 0).wobble('tile').at('tile', 'scale', 1, 1, 1, 1.1);
  expect(() => clash.motion()).toThrow(/ambient track and timed segments/);
});

test('def refuses a <g> inside a clipPath', () => {
  expect(() => scene().def('c', '<clipPath id="$ID"><g transform="translate(1 1)"><rect width="4" height="4"/></g></clipPath>')).toThrow(/<g> inside a <clipPath>/);
});

test('an image side is embedded once and reused by every corner strip', () => {
  const s = scene().slab({ id: 'b', at: [0, 0, 40], size: [80, 80], height: 40, radius: 14, top: '#fff', side: { kind: 'image', href: 'data:image/webp;base64,AAAA' } });
  const html = s.render();
  expect((html.match(/data:image\/webp;base64,AAAA/g) ?? []).length).toBe(1);
  expect((html.match(/<use href="#demo_b_texl"/g) ?? []).length).toBeGreaterThan(10);
});

const exportable = () =>
  scene()
    .slab({ id: 'core', at: [0, 0, 0], size: [80, 80], height: 20, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' } })
    .text({ id: 'name', at: [0, 0, 0], text: 'a < b', on: 'top' });

test('exportSvg writes one standalone SVG whose motion is CSS keyframes, with no script', () => {
  const s = exportable();
  s.dropIn('core', 0.1).loop(4, 1).at('name', 'opacity', 1, 0.5, 0, 1, 'cubic-bezier(.22,1,.36,1)');
  const svg = s.exportSvg({ title: 'Demo & co', background: '#101114', radius: 16 });
  expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"')).toBe(true);
  expect(svg).not.toContain('<script');
  expect(svg).not.toContain('<div');
  expect(svg).toContain('<title>Demo &amp; co</title>');
  expect(svg).toContain('<rect width="100%" height="100%" fill="#101114" rx="16"/>');
  expect(svg).toContain('a &lt; b');
  expect(svg).toContain('svg{color:#0f172a;');
  const names = [...svg.matchAll(/@keyframes (demo_k\d+)/g)].map(m => m[1]);
  expect(names.length).toBe(s.motion().tracks.length);
  expect(svg).toMatch(/#demo_core\{animation:demo_k\d+ 650ms linear 0ms 1 both,demo_k\d+ 650ms linear 0ms 1 both\}/);
  expect(svg).toMatch(/#demo_name\{animation:demo_k\d+ 4000ms linear 650ms infinite backwards\}/);
  expect(svg).toContain('animation-timing-function:cubic-bezier(.22,1,.36,1)');
});

test('exportSvg keyframe percentages only grow, so a jump at one instant keeps both values', () => {
  const s = exportable();
  s.loop(10, 0).at('core', 'opacity', 1, 1, 0, 1).at('core', 'opacity', 6, 1, 0.5, 0);
  const block = s.exportSvg().match(/@keyframes demo_k0\{(.*?)\}\}/)?.[1] ?? '';
  const pcts = [...block.matchAll(/([\d.]+)%\{/g)].map(m => Number(m[1]));
  expect(pcts.every((p, i) => i === 0 || p > pcts[i - 1]!)).toBe(true);
  expect(block).toContain('60%{opacity:1}');
  expect(block).toContain('60.001%{opacity:0.5');
});

test('exportSvg stills every animation at the reduced-motion frame', () => {
  const s = exportable();
  s.dropIn('core', 0.1).loop(4, 1.5).at('name', 'opacity', 1, 0.5, 0, 1);
  const svg = s.exportSvg();
  expect(svg).toContain('@media (prefers-reduced-motion:reduce){');
  expect(svg).toContain('#demo_name{animation-play-state:paused;animation-delay:-1500ms}');
});

test('exportSvg rejects HTML labels and points to text()', () => {
  const s = exportable().label({ id: 'tag', at: [0, 0, 40], text: 'hi' });
  expect(() => s.exportSvg()).toThrow(/found label\(\) "tag".*draw them with text\(\)/);
  expect(() => exportable().exportSvg({ background: ' ' })).toThrow(/background must be a CSS colour/);
});

test('exportSvg keeps pivots, which a standalone SVG cannot get from the page', () => {
  const s = exportable().pivot('core', [0, 0, 0]);
  expect(s.exportSvg()).toContain('#demo_core{transform-box:view-box;transform-origin:200px 150px}');
});

test('lazyBox reserves the compact and wide aspect ratios and names both scenes', () => {
  const html = lazyBox({ name: 'a-sm', width: 390, height: 300 }, { name: 'a-lg', width: 720, height: 400 }, 520);
  expect(html).toContain('.iso-lazy-a-sm{aspect-ratio:390/300}@container (min-width:521px){.iso-lazy-a-sm{aspect-ratio:720/400}}');
  expect(html).toContain('data-iso-lazy data-compact="a-sm" data-wide="a-lg" data-breakpoint="520"');
  expect(lazyBox({ name: 'spot', width: 390, height: 300 })).not.toContain('data-wide');
});

test('lazyBox rejects names that are not kebab, empty sizes and bad breakpoints', () => {
  expect(() => lazyBox({ name: 'a"><script>', width: 390, height: 300 })).toThrow(/must be lower-case kebab/);
  expect(() => lazyBox({ name: 'a', width: 0, height: 300 })).toThrow(/positive width and height/);
  expect(() => lazyBox({ name: 'a', width: 390, height: Number.NaN })).toThrow(/positive width and height/);
  for (const bp of [0, -1, Number.POSITIVE_INFINITY]) expect(() => lazyBox({ name: 'a', width: 390, height: 300 }, { name: 'b', width: 720, height: 400 }, bp)).toThrow(/breakpoint must be a positive/);
});

const box = () => scene().slab({ id: 'box', at: [0, 0, 0], size: [80, 80], height: 40, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' } });

test('text on a side plane inside a slab throws and names the visible face', () => {
  const left = box().text({ id: 'hidden', at: [0, 10, -20], text: 'docs', on: 'left' });
  expect(() => left.render()).toThrow(/text "hidden" .* left plane at y = 10, inside "box" where no face shows; put it on the visible left face at y = 40 \(z between -40 and 0\)/);
  const right = box().text({ id: 'back', at: [-40, 0, -20], text: 'db', on: 'right' });
  expect(() => right.render()).toThrow(/right plane at x = -40, inside "box".*visible right face at x = 40/);
  expect(() => box().text({ id: 'hidden', at: [0, 10, -20], text: 'docs', on: 'left' }).exportSvg()).toThrow(/no face shows/);
});

test('text on a visible side face, beside a slab or above it renders', () => {
  expect(() => box().text({ id: 'front', at: [0, 40, -20], text: 'docs', on: 'left' }).render()).not.toThrow();
  expect(() => box().text({ id: 'side', at: [40, 0, -20], text: 'db', on: 'right' }).render()).not.toThrow();
  expect(() => box().text({ id: 'beside', at: [0, 120, -20], text: 'x', on: 'left' }).render()).not.toThrow();
  expect(() => box().text({ id: 'above', at: [0, 10, 60], text: 'x', on: 'left' }).render()).not.toThrow();
  expect(() => box().text({ id: 'top', at: [0, 10, 0], text: 'x', on: 'top' }).render()).not.toThrow();
});

test('a prism counts up to its reach', () => {
  const s = scene().prism({ id: 'bar', at: [0, 0, 0], size: [40, 40], height: 20, reach: 80, top: '#fff', side: '#ccc' });
  expect(() => s.text({ id: 'in', at: [0, 0, 60], text: 'x', on: 'right' }).render()).toThrow(/inside "bar".*x = 20 \(z between 0 and 80\)/);
});

test('side-plane text floating just over a slab top throws; text well above it does not', () => {
  expect(() => box().text({ id: 'float', at: [40, 20, 14], text: 'docs', on: 'left', size: 10 }).render()).toThrow(/left plane at y = 20, floating over the top of "box"/);
  expect(() => box().text({ id: 'sign', at: [40, 20, 60], text: 'docs', on: 'left', size: 10 }).render()).not.toThrow();
});

const sideOf = (s: Scene, color: string) => {
  const svg = s.render();
  const shapes = [...svg.matchAll(new RegExp(`<\\w+ [^>]*fill="${color}"`, 'g'))];
  const m = new RegExp(`<g transform="matrix\\(([^)]+)\\)"><path d="([^"]+)" fill="${color}"`).exec(svg);
  return { count: shapes.length, matrix: m?.[1]?.split(' ').map(Number) ?? [], d: m?.[2] ?? '' };
};

test('content drawn on a panel is clipped to its rounded face, so nothing pokes past a corner', () => {
  const content = '<rect x="-60" y="-40" width="120" height="22" fill="#f4f4f5"/>';
  const cases = [
    { size: [120, 80], radius: 14, rx: 14 },
    { size: [120, 80], radius: 99, rx: 40 },
    { size: [120, 80], radius: 0, rx: 0 },
    { size: [100, 50], radius: undefined, rx: 7 },
  ] as const;
  for (const facing of ['left', 'right'] as const)
    for (const c of cases) {
      const svg = scene()
        .panel({ id: 'p', at: [10, -20, 30], size: c.size, ...(c.radius === undefined ? {} : { radius: c.radius }), thickness: 7, facing, front: '#ffffff', side: '#e7e7ea', content })
        .panel({ id: 'q', at: [90, -20, 30], size: c.size, ...(c.radius === undefined ? {} : { radius: c.radius }), thickness: 7, facing, front: '#ffffff', side: '#e7e7ea', content })
        .render();
      const refs = ['p', 'q'].map(id => {
        const face = new RegExp(`<g id="demo_${id}"><g transform="[^"]+">.*?<g clip-path="url\\(#([^)]+)\\)">${content}</g></g></g>`).exec(svg);
        expect(face).not.toBeNull();
        const ref = face![1]!;
        const [w, h] = c.size;
        expect(svg).toContain(`<clipPath id="${ref}"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${c.rx}"/></clipPath>`);
        return ref;
      });
      expect(refs[0]).not.toBe(refs[1]);
    }
  for (const content of [undefined, ''])
    expect(scene().panel({ id: 'p', at: [0, 0, 0], size: [120, 80], thickness: 7, facing: 'left', front: '#ffffff', side: '#e7e7ea', ...(content === undefined ? {} : { content }) }).render()).not.toContain('clip');
});

test('content drawn on a slab top is clipped to its rounded top, hover copy included', () => {
  const content = '<rect x="-60" y="-40" width="120" height="22" fill="#f4f4f5"/>';
  const cases = [
    { size: [120, 80], radius: 14, rx: 14 },
    { size: [120, 80], radius: 99, rx: 40 },
    { size: [120, 80], radius: 0, rx: 0 },
    { size: [100, 50], radius: undefined, rx: 6 },
  ] as const;
  for (const hover of [undefined, { top: '#eeeeee' }])
    for (const c of cases) {
      const slab = (id: string, x: number) => ({ id, at: [x, 0, 0] as const, size: c.size, ...(c.radius === undefined ? {} : { radius: c.radius }), height: 20, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' } as const, content, ...(hover ? { hover } : {}) });
      const svg = scene().slab(slab('p', 0)).slab(slab('q', 200)).render();
      const groups = { p: svg.slice(svg.indexOf('<g id="demo_p"'), svg.indexOf('<g id="demo_q"')), q: svg.slice(svg.indexOf('<g id="demo_q"')) };
      const refs = Object.values(groups).map(group => {
        const tops = [...group.matchAll(new RegExp(`<g transform="translate[^"]+">(?:<rect [^>]+/>){2}(?:<g clip-path="url\\(#([^)]+)\\)">)?${content}`, 'g'))];
        expect(tops.length).toBe(hover ? 2 : 1);
        const [w, h] = c.size;
        for (const t of tops) {
          expect(t[1]).toBeDefined();
          expect(t[1]).toBe(tops[0]![1]);
          expect(svg).toContain(`<clipPath id="${t[1]}"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${c.rx}"/></clipPath>`);
        }
        return tops[0]![1];
      });
      expect(refs[0]).not.toBe(refs[1]);
    }
  for (const content of [undefined, ''])
    expect(scene().slab({ id: 'p', at: [0, 0, 0], size: [80, 80], height: 20, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' }, ...(content === undefined ? {} : { content }) }).render()).not.toContain('_face');
});

test('content on a face, a prism cap or a turntable top is clipped to that rounded face', () => {
  const content = '<rect x="-60" y="-40" width="120" height="22" fill="#f4f4f5"/>';
  const draw = {
    face: (s: Scene, id: string, x: number, size: readonly [number, number], radius: number | undefined, c?: string) => s.face({ id, at: [x, 0, 0], size, ...(radius === undefined ? {} : { radius }), ...(c === undefined ? {} : { content: c }), fill: '#ffffff' }),
    prism: (s: Scene, id: string, x: number, size: readonly [number, number], radius: number | undefined, c?: string) => s.prism({ id, at: [x, 0, 0], size, ...(radius === undefined ? {} : { radius }), ...(c === undefined ? {} : { content: c }), height: 20, top: '#ffffff', side: '#cccccc' }),
    turntable: (s: Scene, id: string, x: number, size: readonly [number, number], radius: number | undefined, c?: string) => s.turntable({ id, at: [x, 0, 0], size, ...(radius === undefined ? {} : { radius }), ...(c === undefined ? {} : { content: c }), height: 20, top: '#ffffff', side: '#cccccc' }),
  };
  const cases = [
    { size: [120, 80], radius: 14, rx: 14 },
    { size: [120, 80], radius: 99, rx: 40 },
    { size: [120, 80], radius: 0, rx: 0 },
    { size: [100, 50], radius: undefined, rx: 6 },
  ] as const;
  for (const [kind, add] of Object.entries(draw))
    for (const c of cases) {
      const s = scene();
      add(s, 'p', 0, c.size, c.radius, content);
      add(s, 'q', 200, c.size, c.radius, content);
      const svg = s.render();
      const [w, h] = c.size;
      const face = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${c.rx}"`;
      const hits = [...svg.matchAll(new RegExp(`${face}[^>]*/>(?:<rect [^>]*/>)?<g clip-path="url\\(#([^)]+)\\)">(?:<g style="fill:initial;stroke:initial">)?${content}`, 'g'))].map(m => m[1]!);
      expect({ kind, clipped: hits.length }).toEqual({ kind, clipped: 2 });
      expect(new Set(hits).size).toBe(2);
      for (const ref of hits) expect(svg).toContain(`<clipPath id="${ref}">${face}/></clipPath>`);
    }
  for (const add of Object.values(draw))
    for (const c of [undefined, '']) {
      const s = scene();
      add(s, 'p', 0, [80, 80], 10, c);
      expect(s.render()).not.toContain('_face');
    }
});

const endpoints = (d: string) =>
  [...d.matchAll(/([MLA])([^MLAZ]+)/g)].map(([, cmd, args]) => {
    const n = args!.trim().split(/[ ,]+/).map(Number);
    return cmd === 'A' ? [n[5]!, n[6]!] : [n[0]!, n[1]!];
  });

test('a panel draws its thickness as one shape that reaches its back face and sits behind its front', () => {
  for (const facing of ['left', 'right'] as const)
    for (const thickness of [0.5, 7, 40, 5000]) {
      const at = [10, -20, 30] as const;
      const s = scene().panel({ id: 'p', at, size: [120, 80], thickness, facing, radius: 14, front: '#ffffff', side: '#e7e7ea' });
      const side = sideOf(s, '#e7e7ea');
      expect(side.count).toBe(1);
      const [a, b] = side.matrix;
      const back = facing === 'left' ? s.project([at[0], at[1] - thickness, at[2]]) : s.project([at[0] - thickness, at[1], at[2]]);
      const front = s.project(at);
      const du = (back[0] - front[0]) / a!;
      const offset = [du, back[1] - front[1] - b! * du] as const;
      const pts = endpoints(side.d);
      ([60, 40] as const).forEach((half, axis) => {
        const k = offset[axis]!;
        const values = pts.map(p => p[axis]!);
        const [far, near] = k > 0 ? [Math.max(...values), Math.min(...values)] : [Math.min(...values), Math.max(...values)];
        const sign = Math.sign(k);
        expect(Math.abs(far - (sign * half + k))).toBeLessThan(0.02 + thickness * 1e-5);
        expect(sign * (near - -sign * half)).toBeGreaterThan(0.1);
        expect(sign * (near - (-sign * half + k))).toBeLessThanOrEqual(0.01);
      });
    }
});

test('a panel with no thickness draws no side; round, square and over-rounded panels draw one', () => {
  const side = (o: { size: readonly [number, number]; radius: number; thickness: number }) => sideOf(scene().panel({ id: 'p', at: [0, 0, 0], facing: 'left', front: '#ffffff', side: '#e7e7ea', ...o }), '#e7e7ea').count;
  expect(side({ size: [120, 80], radius: 14, thickness: 0 })).toBe(0);
  expect(side({ size: [40, 40], radius: 20, thickness: 0.5 })).toBe(1);
  expect(side({ size: [40, 40], radius: 20, thickness: 6 })).toBe(1);
  expect(side({ size: [40, 30], radius: 0, thickness: 6 })).toBe(1);
  expect(side({ size: [40, 30], radius: 99, thickness: 6 })).toBe(1);
});

test('a panel with an empty or negative size, a negative or non-finite thickness, or a negative radius is rejected with its id', () => {
  const bad: { size?: readonly [number, number]; thickness?: number; radius?: number }[] = [
    { size: [0, 80] },
    { size: [120, -5] },
    { size: [Number.NaN, 80] },
    { thickness: -1 },
    { thickness: Number.NaN },
    { thickness: Number.POSITIVE_INFINITY },
    { radius: -2 },
    { radius: Number.NaN },
  ];
  for (const o of bad)
    expect(() => scene().panel({ id: 'odd', at: [0, 0, 0], size: o.size ?? [120, 80], thickness: o.thickness ?? 7, radius: o.radius ?? 14, facing: 'left', front: '#ffffff', side: '#e7e7ea' })).toThrow(/panel "odd"/);
});

test('every corner of a panel side is an outward arc of the panel radius centred on its swept inner rectangle', () => {
  const cases = [
    { size: [120, 80], radius: 14 },
    { size: [40, 40], radius: 20 },
    { size: [60, 40], radius: 20 },
    { size: [120, 80], radius: 0 },
  ] as const;
  for (const facing of ['left', 'right'] as const)
    for (const c of cases)
      for (const thickness of [0.5, 7, 40]) {
        const at = [10, -20, 30] as const;
        const s = scene().panel({ id: 'p', at, size: c.size, radius: c.radius, thickness, facing, front: '#ffffff', side: '#e7e7ea' });
        const side = sideOf(s, '#e7e7ea');
        const [a, b] = side.matrix;
        const back = facing === 'left' ? s.project([at[0], at[1] - thickness, at[2]]) : s.project([at[0] - thickness, at[1], at[2]]);
        const front = s.project(at);
        const du = (back[0] - front[0]) / a!;
        const dv = back[1] - front[1] - b! * du;
        const [hx, hy] = [c.size[0] / 2 - c.radius, c.size[1] / 2 - c.radius];
        const inner = [[-hx, -hy], [hx, -hy], [hx, hy], [-hx, hy]] as const;
        const onSweep = (x: number, y: number) =>
          inner.some(([ix, iy]) => {
            const t = Math.max(0, Math.min(1, ((x - ix) * du + (y - iy) * dv) / (du * du + dv * dv)));
            return Math.hypot(x - ix - t * du, y - iy - t * dv) < 0.05;
          });
        let cur: [number, number] = [0, 0];
        let arcs = 0;
        for (const [, cmd, args] of side.d.matchAll(/([MLA])([^MLAZ]+)/g)) {
          const n = args!.trim().split(/[ ,]+/).map(Number);
          const end: [number, number] = cmd === 'A' ? [n[5]!, n[6]!] : [n[0]!, n[1]!];
          if (cmd === 'A' && c.radius > 0) {
            arcs++;
            expect(n[0]).toBe(c.radius);
            const [mx, my] = [(cur[0] + end[0]) / 2, (cur[1] + end[1]) / 2];
            const half = Math.hypot(end[0] - cur[0], end[1] - cur[1]) / 2;
            const k = Math.sqrt(Math.max(0, c.radius ** 2 - half ** 2));
            const [px, py] = [-(end[1] - cur[1]) / (2 * half), (end[0] - cur[0]) / (2 * half)];
            const centre = [[mx + k * px, my + k * py], [mx - k * px, my - k * py]].find(([x, y]) => Math.sign((cur[0] - x!) * (end[1] - y!) - (cur[1] - y!) * (end[0] - x!)) === (n[4] ? 1 : -1))!;
            expect(onSweep(centre[0]!, centre[1]!)).toBe(true);
          }
          cur = end;
        }
        if (c.radius > 0) expect(arcs).toBeGreaterThanOrEqual(4);
      }
});

class FakeAnimation {
  playState: 'idle' | 'paused' | 'running' = 'idle';
  #time: number | null = null;
  get currentTime() {
    return this.#time;
  }
  set currentTime(t: number | null) {
    this.#time = t;
    if (t !== null && this.playState === 'idle') this.playState = 'paused';
  }
  play() {
    this.#time ??= 0;
    this.playState = 'running';
  }
  pause() {
    this.#time ??= 0;
    this.playState = 'paused';
  }
  cancel() {
    this.#time = null;
    this.playState = 'idle';
  }
}

const onScroll = new Set<() => void>();
const onResize = new Set<() => void>();

function stage() {
  const observers: Array<{ margin: string; report: (entries: Array<{ isIntersecting: boolean; intersectionRatio: number }>) => void }> = [];
  const box = { top: 5000, bottom: 5400, left: 0, right: 400, height: 400 };
  Object.assign(globalThis, {
    innerHeight: 800,
    innerWidth: 1280,
    addEventListener: (type: string, f: () => void) => type === 'scroll' && onScroll.add(f),
    removeEventListener: (type: string, f: () => void) => type === 'scroll' && onScroll.delete(f),
    CSS: { escape: (s: string) => s },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    document: { hidden: false, documentElement: {}, addEventListener() {}, removeEventListener() {} },
    ResizeObserver: class {
      #report: () => void;
      constructor(report: () => void) {
        this.#report = report;
      }
      observe() {
        onResize.add(this.#report);
      }
      unobserve() {}
    },
    IntersectionObserver: class {
      constructor(report: (typeof observers)[number]['report'], options: { rootMargin?: string } = {}) {
        observers.push({ margin: options.rootMargin ?? '', report });
      }
      observe() {}
      disconnect() {}
    },
  });
  const spec = scene()
    .slab({ id: 'core', at: [0, 0, 0], size: [80, 80], height: 20, top: '#ffffff', side: { kind: 'flat', color: '#cccccc' } })
    .loop(4, 1)
    .at('core', 'opacity', 0.5, 1, 0, 1)
    .intro('core', 'scale', 0, 0.5, 0.5, 1)
    .motion();
  const animations: FakeAnimation[] = [];
  const target = { animate: () => animations[animations.push(new FakeAnimation()) - 1] };
  const root = {
    dataset: {},
    querySelector: (sel: string) => (sel === 'script.iso-spec' ? { textContent: JSON.stringify(spec) } : target),
    querySelectorAll: () => [],
    getBoundingClientRect: () => box,
  };
  const handle = mount(root as unknown as HTMLElement);
  const report = (near: boolean, ratio: number) => {
    for (const o of observers) o.report([{ isIntersecting: o.margin ? near : ratio > 0, intersectionRatio: ratio }]);
  };
  const jump = (top: number) => {
    Object.assign(box, { top, bottom: top + box.height });
    for (const f of [...onScroll]) f();
  };
  const move = (top: number, height = box.height) => {
    Object.assign(box, { top, height, bottom: top + height });
    for (const f of onResize) f();
  };
  return { handle, animations, report, jump, move, listening: () => onScroll.size, states: () => animations.map(a => a.playState) };
}

test('a scene far off screen holds no live animations and comes back on the frame it left', () => {
  const { animations, report, states } = stage();
  expect(animations.length).toBe(2);
  report(true, 1);
  expect(states()).toEqual(['running', 'running']);
  for (const a of animations) a.currentTime = 2300;
  report(true, 0);
  expect(states()).toEqual(['paused', 'paused']);
  report(false, 0);
  expect(states()).toEqual(['idle', 'idle']);
  report(true, 0);
  expect(states()).toEqual(['paused', 'paused']);
  expect(animations.map(a => a.currentTime)).toEqual([2300, 2300]);
  report(true, 1);
  expect(states()).toEqual(['running', 'running']);
  expect(animations.map(a => a.currentTime)).toEqual([2300, 2300]);
});

test('a parked scene jumped into view wakes on the scroll, before the observers report after paint', () => {
  const { handle, animations, report, jump, listening, states } = stage();
  report(true, 1);
  for (const a of animations) a.currentTime = 2300;
  report(false, 0);
  expect(states()).toEqual(['idle', 'idle']);
  expect(listening()).toBe(1);
  jump(2000);
  expect(states()).toEqual(['idle', 'idle']);
  jump(100);
  expect(states()).toEqual(['paused', 'paused']);
  expect(animations.map(a => a.currentTime)).toEqual([2300, 2300]);
  expect(listening()).toBe(0);
  report(false, 0);
  handle.destroy();
  expect(listening()).toBe(0);
});

test('a parked scene a layout change brings into view (a filter, a fold, a shown copy) wakes before paint', () => {
  const { animations, report, move, states } = stage();
  report(true, 1);
  for (const a of animations) a.currentTime = 1200;
  report(false, 0);
  move(300, 0);
  expect(states()).toEqual(['idle', 'idle']);
  move(300, 400);
  expect(states()).toEqual(['paused', 'paused']);
  expect(animations.map(a => a.currentTime)).toEqual([1200, 1200]);
  report(true, 1);
});

test('a scene a script holds stays live off screen, and parks once released', () => {
  const { handle, report, states } = stage();
  report(false, 0);
  expect(states()).toEqual(['idle', 'idle']);
  handle.seek(1.5);
  expect(states()).toEqual(['paused', 'paused']);
  report(true, 0);
  report(false, 0);
  expect(states()).toEqual(['paused', 'paused']);
  handle.play();
  expect(states()).toEqual(['idle', 'idle']);
  report(true, 1);
  expect(states()).toEqual(['running', 'running']);
});

test('scene roots skip rendering off screen only where the clip margin keeps edge labels whole', () => {
  expect(isoCss).toContain('@supports (overflow-clip-margin:1px){.iso{content-visibility:auto;overflow-clip-margin:32px}}');
});

test('keyframe offsets carry at most five decimals, so a loop of any length stays small on the page', () => {
  const s = new Scene({ name: 'offsets', width: 200, height: 200 });
  s.slab({ id: 'a', at: [0, 0, 0], size: [40, 40], height: 10, top: '#fff', side: { kind: 'flat', color: '#999' } });
  s.at('a', 'opacity', 1.13, 0.37, 0, 1);
  s.ambient('a', 'scale', 1.7, [1, 1.1, 1.05, 1], 'linear');
  s.loop(18.23, 2);
  const offsets = s.motion().tracks.flatMap(t => t.keyframes.map(k => Number(k.offset)));
  expect(offsets.length).toBeGreaterThan(4);
  expect(offsets.filter(o => (String(o).split('.')[1] ?? '').length > 5)).toEqual([]);
  expect(offsets.some(o => o > 0 && o < 1)).toBe(true);
});
