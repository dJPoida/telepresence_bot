export const LED_STRIP_EVENT = {
  INITIALISED: 'initialised',
} as const;

export type LED_STRIP_EVENT = typeof LED_STRIP_EVENT;
export type A_LED_STRIP_EVENT = LED_STRIP_EVENT[keyof LED_STRIP_EVENT];

/**
 * Event Payloads
 */
export interface LEDStripEventPayload {
  [LED_STRIP_EVENT.INITIALISED]: undefined;
}
