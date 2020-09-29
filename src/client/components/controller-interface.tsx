import React, { useContext } from 'react';
import { ORIENTATION } from '../const/orientation.constant';
import { TelemetryContext } from '../providers/telemetry.provider';
import { Joystick } from './joystick';
import { MenuBar } from './menu-bar';
import { Slider } from './slider';

export const ControllerInterface: React.FC = () => {
  const telemetry = useContext(TelemetryContext);

  return (
    <div className="control-panel">

      <MenuBar />

      <div className="controls-wrapper">
        <div className="controls left">

          {/* Pan / Tilt Joystick */}
          <div className="joystick-wrapper">
            <Joystick
              springBack={false}
              value={telemetry.panTiltInput}
              onUpdate={telemetry.setPanTiltInput}
            />
          </div>
        </div>
        <div className="controls right">

          {/* Speed Slider */}
          <div className="slider-wrapper">
            <Slider
              orientation={ORIENTATION.PORTRAIT}
              value={telemetry.speedInput}
              onUpdate={telemetry.setSpeedInput}
            />
          </div>

          {/* Direction Joystick */}
          <div className="joystick-wrapper">
            <Joystick
              verboseUpdate
              value={telemetry.driveInput}
              onUpdate={telemetry.setDriveInput}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
