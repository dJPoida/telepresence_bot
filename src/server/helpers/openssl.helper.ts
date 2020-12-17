import { exec } from 'child_process';

export const openssl = (params?: string): Promise<string> => new Promise((resolve, reject) => {
  exec(`openssl ${params}`, (error, stdout, stderr) => {
    if (!error) {
      resolve(stdout);
    } else {
      reject(new Error(`${error ? `${error.message}\n` : ''}${stderr}`));
    }
  });
});
