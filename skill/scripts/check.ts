import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const files = process.argv.slice(2).map(f => resolve(f));
if (!files.length) throw new Error('usage: bun scripts/check.ts <scene.ts> [more.ts]  (strict type-check of scene files against the kit)');
const kit = resolve(import.meta.dir, '..');
const dir = mkdtempSync(join(tmpdir(), 'iso-check-'));
const config = join(dir, 'tsconfig.json');
writeFileSync(config, JSON.stringify({ extends: join(kit, 'tsconfig.json'), compilerOptions: { typeRoots: [join(kit, 'scripts/node_modules/@types')] }, include: [], files: [...files, join(kit, 'lib/iso.ts'), join(kit, 'scripts/render.ts')] }));
const run = Bun.spawnSync([join(kit, 'scripts/node_modules/.bin/tsc'), '-p', config], { stdout: 'inherit', stderr: 'inherit' });
rmSync(dir, { recursive: true, force: true });
if (run.exitCode === 0) console.log('types ok');
process.exit(run.exitCode ?? 1);
