import { Pca9685Driver, Pca9685Options } from 'pca9685';

export { Pca9685Driver } from 'pca9685';

/**
 * @description asynchronously create a Pca9685Driver
 */
export const asyncPca9685 = (options: Pca9685Options): Promise<Pca9685Driver> => new Promise((resolve, reject) => {
  const newPca9685 = new Pca9685Driver(options, (err) => {
    if (err) reject(err);
    resolve(newPca9685);
  });
});

/**
 * @description asynchronously set a Pca9685 Channel On
 */
export const asyncPca9685ChannelOn = (pca9685: Pca9685Driver, channel: number): Promise<void> => new Promise((resolve, reject) => {
  pca9685.channelOn(channel, (err) => {
    if (err) reject(err);
    resolve();
  })
});

/**
 * @description asynchronously set a Pca9685 Channel Off
 */
export const asyncPca9685ChannelOff = (pca9685: Pca9685Driver, channel: number): Promise<void> => new Promise((resolve, reject) => {
  pca9685.channelOff(channel, (err) => {
    if (err) reject(err);
    resolve();
  })
});

/**
 * @description asynchronously set a Pca9685 Pulse Length
 */
export const asyncPca9685PulseLength = (pca9685: Pca9685Driver, channel: number, pulseLengthMicroSeconds: number, onStep?: number): Promise<void> => new Promise((resolve, reject) => {
  pca9685.setPulseLength(channel, pulseLengthMicroSeconds, onStep, (err) => {
    if (err) reject(err);
    resolve();
  })
});
