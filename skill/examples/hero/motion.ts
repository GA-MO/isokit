export const typing = { lead: 0.4, step: 0.035, send: 0.25 } as const;
export const quickTyping = { lead: 0.05, step: 0.014, send: 0.1 } as const;
export type Typing = typeof typing | typeof quickTyping;

export const typeTime = (prompt: string, t: Typing = typing) => t.lead + [...prompt].length * t.step + t.send;

export const lift = {
  stagger: 0.035,
  dur: 0.6,
  distance: 64,
  fadeFrom: 0.2,
  ease: 'linear(0, -0.007 11.8%, -0.045 37.8%, -0.048 57%, -0.028 63.2%, 0.018 69.3%, 0.079 74.3%, 0.164 79.3%, 0.27 84%, 0.392 88.3%, 0.459 90.3%, 0.535 92.3%, 0.609 94%, 0.694 95.8%, 0.777 97.3%, 0.859 98.5%, 0.942 99.5%, 1)',
} as const;

export const liftTime = (pieces: number) => Math.max(0, pieces - 1) * lift.stagger + lift.dur;

export const handover = 0.45;

export const holdAfterPick = 12;
