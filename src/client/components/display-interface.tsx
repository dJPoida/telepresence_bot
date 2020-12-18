import React, { useContext } from 'react';
import classNames from 'classnames';
import { SocketContext } from '../providers/socket.provider';
import { VideoContainer } from './video-container';
import { MenuBar } from './menu-bar';
import { APP_MODE } from '../const/app-mode.constant';

export const DisplayInterface: React.FC = () => {
  const { socketConnected: connected } = useContext(SocketContext);

  return (
    <div className={classNames('display-interface', { connected })}>
      <VideoContainer appMode={APP_MODE.DISPLAY} />

      <MenuBar appMode={APP_MODE.DISPLAY} />
    </div>
  );
};
