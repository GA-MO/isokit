import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map(a => a.split('=')));
const target = args.page;
if (!target) throw new Error('usage: node perf.mjs page=<file.html | http(s)://url> [width=393] [throttle=4] [seconds=20] [selector=.iso] [scroll=0]');
const width = Number(args.width ?? 393);
const throttle = Number(args.throttle ?? 4);
const seconds = Number(args.seconds ?? 20);
const selector = args.selector ?? '.iso';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const cdp = await page.context().newCDPSession(page);
await cdp.send('Performance.enable');
await page.goto(/^https?:/.test(target) ? target : pathToFileURL(resolve(target)).href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.locator(selector).first().scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
const metric = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
const before = await metric();
const frames = await page.evaluate(
  ({ ms }) =>
    new Promise(done => {
      const deltas = [];
      const longTasks = [];
      new PerformanceObserver(list => list.getEntries().forEach(e => longTasks.push(e.duration))).observe({ type: 'longtask', buffered: false });
      let last = performance.now();
      const end = last + ms;
      const tick = now => {
        deltas.push(now - last);
        last = now;
        if (now < end) requestAnimationFrame(tick);
        else done({ deltas, longTasks });
      };
      requestAnimationFrame(tick);
    }),
  { ms: seconds * 1000 },
);
const after = await metric();
const wall = seconds;
const busy = (after.TaskDuration - before.TaskDuration) / wall;
const sorted = [...frames.deltas].sort((a, b) => a - b);
const q = p => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
const fps = frames.deltas.length / wall;
const over = limit => frames.deltas.filter(d => d > limit).length;
console.log(`page ${target} at ${width}px, CPU throttle ${throttle}x, ${seconds}s`);
console.log(`frames ${frames.deltas.length} (${fps.toFixed(1)} fps), frame time p50 ${q(0.5).toFixed(1)} ms, p95 ${q(0.95).toFixed(1)} ms, p99 ${q(0.99).toFixed(1)} ms, max ${sorted[sorted.length - 1].toFixed(1)} ms`);
console.log(`late frames (over 20 ms) ${over(20)} (${((100 * over(20)) / frames.deltas.length).toFixed(1)} %), dropped two or more (over 33.4 ms) ${over(33.4)}`);
console.log(`main thread busy ${(100 * busy).toFixed(1)} % (TaskDuration ${(after.TaskDuration - before.TaskDuration).toFixed(2)} s of ${wall} s), script ${(after.ScriptDuration - before.ScriptDuration).toFixed(2)} s, layout ${(after.LayoutDuration - before.LayoutDuration).toFixed(2)} s, style ${(after.RecalcStyleDuration - before.RecalcStyleDuration).toFixed(2)} s`);
console.log(`long tasks ${frames.longTasks.length}, longest ${frames.longTasks.length ? Math.max(...frames.longTasks).toFixed(0) : 0} ms`);
await browser.close();
