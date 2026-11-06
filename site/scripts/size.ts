import { gzipSync } from 'node:zlib';
import { existsSync } from 'node:fs';
import { Glob } from 'bun';

const dist = new URL('../dist/', import.meta.url).pathname;
if (!existsSync(`${dist}index.html`)) throw new Error('size: no build output in site/dist; run `bun run build` first');
const kb = (n: number) => `${(n / 1024).toFixed(1)} kB`;
const row = (name: string, raw: number, gzip: number) => console.log(`${name.padEnd(40)} ${kb(raw).padStart(10)} raw ${kb(gzip).padStart(9)} gzip`);
const measure = async (name: string) => {
  const bytes = await Bun.file(dist + name).bytes();
  return { name, raw: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length };
};

const index = await measure('index.html');
const html = await Bun.file(`${dist}index.html`).text();
row('index.html', index.raw, index.gzip);
for await (const name of new Glob('_astro/*.{js,css}').scan(dist)) {
  const f = await measure(name);
  row(f.name.replace(/\.[\w-]+\.(js|css)$/, '.$1'), f.raw, f.gzip);
}
const inline = [...html.matchAll(/<script type="module"[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1] ?? '').join('');
row('inline JS (module scripts in index.html)', Buffer.byteLength(inline), gzipSync(Buffer.from(inline), { level: 9 }).length);

const scenes = await Promise.all([...new Glob('scenes/*.html').scanSync(dist)].map(measure));
if (!scenes.length) throw new Error('size: no scene files in site/dist/scenes; the lazy scenes were not built');
const total = scenes.reduce((a, f) => ({ raw: a.raw + f.raw, gzip: a.gzip + f.gzip }), { raw: 0, gzip: 0 });
const largest = scenes.reduce((a, f) => (f.gzip > a.gzip ? f : a));
row(`scene files, all ${scenes.length} (fetched near the screen)`, total.raw, total.gzip);
row(`largest scene file (${largest.name.replace('scenes/', '')})`, largest.raw, largest.gzip);
console.log(`${'scenes inline in index.html'.padEnd(40)} ${String((html.match(/class="iso" data-iso=/g) ?? []).length).padStart(10)}`);
console.log(`${'scene boxes mounted on demand'.padEnd(40)} ${String((html.match(/data-art /g) ?? []).length).padStart(10)}`);
