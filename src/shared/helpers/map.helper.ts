/**
 * Scale a value from a source range to a target range
 */
export const map = (x: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
  return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}