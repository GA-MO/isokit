import type { Material, Scene } from '../lib/iso.ts';
import { custom, edgeLight, group, layers } from './materials-kit.ts';
import { n, once, pattern, rng, stops, vertical } from './shared.ts';

function clear(s: Scene): Material {
  return custom((_, a, t, band) => layers(a, t, vertical(s, 'clear', band, [[0, '#f2fbff'], [0.06, '#8fd3f0'], [0.2, '#2a7fa6'], [1, '#1f8fc2']])), 0.72);
}

function frosted(s: Scene): Material {
  const frost = once(s, 'fin-frosted', () => {
    const r = rng(19);
    let body = '';
    for (let i = 0; i < 40; i++) body += `<rect x="${n(r() * 15.4)}" y="${n(r() * 15.4)}" width=".6" height=".6" fill="#ffffff" opacity="${n(0.12 + r() * 0.2)}"/>`;
    return pattern(16, 16, body);
  });
  return custom((_, a, t, band) => layers(a, t, vertical(s, 'frosted', band, [[0, '#ffffff'], [0.08, '#eef2f7'], [0.35, '#c9d3e1'], [1, '#8e9db3']]), frost) + edgeLight(a, t, band, 0.7, 0.7), 0.9);
}

function smoked(s: Scene): Material {
  return custom((_, a, t, band) => layers(a, t, vertical(s, 'smoked', band, [[0, '#d9dce2'], [0.05, '#6b7079'], [0.28, '#25282e'], [1, '#0a0b0d']])) + edgeLight(a, t, band, 0.55, 0.7), 0.92);
}

function reeded(s: Scene): Material {
  const reeds = once(s, 'fin-reeded', () => {
    const lens = once(s, 'fin-reeded-lens', () => `<linearGradient id="$ID">${stops([[0, '#ffffff', 0.5], [0.35, '#d8f3f0', 0.12], [0.75, '#0f3b3a', 0.3], [1, '#ffffff', 0.35]])}</linearGradient>`);
    return pattern(3.2, 10, `<rect width="3.2" height="10" fill="${lens}"/>`);
  });
  return custom((_, a, t, band) => layers(a, t, vertical(s, 'reeded', band, [[0, '#f0fdfa'], [0.1, '#8cc9c3'], [1, '#2a6f6a']]), reeds) + edgeLight(a, t, band, 0.6, 0.8), 0.88);
}

function dichroic(s: Scene): Material {
  const shift = once(s, 'fin-dichroic', () => {
    const hue = once(s, 'fin-dichroic-hue', () => `<linearGradient id="$ID">${stops([[0, '#22d3ee'], [0.25, '#818cf8'], [0.5, '#e879f9'], [0.75, '#fbbf24'], [1, '#22d3ee']])}</linearGradient>`);
    return pattern(96, 10, `<rect width="96" height="10" fill="${hue}"/>`);
  });
  return custom((_, a, t, band) => layers(a, t, shift, vertical(s, 'dichroic-sheen', band, [[0, '#ffffff', 0.85], [0.12, '#ffffff', 0.25], [0.55, '#ffffff', 0], [1, '#0b0b1a', 0.45]])), 0.86);
}

function stained(s: Scene): Material {
  const panes = once(s, 'fin-stained', () => {
    const rows = [
      [0, [[0, 10, '#be123c'], [10, 7, '#f59e0b'], [17, 12, '#1d4ed8'], [29, 9, '#047857']]],
      [9, [[0, 5, '#7c3aed'], [5, 10, '#0e7490'], [15, 7, '#ca8a04'], [22, 12, '#b91c1c'], [34, 4, '#7c3aed']]],
    ] as const;
    const glass = rows.flatMap(([y, list]) => list.map(([x, w, c]) => `<rect x="${x}" y="${y}" width="${w}" height="9" fill="${c}"/>`)).join('');
    const seams = [10, 17, 29, 38].map(x => `M${x} 0V9`).join('') + [5, 15, 22, 34].map(x => `M${x} 9V18`).join('');
    return pattern(38, 18, `${glass}<path d="${seams}M0 .45H38M0 9H38" stroke="#16171a" stroke-width=".9" fill="none"/>`);
  });
  return custom((_, a, t, band) => layers(a, t, panes, vertical(s, 'stained-light', band, [[0, '#ffffff', 0.4], [0.3, '#ffffff', 0.08], [1, '#000000', 0.35]])), 0.92);
}

function block(s: Scene): Material {
  const bricks = once(s, 'fin-glass-block', () => {
    const cell = once(s, 'fin-glass-block-cell', () => `<linearGradient id="$ID" x1="0" y1="0" x2="1" y2="1">${stops([[0, '#ffffff', 0.7], [0.45, '#bae6fd', 0.25], [1, '#0c4a6e', 0.45]])}</linearGradient>`);
    return pattern(10, 10, `<rect width="10" height="10" fill="#94a3b8" opacity=".55"/><rect x=".7" y=".7" width="8.6" height="8.6" rx="1.2" fill="${cell}"/><rect x="2.6" y="2.6" width="4.8" height="4.8" rx=".8" fill="#e0f2fe" opacity=".2"/>`);
  });
  return custom((_, a, t, band) => layers(a, t, vertical(s, 'glass-block', band, [[0, '#d6ebf7'], [1, '#1d5675']]), bricks), 0.9);
}

function wired(s: Scene): Material {
  const mesh = once(s, 'fin-wired', () => pattern(6, 6, `<path d="M0 .3H6M.3 0V6" stroke="#1f2933" stroke-width=".4" opacity=".8"/><circle cx=".3" cy=".3" r=".45" fill="#1f2933"/>`));
  return custom((_, a, t, band) => layers(a, t, vertical(s, 'wired', band, [[0, '#f5faf7'], [0.07, '#c5dacf'], [0.3, '#8fb0a1'], [1, '#3f6656']]), mesh), 0.88);
}

export const glass = group('glass', [
  { slug: 'glass', name: 'Glass', note: 'Layers, previews and overlays', material: clear },
  { slug: 'frosted', name: 'Frosted', note: 'Modals, sheets and soft panels', material: frosted },
  { slug: 'smoked', name: 'Smoked', note: 'Dark mode cards and media', material: smoked },
  { slug: 'reeded', name: 'Reeded', note: 'Privacy, blur and hidden data', material: reeded },
  { slug: 'dichroic', name: 'Dichroic', note: 'AI features and new launches', material: dichroic },
  { slug: 'stained', name: 'Stained', note: 'Creative tools and playful brands', material: stained },
  { slug: 'glass-block', name: 'Glass block', note: 'Caches, buckets and containers', material: block },
  { slug: 'wired', name: 'Wired', note: 'Safety, compliance and guards', material: wired },
]);
