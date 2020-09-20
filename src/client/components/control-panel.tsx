import React, { useContext } from 'react';
import { SocketContext } from '../providers/socket.provider';
import { DeadManButton } from './dead-man-button';
import { Icon } from './icon';
import { Joystick } from './joystick';

export const ControlPanel: React.FC = () => {
  const { connected } = useContext(SocketContext);

  return (
    <div className="control-panel">
      <div className="menu-bar" />

      <div className="controls-wrapper">
        <div className="controls left">
          <div className="joystick-wrapper">
            <Joystick
              springBack={false}
            />
          </div>
        </div>
        <div className="controls right">
          <div className="joystick-wrapper">
            <Joystick
              verboseUpdate
            />
          </div>
        </div>
      </div>
    </div>
  );
};
