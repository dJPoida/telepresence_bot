import { pigpio, Pigpio } from 'node-pigpio-if';
import { openPromisified } from './wrappers/i2c.mock';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { GPIODriverEventMap, GPIO_DRIVER_EVENT } from '../const/gpio-driver-event.const';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';
import { env } from '../env';

export class GPIODriver extends TypedEventEmitter<GPIODriverEventMap> {
  protected readonly log = classLoggerFactory(this);
  private _initialised = false;
  public pigpio: null | Pigpio = null;

  /**
   * @constructor
   */
  constructor() {
    super();

    this.handleInitialised = this.handleInitialised.bind(this);
    this.bindEvents();
  }

  /**
   * Whether the gpio Driver has been initialised
   */
  get initialised(): boolean { return this._initialised; }

  /**
   * returns true if the raspberry pi hardware is available
   */
  get hardwareAvailable(): boolean { return !this.pigpio; }

  /**
   * Bind the event listeners this class cares about
   */
  private bindEvents(): void {
    this.once(GPIO_DRIVER_EVENT.INITIALISED, this.handleInitialised);
  }

  /**
   * Unbind the event listeners this class cares about
   */
  private unbindEvents(): void {
    this.off(GPIO_DRIVER_EVENT.INITIALISED, this.handleInitialised);
  }

  /**
   * Initialise the class
   */
  public async initialise(): Promise<void> {
    this.log.info('GPIO Driver initialising...');

    // Setup the connection to the gpio daemon
    try {
      this.pigpio = await pigpio();
    } catch (err) {
      this.log.error('Failed to initialise a connection to the the GPIO daemon', err);
    }

    // Let everyone know that the gpio Driver is initialised
    this._initialised = true;
    this.emit(GPIO_DRIVER_EVENT.INITIALISED, undefined);
  }

  /**
   * Shut down this class
   */
  public async shutDown(): Promise<void> {
    this.unbindEvents();

    if (this.initialised) {
      this.log.info('gpio Driver shutting down...');

      if (this.pigpio) {
        try {
          await this.pigpio.close();
          this.pigpio = null;
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
    this.log.info('GPIO Driver Initialised.');
  }
}
