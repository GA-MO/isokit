import { expect, test } from 'bun:test';
import { readme, stories } from './hero';
import { breakpoint, frames } from './hero/stage';

const loops = (svg: string) => [...new Set([...svg.matchAll(/ ([\d.]+)ms linear [\d.]+ms infinite/g)].map(m => m[1]))];

test('the hero tells four stories, each in its own colour and scene', () => {
  expect(stories.map(s => s.slug)).toEqual(['orders', 'device', 'payment', 'build']);
  expect(new Set(stories.map(s => s.swatch)).size).toBe(4);
  for (const s of stories) {
    expect(s.peak).toBeLessThan(s.loop);
    expect(s.still).toBeLessThan(s.peak);
    expect(s.art.breakpoint).toBe(breakpoint);
  }
});

test('every story fills the same box, so switching never moves the page', () => {
  for (const s of stories) {
    expect([s.art.compact.width, s.art.compact.height]).toEqual([frames.compact.width, frames.compact.height]);
    expect([s.art.wide!.width, s.art.wide!.height]).toEqual([frames.wide.width, frames.wide.height]);
  }
});

test('each story marks the parts that lift off when the next one arrives', () => {
  for (const s of stories) for (const v of [s.art.compact, s.art.wide!]) expect(v.markup.match(/class="hero-piece"/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
});

test('the README hero is one standalone SVG that types all four prompts on one shared loop', () => {
  for (const v of ['wide', 'compact'] as const) {
    const svg = readme(v);
    expect(svg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
    for (const s of stories) expect(svg).toContain(`>${s.prompt}<`);
    const shared = loops(svg).filter(d => Number(d) > 10000);
    expect(shared).toHaveLength(1);
  }
});
