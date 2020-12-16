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
