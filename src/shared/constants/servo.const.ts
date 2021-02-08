export const SERVO = {
  PAN: 0,
  TILT: 1,
  TILT_LOCK: 2,
} as const;
export type SERVO = typeof SERVO;
export type A_SERVO = SERVO[keyof SERVO];
