import { responsive, type Material, type Scene, type SidePaint } from '../lib/iso';
import type { Page } from '../scripts/render';

export const levels = ['spot', 'simple', 'medium', 'complex'] as const;
export type Level = (typeof levels)[number];
export const categories = ['product', 'security', 'infra', 'data'] as const;
export type Category = (typeof categories)[number];
export const layouts = ['wide', 'diagonal', 'panels', 'radial', 'field', 'exploded', 'object'] as const;
export type Layout = (typeof layouts)[number];
export type Surface = 'dark' | 'light';
export type Interaction = 'watch' | 'hover' | 'play' | 'drag' | 'explore';

export interface Variant {
  scene: Scene;
  name: string;
  width: number;
  height: number;
  markup: string;
}

export interface Art {
  compact: Variant;
  wide: Variant | null;
  breakpoint: number;
  head: string;
  html: string;
}

export interface Example {
  slug: string;
  title: string;
  story: string;
  prompt: string;
  level: Level;
  category: Category;
  layout: Layout;
  useCase: string;
  surface: Surface;
  interaction: Interaction;
  art: Art;
}

const variant = (s: Scene): Variant => ({ scene: s, name: s.name, width: s.width, height: s.height, markup: s.render() });

export function art(compact: Scene, wide?: Scene, breakpoint = 720, head = ''): Art {
  if (wide && !(Number.isFinite(breakpoint) && breakpoint > 0)) throw new Error(`art: breakpoint must be a positive number of px, got ${breakpoint}`);
  const c = variant(compact);
  const w = wide ? variant(wide) : null;
  return { compact: c, wide: w, breakpoint, head, html: head + (wide ? responsive(compact, wide, breakpoint) : c.markup) };
}

export const fonts = {
  sans: "'Inter Variable', 'Inter', system-ui, sans-serif",
  mono: "'Fira Code Variable', 'Fira Code', ui-monospace, monospace",
} as const;

export const surfaces = {
  dark: {
    page: '#0f1013',
    card: '#141519',
    ink: '#ececef',
    muted: '#8b8d98',
    top: '#1b1c22',
    edge: 'rgb(255 255 255 / .12)',
    wire: 'rgb(255 255 255 / .16)',
    label: { bg: '#1b1c22', border: 'rgb(255 255 255 / .1)', ink: '#e4e4e7', radius: 8 },
  },
  light: {
    page: '#f5f5f2',
    card: '#f7f7f4',
    ink: '#16171b',
    muted: '#6b6e78',
    top: '#ffffff',
    edge: 'rgb(255 255 255 / .9)',
    wire: 'rgb(22 23 27 / .18)',
    label: { bg: '#ffffff', border: 'rgb(22 23 27 / .12)', ink: '#16171b', radius: 8 },
  },
} as const;

export type Ramp = readonly [string, string, string, string];

export const ramps = {
  graphite: ['#18181b', '#27272a', '#3f3f46', '#52525b'],
  silver: ['#a1a1aa', '#d4d4d8', '#e4e4e7', '#fafafa'],
  violet: ['#2e1065', '#5b21b6', '#8b5cf6', '#c4b5fd'],
  indigo: ['#1e1b4b', '#3730a3', '#6366f1', '#c7d2fe'],
  sky: ['#082f49', '#0369a1', '#38bdf8', '#e0f2fe'],
  teal: ['#042f2e', '#0f766e', '#2dd4bf', '#ccfbf1'],
  emerald: ['#022c22', '#047857', '#34d399', '#d1fae5'],
  amber: ['#451a03', '#b45309', '#fbbf24', '#fef3c7'],
  rose: ['#4c0519', '#be123c', '#fb7185', '#ffe4e6'],
} as const satisfies Record<string, Ramp>;

type Band = Parameters<SidePaint>[3];
export type Stop = readonly [offset: number, color: string, opacity?: number];

export const n = (v: number) => Number(v.toFixed(2));

const registry = new WeakMap<Scene, Map<string, string>>();

export function once(s: Scene, id: string, markup: () => string): string {
  let defs = registry.get(s);
  if (!defs) {
    defs = new Map();
    registry.set(s, defs);
  }
  let url = defs.get(id);
  if (!url) {
    url = s.def(id, markup());
    defs.set(id, url);
  }
  return url;
}

export const bandKey = (band: Band) => `${Math.round(band.y0)}-${Math.round(band.y1)}`;

export const fill = (a: Parameters<SidePaint>[1], t: string, paint: string) => `<rect x="${n(a.x)}" y="${n(a.y)}" width="${n(a.width)}" height="${n(a.height)}" fill="${paint}" transform="${t}"/>`;

export const stops = (list: readonly Stop[]) => list.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('');

export const pattern = (w: number, h: number, body: string, y = 0) => `<pattern id="$ID" patternUnits="userSpaceOnUse" x="0" y="${n(y)}" width="${n(w)}" height="${n(h)}">${body}</pattern>`;

export function vertical(s: Scene, key: string, band: Band, list: readonly Stop[]): string {
  return once(s, `fin-${key}-${bandKey(band)}`, () => `<linearGradient id="$ID" gradientUnits="userSpaceOnUse" x1="0" y1="${n(band.y0)}" x2="0" y2="${n(band.y1)}">${stops(list)}</linearGradient>`);
}

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function key(...parts: readonly (string | number)[]): string {
  let h = 2166136261;
  for (const ch of parts.join('|')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0).toString(36);
}

function checkRamp(name: string, ramp: Ramp) {
  if (ramp.length !== 4 || ramp.some(c => typeof c !== 'string' || !c.trim())) throw new Error(`paints.${name}: ramp needs 4 colours from dark to light, got ${JSON.stringify(ramp)}`);
}

function gradient(s: Scene, ramp: Ramp): Material {
  checkRamp('gradient', ramp);
  const k = key(...ramp);
  return {
    kind: 'custom',
    paint: (_, a, t, band) => fill(a, t, vertical(s, `grad-${k}`, band, [[0, ramp[3]], [0.05, ramp[2]], [0.5, ramp[1]], [1, ramp[0]]])),
  };
}

function brushed(s: Scene, ramp: Ramp = ramps.silver): Material {
  checkRamp('brushed', ramp);
  const k = key(...ramp);
  const lines = once(s, `paint-brushed-${k}`, () => {
    const r = rng(29);
    let body = '';
    for (let y = 0.3; y < 16; y += 0.6) {
      let x = -r() * 30;
      while (x < 120) {
        const w = 8 + r() * 40;
        const light = r() > 0.5;
        body += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height=".3" fill="${light ? '#ffffff' : '#000000'}" opacity="${n(0.03 + r() * 0.06)}"/>`;
        x += w + r() * 10;
      }
    }
    return pattern(120, 16, body);
  });
  return {
    kind: 'custom',
    paint: (_, a, t, band) => fill(a, t, vertical(s, `brushed-${k}`, band, [[0, ramp[3]], [0.05, ramp[2]], [0.4, ramp[2]], [0.75, ramp[1]], [1, ramp[0]]])) + fill(a, t, lines),
  };
}

function stripes(s: Scene, ramp: Ramp, width = 3): Material {
  checkRamp('stripes', ramp);
  if (!(Number.isFinite(width) && width > 0)) throw new Error(`paints.stripes: width must be a positive number of scene units, got ${width}`);
  const k = key(...ramp, width);
  const bars = once(s, `paint-stripes-${k}`, () => `<pattern id="$ID" patternUnits="userSpaceOnUse" width="${n(width * 2)}" height="${n(width * 2)}" patternTransform="rotate(45)"><rect width="${n(width * 2)}" height="${n(width * 2)}" fill="${ramp[1]}"/><rect width="${n(width)}" height="${n(width * 2)}" fill="${ramp[2]}"/></pattern>`);
  return {
    kind: 'custom',
    paint: (_, a, t, band) => fill(a, t, bars) + fill(a, t, vertical(s, 'stripes-shade', band, [[0, '#ffffff', 0.14], [0.5, '#ffffff', 0], [1, '#000000', 0.35]])),
  };
}

function dots(s: Scene, ramp: Ramp, gap = 4): Material {
  checkRamp('dots', ramp);
  if (!(Number.isFinite(gap) && gap >= 1.5)) throw new Error(`paints.dots: gap must be a number of scene units of at least 1.5, got ${gap}`);
  const k = key(...ramp, gap);
  const grid = once(s, `paint-dots-${k}`, () => pattern(gap, gap, `<circle cx="${n(gap / 2)}" cy="${n(gap / 2)}" r="${n(gap * 0.2)}" fill="${ramp[3]}" opacity=".55"/>`));
  return {
    kind: 'custom',
    paint: (_, a, t, band) => fill(a, t, vertical(s, `dots-${k}`, band, [[0, ramp[1]], [1, ramp[0]]])) + fill(a, t, grid),
  };
}

function glass(s: Scene, tint: string, opacity = 0.6): Material {
  if (typeof tint !== 'string' || !tint.trim()) throw new Error('paints.glass: tint must be a CSS colour');
  if (!(Number.isFinite(opacity) && opacity > 0 && opacity <= 1)) throw new Error(`paints.glass: opacity must be above 0 and at most 1, got ${opacity}`);
  const k = key(tint);
  return {
    kind: 'custom',
    opacity,
    paint: (_, a, t, band) => fill(a, t, vertical(s, `glass-${k}`, band, [[0, '#ffffff'], [0.14, tint], [1, tint]])),
  };
}

function random(s: Scene, ramp: Ramp, seed: number, cell = 3): Material {
  checkRamp('random', ramp);
  if (!(Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff)) throw new Error(`paints.random: seed must be a whole number from 0 to 4294967295 (the same seed always draws the same pattern), got ${seed}`);
  if (!(Number.isFinite(cell) && cell >= 1 && cell <= 12)) throw new Error(`paints.random: cell must be between 1 and 12 scene units, got ${cell}`);
  const k = key(...ramp, seed, cell);
  const cells = once(s, `paint-random-${k}`, () => {
    const r = rng(seed);
    const [cols, rows] = [16, 8];
    let body = `<rect width="${n(cols * cell)}" height="${n(rows * cell)}" fill="${ramp[0]}"/>`;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const v = r();
        if (v < 0.35) continue;
        const c = v < 0.7 ? ramp[1] : v < 0.92 ? ramp[2] : ramp[3];
        body += `<rect x="${n(i * cell)}" y="${n(j * cell)}" width="${n(cell)}" height="${n(cell)}" fill="${c}"/>`;
      }
    return pattern(cols * cell, rows * cell, body);
  });
  return {
    kind: 'custom',
    paint: (_, a, t, band) => fill(a, t, cells) + fill(a, t, vertical(s, 'random-shade', band, [[0, '#ffffff', 0.12], [0.4, '#ffffff', 0], [1, '#000000', 0.3]])),
  };
}

export const paints = {
  flat: (color: string): Material => {
    if (typeof color !== 'string' || !color.trim()) throw new Error('paints.flat: color must be a non-empty CSS colour');
    return { kind: 'flat', color };
  },
  gradient,
  brushed,
  stripes,
  dots,
  glass,
  random,
};

export function page(e: { title: string; surface: Surface; art: Art }): Page {
  const s = surfaces[e.surface];
  return {
    title: `${e.title} · isokit example`,
    lang: 'en',
    background: s.card,
    ink: s.ink,
    fonts: ['Inter:wght@400;500;600', 'Fira+Code:wght@400;500'],
    css: `main{max-width:1180px;margin:0 auto;padding:48px 16px;font-family:${fonts.sans}}`,
    body: `<main>${e.art.html}</main>`,
  };
}

export type Anchor = 'center' | 'left' | 'right' | 'top' | 'bottom';

export const narrowest = 300;

export function fitX(x: number, text: string, sceneWidth: number, minPx: number, anchor: Anchor = 'center', font: 'mono' | 'sans' = 'mono', pad = 1.4): number {
  for (const [name, v] of [['x', x], ['sceneWidth', sceneWidth], ['minPx', minPx], ['pad', pad]] as const) {
    if (!Number.isFinite(v)) throw new Error(`fitX: ${name} must be a finite number, got ${v}`);
  }
  if (!(sceneWidth > 0 && minPx > 0)) throw new Error(`fitX: sceneWidth and minPx must be positive, got ${sceneWidth} and ${minPx}`);
  if (pad < 0) throw new Error(`fitX: pad must be >= 0, got ${pad}`);
  if (!text.trim()) throw new Error('fitX: text is empty; pass the label text so its width can be estimated');
  const width = (([...text].length * (font === 'mono' ? 0.6 : 0.56) + pad) * 13 + 2) * (sceneWidth / minPx);
  const margin = 6;
  if (width + 2 * margin > sceneWidth) throw new Error(`fitX: "${text}" is about ${Math.round(width)} units wide at ${minPx} px, wider than the ${sceneWidth}-unit scene; shorten it or break it into two labels`);
  if (anchor === 'left') return Math.min(Math.max(x, margin), sceneWidth - width - margin);
  if (anchor === 'right') return Math.max(Math.min(x, sceneWidth - margin), width + margin);
  return Math.min(Math.max(x, width / 2 + margin), sceneWidth - width / 2 - margin);
}
