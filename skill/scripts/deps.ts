import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Browser } from 'playwright';

const dir = import.meta.dirname;
const modules = join(dir, 'node_modules');

/** Exit code of a check that could not run. 0 is a pass and 1 a failure, so 2 tells the caller nothing was checked. */
export const SKIPPED = 2;

export function skip(check: string, reason: string): never {
  console.error(`${check} skipped: ${reason}. Rendering with render.ts does not need it and still works. Tell the user this check did not run.`);
  process.exit(SKIPPED);
}

/** Runs an installer and returns why it failed, or nothing when it worked. Only npm needs a shell (it is npm.cmd on Windows). */
const run = (check: string, what: string, cmd: string, args: string[], shell = false) => {
  console.error(`${check}: installing ${what} into ${modules} (first run only)`);
  const r = spawnSync(cmd, args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell });
  if (r.status === 0) return undefined;
  const why = r.error?.message ?? `${r.stderr}\n${r.stdout}`.split('\n').filter(l => /error/i.test(l)).slice(0, 3).join(' | ');
  return `could not install ${what} (${why.trim() || `exit ${r.status}`}); it needs network access once`;
};

const manifest = join(dir, 'package.json');
const marker = join(modules, '.iso-installed');
const lock = join(modules, '.iso-install-lock');
const installed = () => existsSync(marker) && readFileSync(marker, 'utf8') === readFileSync(manifest, 'utf8');
const pause = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/** Holds a lock directory so two checks started together run one install; a lock older than ten minutes is from a run that died. */
const locked = (fn: () => string | undefined) => {
  mkdirSync(modules, { recursive: true });
  for (;;) {
    try {
      mkdirSync(lock);
      break;
    } catch {
      const age = Date.now() - (statSync(lock, { throwIfNoEntry: false })?.mtimeMs ?? Date.now());
      if (age > 600_000) rmSync(lock, { recursive: true, force: true });
      else pause(500);
    }
  }
  try {
    return fn();
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
};

/**
 * Installs this folder's package.json into its own node_modules, with bun under Bun and npm under Node, and never globally.
 * It runs on first use and again whenever package.json changes, since a marker holds the package.json it installed.
 */
export function packages(check: string) {
  if (installed()) return;
  const failed = locked(() => {
    if (installed()) return undefined;
    const why = process.versions.bun
      ? run(check, 'its packages', process.execPath, ['install'])
      : run(check, 'its packages', 'npm', ['install', '--include=dev', '--no-audit', '--no-fund', '--no-package-lock', '--fetch-retries=0', '--loglevel=error', '--no-update-notifier'], process.platform === 'win32');
    if (!why) writeFileSync(marker, readFileSync(manifest, 'utf8'));
    return why;
  });
  if (failed) skip(check, failed);
}

const browserInstall = (check: string, what: string, args: string[]) => {
  const why = run(check, what, process.execPath, [join(modules, 'playwright', 'cli.js'), 'install', ...args]);
  if (why) skip(check, why);
};

const missing = (e: unknown) => e instanceof Error && /Executable doesn't exist|distribution '[^']+' is not found/i.test(e.message);

/**
 * Launches the browser a check needs. Chromium checks use the installed Google Chrome; without it, and for WebKit,
 * Playwright's own build is downloaded into node_modules (PLAYWRIGHT_BROWSERS_PATH=0) the first time.
 */
export async function browser(engine: 'chromium' | 'webkit', check: string): Promise<Browser> {
  packages(check);
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= '0';
  const { chromium, webkit } = await import('playwright');
  if (engine === 'webkit') {
    try {
      return await webkit.launch();
    } catch (e) {
      if (!missing(e)) throw e;
      browserInstall(check, 'WebKit', ['webkit']);
      return webkit.launch();
    }
  }
  try {
    return await chromium.launch({ channel: 'chrome' });
  } catch (e) {
    if (!missing(e)) throw e;
  }
  try {
    return await chromium.launch();
  } catch (e) {
    if (!missing(e)) throw e;
    console.error(`${check}: Google Chrome is not installed, so it uses Playwright's Chromium`);
    browserInstall(check, 'Chromium', ['--only-shell', 'chromium']);
    return chromium.launch();
  }
}
