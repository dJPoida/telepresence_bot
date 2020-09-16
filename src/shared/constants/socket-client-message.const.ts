import { ClientCommand } from "./client-command.const";

/**
 * @description
 * Messages sent by the Socket Client to the Server
 */
export const SOCKET_CLIENT_MESSAGE = {
  // Sent when the client first connects to authenticate
  AUTH: 'auth',

  // A command that should be interpreted by the server
  COMMAND: 'cmd',
} as const;
export type SOCKET_CLIENT_MESSAGE = typeof SOCKET_CLIENT_MESSAGE
export type A_SOCKET_CLIENT_MESSAGE = SOCKET_CLIENT_MESSAGE[keyof SOCKET_CLIENT_MESSAGE];

/**
 * @description
 * Payload map from the Socket Client messages
 */
export interface ClientSocketMessagePayload {
  [SOCKET_CLIENT_MESSAGE.AUTH]: { key: string };
  [SOCKET_CLIENT_MESSAGE.COMMAND]: ClientCommand;
}
