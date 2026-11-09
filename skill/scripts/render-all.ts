import { mkdirSync } from 'node:fs';
import { contexts, examples } from '../examples/catalog';
import { stories } from '../examples/hero';
import { page as examplePage, type Art } from '../examples/shared';
import { artScenes, links, page } from './render';

const out = process.argv[2];
if (!out) throw new Error('usage: bun scripts/render-all.ts <out dir>  (writes one HTML page per catalog example)');
mkdirSync(out, { recursive: true });
const write = async (slug: string, html: string, art: Art) => {
  await Bun.write(`${out}/${slug}.html`, html);
  await Bun.write(`${out}/${slug}.links.json`, links(artScenes(art)));
};
for (const e of examples) await write(e.slug, page(examplePage(e)), e.art);
for (const s of stories) await write(`hero-${s.slug}`, page(examplePage({ title: s.label, surface: 'light', art: s.art })), s.art);
for (const [key, art] of Object.entries(contexts)) await write(`context-${key}`, page(examplePage({ title: key, surface: 'light', art })), art);
console.log(`${examples.length + stories.length + Object.keys(contexts).length} pages in ${out}`);
