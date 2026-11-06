import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { isoCss } from '../lib/iso';

export interface Page {
  title: string;
  lang?: string;
  background?: string;
  ink?: string;
  fonts?: string[];
  css?: string;
  body: string;
}

const runtime = await Bun.build({ entrypoints: [new URL('../lib/entry.ts', import.meta.url).pathname], minify: true, target: 'browser' });
const [artifact] = runtime.outputs;
if (!runtime.success || !artifact) throw new Error(`iso: runtime build failed\n${runtime.logs.join('\n')}`);
const runtimeJs = await artifact.text();

export function page(p: Page): string {
  const fonts = p.fonts?.length ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${p.fonts.map(f => `family=${f}`).join('&')}&display=swap">` : '';
  return `<!doctype html><html lang="${p.lang ?? 'th'}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${p.title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>${fonts}<style>body{margin:0;background:${p.background ?? '#fff'};color:${p.ink ?? '#0f172a'}}${isoCss}${p.css ?? ''}</style><body>${p.body}<script type="module">${runtimeJs}</script></body></html>`;
}

if (import.meta.main) {
  const [entry, out] = process.argv.slice(2);
  if (!entry || !out) throw new Error('usage: bun scripts/render.ts <scene-module.ts> <out.html>  (the module default-exports a Page)');
  const mod: { default: Page } = await import(pathToFileURL(resolve(entry)).href);
  await Bun.write(out, page(mod.default));
  console.log(out);
}
