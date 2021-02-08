export const PCA9685_DRIVER_EVENT = {
  INITIALISED: 'initialised',
} as const;

export type PCA9685_DRIVER_EVENT = typeof PCA9685_DRIVER_EVENT;
export type A_PCA9685_DRIVER_EVENT = PCA9685_DRIVER_EVENT[keyof PCA9685_DRIVER_EVENT];

/**
 * Event Payloads
 */
export interface PCA9685DriverEventMap {
  [PCA9685_DRIVER_EVENT.INITIALISED]: undefined;
}
