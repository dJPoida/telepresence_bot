import { Express } from 'express';
import socketIo from 'socket.io';
import http from 'http';
import { KernelEventPayload, KERNEL_EVENT } from '../const/kernel-event.const';
import { applyExpressMiddleware } from '../http/apply-express-middleware';
import { env } from '../env';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';
import { socketServer } from './socket-server';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { LEDStrip } from './led-strip';

export class Kernel extends TypedEventEmitter<KernelEventPayload> {
  protected readonly log = classLoggerFactory(this);

  public readonly expressApp: Express;

  public readonly httpServer: http.Server;

  public readonly ledStrip: LEDStrip;

  private _initialised = false;

  /**
  * @constructor
  */
  constructor(expressApp: Express, httpServer: http.Server) {
    super();

    this.expressApp = expressApp;
    this.httpServer = httpServer;
    this.ledStrip = new LEDStrip();

    this.initialise();
  }

  get initialised(): boolean { return this._initialised; }

  /**
  * Initialise the kernel
  */
  private async initialise(): Promise<void> {
    this.log.info('Kernel initialising...');

    socketServer.initialise(socketIo(this.httpServer));

    // TODO: Initializing stuff

    this._initialised = true;
    this.bindEvents();
    this.emit(KERNEL_EVENT.INITIALISED, undefined);
  }

  /**
   * Run the application
   */
  private async run(): Promise<void> {
    this.log.info('Kernel Running');

    // Apply the routing and middleware to the express app
    applyExpressMiddleware(this.expressApp);

    // Server running
    this.httpServer.listen(env.DEFAULT_PORT, () => this.log.info(`Http server running on port ${env.DEFAULT_PORT}`));
  }

  /**
   * Bind the event listeners this class cares about
   */
  private bindEvents() {
    this.once(KERNEL_EVENT.INITIALISED, this.handleInitialised.bind(this));
  }

  /**
   * Fired once after the kernel has initialised
   */
  private handleInitialised() {
    this.log.info('Kernel initialised.');
    this.run();
  }
}
