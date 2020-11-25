import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from 'process';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';
import { SocketServerEventMap, SOCKET_SERVER_EVENT } from '../const/socket-server-event.const';
import { SOCKET_CLIENT_MESSAGE } from '../../shared/constants/socket-client-message.const';
import { SocketServerMessageMap, SOCKET_SERVER_MESSAGE } from '../../shared/constants/socket-server-message.const';
import { SocketHandshakeQuery } from '../../shared/types/socket-handshake-query.type';

let socketServerInstance: null | SocketServer = null;

/**
 * @class SocketServer
 *
 * @description
 * Controls the sending and receiving of information from and to the connected clients
 * over sockets
 */
class SocketServer extends TypedEventEmitter<SocketServerEventMap> {
  protected readonly log = classLoggerFactory(this);

  private _io: SocketIOServer | null = null;

  private _initialised = false;

  private connectedClientCount = 0;

  /**
   * The SocketIO Server
   */
  get io(): SocketIOServer { if (!this._io) throw ReferenceError('Attempt to access SocketServer.io prior to assignment!'); return this._io; }

  get initialised(): boolean { return this._initialised; }

  /**
   * @description
   * Create a new instance of the Socket Server Class if one does not already exist
   *
   * @returns {SocketServer}
   */
  static getInstance() {
    if (!socketServerInstance) {
      socketServerInstance = new SocketServer();
    }

    return socketServerInstance;
  }

  /**
   * Bind the event listeners this class cares about
   */
  private bindEvents() {
    this.handleInitialised = this.handleInitialised.bind(this);
    this.handleSocketConnected = this.handleSocketConnected.bind(this);

    this.once(SOCKET_SERVER_EVENT.INITIALISED, this.handleInitialised);

    this.io.on('connection', this.handleSocketConnected);
  }

  /**
   * unbind the event listeners this class cares about
   */
  private unbindEvents() {
    this.once(SOCKET_SERVER_EVENT.INITIALISED, this.handleInitialised);

    this.io.on('connection', this.handleSocketConnected);
  }

  /**
   * Fired when the Server Socket Handler is initialised
   */
  private handleInitialised() {
    this.log.info('Socket Server Initialised.');
  }

  /**
   * Fired when a client socket connection is established
   */
  private handleSocketConnected(socket: SocketIO.Socket) {
    this.log.info('Socket Connected. Awaiting identification...');

    // Create a temporary handler for this socket until they identify who / what they are
    socket.authKey = null;

    socket.clientType = (socket.handshake.query as SocketHandshakeQuery).clientType;

    socket.on('disconnect', (reason) => this.handleSocketDisconnected(socket, reason));
    socket.once(SOCKET_CLIENT_MESSAGE.AUTH, (payload) => this._handleSocketAuthReceived(socket, payload.key));

    // Emit an auth challenge
    socket.emit(SOCKET_SERVER_MESSAGE.CHALLENGE);

    // Setup a timeout to terminate the connection if we don't hear from them in 3 seconds.
    socket.authTimeout = setTimeout(() => {
      this.log.warn('Socket not authenticated. Booting.');
      clearTimeout(socket.authTimeout);
      socket.emit(SOCKET_SERVER_MESSAGE.UNAUTHORIZED, { reason: 'No auth provided in the allotted time. Goodbye.' });
      socket.disconnect();
    }, 3000);
  }

  /**
   * Fired when an incoming socket attempts to authenticate.
   */
  private _handleSocketAuthReceived(socket: SocketIO.Socket, key: string) {
    // Clear the identity timeout on the socket
    clearTimeout(socket.authTimeout);

    // TODO: at some point in the future add some real auth here
    if (key !== env.CLIENT_KEY) {
      this.log.warn('Socket provided an invalid CLIENT_KEY. Booting.', { key });
      socket.emit(SOCKET_SERVER_MESSAGE.UNAUTHORIZED, { reason: 'Invalid auth provided. Goodbye.' });
      socket.disconnect();
      return;
    }

    // Keeping the key lets us know the socket is authenticated
    socket.authKey = key;

    // Keep track of the connected client
    this.connectedClientCount += 1;

    // If everything else checks out - setup the rest of the socket handler stuff
    this.log.info('New Socket Authenticated OK.', { connectedClientCount: this.connectedClientCount });
    socket.on('error', this.handleSocketClientError.bind(this));
    socket.on(SOCKET_CLIENT_MESSAGE.COMMAND, (payload) => this.emitImmediate(
      SOCKET_SERVER_EVENT.CLIENT_COMMAND,
      { socket, command: payload },
    ));

    // Let the socket know they've been authenticated
    socket.emit(SOCKET_SERVER_MESSAGE.AUTHORIZED, undefined);

    // Notify any listeners of this class that a client has connected
    this.emit(SOCKET_SERVER_EVENT.CLIENT_CONNECTED, { socket, connectedClientCount: this.connectedClientCount });
  }

  /**
   * Fired when a client socket is disconnected
   */
  private handleSocketDisconnected(socket: SocketIO.Socket, disconnectReason: any) {
    if (socket.authKey) {
      this.connectedClientCount -= 1;
      this.log.info(`Client disconnected: "${disconnectReason}"`, { connectedClientCount: this.connectedClientCount });

      // Notify any listeners of this class that a socket has disconnected
      this.emit(SOCKET_SERVER_EVENT.CLIENT_DISCONNECTED, { socket, connectedClientCount: this.connectedClientCount });
    } else {
      this.log.warn('Unidentified client disconnected');
    }
  }

  /**
   * Handle an error in a socket
   */
  private handleSocketClientError(err: Error | any) {
    this.log.error(`Socket client error: ${err}`, err);
  }

  /**
   * Initialise the Server Socket Handler
   */
  async initialise(io: SocketIOServer) {
    this.log.info('Socket Server initialising...');

    // Attach the Socket Server
    this._io = io;

    this.bindEvents();

    // Let everyone know that the Socket Handler is initialised
    this._initialised = true;
    this.emit(SOCKET_SERVER_EVENT.INITIALISED, undefined);
  }

  /**
   * Called by the Kernel when it is time to tear down the application
   */
  async shutDown(reason?: string) {
    this.unbindEvents();

    if (this.initialised && this.io) {
      this.log.info('Socket Server shutting down...');
      this.io.emit(SOCKET_SERVER_MESSAGE.EVENT_SHUT_DOWN, { reason });

      // TODO: kill all client connections with the appropriate reason
    }
  }

  /**
   * Send a message to a specific socket or to everyone
   */
  sendBotStatusToClients(payload: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['BOT_STATUS']], socket?: SocketIO.Socket) {
    // Emit to a specific socket
    if (socket) {
      socket.emit(SOCKET_SERVER_MESSAGE.BOT_STATUS, payload);
    }

    // Emit to everyone
    else {
      this.io.emit(SOCKET_SERVER_MESSAGE.BOT_STATUS, payload);
    }
  }

  /**
   * Send a Drive Input status update to a specific socket or to everyone
   */
  sendDriveInputStatusToClients(payload: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['DRIVE_INPUT_STATUS']], socket?: SocketIO.Socket) {
    // Emit to a specific socket
    if (socket) {
      socket.emit(SOCKET_SERVER_MESSAGE.DRIVE_INPUT_STATUS, payload);
    }

    // Emit to everyone
    else {
      this.io.emit(SOCKET_SERVER_MESSAGE.DRIVE_INPUT_STATUS, payload);
    }
  }

  /**
   * Send a Pan/Tilt Input status update to a specific socket or to everyone
   */
  sendPanTiltInputStatusToClients(payload: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['PAN_TILT_INPUT_STATUS']], socket?: SocketIO.Socket) {
    // Emit to a specific socket
    if (socket) {
      socket.emit(SOCKET_SERVER_MESSAGE.PAN_TILT_INPUT_STATUS, payload);
    }

    // Emit to everyone
    else {
      this.io.emit(SOCKET_SERVER_MESSAGE.PAN_TILT_INPUT_STATUS, payload);
    }
  }

  /**
   * Send a Speed Input status update to a specific socket or to everyone
   */
  sendSpeedInputStatusToClients(payload: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['SPEED_INPUT_STATUS']], socket?: SocketIO.Socket) {
    // Emit to a specific socket
    if (socket) {
      socket.emit(SOCKET_SERVER_MESSAGE.SPEED_INPUT_STATUS, payload);
    }

    // Emit to everyone
    else {
      this.io.emit(SOCKET_SERVER_MESSAGE.SPEED_INPUT_STATUS, payload);
    }
  }

  /**
   * Send the power utilisation stats update to a specific socket or to everyone
   */
  sendPowerUtilisationStatsToClients(payload: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['POWER_STATUS']], socket?: SocketIO.Socket) {
    // Emit to a specific socket
    if (socket) {
      socket.emit(SOCKET_SERVER_MESSAGE.POWER_STATUS, payload);
    }

    // Emit to everyone
    else {
      this.io.emit(SOCKET_SERVER_MESSAGE.POWER_STATUS, payload);
    }
  }
}

export const socketServer = SocketServer.getInstance();
