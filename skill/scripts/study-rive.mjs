import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { browser as open } from './deps.ts';

const args = Object.fromEntries(process.argv.slice(2).map(a => a.split(/=(.*)/s).slice(0, 2)));
if (!args.riv || !args.runtime) throw new Error('usage: node study-rive.mjs riv=<file.riv> runtime=<dir with canvas_advanced.mjs + rive.wasm> [seconds=12] [step=0.25] [cols=8] [artboard=<name>] [hover=x,y@t;x,y@t] [out=dir]');
const seconds = Number(args.seconds ?? 12);
const step = Number(args.step ?? 0.25);
const cols = Number(args.cols ?? 8);
const out = args.out ?? 'study';
const runtime = resolve(args.runtime);
for (const f of ['canvas_advanced.mjs', 'rive.wasm']) if (!existsSync(resolve(runtime, f))) throw new Error(`runtime=${args.runtime} has no ${f}; pass the folder that holds the Rive web runtime (canvas_advanced.mjs and rive.wasm)`);
if (!existsSync(resolve(args.riv))) throw new Error(`riv=${args.riv} does not exist`);
const hover = (args.hover ?? '').split(';').filter(Boolean).map(h => { const [xy, t] = h.split('@'); const [x, y] = xy.split(',').map(Number); return { x, y, t: Number(t) }; });
mkdirSync(out, { recursive: true });

const files = { '/rt.mjs': resolve(runtime, 'canvas_advanced.mjs'), '/rive.wasm': resolve(runtime, 'rive.wasm'), '/file.riv': resolve(args.riv) };
const harness = `<!doctype html><script>window.ART=${JSON.stringify(args.artboard ?? '')}</script><body style="margin:0"><canvas id=c></canvas><script type=module>
const ART = window.ART;
const { default: RiveCanvas } = await import('/rt.mjs');
const rive = await RiveCanvas({ locateFile: () => '/rive.wasm' });
const file = await rive.load(new Uint8Array(await (await fetch('/file.riv')).arrayBuffer()));
const info = { artboards: [] };
for (let a = 0; a < file.artboardCount(); a++) {
  const ab = file.artboardByIndex(a);
  const anims = [...Array(ab.animationCount())].map((_, i) => { const an = ab.animationByIndex(i); return { name: an.name, seconds: +(an.duration / an.fps).toFixed(3), fps: an.fps, loop: ['oneShot', 'loop', 'pingPong'][an.loopValue] ?? an.loopValue }; });
  const sms = [...Array(ab.stateMachineCount())].map((_, i) => { const def = ab.stateMachineByIndex(i); const inst = new rive.StateMachineInstance(def, ab); const inputs = [...Array(inst.inputCount())].map((_, k) => { const inp = inst.input(k); return { name: inp.name, type: ['number', 'trigger', 'boolean'][[56, 58, 59].indexOf(inp.type)] ?? inp.type }; }); inst.delete(); return { name: def.name, inputs }; });
  info.artboards.push({ name: ab.name, width: ab.width, height: ab.height, animations: anims, stateMachines: sms });
}
const ab = ART ? file.artboardByName(ART) : file.defaultArtboard();
const sm = ab.stateMachineCount() ? new rive.StateMachineInstance(ab.stateMachineByIndex(0), ab) : null;
const lin = sm ? null : (ab.animationCount() ? new rive.LinearAnimationInstance(ab.animationByIndex(0), ab) : null);
const canvas = document.getElementById('c'); canvas.width = ab.width; canvas.height = ab.height;
const renderer = rive.makeRenderer(canvas);
let now = 0;
const queue = [];
window.info = info; window.size = [ab.width, ab.height];
window.at = (t, hover) => {
  if (!queue.length && hover.length) queue.push(...hover.map(h => ({ ...h })));
  while (now < t - 1e-9) {
    for (const h of queue) if (!h.done && h.t <= now + 1e-9) { h.done = true; sm?.pointerMove(h.x, h.y, 0); }
    const dt = Math.min(1 / 60, t - now);
    if (sm) sm.advance(dt); else if (lin) { lin.advance(dt); lin.apply(1); }
    ab.advance(dt); now += dt;
  }
  renderer.clear(); renderer.save(); ab.draw(renderer); renderer.restore(); renderer.flush(); rive.resolveAnimationFrame();
  return canvas.toDataURL();
};
window.ready = true;
</script>`;

const b = await open('chromium', 'study-rive.mjs');
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
const info = await rp.evaluate(() => window.info);
const bytes = readFileSync(resolve(args.riv));
const assets = [];
for (let i = 0; i + 12 < bytes.length; i++) {
  const riff = bytes[i] === 0x52 && bytes[i + 1] === 0x49 && bytes[i + 2] === 0x46 && bytes[i + 3] === 0x46 && bytes.toString('latin1', i + 8, i + 12) === 'WEBP';
  const png = bytes[i] === 0x89 && bytes.toString('latin1', i + 1, i + 4) === 'PNG';
  if (riff) { const len = bytes.readUInt32LE(i + 4) + 8; assets.push({ ext: 'webp', data: bytes.subarray(i, i + len) }); i += len - 1; }
  else if (png) { const end = bytes.indexOf('IEND', i, 'latin1'); if (end > 0) { assets.push({ ext: 'png', data: bytes.subarray(i, end + 8) }); i = end + 7; } }
}
if (assets.length) mkdirSync(`${out}/assets`, { recursive: true });
assets.forEach((a, k) => writeFileSync(`${out}/assets/${k}.${a.ext}`, a.data));
info.embeddedImages = assets.map((a, k) => `assets/${k}.${a.ext} (${a.data.length} bytes)`);
writeFileSync(`${out}/info.json`, JSON.stringify(info, null, 2));
const [w, h] = await rp.evaluate(() => window.size);
const frames = [];
for (let t = 0; t <= seconds + 1e-9; t += step) {
  const png = await rp.evaluate(([t, hover]) => window.at(t, hover), [t, hover]);
  frames.push({ t: +t.toFixed(3), png });
}
const cell = Math.min(320, w);
const sheet = `<body style="margin:0;background:${args.bg ?? '#7a7a7a'};font:11px monospace"><div style="display:grid;grid-template-columns:repeat(${cols},${cell}px);gap:4px;padding:4px">${frames.map(f => `<figure style="margin:0;position:relative"><img src="${f.png}" style="width:${cell}px;display:block"><figcaption style="position:absolute;top:0;left:0;background:#000;color:#fff;padding:0 3px">${f.t}s</figcaption></figure>`).join('')}</div></body>`;
const sp = await b.newPage({ viewport: { width: cols * (cell + 4) + 8, height: 600 } });
await sp.setContent(sheet);
await sp.screenshot({ path: `${out}/sheet.png`, fullPage: true });
console.log(JSON.stringify(info));
console.log(`${out}/sheet.png  ${frames.length} frames ${w}x${h}`);
await b.close();
