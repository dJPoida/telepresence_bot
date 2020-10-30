import { Power } from '../../shared/types/power.type';

export const POWER_MONITOR_EVENT = {
  INITIALISED: 'initialised',
  UPDATE: 'update',
} as const;

export type POWER_MONITOR_EVENT = typeof POWER_MONITOR_EVENT;
export type A_POWER_MONITOR_EVENT = POWER_MONITOR_EVENT[keyof POWER_MONITOR_EVENT];

/**
 * Event Payloads
 */
export interface PowerMonitorEventMap {
  [POWER_MONITOR_EVENT.INITIALISED]: undefined;
  [POWER_MONITOR_EVENT.UPDATE]: Power;
}
