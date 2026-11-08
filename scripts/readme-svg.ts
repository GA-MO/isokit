import { mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { examples } from '../skill/examples/catalog';
import { readme } from '../skill/examples/hero';
import { sampler } from '../skill/examples/material-gallery';
import { surfaces, type Example } from '../skill/examples/shared';

const out = new URL('../docs/svg/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const kb = (n: number) => `${(n / 1024).toFixed(1)} kB`;
const write = async (file: string, svg: string) => {
  await Bun.write(out + file, svg);
  console.log(`${`docs/svg/${file}`.padEnd(36)} ${kb(svg.length).padStart(9)} raw ${kb(gzipSync(svg, { level: 9 }).length).padStart(8)} gzip`);
};
const card = (surface: Example['surface']) => ({ background: surfaces[surface].card, radius: 24 });

const hero = { title: 'One sentence becomes an animated diagram of the system', background: surfaces.light.page, radius: 24 };
await write('hero.svg', readme.wide.exportSvg(hero));
await write('hero-phone.svg', readme.compact.exportSvg(hero));
for (const slug of ['sync-loop', 'inbox-fill', 'battery-charge']) {
  const e = examples.find(x => x.slug === slug);
  if (!e) throw new Error(`readme-svg: no example ${slug}`);
  await write(`${slug}.svg`, e.art.compact.scene.exportSvg({ title: e.title, ...card(e.surface) }));
}
await write('finish-sampler.svg', sampler().exportSvg({ title: 'Side finishes, eight of 49', ...card('night') }));
