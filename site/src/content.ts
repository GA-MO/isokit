import { surfaces, type Example, type Intent, type Surface } from '../../skill/examples/shared';

export const intentNames: Record<Intent, { name: string; note: string }> = {
  flow: { name: 'How data flows', note: 'Something moves from one place to the next.' },
  scale: { name: 'How it scales', note: 'More load, more workers, more copies.' },
  inside: { name: "What's inside", note: 'Open the box and show its layers.' },
  change: { name: 'Before and after', note: 'A system before and after something happens.' },
  choose: { name: 'Pick one', note: 'One option wins, and the viewer sees why.' },
  talk: { name: 'Who talks to whom', note: 'The parties in a request and the order they speak in.' },
};

export const hints: Record<Example['interaction'], { fine: string; coarse: string } | null> = {
  watch: null,
  hover: { fine: 'Hover', coarse: 'Tap' },
  play: { fine: 'Click to play', coarse: 'Tap to play' },
  drag: { fine: 'Drag', coarse: 'Drag' },
  explore: { fine: 'Click a part', coarse: 'Tap a part' },
};

export const repo = 'https://github.com/GA-MO/isokit';

export const markSvg =
  '<path d="M12 13.5 3 8.5v3l9 5 9-5v-3z" fill="#5b21b6"/><path d="M12 3.5 3 8.5l9 5 9-5z" fill="#c4b5fd"/><path d="M12 17.5 3 12.5v3l9 5 9-5v-3z" fill="#3f3f46"/>';

const accents: Record<Surface, string> = { light: '#6d28d9', night: '#c4b5fd', dark: '#a78bfa' };

const vars = (name: Surface) => {
  const s = surfaces[name];
  return `--surface-bg:${s.card};--surface-backdrop:${'backdrop' in s ? s.backdrop : 'none'};--surface-ink:${s.ink};--surface-muted:${s.muted};--surface-line:${s.label.border};--surface-well:${s.label.bg};--surface-accent:${accents[name]};`;
};

const night = surfaces.night;

export const surfaceCss =
  (['light', 'night', 'dark'] as const).map(name => `.surface-${name}{${vars(name)}}`).join('') +
  `.band-night{--color-page:${night.page};--color-panel:${night.card};--color-raised:${night.label.bg};--color-ink:${night.ink};--color-muted:${night.muted};--color-line:${night.label.border};--color-line-strong:rgb(199 210 254 / .32);--color-accent:#c4b5fd;background:${night.page} ${night.backdrop};color:${night.ink}}`;
