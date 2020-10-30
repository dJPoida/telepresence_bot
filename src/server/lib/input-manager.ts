import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';
import { InputManagerEventMap, INPUT_MANAGER_EVENT } from '../const/input-manager-event.const';
import { socketServer } from './socket-server';
import { SocketServerEventMap, SOCKET_SERVER_EVENT } from '../const/socket-server-event.const';
import { CLIENT_COMMAND } from '../../shared/constants/client-command.const';
import { constrain } from '../../shared/helpers/constrain.helper';
import { round } from '../../shared/helpers/round.helper';
import { XYCoordinate } from '../../shared/types/xy-coordinate.type';
import { env } from '../env';

/**
 * @class InputManager
 *
 * @description
 * Manages the state of the control inputs and broadcasts value changes to any
 * drivers
 */
export class InputManager extends TypedEventEmitter<InputManagerEventMap> {
  protected readonly log = classLoggerFactory(this);

  private _initialised = false;

  private _speed = env.DEFAULT_SPEED;
  private _drive: XYCoordinate = { x: 0, y: 0 };
  private _panTilt: XYCoordinate = { x: 0, y: 0 };

  get initialised(): boolean { return this._initialised; }
  get speed(): number { return this._speed; }
  get drive(): XYCoordinate { return this._drive; }
  get panTilt(): XYCoordinate { return this._panTilt; }

  /**
   * @constructor
   */
  constructor() {
    super();

    this.handleInitialised = this.handleInitialised.bind(this);
    this.handleClientCommand = this.handleClientCommand.bind(this);
    this.bindEvents();
  }

  /**
   * Bind the event listeners this class cares about
   */
  private bindEvents() {
    this.once(INPUT_MANAGER_EVENT.INITIALISED, this.handleInitialised);

    // Listen for incoming client commands
    socketServer.on(SOCKET_SERVER_EVENT.CLIENT_COMMAND, this.handleClientCommand);
  }

  /**
   * Unbind any event listeners this class cares about
   */
  private unbindEvents() {
    this.off(INPUT_MANAGER_EVENT.INITIALISED, this.handleInitialised);

    socketServer.off(SOCKET_SERVER_EVENT.CLIENT_COMMAND, this.handleClientCommand);
  }

  /**
   * Initialise the Input Manager
   */
  public async initialise(): Promise<void> {
    this.log.info('Input Manager initialising...');

    // Let everyone know that the Input Manager is initialised
    this._initialised = true;
    this.emit(INPUT_MANAGER_EVENT.INITIALISED, undefined);
  }

  /**
   * Shut down the Input Manager
   */
  public async shutDown(): Promise<void> {
    this.unbindEvents();

    if (this.initialised) {
      this.log.info('Input Manager shutting down...');
    }
  }

  /**
   * Fired when the Input Manager Handler is initialised
   */
  private handleInitialised() {
    this.log.info('Input Manager Initialised.');
  }

  /**
   * Fired when a client command is received on the socket
   */
  private handleClientCommand({ command }: SocketServerEventMap[SOCKET_SERVER_EVENT['CLIENT_COMMAND']]) {
    switch (command.type) {
      case CLIENT_COMMAND.SET_SPEED:
        this.handleSetSpeed(command.payload.speed);
        break;
      case CLIENT_COMMAND.SET_DRIVE_INPUT:
        this.handleSetDrive(command.payload.drive);
        break;
      case CLIENT_COMMAND.SET_PAN_TILT_INPUT:
        this.handleSetPanTilt(command.payload.panTilt);
        break;
      default:
        // NOOP - likely an incoming command the input manager isn't supposed to respond to
        break;
    }
  }

  /**
   * Fired when a request to set the speed input is received
   */
  private handleSetSpeed(value: number): void {
    // Clean up the input value
    const cleanedValue = round(constrain(value, 0, 100), 2);

    // Implement the change if there is need to do it
    if (this.speed !== cleanedValue) {
      this._speed = cleanedValue;
      this.emit(INPUT_MANAGER_EVENT.SPEED_INPUT_CHANGE, { speed: this.speed });
    }
  }

  /**
   * Fired when a request to set the drive input is received
   */
  private handleSetDrive(value: XYCoordinate): void {
    // Clean up the input value
    const cleanedValue = {
      x: round(constrain(value.x, -100, 100), 2),
      y: round(constrain(value.y, -100, 100), 2),
    };

    // Implement the change if there is need to do it
    if (this.drive.x !== cleanedValue.x || this.drive.y !== cleanedValue.y) {
      this._drive = cleanedValue;
      this.emit(INPUT_MANAGER_EVENT.DRIVE_INPUT_CHANGE, { drive: this.drive });
    }
  }

  /**
   * Fired when a request to set the pan / tilt input is received
   */
  private handleSetPanTilt(value: XYCoordinate): void {
    // Clean up the input value
    const cleanedValue = {
      x: round(constrain(value.x, -100, 100), 2),
      y: round(constrain(value.y, -100, 100), 2),
    };

    // Implement the change if there is need to do it
    if (this.panTilt.x !== cleanedValue.x || this.panTilt.y !== cleanedValue.y) {
      this._panTilt = cleanedValue;
      this.emit(INPUT_MANAGER_EVENT.PAN_TILT_INPUT_CHANGE, { panTilt: this.panTilt });
    }
  }
}
