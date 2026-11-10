import { browser as open } from './deps.ts';

const args = Object.fromEntries(process.argv.slice(2).map(a => [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)]));
if (!args.page) throw new Error('usage: node page-idle.mjs page=<http(s) url of a page with many scenes> [width=1280] [dpr=2] [throttle=1,4] [at=0,0.2,0.35,0.5,0.6,0.8] [seconds=4] [scroll=<CPU throttle for a 5 s scroll, e.g. 4>]');
const width = Number(args.width ?? 1280);
const dpr = Number(args.dpr ?? 2);
const throttles = (args.throttle ?? '1,4').split(',').map(Number);
const stops = (args.at ?? '0,0.2,0.35,0.5,0.6,0.8').split(',').map(Number);
const seconds = Number(args.seconds ?? 4);
const mobile = width < 600;
const browser = await open('chromium', 'page-idle.mjs');
const page = await browser.newPage({ viewport: { width, height: mobile ? 852 : 800 }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
const cdp = await page.context().newCDPSession(page);
await cdp.send('Performance.enable');
await page.goto(args.page, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => {
  window.__shift = 0;
  new PerformanceObserver(l => l.getEntries().forEach(e => !e.hadRecentInput && (window.__shift += e.value))).observe({ type: 'layout-shift', buffered: true });
});
const pass = await page.evaluate(async () => {
  const heights = new Set();
  for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
    scrollTo({ top: y, behavior: 'instant' });
    await new Promise(r => setTimeout(r, 120));
    heights.add(document.documentElement.scrollHeight);
  }
  await new Promise(r => setTimeout(r, 1500));
  return { heights: [...heights], scenes: document.querySelectorAll('.iso').length, animations: document.getAnimations().length };
});
console.log(`${args.page} at ${width}px DPR ${dpr}: scrolled through once, ${pass.scenes} scenes mounted, ${pass.animations} animations alive, page height ${pass.heights.join(' then ')} px`);
const metric = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
const rows = [];
for (const rate of throttles) {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  for (const at of stops) {
    await page.evaluate(at => scrollTo({ top: at * (document.documentElement.scrollHeight - innerHeight), behavior: 'instant' }), at);
    await page.waitForTimeout(1500);
    const a = await metric();
    await page.waitForTimeout(seconds * 1000);
    const b = await metric();
    const live = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length);
    rows.push({ throttle: `${rate}x`, at: `${Math.round(at * 100)} %`, 'main thread busy': `${((100 * (b.TaskDuration - a.TaskDuration)) / (b.Timestamp - a.Timestamp)).toFixed(1)} %`, 'running animations': live });
  }
}
console.table(rows);
if (args.scroll) {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(args.scroll) });
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(1000);
  const deltas = await page.evaluate(
    () =>
      new Promise(done => {
        const out = [];
        const max = document.documentElement.scrollHeight - innerHeight;
        const t0 = performance.now();
        let last = t0;
        const tick = now => {
          out.push(now - last);
          last = now;
          scrollTo({ top: Math.min(max, ((now - t0) * max) / 5000), behavior: 'instant' });
          if (now - t0 < 5000) requestAnimationFrame(tick);
          else done(out);
        };
        requestAnimationFrame(tick);
      }),
  );
  const sorted = [...deltas].sort((x, y) => x - y);
  console.log(`scroll top to bottom in 5 s at CPU ${args.scroll}x: ${deltas.length} frames, over 20 ms ${deltas.filter(d => d > 20).length}, over 33.4 ms ${deltas.filter(d => d > 33.4).length}, p95 ${sorted[Math.floor(sorted.length * 0.95)].toFixed(1)} ms`);
}
console.log(`layout shift over the whole run ${(await page.evaluate(() => window.__shift)).toFixed(4)}`);
await browser.close();
