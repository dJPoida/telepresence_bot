// import { LogSummary } from '../browser-server-types/log.summary.type';

import { BotStatusDto } from '../types/bot-status.dto.type';

/**
 * Messages sent by the socket server
 */
export const SOCKET_SERVER_MESSAGE = {
  // Auth
  CHALLENGE: 'challenge',
  AUTHORIZED: 'authorized',
  UNAUTHORIZED: 'unauthorized',

  // Status
  BOT_STATUS: 'stat',
  DRIVE_INPUT_STATUS: 'dis',
  PAN_TILT_INPUT_STATUS: 'ptis',
  SPEED_INPUT_STATUS: 'sis',

  // Events
  EVENT_SHUT_DOWN: 'esd',

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

  [SOCKET_SERVER_MESSAGE.BOT_STATUS]: BotStatusDto;
  [SOCKET_SERVER_MESSAGE.DRIVE_INPUT_STATUS]: Pick<BotStatusDto, 'drive'>;
  [SOCKET_SERVER_MESSAGE.PAN_TILT_INPUT_STATUS]: Pick<BotStatusDto, 'panTilt'>;
  [SOCKET_SERVER_MESSAGE.SPEED_INPUT_STATUS]: Pick<BotStatusDto, 'speed'>;

  [SOCKET_SERVER_MESSAGE.EVENT_SHUT_DOWN]: { reason: string };

  // [SOCKET_SERVER_MESSAGE.LOG]: { logSummary: LogSummary };
}
