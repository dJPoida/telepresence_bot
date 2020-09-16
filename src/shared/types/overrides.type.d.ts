import Express = require('express');
import SocketIO = require('socket.io');
import { ClientSocketMessagePayload, SOCKET_CLIENT_MESSAGE } from '../constants/socket-client-message.const';
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

      // CLIENT -> SERVER
      emit(event: SOCKET_CLIENT_MESSAGE['AUTH'], payload?: ClientSocketMessagePayload[SOCKET_CLIENT_MESSAGE['AUTH']]): any;
      emit(event: SOCKET_CLIENT_MESSAGE['COMMAND'], payload?: ClientSocketMessagePayload[SOCKET_CLIENT_MESSAGE['COMMAND']]): any;

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

      on(event: SOCKET_SERVER_MESSAGE['STATUS'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['STATUS']]>): any;
      once(event: SOCKET_SERVER_MESSAGE['STATUS'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['STATUS']]>): any;
      addEventListener(event: SOCKET_SERVER_MESSAGE['STATUS'], listener: Listener<SocketServerMessageMap[SOCKET_SERVER_MESSAGE['STATUS']]>): any;
    }
  }    

  // Socket connection on the server
  namespace SocketIO {
    interface Socket {
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
      emit(event: SOCKET_SERVER_MESSAGE['STATUS'], payload: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['STATUS']]): any;

      // CLIENT -> SERVER
      on(event: SOCKET_CLIENT_MESSAGE['AUTH'], listener: Listener<ClientSocketMessagePayload[SOCKET_CLIENT_MESSAGE['AUTH']]>): any;
      once(event: SOCKET_CLIENT_MESSAGE['AUTH'], listener: Listener<ClientSocketMessagePayload[SOCKET_CLIENT_MESSAGE['AUTH']]>): any;
      addEventListener(event: SOCKET_CLIENT_MESSAGE['AUTH'], listener: Listener<ClientSocketMessagePayload[SOCKET_CLIENT_MESSAGE['AUTH']]>): any;

      on(event: SOCKET_CLIENT_MESSAGE['COMMAND'], listener: Listener<ClientSocketMessagePayload[SOCKET_CLIENT_MESSAGE['COMMAND']]>): any;
      once(event: SOCKET_CLIENT_MESSAGE['COMMAND'], listener: Listener<ClientSocketMessagePayload[SOCKET_CLIENT_MESSAGE['COMMAND']]>): any;
      addEventListener(event: SOCKET_CLIENT_MESSAGE['COMMAND'], listener: Listener<ClientSocketMessagePayload[SOCKET_CLIENT_MESSAGE['COMMAND']]>): any;
    }
  }
}
