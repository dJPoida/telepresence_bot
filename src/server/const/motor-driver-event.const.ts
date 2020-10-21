export const MOTOR_DRIVER_EVENT = {
  INITIALISED: 'initialised',
} as const;

export type MOTOR_DRIVER_EVENT = typeof MOTOR_DRIVER_EVENT;
export type A_MOTOR_DRIVER_EVENT = MOTOR_DRIVER_EVENT[keyof MOTOR_DRIVER_EVENT];

/**
 * Event Payloads
 */
export interface MotorDriverEventPayload {
  [MOTOR_DRIVER_EVENT.INITIALISED]: undefined;
}
