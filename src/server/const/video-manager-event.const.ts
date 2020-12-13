/**
 * Event Names
 */
export const VIDEO_MANAGER_EVENT = {
  // Fired when the Video Manager is initialised
  INITIALISED: 'initialised',
} as const;
export type VIDEO_MANAGER_EVENT = typeof VIDEO_MANAGER_EVENT;
export type A_VIDEO_MANAGER_EVENT = VIDEO_MANAGER_EVENT[keyof VIDEO_MANAGER_EVENT];

/**
 * Event Payloads
 */
export interface VideoManagerEventMap {
  [VIDEO_MANAGER_EVENT.INITIALISED]: undefined;
}
