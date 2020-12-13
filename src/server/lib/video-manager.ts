import { Express } from 'express';
import { ServerOptions } from 'https';
import { PeerServer } from 'peer';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';
import { VideoManagerEventMap, VIDEO_MANAGER_EVENT } from '../const/video-manager-event.const';
import { env } from '../env';

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
  }

  /**
   * Unbind any event listeners this class cares about
   */
  private unbindEvents() {
    this.off(VIDEO_MANAGER_EVENT.INITIALISED, this.handleInitialised);

    // PeerJS events
    if (this._peerServer) {
      this._peerServer
        .off('connection', this.handlePeerConnected)
        .off('disconnect', this.handlePeerDisonnected);
    }
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
    this.log.info('New Client Connected');
  }

  /**
   * Fired when a peerJs client disconnects
   * @param client
   */
  private handlePeerDisonnected(client: any) {
    this.log.info('Client Disconnected');
  }
}
