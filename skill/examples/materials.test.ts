import { expect, test } from 'bun:test';
import { Scene, type Material } from '../lib/iso.ts';
import { galleries, sampler } from './material-gallery.ts';
import { finishCategories, finishes } from './materials.ts';

const onSlab = (paint: (s: Scene) => Material) => {
  const s = new Scene({ name: 'probe', width: 200, height: 160 });
  s.slab({ id: 'tile', at: [0, 0, 0], size: [80, 80], height: 28, radius: 12, top: '#17181d', side: paint(s) });
  return s.render();
};

test('at least 45 finishes, at least 6 in every category', () => {
  expect(finishes.length).toBeGreaterThanOrEqual(45);
  const thin = finishCategories.filter(c => finishes.filter(f => f.category === c.slug).length < 6).map(c => c.slug);
  expect(thin).toEqual([]);
});

test('slugs and names are unique', () => {
  expect(new Set(finishes.map(f => f.slug)).size).toBe(finishes.length);
  expect(new Set(finishes.map(f => f.name.toLowerCase())).size).toBe(finishes.length);
});

test('every finish renders on a slab without marble or turbulence', () => {
  const bad = finishes.filter(f => /iso_marble|feTurbulence/.test(onSlab(f.material)));
  expect(bad.map(f => f.slug)).toEqual([]);
});

test('a generative finish draws the same pattern for the same seed and another for a different seed', () => {
  const seeded = finishes.flatMap(f => (f.category === 'generative' ? [f] : []));
  expect(seeded.length).toBeGreaterThanOrEqual(6);
  const drawn = (f: (typeof seeded)[number], seed: number) => onSlab(s => f.seeded(s, seed)).replaceAll(`-${seed}`, '-seed');
  for (const f of seeded) {
    const a = drawn(f, 101);
    expect([f.slug, drawn(f, 101)]).toEqual([f.slug, a]);
    expect([f.slug, drawn(f, 102) === a]).toEqual([f.slug, false]);
  }
});

test('a generative finish rejects a seed that is not a whole number from 0 to 2^32 - 1', () => {
  for (const f of finishes) {
    if (f.category !== 'generative') continue;
    for (const seed of [-1, 1.5, Number.NaN, 2 ** 32]) expect(() => onSlab(s => f.seeded(s, seed))).toThrow(/seed must be a whole number/);
  }
});

test('one gallery per category in order, holding each of its finishes once', () => {
  expect(galleries.map(g => g.slug)).toEqual(finishCategories.map(c => c.slug));
  expect(galleries.flatMap(g => g.finishes.map(f => f.slug))).toEqual(finishCategories.flatMap(c => finishes.filter(f => f.category === c.slug).map(f => f.slug)));
});

test('gallery scenes have no labels, so each exports as a standalone SVG', () => {
  for (const g of galleries) {
    for (const v of [g.art.compact, g.art.wide]) {
      if (!v) throw new Error(`gallery ${g.slug} has no wide scene`);
      expect(v.name).toMatch(new RegExp(`^finish-${g.slug}-(sm|lg)$`));
      expect(v.scene.exportSvg()).toStartWith('<svg');
    }
  }
});

test('the README sampler holds 6 to 8 finishes from every family and exports as one SVG', () => {
  const shown = sampler().motion().tracks.map(t => t.target);
  const picked = finishes.filter(f => shown.some(id => id.endsWith(`_${f.slug}`)));
  expect(picked.length).toBeGreaterThanOrEqual(6);
  expect(picked.length).toBeLessThanOrEqual(8);
  expect(finishCategories.filter(c => !picked.some(f => f.category === c.slug)).map(c => c.slug)).toEqual([]);
  expect(sampler().exportSvg({ title: 'Side finishes' })).toStartWith('<svg');
});
