import ws281x, { Ws281x } from 'rpi-ws281x-native';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { LEDStripEventPayload, LED_STRIP_EVENT } from '../const/led-strip-event.const';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';

const DEFAULT_BRIGHTNESS = 192;
const FRONT_LED_COUNT = 2;
const RIGHT_EDGE_LED_COUNT = 2;
const LEFT_EDGE_LED_COUNT = 2;
const BACK_LED_COUNT = 2;
const PIXEL_INDEX_MAP: null | number[] = null; // Only required if the LEDs are not wired in the correct sequence.

export type LEDColors = {
  front: number,
  right: number,
  back: number,
  left: number
};

export class LEDStrip extends TypedEventEmitter<LEDStripEventPayload> {
  private readonly device: Ws281x = ws281x;
  protected readonly log = classLoggerFactory(this);
  private _initialised = false;
  private _brightness: number = DEFAULT_BRIGHTNESS;
  private _ledColors: LEDColors = { front: 0x0000FF, left: 0xFFFFFF, right: 0xFFFFFF, back: 0xFF0000 };

  /**
   * @constructor
   */
  constructor() {
    super();
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
  get numLEDs(): number { return FRONT_LED_COUNT + RIGHT_EDGE_LED_COUNT + LEFT_EDGE_LED_COUNT + BACK_LED_COUNT; }

  /**
   * Get the pixel data that is rendered to the LED Strip
   */
  get pixelData(): Uint32Array {
    const result = new Uint32Array(this.numLEDs);

    return result;
  }

  /**
   * Bind the event listeners this class cares about
   */
  private bindEvents(): void {
    this.once(LED_STRIP_EVENT.INITIALISED, this.handleInitialised.bind(this));
  }

  /**
   * Initialise the class
   */
  public async initialise(): Promise<void> {
    this.log.info('LED Device initialising...');

    // Initialise the ws281x Driver
    this.device.init(this.numLEDs, {});

    // Initialise the Index Map
    if (PIXEL_INDEX_MAP) {
      this.log.info('Applying custom pixel index mapping');
      this.device.setIndexMapping(PIXEL_INDEX_MAP);
    }

    // Set the Brightness
    this.device.setBrightness(this.brightness);

    // Let everyone know that the LED Strip is initialised
    this.emit(LED_STRIP_EVENT.INITIALISED, undefined);
  }

  /**
   * Fired when this class is initialised
   */
  private handleInitialised() {
    this.log.info('LED Device Initialised.');

    this.render();
  }

  /**
   * @description
   * Fired by the application JUST before process termination
   */
  private handleApplicationTerminate() {
    // Make sure that the LED strip is reset prior to terminating the application
    this.device.reset();
    // eslint-disable-next-line no-process-exit
    process.nextTick(() => { process.exit(0); });
  }

  /**
   * Take the information about the state of the LED strip and update it on the device
   */
  public async render():Promise<void> {
    this.device.render(this.pixelData);
  }

  /**
   * Update the LED Colors for the front, left/right and rear strip sections
   */
  public async setLEDs(ledColors: Partial<LEDColors>): Promise<void> {
    this._ledColors = {
      ...this._ledColors,
      ...ledColors,
    };
  }
}
