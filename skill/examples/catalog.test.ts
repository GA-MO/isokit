import { expect, test } from 'bun:test';
import { examples } from './catalog';
import { galleries } from './material-gallery';
import { hero } from './hero';
import { categories, layouts, levels } from './shared';

const arts = [...examples.map(e => e.art), hero, ...galleries.map(g => g.art)];

test('every category tab has a scene at every level', () => {
  const missing = categories.flatMap(c => levels.filter(l => !examples.some(e => e.category === c && e.level === l)).map(l => `${c}/${l}`));
  expect(missing).toEqual([]);
});

test('slugs and scene names are unique, so each scene file and id prefix is its own', () => {
  const slugs = examples.map(e => e.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
  const names = arts.flatMap(a => [a.compact.name, ...(a.wide ? [a.wide.name] : [])]);
  expect(new Set(names).size).toBe(names.length);
});

test('no scene paints a marble side', () => {
  const marbled = arts.flatMap(a => [a.compact, ...(a.wide ? [a.wide] : [])]).filter(v => v.markup.includes('iso_marble')).map(v => v.name);
  expect(marbled).toEqual([]);
});

test('spot scenes are one compact scene; every other level has a wide one', () => {
  for (const e of examples) expect([e.slug, e.art.wide === null]).toEqual([e.slug, e.level === 'spot']);
});

test('every layout but the single object has at least three scenes, and only spots are single objects', () => {
  const thin = layouts.filter(l => l !== 'object' && examples.filter(e => e.layout === l).length < 3);
  expect(thin).toEqual([]);
  expect(examples.filter(e => (e.layout === 'object') !== (e.level === 'spot')).map(e => e.slug)).toEqual([]);
});

test('a wide card has a wide scene of about 3:1', () => {
  const off = examples.filter(e => e.layout === 'wide' && !(e.art.wide && e.art.wide.width / e.art.wide.height >= 2.6 && e.art.wide.width / e.art.wide.height <= 3.4)).map(e => `${e.slug} ${e.art.wide ? (e.art.wide.width / e.art.wide.height).toFixed(2) : 'none'}`);
  expect(off).toEqual([]);
});
