import { Gpio } from 'pigpio';
import { PromisifiedBus } from 'i2c-bus';
import { PCA9685 } from 'pca9685-promise';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { MotorDriverEventMap, MOTOR_DRIVER_EVENT } from '../const/motor-driver-event.const';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';

// const speed = 1;
// const wheels = {
//     [FRONT_RIGHT]: {
//         name: 'Front Right (FR)',
//         enabled: true,
//         direction: DIRECTION_FORWARD,
//         dirPin1No: FRONT_RIGHT_DIR_PIN_1,
//         dirPin2No: FRONT_RIGHT_DIR_PIN_2,
//         pwmChannel: FRONT_RIGHT_PWM_CHANNEL,
//         dirPin1: null,
//         dirPin2: null,
//     },
//     [FRONT_LEFT]: {
//         name: 'Front Left (FL)',
//         enabled: true,
//         direction: DIRECTION_REVERSE,
//         dirPin1No: FRONT_LEFT_DIR_PIN_1,
//         dirPin2No: FRONT_LEFT_DIR_PIN_2,
//         pwmChannel: FRONT_LEFT_PWM_CHANNEL,
//         dirPin1: null,
//         dirPin2: null,
//     },
//     [REAR_RIGHT]: {
//         name: 'Rear Right (RR)',
//         enabled: true,
//         direction: DIRECTION_FORWARD,
//         dirPin1No: REAR_RIGHT_DIR_PIN_1,
//         dirPin2No: REAR_RIGHT_DIR_PIN_2,
//         pwmChannel: REAR_RIGHT_PWM_CHANNEL,
//         dirPin1: null,
//         dirPin2: null,
//     },
//     [REAR_LEFT]: {
//         name: 'Rear Left (RL)',
//         enabled: true,
//         direction: DIRECTION_REVERSE,
//         dirPin1No: REAR_LEFT_DIR_PIN_1,
//         dirPin2No: REAR_LEFT_DIR_PIN_2,
//         pwmChannel: REAR_LEFT_PWM_CHANNEL,
//         dirPin1: null,
//         dirPin2: null,
//     },
// }

// let shuttingDown = false;

// console.log('Construction...');

// // Setup the I2C Bus
// console.log(` - I2C Bus number ${I2C_BUS_NO}`);
// const bus = Bus.create( {busNumber: I2C_BUS_NO});

// // Setup the PCA9685
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

// run();

// //so the program will not close instantly
// process.stdin.resume();

export class MotorDriver extends TypedEventEmitter<MotorDriverEventMap> {
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
    this.once(MOTOR_DRIVER_EVENT.INITIALISED, this.handleInitialised.bind(this));
  }

  /**
   * Initialise the class
   */
  public async initialise(): Promise<void> {
    this.log.info('Motor Driver initialising...');

    // TODO: more initialisation

    // Let everyone know that the Motor Driver is initialised
    this._initialised = true;
    this.emit(MOTOR_DRIVER_EVENT.INITIALISED, undefined);
  }

  /**
   * Shut down this class
   */
  public async shutDown(): Promise<void> {
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
