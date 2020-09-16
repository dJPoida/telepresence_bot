import React, { createContext, useState, useEffect, useCallback } from 'react';
import socketIoClient from 'socket.io-client';
import { ClientCommand } from '../../shared/constants/client-command.const';
import { SOCKET_CLIENT_MESSAGE } from '../../shared/constants/socket-client-message.const';
import { SOCKET_CLIENT_TYPE } from '../../shared/constants/socket-client-type.const';
import { SocketServerMessageMap, SOCKET_SERVER_MESSAGE } from '../../shared/constants/socket-server-message.const';
import { SocketHandshakeQuery } from '../../shared/types/socket-handshake-query.type';
import { global } from '../constants/global.constant';

type ConsoleSocketContext = {
  sendCommand: (payload: ClientCommand) => any,
  connected: boolean,
  ws: SocketIOClient.Socket;
};

export const ConsoleSocketContext = createContext<ConsoleSocketContext>(null as any);

const ws = socketIoClient(
  {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    query: {
      clientType: SOCKET_CLIENT_TYPE.CONTROL,
    } as SocketHandshakeQuery,
  },
);

/**
 * @description
 * Provides network access to the auth service
 *
 * @param param0
 */
export const SocketProvider: React.FC = function SocketProvider({ children }) {
  const [connected, setConnected] = useState<ConsoleSocketContext['connected']>(false);

  const sendCommand = useCallback(function sendCommand(payload: ClientCommand) {
    console.log('[sendCommand]', payload);
    if (!connected) {
      console.log('[sendCommand]', 'Unable to send command: not connected', payload);
    } else {
      ws.emit(SOCKET_CLIENT_MESSAGE.COMMAND, payload);
    }
  }, [connected]);


  /**
   * Connect listeners on boot
   */
  useEffect(() => {
    /**
     * Attempt to reconnect
     */
    function reconnect() {
      setTimeout(() => {
        if (!ws.connected) {
          ws.connect();
        }
      }, 500);
    }

    /**
     * Respond to a successful Authorization
     */
    function handleAuthorized() {
      console.log('[handleAuthorized] Connected => true');
      setConnected(true);
    }

    /**
     * Respond to a Failed Authorization
     */
    function handleUnauthorized(reason: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['UNAUTHORIZED']]) {
      console.log(`[handleUnauthorized] ${reason}`);

      // If the authorisation fails - reload the page. This should trigger a login page load
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }

    /**
     * Respond to a challenge for authorization
     */
    function handleChallenge() {
      console.log('[handleChallenge] - sending challenge response');

      // TODO: Implement proper auth
      const authToken = 
      ws.emit(SOCKET_CLIENT_MESSAGE.AUTH, {
        key: global.CLIENT_KEY,
      });
    }

    // bindings
    function handleConnection() {
      console.log('[handleConnection] Awaiting auth challenge...');
    }

    function handleDisconnection(reason: string) {
      console.log(`[handleDisconnection]: ${reason}`);
      setConnected(false);

      // if the server booted us - let's attempt to re-connect
      if (reason === 'io server disconnect') {
        reconnect();
      }
    }

    function handleConnectTimeout() {
      console.log('[handleConnectTimeout]: Connection attempt timed out.');
      setConnected(false);

      // If the socket cannot connect to the server - reload the page so that the browser updates (i.e. leaves the )
      // TODO: sometime in the future improve this to be more graceful and use a state value to render a different interface
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }

    ws.on('connect', handleConnection);
    ws.on('disconnect', handleDisconnection);
    ws.on('connect_timeout', handleConnectTimeout);
    ws.on(SOCKET_SERVER_MESSAGE.CHALLENGE, handleChallenge);
    ws.on(SOCKET_SERVER_MESSAGE.AUTHORIZED, handleAuthorized);
    ws.on(SOCKET_SERVER_MESSAGE.UNAUTHORIZED, handleUnauthorized);

    // begin connection
    ws.connect();

    // destroy listeners on un-mount
    return () => {
      ws.disconnect();
      ws.off('connect', handleConnection);
      ws.off('disconnect', handleDisconnection);
      ws.off('connect_timeout', handleConnectTimeout);
      ws.off(SOCKET_SERVER_MESSAGE.CHALLENGE, handleChallenge);
      ws.off(SOCKET_SERVER_MESSAGE.AUTHORIZED, handleAuthorized);
      ws.off(SOCKET_SERVER_MESSAGE.UNAUTHORIZED, handleUnauthorized);
    };
  }, []);

  return (
    <ConsoleSocketContext.Provider value={{ sendCommand, ws, connected }}>
      {children}
    </ConsoleSocketContext.Provider>
  );
};
