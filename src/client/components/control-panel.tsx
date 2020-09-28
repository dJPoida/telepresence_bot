import React from 'react';
import { ORIENTATION } from '../const/orientation.constant';
import { Joystick } from './joystick';
import { MenuBar } from './menu-bar';
import { Slider } from './slider';

export const ControlPanel: React.FC = () => (
  <div className="control-panel">

    <MenuBar />

    <div className="controls-wrapper">
      <div className="controls left">
        <div className="joystick-wrapper">
          <Joystick
            springBack={false}
          />
        </div>
      </div>
      <div className="controls right">
        <div className="slider-wrapper">
          <Slider orientation={ORIENTATION.PORTRAIT} />
        </div>
        <div className="joystick-wrapper">
          <Joystick
            verboseUpdate
          />
        </div>
      </div>
    </div>
  </div>
);
