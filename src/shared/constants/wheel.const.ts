export const WHEEL = {
  FRONT_LEFT: 0,
  FRONT_RIGHT: 1,
  REAR_LEFT: 2,
  REAR_RIGHT: 3,
} as const;
export type WHEEL = typeof WHEEL;
export type A_WHEEL = WHEEL[keyof WHEEL];
