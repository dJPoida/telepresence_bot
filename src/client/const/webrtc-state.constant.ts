export const WEBRTC_STATE = {
  INITIALISING: 'initialising',
  DEVICE_ERROR: 'deviceError',
  PEER_ERROR: 'peerError',
  CALL_ERROR: 'callError',
  DEVICES_AVAILABLE: 'devicesAvailable',
  NO_REMOTE_AVAILABLE: 'noRemoteAvailable',
  READY: 'ready',
  CALLING: 'connecting',
  CONNECTED: 'connected',
} as const;
export type WEBRTC_STATE = typeof WEBRTC_STATE;
export type A_WEBRTC_STATE = WEBRTC_STATE[keyof WEBRTC_STATE];
