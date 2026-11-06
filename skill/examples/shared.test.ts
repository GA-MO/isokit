import { expect, test } from 'bun:test';
import { fitX } from './shared';

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
