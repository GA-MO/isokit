import type { Material, Scene } from '../lib/iso.ts';
import { custom, group, layers, mix, sheen, wave } from './materials-kit.ts';
import { bandKey, n, once, pattern, rng, vertical } from './shared.ts';

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
  return custom((_, a, t, band) => layers(a, t, vertical(s, 'circuit', band, [[0, '#13493a'], [1, '#0a2a20']]), traces));
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
  return custom((_, a, t, band) => layers(a, t, vertical(s, 'minimap', band, [[0, '#171a22'], [1, '#0c0d12']]), code));
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
  return custom((_, a, t, band) => layers(a, t, mesh, vertical(s, 'hexmesh-glow', band, [[0, '#ffffff', 0.06], [0.55, '#38bdf8', 0], [1, '#38bdf8', 0.42]])));
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
  return custom((_, a, t) => layers(a, t, cells));
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
    return layers(a, t, url);
  });
}

function blueprint(s: Scene): Material {
  const grid = once(s, 'fin-blueprint', () => {
    const minor = [4, 8, 12, 16].map(v => `M${v} 0V20M0 ${v}H20`).join('');
    return pattern(20, 20, `<path d="${minor}" stroke="#dbeafe" stroke-width=".3" opacity=".28"/><path d="M.25 0V20M0 .25H20" stroke="#eff6ff" stroke-width=".5" opacity=".6"/>`);
  });
  return custom((_, a, t, band) => layers(a, t, vertical(s, 'blueprint', band, [[0, '#1e5aa8'], [1, '#0b2c5c']]), grid));
}

function rack(s: Scene): Material {
  return custom((_, a, t, band) => {
    const units = once(s, `fin-rack-${bandKey(band)}`, () => {
      const vents = (y: number) => [3, 4.6, 6.2, 7.8, 9.4, 11].map(x => `<rect x="${x}" y="${y + 1.6}" width=".7" height="2.8" rx=".35" fill="#07080a"/>`).join('');
      const unit = (y: number, lights: readonly string[]) =>
        `<rect x=".3" y="${y + 0.35}" width="47.4" height="5.3" rx=".5" fill="#22262d"/><rect x=".3" y="${y + 0.35}" width="47.4" height=".45" fill="#ffffff" opacity=".12"/>${vents(y)}<rect x="16" y="${y + 1.8}" width="16" height="2.4" rx=".4" fill="#111318"/>${lights.map((c, i) => `<circle cx="${38 + i * 2.6}" cy="${y + 3}" r=".75" fill="${c}"/>`).join('')}`;
      return pattern(48, 12, `<rect width="48" height="12" fill="#0b0c0f"/>${unit(0, ['#4ade80', '#4ade80', '#38bdf8'])}${unit(6, ['#4ade80', '#fbbf24', '#3f444d'])}`, band.y0);
    });
    return layers(a, t, units, sheen(s, band, 0.06, 0.35));
  });
}

function barcode(s: Scene): Material {
  return custom((_, a, t, band) => {
    const bars = once(s, `fin-barcode-${bandKey(band)}`, () => {
      const h = band.y1 - band.y0;
      const [top, bottom] = [h * 0.16, h * 0.2];
      const r = rng(97);
      let body = `<rect width="60" height="${n(h)}" fill="#f4f4f2"/>`;
      let x = 4;
      while (x < 56) {
        const w = [0.5, 0.5, 1, 1.5, 2][Math.floor(r() * 5)]!;
        body += `<rect x="${n(x)}" y="${n(top)}" width="${w}" height="${n(h - top - bottom)}" fill="#111214"/>`;
        x += w + [0.5, 0.5, 1, 1.5][Math.floor(r() * 4)]!;
      }
      return pattern(60, h, body, band.y0);
    });
    return layers(a, t, bars, sheen(s, band, 0.2, 0.28));
  });
}

export const tech = group('tech-pattern', [
  { slug: 'circuit', name: 'Circuit', note: 'Hardware, devices and IoT', material: circuit },
  { slug: 'minimap', name: 'Minimap', note: 'Editors, code and dev tools', material: minimap },
  { slug: 'rack', name: 'Rack', note: 'Servers, clusters and hosting', material: rack },
  { slug: 'waveform', name: 'Waveform', note: 'Audio, signals and monitoring', material: waveform },
  { slug: 'blueprint', name: 'Blueprint', note: 'Specs, plans and architecture', material: blueprint },
  { slug: 'hexmesh', name: 'Hex mesh', note: 'Networks, security and infra', material: hexmesh },
  { slug: 'heatmap', name: 'Heat map', note: 'Analytics, load and hot paths', material: heatmap },
  { slug: 'barcode', name: 'Barcode', note: 'Inventory, retail and tracking', material: barcode },
]);
