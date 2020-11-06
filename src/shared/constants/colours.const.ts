// These colours are designed to match those in the style ... but some tweaking is required to get the same hue
export const COLOUR = {
  ORANGE: 0xFF6D00,
  WHITE: 0xF0F0F0,
  BLACK: 0x00000,
  YELLOW: 0xFFEA00,
  RED: 0xFF0015,
  BLUE: 0x0095FF,
  GREEN: 0x15FF00,
} as const;
export type COLOUR = typeof COLOUR;
export type A_COLOUR = COLOUR[keyof COLOUR];
