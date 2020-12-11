/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientSocketMessageMap, SOCKET_CLIENT_MESSAGE } from '../constants/socket-client-message.const';
import { A_SOCKET_CLIENT_TYPE } from '../constants/socket-client-type.const';
import { SocketServerMessageMap, SOCKET_SERVER_MESSAGE } from '../constants/socket-server-message.const';
import { Listener } from './listener.type';

declare global {
  namespace Express {
    interface Application {
      developmentEnvironmentCompiling: boolean,
    }
  }

  // Socket connection on the client
  namespace SocketIOClient {
    interface Socket {
      // standard protocol
      on(event: 'connect', listener: Listener<undefined>): any;
      once(event: 'connect', listener: Listener<undefined>): any;
      on(event: 'connect_timeout', listener: Listener<number | any>): any;
      once(event: 'connect_timeout', listener: Listener<number | any>): any;
      on(event: 'connect_error', listener: Listener<Error | any>): any;
      once(event: 'connect_error', listener: Listener<Error | any>): any;
      on(event: 'error', listener: Listener<Error | any>): any;
      once(event: 'error', listener: Listener<Error | any>): any;
      on(event: 'disconnect', listener: Listener<string>): any;
      once(event: 'disconnect', listener: Listener<string>): any;
      on(event: 'error', listener: Listener<Error | any>): any;
      once(event: 'error', listener: Listener<Error | any>): any;
      on(event: 'pong', listener: Listener<number | any>): any;
      once(event: 'pong', listener: Listener<number | any>): any;

      // CLIENT -> SERVER
      emit(event: SOCKET_CLIENT_MESSAGE['AUTH'], payload?: ClientSocketMessageMap[SOCKET_CLIENT_MESSAGE['AUTH']]): any;
      emit(event: SOCKET_CLIENT_MESSAGE['COMMAND'], payload?: ClientSocketMessageMap[SOCKET_CLIENT_MESSAGE['COMMAND']]): any;

      // SERVER -> CLIENT
      on(event: SOCKET_SERVER_MESSAGE['CHALLENGE'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['CHALLENGE']]>): any;
      once(event: SOCKET_SERVER_MESSAGE['CHALLENGE'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['CHALLENGE']]>): any;
      addEventListener(event: SOCKET_SERVER_MESSAGE['CHALLENGE'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['CHALLENGE']]>): any;

      on(event: SOCKET_SERVER_MESSAGE['AUTHORIZED'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['AUTHORIZED']]>): any;
      once(event: SOCKET_SERVER_MESSAGE['AUTHORIZED'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['AUTHORIZED']]>): any;
      addEventListener(event: SOCKET_SERVER_MESSAGE['AUTHORIZED'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['AUTHORIZED']]>): any;

      on(event: SOCKET_SERVER_MESSAGE['UNAUTHORIZED'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['UNAUTHORIZED']]>): any;
      once(event: SOCKET_SERVER_MESSAGE['UNAUTHORIZED'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['UNAUTHORIZED']]>): any;
      addEventListener(event: SOCKET_SERVER_MESSAGE['UNAUTHORIZED'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['UNAUTHORIZED']]>): any;

      on(event: SOCKET_SERVER_MESSAGE['BOT_STATUS'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['BOT_STATUS']]>): any;
      once(event: SOCKET_SERVER_MESSAGE['BOT_STATUS'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['BOT_STATUS']]>): any;
      addEventListener(event: SOCKET_SERVER_MESSAGE['BOT_STATUS'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['BOT_STATUS']]>): any;

      on(event: SOCKET_SERVER_MESSAGE['DRIVE_INPUT_STATUS'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['DRIVE_INPUT_STATUS']]>): any;
      once(event: SOCKET_SERVER_MESSAGE['DRIVE_INPUT_STATUS'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['DRIVE_INPUT_STATUS']]>): any;
      addEventListener(event: SOCKET_SERVER_MESSAGE['DRIVE_INPUT_STATUS'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['DRIVE_INPUT_STATUS']]>): any;

      on(event: SOCKET_SERVER_MESSAGE['PAN_TILT_INPUT_STATUS'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['PAN_TILT_INPUT_STATUS']]>): any;
      once(event: SOCKET_SERVER_MESSAGE['PAN_TILT_INPUT_STATUS'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['PAN_TILT_INPUT_STATUS']]>): any;
      addEventListener(event: SOCKET_SERVER_MESSAGE['PAN_TILT_INPUT_STATUS'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['PAN_TILT_INPUT_STATUS']]>): any;

      on(event: SOCKET_SERVER_MESSAGE['POWER_STATUS'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['POWER_STATUS']]>): any;
      once(event: SOCKET_SERVER_MESSAGE['POWER_STATUS'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['POWER_STATUS']]>): any;
      addEventListener(event: SOCKET_SERVER_MESSAGE['POWER_STATUS'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['POWER_STATUS']]>): any;

      on(event: SOCKET_SERVER_MESSAGE['EVENT_SHUT_DOWN'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['EVENT_SHUT_DOWN']]>): any;
      once(event: SOCKET_SERVER_MESSAGE['EVENT_SHUT_DOWN'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['EVENT_SHUT_DOWN']]>): any;
      addEventListener(event: SOCKET_SERVER_MESSAGE['EVENT_SHUT_DOWN'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['EVENT_SHUT_DOWN']]>): any;
    }
  }

  // Socket connection on the server
  namespace SocketIO {
    interface Socket {
      clientType: A_SOCKET_CLIENT_TYPE;
      authTimeout: ReturnType<typeof setTimeout>;
      authKey: null | string;

      // standard protocol
      on(event: 'disconnect', listener: Listener<string>): any;
      once(event: 'disconnect', listener: Listener<string>): any;
      on(event: 'error', listener: Listener<Error | any>): any;
      once(event: 'error', listener: Listener<Error | any>): any;

      // SERVER -> CLIENT
      emit(event: SOCKET_SERVER_MESSAGE['CHALLENGE'], payload?: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['CHALLENGE']]): any;
      emit(event: SOCKET_SERVER_MESSAGE['AUTHORIZED'], payload: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['AUTHORIZED']]): any;
      emit(event: SOCKET_SERVER_MESSAGE['UNAUTHORIZED'], payload: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['UNAUTHORIZED']]): any;
      emit(event: SOCKET_SERVER_MESSAGE['BOT_STATUS'], payload: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['BOT_STATUS']]): any;
      emit(event: SOCKET_SERVER_MESSAGE['DRIVE_INPUT_STATUS'], payload: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['DRIVE_INPUT_STATUS']]): any;
      emit(event: SOCKET_SERVER_MESSAGE['PAN_TILT_INPUT_STATUS'], payload: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['PAN_TILT_INPUT_STATUS']]): any;
      emit(event: SOCKET_SERVER_MESSAGE['POWER_STATUS'], payload: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['POWER_STATUS']]): any;
      emit(event: SOCKET_SERVER_MESSAGE['EVENT_SHUT_DOWN'], payload: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['EVENT_SHUT_DOWN']]): any;

      // CLIENT -> SERVER
      on(event: SOCKET_CLIENT_MESSAGE['AUTH'], listener: Listener<ClientSocketMessageMap[SOCKET_CLIENT_MESSAGE['AUTH']]>): any;
      once(event: SOCKET_CLIENT_MESSAGE['AUTH'], listener: Listener<ClientSocketMessageMap[SOCKET_CLIENT_MESSAGE['AUTH']]>): any;
      addEventListener(event: SOCKET_CLIENT_MESSAGE['AUTH'], listener: Listener<ClientSocketMessageMap[SOCKET_CLIENT_MESSAGE['AUTH']]>): any;

      on(event: SOCKET_CLIENT_MESSAGE['COMMAND'], listener: Listener<ClientSocketMessageMap[SOCKET_CLIENT_MESSAGE['COMMAND']]>): any;
      once(event: SOCKET_CLIENT_MESSAGE['COMMAND'], listener: Listener<ClientSocketMessageMap[SOCKET_CLIENT_MESSAGE['COMMAND']]>): any;
      addEventListener(event: SOCKET_CLIENT_MESSAGE['COMMAND'], listener: Listener<ClientSocketMessageMap[SOCKET_CLIENT_MESSAGE['COMMAND']]>): any;
    }
  }
}
