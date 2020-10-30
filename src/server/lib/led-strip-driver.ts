import ws281x, { Ws281x } from 'rpi-ws281x-native';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { LEDStripEventMap, LED_STRIP_EVENT } from '../const/led-strip-event.const';
import { env } from '../env';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';

export type LEDColors = {
  front: number,
  right: number,
  rear: number,
  left: number
};

export type LEDPixelCounts = {
  front: number,
  right: number,
  rear: number,
  left: number
}

export type LEDPixelOffsets = {
  front: number,
  right: number,
  rear: number,
  left: number
}

export class LEDStripDriver extends TypedEventEmitter<LEDStripEventMap> {
  private readonly device: Ws281x = ws281x;
  protected readonly log = classLoggerFactory(this);
  private _initialised = false;
  private _brightness: number = env.LED_DEFAULT_BRIGHTNESS;
  private _ledColors: LEDColors = { front: 0xFF6D00, right: 0xFF6D00, rear: 0xFF6D00, left: 0xFF6D00 };
  private _pixelData = new Uint32Array(this.numLEDs);

  private _pixelCounts: LEDPixelCounts = {
    front: env.LED_COUNT_FRONT,
    right: env.LED_COUNT_RIGHT,
    rear: env.LED_COUNT_REAR,
    left: env.LED_COUNT_LEFT,
  };

  private _pixelOffsets: LEDPixelOffsets = {
    front: 0,
    right: env.LED_COUNT_FRONT,
    rear: env.LED_COUNT_FRONT + env.LED_COUNT_RIGHT,
    left: env.LED_COUNT_FRONT + env.LED_COUNT_RIGHT + env.LED_COUNT_REAR,
  };

  /**
   * @constructor
   */
  constructor() {
    super();
    this.calcPixelOffsets();

    this.handleInitialised = this.handleInitialised.bind(this);
    this.bindEvents();
  }

  /**
   * The brightness of the LED strip
   */
  get brightness(): number { return this._brightness; }

  /**
   * Whether the LEDStrip has been initialised
   */
  get initialised(): boolean { return this._initialised; }

  /**
   * returns true if the raspberry pi could be initialised with the ws281x library
   */
  get hardwareAvailable(): boolean { return this.device && !this.device.isStub(); }

  /**
   * Add all the LEDs up and this is the total number of LEDs in serial controlled by this class
   */
  get numLEDs(): number { return env.LED_COUNT_FRONT + env.LED_COUNT_RIGHT + env.LED_COUNT_REAR + env.LED_COUNT_LEFT; }

  /**
   * Get the configured colors for the front / sides / back LED strips
   */
  get ledColors(): LEDColors { return this._ledColors; }

  /**
   * Get the pixel data that is rendered to the LED Strip
   */
  get pixelData(): Uint32Array { return this._pixelData; }

  /**
   * Bind the event listeners this class cares about
   */
  private bindEvents(): void {
    this.once(LED_STRIP_EVENT.INITIALISED, this.handleInitialised);
  }

  /**
   * Unbind any event listeners this class cares about
   */
  private unbindEvents(): void {
    this.off(LED_STRIP_EVENT.INITIALISED, this.handleInitialised);
  }

  /**
   * Initialise the class
   */
  public async initialise(): Promise<void> {
    this.log.info('LED Device initialising...');

    // Initialise the ws281x Driver
    this.device.init(this.numLEDs, {});

    // Set the Brightness
    this.device.setBrightness(this.brightness);

    // Let everyone know that the LED Strip is initialised
    this._initialised = true;
    this.emit(LED_STRIP_EVENT.INITIALISED, undefined);
  }

  /**
   * Shut down the LED device
   */
  public async shutDown(): Promise<void> {
    this.unbindEvents();

    if (this.initialised) {
      this.log.info('LED Device shutting down...');

      // Make sure that the LED strip is reset prior to terminating the application
      this.device.reset();
    }
  }

  /**
   * The environment configuration provides an opportunity
   * for shonky wiring to be handled in the software.
   *
   * This takes those pixel orders and translates them into pixel offsets
   * for sequential addressing
   */
  private calcPixelOffsets() {
    const ledMap = env.LED_MAP.split(',');
    Object.keys(this._pixelOffsets).forEach((sideType) => {
      let newOffset = 0;
      ledMap.forEach((mapSideType) => {
        if (mapSideType.toLowerCase() === sideType.toLowerCase()) {
          this._pixelOffsets[sideType as keyof LEDPixelOffsets] = newOffset;
        } else {
          newOffset += this._pixelCounts[sideType as keyof LEDPixelOffsets];
        }
      });
    });
  }

  /**
   * Fired when this class is initialised
   */
  private handleInitialised() {
    this.log.info('LED Device Initialised.');

    this.render();
  }

  /**
   * Take the information about the state of the LED strip and update it into the PixelData
   */
  public async render():Promise<void> {
    // Apply the front color
    for (let i = 0; i < this._pixelCounts.front; i += 1) {
      this._pixelData[i + this._pixelOffsets.front] = this.ledColors.front;
    }
    // apply the right edge color
    for (let i = 0; i < this._pixelCounts.right; i += 1) {
      this._pixelData[i + this._pixelOffsets.right] = this.ledColors.right;
    }
    // apply the back color
    for (let i = 0; i < this._pixelCounts.rear; i += 1) {
      this._pixelData[i + this._pixelOffsets.rear] = this.ledColors.rear;
    }
    // apply the left edge color
    for (let i = 0; i < this._pixelCounts.left; i += 1) {
      this._pixelData[i + this._pixelOffsets.left] = this.ledColors.left;
    }

    // Update the device
    this.device.render(this._pixelData);
  }

  /**
   * Update the LED Colors for the front, left/right and rear strip sections
   */
  public async setLEDs(ledColors: Partial<LEDColors>): Promise<void> {
    this._ledColors = {
      ...this._ledColors,
      ...ledColors,
    };

    this.render();
  }
}
