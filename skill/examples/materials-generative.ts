import type { Material, Scene } from '../lib/iso.ts';
import { checkSeed, custom, layers, mix, seededGroup, sheen, wrap } from './materials-kit.ts';
import { bandKey, n, once, paints, pattern, ramps, rng, vertical, type Ramp } from './shared.ts';

const base = (s: Scene, ramp: Ramp, band: Parameters<typeof vertical>[2]) => vertical(s, `gen-${ramp[0].slice(1)}-${ramp[1].slice(1)}`, band, [[0, ramp[1]], [1, ramp[0]]]);

function mosaic(s: Scene, seed: number, ramp: Ramp = ramps.teal): Material {
  checkSeed('mosaic', seed);
  const tiles = once(s, `fin-mosaic-${seed}`, () => {
    const r = rng(seed);
    let body = `<rect width="96" height="12" fill="${ramp[0]}"/>`;
    for (let y = 0; y < 12; y += 4) {
      let x = -r() * 6;
      while (x < 96) {
        const w = 2.5 + r() * 9;
        const draw = (at: number) => `<rect x="${n(at + 0.3)}" y="${y + 0.3}" width="${n(Math.max(0.6, w - 0.6))}" height="3.4" rx=".5" fill="${mix(ramp.slice(1), r())}"/>`;
        body += draw(x) + (x < 0 ? draw(x + 96) : x + w > 96 ? draw(x - 96) : '');
        x += w;
      }
    }
    return pattern(96, 12, body);
  });
  return custom((_, a, t, band) => layers(a, t, tiles, sheen(s, band, 0.14, 0.35)));
}

function scatter(s: Scene, seed: number, ramp: Ramp = ramps.rose): Material {
  checkSeed('scatter', seed);
  const bits = once(s, `fin-scatter-${seed}`, () => {
    const r = rng(seed);
    let body = '';
    for (let i = 0; i < 26; i++) {
      const size = 0.5 + r() ** 2 * 2.2;
      const color = ramp[1 + Math.floor(r() * 3)];
      const square = r() > 0.55;
      body += wrap(r() * 64, r() * 32, size * 1.5, 64, 32, (x, y) =>
        square ? `<rect x="${n(x - size)}" y="${n(y - size)}" width="${n(size * 2)}" height="${n(size * 2)}" rx=".3" fill="${color}"/>` : `<circle cx="${n(x)}" cy="${n(y)}" r="${n(size)}" fill="${color}"/>`,
      );
    }
    return pattern(64, 32, body);
  });
  return custom((_, a, t, band) => layers(a, t, base(s, ramp, band), bits, sheen(s, band, 0.1, 0.3)));
}

function noiseBars(s: Scene, seed: number, ramp: Ramp = ramps.sky): Material {
  checkSeed('noiseBars', seed);
  return custom((_, a, t, band) => {
    const bars = once(s, `fin-noise-bars-${seed}-${bandKey(band)}`, () => {
      const h = band.y1 - band.y0;
      const r = rng(seed);
      const pitch = 64 / 25;
      let level = r();
      let body = `<rect width="64" height="${n(h)}" fill="${ramp[0]}"/>`;
      for (let i = 0; i < 25; i++) {
        level = Math.min(1, Math.max(0.08, level * 0.45 + r() * 0.62));
        const bar = h * 0.86 * level;
        body += `<rect x="${n(i * pitch + 0.4)}" y="${n(h - bar)}" width="${n(pitch - 0.8)}" height="${n(bar)}" rx=".4" fill="${mix(ramp.slice(1), level)}"/>`;
      }
      return pattern(64, h, body, band.y0);
    });
    return layers(a, t, bars, sheen(s, band, 0.08, 0.2));
  });
}

function flowField(s: Scene, seed: number, ramp: Ramp = ramps.emerald): Material {
  checkSeed('flowField', seed);
  const strokes = once(s, `fin-flow-field-${seed}`, () => {
    const r = rng(seed);
    const [cols, rows, cell] = [4, 2, 16];
    const lattice = Array.from({ length: rows }, () => Array.from({ length: cols }, () => r()));
    const at = (i: number, j: number) => lattice[((j % rows) + rows) % rows]![((i % cols) + cols) % cols]!;
    const smooth = (v: number) => v * v * (3 - 2 * v);
    const field = (x: number, y: number) => {
      const [i, j] = [Math.floor(x / cell), Math.floor(y / cell)];
      const [u, v] = [smooth(x / cell - i), smooth(y / cell - j)];
      const top = at(i, j) + (at(i + 1, j) - at(i, j)) * u;
      const bottom = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * u;
      return top + (bottom - top) * v;
    };
    const [bright, dim] = [[] as string[], [] as string[]];
    for (let y = 2.5; y < 32; y += 5)
      for (let x = 2; x < 64; x += 4) {
        const angle = (field(x, y) - 0.5) * 3;
        const [dx, dy] = [Math.cos(angle) * 2.1, Math.sin(angle) * 2.1];
        (r() > 0.6 ? bright : dim).push(`M${n(x - dx)} ${n(y - dy)}l${n(dx * 2)} ${n(dy * 2)}`);
      }
    return pattern(64, 32, `<path d="${dim.join('')}" stroke="${ramp[2]}" stroke-width=".55" stroke-linecap="round" opacity=".7"/><path d="${bright.join('')}" stroke="${ramp[3]}" stroke-width=".6" stroke-linecap="round"/>`);
  });
  return custom((_, a, t, band) => layers(a, t, base(s, ramp, band), strokes, sheen(s, band, 0.06, 0.3)));
}

function maze(s: Scene, seed: number, ramp: Ramp = ramps.indigo): Material {
  checkSeed('maze', seed);
  const walls = once(s, `fin-maze-${seed}`, () => {
    const r = rng(seed);
    let d = '';
    for (let y = 0; y < 24; y += 3) for (let x = 0; x < 48; x += 3) d += r() > 0.5 ? `M${x} ${y}l3 3` : `M${x + 3} ${y}l-3 3`;
    return pattern(48, 24, `<path d="${d}" stroke="${ramp[3]}" stroke-width=".6" stroke-linecap="square" opacity=".85"/>`);
  });
  return custom((_, a, t, band) => layers(a, t, base(s, ramp, band), walls, sheen(s, band, 0.1, 0.3)));
}

function lowPoly(s: Scene, seed: number, ramp: Ramp = ramps.amber): Material {
  checkSeed('lowPoly', seed);
  const facets = once(s, `fin-low-poly-${seed}`, () => {
    const r = rng(seed);
    const [cols, rows, cell] = [8, 3, 8];
    const wrapped = <T>(grid: readonly (readonly T[])[], i: number, j: number) => grid[(j + rows) % rows]![(i + cols) % cols]!;
    const jitter = Array.from({ length: rows }, () => Array.from({ length: cols }, () => [(r() - 0.5) * 5, (r() - 0.5) * 5] as const));
    const tone = Array.from({ length: rows }, (_, j) => Array.from({ length: cols }, () => [0.06, -0.06].map(k => mix(ramp, 0.75 - 0.4 * (j / rows) + (r() - 0.5) * 0.35 + k))));
    const point = (i: number, j: number) => {
      const [jx, jy] = wrapped(jitter, i, j);
      return `${n(i * cell + jx)} ${n(j * cell + jy)}`;
    };
    let body = '';
    for (let j = -1; j <= rows; j++)
      for (let i = -1; i <= cols; i++) {
        const [f1, f2] = wrapped(tone, i, j);
        const [a, b, c, d] = [point(i, j), point(i + 1, j), point(i + 1, j + 1), point(i, j + 1)];
        body += `<path d="M${a}L${b}L${c}Z" fill="${f1}" stroke="${f1}" stroke-width=".2"/><path d="M${a}L${c}L${d}Z" fill="${f2}" stroke="${f2}" stroke-width=".2"/>`;
      }
    return pattern(cols * cell, rows * cell, body);
  });
  return custom((_, a, t, band) => layers(a, t, facets, sheen(s, band, 0.1, 0.3)));
}

const pewter = ['#0f1115', '#1f232b', '#6b7280', '#e5e7eb'] as const satisfies Ramp;

function stipple(s: Scene, seed: number, ramp: Ramp = pewter): Material {
  checkSeed('stipple', seed);
  return custom((_, a, t, band) => {
    const dots = once(s, `fin-stipple-${seed}-${bandKey(band)}`, () => {
      const h = band.y1 - band.y0;
      const r = rng(seed);
      let body = '';
      for (let i = 0; i < 150; i++) {
        const [x, y] = [r() * 32, r() * h];
        if (r() > (1 - y / h) ** 1.6) continue;
        const radius = n(0.22 + r() * 0.2);
        body += wrap(x, y, radius, 32, h, (cx, cy) => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${radius}"/>`);
      }
      return pattern(32, h, `<g fill="${ramp[3]}">${body}</g>`, band.y0);
    });
    return layers(a, t, base(s, ramp, band), dots, sheen(s, band, 0.1, 0.25));
  });
}

export const generative = seededGroup([
  { slug: 'random', name: 'Random', note: 'Seeded noise, one per tile', seed: 7, seeded: (s, seed) => paints.random(s, ramps.violet, seed) },
  { slug: 'mosaic', name: 'Mosaic', note: 'Teams, tenants and many parts', seed: 12, seeded: (s, seed) => mosaic(s, seed) },
  { slug: 'noise-bars', name: 'Noise bars', note: 'Activity, traffic and audio', seed: 5, seeded: (s, seed) => noiseBars(s, seed) },
  { slug: 'flow-field', name: 'Flow field', note: 'Streams, pipelines and motion', seed: 9, seeded: (s, seed) => flowField(s, seed) },
  { slug: 'maze', name: 'Maze', note: 'Routing, puzzles and paths', seed: 10, seeded: (s, seed) => maze(s, seed) },
  { slug: 'low-poly', name: 'Low poly', note: '3D, games and rendering', seed: 4, seeded: (s, seed) => lowPoly(s, seed) },
  { slug: 'scatter', name: 'Scatter', note: 'Events, samples and sparse data', seed: 21, seeded: (s, seed) => scatter(s, seed) },
  { slug: 'stipple', name: 'Stipple', note: 'Density, depth and quiet tiles', seed: 3, seeded: (s, seed) => stipple(s, seed) },
]);
