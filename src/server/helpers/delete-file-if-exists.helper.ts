import { promises as fs, PathLike, constants } from 'fs';

/**
 * Delete a file if it exists
 */
export const deleteFileIfExists = (filePath: PathLike): Promise<void> => new Promise<void>((resolve, reject) => {
  fs.access(filePath, constants.F_OK)
    .then(
      // File exists
      () => {
        // Delete the file
        fs.unlink(filePath)
          .then(
            resolve,
            reject,
          )
          .catch(reject);
      },
      // File does not exist. Just resolve.
      () => resolve(),
    )
    .catch(reject);
});
