import { spawnSync } from 'node:child_process';
import { accessSync, constants, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
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
const run = (check: string, what: string, cmd: string, args: string[], cwd = dir, shell = false) => {
  console.error(`${check}: installing ${what} into ${modules} (first run only)`);
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell });
  if (r.status === 0) return undefined;
  const why = r.error?.message ?? `${r.stderr}\n${r.stdout}`.split('\n').filter(l => /error/i.test(l)).slice(0, 3).join(' | ');
  return `could not install ${what} (${why.trim() || `exit ${r.status}`}); it needs network access once`;
};

const manifest = join(dir, 'package.json');
const marker = join(modules, '.iso-installed');
const lock = join(dir, '.iso-install-lock');
const stagePrefix = '.iso-install-';
const present = () => ['playwright', 'typescript', '@types/bun'].every(p => existsSync(join(modules, p, 'package.json')));
const installed = () => existsSync(marker) && readFileSync(marker, 'utf8') === readFileSync(manifest, 'utf8');
const pause = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const code = (e: unknown) => (e instanceof Error && 'code' in e ? String(e.code) : String(e));
const alive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return code(e) === 'EPERM';
  }
};

/** Who holds the lock and when they took it; pid is undefined while the holder has not written it yet. */
const holder = () => {
  try {
    const pid = Number(readFileSync(lock, 'utf8'));
    return { pid: Number.isInteger(pid) && pid > 0 ? pid : undefined, mtime: statSync(lock).mtimeMs };
  } catch {
    return undefined;
  }
};

/**
 * A lock is stale when its process is gone, when it is still empty ten seconds after it was made (its maker died or ran out of disk
 * between creating and writing it), or when it is older than any install takes, which also covers a pid reused after a reboot.
 */
const stale = (h: { pid: number | undefined; mtime: number }) => {
  const age = Date.now() - h.mtime;
  return age > 600_000 || (h.pid === undefined ? age > 10_000 : !alive(h.pid));
};

/**
 * Runs fn while holding a lock file that names this process, so two checks started together run one install.
 * A stale lock is taken over; a live one is waited on for five minutes at most.
 * Returns why it failed, or nothing. A folder it cannot write is a failure only when the packages are not already there.
 */
const locked = (check: string, fn: () => string | undefined) => {
  const unwritable = (e: unknown) => (present() ? undefined : `cannot write ${modules} (${code(e)})`);
  const until = Date.now() + 300_000;
  let told = false;
  for (;;) {
    try {
      writeFileSync(lock, String(process.pid), { flag: 'wx' });
      break;
    } catch (e) {
      if (code(e) !== 'EEXIST') return unwritable(e);
    }
    const seen = holder();
    if (!seen) continue;
    if (stale(seen)) {
      const now = holder();
      try {
        if (now && now.pid === seen.pid && now.mtime === seen.mtime) rmSync(lock, { force: true });
      } catch (e) {
        return unwritable(e);
      }
      continue;
    }
    const who = seen.pid === undefined ? 'a process that is starting' : `process ${seen.pid}`;
    if (Date.now() > until) return `another install (${who}) has held ${lock} for five minutes`;
    if (!told) console.error(`${check}: waiting for another install to finish (${who})`);
    told = true;
    pause(500);
  }
  try {
    return fn();
  } finally {
    if (holder()?.pid === process.pid) rmSync(lock, { force: true });
  }
};

/**
 * Installs into a staging folder named after this process, then renames its node_modules into place, so node_modules is
 * either the old tree or a whole new one. An install that was cut off leaves only its staging folder, which a later run
 * removes; its installer may still be writing there, so it never shares a folder with the next one.
 */
const install = (check: string) => {
  if (existsSync(modules)) accessSync(modules, constants.W_OK);
  for (const entry of readdirSync(dir)) {
    const pid = Number(entry.startsWith(stagePrefix) ? entry.slice(stagePrefix.length) : NaN);
    if (!Number.isInteger(pid) || pid === process.pid || alive(pid)) continue;
    try {
      rmSync(join(dir, entry), { recursive: true, force: true });
    } catch {
      // its installer is still writing; a later run removes it
    }
  }
  const stage = join(dir, `${stagePrefix}${process.pid}`);
  rmSync(stage, { recursive: true, force: true });
  mkdirSync(stage);
  for (const f of ['package.json', 'bun.lock']) if (existsSync(join(dir, f))) copyFileSync(join(dir, f), join(stage, f));
  try {
    const why = process.versions.bun
      ? run(check, 'its packages', process.execPath, ['install'], stage)
      : run(check, 'its packages', 'npm', ['install', '--include=dev', '--no-audit', '--no-fund', '--no-package-lock', '--fetch-retries=0', '--loglevel=error', '--no-update-notifier'], stage, process.platform === 'win32');
    if (why) return why;
    rmSync(modules, { recursive: true, force: true });
    renameSync(join(stage, 'node_modules'), modules);
    writeFileSync(marker, readFileSync(manifest, 'utf8'));
    return undefined;
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
};

/**
 * Installs this folder's package.json into its own node_modules, with bun under Bun and npm under Node, and never globally.
 * It runs on first use, again whenever package.json changes, and again after an install that was cut off, since only a
 * finished install writes the marker that holds the package.json it installed.
 */
export function packages(check: string) {
  if (installed()) return;
  const failed = locked(check, () => {
    if (installed()) return undefined;
    try {
      return install(check);
    } catch (e) {
      return present() ? undefined : `cannot write ${modules} (${code(e)})`;
    }
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
