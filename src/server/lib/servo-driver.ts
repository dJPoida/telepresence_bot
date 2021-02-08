import { PromisifiedBus } from 'i2c-bus';
import { asyncPca9685, asyncPca9685ChannelOff, asyncPca9685ChannelOn, asyncPca9685PulseLength, Pca9685Driver } from './wrappers/async-pca9685';
import { SERVO } from '../../shared/constants/servo.const';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { ServoDriverEventMap, SERVO_DRIVER_EVENT } from '../const/servo-driver-event.const';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';
import { env } from '../env';
import { XYCoordinate } from '../../shared/types/xy-coordinate.type';
import { map } from '../../shared/helpers/map.helper';
import { wait } from '../../shared/helpers/wait.helper';
import { constrain } from '../../shared/helpers/constrain.helper';

type servoDefinition = {
  pwmChannel: number,
  targetPosition: number,
  actualPosition: number,
  velocity: number,
}

const UPDATE_INTERVAL_MS = 10;
const SERVO_POSITION_NOT_SET = -101;
const TILT_LOCK_WAIT_DURATION = 500;
const TILT_LOCK_WAIT = 250;
const PAN_TERMINAL_VELOCITY = 3;
const PAN_ACCELLERATION = 0.1;
const TILT_TERMINAL_VELOCITY = 3;
const TILT_ACCELLERATION = 0.1;

export class ServoDriver extends TypedEventEmitter<ServoDriverEventMap> {
  protected readonly log = classLoggerFactory(this);
  private _initialised = false;
  private panTiltInput: XYCoordinate = { x: 0, y: 0 };
  private i2cBus: null | PromisifiedBus = null;
  private pca9685: null | Pca9685Driver = null;
  private updateInterval: null | ReturnType<typeof setInterval> = null;
  private tiltLockEngaged: boolean = false;
  private engageTiltLockTimeout: null | ReturnType<typeof setTimeout> = null;
  private servos: Record<string, servoDefinition> = {
    [SERVO.PAN]: {
      pwmChannel: env.SERVO_PAN_PWM_CHANNEL,
      targetPosition: 0,
      actualPosition: SERVO_POSITION_NOT_SET,
      velocity: 0,
    },
    [SERVO.TILT]: {
      pwmChannel: env.SERVO_TILT_PWM_CHANNEL,
      targetPosition: 0,
      actualPosition: SERVO_POSITION_NOT_SET,
      velocity: 0,
    },
    [SERVO.TILT_LOCK]: {
      pwmChannel: env.SERVO_LOCK_PWM_CHANNEL,
      targetPosition: 0,
      actualPosition: 0,
      velocity: 0,
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
   * Whether the Servo Driver has been initialised
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
    this.once(SERVO_DRIVER_EVENT.INITIALISED, this.handleInitialised);
  }

  /**
   * Unbind the event listeners this class cares about
   */
  private unbindEvents(): void {
    this.off(SERVO_DRIVER_EVENT.INITIALISED, this.handleInitialised);
  }

  /**
   * Initialise the class
   */
  public async initialise(kernelI2cBus: PromisifiedBus | null): Promise<void> {
    this.log.info('Servo Driver initialising...');

    // Setup the PCA9685
    if (kernelI2cBus) {
      this.log.info(` - PCA9685 at address 0x${env.I2C_ADDRESS_PCA9685.toString(16)} at frequency ${env.SERVO_PWM_FREQUENCY}Hz`);
      this.i2cBus = kernelI2cBus;

      if (this.i2cBus) {
        try {
          const newPca9685Driver: Pca9685Driver = await asyncPca9685({
            i2c: this.i2cBus.bus(),
            address: env.I2C_ADDRESS_PCA9685,
            frequency: env.SERVO_PWM_FREQUENCY,
          });

          this.log.info(' - init PCA9685...');
          this.pca9685 = newPca9685Driver;
        } catch (err) {
            // no PCA9685 - hardware not available
            this.log.error(' - PCA9685: Problem initialising the PCA9685: ', err);
        }
      }
    } else {
      // no i2cBus - hardware not available
      this.log.warn(' - PCA9685: No I2C hardware available. Skipping.');
    }

    // TODO: more servo driver initialisation

    // Let everyone know that the Servo Driver is initialised
    this._initialised = true;
    this.emit(SERVO_DRIVER_EVENT.INITIALISED, undefined);
  }

  /**
   * Shut down this class
   */
  public async shutDown(): Promise<void> {
    this.unbindEvents();

    if (this.initialised) {
      this.log.info('servo Driver shutting down...');

      // Stop updating the servo positions
      if (this.updateInterval) {
        this.log.debug(' - Update Interval');
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }

      // Tear down the PCA9685 PWM channels
      this.log.info(' - PCA9685');
      if (this.pca9685) {
        // Disable the servos
        await this.disableServos();

        this.pca9685.dispose();
      }
    }
  }

  /**
   * Fired when this class is initialised
   */
  private handleInitialised() {
    this.log.info('Servo Driver Initialised.');
  }

  /**
   * Fired by the Kernel when the input manager receives a pan/tilt event
   */
  public setPanTiltInput(panTilt: XYCoordinate): void {
    this.panTiltInput = panTilt;
    this.calculateTargets();
  }


  /**
   * Turn off the servos
   */
  private async disableServos(): Promise<void> {
    if (this.pca9685) {
      // Disable the servos
      try { await asyncPca9685ChannelOff(this.pca9685, this.servos[SERVO.PAN].pwmChannel); } catch (err) {
        console.error('Error disabling the Pan servo: ', err);
      };
      try { await asyncPca9685ChannelOff(this.pca9685, this.servos[SERVO.TILT].pwmChannel); } catch (err) {
        console.error('Error disabling the Tilt servo: ', err);
      };
      try { await asyncPca9685ChannelOff(this.pca9685, this.servos[SERVO.TILT_LOCK].pwmChannel); } catch (err) {
        console.error('Error disabling the Tilt Lock servo: ', err);
      };
    }
  }

  
  /**
   * Start calling update on an interval
   */
  private wake() {
    if (!this.updateInterval) {
      this.log.debug('Servo Driver Waking');
      this.updateInterval = setInterval(this.update.bind(this), UPDATE_INTERVAL_MS);
    }
  }

  /**
   * Stop calling update
   */
  private sleep() {
    if (this.updateInterval) {
      this.log.debug('Servo Driver Sleeping');
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.update();
  }

  /**
   * Using the input data and other factors, calculate the target speeds for each servo
   */
  private calculateTargets() {
    const oldTarget_Pan = this.servos[SERVO.PAN].targetPosition;
    const oldTarget_Tilt = this.servos[SERVO.TILT].targetPosition;
    
    const targetPan = this.panTiltInput.x;
    const targetTilt = this.panTiltInput.y;
    
    this.servos[SERVO.PAN].targetPosition = targetPan;
    this.servos[SERVO.TILT].targetPosition = targetTilt;
    
    const changed = (
      (oldTarget_Pan !== this.servos[SERVO.PAN].targetPosition)
      || (oldTarget_Tilt !== this.servos[SERVO.TILT].targetPosition)
    );

    if (changed) console.log(this.panTiltInput);
      
    // Wake up the motor controller if it needs to start updating
    if (changed && this.hardwareAvailable && this.isSleeping) {
      this.wake();
    }
  }

  /**
   * Called by the update() method for each servo that needs to interpolate it's position over time.
   * @param position
   * @param velocity 
   * @param maxVelocity 
   * @param accelleration 
   */
  private calculateNewServoPositionAndVelocity(
    servo: servoDefinition,
    maxVelocity: number,
    accelleration: number
  ): {newPosition: number, newVelocity: number} {
    // Start with the current values
    const { actualPosition, targetPosition, velocity } = servo;
    let newPosition = actualPosition;
    let newVelocity = velocity;

    // The target direction defines whether we're moving in a positive or negative direction
    const targetDirection = actualPosition > targetPosition ? -1 : 1;

    // console.log(`A: ${actualPosition} T: ${targetPosition} D: ${targetDirection} V: ${velocity}`);

    // Target direction and current velocity are in the same direction
    if ((targetDirection > 0 && velocity >= 0) || (targetDirection < 0 && velocity <= 0)) {
      // Moving in a positive direction
      if (targetDirection >= 0) {
        // Rudimentary equation to increase velocity in the positive direction over time
        newVelocity = Math.min(maxVelocity, newVelocity + accelleration);
      }

      // Moving in a negative direction
      else {
        // Rudimentary equation to increase velocity in the negative direction over time
        newVelocity = Math.max(-maxVelocity, newVelocity - accelleration);
      }
    } 
  
    // Target direction and current velocity are in opposing directions
    else {
      // Moving in the positive direction but the current velocity is negative
      if (targetDirection > 0 && velocity < 0) {
        // Rudimentary equation to slow velocity over time
        newVelocity = Math.max(0, newVelocity - accelleration);
      }

      // Moving in the negative direction but the current velocity is positive
      else if (targetDirection < 0 && velocity > 0) {
        // Rudimentary equation to slow velocity over time
        newVelocity = Math.min(0, newVelocity + accelleration);
      }
    }

    // Apply the velocity to the position and constrain it to -100 -> 100
    newPosition = constrain(newPosition + newVelocity, -100, 100);

    // Round out the final position
    if (Math.abs(newPosition - targetPosition) < accelleration) {
      newPosition = targetPosition;
      newVelocity = 0;
    }

    // console.log(`A: ${actualPosition} T: ${targetPosition} V: ${newVelocity} P: ${newPosition}`);
    // console.log(`===`);

    return {
      newPosition,
      newVelocity,
    }
  }

  /**
   * Called on an interval, update the wheels actual PWMs based on the targets
   * and apply the PWMs to the motors
   */
  private async update() {
    let somethingChanged = false;

    // Only action an update if the driver is available
    if (this.pca9685) {
      
      // Pan servo
      const panServo = this.servos[SERVO.PAN];
      if (panServo.actualPosition !== panServo.targetPosition) {
        somethingChanged = true;

        // First time - just set the target position. After this the velocity curve will kick in
        if (panServo.actualPosition === SERVO_POSITION_NOT_SET) {
          panServo.actualPosition = panServo.targetPosition;
        } else {
          // Ease the actual position to the Target position
          const newPositionAndVelocity = this.calculateNewServoPositionAndVelocity(
            panServo,
            PAN_TERMINAL_VELOCITY,
            PAN_ACCELLERATION,
          )

          panServo.actualPosition = newPositionAndVelocity.newPosition;
          panServo.velocity = newPositionAndVelocity.newVelocity;
        }
        
        // Map the PAN servo value (-100 to 100) onto the appropriat PWM values from the environment
        const panPWM = map(panServo.actualPosition, -100, 100, env.SERVO_PAN_MIN_PWM, env.SERVO_PAN_MAX_PWM);
        // console.log(`PAN POS: ${panServo.actualPosition} (PWM: ${panPWM})`);

        // await asyncPca9685ChannelOn(this.pca9685, panServo.pwmChannel);
        await asyncPca9685PulseLength(this.pca9685, panServo.pwmChannel, panPWM);
      } else {
        // await asyncPca9685ChannelOff(this.pca9685, panServo.pwmChannel);
      }

      // Tilt servo
      const tiltServo = this.servos[SERVO.TILT];
      if (tiltServo.actualPosition !== tiltServo.targetPosition) {
        somethingChanged = true;
        await asyncPca9685ChannelOn(this.pca9685, tiltServo.pwmChannel);
        await this.disengageTiltLock();

        if (tiltServo.actualPosition === SERVO_POSITION_NOT_SET) {
          tiltServo.actualPosition = tiltServo.targetPosition;
        } else {

          // Ease the actual position to the Target position
          const newPositionAndVelocity = this.calculateNewServoPositionAndVelocity(
            tiltServo,
            TILT_TERMINAL_VELOCITY,
            TILT_ACCELLERATION,
          )

          tiltServo.actualPosition = newPositionAndVelocity.newPosition;
          tiltServo.velocity = newPositionAndVelocity.newVelocity;
        }

        // console.log('TILT:', tiltServo.actualPosition);

        const tiltPWM = map(tiltServo.actualPosition, -100, 100, env.SERVO_TILT_MIN_PWM, env.SERVO_TILT_MAX_PWM);
        await asyncPca9685PulseLength(this.pca9685, tiltServo.pwmChannel, tiltPWM);

        // This doesn't happen immediately... there's a slight delay just incase we need to do something else
        await this.engageTiltLock();
      }
    }

    // sleep if nothing changed
    if (this.isAwake && !somethingChanged && this.tiltLockEngaged) {
      this.sleep();
    } 
  }

  /**
   * Flag that we want to engage the tilt lock
   * The break is ACTUALLY engaged after the TILT_LOCK_WAIT
   */
  private async engageTiltLock() {
    if (this.pca9685 && !this.tiltLockEngaged) {
      // clear any existing break engage timeouts
      if (this.engageTiltLockTimeout) {
        clearTimeout(this.engageTiltLockTimeout);
      }
      this.engageTiltLockTimeout = setTimeout(async () => {
        if (this.engageTiltLockTimeout) {
          clearTimeout(this.engageTiltLockTimeout);
          this.engageTiltLockTimeout = null;
        }
        if (this.pca9685) {
          console.log('Engage break');
          this.tiltLockEngaged = true;
          const tiltServo = this.servos[SERVO.TILT];
          const breakServo = this.servos[SERVO.TILT_LOCK];
          const breakPWM = env.SERVO_TILT_LOCK_PWM;
          breakServo.targetPosition = breakPWM;
          breakServo.actualPosition = breakPWM;
          await asyncPca9685ChannelOn(this.pca9685, breakServo.pwmChannel);
          await asyncPca9685PulseLength(this.pca9685, breakServo.pwmChannel, breakPWM);
          await wait(TILT_LOCK_WAIT_DURATION);
          await asyncPca9685ChannelOff(this.pca9685, tiltServo.pwmChannel);
          await asyncPca9685ChannelOff(this.pca9685, breakServo.pwmChannel);
        }
      }, TILT_LOCK_WAIT);
    }
  }

  /**
   * Disable the tilt lock servo
   */
  private async disengageTiltLock(): Promise<void> {
    return new Promise<void>(async (resolve) => {
      if (this.engageTiltLockTimeout) {
        clearTimeout(this.engageTiltLockTimeout);
      }

      if (this.pca9685 && this.tiltLockEngaged) {
        console.log('Disengage break');
        this.tiltLockEngaged = false;
        const tiltServo = this.servos[SERVO.TILT];
        const breakServo = this.servos[SERVO.TILT_LOCK];
        const breakPWM = env.SERVO_TILT_UNLOCK_PWM;
        breakServo.targetPosition = breakPWM;
        breakServo.actualPosition = breakPWM;
        await asyncPca9685ChannelOn(this.pca9685, tiltServo.pwmChannel);
        await asyncPca9685ChannelOn(this.pca9685, breakServo.pwmChannel);
        await asyncPca9685PulseLength(this.pca9685, breakServo.pwmChannel, breakPWM);
        await wait(TILT_LOCK_WAIT_DURATION);
      }
      resolve();
    });
  }
}
