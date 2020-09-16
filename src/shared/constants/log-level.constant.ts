export const LOG_LEVEL = {
  INFO: 'info',
  ERROR: 'error',
  WARN: 'warn',
  DEBUG: 'debug',
  SILLY: 'silly',
} as const;
export type LOG_LEVEL = typeof LOG_LEVEL;
export type A_LOG_LEVEL = LOG_LEVEL[keyof LOG_LEVEL];
