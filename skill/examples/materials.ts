import type { Material, Scene, SidePaint } from '../lib/iso';
import { bandKey, fill, n, once, paints, pattern, ramps, rng, stops, vertical } from './shared';

export interface Finish {
  slug: string;
  name: string;
  note: string;
  material: (scene: Scene) => Material;
}

const wave = (period: number, samples: number, y: (x: number) => number) =>
  Array.from({ length: samples + 1 }, (_, i) => {
    const x = (i / samples) * period;
    return `${i ? 'L' : 'M'}${n(x)} ${n(y(x))}`;
  }).join('');

function mix(ramp: readonly string[], t: number): string {
  const u = Math.min(1, Math.max(0, t)) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(u));
  const f = u - i;
  const rgb = (c: string) => [1, 3, 5].map(k => parseInt(c.slice(k, k + 2), 16));
  const a = rgb(ramp[i]!);
  const b = rgb(ramp[i + 1]!);
  return `rgb(${a.map((v, k) => Math.round(v + (b[k]! - v) * f)).join(' ')})`;
}

const custom = (paint: SidePaint): Material => ({ kind: 'custom', paint });

function circuit(s: Scene): Material {
  const traces = once(s, 'fin-circuit', () => {
    const gold = '#d9ae55';
    const pad = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="1.4" fill="${gold}"/><circle cx="${x}" cy="${y}" r=".55" fill="#0b2a20"/>`;
    return pattern(
      48,
      24,
      `<g fill="none" stroke="${gold}" stroke-width=".9" stroke-linejoin="round" opacity=".85"><path d="M0 5H12L16 9H30L34 5H48"/><path d="M28 17H48M0 17H22"/><path d="M40 5V11"/><path d="M6 17V21H14"/></g><rect x="22.6" y="15.4" width="5" height="3.2" rx=".6" fill="#16201c" stroke="${gold}" stroke-width=".5"/>${pad(40, 11.6)}${pad(14.6, 21)}${pad(22, 17)}`,
    );
  });
  return custom((_, a, t, band) => fill(a, t, vertical(s, 'circuit', band, [[0, '#13493a'], [1, '#0a2a20']])) + fill(a, t, traces));
}

function checker(s: Scene): Material {
  const cells = once(s, 'fin-checker', () => pattern(12, 12, `<rect width="12" height="12" fill="#1e1b4b"/><rect width="6" height="6" fill="#3730a3"/><rect x="6" y="6" width="6" height="6" fill="#3730a3"/>`));
  return custom((_, a, t, band) => fill(a, t, cells) + fill(a, t, vertical(s, 'checker-sheen', band, [[0, '#ffffff', 0.12], [0.6, '#ffffff', 0], [1, '#000000', 0.2]])));
}

const bayer = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

function dither(s: Scene): Material {
  return custom((_, a, t, band) => {
    const url = once(s, `fin-dither-${bandKey(band)}`, () => {
      const h = band.y1 - band.y0;
      const rows = Math.max(4, Math.round(h / 2));
      const cell = h / rows;
      let body = `<rect width="${n(cell * 4)}" height="${n(h)}" fill="#1a0f26"/>`;
      for (let r = 0; r < rows; r++) {
        const level = (1 - r / (rows - 1)) ** 1.15;
        for (let c = 0; c < 4; c++) if (level > (bayer[r % 4]![c]! + 0.5) / 16) body += `<rect x="${n(c * cell)}" y="${n(r * cell)}" width="${n(cell)}" height="${n(cell)}" fill="#f0abfc"/>`;
      }
      return pattern(cell * 4, h, body, band.y0);
    });
    return fill(a, t, url);
  });
}

function minimap(s: Scene): Material {
  const code = once(s, 'fin-minimap', () => {
    const r = rng(41);
    const colors = ['#c4b5fd', '#7dd3fc', '#86efac', '#fda4af', '#6b7280', '#c4b5fd', '#7dd3fc'];
    const indent = [0, 1, 2, 2, 3, 2, 1, 0, 1];
    let body = '';
    indent.forEach((level, row) => {
      if (row === 7) return;
      let x = 2 + level * 7;
      const end = 116 - r() * 50;
      while (x < end) {
        const w = 3 + r() * 11;
        body += `<rect x="${n(x)}" y="${row * 4 + 1}" width="${n(Math.min(w, end - x + 3))}" height="2" rx=".8" fill="${colors[Math.floor(r() * colors.length)]}" opacity=".85"/>`;
        x += w + 2.4;
      }
    });
    return pattern(120, 36, body);
  });
  return custom((_, a, t, band) => fill(a, t, vertical(s, 'minimap', band, [[0, '#171a22'], [1, '#0c0d12']])) + fill(a, t, code));
}

function aperture(s: Scene): Material {
  const grille = once(s, 'fin-aperture', () => pattern(3, 3, `<rect width="3" height="3" fill="#050608"/><rect width="1" height="2.2" fill="#ff4d6d"/><rect x="1" width="1" height="2.2" fill="#4dff9a"/><rect x="2" width="1" height="2.2" fill="#4d9bff"/>`));
  return custom((_, a, t, band) => fill(a, t, grille) + fill(a, t, vertical(s, 'aperture-glow', band, [[0, '#050608', 0.7], [0.45, '#050608', 0.05], [1, '#050608', 0.75]])));
}

function hexmesh(s: Scene): Material {
  const r = 4;
  const w = Math.sqrt(3) * r;
  const mesh = once(s, 'fin-hexmesh', () => {
    const hex = (cx: number, cy: number) =>
      `<path d="${[-90, -30, 30, 90, 150, 210].map((deg, i) => `${i ? 'L' : 'M'}${n(cx + r * Math.cos((deg * Math.PI) / 180))} ${n(cy + r * Math.sin((deg * Math.PI) / 180))}`).join('')}Z"/>`;
    let body = '';
    for (let j = -1; j <= 2; j++) for (let i = -1; i <= 1; i++) body += hex(i * w + (j % 2 ? w / 2 : 0), j * 1.5 * r);
    return pattern(w, 3 * r, `<g fill="#15171c" stroke="#7a8296" stroke-width=".55">${body}</g>`);
  });
  return custom((_, a, t, band) => fill(a, t, mesh) + fill(a, t, vertical(s, 'hexmesh-glow', band, [[0, '#ffffff', 0.06], [0.55, '#38bdf8', 0], [1, '#38bdf8', 0.42]])));
}

const magma = ['#0c0a24', '#3b0f70', '#8c2981', '#de4968', '#fe9f6d', '#fcfdbf'] as const;

function heatmap(s: Scene): Material {
  const cells = once(s, 'fin-heatmap', () => {
    let body = '<rect width="64" height="24" fill="#09071a"/>';
    for (let i = 0; i < 16; i++)
      for (let j = 0; j < 6; j++) {
        const [u, v] = [i / 16, j / 6];
        const value = 0.42 + 0.28 * Math.sin(Math.PI * 2 * u) + 0.2 * Math.sin(Math.PI * 2 * (2 * u + v)) + 0.14 * Math.cos(Math.PI * 2 * (v + 0.3) + 3 * u);
        body += `<rect x="${i * 4 + 0.25}" y="${j * 4 + 0.25}" width="3.5" height="3.5" rx=".5" fill="${mix(magma, value)}"/>`;
      }
    return pattern(64, 24, body);
  });
  return custom((_, a, t) => fill(a, t, cells));
}

function chevron(s: Scene): Material {
  const zig = once(s, 'fin-chevron', () => pattern(14, 8, `<rect width="14" height="8" fill="#0b302d"/><path d="M0 0L7 4L14 0V4L7 8L0 4Z" fill="#14706a"/>`));
  return custom((_, a, t, band) => fill(a, t, zig) + fill(a, t, vertical(s, 'chevron-sheen', band, [[0, '#ffffff', 0.12], [0.5, '#ffffff', 0], [1, '#000000', 0.25]])));
}

function waveform(s: Scene): Material {
  return custom((_, a, t, band) => {
    const url = once(s, `fin-waveform-${bandKey(band)}`, () => {
      const h = band.y1 - band.y0;
      const mid = h / 2;
      const grid = [8, 16, 24, 32, 40, 48, 56, 64].map(x => `<path d="M${x} 0V${n(h)}"/>`).join('') + `<path d="M0 ${n(mid)}H64"/>`;
      const main = wave(64, 48, x => mid + h * 0.3 * Math.sin((x / 64) * Math.PI * 4));
      const second = wave(64, 48, x => mid + h * 0.18 * Math.sin((x / 64) * Math.PI * 6 + 1));
      return pattern(
        64,
        h,
        `<rect width="64" height="${n(h)}" fill="#061118"/><g stroke="#15313c" stroke-width=".5">${grid}</g><path d="${second}" fill="none" stroke="#a78bfa" stroke-width=".8" opacity=".75"/><path d="${main}" fill="none" stroke="#22d3ee" stroke-width="2.6" opacity=".22"/><path d="${main}" fill="none" stroke="#67e8f9" stroke-width=".9"/>`,
        band.y0,
      );
    });
    return fill(a, t, url);
  });
}

function fluted(s: Scene): Material {
  const ribs = once(s, 'fin-fluted', () => {
    const rib = once(s, 'fin-fluted-rib', () => `<linearGradient id="$ID">${stops([[0, '#25282f'], [0.3, '#7b8291'], [0.5, '#c9ced8'], [0.78, '#4a4f5b'], [1, '#1f2228']])}</linearGradient>`);
    return pattern(5, 10, `<rect width="5" height="10" fill="${rib}"/>`);
  });
  return custom((_, a, t, band) => fill(a, t, ribs) + fill(a, t, vertical(s, 'fluted-shade', band, [[0, '#ffffff', 0.12], [0.4, '#000000', 0], [1, '#000000', 0.5]])));
}

function titanium(s: Scene): Material {
  return custom((_, a, t, band) => {
    const tint = vertical(s, 'titanium', band, [[0, '#ecc38a'], [0.32, '#c4568e'], [0.68, '#5b5bd6'], [1, '#283a8a']]);
    return `${fill(a, t, tint)}<rect x="${n(a.x)}" y="${n(band.y0)}" width="${n(a.width)}" height="1.2" fill="#ffffff" opacity=".5" transform="${t}"/>`;
  });
}

function basketweave(s: Scene): Material {
  const weave = once(s, 'fin-basketweave', () => {
    const across = (x: number, y: number) => [1.5, 3, 4.5].map(d => `<path d="M${x} ${y + d}h6"/>`).join('');
    const down = (x: number, y: number) => [1.5, 3, 4.5].map(d => `<path d="M${x + d} ${y}v6"/>`).join('');
    return pattern(12, 12, `<rect width="12" height="12" fill="#2a251e"/><rect width="6" height="6" fill="#352e25"/><rect x="6" y="6" width="6" height="6" fill="#352e25"/><g stroke="#a99270" stroke-width=".7" opacity=".75">${across(0, 0)}${down(6, 0)}${down(0, 6)}${across(6, 6)}</g>`);
  });
  return custom((_, a, t, band) => fill(a, t, weave) + fill(a, t, vertical(s, 'basketweave-shade', band, [[0, '#ffffff', 0.08], [1, '#000000', 0.3]])));
}

export const finishes: readonly Finish[] = [
  { slug: 'titanium', name: 'Titanium', note: 'One standout tile in a hero', material: titanium },
  { slug: 'circuit', name: 'Circuit', note: 'Hardware, devices and IoT', material: circuit },
  { slug: 'minimap', name: 'Minimap', note: 'Editors, code and dev tools', material: minimap },
  { slug: 'brushed', name: 'Brushed', note: 'Servers, storage and hardware', material: s => paints.brushed(s, ramps.silver) },
  { slug: 'waveform', name: 'Waveform', note: 'Audio, signals and monitoring', material: waveform },
  { slug: 'glass', name: 'Glass', note: 'Layers, previews and overlays', material: s => paints.glass(s, '#38bdf8') },
  { slug: 'hexmesh', name: 'Hex mesh', note: 'Networks, security and infra', material: hexmesh },
  { slug: 'dither', name: 'Dither', note: 'Retro, pixel and 1‑bit looks', material: dither },
  { slug: 'fluted', name: 'Fluted', note: 'Premium hardware and light', material: fluted },
  { slug: 'heatmap', name: 'Heat map', note: 'Analytics, load and hot paths', material: heatmap },
  { slug: 'random', name: 'Random', note: 'Seeded noise, one per tile', material: s => paints.random(s, ramps.violet, 7) },
  { slug: 'checker', name: 'Checker', note: 'Test grids, games, playful UI', material: checker },
  { slug: 'basketweave', name: 'Basketweave', note: 'Textiles and cozy consumer apps', material: basketweave },
  { slug: 'aperture', name: 'Aperture', note: 'Displays, terminals and video', material: aperture },
  { slug: 'chevron', name: 'Chevron', note: 'Direction, flow and progress', material: chevron },
];
