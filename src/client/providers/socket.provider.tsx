import React, { createContext, useState, useEffect, useCallback } from 'react';
import socketIoClient from 'socket.io-client';
import { ClientCommandPayload } from '../../shared/constants/client-command.const';
import { ClientSocketMessagePayload, SOCKET_CLIENT_MESSAGE } from '../../shared/constants/socket-client-message.const';
import { SOCKET_CLIENT_TYPE } from '../../shared/constants/socket-client-type.const';
import { SocketServerMessageMap, SOCKET_SERVER_MESSAGE } from '../../shared/constants/socket-server-message.const';
import { SocketHandshakeQuery } from '../../shared/types/socket-handshake-query.type';
import { global } from '../const/global.constant';

type SocketContext = {
  sendCommand: (payload: ClientCommandPayload) => unknown,
  sendMessage: (payload: ClientSocketMessagePayload) => unknown,
  socketConnected: boolean,
  latency: null | number,
  ws: SocketIOClient.Socket;
};

export const SocketContext = createContext<SocketContext>(null as never);

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
 * Provides access to the web socket for transmitting and receiving data from the server
 *
 * @param param0
 */
export const SocketProvider: React.FC = function SocketProvider({ children }) {
  const [connected, setConnected] = useState<SocketContext['socketConnected']>(false);
  const [latency, setLatency] = useState<SocketContext['latency']>(null);

  /**
   * Method to send a command to the server
   */
  const sendMessage = useCallback(function sendMessage(payload: ClientSocketMessagePayload) {
    if (!connected) {
      console.error('[sendMessage]', 'Unable to send message: not connected', payload);
    } else {
      ws.emit(payload.type, payload.payload);
    }
  }, [connected]);

  /**
   * Method to send a command to the server
   */
  const sendCommand = useCallback(function sendCommand(payload: ClientCommandPayload) {
    if (!connected) {
      console.error('[sendCommand]', 'Unable to send command: not connected', payload);
    } else {
      ws.emit(SOCKET_CLIENT_MESSAGE.COMMAND, payload);
    }
  }, [connected]);

  /**
   * Connect listeners on connection to the webRTC peer
   */
  useEffect(() => {
    /**
       * Attempt to reconnect
       */
    const reconnect = () => {
      setTimeout(() => {
        if (!ws.connected) {
          ws.connect();
        }
      }, 500);
    };

    /**
       * Respond to a successful Authorization
       */
    const handleAuthorized = () => {
      setConnected(true);
    };

    /**
       * Respond to a Failed Authorization
       */
    const handleUnauthorized = (reason: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['UNAUTHORIZED']]) => {
      console.error(`Unauthorized: ${reason}`);

      // If the authorisation fails - reload the page. This should trigger a login page load
      setTimeout(() => {
        window.location.reload();
      }, 500);
    };

    /**
       * Respond to a challenge for authorization
       */
    const handleChallenge = () => {
      // TODO: Implement proper auth
      ws.emit(SOCKET_CLIENT_MESSAGE.AUTH, {
        key: global.CLIENT_KEY,
      });
    };

    // bindings
    const handleConnection = () => {
      // eslint-disable-next-line no-console
      console.log('Socket connection to the server has been established');
    };

    /**
       * Fired when the socket is disconnected for some reason
       */
    const handleDisconnection = (reason: string) => {
      console.warn(`Socket connection to the server has been lost: ${reason}`);
      setConnected(false);
      setLatency(null);

      // if the server booted us - let's attempt to re-connect
      if (reason === 'io server disconnect') {
        reconnect();
      }
    };

    /**
       * Fired when a connection attempt times out
       */
    const handleConnectTimeout = () => {
      console.warn('Socket connection attempt timed out.');
      setConnected(false);

      // If the socket cannot connect to the server - reload the page so that the browser updates (i.e. leaves the )
      // TODO: sometime in the future improve this to be more graceful and use a state value to render a different interface
      setTimeout(() => {
        window.location.reload();
      }, 500);
    };

    /**
       * Fired when a PONG is received from Socket.IO
       * Used to measure the latency
       */
    const handlePong = (ms: number) => {
      setLatency(ms);
    };

    ws.on('connect', handleConnection);
    ws.on('disconnect', handleDisconnection);
    ws.on('connect_timeout', handleConnectTimeout);
    ws.on('pong', handlePong);
    ws.on(SOCKET_SERVER_MESSAGE.CHALLENGE, handleChallenge);
    ws.on(SOCKET_SERVER_MESSAGE.AUTHORIZED, handleAuthorized);
    ws.on(SOCKET_SERVER_MESSAGE.UNAUTHORIZED, handleUnauthorized);

    // begin connection
    ws.connect();

    // destroy listeners on un-mount
    return () => {
      ws.off('connect', handleConnection);
      ws.off('disconnect', handleDisconnection);
      ws.off('connect_timeout', handleConnectTimeout);
      ws.off('pong', handlePong);
      ws.off(SOCKET_SERVER_MESSAGE.CHALLENGE, handleChallenge);
      ws.off(SOCKET_SERVER_MESSAGE.AUTHORIZED, handleAuthorized);
      ws.off(SOCKET_SERVER_MESSAGE.UNAUTHORIZED, handleUnauthorized);

      ws.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        sendCommand,
        sendMessage,
        ws,
        socketConnected: connected,
        latency,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
