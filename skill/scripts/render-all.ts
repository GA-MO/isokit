import { mkdirSync } from 'node:fs';
import { examples } from '../examples/catalog';
import { stories } from '../examples/hero';
import { page as examplePage } from '../examples/shared';
import { page } from './render';

const out = process.argv[2];
if (!out) throw new Error('usage: bun scripts/render-all.ts <out dir>  (writes one HTML page per catalog example)');
mkdirSync(out, { recursive: true });
for (const e of examples) await Bun.write(`${out}/${e.slug}.html`, page(examplePage(e)));
for (const s of stories) await Bun.write(`${out}/hero-${s.slug}.html`, page(examplePage({ title: s.label, surface: 'light', art: s.art })));
console.log(`${examples.length + stories.length} pages in ${out}`);
