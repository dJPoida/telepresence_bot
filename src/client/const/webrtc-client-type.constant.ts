export const WEBRTC_CLIENT_TYPE = {
  CALLER: 'caller',
  RECEIVER: 'receiver',
} as const;
export type WEBRTC_CLIENT_TYPE = typeof WEBRTC_CLIENT_TYPE;
export type A_WEBRTC_CLIENT_TYPE = WEBRTC_CLIENT_TYPE[keyof WEBRTC_CLIENT_TYPE];
