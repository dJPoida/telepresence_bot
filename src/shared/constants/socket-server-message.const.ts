// import { LogSummary } from '../browser-server-types/log.summary.type';

/**
 * @description
 * Messages sent by the socket server
 */
export const SOCKET_SERVER_MESSAGE = {
  // Auth
  CHALLENGE: 'challenge',
  AUTHORIZED: 'authorized',
  UNAUTHORIZED: 'unauthorized',

  // Status
  STATUS: 'status',

  // Info
  // LOG: 'log', // TODO:
} as const;
export type SOCKET_SERVER_MESSAGE = typeof SOCKET_SERVER_MESSAGE;
export type A_SOCKET_SERVER_MESSAGE = SOCKET_SERVER_MESSAGE[keyof SOCKET_SERVER_MESSAGE];

/**
 * @description
 * Message Payload map from the socket server
 */
export interface SocketServerMessageMap {
  [SOCKET_SERVER_MESSAGE.CHALLENGE]: undefined;
  [SOCKET_SERVER_MESSAGE.AUTHORIZED]: undefined;
  [SOCKET_SERVER_MESSAGE.UNAUTHORIZED]: { reason: string };
  
  [SOCKET_SERVER_MESSAGE.STATUS]: { online: true }; // TODO: convert this to a dto

  // [SOCKET_SERVER_MESSAGE.LOG]: { logSummary: LogSummary };
}
