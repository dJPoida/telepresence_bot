import React, { useContext } from 'react';
import { TelemetryContext } from '../providers/telemetry.provider';
import { SocketContext } from '../providers/socket.provider';
import { WebRTCContext } from '../providers/webrtc.provider';

export type StatsOverlayProps = {
};

export const StatsOverlay: React.FC<StatsOverlayProps> = () => {
  const { socketConnected: connected, latency } = useContext(SocketContext);
  const telemetry = useContext(TelemetryContext);
  const { webRTCState, peerId, remotePeerId } = useContext(WebRTCContext);

  return (
    <div className="stats-overlay">
      <span className="section-header">Health:</span>

      {/* TODO: Battery Stat */}
      <span className="key">Latency:</span>
      <span className="value">{connected ? `${latency ?? '-'} ms` : 'Not Connected'}</span>

      <span className="key">Battery:</span>
      <span className="value">{`${telemetry.power.voltage ?? '--'} V`}</span>

      <span className="key">Current:</span>
      <span className="value">{`${telemetry.power.current ?? '--'} mA`}</span>

      <span className="section-header">Inputs:</span>
      <span className="key">Drive:</span>
      <span className="value">{`${telemetry.driveInput.x}% / ${telemetry.driveInput.y}%`}</span>
      <span className="key">Pan:</span>
      <span className="value">{`${telemetry.panTiltInput.x}%`}</span>
      <span className="key">Tilt:</span>
      <span className="value">{`${telemetry.panTiltInput.y}%`}</span>

      <span className="section-header">WebRTC:</span>
      <span className="key">State:</span>
      <span className="value">{webRTCState}</span>
      <span className="key">Peer ID:</span>
      <span className="value">{peerId}</span>
      <span className="key">R.Peer ID:</span>
      <span className="value">{remotePeerId}</span>
    </div>
  );
};
