import React, { useContext } from 'react';
import classNames from 'classnames';
import Peer from 'peerjs';
import { LocalSettingsContext } from '../providers/local-settings.provider';
import { SocketContext } from '../providers/socket.provider';
import { TelemetryContext } from '../providers/telemetry.provider';
import { Joystick } from './joystick';
import { MenuBar } from './menu-bar';
import { StatsOverlay } from './stats-overlay';
import { VideoContainer } from './video-container';

export const ControllerInterface: React.FC = () => {
  const { connected } = useContext(SocketContext);
  const telemetry = useContext(TelemetryContext);
  const localSettings = useContext(LocalSettingsContext);

  return (
    <div className={classNames('controller-interface', { connected })}>

      <VideoContainer />

      <MenuBar />

      {localSettings.showStatsOverlay && (
        <StatsOverlay />
      )}

      <div className="controls-wrapper">
        <div className="controls left">

          {/* Pan / Tilt Joystick */}
          <div className="joystick-wrapper">
            <Joystick
              disabled={!connected}
              springBack={false}
              value={telemetry.panTiltInput}
              onUpdate={telemetry.setPanTiltInput}
              invertY
              keyBindings={{
                up: 'w',
                right: 'd',
                down: 's',
                left: 'a',
              }}
            />
          </div>
        </div>
        <div className="controls right">

          {/* Direction Joystick */}
          <div className="joystick-wrapper">
            <Joystick
              disabled={!connected}
              verboseUpdate
              value={telemetry.driveInput}
              onUpdate={telemetry.setDriveInput}
              invertY
              keyBindings={{
                up: 'ArrowUp',
                right: 'ArrowRight',
                down: 'ArrowDown',
                left: 'ArrowLeft',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
