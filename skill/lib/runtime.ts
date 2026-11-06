import type { MotionSpec } from './iso';

export interface IsoHandle {
  spec: MotionSpec;
  seek(seconds: number): void;
  play(): void;
  pause(): void;
  destroy(): void;
}

declare global {
  interface Window {
    isoSeek?: (seconds: number) => void;
    isoInfo?: () => Array<{ name: string; intro: number; loop: number; still: number; visible: boolean }>;
  }
  interface HTMLElement {
    iso?: IsoHandle;
  }
}

function parse(root: HTMLElement): MotionSpec {
  const raw = root.querySelector('script.iso-spec')?.textContent;
  if (!raw) throw new Error(`iso: scene ${root.dataset.iso ?? '?'} has no motion spec`);
  const spec: MotionSpec = JSON.parse(raw);
  return spec;
}

const LIFT_MS = 270;

export function mount(root: HTMLElement): IsoHandle {
  const spec = parse(root);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = spec.tracks.flatMap(t => {
    const el = root.querySelector<Element>(`#${CSS.escape(t.target)}`);
    if (!el) return [];
    const a = el.animate(t.keyframes, { duration: t.duration, delay: t.delay, iterations: t.repeat ? Infinity : 1, fill: t.fill });
    a.pause();
    a.currentTime = 0;
    return [a];
  });
  const seek = (s: number) => {
    for (const a of animations) {
      a.pause();
      a.currentTime = s * 1000;
    }
  };
  const still = () => seek(spec.intro + spec.still);
  let started = false;
  let visible = false;
  let held = false;
  const play = () => {
    if (reduce.matches) return still();
    if (!started) {
      seek(0);
      started = true;
    }
    for (const a of animations) a.play();
  };
  const pause = () => {
    for (const a of animations) a.pause();
  };
  let ratio = 0;
  const startAt = () => Math.min(0.4, (innerHeight * 0.5) / Math.max(1, root.getBoundingClientRect().height));
  const sync = () => {
    if (held) return;
    if (!visible || document.hidden) return pause();
    if (!started && ratio < startAt()) return;
    play();
  };
  const onReduce = () => (reduce.matches ? still() : sync());
  const observer = new IntersectionObserver(entries => {
    ratio = entries[entries.length - 1]?.intersectionRatio ?? 0;
    visible = ratio > 0.1;
    sync();
  }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5] });
  observer.observe(root);
  let press: { id: number; x: number; y: number } | null = null;
  const onDown = (e: PointerEvent) => {
    press = e.pointerType === 'mouse' ? null : { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const onCancel = () => {
    press = null;
  };
  const onUp = (e: PointerEvent) => {
    if (!press || press.id !== e.pointerId || Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) return onCancel();
    press = null;
    const el = e.target instanceof Element ? e.target.closest('.iso-hover') : null;
    const hit = el && root.contains(el) ? el : null;
    for (const h of root.querySelectorAll('.iso-hover.is-hot')) if (h !== hit) h.classList.remove('is-hot');
    hit?.classList.toggle('is-hot');
  };
  const timers = new Map<Element, number>();
  const since = new Map<Element, number>();
  const onEnter = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || !(e.currentTarget instanceof Element)) return;
    const el = e.currentTarget;
    clearTimeout(timers.get(el));
    if (!el.classList.contains('is-hot')) {
      el.classList.add('is-hot');
      since.set(el, performance.now());
    }
  };
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || !(e.currentTarget instanceof Element)) return;
    const el = e.currentTarget;
    clearTimeout(timers.get(el));
    timers.set(el, window.setTimeout(() => el.classList.remove('is-hot'), Math.max(0, (el.hasAttribute('data-hold') ? Number(el.getAttribute('data-hold')) : LIFT_MS) - (performance.now() - (since.get(el) ?? 0)))));
  };
  const hovers = [...root.querySelectorAll<SVGElement>('.iso-hover')];
  for (const h of hovers) {
    h.addEventListener('pointerenter', onEnter);
    h.addEventListener('pointerleave', onLeave);
  }
  document.addEventListener('pointerdown', onDown);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onCancel);
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', onReduce);
  if (reduce.matches) still();
  const destroy = () => {
    observer.disconnect();
    for (const h of hovers) {
      h.removeEventListener('pointerenter', onEnter);
      h.removeEventListener('pointerleave', onLeave);
    }
    for (const t of timers.values()) clearTimeout(t);
    document.removeEventListener('pointerdown', onDown);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onCancel);
    for (const h of root.querySelectorAll('.iso-hover.is-hot')) h.classList.remove('is-hot');
    document.removeEventListener('visibilitychange', sync);
    reduce.removeEventListener('change', onReduce);
    for (const a of animations) a.cancel();
    delete root.iso;
  };
  const handle = {
    spec,
    seek: (s: number) => {
      held = true;
      started = true;
      seek(s);
    },
    play: () => {
      held = false;
      started = true;
      play();
    },
    pause: () => {
      held = true;
      pause();
    },
    destroy,
  };
  root.iso = handle;
  return handle;
}

export function mountAll(scope: ParentNode = document): IsoHandle[] {
  const handles = [...scope.querySelectorAll<HTMLElement>('.iso')].flatMap(r => {
    if (r.iso) return [];
    try {
      return [mount(r)];
    } catch (e) {
      console.error(`iso: scene ${r.dataset.iso ?? '?'} could not start`, e);
      return [];
    }
  });
  window.isoSeek = (s: number) => {
    for (const r of document.querySelectorAll<HTMLElement>('.iso')) r.iso?.seek(s);
  };
  window.isoInfo = () =>
    [...document.querySelectorAll<HTMLElement>('.iso')].flatMap(r =>
      r.iso ? [{ name: r.dataset.iso ?? '', intro: r.iso.spec.intro, loop: r.iso.spec.loop, still: r.iso.spec.still, visible: r.offsetParent !== null }] : [],
    );
  return handles;
}
