import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isoCss, type Scene } from '../lib/iso.ts';
import type { Art } from '../examples/shared.ts';

export interface Page {
  title: string;
  lang?: string;
  background?: string;
  ink?: string;
  fonts?: string[];
  css?: string;
  body: string;
}

const runtimeJs = readFileSync(new URL('../lib/runtime.min.js', import.meta.url), 'utf8');

export const links = (scenes: readonly Scene[]) => JSON.stringify(Object.fromEntries(scenes.map(sc => [sc.name, sc.links()])));
export const artScenes = (art: Art) => [art.compact.scene, ...(art.wide ? [art.wide.scene] : [])];

export function page(p: Page): string {
  const fonts = p.fonts?.length ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${p.fonts.map(f => `family=${f}`).join('&')}&display=swap">` : '';
  return `<!doctype html><html lang="${p.lang ?? 'th'}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${p.title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>${fonts}<style>body{margin:0;background:${p.background ?? '#fff'};color:${p.ink ?? '#0f172a'}}${isoCss}${p.css ?? ''}</style><body>${p.body}<script type="module">${runtimeJs}</script></body></html>`;
}

export const write = (file: string, text: string) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
};

const isPage = (v: unknown): v is Page => typeof v === 'object' && v !== null && 'title' in v && typeof v.title === 'string' && 'body' in v && typeof v.body === 'string';

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const usage = 'usage: node scripts/render.ts <scene-module.ts> <out.html>  (the module default-exports a Page)';
  const [entry, out, ...rest] = process.argv.slice(2);
  if (!entry || !out || rest.length) throw new Error(usage);
  if (!out.endsWith('.html')) throw new Error(`render.ts: ${out} must end in .html, because the wire list is written beside it as .links.json\n${usage}`);
  if (!existsSync(entry)) throw new Error(`render.ts: no file at ${resolve(entry)}`);
  const mod: { default?: unknown; example?: { art: Art }; scenes?: readonly Scene[] } = await import(pathToFileURL(resolve(entry)).href);
  if (!isPage(mod.default)) throw new Error(`render.ts: ${entry} must default-export a Page ({ title, body, ... }), for example \`export default page(example)\``);
  write(out, page(mod.default));
  const scenes = mod.scenes ?? (mod.example ? artScenes(mod.example.art) : []);
  if (scenes.length) write(out.replace(/\.html$/, '.links.json'), links(scenes));
  else console.warn(`${entry} exports no scenes, so order.mjs cannot check its wires; add export const scenes = [compact, wide]`);
  console.log(out);
}
