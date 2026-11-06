import { expect, test } from 'bun:test';
import { Scene, type Material } from '../lib/iso';
import { art, fitX, paints, ramps } from './shared';

test('a centred label near either edge moves inside the scene', () => {
  const left = fitX(10, 'clip.mp4 · 64 MB', 390, 300);
  const right = fitX(385, 'clip.mp4 · 64 MB', 390, 300);
  expect(left).toBeGreaterThan(10);
  expect(right).toBeLessThan(385);
  expect(left + right).toBeCloseTo(390);
});

test('a label already inside keeps its position', () => {
  expect(fitX(195, 'ok', 390, 300)).toBe(195);
  expect(fitX(100, 'ok', 390, 300, 'left')).toBe(100);
  expect(fitX(300, 'ok', 390, 300, 'right')).toBe(300);
});

test('left and right anchors keep the label edge inside, also from outside the scene', () => {
  expect(fitX(-40, 'ok', 390, 300, 'left')).toBe(6);
  expect(fitX(500, 'ok', 390, 300, 'right')).toBe(384);
  const x = fitX(380, 'session open · 24 h', 390, 300, 'left');
  expect(x).toBeLessThan(380);
});

test('a narrower card pushes the label further in', () => {
  expect(fitX(0, 'ana@studio.dev', 390, 300)).toBeGreaterThan(fitX(0, 'ana@studio.dev', 390, 390));
});

test('a label wider than the scene is rejected with its text', () => {
  expect(() => fitX(195, 'x'.repeat(60), 390, 300)).toThrow(/x{60}" is about \d+ units wide/);
});

test('empty text, non-finite and non-positive sizes are rejected', () => {
  expect(() => fitX(10, '', 390, 300)).toThrow(/text is empty/);
  expect(() => fitX(10, '   ', 390, 300)).toThrow(/text is empty/);
  expect(() => fitX(Number.NaN, 'a', 390, 300)).toThrow(/x must be a finite number/);
  expect(() => fitX(10, 'a', Number.POSITIVE_INFINITY, 300)).toThrow(/sceneWidth must be a finite number/);
  expect(() => fitX(10, 'a', 390, 0)).toThrow(/must be positive/);
  expect(() => fitX(10, 'a', -390, 300)).toThrow(/must be positive/);
  expect(() => fitX(10, 'a', 390, 300, 'center', 'mono', -1)).toThrow(/pad must be >= 0/);
});

test('a fractional position stays fractional', () => {
  expect(fitX(195.5, 'ok', 390, 300)).toBe(195.5);
});

test('art() keeps compact and wide markup apart and joins them for a page', () => {
  const a = new Scene({ name: 'art-a', width: 390, height: 300 });
  const b = new Scene({ name: 'art-b', width: 720, height: 300 });
  const pair = art(a, b, 520, '<style>x</style>');
  expect(pair.compact.name).toBe('art-a');
  expect(pair.wide?.width).toBe(720);
  expect(pair.html.startsWith('<style>x</style>')).toBe(true);
  expect(pair.html).toContain('data-iso="art-a"');
  expect(pair.html).toContain('data-iso="art-b"');
  const single = art(new Scene({ name: 'art-c', width: 390, height: 300 }));
  expect(single.wide).toBeNull();
  expect(single.html).toBe(single.compact.markup);
});

test('art() rejects a breakpoint that is not a positive number', () => {
  for (const bp of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) expect(() => art(new Scene({ name: `bp-a${String(bp).length}`, width: 390, height: 300 }), new Scene({ name: `bp-b${String(bp).length}`, width: 720, height: 300 }), bp)).toThrow(/breakpoint must be a positive/);
});

function paintOn(material: Material) {
  const s = new Scene({ name: 'paint', width: 390, height: 300 });
  s.slab({ id: 'tile', at: [0, 0, 0], size: [80, 80], height: 20, top: '#fff', side: material });
  return s.render();
}

test('each paint draws a side without errors', () => {
  const s = new Scene({ name: 'paints', width: 390, height: 300 });
  const all = [paints.flat('#333'), paints.gradient(s, ramps.violet), paints.brushed(s), paints.stripes(s, ramps.amber), paints.dots(s, ramps.sky), paints.glass(s, '#38bdf8'), paints.random(s, ramps.teal, 3)];
  all.forEach((m, i) => s.slab({ id: `t${i}`, at: [i * 90, 0, 0], size: [80, 80], height: 20, top: '#fff', side: m }));
  expect(s.render()).not.toContain('iso_marble');
});

test('random paints the same pattern for the same seed and a different one for another seed', () => {
  const draw = (seed: number) => {
    const s = new Scene({ name: 'rnd', width: 390, height: 300 });
    s.slab({ id: 'tile', at: [0, 0, 0], size: [80, 80], height: 20, top: '#fff', side: paints.random(s, ramps.teal, seed) });
    return s.render();
  };
  expect(draw(5)).toBe(draw(5));
  expect(draw(5)).not.toBe(draw(6));
  expect(draw(-5)).toContain('<rect');
});

test('paints reject inputs that would draw nothing or garbage', () => {
  const s = new Scene({ name: 'bad', width: 390, height: 300 });
  expect(() => paints.random(s, ramps.teal, 1.5)).toThrow(/seed must be a whole number/);
  expect(() => paints.random(s, ramps.teal, Number.NaN)).toThrow(/seed must be a whole number/);
  expect(() => paints.random(s, ramps.teal, 2 ** 60)).toThrow(/seed must be a whole number/);
  expect(() => paints.random(s, ramps.teal, 1, 0)).toThrow(/cell must be between 1 and 12/);
  expect(() => paints.random(s, ramps.teal, 1, 40)).toThrow(/cell must be between 1 and 12/);
  expect(() => paints.stripes(s, ramps.teal, 0)).toThrow(/width must be a positive/);
  expect(() => paints.stripes(s, ramps.teal, -2)).toThrow(/width must be a positive/);
  expect(() => paints.dots(s, ramps.teal, 1)).toThrow(/gap must be/);
  expect(() => paints.glass(s, '')).toThrow(/tint must be a CSS colour/);
  expect(() => paints.glass(s, '#fff', 0)).toThrow(/opacity must be above 0/);
  expect(() => paints.glass(s, '#fff', 1.5)).toThrow(/opacity must be above 0/);
  // @ts-expect-error a ramp needs four colours
  expect(() => paints.gradient(s, ['#000', '#111', '#222'])).toThrow(/ramp needs 4 colours/);
  expect(() => paints.gradient(s, ['#000', '', '#222', '#333'])).toThrow(/ramp needs 4 colours/);
});

test('a paint used twice in one scene registers its pattern once', () => {
  const s = new Scene({ name: 'twice', width: 390, height: 300 });
  s.slab({ id: 'a', at: [0, 0, 0], size: [80, 80], height: 20, top: '#fff', side: paints.brushed(s, ramps.graphite) });
  s.slab({ id: 'b', at: [100, 0, 0], size: [80, 80], height: 20, top: '#fff', side: paints.brushed(s, ramps.graphite) });
  expect(s.render().match(/<pattern id="twice_paint-brushed/g)?.length).toBe(1);
  expect(paintOn(paints.flat('#123456'))).toContain('#123456');
});
