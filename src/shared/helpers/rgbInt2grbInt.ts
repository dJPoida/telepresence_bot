/**
 * Converts a 24bit RGB integer into a 24bit GRB number
 *
 * @param {number} rgbPixelValue the 
 * 
 * @returns a 24bit integer containing green, red, and blue data (GRB)
 */
export const rgbInt2grbInt = (rgbPixelValue: number): number => (((rgbPixelValue >> 8 & 0xFF) & 0xff) << 16) + (((rgbPixelValue >> 16 & 0xFF) & 0xff) << 8) + ((rgbPixelValue  & 0xFF) & 0xff);
