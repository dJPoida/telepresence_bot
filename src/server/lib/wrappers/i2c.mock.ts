/**
 * The i2c-bus library has an auto initialisation that immediately throws on import if not
 * run on the appropriate hardware. This makes it very difficult to develop complex applications
 * in on PC or MAC where the Raspberry Pi or other ARM processor I2C hardware is not available.
 *
 * This proxy class for i2c-bus exports ensures we can still develop on other machines but know
 * when the hardware is not available.
 */

import { PromisifiedBus, OpenOptions } from 'i2c-bus';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let findOrFailOpenPromisified = (busNumber: number, options?: OpenOptions): Promise<PromisifiedBus | false> => new Promise<PromisifiedBus | false>((resolve) => {
  resolve(false);
});

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const realOpenPromisified = require('i2c-bus').openPromisified;
  findOrFailOpenPromisified = realOpenPromisified;
} catch {
  // This ultimately results in the result returning false.
}

export const openPromisified = findOrFailOpenPromisified;
