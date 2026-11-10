import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
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

const run = (check: string, what: string, cmd: string, args: string[], env: NodeJS.ProcessEnv = process.env) => {
  console.error(`${check}: installing ${what} into ${modules} (first run only)`);
  const r = spawnSync(cmd, args, { cwd: dir, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' });
  if (r.status === 0) return;
  const why = r.error?.message ?? `${r.stderr}\n${r.stdout}`.split('\n').filter(l => /error/i.test(l)).slice(0, 3).join(' | ');
  skip(check, `could not install ${what} (${why.trim() || `exit ${r.status}`}); it needs network access once`);
};

/** Installs this folder's package.json into its own node_modules on first use, with bun under Bun and npm under Node. Nothing is installed globally. */
export function packages(check: string) {
  if (['playwright', 'typescript', '@types/bun'].every(p => existsSync(join(modules, p, 'package.json')))) return;
  if (process.versions.bun) run(check, 'its packages', process.execPath, ['install']);
  else run(check, 'its packages', 'npm', ['install', '--no-audit', '--no-fund', '--no-package-lock', '--fetch-retries=0', '--loglevel=error', '--no-update-notifier']);
}

const missing = (e: unknown) => e instanceof Error && /Executable doesn't exist|distribution '[^']+' is not found/i.test(e.message);

/**
 * Launches the browser a check needs. Chromium checks use the installed Google Chrome; without it, and for WebKit,
 * Playwright's own build is downloaded into node_modules (PLAYWRIGHT_BROWSERS_PATH=0) the first time.
 */
export async function browser(engine: 'chromium' | 'webkit', check: string): Promise<Browser> {
  packages(check);
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= '0';
  const { chromium, webkit } = await import('playwright');
  const cli = join(modules, 'playwright', 'cli.js');
  if (engine === 'webkit') {
    try {
      return await webkit.launch();
    } catch (e) {
      if (!missing(e)) throw e;
      run(check, 'WebKit', process.execPath, [cli, 'install', 'webkit']);
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
    run(check, 'Chromium', process.execPath, [cli, 'install', '--only-shell', 'chromium']);
    return chromium.launch();
  }
}
