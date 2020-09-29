import { ClientCommandPayload } from '../../shared/constants/client-command.const';

/**
 * Event Names
 */
export const SOCKET_SERVER_EVENT = {
  INITIALISED: 'initialised',
  CLIENT_CONNECTED: 'client_connected',
  CLIENT_DISCONNECTED: 'client_disconnected',
  CLIENT_COMMAND: 'client_command',
} as const;
export type SOCKET_SERVER_EVENT = typeof SOCKET_SERVER_EVENT;
export type A_SOCKET_SERVER_EVENT = SOCKET_SERVER_EVENT[keyof SOCKET_SERVER_EVENT];

/**
 * Event Payloads
 */
export interface SocketServerEventMap {
  [SOCKET_SERVER_EVENT.INITIALISED]: undefined;
  [SOCKET_SERVER_EVENT.CLIENT_CONNECTED]: { socket: SocketIO.Socket, connectedClientCount: number };
  [SOCKET_SERVER_EVENT.CLIENT_DISCONNECTED]: { socket: SocketIO.Socket, connectedClientCount: number };
  [SOCKET_SERVER_EVENT.CLIENT_COMMAND]: { socket: SocketIO.Socket, command: ClientCommandPayload };
}
