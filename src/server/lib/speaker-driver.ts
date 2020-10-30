import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { SpeakerDriverEventMap, SPEAKER_DRIVER_EVENT } from '../const/speaker-driver-event.const';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';

// const Gpio = require('pigpio').Gpio;

// const speaker = new Gpio(13, {mode: Gpio.OUTPUT});

// speaker.hardwarePwmWrite(440, 500000);

// setTimeout(() => {
//     speaker.hardwarePwmWrite(0, 0);
// }, 500);

export class SpeakerDriver extends TypedEventEmitter<SpeakerDriverEventMap> {
  protected readonly log = classLoggerFactory(this);
  private _initialised = false;

  /**
   * @constructor
   */
  constructor() {
    super();

    this.handleInitialised = this.handleInitialised.bind(this);
    this.bindEvents();
  }

  /**
   * Whether the Speaker Driver has been initialised
   */
  get initialised(): boolean { return this._initialised; }

  /**
   * returns true if the raspberry pi hardware is available
   * TODO
   */
  get hardwareAvailable(): boolean { return false; }

  /**
   * Bind the event listeners this class cares about
   */
  private bindEvents(): void {
    this.once(SPEAKER_DRIVER_EVENT.INITIALISED, this.handleInitialised);
  }

  /**
   * Unbind the event listeners this class cares about
   */
  private unbindEvents(): void {
    this.off(SPEAKER_DRIVER_EVENT.INITIALISED, this.handleInitialised);
  }

  /**
   * Initialise the class
   */
  public async initialise(): Promise<void> {
    this.log.info('Speaker Driver initialising...');

    // TODO: Play a nice start up sound

    // TODO: more speaker driver initialisation

    // Let everyone know that the Speaker Driver is initialised
    this._initialised = true;
    this.emit(SPEAKER_DRIVER_EVENT.INITIALISED, undefined);
  }

  /**
   * Shut down this class
   */
  public async shutDown(): Promise<void> {
    this.unbindEvents();

    if (this.initialised) {
      this.log.info('Speaker Driver shutting down...');
      // TODO: shutdown the Speaker Driver
    }
  }

  /**
   * Fired when this class is initialised
   */
  private handleInitialised() {
    this.log.info('Motor Driver Initialised.');
  }
}
