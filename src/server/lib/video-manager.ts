import { Express } from 'express';
import { ServerOptions } from 'https';
import { PeerServer } from 'peer';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';
import { VideoManagerEventMap, VIDEO_MANAGER_EVENT } from '../const/video-manager-event.const';
import { env } from '../env';
import { socketServer } from './socket-server';
import { CLIENT_COMMAND } from '../../shared/constants/client-command.const';
import { SocketServerEventMap, SOCKET_SERVER_EVENT } from '../const/socket-server-event.const';
import { A_WEBRTC_CLIENT_TYPE, WEBRTC_CLIENT_TYPE } from '../../client/const/webrtc-client-type.constant';
import { WebRTCStatusDto } from '../../shared/types/webrtc-status.dto.type';

/**
 * @class VideoManager
 *
 * @description
 * Manages the negotiation of video clients
 */
export class VideoManager extends TypedEventEmitter<VideoManagerEventMap> {
  protected readonly log = classLoggerFactory(this);

  private _initialised = false;

  private _peerServer: null | Express = null;

  private _controllerPeerId: null | string = null;

  private _displayPeerId: null | string = null;

  get initialised(): boolean { return this._initialised; }

  /**
   * @constructor
   */
  constructor() {
    super();

    this.handleInitialised = this.handleInitialised.bind(this);
    this.handlePeerConnected = this.handlePeerConnected.bind(this);
    this.handlePeerDisonnected = this.handlePeerDisonnected.bind(this);
    this.handleClientCommand = this.handleClientCommand.bind(this);
  }

  /**
   * Bind the event listeners this class cares about
   */
  private bindEvents() {
    this.once(VIDEO_MANAGER_EVENT.INITIALISED, this.handleInitialised);

    // PeerJS events
    if (this._peerServer) {
      this._peerServer
        .on('connection', this.handlePeerConnected)
        .on('disconnect', this.handlePeerDisonnected);
    }

    // Listen for incoming client commands
    socketServer.on(SOCKET_SERVER_EVENT.CLIENT_COMMAND, this.handleClientCommand);
  }

  /**
   * Unbind any event listeners this class cares about
   */
  private unbindEvents() {
    this.off(VIDEO_MANAGER_EVENT.INITIALISED, this.handleInitialised);

    if (this._peerServer) {
      this._peerServer
        .off('connection', this.handlePeerConnected)
        .off('disconnect', this.handlePeerDisonnected);
    }

    socketServer.off(SOCKET_SERVER_EVENT.CLIENT_COMMAND, this.handleClientCommand);
  }

  /**
   * Initialise the Video Manager
   */
  public async initialise(credentials: ServerOptions): Promise<void> {
    this.log.info('Video Manager initialising...');

    // Create the PeerJS server and attach it to the express app
    if (credentials.cert && credentials.key) {
      this._peerServer = PeerServer({ ssl: { cert: credentials.cert as string, key: credentials.key as string }, port: env.WEB_RTC_PORT, path: '/' });
      this.bindEvents();

      // Let everyone know that the Video Manager is initialised
      this._initialised = true;
      this.emit(VIDEO_MANAGER_EVENT.INITIALISED, undefined);
    } else {
      throw new Error('Cannot create a peer server without SSL credentials');
    }
  }

  /**
   * Shut down the Video Manager
   */
  public async shutDown(): Promise<void> {
    this.unbindEvents();

    if (this.initialised) {
      this.log.info('Video Manager shutting down...');
    }
  }

  /**
   * Fired when the Video Manager Handler is initialised
   */
  private handleInitialised() {
    this.log.info('Video Manager Initialised.');
  }

  /**
   * Fired when a peerJs client connects
   * @param client
   */
  private handlePeerConnected(client: any) {
    this.log.info('New Client Connected', client.id);
  }

  /**
   * Fired when a peerJs client disconnects
   * @param client
   */
  private handlePeerDisonnected(client: any) {
    this.log.info('Client Disconnected', client.id);
    if (client.id === this._controllerPeerId) {
      this.setControllerPeerId(null);
    }
    else if (client.id === this._displayPeerId) {
      this.setDisplayPeerId(null);
    }
  }

  /**
   * Fired when a client command is received on the socket
   */
  private handleClientCommand({ command }: SocketServerEventMap[SOCKET_SERVER_EVENT['CLIENT_COMMAND']]) {
    switch (command.type) {
      case CLIENT_COMMAND.SET_PEER_ID:
        this.handleClientPeerIDChanged(command.payload.clientType, command.payload.peerId);
        break;
      default:
        // NOOP - likely an incoming command the video manager isn't supposed to respond to
        break;
    }
  }

  /**
   * Fired by a client when they receive a new Peer ID
   */
  private handleClientPeerIDChanged(clientType: A_WEBRTC_CLIENT_TYPE, peerId: null | string) {
    this.log.info(`${clientType} reports a new peerId: ${peerId}`);
    if (clientType === WEBRTC_CLIENT_TYPE.CALLER) {
      this.setControllerPeerId(peerId);
    } else {
      this.setDisplayPeerId(peerId);
    }
  }

  /**
   * Typically called by the kernel when a client instance confirms its peer ID
   * as a controller
   */
  private setControllerPeerId(peerId: null | string): void {
    if (peerId !== this._controllerPeerId) {
      this.log.info(`Controller peerId set to: "${peerId}"`);
      this._controllerPeerId = peerId;
      this.emitImmediate(VIDEO_MANAGER_EVENT.CONTROLLER_PEER_ID_CHANGED, { peerId });
    }
  }

  /**
   * Typically called by the kernel when a client instance confirms its peer ID
   * as a display
   */
  private setDisplayPeerId(peerId: null | string): void {
    if (peerId !== this._displayPeerId) {
      this.log.info(`Display peerId set to: "${peerId}"`);
      this._displayPeerId = peerId;
      this.emitImmediate(VIDEO_MANAGER_EVENT.DISPLAY_PEER_ID_CHANGED, { peerId });
    }
  }

  /**
   * The peerId of the current prioritised controller instance
   */
  public get controllerPeerId(): null | string {
    return this._controllerPeerId;
  }

  /**
   * The peerId of the current prioritised display instance
   */
  public get displayPeerId(): null | string {
    return this._displayPeerId;
  }

  /**
   * The DTO for the current webRTC status
   */
  public get webRTCStatus(): WebRTCStatusDto {
    return {
      controllerPeerId: this.controllerPeerId,
      displayPeerId: this.displayPeerId,
    };
  }
}
