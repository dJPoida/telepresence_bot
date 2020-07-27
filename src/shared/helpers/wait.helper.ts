/**
 * @description
 * resolve timeout after a duration
 *
 * @param dur
 */
export const wait = (dur: number) => new Promise((res) => setTimeout(res, dur));
