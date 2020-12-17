export type PortMapResult = {
  enabled: true,
  message: null,
  internalHttpsPort: number,
  internalWebrtcPort: number,
  publicHttpsPort: number,
  publicWebrtcPort: number,
} | {
  enabled: false,
  message: string,
  internalHttpsPort: number,
  internalWebrtcPort: number,
  publicHttpsPort: null,
  publicWebrtcPort: null,
}
