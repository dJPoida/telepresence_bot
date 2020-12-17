import natUpnp from 'nat-upnp';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { NetworkManagerEventMap, NETWORK_MANAGER_EVENT } from '../const/network-manager-event.const';
import { env } from '../env';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';
import { PortMapResult } from '../types/port-map-result.type';

export class NetworkManager extends TypedEventEmitter<NetworkManagerEventMap> {
  protected readonly log = classLoggerFactory(this);
  private _initialised = false;

  private _portMapping: PortMapResult = {
    enabled: false,
    message: 'Not Initialised',
    internalHttpsPort: env.HTTPS_PORT,
    internalWebrtcPort: env.WEB_RTC_PORT,
    publicHttpsPort: null,
    publicWebrtcPort: null,
  }

  private _natUpnpClient: null | natUpnp.Client = null;

  /**
   * @constructor
   */
  constructor() {
    super();

    this.handleInitialised = this.handleInitialised.bind(this);
  }

  /**
   * Whether the Network Manager has been initialised
   */
  get initialised(): boolean { return this._initialised; }

  /**
   * Bind the event listeners this class cares about
   */
  private bindEvents(): void {
    this.once(NETWORK_MANAGER_EVENT.INITIALISED, this.handleInitialised);
  }

  /**
   * Unbind the event listeners this class cares about
   */
  private unbindEvents(): void {
    this.off(NETWORK_MANAGER_EVENT.INITIALISED, this.handleInitialised);
  }

  /**
   * Initialise the class
   */
  public async initialise(): Promise<void> {
    this.log.info('Network Manager initialising...');

    // Spin up a nat UPNP Client
    this._natUpnpClient = natUpnp.createClient();

    this.bindEvents();

    // Let everyone know that the Network Manager is initialised
    this._initialised = true;
    this.emit(NETWORK_MANAGER_EVENT.INITIALISED, undefined);
  }

  /**
   * Shut down this class
   */
  public async shutDown(): Promise<void> {
    this.unbindEvents();

    if (this._natUpnpClient) {
      try {
        this._natUpnpClient.close();
      } catch (err) {
        this.log.error('An error occurred while closing the nat UPNP client', err);
      }
    }

    if (this.initialised) {
      this.log.info('Network Manager shutting down...');
    }
  }

  /**
   * Fired when this class is initialised
   */
  private handleInitialised() {
    this.log.info('Network Manager Initialised.');

    // Perform an intial port map
    if (env.ENABLE_UPNP_PORT_MAPPING) {
      this.mapPorts();
    }
  }

  /**
   * Call this to have the upnp client attempt to map the external ports on the gateway via upnp
   *
   * TODO: at some point allow users to specify different internal and public ports
   */
  public mapPorts = (): Promise<PortMapResult> => new Promise<PortMapResult>((resolve, reject) => {
    try {
      if (!this._natUpnpClient) {
        this._portMapping = {
          enabled: false,
          message: 'Port Mapping cannot occur as no nat-upnp client has been created',
          internalHttpsPort: env.HTTPS_PORT,
          internalWebrtcPort: env.WEB_RTC_PORT,
          publicHttpsPort: null,
          publicWebrtcPort: null,
        };
        this.emit(NETWORK_MANAGER_EVENT.EXTERNAL_PORT_MAPPING, this._portMapping);
        resolve(this._portMapping);
      } else {
        const client = this._natUpnpClient;
        // Map the HTTPS Port
        this.log.info(`Mapping the HTTPS port ${env.HTTPS_PORT}->${env.HTTPS_PORT} via UPnP...`);
        client.portMapping({
          description: 'TPBOT',
          public: env.HTTPS_PORT,
          private: env.HTTPS_PORT,
          ttl: env.PORT_MAPPING_TTL,
        }, (httpsPortError) => {
          if (httpsPortError) {
            this.log.error('Failed to map the HTTPS port', httpsPortError);
            this._portMapping = {
              enabled: false,
              message: `Failed to map the HTTPS port. ${httpsPortError.message}`,
              internalHttpsPort: env.HTTPS_PORT,
              internalWebrtcPort: env.WEB_RTC_PORT,
              publicHttpsPort: null,
              publicWebrtcPort: null,
            };
            this.emit(NETWORK_MANAGER_EVENT.EXTERNAL_PORT_MAPPING, this._portMapping);
            resolve(this._portMapping);
          } else {
            // Map the WEBRTC port
            this.log.info(`Mapping the WEBRTC port ${env.WEB_RTC_PORT}->${env.WEB_RTC_PORT} via UPnP...`);
            client.portMapping({
              description: 'TPBOT',
              public: env.WEB_RTC_PORT,
              private: env.WEB_RTC_PORT,
              ttl: env.PORT_MAPPING_TTL,
            }, (webRtcPortError) => {
              if (webRtcPortError) {
                this.log.error('Failed to map the HTTPS port', webRtcPortError);
                this._portMapping = {
                  enabled: false,
                  message: `Failed to map the HTTPS port. ${webRtcPortError.message}`,
                  internalHttpsPort: env.HTTPS_PORT,
                  internalWebrtcPort: env.WEB_RTC_PORT,
                  publicHttpsPort: null,
                  publicWebrtcPort: null,
                };
              } else {
                this.log.info('Ports mapped OK');
                this._portMapping = {
                  enabled: true,
                  message: null,
                  internalHttpsPort: env.HTTPS_PORT,
                  internalWebrtcPort: env.WEB_RTC_PORT,
                  publicHttpsPort: env.HTTPS_PORT,
                  publicWebrtcPort: env.WEB_RTC_PORT,
                };
              }
              this.emit(NETWORK_MANAGER_EVENT.EXTERNAL_PORT_MAPPING, this._portMapping);
              resolve(this._portMapping);
            });
          }
        });
      }
    } catch (err) {
      this.log.error('Port Mapping Failed', err);
      this._portMapping = {
        enabled: false,
        message: `Port Mapping Failed ${err.message}`,
        internalHttpsPort: env.HTTPS_PORT,
        internalWebrtcPort: env.WEB_RTC_PORT,
        publicHttpsPort: null,
        publicWebrtcPort: null,
      };
      this.emit(NETWORK_MANAGER_EVENT.EXTERNAL_PORT_MAPPING, this._portMapping);
      reject(err);
    }
  });
}
