export const ORIENTATION = {
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape',
} as const;
export type ORIENTATION = typeof ORIENTATION;
export type AN_ORIENTATION = ORIENTATION[keyof ORIENTATION];
