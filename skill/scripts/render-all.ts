import { mkdirSync } from 'node:fs';
import { examples } from '../examples/catalog';
import { page as examplePage } from '../examples/shared';
import { page } from './render';

const out = process.argv[2];
if (!out) throw new Error('usage: bun scripts/render-all.ts <out dir>  (writes one HTML page per catalog example)');
mkdirSync(out, { recursive: true });
for (const e of examples) await Bun.write(`${out}/${e.slug}.html`, page(examplePage(e)));
console.log(`${examples.length} pages in ${out}`);
