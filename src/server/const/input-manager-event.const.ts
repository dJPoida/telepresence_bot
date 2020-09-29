import { XYCoordinate } from '../../shared/types/xy-coordinate.type';

/**
 * Event Names
 */
export const INPUT_MANAGER_EVENT = {
  // Fired when the Input Manager is initialised
  INITIALISED: 'initialised',

  // Fired when ANY input is changed and provides all of the input values
  CHANGE: 'change',

  // Fired when the Drive Input is changed
  DRIVE_INPUT_CHANGE: 'drive_input_change',

  // Fires when the Pan / Tilt input is changed
  PAN_TILT_INPUT_CHANGE: 'pan_tilt_input_change',

  // Fires when the Speed input is changed
  SPEED_INPUT_CHANGE: 'speed_input_change',
} as const;
export type INPUT_MANAGER_EVENT = typeof INPUT_MANAGER_EVENT;
export type A_INPUT_MANAGER_EVENT = INPUT_MANAGER_EVENT[keyof INPUT_MANAGER_EVENT];

/**
 * Event Payloads
 */
export interface InputManagerEventMap {
  [INPUT_MANAGER_EVENT.INITIALISED]: undefined;
  [INPUT_MANAGER_EVENT.CHANGE]: {
    drive: XYCoordinate,
    panTilt: XYCoordinate,
    speed: number,
  };
  [INPUT_MANAGER_EVENT.DRIVE_INPUT_CHANGE]: { drive: XYCoordinate };
  [INPUT_MANAGER_EVENT.PAN_TILT_INPUT_CHANGE]: { panTilt: XYCoordinate };
  [INPUT_MANAGER_EVENT.SPEED_INPUT_CHANGE]: { speed: number };
}
