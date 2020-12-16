import path from 'path';
import fs from 'fs';
import { ServerOptions } from 'https';
import pem, { CSRCreationOptions, CertificateCreationOptions } from 'pem';
import publicIp from 'public-ip';
import internalIp from 'internal-ip';

import { classLoggerFactory } from '../helpers/class-logger-factory.helper';

const securityFilesPath = path.resolve(__dirname, '../../../security');
const systemAttributesPath = path.resolve(securityFilesPath, 'security.json');
const privateKeyPath = path.resolve(securityFilesPath, 'tpbot.pem');
const csrPath = path.resolve(securityFilesPath, 'tpbot.csr');
const serviceKeyPath = path.resolve(securityFilesPath, 'tpbot.client.pem');
const certificatePath = path.resolve(securityFilesPath, 'tpbot.cert');

/**
 * Promisified version of pem.createPrivateKey
 */
const createPrivateKey = (): Promise<string> => new Promise((resolve, reject) => {
  pem.createPrivateKey((error, result) => {
    if (error) {
      reject(error);
    } else {
      resolve(result.key);
    }
  });
});

/**
 * Promisified version of pem.createCSR
 */
const createCSR = (options: CSRCreationOptions): Promise<string> => new Promise((resolve, reject) => {
  pem.createCSR(options, (error, result) => {
    if (error) {
      reject(error);
    } else {
      resolve(result.csr);
    }
  });
});

/**
 * Promisified version of pem.createCertificate
 */
const createCertificate = (options: CertificateCreationOptions): Promise<{
  serviceKey: string,
  certificate: string,
}> => new Promise((resolve, reject) => {
  pem.createCertificate(options, (error, result) => {
    if (error) {
      reject(error);
    } else {
      resolve({ serviceKey: result.serviceKey, certificate: result.certificate });
    }
  });
});

/**
 * Responsible for creating the certificates required to deliver an SSL peer to peer connection
 *
 * @see https://blog.httpwatch.com/2013/12/12/five-tips-for-using-self-signed-ssl-certificates-with-ios/
 */
export class SecurityManager {
  protected readonly log = classLoggerFactory(this);

  private _internalIp: null | string = null;

  private _publicIp: null | string = null;

  private _privateKey: null | string = null;

  private _csr: null | string = null;

  private _serviceKey: null | string = null;

  private _certificate: null | string = null;

  /**
   * Create the directory where the security files will be stored
   */
  private createSecurityFilesPath = () => {
    try {
      if (!fs.existsSync(securityFilesPath)) {
        fs.mkdirSync(securityFilesPath);
      }
      return true;
    } catch (err) {
      this.log.error(`Failed to create the security files path "${securityFilesPath}"`, err);
      return false;
    }
  }

  /**
   * Detect the local IP address of the internet facing adapter
   */
  private detectInternalIpAddress = async (): Promise<boolean> => {
    try {
      this._internalIp = (await internalIp.v4()) ?? null;
      return this.internalIp !== null;
    } catch (err) {
      this.log.error('Failed to determine the internal IP address', err);
      return false;
    }
  };

  /**
   * Detect the public IP address of the internet facing adapter
   */
  private detectPublicIpAddress = async (): Promise<boolean> => {
    try {
      this._publicIp = (await publicIp.v4()) ?? null;
      return this.publicIp !== null;
    } catch (err) {
      this.log.error('Failed to determine the public IP address', err);
      return false;
    }
  };

  /**
   * Check previously stored system attributes against the current environment
   * to determine if new security keys need to be created
   */
  private checkPreviousSystemAttributes = async (): Promise<boolean> => {
    // Attempt to load the existing JSON
    let existingJSON: null | {
      internalIp: null | string,
      publicIp: null | string,
    } = null;
    try {
      existingJSON = JSON.parse(fs.readFileSync(systemAttributesPath, 'utf-8'));

      // Return true if the contents of the JSON are the same as our current detected config
      return (
        !!this.publicIp
        && (existingJSON?.publicIp === this.publicIp)
        && !!this.internalIp
        && (existingJSON?.internalIp === this.internalIp)
      );
    } catch (err) {
      // No biggie - just return FALSE - the configs are different.
      return false;
    }
  }

  /**
   * Store the system attributes to a json file for future reference
   * to determine if we have to re-create the certificate again
   */
  private saveSystemAttributes = async (): Promise<boolean> => {
    const attributes = {
      internalIp: this.internalIp,
      publicIp: this.publicIp,
    };

    try {
      fs.writeFileSync(systemAttributesPath, JSON.stringify(attributes, undefined, 2));
      return true;
    } catch (err) {
      this.log.error('Failed to store the system attributes to disk', err);
      return false;
    }
  }

  /**
   * Create and save a new private key
   */
  private createAndSavePrivateKey = async (): Promise<boolean> => {
    try {
      this._privateKey = (await createPrivateKey()) ?? null;
      if (this.privateKey) {
        fs.writeFileSync(privateKeyPath, this.privateKey);
        return true;
      }
      throw new Error('Private Key Empty!');
    } catch (err) {
      this.log.error('Failed to create the private key.', err);
      return false;
    }
  }

  /**
   * Create and save a new csr
   */
  private createAndSaveCSR = async (): Promise<boolean> => {
    try {
      this._csr = await createCSR({
        country: 'AU',
        state: 'VIC',
        organization: 'dJPoida',
        organizationUnit: 'Telepresence Bot',
        emailAddress: 'djpoida+tpbot@gmail.com',
        commonName: this.internalIp ?? undefined,
        altNames: this.publicIp ? [this.publicIp, 'tpbot.local'] : ['tpbot.local'],
        clientKey: this.privateKey ?? undefined,
      });
      if (this.csr) {
        fs.writeFileSync(csrPath, this.csr);
        return true;
      }
      throw new Error('CSR Empty!');
    } catch (err) {
      this.log.error('Failed to create the csr.', err);
      return false;
    }
  }

  /**
   * Create and save a new certificate
   */
  private createAndSaveCertificate = async (): Promise<boolean> => {
    try {
      const result = await createCertificate({
        csr: this.csr ?? undefined,
        days: 500,
        serviceKey: this.privateKey || undefined,
        selfSigned: true,
      });

      this._certificate = result.certificate;
      this._serviceKey = result.serviceKey;
      if (this.certificate && this.serviceKey) {
        fs.writeFileSync(certificatePath, this.certificate);
        fs.writeFileSync(serviceKeyPath, this.serviceKey);
        return true;
      }
      throw new Error('Certificate Empty!');
    } catch (err) {
      this.log.error('Failed to create the certificate.', err);
      return false;
    }
  }

  /**
   * Create all new keys for this machine
   */
  public generateKeys = async (): Promise<boolean> => {
    // Detect the local IP address
    if (!(await this.detectInternalIpAddress())) return false;
    this.log.info(`Internal IP address: ${this.internalIp}`);

    // Detect the Public IP address
    if (!(await this.detectPublicIpAddress())) return false;
    this.log.info(`Public IP address: ${this.publicIp}`);

    // Ensure the target path where we are going to write the keys exists
    if (!this.createSecurityFilesPath()) return false;

    // Compare the details required with any previously stored details to determine if we need to generate new documents
    const regenerateCertificate = (
      !(await this.checkPreviousSystemAttributes())
      || !fs.existsSync(privateKeyPath)
      || !fs.existsSync(csrPath)
      || !fs.existsSync(serviceKeyPath)
      || !fs.existsSync(certificatePath)
    );

    // Attempt to load the existing (stored) credentials
    if (!regenerateCertificate) {
      this.log.info('Skipping the creation of new certificate assets - nothing has changed.');
      try {
        // Load the existing private key
        this._privateKey = fs.readFileSync(privateKeyPath, 'utf-8');

        // Load the existing csr
        this._csr = fs.readFileSync(privateKeyPath, 'utf-8');

        // Load the existing client keyt
        this._serviceKey = fs.readFileSync(serviceKeyPath, 'utf-8');

        // Load the existing certificate
        this._certificate = fs.readFileSync(certificatePath, 'utf-8');

        // At this point - return true, we're happy.
        return true;
      } catch (err) {
        this.log.error('Looks like there was a problem loading the certificates');
      }
    }

    // For whatever reason, there is now a need to regenrate the credentials.
    this.log.info('Generating new certificate assets...');

    // Store the security attributes for future use
    if (!(await this.saveSystemAttributes())) return false;

    // Create a new private key
    if (!(await this.createAndSavePrivateKey())) return false;

    // Create a new csr
    if (!(await this.createAndSaveCSR())) return false;

    // Create a new certificate
    if (!(await this.createAndSaveCertificate())) return false;

    // use the newly created assets
    return true;
  };

  /**
   * The private .pem file created when spinning up the server for the first time
   */
  get privateKey(): null | string {
    return this._privateKey;
  }

  /**
   * The .csr file created when spinning up the server for the first time
   */
  get csr(): null | string {
    return this._csr;
  }

  /**
   * The .client.key file created when spinning up the server for the first time
   */
  get serviceKey(): null | string {
    return this._serviceKey;
  }

  /**
   * The public .cert file created when spinning up the server for the first time
   */
  get certificate(): null | string {
    return this._certificate;
  }

  /**
   * The SSL credentials required by the express server to open up an HTTPS socket
   */
  get credentials(): null | ServerOptions {
    if (this.serviceKey && this.certificate) {
      return {
        key: [{ pem: this.privateKey }, { pem: this.serviceKey }],
        cert: this.certificate,
      } as ServerOptions;
    }
    return null;
  }

  /**
   * The detected private IP address of the first available adapter
   */
  get internalIp(): null | string {
    return this._internalIp;
  }

  /**
   * The detected public IP address of the internet facing network adapter
   */
  get publicIp(): null | string {
    return this._publicIp;
  }
}
