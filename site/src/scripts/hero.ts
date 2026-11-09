import { mountAll } from '../../../skill/lib/runtime';
import { handover, holdAfterPick, lift, liftTime, quickTyping, typeTime, typing, type Typing } from '../../../skill/examples/hero/motion';

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
  const story = (i: number) => stories[((i % stories.length) + stories.length) % stories.length]!;
  const later = (ms: number, run: () => void) => {
    const mine = turn;
    return window.setTimeout(() => mine === turn && run(), Math.max(0, ms));
  };

  const typePrompt = (s: Story, t: Typing) => {
    root.style.setProperty('--lead', `${t.lead * 1000}ms`);
    root.style.setProperty('--step', `${t.step * 1000}ms`);
    for (const other of stories) for (const el of other.lines) el.toggleAttribute('data-on', false);
    void root.offsetWidth;
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

  const leave = (s: Story) => {
    if (exits.has(s) || off(s)) return;
    const pieces = [...(shown(s)?.querySelectorAll('.hero-piece') ?? [])].reverse();
    const anims = pieces.flatMap((p, k) => liftOff(p, k * lift.stagger));
    exits.set(s, anims);
    window.setTimeout(() => {
      if (exits.get(s) !== anims) return;
      if (s !== story(active)) {
        show(s, false);
        for (const h of handles(s)) h.pause();
      }
      for (const a of anims) a.cancel();
      exits.delete(s);
    }, liftTime(pieces.length) * 1000 + 60);
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
      seen = shown(s);
      seen?.iso?.seek(0);
      seen?.iso?.play();
      schedule();
    });
  };

  const still = async (s: Story) => {
    const mine = turn;
    if (!(await load(s))) return failed(s);
    if (mine !== turn) return;
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
    if (how === 'pick') holdUntil = performance.now() + holdAfterPick * 1000;
    if (next === prev && !exits.has(next)) {
      if (how === 'pick') schedule();
      return;
    }
    turn++;
    clearTimeout(tick);
    clearTimeout(swap);
    active = stories.indexOf(next);
    mark(next);
    const t = how === 'pick' ? quickTyping : typing;
    typePrompt(next, t);
    if (reduce.matches) return still(next);
    const sent = typeTime(next.prompt, t) * 1000;
    const out = () => stories.forEach(s => s !== next && leave(s));
    if (how === 'pick') {
      out();
      swap = later(sent, () => enter(next));
    } else
      swap = later(sent, () => {
        out();
        swap = later(handover * 1000, () => enter(next));
      });
  };

  function schedule() {
    clearTimeout(tick);
    if (reduce.matches) return;
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
    if (!exits.size) schedule();
  });
  reduce.addEventListener('change', () => {
    turn++;
    clearTimeout(tick);
    clearTimeout(swap);
    if (reduce.matches) return still(story(active));
    enter(story(active));
  });

  new ResizeObserver(() => {
    const s = story(active);
    const now = shown(s);
    if (!now || now === seen) return;
    const t = seen ? clock(seen) : null;
    seen?.iso?.pause();
    seen = now;
    if (off(s)) return;
    if (reduce.matches) return now.iso?.seek(now.iso.spec.intro + now.iso.spec.still);
    now.iso?.seek(t ?? 0);
    now.iso?.play();
  }).observe(box);

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
  typePrompt(first, typing);
  swap = later(typeTime(first.prompt) * 1000, () => enter(first));
  stories.slice(1).reduce<Promise<unknown>>((chain, s) => chain.then(() => load(s)), Promise.resolve());
}
