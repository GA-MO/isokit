import type { Material, Scene } from '../lib/iso';
import { custom, group, layers, sheen } from './materials-kit';
import { bandKey, n, once, pattern, vertical } from './shared';

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
    return layers(a, t, url);
  });
}

function checker(s: Scene): Material {
  const cells = once(s, 'fin-checker', () => pattern(12, 12, `<rect width="12" height="12" fill="#1e1b4b"/><rect width="6" height="6" fill="#3730a3"/><rect x="6" y="6" width="6" height="6" fill="#3730a3"/>`));
  return custom((_, a, t, band) => layers(a, t, cells, vertical(s, 'checker-sheen', band, [[0, '#ffffff', 0.12], [0.6, '#ffffff', 0], [1, '#000000', 0.2]])));
}

function aperture(s: Scene): Material {
  const grille = once(s, 'fin-aperture', () => pattern(3, 3, `<rect width="3" height="3" fill="#050608"/><rect width="1" height="2.2" fill="#ff4d6d"/><rect x="1" width="1" height="2.2" fill="#4dff9a"/><rect x="2" width="1" height="2.2" fill="#4d9bff"/>`));
  return custom((_, a, t, band) => layers(a, t, grille, vertical(s, 'aperture-glow', band, [[0, '#050608', 0.7], [0.45, '#050608', 0.05], [1, '#050608', 0.75]])));
}

function chevron(s: Scene): Material {
  const zig = once(s, 'fin-chevron', () => pattern(14, 8, `<rect width="14" height="8" fill="#0b302d"/><path d="M0 0L7 4L14 0V4L7 8L0 4Z" fill="#14706a"/>`));
  return custom((_, a, t, band) => layers(a, t, zig, vertical(s, 'chevron-sheen', band, [[0, '#ffffff', 0.12], [0.5, '#ffffff', 0], [1, '#000000', 0.25]])));
}

function neon(s: Scene): Material {
  return custom((_, a, t, band) => {
    const tubes = once(s, `fin-neon-${bandKey(band)}`, () => {
      const h = band.y1 - band.y0;
      const tube = (y: number, glow: string, core: string) =>
        `<rect y="${n(y - 2.6)}" width="4" height="5.2" fill="${glow}" opacity=".14"/><rect y="${n(y - 1.1)}" width="4" height="2.2" fill="${glow}" opacity=".45"/><rect y="${n(y - 0.35)}" width="4" height=".7" fill="${core}"/>`;
      return pattern(4, h, tube(h * 0.36, '#ff2d95', '#ffd1ec') + tube(h * 0.68, '#22d3ee', '#cffafe'), band.y0);
    });
    return layers(a, t, vertical(s, 'neon-base', band, [[0, '#1a1033'], [1, '#07060f']]), tubes);
  });
}

function sunset(s: Scene): Material {
  return custom((_, a, t, band) => {
    const gaps = once(s, `fin-sunset-${bandKey(band)}`, () => {
      const h = band.y1 - band.y0;
      const cuts = [0.42, 0.53, 0.63, 0.72, 0.8, 0.87, 0.93].map((y, i) => `<rect y="${n(h * y)}" width="4" height="${n(h * (0.012 + i * 0.008))}" fill="#1b0b2e"/>`).join('');
      return pattern(4, h, cuts, band.y0);
    });
    return layers(a, t, vertical(s, 'sunset-base', band, [[0, '#ffe08a'], [0.3, '#ffa45c'], [0.62, '#f2547d'], [1, '#a21caf']]), gaps);
  });
}

function halftone(s: Scene): Material {
  return custom((_, a, t, band) => {
    const dots = once(s, `fin-halftone-${bandKey(band)}`, () => {
      const h = band.y1 - band.y0;
      const step = 1.7;
      let body = '';
      for (let row = 0, y = step / 2; y < h; row++, y += step) {
        const r = n(0.18 + 0.95 * (y / h) ** 1.2);
        const x = row % 2 ? step : 0;
        body += `<circle cx="${n(x)}" cy="${n(y)}" r="${r}"/>${row % 2 ? '' : `<circle cx="${n(step * 2)}" cy="${n(y)}" r="${r}"/>`}`;
      }
      return pattern(step * 2, h, `<rect width="${n(step * 2)}" height="${n(h)}" fill="#fff3d6"/><g fill="#e11d48">${body}</g>`, band.y0);
    });
    return layers(a, t, dots, sheen(s, band, 0.1, 0.18));
  });
}

function memphis(s: Scene): Material {
  const confetti = once(s, 'fin-memphis', () =>
    pattern(
      36,
      20,
      `<rect width="36" height="20" fill="#fbf3e6"/><path d="M3 4L6.5 2.5L5.5 7Z" fill="#f472b6"/><path d="M14 15l2-2 2 2 2-2 2 2" fill="none" stroke="#111827" stroke-width=".7" stroke-linejoin="round"/><circle cx="27" cy="5" r="1.6" fill="#2dd4bf"/><rect x="30" y="13" width="3" height="3" fill="#60a5fa" transform="rotate(20 31.5 14.5)"/><path d="M16 4H21" stroke="#111827" stroke-width=".7"/><path d="M6 13l1.2 3.6M9 12.5l1.2 3.6" stroke="#f59e0b" stroke-width=".7"/><g fill="#111827"><circle cx="24" cy="12" r=".45"/><circle cx="25.6" cy="12" r=".45"/><circle cx="24" cy="13.6" r=".45"/><circle cx="25.6" cy="13.6" r=".45"/></g><path d="M33 2.5L35 6.2H31Z" fill="none" stroke="#a78bfa" stroke-width=".7"/>`,
    ),
  );
  return custom((_, a, t, band) => layers(a, t, confetti, sheen(s, band, 0.08, 0.22)));
}

export const retro = group('retro', [
  { slug: 'sunset', name: 'Sunset', note: 'Music, games and nostalgia', material: sunset },
  { slug: 'dither', name: 'Dither', note: 'Pixel and 1‑bit looks', material: dither },
  { slug: 'neon', name: 'Neon', note: 'Nightlife, events and live status', material: neon },
  { slug: 'checker', name: 'Checker', note: 'Test grids, games, playful UI', material: checker },
  { slug: 'halftone', name: 'Halftone', note: 'Print, comics and posters', material: halftone },
  { slug: 'aperture', name: 'Aperture', note: 'Displays, terminals and video', material: aperture },
  { slug: 'memphis', name: 'Memphis', note: 'Launch parties and playful promos', material: memphis },
  { slug: 'chevron', name: 'Chevron', note: 'Direction, flow and progress', material: chevron },
]);
