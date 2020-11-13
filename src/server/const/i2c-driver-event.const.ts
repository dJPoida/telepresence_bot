export const I2C_DRIVER_EVENT = {
  INITIALISED: 'initialised',
} as const;

export type I2C_DRIVER_EVENT = typeof I2C_DRIVER_EVENT;
export type A_I2C_DRIVER_EVENT = I2C_DRIVER_EVENT[keyof I2C_DRIVER_EVENT];

/**
 * Event Payloads
 */
export interface I2CDriverEventMap {
  [I2C_DRIVER_EVENT.INITIALISED]: undefined;
}
