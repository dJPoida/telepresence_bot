export const SPEAKER_DRIVER_EVENT = {
  INITIALISED: 'initialised',
} as const;

export type SPEAKER_DRIVER_EVENT = typeof SPEAKER_DRIVER_EVENT;
export type A_SPEAKER_DRIVER_EVENT = SPEAKER_DRIVER_EVENT[keyof SPEAKER_DRIVER_EVENT];

/**
 * Event Payloads
 */
export interface SpeakerDriverEventMap {
  [SPEAKER_DRIVER_EVENT.INITIALISED]: undefined;
}
