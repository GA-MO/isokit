import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { packages } from './deps.ts';

const files = process.argv.slice(2).map(f => resolve(f));
if (!files.length) throw new Error('usage: node scripts/check.ts <scene.ts> [more.ts]  (strict type-check of scene files against the kit)');
const absent = files.filter(f => !existsSync(f));
if (absent.length) throw new Error(`check.ts: no file at ${absent.join(', ')}`);
packages('check.ts');
const ts = (await import('typescript')).default;
const bare = files.flatMap(f => {
  const src = readFileSync(f, 'utf8');
  const lineOf = (pos: number) => src.slice(0, pos).split('\n').length;
  return ts
    .preProcessFile(src, true, true)
    .importedFiles.filter(i => /^\.{0,2}\//.test(i.fileName) && !/\.(?:[cm]?ts|[cm]?js|json)$/.test(i.fileName))
    .map(i => `${f}:${lineOf(i.pos)}: import '${i.fileName}' needs its extension, as in '${i.fileName}.ts', because Node loads a .ts file only by its full name`);
});
if (bare.length) {
  console.error(bare.join('\n'));
  process.exit(1);
}
const kit = resolve(import.meta.dirname, '..');
const dir = mkdtempSync(join(tmpdir(), 'iso-check-'));
const config = join(dir, 'tsconfig.json');
writeFileSync(config, JSON.stringify({ extends: join(kit, 'tsconfig.json'), compilerOptions: { typeRoots: [join(kit, 'scripts/node_modules/@types')] }, include: [], files: [...files, join(kit, 'lib/iso.ts'), join(kit, 'scripts/render.ts')] }));
const run = spawnSync(process.execPath, [join(kit, 'scripts/node_modules/typescript/bin/tsc'), '-p', config], { stdio: 'inherit' });
rmSync(dir, { recursive: true, force: true });
if (run.status === 0) console.log('types ok');
process.exit(run.status === 0 ? 0 : 1);
