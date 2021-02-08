export const WEBRTC_STATE = {
  // Web RTC has not yet been initialised
  INITIALISING: 'initialising',
  
  // Error occurred while initialising the capture devices (typically no camera or microphone available)
  DEVICE_ERROR: 'deviceError',

  // Error occurred while connecting to the Peer Server
  PEER_ERROR: 'peerError',
  
  // User has ignored the errors and declared they don't need WebRTC (only available on local networks)
  NOT_AVAILABLE: 'notAvailable',

  // Devices have been initialised and are ready to be bound to the call
  DEVICES_AVAILABLE: 'devicesAvailable',

  // Attempt to establish a call with the remote has resulted in an error
  CALL_ERROR: 'callError',
  
  // The server is not reporting the presence of a remote peer
  NO_REMOTE_AVAILABLE: 'noRemoteAvailable',
  
  // Everything is ready for the user to call the remote client
  READY: 'ready',
  
  // The webRTC call is connecting
  CALLING: 'connecting',
  
  // The webRTC call is connected and in progress
  CONNECTED: 'connected',
} as const;
export type WEBRTC_STATE = typeof WEBRTC_STATE;
export type A_WEBRTC_STATE = WEBRTC_STATE[keyof WEBRTC_STATE];
