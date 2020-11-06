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
  private wheels: Record<string, wheelDefinition> = {
    [WHEEL.FRONT_LEFT]: {
      direction: DIRECTION.STATIONARY,
      pwmChannel: env.MOTOR_FL_PWM_CHANNEL,
      pinNoForward: env.MOTOR_FL_DIR_PIN_FORWARD,
      pinNoReverse: env.MOTOR_FL_DIR_PIN_REVERSE,
      gpioForward: null,
      gpioReverse: null,
    },
    [WHEEL.FRONT_RIGHT]: {
      direction: DIRECTION.STATIONARY,
      pwmChannel: env.MOTOR_FR_PWM_CHANNEL,
      pinNoForward: env.MOTOR_FR_DIR_PIN_FORWARD,
      pinNoReverse: env.MOTOR_FR_DIR_PIN_REVERSE,
      gpioForward: null,
      gpioReverse: null,
    },
    [WHEEL.REAR_LEFT]: {
      direction: DIRECTION.STATIONARY,
      pwmChannel: env.MOTOR_RL_PWM_CHANNEL,
      pinNoForward: env.MOTOR_RL_DIR_PIN_FORWARD,
      pinNoReverse: env.MOTOR_RL_DIR_PIN_REVERSE,
      gpioForward: null,
      gpioReverse: null,
    },
    [WHEEL.REAR_RIGHT]: {
      direction: DIRECTION.STATIONARY,
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
   * TODO
   */
  get hardwareAvailable(): boolean { return false; }

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
  public async initialise(): Promise<void> {
    this.log.info('Motor Driver initialising...');

    // Setup the I2C Bus
    console.log(` - I2C Bus number ${env.I2C_BUS_NO}`);

    this.i2cBus = new Bus({busNumber: env.I2C_BUS_NO});

    // Setup the PCA9685
    // console.log(` - PCA9685 at address 0x${I2C_ADDRESS.toString(16)} at frequency ${PWM_FREQUENCY}Hz`);
    // const pca9685 = new PCA9685(bus, { address: I2C_ADDRESS, frequency: PWM_FREQUENCY });

    // const run = async () => {
    //     console.log('');
    //     console.log('Initialisation...');

    //     // Setup the motor driver Enable Pins
    //     console.log(`Assigning the Motor Control pins:`);
    //     Object.entries(wheels).forEach(([wheel, config]) => {
    //         if (config.enabled) {
    //             console.log(`   - ${config.name}: ${config.direction === DIRECTION_FORWARD ? 'Forward' : 'Reverse'} (${config.dirPin1No} = ${config.direction === DIRECTION_FORWARD ? 0 : 1} / ${config.dirPin2No} = ${config.direction === DIRECTION_FORWARD ? 1 : 0})`);
    //             config.dirPin1 = new Gpio(config.dirPin1No, 'out');
    //             config.dirPin2 = new Gpio(config.dirPin2No, 'out');
    //         };
    //     })

    //     console.log('opening the I2C Bus...');
    //     await bus.open();

    //     console.log('init PCA9685...');
    //     await pca9685.init();

    //     console.log('');
    //     console.log('Running...');
    //     Object.entries(wheels).forEach(async ([wheel, config]) => {
    //         if (config.enabled) {
    //             config.dirPin1.writeSync(config.direction === DIRECTION_FORWARD ? 0 : 1);
    //             config.dirPin2.writeSync(config.direction === DIRECTION_FORWARD ? 1 : 0);
    //             await pca9685.set_pwm(config.pwmChannel, 0, MAX_PWM);
    //         };
    //     });
    // }

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
      // TODO: shutdown the Motor Driver

      //         // Teardown the Enable Pins
      //         console.log(' - Motor Control Enable Pins');
      //         Object.entries(wheels).forEach(([wheel, config]) => {
      //             if (config.enabled) {
      //                 config.dirPin1.writeSync(0);
      //                 config.dirPin2.writeSync(0);
      //                 config.dirPin1.unexport();
      //                 config.dirPin2.unexport();
      //             }
      //         })

      //         console.log(' - PCA9685');
      //         await pca9685.shutdown_all();

      //         console.log(' - I2C Bus');
      //         await bus.close();
      //     }
    }
  }

  /**
   * Fired when this class is initialised
   */
  private handleInitialised() {
    this.log.info('Motor Driver Initialised.');
  }
}
