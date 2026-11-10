import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { packages } from './deps.ts';

const files = process.argv.slice(2).map(f => resolve(f));
if (!files.length) throw new Error('usage: node scripts/check.ts <scene.ts> [more.ts]  (strict type-check of scene files against the kit)');
const absent = files.filter(f => !existsSync(f));
if (absent.length) throw new Error(`check.ts: no file at ${absent.join(', ')}`);
const specifier = /\b(?:from|import)\s*\(?\s*(['"])((?:\.{1,2}\/|\/)[^'"]*)\1/g;
const bare = files.flatMap(f =>
  readFileSync(f, 'utf8')
    .split('\n')
    .flatMap((line, i) => [...line.matchAll(specifier)].map(m => m[2] ?? '').filter(spec => !/\.(?:[cm]?ts|[cm]?js|json)$/.test(spec)).map(spec => `${f}:${i + 1}: import '${spec}' needs its extension, as in '${spec}.ts', because Node loads a .ts file only by its full name`)),
);
if (bare.length) {
  console.error(bare.join('\n'));
  process.exit(1);
}
packages('check.ts');
const kit = resolve(import.meta.dirname, '..');
const dir = mkdtempSync(join(tmpdir(), 'iso-check-'));
const config = join(dir, 'tsconfig.json');
writeFileSync(config, JSON.stringify({ extends: join(kit, 'tsconfig.json'), compilerOptions: { typeRoots: [join(kit, 'scripts/node_modules/@types')] }, include: [], files: [...files, join(kit, 'lib/iso.ts'), join(kit, 'scripts/render.ts')] }));
const run = spawnSync(process.execPath, [join(kit, 'scripts/node_modules/typescript/bin/tsc'), '-p', config], { stdio: 'inherit' });
rmSync(dir, { recursive: true, force: true });
if (run.status === 0) console.log('types ok');
process.exit(run.status === 0 ? 0 : 1);
