import { rgb } from "../types/rgb.type";

/**
 * Converts a 24bit integer into red, green and blue channel values (0-255)
 *
 * @param {number} pixelValue a 24bit integer containing red, green, and blue data
 */
export const int2rgb = (pixelValue: number): rgb => ({
  r: (pixelValue >> 16 & 0xFF),
  g: (pixelValue >> 8 & 0xFF),
  b: (pixelValue & 0xFF),
});
