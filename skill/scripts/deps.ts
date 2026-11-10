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
const breaker = `${lock}.break`;
const stagePrefix = '.iso-install-';
const present = () => ['playwright', 'typescript', '@types/bun'].every(p => existsSync(join(modules, p, 'package.json')));
const installed = () => existsSync(marker) && readFileSync(marker, 'utf8') === readFileSync(manifest, 'utf8');
const pause = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const code = (e: unknown) => (e instanceof Error && 'code' in e ? String(e.code) : String(e));
const age = (path: string) => Date.now() - (statSync(path, { throwIfNoEntry: false })?.mtimeMs ?? Date.now());
const alive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return code(e) === 'EPERM';
  }
};
/** Longer than any install takes, so anything older belongs to a run that died, even if its pid now names another process. */
const DEAD_AFTER = 600_000;

/** Who holds the lock and when they took it, or undefined when there is no lock. pid is undefined while unwritten or unreadable. */
const holder = () => {
  const stat = statSync(lock, { throwIfNoEntry: false });
  if (!stat) return undefined;
  let pid = NaN;
  try {
    pid = Number(readFileSync(lock, 'utf8'));
  } catch {
    // unreadable counts like unwritten: stale after ten seconds
  }
  return { pid: Number.isInteger(pid) && pid > 0 ? pid : undefined, mtime: stat.mtimeMs };
};

/**
 * A lock is stale when its process is gone, when it names this process (a container that reuses pids after a killed run),
 * when it still names no process ten seconds after it was made, or after DEAD_AFTER.
 */
const stale = (h: { pid: number | undefined; mtime: number }) => {
  const old = Date.now() - h.mtime;
  return old > DEAD_AFTER || (h.pid === undefined ? old > 10_000 : h.pid === process.pid || !alive(h.pid));
};

/**
 * Removes a stale lock. Only the process that holds the breaker file may do it, and only if the lock is still the one it judged
 * stale, so two waiters can never both remove a lock and both take the next one. A breaker left by a dead process expires in ten seconds.
 */
const breakStale = (seen: { pid: number | undefined; mtime: number }) => {
  try {
    writeFileSync(breaker, String(process.pid), { flag: 'wx' });
  } catch (e) {
    if (code(e) !== 'EEXIST') throw e;
    if (age(breaker) > 10_000) rmSync(breaker, { force: true });
    return;
  }
  try {
    const now = holder();
    if (now && now.pid === seen.pid && now.mtime === seen.mtime) rmSync(lock, { force: true });
  } finally {
    rmSync(breaker, { force: true });
  }
};

/**
 * Runs fn while holding a lock file that names this process, so two checks started together run one install.
 * A stale lock is taken over; a live one is waited on for five minutes at most. Returns why it failed, or nothing.
 * A folder it cannot write is a failure only when the packages are not already there.
 */
const locked = (check: string, fn: () => string | undefined) => {
  const unwritable = (e: unknown) => (present() ? undefined : `cannot write ${dir} (${code(e)})`);
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
    if (Date.now() > until) return `another install has held ${lock} for five minutes`;
    if (stale(seen)) {
      try {
        breakStale(seen);
      } catch (e) {
        return unwritable(e);
      }
      pause(50);
      continue;
    }
    const who = seen.pid === undefined ? 'a process that is starting' : `process ${seen.pid}`;
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
 * Removes staging folders left by checks that were killed. A killed check's installer keeps running on its own, so a folder is
 * removed only once its process is gone and DEAD_AFTER has passed, when that installer has long finished.
 */
const sweep = () => {
  for (const entry of readdirSync(dir)) {
    const pid = Number(entry.startsWith(stagePrefix) ? entry.slice(stagePrefix.length) : NaN);
    if (!Number.isInteger(pid) || pid === process.pid || alive(pid) || age(join(dir, entry)) < DEAD_AFTER) continue;
    try {
      rmSync(join(dir, entry), { recursive: true, force: true });
    } catch {
      // a later check tries again
    }
  }
};

/** Renames, retrying for a second when Windows reports a folder busy (an antivirus scan of files just written). */
const move = (from: string, to: string) => {
  for (let tries = 0; ; tries++) {
    try {
      return renameSync(from, to);
    } catch (e) {
      if (tries >= 5 || !['EPERM', 'EBUSY', 'EACCES'].includes(code(e))) throw e;
      pause(200);
    }
  }
};

/**
 * Installs into a staging folder named after this process, then swaps its node_modules in by rename, so a run cut off at any
 * point leaves the old tree or the new one, never a half-written one; a failed swap puts the old tree back. Returns why it
 * failed, or nothing, and never throws.
 */
const install = (check: string) => {
  const stage = join(dir, `${stagePrefix}${process.pid}`);
  const old = join(stage, 'old');
  try {
    rmSync(stage, { recursive: true, force: true });
    mkdirSync(stage);
    for (const f of ['package.json', 'bun.lock']) if (existsSync(join(dir, f))) copyFileSync(join(dir, f), join(stage, f));
    const why = process.versions.bun
      ? run(check, 'its packages', process.execPath, ['install'], stage)
      : run(check, 'its packages', 'npm', ['install', '--include=dev', '--no-audit', '--no-fund', '--no-package-lock', '--fetch-retries=0', '--loglevel=error', '--no-update-notifier'], stage, process.platform === 'win32');
    if (why) return why;
    if (existsSync(modules)) move(modules, old);
    try {
      move(join(stage, 'node_modules'), modules);
    } catch (e) {
      if (existsSync(old)) move(old, modules);
      throw e;
    }
    writeFileSync(marker, readFileSync(manifest, 'utf8'));
    return undefined;
  } catch (e) {
    return `could not put the new packages in place (${code(e)})`;
  } finally {
    try {
      rmSync(stage, { recursive: true, force: true, maxRetries: 3 });
    } catch {
      // sweep() removes it on a later check
    }
  }
};

/**
 * Installs this folder's package.json into its own node_modules, with bun under Bun and npm under Node, and never globally.
 * It runs on first use, again whenever package.json changes, and again after an install that was cut off, because the marker
 * holding the package.json it installed is written only by a finished install (this one, or the postinstall of a manual one).
 */
export function packages(check: string) {
  sweep();
  if (installed()) return;
  const failed = locked(check, () => {
    if (installed()) return undefined;
    try {
      if (existsSync(modules)) accessSync(modules, constants.W_OK);
    } catch (e) {
      return present() ? undefined : `cannot write ${modules} (${code(e)})`;
    }
    return install(check);
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
