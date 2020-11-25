import { Pca9685Driver, Pca9685Options } from 'pca9685';

export { Pca9685Driver } from 'pca9685';

/**
 * @description asynchronously create a Pca9685Driver
 */
export const asyncPca9685 = (options: Pca9685Options): Promise<Error | Pca9685Driver> => new Promise((resolve, reject) => {
  const newPca9685 = new Pca9685Driver(options, (err) => {
    if (err) reject(err);
    resolve(newPca9685);
  });
});
