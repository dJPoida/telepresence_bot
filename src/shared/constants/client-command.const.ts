import { XYCoordinate } from '../types/xy-coordinate.type';

export const CLIENT_COMMAND = {
  LED_POWER: 'lp',
  SET_DRIVE_INPUT: 'sdi',
  SET_PAN_TILT_INPUT: 'spti',
} as const;
export type CLIENT_COMMAND = typeof CLIENT_COMMAND;
export type A_CLIENT_COMMAND = CLIENT_COMMAND[keyof CLIENT_COMMAND];

export type ClientCommandPayload =
| { type: CLIENT_COMMAND['LED_POWER'], payload: { on: boolean } }
| { type: CLIENT_COMMAND['SET_DRIVE_INPUT'], payload: { drive: XYCoordinate } }
| { type: CLIENT_COMMAND['SET_PAN_TILT_INPUT'], payload: { panTilt: XYCoordinate } }
