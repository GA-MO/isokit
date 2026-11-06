import { gzipSync } from 'node:zlib';
import { existsSync } from 'node:fs';
import { Glob } from 'bun';

const dist = new URL('../dist/', import.meta.url).pathname;
if (!existsSync(dist)) throw new Error('size: no build output in site/dist; run `bun run build` first');
const kb = (n: number) => `${(n / 1024).toFixed(1)} kB`;
let html = '';
const files: { name: string; raw: number; gzip: number }[] = [];
for await (const name of new Glob('**/*.{html,js,css}').scan(dist)) {
  const bytes = await Bun.file(dist + name).bytes();
  files.push({ name, raw: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length });
  if (name.endsWith('.html')) html += new TextDecoder().decode(bytes);
}
if (!files.length) throw new Error('size: no build output in site/dist; run `bun run build` first');
const js = [...html.matchAll(/<script type="module"[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1] ?? '').join('');
for (const f of files.sort((a, b) => b.raw - a.raw)) console.log(`${f.name.padEnd(34)} ${kb(f.raw).padStart(10)} raw ${kb(f.gzip).padStart(9)} gzip`);
console.log(`${'inline JS (all module scripts)'.padEnd(34)} ${kb(Buffer.byteLength(js)).padStart(10)} raw ${kb(gzipSync(Buffer.from(js), { level: 9 }).length).padStart(9)} gzip`);
console.log(`${'scenes on the page'.padEnd(34)} ${String((html.match(/class="iso" data-iso=/g) ?? []).length).padStart(10)}`);
