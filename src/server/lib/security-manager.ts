import path from 'path';
import fs from 'fs';
import publicIp from 'public-ip';
import internalIp from 'internal-ip';
import { ServerOptions } from 'https';

import { classLoggerFactory } from '../helpers/class-logger-factory.helper';
import { openssl } from '../helpers/openssl.helper';
import { deleteFileIfExists } from '../helpers/delete-file-if-exists.helper';

const securityFilesPath = path.resolve(__dirname, '../../../security');
const systemAttributesPath = path.resolve(securityFilesPath, 'security.json');
const caKeyPath = path.resolve(securityFilesPath, 'tpbot.ca.key');
const caCertificatePath = path.resolve(securityFilesPath, 'tpbot.ca.crt');
const privateKeyPath = path.resolve(securityFilesPath, 'tpbot.key');
const csrExtensionsPath = path.resolve(securityFilesPath, 'tpbot.ext');
const csrPath = path.resolve(securityFilesPath, 'tpbot.req');
const certificatePath = path.resolve(securityFilesPath, 'tpbot.crt');

/**
 * Responsible for creating the certificates required to deliver an SSL peer to peer connection
 *
 * @see https://blog.httpwatch.com/2013/12/12/five-tips-for-using-self-signed-ssl-certificates-with-ios/
 */
export class SecurityManager {
  protected readonly log = classLoggerFactory(this);

  private _internalIp: null | string = null;

  private _publicIp: null | string = null;

  private _caKey: null | string = null;

  private _caCertificate: null | string = null;

  private _privateKey: null | string = null;

  private _csrExtensions: null | string = null;

  private _csr: null | string = null;

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
   * Create and save a new CA key
   */
  private createAndSaveCAKey = async (): Promise<boolean> => {
    try {
      this.log.info(' - creating CA Key');
      // Delete the existing key
      await deleteFileIfExists(caKeyPath);

      // Fire off openssl
      await openssl(`genrsa -out "${path.relative(process.cwd(), caKeyPath)}" 2048`);

      // load in the new key
      this._caKey = fs.readFileSync(caKeyPath, 'ascii');
      return true;
    } catch (err) {
      this.log.error('Failed to create the CA Key', err);
      return false;
    }
  }

  /**
   * Create and save a new CA Certificate
   */
  private createAndSaveCACertificate = async (): Promise<boolean> => {
    try {
      this.log.info(' - creating CA Certificate');

      // Delete the existing certificate
      await deleteFileIfExists(caCertificatePath);

      // Fire off openssl
      await openssl(`req -x509 -sha256 -new -key "${
        path.relative(process.cwd(), caKeyPath)
      }" -out "${
        path.relative(process.cwd(), caCertificatePath)
      }" -days 730 -subj /CN="TPBot CA"`);

      // load in the new key
      this._caCertificate = fs.readFileSync(caCertificatePath, 'ascii');
      return true;
    } catch (err) {
      this.log.error('Failed to create the CA Certificate', err);
      return false;
    }
  }

  /**
   * Create and save a new Private key
   */
  private createAndSavePrivateKey = async (): Promise<boolean> => {
    try {
      this.log.info(' - creating Private Key');
      // Delete the existing key
      await deleteFileIfExists(privateKeyPath);

      // Fire off openssl
      await openssl(`genrsa -out "${path.relative(process.cwd(), privateKeyPath)}" 2048`);

      // load in the new key
      this._privateKey = fs.readFileSync(privateKeyPath, 'ascii');
      return true;
    } catch (err) {
      this.log.error('Failed to create the Private Key', err);
      return false;
    }
  }

  /**
   * Create and save the CSR Extensions file
   */
  private createAndSaveCSRExtensions = async (): Promise<boolean> => {
    try {
      this.log.info(' - creating CSR Extensions');
      // Delete the existing file
      await deleteFileIfExists(csrExtensionsPath);

      // create the string
      this._csrExtensions = [
        'subjectAltName = @alt_names',
        '',
        '[alt_names]',
        'DNS.1 = localhost',
        'IP.1 = 127.0.0.1',
        `IP.2 = ${this.internalIp}`,
        `IP.3 = ${this.publicIp}`,
      ].join('\n');

      // Write the extensions to disk
      fs.writeFileSync(csrExtensionsPath, this._csrExtensions, 'ascii');
      return true;
    } catch (err) {
      this.log.error('Failed to create the CSR Extensions', err);
      return false;
    }
  }

  /**
   * Create and save a new CSR
   */
  private createAndSaveCSR = async (): Promise<boolean> => {
    try {
      this.log.info(' - creating CSR');
      // Delete the existing key
      await deleteFileIfExists(csrPath);

      // country: 'AU',
      // state: 'VIC',
      // organization: 'dJPoida',
      // organizationUnit: 'Telepresence Bot',
      // emailAddress: 'djpoida+tpbot@gmail.com',
      // commonName: this.internalIp ?? undefined,
      // altNames: this.publicIp ? [this.publicIp, 'tpbot.local'] : ['tpbot.local'],
      // clientKey: this.privateKey ?? undefined,

      // Fire off openssl
      await openssl([
        'req',
        '-new',
        `-out "${path.relative(process.cwd(), csrPath)}"`,
        `-key "${path.relative(process.cwd(), privateKeyPath)}"`,
        `-subj /CN=${this.publicIp}`,
      ].join(' '));

      // load in the new key
      this._csr = fs.readFileSync(csrPath, 'ascii');
      return true;
    } catch (err) {
      this.log.error('Failed to create the CSR', err);
      return false;
    }
  }

  /**
   * Create and save a new Certificaet
   */
  private createAndSaveCertificate = async (): Promise<boolean> => {
    try {
      this.log.info(' - creating Certificate');
      // Delete the existing key
      await deleteFileIfExists(certificatePath);

      // Fire off openssl
      await openssl([
        'x509',
        '-req',
        '-sha256',
        `-in ${path.relative(process.cwd(), csrPath)}`,
        `-out ${path.relative(process.cwd(), certificatePath)}`,
        `-CAkey ${path.relative(process.cwd(), caKeyPath)}`,
        `-CA ${path.relative(process.cwd(), caCertificatePath)}`,
        '-days 365',
        '-CAcreateserial',
        '-CAserial serial',
        `-extfile "${path.relative(process.cwd(), csrExtensionsPath)}`,
      ].join(' '));

      // load in the new key
      this._certificate = fs.readFileSync(certificatePath, 'ascii');
      return true;
    } catch (err) {
      this.log.error('Failed to create the Certificate', err);
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

    // Only regenerate the certificate authority if any of the files are missing
    const regenerateCA = (
      !fs.existsSync(caKeyPath)
      || !fs.existsSync(caCertificatePath)
    );

    // Attempt to load the existing (stored) certificate
    if (regenerateCA) {
      // For whatever reason, there is now a need to regenrate the CA.
      this.log.info('Generating new CA assets...');

      // Create a new CA Key
      if (!(await this.createAndSaveCAKey())) return false;

      // Create a new CA Certificate
      if (!(await this.createAndSaveCACertificate())) return false;
    } else {
      this.log.info('CA Exists');
      try {
        // Load the existing CA Key
        this._caKey = fs.readFileSync(caKeyPath, 'ascii');

        // Load the existing CA Cert
        this._caCertificate = fs.readFileSync(caCertificatePath, 'ascii');
      } catch (err) {
        this.log.error('Looks like there was a problem loading one or more of the the CA assets', err);
        return false;
      }
    }

    // regenerate the certificate if any of the server details change (ip addresses etc...)
    const regenerateCertificate = (
      !(await this.checkPreviousSystemAttributes())
      || !fs.existsSync(privateKeyPath)
      || !fs.existsSync(csrExtensionsPath)
      || !fs.existsSync(csrPath)
      || !fs.existsSync(certificatePath)
    );

    // Attempt to load the existing (stored) certificate
    if (regenerateCertificate) {
      // For whatever reason, there is now a need to regenrate the credentials.
      this.log.info('Generating new certificate assets...');

      // Store the security attributes for future use
      if (!(await this.saveSystemAttributes())) return false;

      // Create a new private key
      if (!(await this.createAndSavePrivateKey())) return false;

      // Create new csr extensions
      if (!(await this.createAndSaveCSRExtensions())) return false;

      // Create a new csr
      if (!(await this.createAndSaveCSR())) return false;

      // Create a new certificate
      if (!(await this.createAndSaveCertificate())) return false;
    } else {
      this.log.info('Certificate exists and is current');
      try {
        // Load the existing private key
        this._privateKey = fs.readFileSync(privateKeyPath, 'ascii');

        // Load the existing csr extensions
        this._csrExtensions = fs.readFileSync(csrExtensionsPath, 'ascii');

        // Load the existing csr
        this._csr = fs.readFileSync(csrPath, 'ascii');

        // Load the existing certificate
        this._certificate = fs.readFileSync(certificatePath, 'ascii');
      } catch (err) {
        this.log.error('Looks like there was a problem loading one or more of the the certificate assets', err);
        return false;
      }
    }

    // use the newly created assets
    return true;
  };

  /**
   * The SSL credentials required by the express server to open up an HTTPS socket
   */
  get credentials(): ServerOptions {
    return {
      ca: this._caCertificate ?? '',
      cert: this._certificate ?? '',
      key: this._privateKey ?? '',
    };
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
