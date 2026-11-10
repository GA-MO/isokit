import { afterAll, expect, test } from 'bun:test';
import { spawn, spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = mkdtempSync(join(tmpdir(), 'iso-deps-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));

/** A copy of the scripts folder holding only what packages() needs, so each test installs into its own node_modules. */
const folder = (name: string) => {
  const dir = join(root, name);
  mkdirSync(dir);
  for (const f of ['deps.ts', 'package.json', 'bun.lock']) copyFileSync(join(import.meta.dirname, f), join(dir, f));
  writeFileSync(join(dir, 'run.ts'), "import { packages } from './deps.ts';\npackages('test');\nconsole.log('ready');\n");
  return dir;
};
const check = (dir: string) => spawnSync(process.execPath, [join(dir, 'run.ts')], { encoding: 'utf8', timeout: 240_000 });
const complete = (dir: string) => {
  const modules = join(dir, 'node_modules');
  expect(readFileSync(join(modules, '.iso-installed'), 'utf8')).toBe(readFileSync(join(dir, 'package.json'), 'utf8'));
  for (const f of ['playwright-core/package.json', 'typescript/lib/lib.d.ts', '@types/bun/package.json']) expect(existsSync(join(modules, f))).toBe(true);
  expect(existsSync(join(dir, '.iso-install-lock'))).toBe(false);
};
const lockAged = (dir: string, content: string, ms: number) => {
  const lock = join(dir, '.iso-install-lock');
  writeFileSync(lock, content);
  const t = (Date.now() - ms) / 1000;
  utimesSync(lock, t, t);
};

test('an install killed part way is repaired by the next check', async () => {
  const dir = folder('killed');
  const lock = join(dir, '.iso-install-lock');
  const child = spawn(process.execPath, [join(dir, 'run.ts')], { stdio: 'ignore' });
  const exited = new Promise(done => child.on('exit', done));
  while (!existsSync(lock) && child.exitCode === null) await new Promise(r => setTimeout(r, 2));
  child.kill('SIGKILL');
  await exited;
  expect(existsSync(join(dir, 'node_modules', '.iso-installed'))).toBe(false);
  const again = check(dir);
  expect(again.stdout).toContain('ready');
  expect(again.status).toBe(0);
  complete(dir);
}, 300_000);

test('a tree with a package half written and no marker is installed again', () => {
  const dir = folder('unmarked');
  expect(check(dir).status).toBe(0);
  rmSync(join(dir, 'node_modules', '.iso-installed'));
  rmSync(join(dir, 'node_modules', 'typescript', 'lib', 'lib.d.ts'));
  expect(check(dir).status).toBe(0);
  complete(dir);
}, 300_000);

test('an empty lock left by a maker that died is taken over', () => {
  const dir = folder('empty-lock');
  lockAged(dir, '', 60_000);
  const r = check(dir);
  expect(r.stderr).not.toContain('waiting');
  expect(r.status).toBe(0);
  complete(dir);
}, 300_000);

test('a lock older than any install is taken over even when its pid is alive', () => {
  const dir = folder('old-lock');
  lockAged(dir, String(process.pid), 11 * 60_000);
  const r = check(dir);
  expect(r.stderr).not.toContain('waiting');
  expect(r.status).toBe(0);
  complete(dir);
}, 300_000);

test.skipIf(process.platform === 'win32' || process.getuid?.() === 0)('a folder that cannot be written runs with the packages it has, and skips without them', () => {
  const ready = folder('read-only-ready');
  expect(check(ready).status).toBe(0);
  rmSync(join(ready, 'node_modules', '.iso-installed'));
  chmodSync(join(ready, 'node_modules'), 0o555);
  const r = check(ready);
  chmodSync(join(ready, 'node_modules'), 0o755);
  expect(r.stdout).toContain('ready');
  expect(r.status).toBe(0);

  const empty = folder('read-only-empty');
  chmodSync(empty, 0o555);
  const s = check(empty);
  chmodSync(empty, 0o755);
  expect(s.stderr).toContain('skipped: cannot write');
  expect(s.status).toBe(2);
}, 300_000);
