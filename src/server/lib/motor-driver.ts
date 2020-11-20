import { Gpio } from 'pigpio';
import { Bus } from 'async-i2c-bus';
import { PCA9685 } from 'pca9685-promise';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { map } from '../../shared/helpers/map.helper';
import { XYCoordinate } from '../../shared/types/xy-coordinate.type';
import { MotorDriverEventMap, MOTOR_DRIVER_EVENT } from '../const/motor-driver-event.const';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';
import { WHEEL } from '../../shared/constants/wheel.const';
import { DIRECTION, A_DIRECTION } from '../../shared/constants/direction.const';
import { env } from '../env';
import { constrain } from '../../shared/helpers/constrain.helper';

type wheelDefinition = {
  direction: A_DIRECTION,
  pwmChannel: number,
  pinNoForward: number,
  pinNoReverse: number,
  gpioForward: null | Gpio,
  gpioReverse: null | Gpio,
  targetPWM: number,
  actualPWM: number,
}

const UPDATE_INTERVAL_MS = 50;

export class MotorDriver extends TypedEventEmitter<MotorDriverEventMap> {
  protected readonly log = classLoggerFactory(this);
  private _initialised = false;
  private driveInput: XYCoordinate = { x: 0, y: 0 };
  private speed = 1;
  private i2cBus: null | Bus = null;
  private pca9685: null | PCA9685 = null;
  private updateInterval: null | ReturnType<typeof setInterval> = null;
  private wheels: Record<string, wheelDefinition> = {
    [WHEEL.FRONT_LEFT]: {
      direction: DIRECTION.STATIONARY,
      pwmChannel: env.MOTOR_FL_PWM_CHANNEL,
      pinNoForward: env.MOTOR_FL_DIR_PIN_FORWARD,
      pinNoReverse: env.MOTOR_FL_DIR_PIN_REVERSE,
      gpioForward: null,
      gpioReverse: null,
      targetPWM: 0,
      actualPWM: 0,
    },
    [WHEEL.FRONT_RIGHT]: {
      direction: DIRECTION.STATIONARY,
      pwmChannel: env.MOTOR_FR_PWM_CHANNEL,
      pinNoForward: env.MOTOR_FR_DIR_PIN_FORWARD,
      pinNoReverse: env.MOTOR_FR_DIR_PIN_REVERSE,
      gpioForward: null,
      gpioReverse: null,
      targetPWM: 0,
      actualPWM: 0,
    },
    [WHEEL.REAR_LEFT]: {
      direction: DIRECTION.STATIONARY,
      pwmChannel: env.MOTOR_RL_PWM_CHANNEL,
      pinNoForward: env.MOTOR_RL_DIR_PIN_FORWARD,
      pinNoReverse: env.MOTOR_RL_DIR_PIN_REVERSE,
      gpioForward: null,
      gpioReverse: null,
      targetPWM: 0,
      actualPWM: 0,
    },
    [WHEEL.REAR_RIGHT]: {
      direction: DIRECTION.STATIONARY,
      pwmChannel: env.MOTOR_RR_PWM_CHANNEL,
      pinNoForward: env.MOTOR_RR_DIR_PIN_FORWARD,
      pinNoReverse: env.MOTOR_RR_DIR_PIN_REVERSE,
      gpioForward: null,
      gpioReverse: null,
      targetPWM: 0,
      actualPWM: 0,
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
  public async initialise(kernelI2cBus: Bus | null): Promise<void> {
    this.log.info('Motor Driver initialising...');

    // Setup the PCA9685
    if (kernelI2cBus) {
      console.log(` - PCA9685 at address 0x${env.I2C_ADDRESS_PCA9685.toString(16)} at frequency ${env.MOTOR_PWM_FREQUENCY}Hz`);
      this.i2cBus = kernelI2cBus;

      if (this.i2cBus && this.i2cBus.isOpen) {
        // @ts-ignore
        this.pca9685 = new PCA9685(this.i2cBus, { address: env.I2C_ADDRESS_PCA9685, frequency: env.MOTOR_PWM_FREQUENCY });

        // Setup the motor driver Enable Pins
        console.log(' - Assigning the Motor Control pins:');
        Object.entries(this.wheels).forEach(([wheelId, wheelConfig]) => {
          wheelConfig.gpioForward = new Gpio(wheelConfig.pinNoForward, { mode: Gpio.OUTPUT });
          wheelConfig.gpioReverse = new Gpio(wheelConfig.pinNoReverse, { mode: Gpio.OUTPUT });
        });

        console.log(' - init PCA9685...');
        await this.pca9685.init();

        // console.log(' # ');
        // console.log(' # Test Run...');
        // Object.entries(this.wheels).forEach(async ([wheelId, wheelConfig]) => {
        //   if (wheelConfig.gpioForward) {
        //     console.log(` # Setting GPIO ${wheelConfig.pinNoForward} to ${wheelConfig.direction === DIRECTION.FORWARD ? 1 : 0}`);
        //     wheelConfig.gpioForward.digitalWrite(wheelConfig.direction === DIRECTION.FORWARD ? 1 : 0);
        //   }
        //   if (wheelConfig.gpioReverse) {
        //     console.log(` # Setting GPIO ${wheelConfig.pinNoReverse} to ${wheelConfig.direction === DIRECTION.REVERSE ? 1 : 0}`);
        //     wheelConfig.gpioReverse.digitalWrite(wheelConfig.direction === DIRECTION.REVERSE ? 1 : 0);
        //   }
        //   if (this.pca9685) {
        //     await this.pca9685.set_pwm(wheelConfig.pwmChannel, 0, env.MOTOR_MIN_PWM);
        //   }
        // });
      }
    } else {
      // no i2cBus - hardware not available
      console.log(' - PCA9685: No I2C hardware available. Skipping.');
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

      // Teardown the Enable Pins
      console.log(' - Motor Control Enable Pins');
      Object.entries(this.wheels).forEach(([wheelId, wheelConfig]) => {
        if (wheelConfig.gpioForward) {
          wheelConfig.gpioForward.pwmWrite(0);
        }
        if (wheelConfig.gpioReverse) {
          wheelConfig.gpioReverse.pwmWrite(0);
        }
      });

      console.log(' - PCA9685');
      if (this.pca9685) {
        await this.pca9685.shutdown_all();
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
    this.calculateTargetPWMs();
  }

  /**
   * Fired by the Kernel when the input manager receives a set speed event
   */
  public setSpeed(speed: number): void {
    this.speed = constrain(speed, 0, 100);
    this.calculateTargetPWMs();
  }

  /**
   * Fired by the Kernel for any reason that would require the motors to stop
   */
  public stop(): void {
    this.driveInput = { x: 0, y: 0 };
    this.calculateTargetPWMs();
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
  }

  /**
   * Using the input data and other factors, calculate the target PWMs for each wheel
   */
  private calculateTargetPWMs() {
    // TODO: This is ALL temporary until the direction control is accounted for

    const oldTargetPWM_FL = this.wheels[WHEEL.FRONT_LEFT].targetPWM;
    const oldTargetPWM_FR = this.wheels[WHEEL.FRONT_RIGHT].targetPWM;
    const oldTargetPWM_RL = this.wheels[WHEEL.REAR_LEFT].targetPWM;
    const oldTargetPWM_RR = this.wheels[WHEEL.REAR_RIGHT].targetPWM;

    // TODO: factor in X
    const leftEffectiveSpeed = (this.driveInput.y * (this.speed / 100));
    const rightEffectiveSpeed = (this.driveInput.y * (this.speed / 100));

    console.log(`speed: ${leftEffectiveSpeed / rightEffectiveSpeed}`);

    this.wheels[WHEEL.FRONT_LEFT].targetPWM = leftEffectiveSpeed > 0 ? map(leftEffectiveSpeed, 0, 100, env.MOTOR_MIN_PWM, env.MOTOR_MAX_PWM) : 0;
    this.wheels[WHEEL.FRONT_RIGHT].targetPWM = rightEffectiveSpeed > 0 ? map(rightEffectiveSpeed, 0, 100, env.MOTOR_MIN_PWM, env.MOTOR_MAX_PWM) : 0;
    this.wheels[WHEEL.REAR_LEFT].targetPWM = leftEffectiveSpeed > 0 ? map(leftEffectiveSpeed, 0, 100, env.MOTOR_MIN_PWM, env.MOTOR_MAX_PWM) : 0;
    this.wheels[WHEEL.REAR_RIGHT].targetPWM = rightEffectiveSpeed > 0 ? map(rightEffectiveSpeed, 0, 100, env.MOTOR_MIN_PWM, env.MOTOR_MAX_PWM) : 0;

    const changed = (
      (oldTargetPWM_FL !== this.wheels[WHEEL.FRONT_LEFT].targetPWM)
      || (oldTargetPWM_FR !== this.wheels[WHEEL.FRONT_RIGHT].targetPWM)
      || (oldTargetPWM_RL !== this.wheels[WHEEL.REAR_LEFT].targetPWM)
      || (oldTargetPWM_RR !== this.wheels[WHEEL.REAR_RIGHT].targetPWM)
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
    let nothingHappening = true;

    const acceleration = 0.1;

    Object.entries(this.wheels).forEach(async ([wheelId, wheelConfig]) => {
      let newActualPWM = wheelConfig.actualPWM + ((wheelConfig.targetPWM - wheelConfig.actualPWM) * acceleration);
      newActualPWM = constrain(newActualPWM, env.MOTOR_MIN_PWM, env.MOTOR_MAX_PWM);
      if (wheelConfig.targetPWM === 0 && wheelConfig.actualPWM <= (env.MOTOR_MIN_PWM + 1)) {
        wheelConfig.actualPWM = 0;
      } else {
        wheelConfig.actualPWM = newActualPWM;
        nothingHappening = false;
      }

      if (this.pca9685) await this.pca9685.set_pwm(wheelConfig.pwmChannel, 0, wheelConfig.actualPWM);

      // Determine the direction pins from the current actual PWM to write
      wheelConfig.direction = (wheelConfig.actualPWM === 0) ? DIRECTION.STATIONARY : ((wheelConfig.actualPWM > 0) ? DIRECTION.FORWARD : DIRECTION.REVERSE);
      if (wheelConfig.gpioForward) wheelConfig.gpioForward.digitalWrite(wheelConfig.direction === DIRECTION.FORWARD ? 1 : 0);
      if (wheelConfig.gpioReverse) wheelConfig.gpioReverse.digitalWrite(wheelConfig.direction === DIRECTION.REVERSE ? 1 : 0);
    });

    // sleep if the targetPWMs and ActualPWMs all = 0
    if (nothingHappening) this.sleep();
  }
}
