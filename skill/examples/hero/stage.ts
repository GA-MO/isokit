import { Scene, ease, type AnimatedProp, type PulseOptions, type SceneOptions, type ValueOf, type Vec2, type WireOptions } from '../../lib/iso.ts';
import { art, fonts, surfaces, type Art } from '../shared.ts';
import { handoverAfter, hidden, lift, liftTime, typeTime, typing, unwireTime } from './motion.ts';

export type Variant = 'wide' | 'compact';

export const frames: Record<Variant, { width: number; height: number; suffix: string }> = {
  wide: { width: 720, height: 450, suffix: 'lg' },
  compact: { width: 390, height: 410, suffix: 'sm' },
};
export const breakpoint = 520;

export const ui = surfaces.light;
export const stack = {
  sans: `${fonts.sans.replace(', sans-serif', '')}, -apple-system, 'Segoe UI', Roboto, sans-serif`,
  mono: `${fonts.mono.replace(', monospace', '')}, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace`,
};

export interface Story {
  slug: string;
  label: string;
  prompt: string;
  dir: string;
  file: string;
  beats: string;
  alt: string;
  swatch: string;
  enter: number;
  loop: number;
  peak: number;
  still: number;
  origin: Record<Variant, Vec2>;
  draw(s: Scene, v: Variant): unknown;
}

const options = (name: string, v: Variant, origin: Vec2): SceneOptions => ({ name, width: frames[v].width, height: frames[v].height, origin, font: stack.sans, mono: stack.mono, label: ui.label });

const registry = new WeakMap<Scene, string[]>();
const piecesOf = (s: Scene) => registry.get(s) ?? [];

export function piece(s: Scene, id: string, build: () => unknown, drop?: number) {
  s.group(id, build, 'hero-piece');
  registry.set(s, [...piecesOf(s), id]);
  if (drop !== undefined) s.dropIn(id, drop);
}

interface Wiring {
  wires: string[];
  pulses: string[];
  pins: string[];
  labels: string[];
}
interface Part {
  id: string;
  build: () => unknown;
}
const wiring = new WeakMap<Scene, Wiring>();
const wiresOf = (s: Scene): Wiring => wiring.get(s) ?? { wires: [], pulses: [], pins: [], labels: [] };

export function link(s: Scene, wire: Omit<WireOptions, 'hidden' | 'className'>, parts: { pulse?: Omit<PulseOptions, 'wire'>; pin?: Part; label?: Part } = {}) {
  const { pulse, pin, label } = parts;
  const add = (kind: string, part: Part | undefined) => {
    if (!part) return [];
    s.group(part.id, part.build, `hero-${kind}`);
    return [part.id];
  };
  s.wire({ ...wire, hidden: true, className: 'hero-wire' });
  const was = wiresOf(s);
  wiring.set(s, {
    wires: [...was.wires, wire.id],
    pulses: [...was.pulses, ...add('pulse', pulse && { id: `${pulse.id}-run`, build: () => s.pulse({ ...pulse, wire: wire.id }) })],
    pins: [...was.pins, ...add('pin', pin)],
    labels: [...was.labels, ...add('label', label)],
  });
}

const num = (v: number) => Number(v.toFixed(2));

export function block(s: Scene, key: string, size: number, height: number, round: number, look: { top: string; side: readonly [dark: string, light: string]; edge: string }) {
  const [half, r] = [size / 2, size * round];
  const width = (half - r) * Math.SQRT2 + r;
  const square = (paint: string) => `<rect x="${-half}" y="${-half}" width="${size}" height="${size}" rx="${num(r)}" ${paint}/>`;
  const face = `scale(1 ${num(Math.tan(Math.PI / 6) * 1000) / 1000}) rotate(45)`;
  const split = `<stop offset=".5" stop-color="${look.side[0]}"/><stop offset=".5" stop-color="${look.side[1]}"/>`;
  const across = s.def(`${key}-across`, `<linearGradient id="$ID">${split}</linearGradient>`);
  const turned = s.def(`${key}-turned`, `<linearGradient id="$ID" gradientUnits="userSpaceOnUse" x1="${-half}" y1="${half}" x2="${half}" y2="${-half}">${split}</linearGradient>`);
  s.def(key, `<g id="$ID"><g transform="translate(0 ${height}) ${face}">${square(`fill="${turned}"`)}</g><rect x="${num(-width)}" width="${num(2 * width)}" height="${height}" fill="${across}"/><g transform="${face}">${square(`fill="${look.top}"`)}${square(`fill="none" stroke="${look.edge}" vector-effect="non-scaling-stroke"`)}</g></g>`);
  return (at: readonly [number, number, number]) => {
    const [x, y] = s.project(at);
    return `<use href="#${s.ref(key)}" x="${num(x)}" y="${num(y)}"/>`;
  };
}

export function storyScene(story: Story, v: Variant): Scene {
  const s = new Scene(options(`hero-${story.slug}-${frames[v].suffix}`, v, story.origin[v]));
  story.draw(s, v);
  s.introUntil(story.enter);
  return s.loop(story.loop, story.still);
}

export const storyArt = (story: Story): Art => art(storyScene(story, 'compact'), storyScene(story, 'wide'), breakpoint);

function ground(name: string, v: Variant): Scene {
  const wide = v === 'wide';
  const [w, h] = [frames[v].width, frames[v].height];
  const at: Vec2 = wide ? [w / 2, h / 2 + 10] : [w / 2, h / 2 + 5];
  const [size, pitch] = wide ? [900, 24] : [640, 18];
  const s = new Scene({ ...options(name, v, at) });
  const dots = s.def('ground-dots', `<pattern id="$ID" patternUnits="userSpaceOnUse" width="${pitch}" height="${pitch}"><circle cx="${pitch / 2}" cy="${pitch / 2}" r="1.1" fill="rgb(22 23 27 / .11)"/></pattern>`);
  const fade = s.def('ground-fade', `<radialGradient id="$ID"><stop offset=".35" stop-color="${ui.page}" stop-opacity="0"/><stop offset=".72" stop-color="${ui.page}"/></radialGradient>`);
  s.face({ id: 'ground', at: [0, 0, 0], size: [size, size], radius: 0, fill: dots });
  s.face({ id: 'ground-veil', at: [0, 0, 0], size: [size * 1.02, size * 1.02], radius: 0, fill: fade });
  return s;
}

export const stageArt = (): Art => art(ground('hero-stage-sm', 'compact'), ground('hero-stage-lg', 'wide'), breakpoint);

interface Seg {
  target: string;
  prop: AnimatedProp;
  start: number;
  dur: number;
  from: string | number;
  to: string | number;
  easing: string;
}

class Slot extends Scene {
  readonly queue: Seg[] = [];
  unwire = 0;
  private readonly rest = new Map<string, { intro: boolean; start: number; value: string | number }>();
  readonly story: Story;

  constructor(opts: SceneOptions, story: Story) {
    super(opts);
    this.story = story;
  }

  private remember(key: string, intro: boolean, start: number, value: string | number) {
    const was = this.rest.get(key);
    const wins = !was || (intro && (!was.intro || start < was.start)) || (!intro && !was.intro && start >= was.start);
    if (wins) this.rest.set(key, { intro, start, value });
  }

  override intro<P extends AnimatedProp>(target: string, prop: P, start: number, dur: number, from: ValueOf<P>, to: ValueOf<P>, easing: string = ease.io): this {
    this.remember(`${target}|${prop}`, true, start, from);
    this.queue.push({ target, prop, start, dur, from, to, easing });
    return this;
  }

  override at<P extends AnimatedProp>(target: string, prop: P, start: number, dur: number, from: ValueOf<P>, to: ValueOf<P>, easing: string = ease.io): this {
    this.remember(`${target}|${prop}`, false, start, to);
    if (start < this.story.peak) this.queue.push({ target, prop, start: this.story.enter + start, dur, from, to, easing });
    return this;
  }

  override introUntil(): this {
    return this;
  }

  override loop(): this {
    return this;
  }

  get exit() {
    return this.story.enter + this.story.peak;
  }

  private atExit(target: string, prop: 'strokeDashoffset' | 'opacity', unset: number) {
    const segs = this.queue.filter(q => q.target === target && q.prop === prop && q.start < this.exit);
    if (segs.some(q => q.start + q.dur > this.exit)) throw new Error(`hero reel ${this.name}: ${target}.${prop} is still moving at the peak ${this.exit.toFixed(2)}s; let it finish first`);
    const last = segs.reduce<Seg | undefined>((a, q) => (!a || q.start > a.start ? q : a), undefined);
    return Number(last?.to ?? unset);
  }

  lift() {
    const { wires, pulses, pins, labels } = wiresOf(this);
    const drawn = wires.map(w => ({ w, at: this.atExit(w, 'strokeDashoffset', 1) })).filter(({ at }) => Math.abs(at) < 1);
    this.unwire = unwireTime(drawn.length > 0, pins.length > 0);
    const fade = (ids: string[], start: number, dur: number) => {
      for (const id of ids) {
        const from = this.atExit(id, 'opacity', 1);
        if (from > 0) this.queue.push({ target: id, prop: 'opacity', start, dur, from, to: 0, easing: ease.linear });
      }
    };
    if (drawn.length) {
      fade([...pulses, ...labels], this.exit, lift.stop);
      for (const { w, at } of drawn) this.queue.push({ target: w, prop: 'strokeDashoffset', start: this.exit + lift.stop, dur: lift.retract, from: at, to: at < 0 ? -hidden : hidden, easing: lift.retractEase });
      fade(pins, this.exit + lift.stop + lift.retract, lift.unpin);
    }
    const pieces = [...piecesOf(this)].reverse();
    pieces.forEach((id, i) => {
      const t = this.exit + this.unwire + i * lift.stagger;
      if (!this.rest.has(`${id}|opacity`)) this.queue.push({ target: id, prop: 'opacity', start: 0, dur: 0.001, from: 1, to: 1, easing: ease.linear });
      this.queue.push(
        { target: id, prop: 'translate', start: t, dur: lift.dur, from: '0 0', to: `0 ${-lift.distance}px`, easing: lift.ease },
        { target: id, prop: 'opacity', start: t + lift.dur * lift.fadeFrom, dur: lift.dur * (1 - lift.fadeFrom), from: 1, to: 0, easing: ease.linear },
      );
    });
    const reset = this.exit + liftTime(pieces.length, this.unwire) + 0.05;
    const late = this.queue.find(q => q.start + q.dur > reset);
    if (late) throw new Error(`hero reel ${this.name}: ${late.target}.${late.prop} runs until ${(late.start + late.dur).toFixed(2)}s, past the lift-off at ${reset.toFixed(2)}s; end it before the peak`);
    const keys = new Map(this.queue.map(q => [`${q.target}|${q.prop}`, q] as const));
    for (const [key, q] of keys) {
      const value = q.prop === 'opacity' && pieces.includes(q.target) ? 0 : (this.rest.get(key)?.value ?? q.from);
      this.queue.push({ ...q, start: reset, dur: 0.001, from: value, to: value, easing: ease.linear });
    }
    return reset;
  }

  flush(offset: number, total: number, still: number) {
    for (const q of this.queue) {
      const t = ((Number((offset + q.start).toFixed(3)) % total) + total) % total;
      if (t + q.dur > total + 1e-6) throw new Error(`hero reel ${this.name}: ${q.target}.${q.prop} at ${q.start.toFixed(2)}s crosses the loop seam`);
      super.at(q.target, q.prop, t, q.dur, q.from, q.to, q.easing);
    }
    super.loop(total, still);
  }
}

const cards: Record<Variant, { height: number; x: number; y: number; w: number; h: number; text: number; head: number }> = {
  wide: { height: 120, x: 24, y: 20, w: 600, h: 100, text: 20, head: 15 },
  compact: { height: 100, x: 16, y: 16, w: 358, h: 80, text: 12, head: 12 },
};
const terminal = { bg: '#17181d', line: 'rgb(255 255 255 / .1)', ink: '#ececef', muted: '#8b8d98', dot: '#3f414b', accent: '#c4b5fd' };

function card(v: Variant, slots: readonly { story: Story; sent: number }[], total: number, still: number): Scene {
  const c = cards[v];
  const s = new Scene({ ...options(`hero-reel-card-${frames[v].suffix}`, v, [0, 0]), height: c.height });
  const rect = `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="12" fill="${terminal.bg}" stroke="${terminal.line}"/>`;
  s.svg('card', rect + [0, 1, 2].map(i => `<circle cx="${c.x + 20 + i * 12}" cy="${c.y + 20}" r="3.5" fill="${terminal.dot}"/>`).join(''));
  s.text({ id: 'card-head', at: { screen: [c.x + 62, c.y + 20] }, text: 'claude', size: c.head, color: terminal.muted, font: 'mono' });
  const line: Vec2 = [c.x + 20, c.y + c.h - 26];
  const charW = c.text * 0.6;
  const typed: Vec2 = [line[0] + charW * 2, line[1]];
  s.text({ id: 'chevron', at: { screen: line }, text: '>', size: c.text, color: terminal.accent });
  const wrap = (t: number) => ((t % total) + total) % total;
  const caretAt: { start: number; chars: number }[] = [];
  slots.forEach(({ story, sent }, i) => {
    const chars = [...story.prompt].length;
    const start = wrap(sent - typeTime(story.prompt) + typing.lead);
    const next = slots[(i + 1) % slots.length]!;
    const gone = wrap(next.sent - typeTime(next.story.prompt) + typing.lead);
    const id = `prompt-${story.slug}`;
    s.text({ id, at: { screen: typed }, text: story.prompt, size: c.text, color: terminal.ink });
    s.at(id, 'clipPath', start, chars * typing.step, 'inset(-20% 100% -20% 0)', 'inset(-20% 0% -20% 0)', `steps(${chars}, end)`);
    s.set(id, 'clipPath', wrap(gone - 0.01), 'inset(-20% 100% -20% 0)');
    caretAt.push({ start, chars });
  });
  s.group('caret', () => s.svg('caret-blink', `<rect x="${typed[0] + 1.5}" y="${typed[1] - c.text * 0.62}" width="${Math.max(1.5, c.text * 0.09)}" height="${c.text * 1.24}" rx="1" fill="${terminal.accent}"/>`));
  s.ambient('caret-blink', 'opacity', 1.1, [1, 1, 0, 0, 1], 'steps(1, end)');
  for (const { start, chars } of caretAt) {
    s.at('caret', 'translate', start, chars * typing.step, '0 0', `${chars * charW}px 0`, `steps(${chars}, end)`);
    s.set('caret', 'translate', wrap(start - typing.lead + 0.02), '0 0');
  }
  return s.loop(total, still);
}

export function reel(stories: readonly Story[], v: Variant, title: string): string {
  const slots = stories.map(story => {
    const slot = new Slot(options(`hero-reel-${story.slug}-${frames[v].suffix}`, v, story.origin[v]), story);
    story.draw(slot, v);
    slot.lift();
    return slot;
  });
  const handovers = slots.map(sl => handoverAfter(piecesOf(sl).length, sl.unwire));
  const lengths = slots.map((sl, i) => Math.round((sl.exit + handovers[i]!) * 1000) / 1000);
  const total = Math.round(lengths.reduce((a, b) => a + b, 0) * 1000) / 1000;
  const lead = handovers[handovers.length - 1]!;
  const offsets = lengths.map((_, i) => Math.round((lead + lengths.slice(0, i).reduce((a, b) => a + b, 0)) * 1000) / 1000);
  const still = offsets[0]! + slots[0]!.story.enter + slots[0]!.story.still;
  slots.forEach((sl, i) => sl.flush(offsets[i]!, total, still));
  const sent = slots.map((sl, i) => ({ story: sl.story, sent: offsets[i]! - handovers[(i + slots.length - 1) % slots.length]! }));
  const c = cards[v];
  const { width, height } = frames[v];
  const nest = (svg: string, y: number) => svg.replace(/^<svg /, `<svg x="0" y="${y}" `);
  const body = [nest(ground(`hero-reel-stage-${frames[v].suffix}`, v).exportSvg(), c.height), ...slots.map(sl => nest(sl.exportSvg(), c.height)), nest(card(v, sent, total, still).exportSvg(), 0)].join('');
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height + c.height}" width="${width}" height="${height + c.height}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><rect width="100%" height="100%" fill="${ui.page}" rx="24"/>${body}</svg>`;
}
