import type { Example, Level } from '../../skill/examples/shared';

export const levels: Record<Level, { name: string; note: string; rank: 1 | 2 | 3 }> = {
  simple: { name: 'Simple', note: 'One idea and a handful of objects.', rank: 1 },
  medium: { name: 'Medium', note: 'A flow with a branch, a state change or a choice.', rank: 2 },
  complex: { name: 'Complex', note: 'A whole system, drawn wide.', rank: 3 },
};

export const levelOrder = ['simple', 'medium', 'complex'] as const satisfies readonly Level[];

export const hints: Record<Example['interaction'], { fine: string; coarse: string } | null> = {
  watch: null,
  hover: { fine: 'Hover', coarse: 'Tap' },
  play: { fine: 'Click to play', coarse: 'Tap to play' },
};

export const repo = 'https://github.com/GA-MO/isokit';

export const markSvg =
  '<path d="M12 13.5 3 8.5v3l9 5 9-5v-3z" fill="#5b21b6"/><path d="M12 3.5 3 8.5l9 5 9-5z" fill="#c4b5fd"/><path d="M12 17.5 3 12.5v3l9 5 9-5v-3z" fill="#3f3f46"/>';
