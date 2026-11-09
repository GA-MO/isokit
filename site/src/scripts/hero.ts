import { mountAll } from '../../../skill/lib/runtime';
import { handoverAfter, holdAfterPick, lift, liftTime, quickTyping, typeTime, typing, type Typing } from '../../../skill/examples/hero/motion';

interface Story {
  tab: HTMLButtonElement;
  bar: HTMLElement | null;
  lines: HTMLElement[];
  panel: HTMLElement;
  prompt: string;
  peak: number;
}

type How = 'auto' | 'pick';

const roots = (s: Story) => [...s.panel.querySelectorAll<HTMLElement>('.iso')];
const handles = (s: Story) => roots(s).flatMap(r => (r.iso ? [r.iso] : []));
const off = (s: Story) => s.panel.hasAttribute('data-off');
const show = (s: Story, on: boolean) => s.panel.toggleAttribute('data-off', !on);
const shown = (s: Story) => roots(s).find(r => r.offsetParent !== null && r.iso);

const clocks = new WeakMap<HTMLElement, Animation>();
function clock(root: HTMLElement): number | null {
  let a = clocks.get(root);
  if (!a) {
    a = root.getAnimations({ subtree: true }).find(x => x.effect?.getTiming().iterations === Infinity);
    if (!a) return null;
    clocks.set(root, a);
  }
  return a.currentTime === null ? null : Number(a.currentTime) / 1000;
}

function liftOff(el: Element, delay: number): Animation[] {
  const timing = { duration: lift.dur * 1000, delay: delay * 1000, fill: 'forwards' as const };
  return [
    el.animate([{ translate: '0 0' }, { translate: `0 ${-lift.distance}px` }], { ...timing, easing: lift.ease }),
    el.animate([{ opacity: 1 }, { opacity: 1, offset: lift.fadeFrom }, { opacity: 0 }], timing),
  ];
}

export function playHero(root: HTMLElement) {
  const box = root.querySelector<HTMLElement>('#hero-scene');
  const list = root.querySelector<HTMLElement>('[role=tablist]');
  if (!box || !list) return;
  const stories: Story[] = [...list.querySelectorAll<HTMLButtonElement>('[role=tab]')].flatMap((tab, i) => {
    const panel = box.querySelector<HTMLElement>(`[data-panel="${i}"]`);
    return panel ? [{ tab, bar: tab.querySelector<HTMLElement>('[data-progress]'), lines: [...root.querySelectorAll<HTMLElement>(`[data-line="${i}"]`)], panel, prompt: tab.dataset.prompt ?? '', peak: Number(tab.dataset.peak) }] : [];
  });
  if (!stories.length) return;
  mountAll(box);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const exits = new Map<Story, Animation[]>();
  let active = 0;
  let turn = 0;
  let tick = 0;
  let swap = 0;
  let holdUntil = 0;
  let progress: Animation | null = null;
  let seen: HTMLElement | undefined;
  let live = false;
  let inView = false;
  const story = (i: number) => stories[((i % stories.length) + stories.length) % stories.length]!;
  const later = (ms: number, run: () => unknown) => {
    const mine = turn;
    return window.setTimeout(() => mine === turn && run(), Math.max(0, ms));
  };

  const terminal = root.querySelector<HTMLElement>('[data-terminal]') ?? root;
  const typePrompt = (s: Story, t: Typing) => {
    terminal.style.setProperty('--lead', `${t.lead * 1000}ms`);
    terminal.style.setProperty('--step', `${t.step * 1000}ms`);
    for (const el of stories.flatMap(other => other.lines)) {
      el.removeAttribute('data-on');
      el.removeAttribute('data-drawn');
    }
    terminal.getBoundingClientRect();
    for (const el of s.lines) el.toggleAttribute('data-on', true);
  };

  const mark = (s: Story) => {
    for (const other of stories) {
      const on = other === s;
      other.tab.setAttribute('aria-selected', String(on));
      other.tab.tabIndex = on ? 0 : -1;
    }
    box.setAttribute('aria-labelledby', s.tab.id);
    progress?.cancel();
    progress = null;
  };

  const finish = (s: Story) => {
    show(s, false);
    for (const h of handles(s)) h.pause();
    for (const a of exits.get(s) ?? []) a.cancel();
    exits.delete(s);
  };

  const leave = (s: Story): number => {
    if (exits.has(s) || off(s)) return 0;
    const pieces = [...(shown(s)?.querySelectorAll('.hero-piece') ?? [])].reverse();
    const anims = pieces.flatMap((p, k) => liftOff(p, k * lift.stagger));
    exits.set(s, anims);
    window.setTimeout(() => exits.get(s) === anims && finish(s), liftTime(pieces.length) * 1000 + 60);
    return pieces.length;
  };

  const loads = new Map<Story, Promise<boolean>>();
  const load = (s: Story): Promise<boolean> => {
    const src = s.panel.dataset.src;
    if (!src || roots(s).length) return Promise.resolve(true);
    let pending = loads.get(s);
    if (!pending) {
      pending = fetch(src)
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.text();
        })
        .then(markup => {
          const t = document.createElement('template');
          t.innerHTML = markup;
          s.panel.querySelector('[data-retry]')?.remove();
          for (const el of s.lines) el.querySelector('ul')?.toggleAttribute('data-failed', false);
          s.panel.append(t.content);
          mountAll(s.panel);
          for (const h of handles(s)) h.seek(0);
          return true;
        })
        .catch(e => {
          console.error(`hero: the scene for "${s.prompt}" did not load`, e);
          loads.delete(s);
          return false;
        });
      loads.set(s, pending);
    }
    return pending;
  };

  const failed = (s: Story) => {
    show(s, true);
    for (const el of s.lines) el.querySelector('ul')?.toggleAttribute('data-failed', true);
    if (s.panel.querySelector('[data-retry]')) return;
    const note = document.createElement('p');
    note.dataset.retry = '';
    note.className = 'relative flex h-full items-center justify-center gap-3 text-sm text-muted';
    note.textContent = 'This scene did not load.';
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'font-medium text-ink underline underline-offset-4';
    again.textContent = 'Retry';
    again.addEventListener('click', () => enter(s));
    note.append(again);
    s.panel.append(note);
  };

  const enter = (s: Story) => {
    const mine = turn;
    load(s).then(ok => {
      if (mine !== turn) return;
      if (!ok) return failed(s);
      for (const a of exits.get(s) ?? []) a.cancel();
      exits.delete(s);
      show(s, true);
      for (const el of s.lines) el.toggleAttribute('data-drawn', true);
      seen = shown(s);
      seen?.iso?.seek(0);
      live = true;
      resume();
    });
  };

  const resume = () => {
    if (!live || reduce.matches) return;
    if (!inView) {
      seen?.iso?.pause();
      clearTimeout(tick);
      progress?.pause();
      return;
    }
    seen?.iso?.play();
    schedule();
  };

  const still = async (s: Story) => {
    const mine = turn;
    const ok = await load(s);
    if (mine !== turn) return;
    if (!ok) return failed(s);
    for (const other of stories) {
      for (const a of exits.get(other) ?? []) a.cancel();
      exits.delete(other);
      show(other, other === s);
      if (other !== s) for (const h of handles(other)) h.pause();
    }
    for (const h of handles(s)) h.seek(h.spec.intro + h.spec.still);
  };

  const select = (i: number, how: How) => {
    const next = story(i);
    const prev = story(active);
    if (how === 'pick') holdUntil = Math.max(holdUntil, performance.now() + holdAfterPick * 1000);
    const typed = how === 'pick' && next === prev && next.lines.some(l => [...l.querySelectorAll('.type-in > span')].at(-1)?.getAnimations()[0]?.playState === 'finished');
    if (next === prev && (live || how === 'auto')) {
      if (how === 'pick') schedule();
      return;
    }
    turn++;
    live = false;
    clearTimeout(tick);
    clearTimeout(swap);
    active = stories.indexOf(next);
    mark(next);
    const t = how === 'pick' ? quickTyping : typing;
    if (!typed) typePrompt(next, t);
    if (reduce.matches) return still(next);
    const sent = typed ? 0 : typeTime(next.prompt, t) * 1000;
    const out = () => handoverAfter(Math.max(0, ...stories.map(s => (s === next ? 0 : leave(s))))) * 1000;
    if (how === 'pick') {
      const clear = out();
      swap = later(Math.max(sent, clear), () => enter(next));
    } else
      swap = later(sent, () => {
        swap = later(out(), () => enter(next));
      });
  };

  function schedule() {
    clearTimeout(tick);
    if (reduce.matches || !live || !inView) return;
    const s = story(active);
    const view = shown(s);
    const now = view ? clock(view) : null;
    const spec = view?.iso?.spec;
    if (now === null || !spec) {
      tick = later(100, schedule);
      return;
    }
    const next = story(active + 1);
    const wait = Math.max(0, holdUntil - performance.now()) / 1000;
    if (!Number.isFinite(wait)) return;
    const first = spec.intro + s.peak - typeTime(next.prompt);
    const start = wait > 0 && now + wait > first ? first + Math.ceil((now + wait - first) / spec.loop) * spec.loop : first;
    if (now >= start - 0.02) return select(active + 1, 'auto');
    progress?.cancel();
    progress = wait > 0 ? null : (s.bar?.animate([{ scale: `${Math.min(1, now / start)} 1` }, { scale: '1 1' }], { duration: (start - now) * 1000, fill: 'forwards' }) ?? null);
    tick = later((start - now) * 1000, schedule);
  }

  for (const [i, s] of stories.entries()) s.tab.addEventListener('click', () => select(i, 'pick'));
  list.addEventListener('keydown', e => {
    const keys: Record<string, (i: number) => number> = { ArrowRight: i => i + 1, ArrowDown: i => i + 1, ArrowLeft: i => i - 1, ArrowUp: i => i - 1, Home: () => 0, End: () => stories.length - 1 };
    const move = keys[e.key];
    const from = stories.findIndex(s => s.tab === document.activeElement);
    if (!move || from < 0) return;
    e.preventDefault();
    const to = stories.indexOf(story(move(from)));
    story(to).tab.focus();
    select(to, 'pick');
  });
  list.addEventListener('focusin', e => {
    if (!(e.target instanceof Element && e.target.matches(':focus-visible'))) return;
    holdUntil = Infinity;
    progress?.cancel();
    progress = null;
  });
  list.addEventListener('focusout', e => {
    if (e.relatedTarget instanceof Node && list.contains(e.relatedTarget)) return;
    holdUntil = performance.now() + holdAfterPick * 1000;
    schedule();
  });
  reduce.addEventListener('change', () => {
    turn++;
    clearTimeout(tick);
    clearTimeout(swap);
    if (reduce.matches) return still(story(active));
    live = false;
    enter(story(active));
  });

  new ResizeObserver(() => {
    const was = seen;
    const owner = was && stories.find(s => s.panel.contains(was));
    const now = owner && shown(owner);
    if (!was || !now || now === was) return;
    const t = clock(was);
    was.iso?.pause();
    seen = now;
    if (reduce.matches) return now.iso?.seek(now.iso.spec.intro + now.iso.spec.still);
    if (off(owner) || exits.has(owner)) return finish(owner);
    now.iso?.seek(t ?? 0);
    if (owner === story(active)) return resume();
    if (inView) now.iso?.play();
  }).observe(box);

  let preloaded = false;
  let ratio = 0;
  const watch = () => {
    const was = inView;
    inView = ratio > 0.1 && !document.hidden;
    if (inView && !preloaded) {
      preloaded = true;
      stories.slice(1).reduce<Promise<unknown>>((chain, s) => chain.then(() => load(s)), Promise.resolve());
    }
    if (was !== inView) resume();
  };
  new IntersectionObserver(
    entries => {
      ratio = entries[entries.length - 1]?.intersectionRatio ?? 0;
      watch();
    },
    { threshold: [0, 0.1, 0.2] },
  ).observe(box);
  document.addEventListener('visibilitychange', watch);

  let pointer: [number, number] | null = null;
  let frame = 0;
  let poll = 0;
  const flat = 'perspective(1800px) rotateX(0deg) rotateY(0deg)';
  box.style.transition = 'transform 1.1s cubic-bezier(.22,1,.36,1)';
  const tilt = () => {
    frame = 0;
    if (!pointer || reduce.matches || !fine.matches || exits.size) {
      box.style.transform = flat;
      return;
    }
    const r = box.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (pointer[0] - r.left - r.width / 2) / (r.width / 2)));
    const y = Math.max(-1, Math.min(1, (pointer[1] - r.top - r.height / 2) / (r.height / 2)));
    box.style.transform = `perspective(1800px) rotateX(${(y * 2.8).toFixed(2)}deg) rotateY(${(-x * 3.5).toFixed(2)}deg)`;
  };
  const queue = () => frame || (frame = requestAnimationFrame(tilt));
  box.addEventListener(
    'pointermove',
    e => {
      if (e.pointerType !== 'mouse') return;
      pointer = [e.clientX, e.clientY];
      poll ||= window.setInterval(queue, 250);
      queue();
    },
    { passive: true },
  );
  box.addEventListener('pointerleave', () => {
    pointer = null;
    clearInterval(poll);
    poll = 0;
    queue();
  });

  const first = story(0);
  for (const s of stories) for (const h of handles(s)) h.seek(s === first && reduce.matches ? h.spec.intro + h.spec.still : 0);
  if (reduce.matches) return;
  const typed = first.lines.flatMap(l => [...l.querySelectorAll('.type-in > span')]).at(-1)?.getAnimations()[0];
  if (!typed) {
    typePrompt(first, typing);
    swap = later(typeTime(first.prompt) * 1000, () => enter(first));
    return;
  }
  const mine = turn;
  typed.finished.then(
    () => {
      if (mine === turn) swap = later(typing.send * 1000, () => enter(first));
    },
    () => undefined,
  );
}
