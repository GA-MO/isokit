import type { Material, Scene } from '../lib/iso.ts';
import { custom, group, layers, sheen, wrap } from './materials-kit.ts';
import { bandKey, n, once, pattern, rng, stops, vertical } from './shared.ts';

function specks(seed: number, w: number, h: number, count: number, size: readonly [number, number], colors: readonly (readonly [string, number])[]): string {
  const r = rng(seed);
  let body = '';
  for (let i = 0; i < count; i++) {
    const [color, opacity] = colors[Math.floor(r() * colors.length)]!;
    const radius = size[0] + r() * (size[1] - size[0]);
    body += wrap(r() * w, r() * h, radius, w, h, (x, y) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(radius)}" fill="${color}" opacity="${opacity}"/>`);
  }
  return body;
}

function basketweave(s: Scene): Material {
  const weave = once(s, 'fin-basketweave', () => {
    const across = (x: number, y: number) => [1.5, 3, 4.5].map(d => `<path d="M${x} ${y + d}h6"/>`).join('');
    const down = (x: number, y: number) => [1.5, 3, 4.5].map(d => `<path d="M${x + d} ${y}v6"/>`).join('');
    return pattern(12, 12, `<rect width="12" height="12" fill="#2a251e"/><rect width="6" height="6" fill="#352e25"/><rect x="6" y="6" width="6" height="6" fill="#352e25"/><g stroke="#a99270" stroke-width=".7" opacity=".75">${across(0, 0)}${down(6, 0)}${down(0, 6)}${across(6, 6)}</g>`);
  });
  return custom((_, a, t, band) => layers(a, t, weave, vertical(s, 'basketweave-shade', band, [[0, '#ffffff', 0.08], [1, '#000000', 0.3]])));
}

function oak(s: Scene): Material {
  const grain = once(s, 'fin-oak', () => {
    const r = rng(17);
    let body = '<rect width=".6" height="20" fill="#3b2412" opacity=".45"/>';
    for (let y = 0.4; y < 20; y += 0.7 + r() * 1.3) {
      let x = -r() * 40;
      while (x < 140) {
        const w = 30 + r() * 90;
        body += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(0.2 + r() * 0.45)}" fill="${r() > 0.25 ? '#5a3514' : '#f3c98f'}" opacity="${n(0.12 + r() * 0.3)}"/>`;
        x += w + r() * 14;
      }
    }
    return pattern(140, 20, body);
  });
  return custom((_, a, t, band) => layers(a, t, vertical(s, 'oak', band, [[0, '#e5b77c'], [0.06, '#c99258'], [0.6, '#a8713c'], [1, '#6d4321']]), grain));
}

function bamboo(s: Scene): Material {
  const slats = once(s, 'fin-bamboo', () => {
    const cane = once(s, 'fin-bamboo-cane', () => `<linearGradient id="$ID">${stops([[0, '#9c7f45'], [0.35, '#e2cc8e'], [0.6, '#d4b977'], [1, '#86692f']])}</linearGradient>`);
    const nodes = [6, 19, 12];
    return pattern(
      27,
      26,
      nodes
        .map((y, i) => {
          const x = i * 9;
          return `<rect x="${x}" width="8.4" height="26" fill="${cane}"/><rect x="${x}" y="${y}" width="8.4" height=".7" fill="#5f4a22" opacity=".75"/><rect x="${x}" y="${y + 0.7}" width="8.4" height=".5" fill="#f7e7b4" opacity=".55"/>`;
        })
        .join('') + '<g fill="#3d2f15" opacity=".8"><rect x="8.4" width=".6" height="26"/><rect x="17.4" width=".6" height="26"/><rect x="26.4" width=".6" height="26"/></g>',
    );
  });
  return custom((_, a, t, band) => layers(a, t, slats, sheen(s, band, 0.1, 0.3)));
}

function cork(s: Scene): Material {
  const tile = once(s, 'fin-cork', () => pattern(20, 20, specks(23, 20, 20, 46, [0.25, 1], [['#6f4425', 0.75], ['#8d5a32', 0.6], ['#e3b585', 0.55], ['#4f2f18', 0.5]])));
  return custom((_, a, t, band) => layers(a, t, vertical(s, 'cork', band, [[0, '#d4a274'], [0.5, '#b98656'], [1, '#8a5c36']]), tile));
}

function felt(s: Scene): Material {
  const fibres = once(s, 'fin-felt', () => {
    const r = rng(31);
    let body = '';
    for (let i = 0; i < 60; i++) {
      const [x, y, w, light, o, deg] = [r() * 12, r() * 12, 1 + r() * 1.6, r() > 0.45, 0.1 + r() * 0.14, Math.round(r() * 180)];
      body += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height=".26" fill="${light ? '#ffffff' : '#000000'}" opacity="${n(o)}" transform="rotate(${deg} ${n(x)} ${n(y)})"/>`;
    }
    return pattern(12, 12, body);
  });
  const stitch = once(s, 'fin-felt-stitch', () => pattern(4.4, 2, `<rect width="2.6" height=".75" rx=".37" fill="#efe9dc" opacity=".9"/>`));
  return custom((_, a, t, band) => {
    const y = band.y0 + Math.min(3.2, (band.y1 - band.y0) * 0.18);
    const seam = `<rect x="${n(a.x)}" y="${n(y)}" width="${n(a.width)}" height=".75" fill="${stitch}" transform="${t}"/>`;
    return layers(a, t, vertical(s, 'felt', band, [[0, '#8f8a83'], [0.12, '#77726b'], [1, '#4a4642']]), fibres) + seam;
  });
}

function linen(s: Scene): Material {
  const weave = once(s, 'fin-linen', () => {
    const r = rng(53);
    let body = '';
    for (let y = 0; y < 6; y++) body += `<rect y="${y + 0.15}" width="24" height="${n(0.45 + r() * 0.35)}" fill="#ffffff" opacity="${n(0.14 + r() * 0.2)}"/>`;
    for (let x = 0; x < 24; x++) body += `<rect x="${x + 0.2}" width="${n(0.35 + r() * 0.3)}" height="6" fill="#6f634f" opacity="${n(0.08 + r() * 0.14)}"/>`;
    return pattern(24, 6, body);
  });
  return custom((_, a, t, band) => layers(a, t, vertical(s, 'linen', band, [[0, '#ece5d7'], [0.5, '#d6ccb9'], [1, '#a99d86']]), weave));
}

function paper(s: Scene): Material {
  return custom((_, a, t, band) => {
    const sheets = once(s, `fin-paper-${bandKey(band)}`, () => {
      const h = band.y1 - band.y0;
      const r = rng(61);
      const tones = ['#f7f5ef', '#ece8de', '#f2efe7', '#e4dfd3'];
      let body = '';
      let i = 0;
      for (let y = 0; y < h; y += 0.85, i++) {
        const tint = i === 9 ? '#f3e7b3' : i === 21 ? '#cfe0ec' : tones[Math.floor(r() * tones.length)]!;
        body += `<rect y="${n(y)}" width="4" height=".68" fill="${tint}"/>`;
      }
      return pattern(4, h, `<rect width="4" height="${n(h)}" fill="#bdb6a8"/>${body}`, band.y0);
    });
    return layers(a, t, sheets, vertical(s, 'paper-shade', band, [[0, '#ffffff', 0.2], [0.5, '#000000', 0], [1, '#3b3428', 0.32]]));
  });
}

function sand(s: Scene): Material {
  const grains = once(s, 'fin-sand', () => pattern(10, 10, specks(71, 10, 10, 38, [0.18, 0.42], [['#9b7f53', 0.7], ['#fbecc9', 0.75], ['#c7a874', 0.6], ['#7c6340', 0.45]])));
  return custom((_, a, t, band) => layers(a, t, vertical(s, 'sand', band, [[0, '#f1dcb2'], [0.4, '#dcc293'], [1, '#b0915e']]), grains));
}

function moss(s: Scene): Material {
  const clumps = once(s, 'fin-moss', () => pattern(16, 16, specks(83, 16, 16, 44, [0.5, 1.7], [['#6a8f34', 0.9], ['#88ad45', 0.8], ['#2f4a1e', 0.85], ['#a7c95a', 0.65], ['#46682a', 0.9]])));
  return custom((_, a, t, band) => layers(a, t, vertical(s, 'moss', band, [[0, '#5b7d30'], [1, '#233818']]), clumps, vertical(s, 'moss-shade', band, [[0, '#d9f99d', 0.16], [0.4, '#000000', 0], [1, '#000000', 0.4]])));
}

export const natural = group('natural', [
  { slug: 'oak', name: 'Oak', note: 'Warm, crafted, human brands', material: oak },
  { slug: 'bamboo', name: 'Bamboo', note: 'Sustainability and eco products', material: bamboo },
  { slug: 'cork', name: 'Cork', note: 'Boards, notes and pinned items', material: cork },
  { slug: 'felt', name: 'Felt', note: 'Cozy, soft and tactile apps', material: felt },
  { slug: 'linen', name: 'Linen', note: 'Writing, docs and editorial', material: linen },
  { slug: 'paper', name: 'Paper stack', note: 'Archives, print and drafts', material: paper },
  { slug: 'basketweave', name: 'Basketweave', note: 'Textiles and cozy consumer apps', material: basketweave },
  { slug: 'sand', name: 'Sand', note: 'Travel, calm and the outdoors', material: sand },
  { slug: 'moss', name: 'Moss', note: 'Growth, nature and climate', material: moss },
]);
