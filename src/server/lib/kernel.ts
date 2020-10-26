import { Express } from 'express';
import socketIo from 'socket.io';
import http from 'http';
import { KernelEventMap, KERNEL_EVENT } from '../const/kernel-event.const';
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
import { MotorDriver } from './motor-driver';
import { SpeakerDriver } from './speaker-driver';
import { PowerMonitor } from './power-monitor';

export class Kernel extends TypedEventEmitter<KernelEventMap> {
  protected readonly log = classLoggerFactory(this);

  public readonly expressApp: Express;

  public readonly httpServer: http.Server;

  public readonly ledStripDriver: LEDStripDriver;

  public readonly motorDriver: MotorDriver;

  public readonly speakerDriver: SpeakerDriver;

  public readonly inputManager: InputManager;

  public readonly powerMonitor: PowerMonitor

  private _initialised = false;

  private _shuttingDown = false;

  /**
  * @constructor
  */
  constructor(expressApp: Express, httpServer: http.Server) {
    super();

    this.expressApp = expressApp;
    this.httpServer = httpServer;
    this.inputManager = new InputManager();
    this.ledStripDriver = new LEDStripDriver();
    this.motorDriver = new MotorDriver();
    this.speakerDriver = new SpeakerDriver();
    this.powerMonitor = new PowerMonitor();

    this.initialise();
  }

  get initialised(): boolean { return this._initialised; }

  get shuttingDown(): boolean { return this._shuttingDown; }

  get botStatusDto(): BotStatusDto {
    return {
      drive: this.inputManager.drive,
      panTilt: this.inputManager.panTilt,
      speed: this.inputManager.speed,
      power: this.powerMonitor.power,
    };
  }

  /**
  * Initialise the kernel
  */
  private async initialise(): Promise<void> {
    this.log.info('Kernel initialising...');

    this.bindEvents();

    // Initialise the Speaker Driver
    this.speakerDriver.initialise();

    // TODO: Initialise the Power Monitor Driver

    // Initialise the Input Manager
    this.inputManager.initialise();

    // Initialise the LED Strip Driver
    this.ledStripDriver.initialise();

    // Initialise the Motor Driver
    this.motorDriver.initialise();

    // Initialise the Socket Server
    socketServer.initialise(socketIo(this.httpServer, {
      pingInterval: env.PING_INTERVAL,
    }));

    this._initialised = true;
    this.emit(KERNEL_EVENT.INITIALISED, undefined);
  }

  /**
   * Perform the sequence of shutting down the hardware
   */
  private async shutDown(): Promise<void> {
    // Only allow the shutdown once.
    if (!this.shuttingDown) {
      this._shuttingDown = true;
      this.log.info('Shutting Down...');

      // TODO: Play a Shutdown Tune

      // Shutdown the bot in the appropriate order.
      await socketServer.shutDown();
      await this.motorDriver.shutDown();
      await this.ledStripDriver.shutDown();
      await this.inputManager.shutDown();
      await this.speakerDriver.shutDown();
      // TODO: Shutdown the Power Monitor Driver
    }
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
    // When the process is requested to exit, clean up prior to exit.
    process.once('exit', (code) => {
      this.handleTerminated({ cleanUp: true }, code);
    });

    // catch ctrl+c events
    process.once('SIGINT', () => {
      this.handleTerminated({ exit: true }, 0);
    });

    // catches "kill pid" (for example: nodemon restart)
    process.once('SIGUSR1', () => {
      this.handleTerminated({ exit: true }, 0);
    });
    process.once('SIGUSR2', () => {
      this.handleTerminated({ exit: true }, 0);
    });

    // catches uncaught exceptions
    process.once('uncaughtException', (error) => {
      this.log.error('Uncaught Exception: ', error);
      this.handleTerminated({ exit: true }, 1);
    });

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
   * Fired by any of the appropriate termination events like SIGINT or CTRL+C etc...
   */
  private async handleTerminated(options: {cleanUp?: boolean, exit?: boolean}, exitCode: number) {
    this.log.warn(`Kernel Terminating with exit code ${exitCode}...`);

    // Perform the graceful shutdown
    await this.shutDown();

    if (options.exit) {
      // eslint-disable-next-line no-process-exit
      process.exit(exitCode || 0);
    }
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
