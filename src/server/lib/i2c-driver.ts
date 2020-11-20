import { Bus } from 'async-i2c-bus';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { I2CDriverEventMap, I2C_DRIVER_EVENT } from '../const/i2c-driver-event.const';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';
import { env } from '../env';

export class I2cDriver extends TypedEventEmitter<I2CDriverEventMap> {
  protected readonly log = classLoggerFactory(this);
  private _initialised = false;
  public i2cBus: null | Bus = null;

  /**
   * @constructor
   */
  constructor() {
    super();

    this.handleInitialised = this.handleInitialised.bind(this);
    this.bindEvents();
  }

  /**
   * Whether the i2c Driver has been initialised
   */
  get initialised(): boolean { return this._initialised; }

  /**
   * returns true if the raspberry pi hardware is available
   */
  get hardwareAvailable(): boolean { return !this.i2cBus; }

  /**
   * Bind the event listeners this class cares about
   */
  private bindEvents(): void {
    this.once(I2C_DRIVER_EVENT.INITIALISED, this.handleInitialised);
  }

  /**
   * Unbind the event listeners this class cares about
   */
  private unbindEvents(): void {
    this.off(I2C_DRIVER_EVENT.INITIALISED, this.handleInitialised);
  }

  /**
   * Initialise the class
   */
  public async initialise(): Promise<void> {
    this.log.info('i2c Driver initialising...');

    // Setup the I2C Bus
    console.log(` - I2C Bus number ${env.I2C_BUS_NO}`);
    try {
      this.i2cBus = await Bus.createAndOpen({ busNumber: env.I2C_BUS_NO });
    } catch (err) {
      this.i2cBus = null;
      this.log.error('Failed to initialise the I2C bus', err);
    }

    // Let everyone know that the i2c Driver is initialised
    this._initialised = true;
    this.emit(I2C_DRIVER_EVENT.INITIALISED, undefined);
  }

  /**
   * Shut down this class
   */
  public async shutDown(): Promise<void> {
    this.unbindEvents();

    if (this.initialised) {
      this.log.info('i2c Driver shutting down...');

      if (this.i2cBus) {
        try {
          await this.i2cBus.close();
          this.i2cBus = null;
        } catch {
          // sink
        }
      }
    }
  }

  /**
   * Fired when this class is initialised
   */
  private handleInitialised() {
    this.log.info('Motor Driver Initialised.');
  }
}
