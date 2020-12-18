import React, { useContext } from 'react';
import classNames from 'classnames';
import { LocalSettingsContext } from '../providers/local-settings.provider';
import { SocketContext } from '../providers/socket.provider';
import { TelemetryContext } from '../providers/telemetry.provider';
import { Joystick } from './joystick';
import { MenuBar } from './menu-bar';
import { StatsOverlay } from './stats-overlay';
import { VideoContainer } from './video-container';
import { APP_MODE } from '../const/app-mode.constant';
import { WebRTCContext } from '../providers/webrtc.provider';
import { WEBRTC_STATE } from '../const/webrtc-state.constant';

export const ControllerInterface: React.FC = () => {
  const { socketConnected } = useContext(SocketContext);
  const telemetry = useContext(TelemetryContext);
  const localSettings = useContext(LocalSettingsContext);
  const { webRTCState } = useContext(WebRTCContext);

  const controlsDisabled = !socketConnected || (webRTCState !== WEBRTC_STATE.CONNECTED);

  return (
    <div className={classNames('controller-interface', { enabled: !controlsDisabled })}>

      <VideoContainer appMode={APP_MODE.CONTROLLER} />

      <MenuBar appMode={APP_MODE.CONTROLLER} />

      {localSettings.showStatsOverlay && (
        <StatsOverlay />
      )}

      <div className="controls-wrapper">
        <div className="controls left">

          {/* Pan / Tilt Joystick */}
          <div className="joystick-wrapper">
            <Joystick
              disabled={controlsDisabled}
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
              disabled={controlsDisabled}
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
