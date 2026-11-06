import { mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { examples } from '../skill/examples/catalog';
import { hero } from '../skill/examples/hero';
import { galleries } from '../skill/examples/material-gallery';
import { surfaces, type Example } from '../skill/examples/shared';

const out = new URL('../docs/svg/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const kb = (n: number) => `${(n / 1024).toFixed(1)} kB`;
const write = async (file: string, svg: string) => {
  await Bun.write(out + file, svg);
  console.log(`${`docs/svg/${file}`.padEnd(36)} ${kb(svg.length).padStart(9)} raw ${kb(gzipSync(svg, { level: 9 }).length).padStart(8)} gzip`);
};
const card = (surface: Example['surface']) => ({ background: surfaces[surface].card, radius: 24 });

if (!hero.wide) throw new Error('readme-svg: the hero needs a wide scene');
await write('hero.svg', hero.wide.scene.exportSvg({ title: 'One prompt becomes a whole system', background: surfaces.dark.page, radius: 24 }));
await write('hero-phone.svg', hero.compact.scene.exportSvg({ title: 'One prompt becomes a whole system', background: surfaces.dark.page, radius: 24 }));
for (const slug of ['battery-charge', 'sync-loop', 'tile-loader', 'inbox-fill', 'alert-stack', 'keycard-slot']) {
  const e = examples.find(x => x.slug === slug);
  if (!e) throw new Error(`readme-svg: no example ${slug}`);
  await write(`${slug}.svg`, e.art.compact.scene.exportSvg({ title: e.title, ...card(e.surface) }));
}
for (const g of galleries) {
  if (!g.art.wide) throw new Error(`readme-svg: gallery ${g.slug} needs a wide scene`);
  await write(`finish-${g.slug}.svg`, g.art.wide.scene.exportSvg({ title: `${g.name} finishes`, ...card('dark') }));
}
