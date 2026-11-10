import { readFileSync, writeFileSync } from 'node:fs';

const out = new URL('../skill/lib/runtime.min.js', import.meta.url).pathname;
const build = await Bun.build({ entrypoints: [new URL('../skill/lib/entry.ts', import.meta.url).pathname], minify: true, target: 'browser' });
const [artifact] = build.outputs;
if (!build.success || !artifact) throw new Error(`runtime build failed\n${build.logs.join('\n')}`);
const js = await artifact.text();

if (process.argv.includes('--check')) {
  if (readFileSync(out, 'utf8') !== js) {
    console.error('skill/lib/runtime.min.js is not the build of skill/lib/entry.ts. Run `bun run build:runtime` and commit it.');
    process.exit(1);
  }
  console.log('runtime.min.js is current');
} else {
  writeFileSync(out, js);
  console.log(`skill/lib/runtime.min.js ${js.length} bytes`);
}
