import { AN_INA219_I2C_ADDRESS, Ina219, INA219_ADC_BITS, INA219_ADC_SAMPLE, INA219_BUS_VOLTAGE_RANGE, INA219_MODE, INA219_PGA_BITS } from '@djpoida/ina219';
import { env } from '../env';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { Power } from '../../shared/types/power.type';
import { PowerMonitorEventMap, POWER_MONITOR_EVENT } from '../const/power-monitor-event.const';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';
import { round } from '../../shared/helpers/round.helper';

const minBatteryVoltage = 10.5;
const maxBatteryVoltage = 12.3;

export class PowerMonitor extends TypedEventEmitter<PowerMonitorEventMap> {
  protected readonly log = classLoggerFactory(this);
  private readonly ina219: Ina219;
  private _initialised = false;
  private pollInterval: null | ReturnType<typeof setInterval> = null;

  private _averageVoltage = 0;
  private readonly voltageSamples: number[] = [];

  private _averageCurrent = 0;
  private readonly currentSamples: number[] = [];

  /**
   * @constructor
   */
  constructor() {
    super();

    this.ina219 = new Ina219();

    this.handleInitialised = this.handleInitialised.bind(this);
    this.handlePollValues = this.handlePollValues.bind(this);
    this.bindEvents();
  }

  /**
   * Whether the Power Monitor has been initialised
   */
  get initialised(): boolean { return this._initialised; }

  /**
   * returns true if the ina219 hardware is available
   */
  get hardwareAvailable(): boolean { return this.ina219.hardwareAvailable; }

  /**
   * Read the current passing through the ina219 in milliamps
   */
  get current(): null | number {
    return this.hardwareAvailable ? this._averageCurrent : null;
  }

  /**
   * Read the voltage of the battery
   */
  get voltage(): null | number {
    return this.hardwareAvailable ? this._averageVoltage : null;
  }

  /**
   * Convert the voltage of the battery into a battery 0.00% -> 100.00%
   */
  get battery(): null | number {
    return this.voltage ? Math.max(0, Math.min(100, round(((this.voltage - minBatteryVoltage) / (maxBatteryVoltage - minBatteryVoltage)) * 100, 2))) : 0;
  }

  /**
   * The complex object which includes the current consumption, battery voltage and battery level
   */
  get power(): Power { return {
    current: this.current,
    voltage: this.voltage,
    battery: this.battery,
  }; }

  /**
   * Bind the event listeners this class cares about
   */
  private bindEvents(): void {
    this.once(POWER_MONITOR_EVENT.INITIALISED, this.handleInitialised);
  }

  /**
   * Unbind the event listeners this class cares about
   */
  private unbindEvents(): void {
    this.off(POWER_MONITOR_EVENT.INITIALISED, this.handleInitialised);
  }

  /**
   * Initialise the class
   */
  public async initialise(): Promise<void> {
    this.log.info('Power Monitor initialising...');

    // Initialise the ina219
    const initResult = await this.ina219.init(env.I2C_BUS_NO, env.I2C_ADDRESS_INA219 as AN_INA219_I2C_ADDRESS);

    // Only perform the bulk of the hardware initialisation if we actually have hardware
    if (initResult === true && this.ina219.hardwareAvailable) {
      // Configure the sensor
      this.ina219.setBusRNG(INA219_BUS_VOLTAGE_RANGE.RANGE_32V);
      this.ina219.setPGA(INA219_PGA_BITS.PGA_BITS_8);
      this.ina219.setBusADC(INA219_ADC_BITS.ADC_BITS_12, INA219_ADC_SAMPLE.ADC_SAMPLE_8);
      this.ina219.setShuntADC(INA219_ADC_BITS.ADC_BITS_12, INA219_ADC_SAMPLE.ADC_SAMPLE_8);
      this.ina219.setMode(INA219_MODE.SHUNT_AND_BUS_VOL_CON);

      // Setup the timer for reading the values
      this.pollInterval = setInterval(this.handlePollValues, env.INA219_POLL_INTERVAL);
    } else {
      this.log.error(`Failed to initialise the Power Monitor: ${initResult}`);
    }

    // Let everyone know that the Power Monitor is initialised
    this._initialised = true;
    this.emit(POWER_MONITOR_EVENT.INITIALISED, undefined);
  }

  /**
   * Shut down this class
   */
  public async shutDown(): Promise<void> {
    this.unbindEvents();

    if (this.initialised) {
      this.log.info('Power Monitor shutting down...');
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
      await this.ina219.close();
    }
  }

  /**
   * Fired when this class is initialised
   */
  private handleInitialised() {
    this.log.info('Power Monitor Initialised.');
  }

  /**
   * Read the voltage and the current values
   */
  private async handlePollValues() {
    // Read the sensor
    const newVoltage = await this.ina219.getBusVoltage_V();
    const newCurrent = await this.ina219.getCurrent_mA();

    // Record the voltage sample and limit the sample count
    if (this.voltageSamples.push(newVoltage) > env.INA219_SAMPLES) {
      this.voltageSamples.shift();
    }
    if (this.currentSamples.push(newCurrent) > env.INA219_SAMPLES) {
      this.currentSamples.shift();
    }

    // Calculate the new averages
    this._averageVoltage = round(this.voltageSamples.reduce((a, b) => (a + b)) / this.voltageSamples.length, 2);
    this._averageCurrent = round(this.currentSamples.reduce((a, b) => (a + b)) / this.currentSamples.length, 2);

    this.emit(POWER_MONITOR_EVENT.UPDATE, this.power);
  }
}
