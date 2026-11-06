import type { Page } from '../scripts/render';

export type Level = 'simple' | 'medium' | 'complex';
export type Surface = 'dark' | 'light';
export type Interaction = 'watch' | 'hover' | 'play';

export interface Example {
  slug: string;
  title: string;
  story: string;
  prompt: string;
  level: Level;
  useCase: string;
  surface: Surface;
  interaction: Interaction;
  html: string;
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
} as const;

export function page(e: Example): Page {
  const s = surfaces[e.surface];
  return {
    title: `${e.title} · isokit example`,
    lang: 'en',
    background: s.card,
    ink: s.ink,
    fonts: ['Inter:wght@400;500;600', 'Fira+Code:wght@400;500'],
    css: `main{max-width:1180px;margin:0 auto;padding:48px 16px;font-family:${fonts.sans}}`,
    body: `<main>${e.html}</main>`,
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
