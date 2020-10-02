import { Express } from 'express';
import socketIo from 'socket.io';
import http from 'http';
import { KernelEventPayload, KERNEL_EVENT } from '../const/kernel-event.const';
import { applyExpressMiddleware } from '../http/apply-express-middleware';
import { env } from '../env';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';
import { socketServer } from './socket-server';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { LEDStripDriver } from './led-strip-driver';
import { InputManager } from './input-manager';
import { SocketServerEventMap, SOCKET_SERVER_EVENT } from '../const/socket-server-event.const';
import { BotStatusDto } from '../../shared/types/bot-status.dto.type';
import { InputManagerEventMap, INPUT_MANAGER_EVENT } from '../const/input-manager-event.const';

export class Kernel extends TypedEventEmitter<KernelEventPayload> {
  protected readonly log = classLoggerFactory(this);

  public readonly expressApp: Express;

  public readonly httpServer: http.Server;

  public readonly ledStripDriver: LEDStripDriver;

  public readonly inputManager: InputManager;

  private _initialised = false;

  /**
  * @constructor
  */
  constructor(expressApp: Express, httpServer: http.Server) {
    super();

    this.expressApp = expressApp;
    this.httpServer = httpServer;
    this.inputManager = new InputManager();
    this.ledStripDriver = new LEDStripDriver();

    this.initialise();
  }

  get initialised(): boolean { return this._initialised; }

  get botStatusDto(): BotStatusDto {
    return {
      drive: this.inputManager.drive,
      panTilt: this.inputManager.panTilt,
      speed: this.inputManager.speed,
    };
  }

  /**
  * Initialise the kernel
  */
  private async initialise(): Promise<void> {
    this.log.info('Kernel initialising...');

    // Initialise the Input Manager
    this.inputManager.initialise();

    // Initialise the LED Strip Driver
    this.ledStripDriver.initialise();

    socketServer.initialise(socketIo(this.httpServer, {
      pingInterval: env.PING_INTERVAL,
    }));

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
    socketServer.on(SOCKET_SERVER_EVENT.CLIENT_CONNECTED, this.handleClientConnected.bind(this));
    this.inputManager
      .on(INPUT_MANAGER_EVENT.DRIVE_INPUT_CHANGE, (payload) => setImmediate(() => this.handleDriveInputChanged(payload)))
      .on(INPUT_MANAGER_EVENT.PAN_TILT_INPUT_CHANGE, (payload) => setImmediate(() => this.handlePanTiltInputChanged(payload)))
      .on(INPUT_MANAGER_EVENT.SPEED_INPUT_CHANGE, (payload) => setImmediate(() => this.handleSpeedInputChanged(payload)));
  }

  /**
   * Fired once after the kernel has initialised
   */
  private handleInitialised() {
    this.log.info('Kernel initialised.');
    this.run();
  }

  /**
   * Fired when a client connects
   */
  private handleClientConnected({ socket }: SocketServerEventMap[SOCKET_SERVER_EVENT['CLIENT_CONNECTED']]) {
    // Send an update directly to the socket with the status of the bot
    socketServer.sendBotStatusToClients(this.botStatusDto, socket);
  }

  /**
   * Fired when the input manager updates the drive input
   */
  private handleDriveInputChanged({ drive }: InputManagerEventMap[INPUT_MANAGER_EVENT['DRIVE_INPUT_CHANGE']]) {
    socketServer.sendDriveInputStatusToClients({ drive });
  }

  /**
   * Fired when the input manager updates the pan/tilt input
   */
  private handlePanTiltInputChanged({ panTilt }: InputManagerEventMap[INPUT_MANAGER_EVENT['PAN_TILT_INPUT_CHANGE']]) {
    socketServer.sendPanTiltInputStatusToClients({ panTilt });
  }

  /**
   * Fired when the input manager updates the speed input
   */
  private handleSpeedInputChanged({ speed }: InputManagerEventMap[INPUT_MANAGER_EVENT['SPEED_INPUT_CHANGE']]) {
    socketServer.sendSpeedInputStatusToClients({ speed });
  }
}
