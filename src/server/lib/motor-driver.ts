import { Gpio, Pigpio } from 'node-pigpio-if/dist/types';
import { PromisifiedBus } from 'i2c-bus';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { XYCoordinate } from '../../shared/types/xy-coordinate.type';
import { MotorDriverEventMap, MOTOR_DRIVER_EVENT } from '../const/motor-driver-event.const';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';
import { WHEEL } from '../../shared/constants/wheel.const';
import { DIRECTION, A_DIRECTION } from '../../shared/constants/direction.const';
import { env } from '../env';
import { constrain } from '../../shared/helpers/constrain.helper';
import { asyncPca9685, Pca9685Driver } from './wrappers/async-pca9685';
import { map } from '../../shared/helpers/map.helper';

type wheelDefinition = {
  direction: A_DIRECTION,
  pwmChannel: number,
  pinNoForward: number,
  pinNoReverse: number,
  gpioForward: null | Gpio,
  gpioReverse: null | Gpio,
  targetSpeed: number,
  actualSpeed: number,
}

const UPDATE_INTERVAL_MS = 50;

export class MotorDriver extends TypedEventEmitter<MotorDriverEventMap> {
  protected readonly log = classLoggerFactory(this);
  private _initialised = false;
  private driveInput: XYCoordinate = { x: 0, y: 0 };
  private speed = 1;
  private i2cBus: null | PromisifiedBus = null;
  private pigpio: null | Pigpio = null;
  private pca9685: null | Pca9685Driver = null;
  private updateInterval: null | ReturnType<typeof setInterval> = null;
  private wheels: Record<string, wheelDefinition> = {
    [WHEEL.FRONT_LEFT]: {
      direction: DIRECTION.STATIONARY,
      pwmChannel: env.MOTOR_FL_PWM_CHANNEL,
      pinNoForward: env.MOTOR_FL_DIR_PIN_FORWARD,
      pinNoReverse: env.MOTOR_FL_DIR_PIN_REVERSE,
      gpioForward: null,
      gpioReverse: null,
      targetSpeed: 0,
      actualSpeed: 0,
    },
    [WHEEL.FRONT_RIGHT]: {
      direction: DIRECTION.STATIONARY,
      pwmChannel: env.MOTOR_FR_PWM_CHANNEL,
      pinNoForward: env.MOTOR_FR_DIR_PIN_FORWARD,
      pinNoReverse: env.MOTOR_FR_DIR_PIN_REVERSE,
      gpioForward: null,
      gpioReverse: null,
      targetSpeed: 0,
      actualSpeed: 0,
    },
    [WHEEL.REAR_LEFT]: {
      direction: DIRECTION.STATIONARY,
      pwmChannel: env.MOTOR_RL_PWM_CHANNEL,
      pinNoForward: env.MOTOR_RL_DIR_PIN_FORWARD,
      pinNoReverse: env.MOTOR_RL_DIR_PIN_REVERSE,
      gpioForward: null,
      gpioReverse: null,
      targetSpeed: 0,
      actualSpeed: 0,
    },
    [WHEEL.REAR_RIGHT]: {
      direction: DIRECTION.STATIONARY,
      pwmChannel: env.MOTOR_RR_PWM_CHANNEL,
      pinNoForward: env.MOTOR_RR_DIR_PIN_FORWARD,
      pinNoReverse: env.MOTOR_RR_DIR_PIN_REVERSE,
      gpioForward: null,
      gpioReverse: null,
      targetSpeed: 0,
      actualSpeed: 0,
    },
  }

  /**
   * @constructor
   */
  constructor() {
    super();

    this.handleInitialised = this.handleInitialised.bind(this);
    this.bindEvents();
  }

  /**
   * Whether the Motor Driver has been initialised
   */
  get initialised(): boolean { return this._initialised; }

  /**
   * returns true if the raspberry pi hardware is available
   * (basically if the i2cBus was passed into the constructor)
   */
  get hardwareAvailable(): boolean { return !!this.i2cBus; }

  /**
   * Returns true if the update interval is not set
   */
  get isSleeping(): boolean { return this.updateInterval === null; }

  /**
   * Returns true if the update interval is not set
   */
  get isAwake(): boolean { return this.updateInterval !== null; }

  /**
   * Bind the event listeners this class cares about
   */
  private bindEvents(): void {
    this.once(MOTOR_DRIVER_EVENT.INITIALISED, this.handleInitialised);
  }

  /**
   * Unbind the event listeners this class cares about
   */
  private unbindEvents(): void {
    this.off(MOTOR_DRIVER_EVENT.INITIALISED, this.handleInitialised);
  }

  /**
   * Initialise the class
   */
  public async initialise(kernelI2cBus: PromisifiedBus | null, kernelPigpio: Pigpio | null): Promise<void> {
    this.log.info('Motor Driver initialising...');

    // Setup the PCA9685
    if (kernelI2cBus && kernelPigpio) {
      this.log.info(` - PCA9685 at address 0x${env.I2C_ADDRESS_PCA9685.toString(16)} at frequency ${env.MOTOR_PWM_FREQUENCY}Hz`);
      this.i2cBus = kernelI2cBus;
      this.pigpio = kernelPigpio;

      if (this.i2cBus) {
        const newPca9685Driver: Error | Pca9685Driver = await asyncPca9685({
          i2c: this.i2cBus.bus(),
          address: env.I2C_ADDRESS_PCA9685,
          frequency: env.MOTOR_PWM_FREQUENCY,
        });

        this.log.info(' - init PCA9685...');
        if (!(newPca9685Driver instanceof Error)) {
          this.pca9685 = newPca9685Driver;

          // Setup the motor driver Enable Pins
          this.log.info(' - Assigning the Motor Control pins:');
          Object.entries(this.wheels).forEach(([wheelId, wheelConfig]) => {
            if (this.pigpio) {
              wheelConfig.gpioForward = this.pigpio.gpio(wheelConfig.pinNoForward);
              wheelConfig.gpioForward.write(0);
              wheelConfig.gpioReverse = this.pigpio.gpio(wheelConfig.pinNoReverse);
              wheelConfig.gpioReverse.write(0);
            }
          });
        } else {
          // no PCA9685 - hardware not available
          this.log.error(' - PCA9685: Problem initialising the PCA9685: ', newPca9685Driver);
        }
      }
    } else {
      // no i2cBus - hardware not available
      this.log.warn(' - PCA9685: No I2C hardware available. Skipping.');
    }

    // Let everyone know that the Motor Driver is initialised
    this._initialised = true;
    this.emit(MOTOR_DRIVER_EVENT.INITIALISED, undefined);
  }

  /**
   * Shut down this class
   */
  public async shutDown(): Promise<void> {
    this.unbindEvents();

    if (this.initialised) {
      this.log.info('Motor Driver shutting down...');

      // Stop updating the motors
      if (this.updateInterval) {
        this.log.debug(' - Update Interval');
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }

      // Tear down the Enable Pins
      this.log.info(' - Motor Control Enable Pins');
      Object.entries(this.wheels).forEach(async ([wheelId, wheelConfig]) => {
        if (wheelConfig.gpioForward) wheelConfig.gpioForward.write(0);
        if (wheelConfig.gpioReverse) wheelConfig.gpioReverse.write(0);
      });

      // Tear down the PCA9685 PWM channels
      this.log.info(' - PCA9685');
      if (this.pca9685) {
        this.pca9685.dispose();
      }
    }
  }

  /**
   * Fired when this class is initialised
   */
  private handleInitialised() {
    this.log.info('Motor Driver Initialised.');
  }

  /**
   * Fired by the Kernel when the input manager receives a drive event
   */
  public setDriveInput(drive: XYCoordinate): void {
    this.driveInput = drive;
    this.calculateTargets();
  }

  /**
   * Fired by the Kernel when the input manager receives a set speed event
   */
  public setSpeed(speed: number): void {
    this.speed = constrain(speed, 0, 100);
    this.calculateTargets();
  }

  /**
   * Fired by the Kernel for any reason that would require the motors to stop
   */
  public stop(): void {
    this.driveInput = { x: 0, y: 0 };
    this.calculateTargets();
  }

  /**
   * Start calling update on an interval
   */
  private wake() {
    if (!this.updateInterval) {
      this.log.debug('Motor Driver Waking');
      this.updateInterval = setInterval(this.update.bind(this), UPDATE_INTERVAL_MS);
    }
  }

  /**
   * Stop calling update
   */
  private sleep() {
    if (this.updateInterval) {
      this.log.debug('Motor Driver Sleeping');
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.update();
  }

  /**
   * Using the input data and other factors, calculate the target speeds for each wheel
   *
   * @see http://home.kendra.com/mauser/joystick.html
   */
  private calculateTargets() {
    const oldTargetSpeed_FL = this.wheels[WHEEL.FRONT_LEFT].targetSpeed;
    const oldTargetSpeed_FR = this.wheels[WHEEL.FRONT_RIGHT].targetSpeed;
    const oldTargetSpeed_RL = this.wheels[WHEEL.REAR_LEFT].targetSpeed;
    const oldTargetSpeed_RR = this.wheels[WHEEL.REAR_RIGHT].targetSpeed;

    const x = this.driveInput.x * -1;
    const { y } = this.driveInput;

    const v = (100 - Math.abs(x)) * (y / 100) + y;
    const w = (100 - Math.abs(y)) * (x / 100) + x;

    const targetLeftSpeed = (((v - w) / 2) * (this.speed / 100));
    const targetRightSpeed = (((v + w) / 2) * (this.speed / 100));

    this.wheels[WHEEL.FRONT_LEFT].targetSpeed = targetLeftSpeed;
    this.wheels[WHEEL.FRONT_RIGHT].targetSpeed = targetRightSpeed;
    this.wheels[WHEEL.REAR_LEFT].targetSpeed = targetLeftSpeed;
    this.wheels[WHEEL.REAR_RIGHT].targetSpeed = targetRightSpeed;

    const changed = (
      (oldTargetSpeed_FL !== this.wheels[WHEEL.FRONT_LEFT].targetSpeed)
      || (oldTargetSpeed_FR !== this.wheels[WHEEL.FRONT_RIGHT].targetSpeed)
      || (oldTargetSpeed_RL !== this.wheels[WHEEL.REAR_LEFT].targetSpeed)
      || (oldTargetSpeed_RR !== this.wheels[WHEEL.REAR_RIGHT].targetSpeed)
    );

    // Wake up the motor controller if it needs to start updating
    if (changed && this.hardwareAvailable && this.isSleeping) {
      this.wake();
    }
  }

  /**
   * Called on an interval, update the wheels actual PWMs based on the targets
   * and apply the PWMs to the motors
   */
  private update() {
    let somethingChanged = false;

    const acceleration = 10;

    Object.entries(this.wheels).forEach(async ([wheelId, wheelConfig]) => {
      const { actualSpeed, targetSpeed } = wheelConfig;

      let newActualSpeed = 0;

      let sign = 0;
      if (targetSpeed !== actualSpeed) {
        sign = targetSpeed > actualSpeed ? 1 : -1;
      }

      newActualSpeed = actualSpeed + (acceleration * sign);

      // If the sign is zero - the is no change to the actual speed.
      // But if the actual speed doesn't = zero, we need to shut it down
      if (sign === 0 && wheelConfig.actualSpeed !== newActualSpeed) {
        somethingChanged = true;

        // Shut it down
        wheelConfig.direction = DIRECTION.STATIONARY;
        wheelConfig.actualSpeed = 0;
        if (this.pca9685) this.pca9685.channelOff(wheelConfig.pwmChannel);
        if (wheelConfig.gpioForward) wheelConfig.gpioForward.write(0);
        if (wheelConfig.gpioReverse) wheelConfig.gpioReverse.write(0);
      }

      // If there need to be a change to the wheel speed
      else if (wheelConfig.actualSpeed !== newActualSpeed) {
        somethingChanged = true;

        // Prevent the new actual speed from oscillating around zero
        if (targetSpeed === 0 && (newActualSpeed < acceleration) && (newActualSpeed > -acceleration)) {
          newActualSpeed = 0;
        }

        // Prevent the new actual speed from exceeding the constraints
        newActualSpeed = constrain(newActualSpeed, -100, 100);

        wheelConfig.actualSpeed = newActualSpeed;
        if (this.pca9685) {
          this.pca9685.setDutyCycle(wheelConfig.pwmChannel, Math.abs(wheelConfig.actualSpeed) / 100);
        }

        // Determine the direction pins from the current actual PWM to write
        wheelConfig.direction = (wheelConfig.actualSpeed === 0) ? DIRECTION.STATIONARY : ((wheelConfig.actualSpeed > 0) ? DIRECTION.FORWARD : DIRECTION.REVERSE);
        if (wheelConfig.gpioForward) wheelConfig.gpioForward.write(wheelConfig.direction === DIRECTION.FORWARD ? 1 : 0);
        if (wheelConfig.gpioReverse) wheelConfig.gpioReverse.write(wheelConfig.direction === DIRECTION.REVERSE ? 1 : 0);
      }
    });

    // sleep if the targetSpeeds and actualSpeeds all = 0
    if (this.isAwake && !somethingChanged) this.sleep();
  }
}
