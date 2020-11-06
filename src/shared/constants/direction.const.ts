export const DIRECTION = {
  REVERSE: -1,
  STATIONARY: 0,
  FORWARD: 1,
} as const;
export type DIRECTION = typeof DIRECTION;
export type A_DIRECTION = DIRECTION[keyof DIRECTION];
