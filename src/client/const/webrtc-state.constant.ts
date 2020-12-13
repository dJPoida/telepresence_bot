export const WEBRTC_STATE = {
  INITIALISING: 'initialising',
  ERROR: 'error',
  DEVICES_AVAILABLE: 'devicesAvailable',
  READY: 'ready',
  CALLING: 'connecting',
  CONNECTED: 'connected',
} as const;
export type WEBRTC_STATE = typeof WEBRTC_STATE;
export type A_WEBRTC_STATE = WEBRTC_STATE[keyof WEBRTC_STATE];
