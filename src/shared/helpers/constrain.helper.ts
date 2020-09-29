/**
 * @description
 * Constrain a numeric value between a minimum and maximum value
 */
export const constrain = (value: number, minValue: number, maxValue: number): number => (value === null ? value : Math.min(Math.max(value, minValue), maxValue));
