import type { Material, Scene, SidePaint } from '../lib/iso';
import { fill, n, vertical } from './shared';

export const finishCategories = [
  { slug: 'metal', name: 'Metal', note: 'Hardware, storage and premium tiers' },
  { slug: 'glass', name: 'Glass', note: 'Layers, previews and overlays' },
  { slug: 'natural', name: 'Natural', note: 'Warm, crafted and human products' },
  { slug: 'tech-pattern', name: 'Tech pattern', note: 'Code, data, devices and infra' },
  { slug: 'retro', name: 'Retro', note: 'Games, print and nostalgia' },
  { slug: 'generative', name: 'Generative', note: 'Seeded, so one seed is one pattern' },
] as const;

export type FinishCategory = (typeof finishCategories)[number]['slug'];

interface Entry {
  slug: string;
  name: string;
  note: string;
  material: (scene: Scene) => Material;
}

export type Finish =
  | (Entry & { category: Exclude<FinishCategory, 'generative'> })
  | (Entry & { category: 'generative'; seed: number; seeded: (scene: Scene, seed: number) => Material });

type Band = Parameters<SidePaint>[3];

export const group = (category: Exclude<FinishCategory, 'generative'>, list: readonly Entry[]): Finish[] => list.map(f => ({ ...f, category }));

export const seededGroup = (list: readonly (Omit<Entry, 'material'> & { seed: number; seeded: (scene: Scene, seed: number) => Material })[]): Finish[] =>
  list.map(f => ({ ...f, category: 'generative', material: s => f.seeded(s, f.seed) }));

export const custom = (paint: SidePaint, opacity?: number): Material => (opacity === undefined ? { kind: 'custom', paint } : { kind: 'custom', paint, opacity });

export const sheen = (s: Scene, band: Band, top = 0.12, bottom = 0.3) => vertical(s, `sheen-${Math.round(top * 100)}-${Math.round(bottom * 100)}`, band, [[0, '#ffffff', top], [0.45, '#ffffff', 0], [1, '#000000', bottom]]);

export const edgeLight = (a: Parameters<SidePaint>[1], t: string, band: Band, opacity = 0.5, height = 1.2) =>
  `<rect x="${n(a.x)}" y="${n(band.y0)}" width="${n(a.width)}" height="${height}" fill="#ffffff" opacity="${opacity}" transform="${t}"/>`;

export const layers = (a: Parameters<SidePaint>[1], t: string, ...paints: readonly string[]) => paints.map(p => fill(a, t, p)).join('');

export function mix(ramp: readonly string[], t: number): string {
  const u = Math.min(1, Math.max(0, t)) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(u));
  const f = u - i;
  const rgb = (c: string) => [1, 3, 5].map(k => parseInt(c.slice(k, k + 2), 16));
  const a = rgb(ramp[i]!);
  const b = rgb(ramp[i + 1]!);
  return `rgb(${a.map((v, k) => Math.round(v + (b[k]! - v) * f)).join(' ')})`;
}

export const wave = (period: number, samples: number, y: (x: number) => number) =>
  Array.from({ length: samples + 1 }, (_, i) => {
    const x = (i / samples) * period;
    return `${i ? 'L' : 'M'}${n(x)} ${n(y(x))}`;
  }).join('');

export function wrap(x: number, y: number, reach: number, w: number, h: number, draw: (x: number, y: number) => string): string {
  const xs = [x, ...(x < reach ? [x + w] : x > w - reach ? [x - w] : [])];
  const ys = [y, ...(y < reach ? [y + h] : y > h - reach ? [y - h] : [])];
  return xs.flatMap(cx => ys.map(cy => draw(cx, cy))).join('');
}

export function checkSeed(name: string, seed: number) {
  if (!(Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff)) throw new Error(`${name}: seed must be a whole number from 0 to 4294967295 (the same seed always draws the same pattern), got ${seed}`);
}
