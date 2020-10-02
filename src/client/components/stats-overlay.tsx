import React, { useContext } from 'react';
import { TelemetryContext } from '../providers/telemetry.provider';
import { SocketContext } from '../providers/socket.provider';

export type StatsOverlayProps = {
};

export const StatsOverlay: React.FC<StatsOverlayProps> = () => {
  const { connected, latency } = useContext(SocketContext);
  const telemetry = useContext(TelemetryContext);

  return (
    <div className="stats-overlay">
      <span className="section-header">Health:</span>

      {/* TODO: Battery Stat */}
      <span className="key">Latency:</span>
      <span className="value">{connected ? `${latency ?? '-'} ms` : 'Not Connected'}</span>

      {/* TODO: Battery Stat */}
      <span className="key">Battery:</span>
      <span className="value">-- V</span>

      {/* TODO: Current Stat */}
      <span className="key">Current:</span>
      <span className="value">-- mA</span>

      <span className="section-header">Inputs:</span>
      <span className="key">Speed:</span>
      <span className="value">{`${telemetry.speedInput}%`}</span>
      <span className="key">Drive:</span>
      <span className="value">{`${telemetry.driveInput.x}% / ${telemetry.driveInput.y}%`}</span>
      <span className="key">Pan:</span>
      <span className="value">{`${telemetry.panTiltInput.x}%`}</span>
      <span className="key">Tilt:</span>
      <span className="value">{`${telemetry.panTiltInput.y}%`}</span>
    </div>
  );
};
