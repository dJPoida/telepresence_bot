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
  }
}
