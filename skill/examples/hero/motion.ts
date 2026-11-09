export const typing = { lead: 0.4, step: 0.035, send: 0.25 } as const;
export const quickTyping = { lead: 0.05, step: 0.014, send: 0.1 } as const;
export type Typing = typeof typing | typeof quickTyping;

export const typeTime = (prompt: string, t: Typing = typing) => t.lead + [...prompt].length * t.step + t.send;

export const lift = {
  stagger: 0.02,
  dur: 0.55,
  distance: 64,
  fadeFrom: 0.1,
  ease: 'cubic-bezier(.33,0,.67,.33)',
} as const;

export const liftTime = (pieces: number) => Math.max(0, pieces - 1) * lift.stagger + lift.dur;

export const handoverAfter = (pieces: number) => Math.max(0.25, liftTime(pieces) * 0.55);

export const holdAfterPick = 12;
