import natUpnp from 'nat-upnp';
import publicIp from 'public-ip';
import internalIp from 'internal-ip';
import { TypedEventEmitter } from '../../shared/helpers/typed-event-emitter.helper';
import { NetworkStatusDto } from '../../shared/types/network-status.dto.type';
import { NetworkManagerEventMap, NETWORK_MANAGER_EVENT } from '../const/network-manager-event.const';
import { env } from '../env';
import { classLoggerFactory } from '../helpers/class-logger-factory.helper';
import { PortMapResult } from '../types/port-map-result.type';

export class NetworkManager extends TypedEventEmitter<NetworkManagerEventMap> {
  protected readonly log = classLoggerFactory(this);

  private _initialised = false;

  private _internalIp: null | string = null;

  private _publicIp: null | string = null;

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

    // Determine the internal and public network addresses
    this.detectInternalIpAddress();
    this.detectPublicIpAddress();

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

    // Close the NAT UPNP Client
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
    /**
     * Unified method for all forms of success / error during the port map attempt
     */
    const doResolveReject = (result: PortMapResult, exception: null | Error = null) => {
      const oldPortMapping = this._portMapping;
      this._portMapping = result;

      // If initialised AND Something has changed, notify any listeners
      if (this.initialised && (
        (this._portMapping.enabled !== oldPortMapping.enabled)
        || (this._portMapping.internalHttpsPort !== oldPortMapping.internalHttpsPort)
        || (this._portMapping.internalWebrtcPort !== oldPortMapping.internalWebrtcPort)
        || (this._portMapping.message !== oldPortMapping.message)
        || (this._portMapping.publicHttpsPort !== oldPortMapping.publicHttpsPort)
        || (this._portMapping.publicWebrtcPort !== oldPortMapping.publicWebrtcPort)
      )) {
        this.emit(NETWORK_MANAGER_EVENT.EXTERNAL_PORT_MAPPING_CHANGED, this._portMapping);
      };

      if (exception) {
        reject(exception);
      } else {
        resolve(this._portMapping);
      }
    };

    try {
      if (!this._natUpnpClient) {
        doResolveReject({
          enabled: false,
          message: 'Port Mapping cannot occur as no nat-upnp client has been created',
          internalHttpsPort: env.HTTPS_PORT,
          internalWebrtcPort: env.WEB_RTC_PORT,
          publicHttpsPort: null,
          publicWebrtcPort: null,
        });
      } else {
        const client = this._natUpnpClient;
        // Map the HTTPS Port
        this.log.info(`Mapping the HTTPS TCP port ${env.HTTPS_PORT}->${env.HTTPS_PORT} via UPnP...`);
        client.portMapping({
          description: 'TPBOT',
          public: env.HTTPS_PORT,
          private: env.HTTPS_PORT,
          ttl: env.PORT_MAPPING_TTL,
        }, (httpsPortError) => {
          if (httpsPortError) {
            this.log.error('Failed to map the HTTPS TCP port', httpsPortError);
            doResolveReject({
              enabled: false,
              message: `Failed to map the HTTPS TCP port. ${httpsPortError.message}`,
              internalHttpsPort: env.HTTPS_PORT,
              internalWebrtcPort: env.WEB_RTC_PORT,
              publicHttpsPort: null,
              publicWebrtcPort: null,
            });
          } else {
            // Map the WEBRTC port for TCP
            this.log.info(`Mapping the WEBRTC TCP port ${env.WEB_RTC_PORT}->${env.WEB_RTC_PORT} via UPnP...`);
            client.portMapping({
              description: 'TPBOT',
              public: env.WEB_RTC_PORT,
              private: env.WEB_RTC_PORT,
              ttl: env.PORT_MAPPING_TTL,
            }, (webRtcTCPPortError) => {
              if (webRtcTCPPortError) {
                this.log.error('Failed to map the WEBRTC TCP port', webRtcTCPPortError);
                doResolveReject({
                  enabled: false,
                  message: `Failed to map the WEBRTC TCP port. ${webRtcTCPPortError.message}`,
                  internalHttpsPort: env.HTTPS_PORT,
                  internalWebrtcPort: env.WEB_RTC_PORT,
                  publicHttpsPort: null,
                  publicWebrtcPort: null,
                });
              } else {
                // Map the WEBRTC port for UDP
                this.log.info(`Mapping the WEBRTC UDP port ${env.WEB_RTC_PORT}->${env.WEB_RTC_PORT} via UPnP...`);
                client.portMapping({
                  description: 'TPBOT',
                  public: env.WEB_RTC_PORT,
                  private: env.WEB_RTC_PORT,
                  ttl: env.PORT_MAPPING_TTL,
                  protocol: 'udp',
                }, (webRtcUDPPortError) => {
                  if (webRtcUDPPortError) {
                    this.log.error('Failed to map the WEBRTC UDP port', webRtcUDPPortError);
                    doResolveReject({
                      enabled: false,
                      message: `Failed to map the WEBRTC UDP port. ${webRtcUDPPortError.message}`,
                      internalHttpsPort: env.HTTPS_PORT,
                      internalWebrtcPort: env.WEB_RTC_PORT,
                      publicHttpsPort: null,
                      publicWebrtcPort: null,
                    });
                  } else {
                    this.log.info('Ports mapped OK');
                    doResolveReject({
                      enabled: true,
                      message: null,
                      internalHttpsPort: env.HTTPS_PORT,
                      internalWebrtcPort: env.WEB_RTC_PORT,
                      publicHttpsPort: env.HTTPS_PORT,
                      publicWebrtcPort: env.WEB_RTC_PORT,
                    });
                  }
                });
              }
            });
          }
        });
      }
    } catch (err) {
      this.log.error('Port Mapping Failed', err);
      doResolveReject({
        enabled: false,
        message: `Port Mapping Failed ${err.message}`,
        internalHttpsPort: env.HTTPS_PORT,
        internalWebrtcPort: env.WEB_RTC_PORT,
        publicHttpsPort: null,
        publicWebrtcPort: null,
      }, err);
    }
  });

  /**
   * Detect the internal IP address of the internet facing adapter
   */
  public detectInternalIpAddress = async (): Promise<boolean> => {
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
  public detectPublicIpAddress = async (): Promise<boolean> => {
    try {
      this._publicIp = (await publicIp.v4()) ?? null;
      return this.publicIp !== null;
    } catch (err) {
      this.log.error('Failed to determine the public IP address', err);
      return false;
    }
  };

  /**
   * The DTO for the current network status
   */
  public get networkStatus(): NetworkStatusDto {
    return {
      internal: {
        address: this.internalIp,
        httpsPort: env.HTTPS_PORT,
        webrtcPort: env.WEB_RTC_PORT,
      },
      public: {
        address: this.publicIp,
        httpsPort: env.HTTPS_PORT,
        webrtcPort: env.WEB_RTC_PORT,
      },
      stunServer: {
        urls: env.STUN_SERVER ? `stun:${env.STUN_SERVER}` : null,
      },
      turnServer: {
        urls: env.TURN_SERVER ? `turn:${env.TURN_SERVER}` : null,
        username: env.TURN_SERVER_USERNAME ?? null,
        credential: env.TURN_SERVER_PASSWORD ?? null,
      }
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
