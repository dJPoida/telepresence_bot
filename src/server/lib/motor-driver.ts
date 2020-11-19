import { Gpio } from 'pigpio';
import { Bus } from 'async-i2c-bus';
import { PCA9685 } from 'pca9685-promise';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { MotorDriverEventMap, MOTOR_DRIVER_EVENT } from '../const/motor-driver-event.const';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';
import { WHEEL } from '../../shared/constants/wheel.const';
import { DIRECTION, A_DIRECTION } from '../../shared/constants/direction.const';
import { env } from '../env'; 

type wheelDefinition = {
  direction: A_DIRECTION,
  pwmChannel: number,
  pinNoForward: number,
  pinNoReverse: number,
  gpioForward: null | Gpio,
  gpioReverse: null | Gpio,
}

export class MotorDriver extends TypedEventEmitter<MotorDriverEventMap> {
  protected readonly log = classLoggerFactory(this);
  private _initialised = false;
  private speed = 1;
  private i2cBus: null | Bus = null;
  private pca9685: null | PCA9685 = null;
  private wheels: Record<string, wheelDefinition> = {
    [WHEEL.FRONT_LEFT]: {
      direction: DIRECTION.FORWARD,
      pwmChannel: env.MOTOR_FL_PWM_CHANNEL,
      pinNoForward: env.MOTOR_FL_DIR_PIN_FORWARD,
      pinNoReverse: env.MOTOR_FL_DIR_PIN_REVERSE,
      gpioForward: null,
      gpioReverse: null,
    },
    [WHEEL.FRONT_RIGHT]: {
      direction: DIRECTION.FORWARD,
      pwmChannel: env.MOTOR_FR_PWM_CHANNEL,
      pinNoForward: env.MOTOR_FR_DIR_PIN_FORWARD,
      pinNoReverse: env.MOTOR_FR_DIR_PIN_REVERSE,
      gpioForward: null,
      gpioReverse: null,
    },
    [WHEEL.REAR_LEFT]: {
      direction: DIRECTION.FORWARD,
      pwmChannel: env.MOTOR_RL_PWM_CHANNEL,
      pinNoForward: env.MOTOR_RL_DIR_PIN_FORWARD,
      pinNoReverse: env.MOTOR_RL_DIR_PIN_REVERSE,
      gpioForward: null,
      gpioReverse: null,
    },
    [WHEEL.REAR_RIGHT]: {
      direction: DIRECTION.FORWARD,
      pwmChannel: env.MOTOR_RR_PWM_CHANNEL,
      pinNoForward: env.MOTOR_RR_DIR_PIN_FORWARD,
      pinNoReverse: env.MOTOR_RR_DIR_PIN_REVERSE,
      gpioForward: null,
      gpioReverse: null,
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
        //@ts-ignore
        this.pca9685 = new PCA9685(this.i2cBus, { address: env.I2C_ADDRESS_PCA9685, frequency: env.MOTOR_PWM_FREQUENCY });

        // Setup the motor driver Enable Pins
        console.log(` - Assigning the Motor Control pins:`);
        Object.entries(this.wheels).forEach(([wheelId, wheelConfig]) => {
          wheelConfig.gpioForward = new Gpio(wheelConfig.pinNoForward, {mode: Gpio.OUTPUT});
          wheelConfig.gpioReverse = new Gpio(wheelConfig.pinNoReverse, {mode: Gpio.OUTPUT});
        })
    
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
      console.log(` - PCA9685: No I2C hardware available. Skipping.`);
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
      })

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
}
