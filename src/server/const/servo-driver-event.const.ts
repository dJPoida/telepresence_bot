export const SERVO_DRIVER_EVENT = {
  INITIALISED: 'initialised',
} as const;

export type SERVO_DRIVER_EVENT = typeof SERVO_DRIVER_EVENT;
export type A_SERVO_DRIVER_EVENT = SERVO_DRIVER_EVENT[keyof SERVO_DRIVER_EVENT];

/**
 * Event Payloads
 */
export interface ServoDriverEventMap {
  [SERVO_DRIVER_EVENT.INITIALISED]: undefined;
}
