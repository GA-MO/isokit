import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, surfaces, type Example } from './shared';

const ui = surfaces.light;
const line = 'rgb(22 23 27 / .3)';
const ink = '#4b4e57';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const names = { compact: 'drill-sm', wide: 'drill-lg' } as const;

const parts = [
  { id: 'api', at: [0, 0], layers: ['handlers', 'auth', 'routes'] },
  { id: 'queue', at: [1, 0], layers: ['offsets', 'partitions', 'topics'] },
  { id: 'database', at: [0, 1], layers: ['storage', 'indexes', 'planner'] },
] as const;

const segment = 4.2;
const loopLength = segment * parts.length;
const openAt = 0.3;
const openFor = 0.9;
const namesAt = 0.8;
const closeAt = 3.0;
const closeFor = 0.7;
const dim = 0.32;

const steps = parts.map((_, i) => {
  const t = i * segment;
  return { open: [t + openAt, t + 1.5], shown: [t + openAt, t + closeAt + 0.4], close: [t + closeAt, t + closeAt + closeFor + 0.2] } as const;
});

type Layout = { name: string; width: number; height: number; origin: readonly [number, number]; k: number; spread: number; wide: boolean };

function build({ name, width, height, origin, k, spread, wide }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const minPx = wide ? 721 : narrowest;
  const size = 120 * k;
  const thick = 18 * k;
  const closed = 25 * k;
  const lift = 46 * k;
  const radius = 18 * k;
  const centre = (p: (typeof parts)[number]): Vec3 => [p.at[0] * spread, p.at[1] * spread, 0];
  const wz = 6 * k;

  parts.slice(1).forEach(p => {
    const c = centre(p);
    const along = p.at[0] ? 0 : 1;
    const from: Vec3 = along === 0 ? [size / 2, 0, wz] : [0, size / 2, wz];
    const to: Vec3 = along === 0 ? [c[0] - size / 2, 0, wz] : [0, c[1] - size / 2, wz];
    s.wire({ id: `w-${p.id}`, points: [from, to], stroke: ui.wire, width: 1.25 });
  });

  const order = [...parts].sort((a, b) => a.at[0] + a.at[1] - (b.at[0] + b.at[1]));
  order.forEach(p => {
    const c = centre(p);
    s.group(`part-${p.id}`, () => {
      const base = s.extremes([c[0], c[1], thick], [size, size], radius);
      const reach = (p.layers.length - 1) * (closed + lift) - thick;
      for (const corner of ['left', 'front', 'right'] as const) {
        const [x, y] = base[corner];
        const id = `${p.id}-g-${corner}`;
        s.svg(id, `<path d="M${x.toFixed(1)} ${y.toFixed(1)}v${(-reach).toFixed(1)}" stroke="rgb(79 70 229 / .5)" stroke-width="1" stroke-dasharray="2 3" vector-effect="non-scaling-stroke"/>`);
        s.pivot(id, s.unproject([x, y], 0));
      }
      p.layers.forEach((layer, j) => {
        const top: Vec3 = [c[0], c[1], thick + j * closed];
        s.group(`${p.id}-l${j}`, () => {
          s.slab({ id: `${p.id}-s${j}`, at: top, size: [size, size], height: thick, radius, top: ui.top, side: paints.flat(j === p.layers.length - 1 ? '#f4f4f2' : '#eef0f6'), outline: line, shade: false, edge: line, shadow: j === 0 });
          s.slab({ id: `${p.id}-hi${j}`, at: top, size: [size, size], height: thick, radius, top: '#f5f6ff', side: paints.flat('#e0e7ff'), outline: '#6366f1', shade: false, edge: '#6366f1', shadow: false });
          s.text({ id: `${p.id}-n${j}`, at: [c[0], c[1] + size / 2, top[2] - thick / 2], text: layer, size: 11, color: ink, on: 'left', anchor: 'middle' });
        });
      });
      s.text({ id: `${p.id}-name`, at: [c[0], c[1], thick + (p.layers.length - 1) * closed], text: p.id, size: wide ? 12 : 11, color: ink, on: 'top', anchor: 'middle' });
    });
  });

  parts.forEach((p, i) => {
    const c = centre(p);
    const [x, y] = s.project([c[0] + size / 2, c[1] + size / 2, 0]);
    s.label({ id: `b-${p.id}`, at: { screen: [fitX(x, `+ ${p.id}`, width, minPx, 'center', 'mono', 3), y + 4 * k] }, html: partButton(p.id, i), variant: 'plain', size: 13, anchor: 'top', className: 'dd-chip' });
  });
  s.label({ id: 'back', at: { screen: [fitX(12, '< back', width, minPx, 'left', 'mono', 3), 34] }, html: backButton(), variant: 'plain', size: 13, anchor: 'left' });

  parts.forEach((p, i) => s.dropIn(`part-${p.id}`, 0.1 + i * 0.083));
  s.introUntil(0.8);

  s.loop(loopLength, steps[0]!.open[1] + 0.4);
  parts.forEach((p, i) => {
    const t = i * segment;
    p.layers.forEach((_, j) => {
      const up = `0 ${-(j * lift).toFixed(1)}px`;
      if (j > 0) {
        s.at(`${p.id}-l${j}`, 'translate', t + openAt + (p.layers.length - 1 - j) * 0.06, openFor, '0 0', up, settle);
        s.at(`${p.id}-l${j}`, 'translate', t + closeAt + (j - 1) * 0.06, closeFor, up, '0 0', settle);
      }
      s.at(`${p.id}-hi${j}`, 'opacity', t + openAt + 0.2, 0.4, 0, 1, ease.linear);
      s.at(`${p.id}-hi${j}`, 'opacity', t + closeAt, 0.4, 1, 0, ease.linear);
      s.at(`${p.id}-n${j}`, 'opacity', t + namesAt + 0.08 * j, 0.25, 0, 1, ease.linear);
      s.at(`${p.id}-n${j}`, 'opacity', t + closeAt, 0.2, 1, 0, ease.linear);
    });
    for (const corner of ['left', 'front', 'right'] as const) {
      const id = `${p.id}-g-${corner}`;
      s.at(id, 'opacity', t + openAt, 0.15, 0, 1, ease.linear);
      s.at(id, 'scale', t + openAt, openFor, '1 0', '1 1', settle);
      s.at(id, 'scale', t + closeAt + 0.06, closeFor, '1 1', '1 0', settle);
      s.at(id, 'opacity', t + closeAt + 0.06 + closeFor - 0.15, 0.15, 1, 0, ease.linear);
    }
    for (const [prop, rest, on] of [['backgroundColor', '#ffffff', '#4f46e5'], ['color', '#16171b', '#ffffff']] as const) {
      s.at(`b-${p.id}`, prop, t + openAt, 0.2, rest, on, ease.linear);
      s.at(`b-${p.id}`, prop, t + closeAt + 0.2, 0.2, on, rest, ease.linear);
    }
    s.at(`${p.id}-name`, 'opacity', t + openAt, 0.2, 1, 0, ease.linear);
    s.at(`${p.id}-name`, 'opacity', t + closeAt + closeFor, 0.25, 0, 1, ease.linear);
    const others = parts.filter(o => o.id !== p.id);
    for (const o of others) {
      s.at(`part-${o.id}`, 'opacity', t + openAt, 0.4, 1, dim, ease.linear);
      s.at(`part-${o.id}`, 'opacity', t + closeAt + 0.2, 0.5, dim, 1, ease.linear);
    }
    for (const w of parts.slice(1)) {
      if (w.id === p.id) continue;
      s.at(`w-${w.id}`, 'opacity', t + openAt, 0.4, 1, dim, ease.linear);
      s.at(`w-${w.id}`, 'opacity', t + closeAt + 0.2, 0.5, dim, 1, ease.linear);
    }
  });
  return s;
}

const chevron = `<svg class="dd-icon" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function partButton(id: string, i: number): string {
  return `<button type="button" class="dd-part" data-part="${i}" aria-expanded="false">${chevron}<span>${id}</span></button>`;
}

function backButton(): string {
  return `<button type="button" class="dd-back" tabindex="-1"><svg class="dd-icon" viewBox="0 0 12 12" aria-hidden="true"><path d="M7.5 3 4.5 6 7.5 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>back</span></button><span class="dd-live" aria-live="polite"></span>`;
}

const scope = '[data-iso^="drill-"]';
const css = `${scope} .dd-part,${scope} .dd-back{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:.4em;min-width:44px;min-height:44px;padding:.35em .85em .35em .7em;background:#fff;border:1px solid rgb(22 23 27 / .14);border-radius:12px;box-shadow:0 1px 2px rgb(15 23 42 / .06),0 10px 24px -16px rgb(15 23 42 / .45);cursor:pointer;font:500 1em/1.2 ${fonts.mono};color:#16171b;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:box-shadow .25s cubic-bezier(.22,1,.36,1),scale .18s cubic-bezier(.22,1,.36,1),opacity .25s linear,translate .3s cubic-bezier(.22,1,.36,1)}
${scope} .dd-part:hover,${scope} .dd-back:hover{border-color:rgb(79 70 229 / .45);box-shadow:0 1px 2px rgb(15 23 42 / .06),0 14px 28px -14px rgb(15 23 42 / .5)}
${scope} .dd-part:active,${scope} .dd-back:active{scale:.96}
${scope} .dd-part:focus-visible,${scope} .dd-back:focus-visible{outline:2px solid #4f46e5;outline-offset:3px}
${scope} .dd-chip{background:#fff;color:#16171b;border-radius:12px}
${scope} .dd-part{background:transparent;color:inherit}
${scope} .dd-icon{width:.95em;height:.95em;flex:none;transition:rotate .3s cubic-bezier(.22,1,.36,1)}
${scope} .dd-part .dd-icon{rotate:-90deg}
${scope} .dd-part[aria-expanded="true"] .dd-icon{rotate:0deg}
${scope} .dd-back{opacity:0;visibility:hidden;translate:-6px 0;transition-property:opacity,translate,visibility,box-shadow,border-color,scale;transition-duration:.25s,.3s,0s,.25s,.2s,.18s;transition-delay:0s,0s,.25s,0s,0s,0s}
${scope}.dd-exploring .dd-back{opacity:1;visibility:visible;translate:0 0;transition-delay:0s}
${scope} .dd-live{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
@media (prefers-reduced-motion:reduce){${scope} .dd-part,${scope} .dd-back,${scope} .dd-icon{transition:none}}`;

function script(): string {
  const data = JSON.stringify({ steps, names: Object.values(names), layers: parts.map(p => `${p.id}: ${[...p.layers].reverse().join(', ')}`) });
  return `<script type="module">
const { steps, names, layers } = ${data};
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const idleMs = 6000;
const loopTime = (root) => {
  const h = root.iso;
  const a = h && root.getAnimations({ subtree: true }).find(x => x.effect?.getTiming().iterations === Infinity && x.effect.getTiming().duration === h.spec.loop * 1000);
  if (!a || a.currentTime === null) return 0;
  const t = Number(a.currentTime) / 1000 - h.spec.intro;
  return t < 0 ? 0 : t % h.spec.loop;
};
const shownAt = (t) => steps.findIndex(s => t >= s.shown[0] && t < s.shown[1]);
const bind = (root) => {
  if (root.dataset.ddBound) return;
  root.dataset.ddBound = '1';
  const buttons = [...root.querySelectorAll('.dd-part')];
  const back = root.querySelector('.dd-back');
  const live = root.querySelector('.dd-live');
  let open = -1;
  let busy = false;
  let scrub = 0;
  let idle = 0;
  let waiting = false;
  const show = (n) => buttons.forEach((b, i) => b.setAttribute('aria-expanded', String(i === n)));
  const setOpen = (n) => {
    open = n;
    root.classList.toggle('dd-exploring', n >= 0);
    back.tabIndex = n >= 0 ? 0 : -1;
    live.textContent = n >= 0 ? layers[n] : '';
    show(n);
  };
  const inView = () => {
    const r = root.getBoundingClientRect();
    return root.offsetParent !== null && r.bottom > 0 && r.top < innerHeight;
  };
  const resume = () => {
    if (!root.iso) return;
    if (back === document.activeElement) buttons[open]?.focus();
    setOpen(-1);
    if (reduce.matches) return;
    waiting = !inView();
    if (!waiting) root.iso.play();
  };
  const seen = new IntersectionObserver(entries => {
    if (waiting && entries.some(e => e.isIntersecting)) resume();
  });
  seen.observe(root);
  const later = () => {
    clearTimeout(idle);
    idle = setTimeout(resume, idleMs);
  };
  const run = (from, to, done) => {
    const h = root.iso;
    cancelAnimationFrame(scrub);
    if (reduce.matches) {
      h.seek(h.spec.intro + to);
      return done();
    }
    busy = true;
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(to, from + (now - t0) / 1000);
      h.seek(h.spec.intro + t);
      if (t < to) scrub = requestAnimationFrame(tick);
      else {
        busy = false;
        done();
      }
    };
    scrub = requestAnimationFrame(tick);
  };
  const current = () => (open >= 0 ? open : shownAt(loopTime(root)));
  const collapse = (n, from, done) => {
    if (n < 0) return done();
    const [a, b] = steps[n].close;
    run(from > a && from < b ? from : a, b, done);
  };
  const explore = (n) => {
    const h = root.iso;
    if (!h) return;
    clearTimeout(idle);
    waiting = false;
    const was = current();
    const t = open >= 0 ? 0 : loopTime(root);
    h.pause();
    setOpen(n);
    collapse(was === n ? -1 : was, t, () => run(steps[n].open[0], steps[n].open[1], later));
  };
  const close = () => {
    const h = root.iso;
    const n = current();
    if (!h || n < 0) return;
    const t = open >= 0 ? 0 : loopTime(root);
    clearTimeout(idle);
    waiting = false;
    h.pause();
    if (back === document.activeElement) buttons[n].focus();
    setOpen(-1);
    collapse(n, t, later);
  };
  buttons.forEach((b, i) => b.addEventListener('click', () => (current() === i ? close() : explore(i))));
  back.addEventListener('click', close);
  root.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || current() < 0) return;
    e.preventDefault();
    close();
  });
  const sync = setInterval(() => {
    if (!root.isConnected) {
      clearInterval(sync);
      seen.disconnect();
      return;
    }
    if (root.iso && open < 0 && !busy) show(shownAt(loopTime(root)));
  }, 150);
};
const scan = () => {
  for (const name of names) for (const root of document.querySelectorAll('[data-iso="' + name + '"]')) bind(root);
};
scan();
new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
</script>`;
}

export const example: Example = {
  slug: 'drill-down',
  title: 'Drill into a system',
  ask: 'Open each part of the system to show its layers.',
  story: 'A system of api, queue and database where each part in turn lifts apart into its inner layers with their names while the rest dims, and the viewer can open any part themselves.',
  prompt: 'Draw a system diagram of an api, a queue and a database where clicking a part explodes it into its named inner layers and dims the rest, and clicking again or pressing back folds it closed.',
  level: 'complex',
  intent: 'inside',
  layout: 'exploded',
  useCase: 'Architecture',
  surface: 'light',
  interaction: 'explore',
  art: art(
    build({ name: names.compact, width: 390, height: 430, origin: [195, 236], k: 0.78, spread: 170, wide: false }),
    build({ name: names.wide, width: 1100, height: 540, origin: [550, 276], k: 1.22, spread: 350, wide: true }),
    720,
    `<style>${css}</style>${script()}`,
  ),
};

export default page(example);
