import { chromium } from 'playwright';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).map(a => a.split(/=(.*)/s).slice(0, 2)));
const usage = 'usage: node compare-rive.mjs riv=<file.riv> page=<scene.html> scene=<name> times=0.5,1,2 (ascending) runtime=<dir with canvas_advanced.mjs + rive.wasm> [artboard=<name>] [scale=1 (2 can misdraw text and raster logos in some files)] [hover=x,y@t;x,y@t (drives the Rive side only; check kit hover with a real mouse)] [out=dir] [bg=#fff]';
if (!args.riv || !args.page || !args.scene || !args.times || !args.runtime) throw new Error(usage);
const times = args.times.split(',').map(Number);
if (times.some((t, i) => !(t >= 0) || (i > 0 && t <= times[i - 1]))) throw new Error('times must be ascending and >= 0: Rive can only step forward');
const out = args.out ?? 'compare';
const runtime = resolve(args.runtime);
for (const f of ['canvas_advanced.mjs', 'rive.wasm']) if (!existsSync(resolve(runtime, f))) throw new Error(`runtime=${args.runtime} has no ${f}; pass the folder that holds the Rive web runtime (canvas_advanced.mjs and rive.wasm)`);
if (!existsSync(resolve(args.riv))) throw new Error(`riv=${args.riv} does not exist`);
const hover = (args.hover ?? '').split(';').filter(Boolean).map(h => { const [xy, t] = h.split('@'); const [x, y] = xy.split(',').map(Number); return { x, y, t: Number(t) }; });
mkdirSync(out, { recursive: true });

const files = { '/rt.mjs': resolve(runtime, 'canvas_advanced.mjs'), '/rive.wasm': resolve(runtime, 'rive.wasm'), '/file.riv': resolve(args.riv) };
const harness = `<!doctype html><script>window.ART=${JSON.stringify(args.artboard ?? '')};window.SCALE=${Number(args.scale ?? 1)}</script><body style="margin:0"><canvas id=c></canvas><script type=module>
const ART = window.ART;
const { default: RiveCanvas } = await import('/rt.mjs');
const rive = await RiveCanvas({ locateFile: () => '/rive.wasm' });
const file = await rive.load(new Uint8Array(await (await fetch('/file.riv')).arrayBuffer()));
const ab = ART ? file.artboardByName(ART) : file.defaultArtboard();
const sm = ab.stateMachineCount() ? new rive.StateMachineInstance(ab.stateMachineByIndex(0), ab) : null;
const canvas = document.getElementById('c'); const SCALE = window.SCALE; canvas.width = ab.width * SCALE; canvas.height = ab.height * SCALE;
const renderer = rive.makeRenderer(canvas);
let now = 0;
window.size = [ab.width, ab.height];
let queue = null;
window.at = (t, hover) => {
  queue ??= hover.map(h => ({ ...h }));
  hover = queue;
  while (now < t - 1e-9) {
    for (const h of hover) if (!h.done && h.t <= now + 1e-9) { h.done = true; sm?.pointerMove(h.x, h.y, 0); }
    const dt = Math.min(1 / 60, t - now);
    sm?.advance(dt); ab.advance(dt); now += dt;
  }
  for (const h of hover) if (!h.done && h.t <= now + 1e-9) { h.done = true; sm?.pointerMove(h.x, h.y, 0); sm?.advance(0); ab.advance(0); }
  renderer.clear(); renderer.save(); renderer.scale(SCALE, SCALE); ab.draw(renderer); renderer.restore(); renderer.flush(); rive.resolveAnimationFrame();
  return canvas.toDataURL();
};
window.ready = true;
</script>`;

const b = await chromium.launch({ channel: 'chrome' });
const rp = await b.newPage();
await rp.route('http://rive.local/**', r => {
  const path = new URL(r.request().url()).pathname;
  if (path === '/') return r.fulfill({ contentType: 'text/html', body: harness });
  const f = files[path];
  if (!f) return r.fulfill({ status: 404 });
  r.fulfill({ contentType: { '.mjs': 'text/javascript', '.wasm': 'application/wasm' }[extname(f)] ?? 'application/octet-stream', body: readFileSync(f) });
});
rp.on('pageerror', e => console.log('rive error:', e.message));
await rp.goto('http://rive.local/');
await rp.waitForFunction(() => window.ready, null, { timeout: 60000 });
const [w, h] = await rp.evaluate(() => window.size);

const kp = await b.newPage({ viewport: { width: w + 40, height: Math.max(900, h * 3) }, deviceScaleFactor: Number(args.scale ?? 1) });
const errors = [];
kp.on('pageerror', e => errors.push(e.message));
await kp.goto(pathToFileURL(resolve(args.page)).href);
await kp.evaluate(() => document.fonts.ready);
const el = kp.locator(`[data-iso="${args.scene}"]`);
await el.waitFor();
await kp.evaluate(([name, w]) => { const e = document.querySelector(`[data-iso="${name}"]`); e.style.width = `${w}px`; e.style.maxWidth = 'none'; e.scrollIntoView(); }, [args.scene, w]);
await kp.waitForFunction(name => document.querySelector(`[data-iso="${name}"]`)?.iso, args.scene);

const pairs = [];
for (const t of times) {
  const rive = await rp.evaluate(([t, hover]) => window.at(t, hover), [t, hover]);
  const riveFile = `${out}/rive-${t.toFixed(2)}.png`;
  writeFileSync(riveFile, Buffer.from(rive.split(',')[1], 'base64'));
  await kp.evaluate(t => window.isoSeek(t), t);
  await kp.waitForTimeout(30);
  const kitFile = `${out}/kit-${t.toFixed(2)}.png`;
  await el.screenshot({ path: kitFile });
  pairs.push({ t, riveFile, kitFile });
}
const img = f => `data:image/png;base64,${readFileSync(f).toString('base64')}`;
const sheet = `<body style="margin:0;background:${args.bg ?? '#888'};font:12px monospace">${pairs.map(p => `<div style="display:flex;gap:6px;margin:6px;align-items:flex-start"><b style="width:44px;color:#fff;background:#000;padding:2px 4px">${p.t}s</b><img src="${img(p.riveFile)}" style="width:${w}px"><img src="${img(p.kitFile)}" style="width:${w}px"></div>`).join('')}</body>`;
const sp = await b.newPage({ viewport: { width: w * 2 + 80, height: 600 } });
await sp.setContent(sheet);
await sp.screenshot({ path: `${out}/sheet.png`, fullPage: true });
console.log(`${out}/sheet.png  (left: Rive, right: kit)  errors: ${errors.length ? errors.join(' | ') : 'none'}`);
await b.close();
