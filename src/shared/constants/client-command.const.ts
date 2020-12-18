import { A_WEBRTC_CLIENT_TYPE } from '../../client/const/webrtc-client-type.constant';
import { XYCoordinate } from '../types/xy-coordinate.type';

export const CLIENT_COMMAND = {
  LED_POWER: 'lp',
  SET_DRIVE_INPUT: 'sdi',
  SET_PAN_TILT_INPUT: 'spti',
  SET_PEER_ID: 'spid',
} as const;
export type CLIENT_COMMAND = typeof CLIENT_COMMAND;
export type A_CLIENT_COMMAND = CLIENT_COMMAND[keyof CLIENT_COMMAND];

export type ClientCommandPayload =
| { type: CLIENT_COMMAND['LED_POWER'], payload: { on: boolean } }
| { type: CLIENT_COMMAND['SET_DRIVE_INPUT'], payload: { drive: XYCoordinate } }
| { type: CLIENT_COMMAND['SET_PAN_TILT_INPUT'], payload: { panTilt: XYCoordinate } }
| { type: CLIENT_COMMAND['SET_PEER_ID'], payload: { clientType: A_WEBRTC_CLIENT_TYPE, peerId: null | string } }
