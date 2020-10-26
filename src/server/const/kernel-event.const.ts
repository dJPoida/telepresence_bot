export const KERNEL_EVENT = {
  INITIALISED: 'initialised',
} as const;

export type KERNEL_EVENT = typeof KERNEL_EVENT;
export type A_KERNEL_EVENT = KERNEL_EVENT[keyof KERNEL_EVENT];

/**
 * Event Payloads
 */
export interface KernelEventMap {
  [KERNEL_EVENT.INITIALISED]: undefined;
}
