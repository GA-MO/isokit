import { contexts, examples } from '../examples/catalog.ts';
import { stories } from '../examples/hero.ts';
import { page as examplePage, type Art } from '../examples/shared.ts';
import { artScenes, links, page, write as save } from './render.ts';

const out = process.argv[2];
if (!out) throw new Error('usage: node scripts/render-all.ts <out dir>  (writes one HTML page per catalog example)');
const write = (slug: string, html: string, art: Art) => {
  save(`${out}/${slug}.html`, html);
  save(`${out}/${slug}.links.json`, links(artScenes(art)));
};
for (const e of examples) write(e.slug, page(examplePage(e)), e.art);
for (const s of stories) write(`hero-${s.slug}`, page(examplePage({ title: s.label, surface: 'light', art: s.art })), s.art);
for (const [key, art] of Object.entries(contexts)) write(`context-${key}`, page(examplePage({ title: key, surface: 'light', art })), art);
console.log(`${examples.length + stories.length + Object.keys(contexts).length} pages in ${out}`);
