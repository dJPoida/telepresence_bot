import { A_WEBRTC_CLIENT_TYPE } from '../../client/const/webrtc-client-type.constant';
import { ClientCommandPayload } from './client-command.const';

/**
 * @description
 * Messages sent by the Socket Client to the Server
 */
export const SOCKET_CLIENT_MESSAGE = {
  // Sent when the client first connects to authenticate
  AUTH: 'auth',

  // Set either the control or display peer ID for the socket connection
  SET_PEER_ID: 'setPeerId',

  // A command that should be interpreted by the server
  COMMAND: 'cmd',
} as const;
export type SOCKET_CLIENT_MESSAGE = typeof SOCKET_CLIENT_MESSAGE
export type A_SOCKET_CLIENT_MESSAGE = SOCKET_CLIENT_MESSAGE[keyof SOCKET_CLIENT_MESSAGE];

/**
 * @description
 * Message Type map from the Socket Client messages
 */
export interface ClientSocketMessageMap {
  [SOCKET_CLIENT_MESSAGE.AUTH]: { key: string };
  [SOCKET_CLIENT_MESSAGE.SET_PEER_ID]: { clientType: A_WEBRTC_CLIENT_TYPE, peerId: string | null };
  [SOCKET_CLIENT_MESSAGE.COMMAND]: ClientCommandPayload;
}

/**
 * @description
 * Payload map from the Socket Client messages
 */
export type ClientSocketMessagePayload =
| { type: SOCKET_CLIENT_MESSAGE['AUTH'], payload: ClientSocketMessageMap[SOCKET_CLIENT_MESSAGE['AUTH']] }
| { type: SOCKET_CLIENT_MESSAGE['SET_PEER_ID'], payload: ClientSocketMessageMap[SOCKET_CLIENT_MESSAGE['SET_PEER_ID']] }
| { type: SOCKET_CLIENT_MESSAGE['COMMAND'], payload: ClientSocketMessageMap[SOCKET_CLIENT_MESSAGE['COMMAND']] }
