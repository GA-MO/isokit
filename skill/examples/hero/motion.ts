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
  stop: 0.06,
  retract: 0.2,
  retractEase: 'cubic-bezier(.45,.86,.17,.96)',
  unpin: 0.06,
} as const;

export const hidden = 1.04;

export const unwireTime = (wired: boolean, pinned: boolean) => (wired ? lift.stop + lift.retract + (pinned ? lift.unpin : 0) : 0);

const pieceTime = (pieces: number) => Math.max(0, pieces - 1) * lift.stagger + lift.dur;

export const liftTime = (pieces: number, unwire: number) => unwire + pieceTime(pieces);

export const handoverAfter = (pieces: number, unwire: number) => unwire + Math.max(0.25, pieceTime(pieces) * 0.55);

export const holdAfterPick = 12;
