import { PortMapResult } from '../types/port-map-result.type';

export const NETWORK_MANAGER_EVENT = {
  INITIALISED: 'initialised',
  EXTERNAL_PORT_MAPPING: 'externalPortMapping',
} as const;

export type NETWORK_MANAGER_EVENT = typeof NETWORK_MANAGER_EVENT;
export type A_NETWORK_MANAGER_EVENT = NETWORK_MANAGER_EVENT[keyof NETWORK_MANAGER_EVENT];

/**
 * Event Payloads
 */
export interface NetworkManagerEventMap {
  [NETWORK_MANAGER_EVENT.INITIALISED]: undefined;
  [NETWORK_MANAGER_EVENT.EXTERNAL_PORT_MAPPING]: PortMapResult;
}
