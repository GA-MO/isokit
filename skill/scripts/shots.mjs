import { chromium, webkit } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map(a => a.split('=')));
const file = args.page;
if (!file) throw new Error('usage: node shots.mjs page=<file.html> [times=0,1,2] [widths=393,768,1280] [engine=chromium|webkit] [out=dir] [selector=body] [scene=<name>: seek and shoot only that scene] [loop=1: times are inside the loop, after the intro of the visible scene]');
const times = (args.times ?? '0,1,2,4').split(',').map(Number);
const widths = (args.widths ?? '393,768,1280').split(',').map(Number);
const out = args.out ?? 'shots';
const scene = args.scene;
const selector = args.selector ?? (scene ? `[data-iso="${scene}"]` : 'body');
mkdirSync(out, { recursive: true });
const browser = await (args.engine === 'webkit' ? webkit : chromium).launch(args.engine === 'webkit' ? {} : { channel: 'chrome' });
const sheet = [];
for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.goto(pathToFileURL(resolve(file)).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => typeof window.isoSeek === 'function');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  const info = await page.evaluate(() => window.isoInfo?.() ?? []);
  const shown = info.filter(i => i.visible && (!scene || i.name === scene));
  if (scene && !shown.length) {
    console.log(`w=${w} skipped: scene ${scene} is hidden at this width (visible here: ${info.filter(i => i.visible).map(i => i.name).join(', ')})`);
    await page.close();
    continue;
  }
  console.log(`w=${w} scenes: ${shown.map(i => `${i.name} intro ${i.intro.toFixed(2)}s loop ${i.loop}s still ${i.still}s`).join(', ')}`);
  const intro = args.loop === '1' ? Math.max(0, ...shown.map(i => i.intro)) : 0;
  for (const t of times) {
    await page.evaluate(([s, name]) => (name ? document.querySelector(`[data-iso="${name}"]`)?.iso?.seek(s) : window.isoSeek(s)), [t + intro, scene]);
    await page.waitForTimeout(40);
    const path = `${out}/w${w}-t${t.toFixed(2).replace('.', '_')}.png`;
    await page.locator(selector).first().screenshot({ path });
    sheet.push({ w, t, path });
  }
  console.log(`w=${w} horizontal overflow ${overflow}px, errors: ${errors.length ? errors.join(' | ') : 'none'}`);
  await page.close();
}
if (!sheet.length) throw new Error(`nothing shot: ${scene ? `scene ${scene} is hidden at every width` : 'no widths'}`);
const html = `<body style="margin:0;background:#888;font:12px monospace">${widths.map(w => `<div style="display:flex;gap:4px;align-items:flex-start;margin:4px">${sheet.filter(s => s.w === w).map(s => `<figure style="margin:0;background:#fff;position:relative"><img src="data:image/png;base64,${readFileSync(s.path).toString('base64')}" style="display:block;width:${Math.min(w, 1280) / (w > 700 ? 3 : 1.6)}px"><figcaption style="position:absolute;top:0;left:0;background:#000;color:#fff;padding:0 4px">${s.w}px ${s.t}s</figcaption></figure>`).join('')}</div>`).join('')}</body>`;
const p = await browser.newPage({ viewport: { width: 1400, height: 600 } });
await p.setContent(html);
await p.waitForLoadState('load');
await p.screenshot({ path: `${out}/sheet.png`, fullPage: true });
await browser.close();
console.log(`${out}/sheet.png`);
