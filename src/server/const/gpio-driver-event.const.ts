export const GPIO_DRIVER_EVENT = {
  INITIALISED: 'initialised',
} as const;

export type GPIO_DRIVER_EVENT = typeof GPIO_DRIVER_EVENT;
export type A_GPIO_DRIVER_EVENT = GPIO_DRIVER_EVENT[keyof GPIO_DRIVER_EVENT];

/**
 * Event Payloads
 */
export interface GPIODriverEventMap {
  [GPIO_DRIVER_EVENT.INITIALISED]: undefined;
}
