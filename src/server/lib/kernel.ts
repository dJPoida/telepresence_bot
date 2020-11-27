import { Express } from 'express';
import { Server as SocketIOServer } from 'socket.io';
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
import { I2cDriver } from './i2c-driver';
import { SpeakerDriver } from './speaker-driver';
import { PowerMonitor } from './power-monitor';
import { PowerMonitorEventMap, POWER_MONITOR_EVENT } from '../const/power-monitor-event.const';
import { GPIODriver } from './gpio-driver';

export class Kernel extends TypedEventEmitter<KernelEventMap> {
  protected readonly log = classLoggerFactory(this);

  public readonly expressApp: Express;

  public readonly httpServer: http.Server;

  public readonly i2cDriver: I2cDriver;

  public readonly gpioDriver: GPIODriver;

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
    this.i2cDriver = new I2cDriver();
    this.gpioDriver = new GPIODriver();
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
      power: this.powerMonitor.power,
    };
  }

  /**
  * Initialise the kernel
  */
  private async initialise(): Promise<void> {
    this.log.info('Kernel initialising...');

    try {
      await socketServer.initialise(new SocketIOServer(this.httpServer, { pingInterval: env.PING_INTERVAL }));
    } catch (error) {
      this.log.error(error);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }

    // spin up the i2c driver
    try {
      await this.i2cDriver.initialise();
    } catch (error) {
      this.log.error(error);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }

    // spin up the gpio driver
    try {
      await this.gpioDriver.initialise();
    } catch (error) {
      this.log.error(error);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }

    // spin up all of the other drivers
    Promise.all([
      this.speakerDriver.initialise(),
      this.powerMonitor.initialise(),
      this.inputManager.initialise(),
      this.ledStripDriver.initialise(),
      this.motorDriver.initialise(this.i2cDriver.i2cBus, this.gpioDriver.pigpio),
    ]).then(() => {
      this.bindEvents();

      this._initialised = true;
      this.emit(KERNEL_EVENT.INITIALISED, undefined);
    }).catch((error) => {
      this.log.error(error);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    });
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

      try {
        await socketServer.shutDown();
      } catch (error) {
        this.log.error(`Error while shutting down the Socket Server: ${error}`);
      }

      try {
        await this.motorDriver.shutDown();
      } catch (error) {
        this.log.error(`Error while shutting down Motor Driver: ${error}`);
      }

      try {
        await this.ledStripDriver.shutDown();
      } catch (error) {
        this.log.error(`Error while shutting down LED Strip Driver: ${error}`);
      }

      try {
        await this.inputManager.shutDown();
      } catch (error) {
        this.log.error(`Error while shutting down Input Manager: ${error}`);
      }

      try {
        await this.speakerDriver.shutDown();
      } catch (error) {
        this.log.error(`Error while shutting down the Speaker Driver: ${error}`);
      }

      try {
        await this.powerMonitor.shutDown();
      } catch (error) {
        this.log.error(`Error while shutting down the Power Monitor: ${error}`);
      }

      try {
        await this.i2cDriver.shutDown();
      } catch (error) {
        this.log.error(`Error while shutting down the i2c Driver: ${error}`);
      }

      try {
        await this.gpioDriver.shutDown();
      } catch (error) {
        this.log.error(`Error while shutting down the GPIO Driver: ${error}`);
      }
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

    // Listen for Kernel Events
    this.once(KERNEL_EVENT.INITIALISED, this.handleInitialised.bind(this));

    // Listen for Socket Events
    socketServer
      .on(SOCKET_SERVER_EVENT.CLIENT_CONNECTED, this.handleClientConnected.bind(this))
      .on(SOCKET_SERVER_EVENT.CLIENT_DISCONNECTED, this.handleClientDisconnected.bind(this));
    this.inputManager
      .on(INPUT_MANAGER_EVENT.DRIVE_INPUT_CHANGE, (payload) => setImmediate(() => this.handleDriveInputChanged(payload)))
      .on(INPUT_MANAGER_EVENT.PAN_TILT_INPUT_CHANGE, (payload) => setImmediate(() => this.handlePanTiltInputChanged(payload)))

    // Listen for Power Monitor Events
    this.powerMonitor
      .on(POWER_MONITOR_EVENT.UPDATE, (payload) => setImmediate(() => this.handlePowerMonitorUpdate(payload)));
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
      process.nextTick(() => { process.exit(exitCode || 0); });
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
   * Fired when a client disconnects
   */
  private handleClientDisconnected({ socket }: SocketServerEventMap[SOCKET_SERVER_EVENT['CLIENT_DISCONNECTED']]) {
    // TODO: This needs to only happen when the socket that was disconnected is the remote controller socket
    this.motorDriver.stop();
  }

  /**
   * Fired when the input manager updates the drive input
   */
  private handleDriveInputChanged({ drive }: InputManagerEventMap[INPUT_MANAGER_EVENT['DRIVE_INPUT_CHANGE']]) {
    socketServer.sendDriveInputStatusToClients({ drive });
    this.motorDriver.setDriveInput(drive);
  }

  /**
   * Fired when the input manager updates the pan/tilt input
   */
  private handlePanTiltInputChanged({ panTilt }: InputManagerEventMap[INPUT_MANAGER_EVENT['PAN_TILT_INPUT_CHANGE']]) {
    socketServer.sendPanTiltInputStatusToClients({ panTilt });
  }

  /**
   * Fired when the power monitor updates
   */
  private handlePowerMonitorUpdate(power: PowerMonitorEventMap[POWER_MONITOR_EVENT['UPDATE']]) {
    socketServer.sendPowerUtilisationStatsToClients({ power });
  }
}
