import React, { useContext } from 'react';
import classNames from 'classnames';
import { ORIENTATION } from '../const/orientation.constant';
import { LocalSettingsContext } from '../providers/local-settings.provider';
import { SocketContext } from '../providers/socket.provider';
import { TelemetryContext } from '../providers/telemetry.provider';
import { Joystick } from './joystick';
import { MenuBar } from './menu-bar';
import { Slider } from './slider';
import { StatsOverlay } from './stats-overlay';

export const ControllerInterface: React.FC = () => {
  const { connected } = useContext(SocketContext);
  const telemetry = useContext(TelemetryContext);
  const localSettings = useContext(LocalSettingsContext);

  return (
    <div className={classNames('control-panel', { connected })}>

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

          {/* Speed Slider */}
          <div className="slider-wrapper">
            <Slider
              disabled={!connected}
              orientation={ORIENTATION.PORTRAIT}
              value={telemetry.speedInput}
              onUpdate={telemetry.setSpeedInput}
              invert
              keyBindings={{
                up: '+',
                down: '-',
              }}
            />
          </div>

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
