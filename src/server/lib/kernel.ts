import { Express } from 'express';
import socketIo from 'socket.io';
import http from 'http';
import { KernelEventPayload, KERNEL_EVENT } from '../const/kernel_event.const';
import { applyExpressMiddleware } from '../http/apply-express-middleware';
import { env } from '../env';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';
import { SocketServer } from './socket-server';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';


export class Kernel extends TypedEventEmitter<KernelEventPayload> {
  protected readonly log = classLoggerFactory(this);

  public readonly expressApp: Express;
  
  public readonly httpServer: http.Server;
  
  private _initialised: boolean;

  public readonly socketServer: SocketServer;
  
  
  /**
  * @constructor
  */
  constructor(expressApp: Express, httpServer: http.Server) {
    super();
    
    this.expressApp = expressApp;
    this.httpServer = httpServer;
    this.socketServer = new SocketServer(socketIo(httpServer));

    this._initialised = false;
    
    this._bindEvents();
    
    this.initialise();
  }
  
  get initialised() { return this._initialised; }

  
  /**
  * Initialise the kernel
  */
  async initialise() {
    this.log.info('Kernel initialising...');

    // TODO: Initializing stuff

    this._initialised = true;
    this.emit(KERNEL_EVENT.INITIALISED, undefined);
  }
  
  
  /**
   * Run the application
   */
  async run() {
    this.log.info('Kernel Running');

    // Apply the routing and middleware to the express app
    applyExpressMiddleware(this.expressApp);

    // Server running
    this.httpServer.listen(env.DEFAULT_PORT, () => this.log.info(`Http server running on port ${env.DEFAULT_PORT}`));
  }


  /**
   * Bind the event listeners this class cares about
   */
  _bindEvents() {
    this.once(KERNEL_EVENT.INITIALISED, this._handleInitialised.bind(this));
  }


  /**
   * Fired once after the kernel has initialised
   */
  _handleInitialised() {
    this.log.info('Kernel initialised.');
    this.run();
  } 
}