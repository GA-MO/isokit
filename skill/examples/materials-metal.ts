import type { Material, Scene } from '../lib/iso';
import { custom, edgeLight, group, layers, sheen } from './materials-kit';
import { n, once, paints, pattern, ramps, stops, vertical } from './shared';

function titanium(s: Scene): Material {
  return custom((_, a, t, band) => layers(a, t, vertical(s, 'titanium', band, [[0, '#ecc38a'], [0.32, '#c4568e'], [0.68, '#5b5bd6'], [1, '#283a8a']])) + edgeLight(a, t, band));
}

function fluted(s: Scene): Material {
  const ribs = once(s, 'fin-fluted', () => {
    const rib = once(s, 'fin-fluted-rib', () => `<linearGradient id="$ID">${stops([[0, '#25282f'], [0.3, '#7b8291'], [0.5, '#c9ced8'], [0.78, '#4a4f5b'], [1, '#1f2228']])}</linearGradient>`);
    return pattern(5, 10, `<rect width="5" height="10" fill="${rib}"/>`);
  });
  return custom((_, a, t, band) => layers(a, t, ribs, vertical(s, 'fluted-shade', band, [[0, '#ffffff', 0.12], [0.4, '#000000', 0], [1, '#000000', 0.5]])));
}

function chrome(s: Scene): Material {
  return custom(
    (_, a, t, band) =>
      layers(a, t, vertical(s, 'chrome', band, [[0, '#ffffff'], [0.1, '#e4e9ef'], [0.4, '#a3adb9'], [0.47, '#2b3139'], [0.62, '#6b7684'], [0.86, '#363d47'], [1, '#1c2026']])) + edgeLight(a, t, band, 0.85, 0.8),
  );
}

function anodized(s: Scene): Material {
  const bead = once(s, 'fin-anodized', () => pattern(3, 3, `<rect width="1" height="1" fill="#ffffff" opacity=".05"/><rect x="1.5" y="1.5" width="1" height="1" fill="#000000" opacity=".08"/>`));
  return custom((_, a, t, band) => layers(a, t, vertical(s, 'anodized', band, [[0, '#9db0dc'], [0.07, '#4d6299'], [0.5, '#2c3b69'], [1, '#141b35']]), bead) + edgeLight(a, t, band, 0.65, 0.7));
}

function knurled(s: Scene): Material {
  const grip = once(s, 'fin-knurled', () => pattern(5, 5, `<rect width="5" height="5" fill="#2b2f36"/><path d="M2.5 .35L4.65 2.5H.35Z" fill="#c3cad4"/><path d="M.35 2.5H4.65L2.5 4.65Z" fill="#5d6571"/>`));
  return custom((_, a, t, band) => layers(a, t, grip, vertical(s, 'knurled-shade', band, [[0, '#ffffff', 0.18], [0.35, '#ffffff', 0], [1, '#000000', 0.45]])));
}

function tread(s: Scene): Material {
  const plate = once(s, 'fin-tread', () => {
    const lug = (x: number, y: number, deg: number) =>
      `<g transform="translate(${x} ${y}) rotate(${deg})"><rect x="-4.6" y="-.7" width="9.2" height="2.2" rx="1.1" fill="#3b4048" opacity=".7"/><rect x="-4.6" y="-1.1" width="9.2" height="2.2" rx="1.1" fill="#c8ced6"/></g>`;
    return pattern(14, 14, `${lug(3.5, 3.5, 45)}${lug(10.5, 10.5, -45)}`);
  });
  return custom((_, a, t, band) => layers(a, t, vertical(s, 'tread', band, [[0, '#b3bac4'], [0.5, '#7d858f'], [1, '#4b525b']]), plate, sheen(s, band, 0.16, 0.35)));
}

function perforated(s: Scene): Material {
  const holes = once(s, 'fin-perforated', () => {
    const [dx, dy] = [4, 3.46];
    const hole = (x: number, y: number) => `<circle cx="${x}" cy="${n(y + 0.35)}" r="1.25" fill="#ffffff" opacity=".22"/><circle cx="${x}" cy="${n(y)}" r="1.25" fill="#07080a"/>`;
    return pattern(dx, dy * 2, [hole(0, 0), hole(dx, 0), hole(dx / 2, dy), hole(0, dy * 2), hole(dx, dy * 2)].join(''));
  });
  return custom((_, a, t, band) => layers(a, t, vertical(s, 'perforated', band, [[0, '#eef0f3'], [0.08, '#b9c0c9'], [0.6, '#7f8894'], [1, '#4a515b']]), holes));
}

export const metal = group('metal', [
  { slug: 'brushed', name: 'Brushed', note: 'Servers, storage and hardware', material: s => paints.brushed(s, ramps.silver) },
  { slug: 'chrome', name: 'Chrome', note: 'Polished pro tiers and launches', material: chrome },
  { slug: 'titanium', name: 'Titanium', note: 'One standout tile in a hero', material: titanium },
  { slug: 'anodized', name: 'Anodized', note: 'Laptops, devices and pro gear', material: anodized },
  { slug: 'fluted', name: 'Fluted', note: 'Premium hardware and light', material: fluted },
  { slug: 'knurled', name: 'Knurled', note: 'Dials, controls and settings', material: knurled },
  { slug: 'tread', name: 'Tread plate', note: 'Logistics, freight and heavy loads', material: tread },
  { slug: 'perforated', name: 'Perforated', note: 'Speakers, cooling and airflow', material: perforated },
]);
