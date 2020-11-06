import {argb} from '../types/argb.type';

/**
 * @description
 * Converts a 32 bit integer into alpha, red, green and blue channels
 *
 * @param {number} pixelValue a 32bit integer containing alpha, red, green and blue data
 */
export const int2argb = (pixelValue: number): argb => ({
  a: (pixelValue >>> 24) & 0xFF,
  r: (pixelValue >> 16) & 0xFF,
  g: (pixelValue >> 8) & 0xFF,
  b: pixelValue & 0xFF,
});
