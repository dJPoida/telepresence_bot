/**
 * Event Names
 */
export const VIDEO_MANAGER_EVENT = {
  // Fired when the Video Manager is initialised
  INITIALISED: 'initialised',
  CONTROLLER_PEER_ID_CHANGED: 'controllerPeerIdChanged',
  DISPLAY_PEER_ID_CHANGED: 'displayPeerIdChanged',
} as const;
export type VIDEO_MANAGER_EVENT = typeof VIDEO_MANAGER_EVENT;
export type A_VIDEO_MANAGER_EVENT = VIDEO_MANAGER_EVENT[keyof VIDEO_MANAGER_EVENT];

/**
 * Event Payloads
 */
export interface VideoManagerEventMap {
  [VIDEO_MANAGER_EVENT.INITIALISED]: undefined;
  [VIDEO_MANAGER_EVENT.CONTROLLER_PEER_ID_CHANGED]: {peerId: null | string};
  [VIDEO_MANAGER_EVENT.DISPLAY_PEER_ID_CHANGED]: {peerId: null | string};
}
