/**
 * @description
 * resolve timeout after a duration
 *
 * @param dur
 */
export const wait = (dur: number): Promise<ReturnType<typeof setTimeout>> => new Promise((res) => setTimeout(res, dur));
