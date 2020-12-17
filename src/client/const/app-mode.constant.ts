export const APP_MODE = {
  CONTROLLER: 'controller',
  DISPLAY: 'display',
  CONFIG: 'config',
} as const;
export type APP_MODE = typeof APP_MODE;
export type AN_APP_MODE = APP_MODE[keyof APP_MODE];
