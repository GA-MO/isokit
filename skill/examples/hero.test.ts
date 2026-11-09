import { expect, test } from 'bun:test';
import { readme, stories } from './hero';
import { breakpoint, frames, storyScene } from './hero/stage';

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

const variants = (slug: string) => {
  const s = stories.find(x => x.slug === slug)!;
  return [s.art.compact.markup, s.art.wide!.markup];
};

test('Orders API paints every wire on the ground beneath every box, so no line crosses a box', () => {
  for (const markup of variants('orders')) {
    const lastWire = Math.max(...[...markup.matchAll(/id="[^"]+_o-w-[a-z-]+"/g)].map(m => m.index));
    const firstBox = markup.search(/id="[^"]+_o-(g-[a-z-]+|core-live)"/);
    expect(lastWire).toBeGreaterThan(0);
    expect(lastWire).toBeLessThan(firstBox);
  }
});

test('each Edge device label line meets the middle of its own layer edge once the layers are apart', () => {
  for (const markup of variants('device')) {
    const spec: { tracks: { target: string; prop: string; keyframes: { translate?: string }[] }[] } = JSON.parse(markup.match(/class="iso-spec">(.*?)<\/script>/s)![1]!);
    for (const id of ['case', 'battery', 'board', 'radio', 'lid']) {
      const [, top, right, bottom] = markup.match(new RegExp(`d-${id}-box_side"><path d="M[\\d.]+ ([\\d.]+)L([\\d.]+) [\\d.]+L[\\d.]+ ([\\d.]+)`))!.map(Number);
      const lifts = spec.tracks.filter(t => t.target.endsWith(`_d-lift-${id}`) && t.prop === 'translate').flatMap(t => t.keyframes.map(k => Number(k.translate?.match(/^0 (-?[\d.]+)px$/)?.[1] ?? 0)));
      const lift = Math.min(0, ...lifts);
      const [, x, y] = markup.match(new RegExp(`d-rule-${id}"[^>]* d="M([\\d.]+) ([\\d.]+)L`))!.map(Number);
      expect(Math.abs(y! - ((top! + bottom!) / 2 + lift))).toBeLessThan(0.5);
      expect(Math.abs(x! - right!)).toBeLessThan(2);
    }
  }
});

test('in every story a wire is drawn only while the boxes it joins hold still in place, so no line shows before or after its boxes', () => {
  const svcs = ['db', 'cache', 'queue', 'gateway'];
  const joins: Record<string, { wire: string; boxes: string[] }[]> = {
    orders: svcs.flatMap(n => [
      { wire: `o-w-${n}`, boxes: ['o-core', 'o-core-live', `o-svc-${n}`, `o-g-${n}`] },
      ...['a', 'b'].map(l => ({ wire: `o-w-${n}-${l}`, boxes: [`o-svc-${n}`, `o-g-${n}`, `o-leaves-${n}`, `o-g-${n}-${l}`] })),
    ]),
    payment: [{ wire: 'p-track', boxes: ['p-checkout', 'p-gateway', 'p-network', 'p-bank'] }],
    device: ['case', 'battery', 'board', 'radio', 'lid'].map(id => ({ wire: `d-rule-${id}`, boxes: [`d-${id}`, `d-lift-${id}`] })),
  };
  for (const story of stories) {
    for (const v of ['compact', 'wide'] as const) {
      const scene = storyScene(story, v);
      const spec = scene.motion();
      const curve = (id: string, prop: string) =>
        spec.tracks
          .filter(t => t.target === scene.ref(id) && t.prop === prop && !(t.repeat && t.delay === 0))
          .flatMap(t => t.keyframes.map(k => ({ t: t.repeat ? spec.intro + Number(k.offset) * spec.loop : Number(k.offset) * spec.intro, v: k[prop]! })))
          .sort((a, b) => a.t - b.t);
      for (const { wire, boxes } of joins[story.slug] ?? []) {
        const drawn = curve(wire, 'strokeDashoffset');
        expect(drawn.length).toBeGreaterThan(0);
        const shown = drawn.slice(1).flatMap((k, i) => (Math.abs(Number(k.v)) < 1 || Math.abs(Number(drawn[i]!.v)) < 1 ? [[drawn[i]!.t, k.t] as const] : []));
        for (const box of boxes)
          for (const prop of ['translate', 'scale', 'opacity']) {
            const c = curve(box, prop);
            const moving = c.slice(1).flatMap((k, i) => (k.v !== c[i]!.v ? [[c[i]!.t, k.t] as const] : []));
            const away = c.filter(k => (prop === 'scale' || prop === 'opacity') && Number(k.v) !== 1);
            for (const [a, b] of shown) {
              const clash = moving.find(([m, n]) => m < b - 0.002 && n > a + 0.002);
              expect(clash ? `${story.slug} ${v}: ${box}.${prop} moves ${clash[0].toFixed(2)}-${clash[1].toFixed(2)}s while ${wire} shows ${a.toFixed(2)}-${b.toFixed(2)}s` : '').toBe('');
              const hidden = away.find(k => k.t > a + 0.002 && k.t < b - 0.002);
              expect(hidden ? `${story.slug} ${v}: ${box}.${prop} is ${hidden.v} at ${hidden.t.toFixed(2)}s while ${wire} shows` : '').toBe('');
            }
          }
      }
    }
  }
});
