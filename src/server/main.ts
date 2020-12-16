/* eslint-disable @typescript-eslint/no-unused-vars */
import { Kernel } from './lib/kernel';
import * as REMEMBER_OVERRIDES from '../shared/types/overrides.type';
import { initLogger } from './helpers/logger.helper';
import { ContextLogger } from './helpers/context-logger.helper';
import { SecurityManager } from './lib/security-manager';

// Logger
initLogger();
const log = new ContextLogger('main.ts');
log.info('Booting...');

// The security manager will ensure that everything the kernel needs to setup the server exists prior to creation
const securityManager = new SecurityManager();
securityManager.generateKeys()
  .then(
    (result) => {
      if (result) {
        const kernel = new Kernel(securityManager);
      } else {
        throw new Error('Failed to prepare the SSL security for an unknown reason.');
      }
    },
    (error) => log.error('Critical Error: ', error),
  )
  .catch((error) => log.error('Critical Error: ', error));

// SSL Certificate properties
// const certProps: pem.CertificateCreationOptions = {
//   days: 365,
//   selfSigned: true,
//   commonName: env.HOSTNAME,
// };

// TODO: actually generate a physical certificate based on the configuration in the env file
// TODO: pass the previously generated config into the pem.createCertificate function
// TODO: allow the certificate to be generated from the config app via a button
// TODO: add a download certificate button in the config app
// TODO: add a download certificate button in the control app
// TODO: install https://www.npmjs.com/package/nat-api and allow the configuration of the appropriate parameters in the config app

// pem.createCertificate(certProps, (error, keys) => {
//   if (error) {
//     throw error;
//   }

//   const credentials = { key: keys.serviceKey, cert: keys.certificate } as ServerOptions;

//   // eslint-disable-next-line no-unused-vars
//   const kernel = new Kernel(credentials);
// });
