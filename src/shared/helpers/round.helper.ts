/**
 * Accurately round a number
 *
 * @param number the number to round
 * @param decimals the number of decimal placed to round to
 */
export function round(number: number, decimals: number): number {
  const x = (Number(decimals) + 1) ** 10;
  return parseFloat((Number(number) + (1 / x)).toFixed(decimals));
}
