import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve, basename } from 'node:path';

const args = process.argv.slice(2);
const opts = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split('=')));
const files = args.filter(a => !a.includes('='));
if (!files.length) throw new Error('usage: node contrast.mjs <page.html ...> [widths=393,1280] [min=4.5] [moments=5]  (pages from render.ts or render-all.ts)');
const widths = (opts.widths ?? '393,1280').split(',').map(Number);
const min = Number(opts.min ?? 4.5);
const moments = Number(opts.moments ?? 5);

const lum = c => 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]);
const ch = v => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

const browser = await chromium.launch({ channel: 'chrome' });
let failures = 0;
let checked = 0;
for (const file of files) {
  for (const w of widths) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 });
    await page.goto(pathToFileURL(resolve(file)).href);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => typeof window.isoSeek === 'function');
    const spec = await page.evaluate(() => {
      const root = [...document.querySelectorAll('.iso')].find(r => r.offsetParent !== null);
      return root ? { name: root.dataset.iso, intro: root.iso.spec.intro, loop: root.iso.spec.loop, still: root.iso.spec.still } : null;
    });
    if (!spec) throw new Error(`contrast: ${file} has no visible scene at ${w}px`);
    const times = [spec.intro + spec.still, ...Array.from({ length: moments - 1 }, (_, i) => spec.intro + (spec.loop * (i + 1)) / moments)];
    const best = new Map();
    for (const t of times) {
      await page.evaluate(s => window.isoSeek(s), t);
      await page.waitForTimeout(50);
      const items = await page.evaluate(name => {
        const root = document.querySelector(`[data-iso="${name}"]`);
        const alpha = el => {
          let a = 1;
          for (let e = el; e && e !== root.parentElement; e = e.parentElement) a *= Number(getComputedStyle(e).opacity);
          return a;
        };
        const groups = [...root.querySelectorAll('svg g[id]')];
        const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const fadingOver = el => {
          const r = el.getBoundingClientRect();
          return groups.some(g => !g.contains(el) && el.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING && alpha(g) > 0.01 && alpha(g) < 0.99 && hit(r, g.getBoundingClientRect()));
        };
        const svgBox = root.getBoundingClientRect();
        const out = [];
        root.querySelectorAll('svg text').forEach(el => {
          const g = el.closest('g[id]');
          out.push({ key: g?.id ?? el.textContent, text: el.textContent, color: getComputedStyle(el).fill, alpha: alpha(el), fading: fadingOver(el), box: el.getBoundingClientRect().toJSON() });
        });
        root.querySelectorAll('.iso-label, .iso-label *').forEach((el, i) => {
          const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').trim();
          if (!own) return;
          const label = el.closest('.iso-label');
          const range = document.createRange();
          range.selectNodeContents(el);
          out.push({ key: `${label.id}:${i}`, text: own, color: getComputedStyle(el).color, alpha: alpha(el), fading: false, box: range.getBoundingClientRect().toJSON() });
        });
        return { items: out.filter(o => o.box.width > 0 && o.box.right > svgBox.left && o.box.left < svgBox.right), frame: { x: svgBox.x + scrollX, y: svgBox.y + scrollY, width: svgBox.width, height: svgBox.height } };
      }, spec.name);
      const clip = { x: Math.floor(items.frame.x), y: Math.floor(items.frame.y), width: Math.ceil(items.frame.width), height: Math.ceil(items.frame.height) };
      const shown = await page.screenshot({ clip, fullPage: true });
      await page.addStyleTag({ content: '.iso svg text{visibility:hidden!important}.iso-label,.iso-label *{color:transparent!important}', }).then(h => page.evaluate(el => el.setAttribute('data-contrast', ''), h));
      const hidden = await page.screenshot({ clip, fullPage: true });
      await page.evaluate(() => document.querySelector('style[data-contrast]')?.remove());
      const results = await page.evaluate(
        async ([a, b, list, origin]) => {
          const load = async s => {
            const img = new Image();
            img.src = 'data:image/png;base64,' + s;
            await img.decode();
            const c = new OffscreenCanvas(img.width, img.height);
            const x = c.getContext('2d');
            x.drawImage(img, 0, 0);
            return { w: img.width, h: img.height, d: x.getImageData(0, 0, img.width, img.height).data };
          };
          const [p, q] = [await load(a), await load(b)];
          const k = p.w / origin.width;
          return list.map(it => {
            const fg = (it.color.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
            const dist = (d, i) => Math.abs(d[i] - fg[0]) + Math.abs(d[i + 1] - fg[1]) + Math.abs(d[i + 2] - fg[2]);
            const x0 = Math.max(0, Math.floor((it.box.x + scrollX - origin.x) * k)), y0 = Math.max(0, Math.floor((it.box.y + scrollY - origin.y) * k));
            const x1 = Math.min(p.w, Math.ceil((it.box.right + scrollX - origin.x) * k)), y1 = Math.min(p.h, Math.ceil((it.box.bottom + scrollY - origin.y) * k));
            const bg = [];
            for (let y = y0; y < y1; y++)
              for (let x = x0; x < x1; x++) {
                const i = (y * p.w + x) * 4;
                if (Math.abs(p.d[i] - q.d[i]) + Math.abs(p.d[i + 1] - q.d[i + 1]) + Math.abs(p.d[i + 2] - q.d[i + 2]) > 60 && dist(p.d, i) < dist(q.d, i) - 30) bg.push([q.d[i], q.d[i + 1], q.d[i + 2]]);
              }
            return { bg, area: Math.max(1, (x1 - x0) * (y1 - y0)) };
          });
        },
        [shown.toString('base64'), hidden.toString('base64'), items.items, items.frame],
      );
      items.items.forEach((it, i) => {
        if (it.alpha < 0.99 || it.fading) return;
        const { bg, area } = results[i];
        if (!bg.length) return;
        const fg = it.color.match(/[\d.]+/g).slice(0, 3).map(Number);
        const sorted = bg.map(c => ({ c, r: ratio(fg, c) })).sort((x, y) => x.r - y.r);
        const low = sorted[Math.floor(sorted.length * 0.1)];
        const density = bg.length / area;
        const prev = best.get(it.key);
        const sample = { text: it.text, fg, low, density, t: t - spec.intro };
        best.set(it.key, [...(prev ?? []), sample]);
      });
    }
    for (const [key, samples] of best) {
      const full = Math.max(...samples.map(s => s.density));
      const worst = samples.filter(s => s.density >= full * 0.85).reduce((a, s) => (s.low.r < a.low.r ? s : a));
      checked++;
      if (worst.low.r < min) {
        failures++;
        console.log(`FAIL ${basename(file)} ${spec.name} ${key.replace(/^[^_]*_/, '')} "${worst.text}": ${hex(worst.fg)} on ${hex(worst.low.c)} is ${worst.low.r.toFixed(2)}:1 at loop ${worst.t.toFixed(2)} s`);
      }
    }
    await page.close();
  }
}
await browser.close();
console.log(`${checked} texts checked in ${files.length} pages at ${widths.join(', ')} px; ${failures ? `${failures} below ${min}:1` : `all at least ${min}:1`}`);
process.exit(failures ? 1 : 0);
