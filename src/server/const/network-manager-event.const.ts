import { NetworkStatusDto } from '../../shared/types/network-status.dto.type';
import { PortMapResult } from '../types/port-map-result.type';

export const NETWORK_MANAGER_EVENT = {
  INITIALISED: 'initialised',
  UPDATED: 'updated',
  INTERNAL_IP_ADDRESS_CHANGED: 'internalIpAddressChanged',
  PUBLIC_IP_ADDRESS_CHANGED: 'publicIpAddressChanged',
  EXTERNAL_PORT_MAPPING_CHANGED: 'externalPortMappingChanged',
} as const;

export type NETWORK_MANAGER_EVENT = typeof NETWORK_MANAGER_EVENT;
export type A_NETWORK_MANAGER_EVENT = NETWORK_MANAGER_EVENT[keyof NETWORK_MANAGER_EVENT];

/**
 * Event Payloads
 */
export interface NetworkManagerEventMap {
  [NETWORK_MANAGER_EVENT.INITIALISED]: undefined;
  [NETWORK_MANAGER_EVENT.INTERNAL_IP_ADDRESS_CHANGED]: { internalIpAddress: null | string };
  [NETWORK_MANAGER_EVENT.PUBLIC_IP_ADDRESS_CHANGED]: { publicIpAddress: null | string };
  [NETWORK_MANAGER_EVENT.EXTERNAL_PORT_MAPPING_CHANGED]: PortMapResult;
  [NETWORK_MANAGER_EVENT.UPDATED]: NetworkStatusDto;
}
