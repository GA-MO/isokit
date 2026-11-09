import { chromium, webkit } from 'playwright';
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve, basename } from 'node:path';

const args = process.argv.slice(2);
const opts = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split('=')));
const files = args.filter(a => !a.includes('='));
if (!files.length) throw new Error('usage: node order.mjs <page.html ...> [widths=393,1280] [step=0.05] [browser=chrome|webkit] [table=1]  (pages and their .links.json from render.ts or render-all.ts)');
const widths = (opts.widths ?? '393,1280').split(',').map(Number);
const step = Number(opts.step ?? 0.05);
const browser = opts.browser === 'webkit' ? await webkit.launch() : await chromium.launch({ channel: 'chrome' });

let bad = 0;
let loose = 0;
let frames = 0;
const table = [];
for (const file of files) {
  const sidecar = file.replace(/\.html$/, '.links.json');
  if (!existsSync(sidecar)) throw new Error(`order: ${file} has no ${basename(sidecar)}; render it with render.ts or render-all.ts`);
  const links = JSON.parse(readFileSync(sidecar, 'utf8'));
  for (const w of widths) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto(pathToFileURL(resolve(file)).href);
    await page.waitForFunction(() => typeof window.isoSeek === 'function');
    const results = await page.evaluate(
      ([links, step]) => [...document.querySelectorAll('.iso')].filter(r => r.offsetParent !== null).map(root => {
        const name = root.dataset.iso;
        const own = links[name];
        if (!own) return { name, error: `no links for scene ${name}; export it in the module's scenes so render.ts lists it` };
        const { intro, loop } = root.iso.spec;
        const units = root.querySelector('svg').viewBox.baseVal.width / root.clientWidth;
        const el = id => root.querySelector(`#${CSS.escape(`${name}_${id}`)}`);
        const nums = v => (v === 'none' ? [] : v.split(/[\s,]+/).map(parseFloat));
        const pose = e => {
          let alpha = 1;
          let [dx, dy] = [0, 0];
          let scale = 0;
          for (let n = e; n && n !== root.parentElement; n = n.parentElement) {
            const cs = getComputedStyle(n);
            alpha *= Number(cs.opacity);
            const k = n instanceof SVGElement ? 1 : units;
            const [x = 0, y = 0] = nums(cs.translate);
            dx += x * k;
            dy += y * k;
            for (const s of nums(cs.scale)) scale = Math.max(scale, Math.abs(s - 1));
            if (cs.display === 'none' || cs.visibility === 'hidden') alpha = 0;
          }
          return { alpha, shift: Math.hypot(dx, dy), scale };
        };
        const off = (e, seen) => {
          if (!e) return 'missing';
          const p = pose(e);
          return p.alpha < Math.min(0.99, seen - 0.05) ? `opacity ${p.alpha.toFixed(2)}` : p.shift > 8 ? `moved ${p.shift.toFixed(0)} px` : p.scale > 0.2 ? `scaled by ${p.scale.toFixed(2)}` : '';
        };
        const drawn = path => {
          const draw = path.getAttribute('mask') ? root.querySelector(`${path.getAttribute('mask').slice(4, -1)} path`) ?? path : path;
          const cs = getComputedStyle(draw);
          const dash = nums(cs.strokeDasharray);
          if (dash.length !== 2 || dash[0] !== 1 || dash[1] !== 2 || draw.getAttribute('pathLength') !== '1') return { some: true, full: true };
          const o = parseFloat(cs.strokeDashoffset);
          return { some: Math.abs(o) < 0.999, full: Math.abs(o) < 0.002 };
        };
        const lit = g => {
          const path = g.querySelector('path:last-of-type') ?? g;
          const cs = getComputedStyle(path);
          const [len = 1] = nums(cs.strokeDasharray);
          const o = parseFloat(cs.strokeDashoffset);
          return o < len - 0.001 && o > -0.999;
        };
        const checks = own.flatMap(l => {
          const wire = el(l.wire);
          const ends = l.ends.map(alts => alts.map(el));
          return [{ l, wire, ends, pulses: l.pulses.map(p => ({ id: p, node: el(p) })) }];
        });
        const out = { name, frames: 0, bad: 0, first: [], unjoined: own.filter(l => !l.ends.length).map(l => l.wire), loose: own.filter(l => l.loose).map(l => l.wire) };
        for (let t = 0; t < intro + loop - 1e-9; t += step) {
          window.isoSeek(t);
          const why = [];
          for (const { l, wire, ends, pulses } of checks) {
            if (!wire || !ends.length) continue;
            const away = seen =>
              l.ends.flatMap((alts, i) => {
                const why = ends[i].map(e => off(e, seen));
                return why.some(w => !w) ? [] : [`${alts.join('|')} (${why[0]})`];
              });
            const d = drawn(wire);
            const line = pose(wire).alpha;
            const gone = line > 0.01 && d.some ? away(line) : [];
            if (gone.length) why.push(`${l.wire} shows while ${gone.join(', ')} is not in place`);
            for (const p of pulses) {
              const glow = p.node && lit(p.node) ? pose(p.node).alpha : 0;
              if (glow <= 0.01) continue;
              const left = away(glow);
              if (left.length) why.push(`${p.id} runs while ${left.join(', ')} is not in place`);
              else if (!d.full || line < Math.min(0.99, glow - 0.05)) why.push(`${p.id} runs on ${l.wire} before it is fully drawn`);
            }
          }
          out.frames++;
          if (why.length) {
            out.bad++;
            if (out.first.length < 4) out.first.push(`${t.toFixed(2)}s ${why[0]}${why.length > 1 ? ` (+${why.length - 1})` : ''}`);
          }
        }
        return out;
      }),
      [links, step],
    );
    await page.close();
    if (!results.length) throw new Error(`order: ${file} has no visible scene at ${w}px`);
    for (const result of results) {
      if (result.error) throw new Error(`order: ${file}: ${result.error}`);
      frames += result.frames;
      bad += result.bad;
      table.push(result);
      if (result.bad) console.log(`FAIL ${basename(file)} ${result.name}: ${result.bad} of ${result.frames} frames\n  ${result.first.join('\n  ')}`);
      if (result.loose.length && w === widths[0]) {
        loose += result.loose.length;
        console.log(`FAIL ${basename(file)} ${result.name}: ${result.loose.join(', ')} start or end on no slab or prism, so the kit cannot time them; name what each joins with wire({ joins }), or joins: [] for a line that joins nothing`);
      }
    }
  }
}
await browser.close();
if (opts.table) for (const r of table) console.log(`${r.name.padEnd(28)} ${String(r.bad).padStart(4)} / ${r.frames}${r.unjoined.length ? `  unjoined: ${r.unjoined.join(', ')}` : ''}`);
console.log(`${frames} frames in ${files.length} pages at ${widths.join(', ')} px every ${step * 1000} ms; ${bad ? `${bad} show a wire or pulse before what it joins is in place` : 'no wire or pulse shows before what it joins is in place'}${loose ? `; ${loose} wires join no box the kit can find` : ''}`);
process.exit(bad || loose ? 1 : 0);
