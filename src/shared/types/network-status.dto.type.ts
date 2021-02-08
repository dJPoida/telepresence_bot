export interface NetworkStatusDto {
  readonly internal: {
    address: null | string,
    httpsPort: null | number,
    webrtcPort: null | number,
  },
  readonly public: {
    address: null | string,
    httpsPort: null | number,
    webrtcPort: null | number,
  },
  readonly stunServer: {
    urls: null | string,
  },
  readonly turnServer: {
    urls: null | string,
    username: null | string,
    credential: null | string,
  }
}
