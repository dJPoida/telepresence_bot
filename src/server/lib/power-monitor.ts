import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { Power } from '../../shared/types/power.type';
import { PowerMonitorEventMap, POWER_MONITOR_EVENT } from '../const/power-monitor-event.const';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';

export class PowerMonitor extends TypedEventEmitter<PowerMonitorEventMap> {
  protected readonly log = classLoggerFactory(this);
  private _initialised = false;

  /**
   * @constructor
   */
  constructor() {
    super();
    this.bindEvents();
  }

  /**
   * Whether the Power Monitor has been initialised
   */
  get initialised(): boolean { return this._initialised; }

  /**
   * returns true if the hardware is available
   * TODO
   */
  get hardwareAvailable(): boolean { return false; }

  get current(): null | number {
    // TODO: current
    return this.hardwareAvailable ? 0 : null;
  }

  get voltage(): null | number {
    // TODO: voltage
    return this.hardwareAvailable ? 0 : null;
  }

  get power(): Power { return {
    current: this.current,
    voltage: this.voltage,
  }; }

  /**
   * Bind the event listeners this class cares about
   */
  private bindEvents(): void {
    this.once(POWER_MONITOR_EVENT.INITIALISED, this.handleInitialised.bind(this));
  }

  /**
   * Initialise the class
   */
  public async initialise(): Promise<void> {
    this.log.info('Power Monitor initialising...');

    // TODO: more power monitor initialisation

    // Let everyone know that the Power Monitor is initialised
    this._initialised = true;
    this.emit(POWER_MONITOR_EVENT.INITIALISED, undefined);
  }

  /**
   * Shut down this class
   */
  public async shutDown(): Promise<void> {
    if (this.initialised) {
      this.log.info('Power Monitor shutting down...');
      // TODO: shutdown the Power Monitor
    }
  }

  /**
   * Fired when this class is initialised
   */
  private handleInitialised() {
    this.log.info('Power Monitor Initialised.');
  }
}
