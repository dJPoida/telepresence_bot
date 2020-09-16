export const SOCKET_CLIENT_TYPE = {
  CONTROL: 'control',
  DISPLAY: 'display',
  CONFIG: 'config',
} as const;
export type SOCKET_CLIENT_TYPE = typeof SOCKET_CLIENT_TYPE;
export type A_SOCKET_CLIENT_TYPE = SOCKET_CLIENT_TYPE[keyof SOCKET_CLIENT_TYPE];
